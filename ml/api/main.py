"""
CineMatch ML API — FastAPI server that serves recommendations.
Endpoints consumed by the Node.js backend.
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv
from models.recommender import HybridRecommender

load_dotenv()

app = FastAPI(title="CineMatch ML API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load model on startup ─────────────────────────────────────────────────────
MODEL_PATH = os.getenv("MODEL_PATH", "./models")
recommender: HybridRecommender | None = None

@app.on_event("startup")
def load_model():
    global recommender
    model_file = os.path.join(MODEL_PATH, "recommender.pkl")
    if os.path.exists(model_file):
        recommender = HybridRecommender.load(MODEL_PATH)
        print("✅ Recommendation model loaded.")
    else:
        print("⚠️  No trained model found. Run `python train.py` first.")


# ── Schemas ────────────────────────────────────────────────────────────────────
class RatedMovie(BaseModel):
    movieId: int
    rating: float

class PersonalRecommendRequest(BaseModel):
    userId: str
    ratings: list[RatedMovie] = []
    watchlist: list[int] = []
    genres: list[int] = []
    n: int = 20


# ── Health check ───────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": recommender is not None}


# ── Similar movies (content-based) ────────────────────────────────────────────
@app.get("/recommend/similar/{movie_id}")
def similar_movies(movie_id: int, n: int = 20):
    if not recommender:
        raise HTTPException(503, "Model not loaded. Run train.py first.")

    similar = recommender.recommend_similar(movie_id, n=n)
    return {"similar": similar, "movie_id": movie_id, "source": "content"}


# ── Personal recommendations (hybrid) ─────────────────────────────────────────
@app.post("/recommend/personal")
def personal_recommendations(req: PersonalRecommendRequest):
    if not recommender:
        raise HTTPException(503, "Model not loaded. Run train.py first.")

    rated = [{"movieId": r.movieId, "rating": r.rating} for r in req.ratings]
    recs, source = recommender.recommend_personal(
        rated_movies=rated,
        watchlist=req.watchlist,
        preferred_genres=req.genres,
        n=req.n,
    )

    return {
        "recommendations": recs,
        "source": source,
        "userId": req.userId,
        "count": len(recs),
    }
