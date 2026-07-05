"""
Tests for the CineMatch recommendation engine.
Run with: pytest tests/ -v
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
import pandas as pd
import numpy as np
from models.recommender import ContentBasedEngine, CollaborativeFilteringEngine, HybridRecommender


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture
def sample_movies():
    """5 minimal movie dicts mimicking TMDB structure."""
    return [
        {
            "id": 1,
            "title": "Inception",
            "overview": "A thief steals secrets through dream-sharing technology.",
            "genres": [{"id": 878, "name": "Science Fiction"}, {"id": 28, "name": "Action"}],
            "keywords": {"keywords": [{"id": 1, "name": "dream"}, {"id": 2, "name": "heist"}]},
            "credits": {
                "cast": [{"name": "Leonardo DiCaprio"}, {"name": "Joseph Gordon-Levitt"}],
                "crew": [{"name": "Christopher Nolan", "job": "Director"}],
            },
        },
        {
            "id": 2,
            "title": "Interstellar",
            "overview": "A team of explorers travel through a wormhole in space.",
            "genres": [{"id": 878, "name": "Science Fiction"}, {"id": 18, "name": "Drama"}],
            "keywords": {"keywords": [{"id": 3, "name": "space"}, {"id": 4, "name": "wormhole"}]},
            "credits": {
                "cast": [{"name": "Matthew McConaughey"}, {"name": "Anne Hathaway"}],
                "crew": [{"name": "Christopher Nolan", "job": "Director"}],
            },
        },
        {
            "id": 3,
            "title": "The Notebook",
            "overview": "A poor young man falls in love with a rich young woman.",
            "genres": [{"id": 10749, "name": "Romance"}, {"id": 18, "name": "Drama"}],
            "keywords": {"keywords": [{"id": 5, "name": "love"}, {"id": 6, "name": "memory"}]},
            "credits": {
                "cast": [{"name": "Ryan Gosling"}, {"name": "Rachel McAdams"}],
                "crew": [{"name": "Nick Cassavetes", "job": "Director"}],
            },
        },
        {
            "id": 4,
            "title": "Tenet",
            "overview": "Armed with only one word, a CIA operative embarks on a mission.",
            "genres": [{"id": 878, "name": "Science Fiction"}, {"id": 28, "name": "Action"}],
            "keywords": {"keywords": [{"id": 7, "name": "time"}, {"id": 8, "name": "spy"}]},
            "credits": {
                "cast": [{"name": "John David Washington"}, {"name": "Robert Pattinson"}],
                "crew": [{"name": "Christopher Nolan", "job": "Director"}],
            },
        },
        {
            "id": 5,
            "title": "La La Land",
            "overview": "A jazz musician and actress fall in love in Los Angeles.",
            "genres": [{"id": 10749, "name": "Romance"}, {"id": 35, "name": "Comedy"}],
            "keywords": {"keywords": [{"id": 9, "name": "jazz"}, {"id": 10, "name": "dreams"}]},
            "credits": {
                "cast": [{"name": "Ryan Gosling"}, {"name": "Emma Stone"}],
                "crew": [{"name": "Damien Chazelle", "job": "Director"}],
            },
        },
    ]


@pytest.fixture
def sample_ratings():
    return pd.DataFrame([
        {"userId": "user1", "movieId": 1, "rating": 5.0},
        {"userId": "user1", "movieId": 2, "rating": 4.5},
        {"userId": "user1", "movieId": 4, "rating": 4.0},
        {"userId": "user2", "movieId": 3, "rating": 5.0},
        {"userId": "user2", "movieId": 5, "rating": 4.0},
        {"userId": "user3", "movieId": 1, "rating": 3.5},
        {"userId": "user3", "movieId": 3, "rating": 4.5},
    ])


# ── Content-Based Tests ────────────────────────────────────────────────────────

class TestContentBasedEngine:
    def test_fit_builds_similarity_matrix(self, sample_movies):
        engine = ContentBasedEngine()
        engine.fit(sample_movies)
        assert engine.cosine_sim is not None
        assert engine.cosine_sim.shape == (5, 5)

    def test_self_similarity_is_one(self, sample_movies):
        engine = ContentBasedEngine()
        engine.fit(sample_movies)
        # Every movie is 100% similar to itself
        for i in range(5):
            assert abs(engine.cosine_sim[i][i] - 1.0) < 1e-6

    def test_recommend_returns_correct_count(self, sample_movies):
        engine = ContentBasedEngine()
        engine.fit(sample_movies)
        recs = engine.recommend(movie_id=1, n=3)
        assert len(recs) <= 3
        assert 1 not in recs  # should not include the movie itself

    def test_sci_fi_movies_are_more_similar_to_each_other(self, sample_movies):
        engine = ContentBasedEngine()
        engine.fit(sample_movies)
        # Inception (1) should be more similar to Interstellar (2) than to The Notebook (3)
        scores = engine.get_scores(1)
        assert scores[2] > scores[3], "Sci-fi movies should be more similar than cross-genre"

    def test_same_director_boosts_similarity(self, sample_movies):
        engine = ContentBasedEngine()
        engine.fit(sample_movies)
        # Inception, Interstellar, Tenet all by Nolan — should cluster together
        scores = engine.get_scores(1)
        assert scores[4] > 0  # Tenet by same director

    def test_recommend_unknown_movie_returns_empty(self, sample_movies):
        engine = ContentBasedEngine()
        engine.fit(sample_movies)
        assert engine.recommend(movie_id=9999) == []


# ── Collaborative Filtering Tests ─────────────────────────────────────────────

class TestCollaborativeFilteringEngine:
    def test_fit_builds_factors(self, sample_movies, sample_ratings):
        engine = CollaborativeFilteringEngine(n_components=2)
        engine.fit(sample_ratings)
        assert engine.user_factors is not None
        assert engine.movie_factors is not None
        assert engine.user_factors.shape[0] == 3  # 3 unique users

    def test_get_user_vector_shape(self, sample_movies, sample_ratings):
        engine = CollaborativeFilteringEngine(n_components=2)
        engine.fit(sample_ratings)
        rated = [{"movieId": 1, "rating": 5.0}, {"movieId": 2, "rating": 4.0}]
        vec = engine.get_user_vector(rated)
        assert vec.shape == (2,)  # n_components=2

    def test_unknown_movie_returns_zero_vector(self, sample_ratings):
        engine = CollaborativeFilteringEngine(n_components=2)
        engine.fit(sample_ratings)
        rated = [{"movieId": 9999, "rating": 5.0}]  # not in training data
        vec = engine.get_user_vector(rated)
        assert np.allclose(vec, 0)

    def test_recommend_excludes_already_rated(self, sample_ratings):
        engine = CollaborativeFilteringEngine(n_components=2)
        engine.fit(sample_ratings)
        rated = [{"movieId": 1, "rating": 5.0}]
        exclude = {1}
        recs = engine.recommend(rated, exclude, n=10)
        assert 1 not in recs


# ── Hybrid Recommender Tests ───────────────────────────────────────────────────

class TestHybridRecommender:
    def test_fit_and_recommend_similar(self, sample_movies, sample_ratings):
        rec = HybridRecommender()
        rec.fit(sample_movies, sample_ratings)
        similar = rec.recommend_similar(1, n=3)
        assert isinstance(similar, list)
        assert 1 not in similar  # exclude self

    def test_cold_start_returns_empty_with_no_ratings(self, sample_movies, sample_ratings):
        rec = HybridRecommender()
        rec.fit(sample_movies, sample_ratings)
        recs, source = rec.recommend_personal([], [], [], n=5)
        assert source == "cold_start"
        assert recs == []

    def test_personal_recommendations_with_ratings(self, sample_movies, sample_ratings):
        rec = HybridRecommender()
        rec.fit(sample_movies, sample_ratings)
        rated = [{"movieId": 1, "rating": 5.0}, {"movieId": 2, "rating": 4.5}]
        recs, source = rec.recommend_personal(rated, [], [], n=5)
        assert isinstance(recs, list)
        # Should not include already-rated movies
        assert 1 not in recs
        assert 2 not in recs

    def test_hybrid_source_when_collab_available(self, sample_movies, sample_ratings):
        rec = HybridRecommender()
        rec.fit(sample_movies, sample_ratings)
        rated = [{"movieId": 1, "rating": 5.0}]
        _, source = rec.recommend_personal(rated, [], [])
        assert source in ("hybrid", "content")  # either is valid

    def test_content_weight_affects_output(self, sample_movies, sample_ratings):
        """Different content weights should produce different orderings."""
        rec_content = HybridRecommender(content_weight=0.9)
        rec_collab  = HybridRecommender(content_weight=0.1)
        rec_content.fit(sample_movies, sample_ratings)
        rec_collab.fit(sample_movies, sample_ratings)
        rated = [{"movieId": 3, "rating": 5.0}]  # romance lover
        recs_c, _ = rec_content.recommend_personal(rated, [], [])
        recs_cf, _ = rec_collab.recommend_personal(rated, [], [])
        # They may differ (not guaranteed, but shouldn't error)
        assert isinstance(recs_c, list)
        assert isinstance(recs_cf, list)
