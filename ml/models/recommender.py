"""
CineMatch Recommendation Engine
================================
Two recommendation strategies:

1. CONTENT-BASED FILTERING
   - Builds a TF-IDF feature matrix from: genres, keywords, overview, cast, director.
   - Uses cosine similarity to find movies with the most similar content profiles.
   - Great for "more like this movie" recommendations.

2. COLLABORATIVE FILTERING
   - Builds a User × Movie rating matrix.
   - Applies Truncated SVD (matrix factorization) to learn latent user/movie factors.
   - Predicts ratings for unrated movies; returns highest predicted scores.
   - Great for personalized "you might also like" recommendations.

3. HYBRID APPROACH
   - Combines both scores: 40% content + 60% collaborative.
   - Falls back to content-only for new users (cold-start problem).
"""

import os
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.decomposition import TruncatedSVD
from sklearn.preprocessing import MinMaxScaler
import joblib
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MODEL_PATH = os.getenv("MODEL_PATH", "./models")


class ContentBasedEngine:
    """
    Recommends movies based on content similarity.
    Uses TF-IDF vectors over a "soup" of movie metadata.
    """

    def __init__(self):
        self.tfidf = TfidfVectorizer(stop_words="english", max_features=10000)
        self.cosine_sim = None
        self.movie_ids = []
        self.movie_index = {}  # movieId -> matrix row index

    def _build_soup(self, movie: dict) -> str:
        """
        Combine movie metadata into a single text string for TF-IDF.
        Repeating important features (genres, cast) gives them more weight.
        """
        parts = []

        # Genres (weighted x3 — most important signal)
        genres = [g.get("name", "") for g in movie.get("genres", [])]
        parts.extend(genres * 3)

        # Keywords
        keywords = [k.get("name", "") for k in movie.get("keywords", {}).get("keywords", [])]
        parts.extend(keywords)

        # Top 3 cast members (weighted x2)
        cast = [c.get("name", "").replace(" ", "") for c in movie.get("credits", {}).get("cast", [])[:3]]
        parts.extend(cast * 2)

        # Director
        crew = movie.get("credits", {}).get("crew", [])
        directors = [c.get("name", "").replace(" ", "") for c in crew if c.get("job") == "Director"]
        parts.extend(directors * 2)

        # Overview (plain text — TF-IDF handles tokenization)
        overview = movie.get("overview", "")
        parts.append(overview)

        return " ".join(filter(None, parts))

    def fit(self, movies: list[dict]):
        """Build the TF-IDF matrix from a list of TMDB movie objects."""
        logger.info(f"Building content-based model with {len(movies)} movies...")

        self.movie_ids = [m["id"] for m in movies]
        self.movie_index = {mid: idx for idx, mid in enumerate(self.movie_ids)}

        soups = [self._build_soup(m) for m in movies]
        tfidf_matrix = self.tfidf.fit_transform(soups)

        # Compute full cosine similarity matrix
        # Shape: (n_movies, n_movies) — each cell = similarity score 0..1
        self.cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)
        logger.info("Content-based model built successfully.")

    def recommend(self, movie_id: int, n: int = 20) -> list[int]:
        """Return top-N similar movie IDs for a given movie."""
        if movie_id not in self.movie_index:
            logger.warning(f"Movie {movie_id} not in index; returning empty.")
            return []

        idx = self.movie_index[movie_id]
        sim_scores = list(enumerate(self.cosine_sim[idx]))

        # Sort by similarity descending, skip the movie itself (score=1.0)
        sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)[1:n+1]
        return [self.movie_ids[i] for i, _ in sim_scores]

    def get_scores(self, movie_id: int) -> dict[int, float]:
        """Return {movie_id: similarity_score} for all movies."""
        if movie_id not in self.movie_index:
            return {}
        idx = self.movie_index[movie_id]
        return {self.movie_ids[i]: float(score) for i, score in enumerate(self.cosine_sim[idx])}

    def save(self, path: str):
        joblib.dump(self, path)

    @classmethod
    def load(cls, path: str):
        return joblib.load(path)


