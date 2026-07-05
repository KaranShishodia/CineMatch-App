"""
train.py — Build and save the CineMatch recommendation model.

Run this once before starting the ML API server:
    python train.py

It fetches popular TMDB movies, trains both engines, and saves the model to ./models/
"""

import os
import sys
import json
import time
import requests
import pandas as pd
from dotenv import load_dotenv

# Add parent dir to path
sys.path.insert(0, os.path.dirname(__file__))
from models.recommender import HybridRecommender

load_dotenv()

TMDB_API_KEY = os.getenv("TMDB_API_KEY")
TMDB_BASE = "https://api.themoviedb.org/3"
MODEL_PATH = os.getenv("MODEL_PATH", "./models")


def fetch_tmdb(endpoint: str, params: dict = {}) -> dict:
    """Fetch from TMDB with retry logic."""
    for attempt in range(3):
        try:
            r = requests.get(
                f"{TMDB_BASE}{endpoint}",
                params={"api_key": TMDB_API_KEY, **params},
                timeout=10,
            )
            r.raise_for_status()
            return r.json()
        except Exception as e:
            if attempt == 2:
                raise
            time.sleep(2 ** attempt)


def fetch_movie_details(movie_id: int) -> dict | None:
    """Fetch full movie details including credits, keywords."""
    try:
        data = fetch_tmdb(f"/movie/{movie_id}", {
            "append_to_response": "credits,keywords",
        })
        return data
    except Exception:
        return None


def collect_movies(pages: int = 20) -> list[dict]:
    """
    Collect movie data from TMDB popular + top-rated lists.
    pages=20 gives ~400 movies per list = ~800 total (deduplicated).
    """
    print(f"📥 Collecting movies from TMDB ({pages} pages)...")
    seen_ids = set()
    movies = []

    for endpoint in ["/movie/popular", "/movie/top_rated"]:
        for page in range(1, pages + 1):
            try:
                data = fetch_tmdb(endpoint, {"page": page})
                for m in data.get("results", []):
                    if m["id"] not in seen_ids:
                        seen_ids.add(m["id"])
                        movies.append(m)
                time.sleep(0.25)  # Respect TMDB rate limits
            except Exception as e:
                print(f"  ⚠️  Page {page} failed: {e}")

    print(f"  Found {len(movies)} unique movies. Fetching details...")

    # Enrich with credits + keywords (needed for content-based model)
    detailed = []
    for i, m in enumerate(movies):
        if i % 50 == 0:
            print(f"  Fetching details: {i}/{len(movies)}")
        detail = fetch_movie_details(m["id"])
        if detail:
            detailed.append(detail)
        time.sleep(0.1)

    print(f"✅ Collected {len(detailed)} movies with full details.")
    return detailed


def build_sample_ratings(movies: list[dict]) -> pd.DataFrame:
    """
    Generate synthetic ratings to bootstrap collaborative filtering.
    In production, this would be replaced with real user ratings from MongoDB.

    Strategy: simulate 500 users with genre preferences rating ~50 movies each.
    """
    print("🔧 Building synthetic ratings for collaborative filtering bootstrap...")
    import random
    import numpy as np

    random.seed(42)
    np.random.seed(42)

    n_users = 500
    all_genres = list(set(
        g["id"] for m in movies for g in m.get("genres", [])
    ))

    records = []
    for user_id in range(n_users):
        # Each simulated user prefers 2-3 genres
        preferred = random.sample(all_genres, min(3, len(all_genres)))

        for movie in movies:
            movie_genres = [g["id"] for g in movie.get("genres", [])]
            overlap = len(set(preferred) & set(movie_genres))

            # Rate ~30% of movies, higher probability if genre matches
            rate_prob = 0.1 + 0.15 * overlap
            if random.random() < rate_prob:
                base = movie.get("vote_average", 5) / 2  # 0-5 scale
                # Add noise and genre preference boost
                rating = np.clip(
                    base + (0.5 * overlap) + np.random.normal(0, 0.5),
                    0.5, 5.0
                )
                records.append({
                    "userId": f"synthetic_{user_id}",
                    "movieId": movie["id"],
                    "rating": round(rating * 2) / 2,  # round to nearest 0.5
                })

    df = pd.DataFrame(records)
    print(f"  Generated {len(df)} synthetic ratings for {n_users} users.")
    return df


def main():
    if not TMDB_API_KEY:
        print("❌ TMDB_API_KEY not set in environment. Please add it to ml/.env")
        sys.exit(1)

    os.makedirs(MODEL_PATH, exist_ok=True)

    # Step 1: Collect movie data
    movies = collect_movies(pages=10)  # 10 pages = ~200 movies (quick training)

    # Save movies list for reference
    with open(os.path.join(MODEL_PATH, "movies.json"), "w") as f:
        json.dump([{"id": m["id"], "title": m.get("title")} for m in movies], f)

    # Step 2: Build ratings (synthetic bootstrap; replace with real data in production)
    ratings_df = build_sample_ratings(movies)

    # Step 3: Train the hybrid recommender
    print("\n🧠 Training recommendation models...")
    recommender = HybridRecommender(content_weight=0.4)
    recommender.fit(movies, ratings_df)

    # Step 4: Save model
    recommender.save(MODEL_PATH)
    print(f"\n🎉 Training complete! Model saved to {MODEL_PATH}/recommender.pkl")
    print("   Start the API with: uvicorn api.main:app --reload --port 8000")


if __name__ == "__main__":
    main()