class CollaborativeFilteringEngine:
    """
    Matrix factorization using Truncated SVD.

    The rating matrix R (users × movies) is decomposed into:
      R ≈ U × Σ × Vt
    where U = user latent factors, V = movie latent factors.
    Predicted rating = dot(user_vector, movie_vector).
    """

    def __init__(self, n_components: int = 50):
        self.svd = TruncatedSVD(n_components=n_components, random_state=42)
        self.scaler = MinMaxScaler()
        self.user_factors = None     # shape: (n_users, n_components)
        self.movie_factors = None    # shape: (n_movies, n_components)
        self.movie_ids = []
        self.movie_index = {}
        self.user_ids = []

    def fit(self, ratings_df: pd.DataFrame):
        """
        Train on a DataFrame with columns: [userId, movieId, rating].
        Builds the rating matrix and decomposes it via SVD.
        """
        logger.info(f"Training collaborative model on {len(ratings_df)} ratings...")

        # Build user-item pivot matrix; fill missing with 0 (unrated)
        pivot = ratings_df.pivot_table(index="userId", columns="movieId", values="rating", fill_value=0)

        self.user_ids = list(pivot.index)
        self.movie_ids = list(pivot.columns)
        self.movie_index = {mid: idx for idx, mid in enumerate(self.movie_ids)}

        # Decompose — n_components must be <= min(n_users, n_movies)
        R = pivot.values.astype(float)
        safe_k = min(self.svd.n_components, R.shape[0] - 1, R.shape[1] - 1)
        safe_k = max(safe_k, 1)  # at least 1 component
        if safe_k != self.svd.n_components:
            logger.info(f"Clamping SVD n_components {self.svd.n_components} → {safe_k} (small dataset)")
            self.svd.set_params(n_components=safe_k)

        self.user_factors = self.svd.fit_transform(R)            # (users, k)
        self.movie_factors = self.svd.components_.T               # (movies, k)

        logger.info(f"Collaborative model trained. Variance explained: {self.svd.explained_variance_ratio_.sum():.2%}")

    def predict_for_user(self, user_vector: np.ndarray) -> dict[int, float]:
        """
        Predict scores for all movies given a user's latent factor vector.
        Returns {movieId: predicted_score}.
        """
        scores = user_vector @ self.movie_factors.T   # dot product
        return {self.movie_ids[i]: float(scores[i]) for i in range(len(self.movie_ids))}

    def get_user_vector(self, rated_movies: list[dict]) -> np.ndarray:
        """
        Estimate a user's latent factor vector from their explicit ratings.
        Uses weighted average of movie latent factors as a proxy.
        """
        vectors, weights = [], []
        for r in rated_movies:
            mid = r["movieId"]
            if mid in self.movie_index:
                idx = self.movie_index[mid]
                vectors.append(self.movie_factors[idx])
                weights.append(r["rating"])  # higher-rated = more weight

        if not vectors:
            return np.zeros(self.svd.n_components)

        weights = np.array(weights) / sum(weights)
        return np.average(vectors, axis=0, weights=weights)

    def recommend(self, rated_movies: list[dict], exclude_ids: set, n: int = 20) -> list[int]:
        """Return top-N movie IDs for a user defined by their ratings."""
        user_vec = self.get_user_vector(rated_movies)
        scores = self.predict_for_user(user_vec)

        # Exclude already-rated/watchlisted movies
        filtered = {mid: s for mid, s in scores.items() if mid not in exclude_ids}
        sorted_movies = sorted(filtered.items(), key=lambda x: x[1], reverse=True)
        return [mid for mid, _ in sorted_movies[:n]]

    def save(self, path: str):
        joblib.dump(self, path)

    @classmethod
    def load(cls, path: str):
        return joblib.load(path)


class HybridRecommender:
    """
    Combines content-based + collaborative filtering.
    Weighted hybrid: final = α × content + (1-α) × collaborative
    """

    def __init__(self, content_weight: float = 0.4):
        self.content_engine = ContentBasedEngine()
        self.collab_engine = CollaborativeFilteringEngine()
        self.content_weight = content_weight
        self.collab_weight = 1 - content_weight

    def fit(self, movies: list[dict], ratings_df: pd.DataFrame = None):
        self.content_engine.fit(movies)
        if ratings_df is not None and len(ratings_df) > 0:
            self.collab_engine.fit(ratings_df)

    def recommend_similar(self, movie_id: int, n: int = 20) -> list[int]:
        """Content-based: movies similar to movie_id."""
        return self.content_engine.recommend(movie_id, n)

    def recommend_personal(
        self,
        rated_movies: list[dict],
        watchlist: list[int],
        preferred_genres: list[int],
        n: int = 20,
    ) -> tuple[list[int], str]:
        """
        Personalized recommendations for a user.
        Returns (movie_ids, source) where source describes which engine was used.
        """
        exclude = {r["movieId"] for r in rated_movies} | set(watchlist)

        if not rated_movies:
            # Cold-start: genre-preference fallback (no user data yet)
            return [], "cold_start"

        has_collab = (self.collab_engine.user_factors is not None
                      and len(self.collab_engine.movie_ids) > 0)

        if not has_collab:
            # Only content-based: average across user's liked movies
            rec_sets = [
                self.content_engine.get_scores(r["movieId"])
                for r in rated_movies if r["rating"] >= 3.5
            ]
            if not rec_sets:
                rec_sets = [self.content_engine.get_scores(r["movieId"]) for r in rated_movies]

            agg: dict[int, float] = {}
            for scores in rec_sets:
                for mid, s in scores.items():
                    agg[mid] = agg.get(mid, 0) + s

            filtered = {mid: s for mid, s in agg.items() if mid not in exclude}
            sorted_ids = sorted(filtered, key=filtered.get, reverse=True)
            return sorted_ids[:n], "content"

        # Hybrid: combine content + collaborative scores
        # Content scores (average over liked movies)
        content_agg: dict[int, float] = {}
        for r in rated_movies:
            for mid, s in self.content_engine.get_scores(r["movieId"]).items():
                content_agg[mid] = content_agg.get(mid, 0) + s * (r["rating"] / 5.0)

        # Collaborative scores
        user_vec = self.collab_engine.get_user_vector(rated_movies)
        collab_scores = self.collab_engine.predict_for_user(user_vec)

        # Normalize both to [0, 1]
        def normalize(d: dict) -> dict:
            if not d:
                return d
            vals = list(d.values())
            mn, mx = min(vals), max(vals)
            if mx == mn:
                return {k: 0.5 for k in d}
            return {k: (v - mn) / (mx - mn) for k, v in d.items()}

        c_norm = normalize(content_agg)
        cf_norm = normalize(collab_scores)

        all_ids = set(c_norm) | set(cf_norm)
        hybrid: dict[int, float] = {}
        for mid in all_ids:
            if mid in exclude:
                continue
            c = c_norm.get(mid, 0)
            cf = cf_norm.get(mid, 0)
            hybrid[mid] = self.content_weight * c + self.collab_weight * cf

        sorted_ids = sorted(hybrid, key=hybrid.get, reverse=True)
        return sorted_ids[:n], "hybrid"

    def save(self, path: str):
        os.makedirs(path, exist_ok=True)
        joblib.dump(self, os.path.join(path, "recommender.pkl"))
        logger.info(f"Model saved to {path}/recommender.pkl")

    @classmethod
    def load(cls, path: str):
        return joblib.load(os.path.join(path, "recommender.pkl"))
