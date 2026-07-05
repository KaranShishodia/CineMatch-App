# 🎬 CineMatch — AI-Powered Movie Recommendation System

A full-stack, production-ready movie recommendation platform with content-based & collaborative filtering, JWT auth, watchlists, ratings, and a beautiful dark-mode UI.

<img width="868" height="432" alt="Screenshot 2026-07-05 133834" src="https://github.com/user-attachments/assets/476e3ab3-9577-4d12-9fd0-d53f95e354b0" />

---

## 🏗️ Architecture Overview

```
movie-reco/
├── frontend/          # React.js + Tailwind CSS
├── backend/           # Node.js + Express + MongoDB
└── ml/                # Python recommendation engine (FastAPI)
```

---

## ⚙️ Prerequisites

- Node.js >= 18
- Python >= 3.9
- MongoDB (local or Atlas)
- TMDB API key → https://www.themoviedb.org/settings/api

---

## 🚀 Quick Start

### 1. Clone & install

```bash
git clone <repo-url>
cd movie-reco
```

### 2. Backend setup

```bash
cd backend
cp .env.example .env        # fill in your values
npm install
npm run dev                 # starts on :5000
```

### 3. ML engine setup

```bash
cd ml
pip install -r requirements.txt
python train.py             # builds recommendation model
uvicorn api.main:app --reload --port 8000
```

### 4. Frontend setup

```bash
cd frontend
cp .env.example .env        # fill in your values
npm install
npm run dev                 # starts on :3000
```

---

## 🔑 Environment Variables

### backend/.env
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/cinematch
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
TMDB_API_KEY=your_tmdb_api_key
TMDB_BASE_URL=https://api.themoviedb.org/3
ML_SERVICE_URL=http://localhost:8000
REDIS_URL=redis://localhost:6379   # optional
```

### frontend/.env
```
VITE_API_URL=http://localhost:5000/api
VITE_TMDB_IMAGE_BASE=https://image.tmdb.org/t/p
```

### ml/.env
```
TMDB_API_KEY=your_tmdb_api_key
MODEL_PATH=./models/recommender.pkl
```

---

## 📡 API Documentation

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user (auth) |
| POST | `/api/auth/logout` | Logout |

### Movies
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/movies/trending` | Trending movies |
| GET | `/api/movies/popular` | Popular movies |
| GET | `/api/movies/top-rated` | Top-rated movies |
| GET | `/api/movies/search?q=&genre=&page=` | Search movies |
| GET | `/api/movies/:id` | Movie details |
| GET | `/api/movies/genres` | All genres |

### User Actions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/user/rate` | Rate a movie |
| POST | `/api/user/watchlist` | Add to watchlist |
| DELETE | `/api/user/watchlist/:id` | Remove from watchlist |
| GET | `/api/user/watchlist` | Get watchlist |
| GET | `/api/user/ratings` | Get user ratings |
| PUT | `/api/user/preferences` | Update preferences |

### Recommendations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/recommendations/personal` | Personalized recs (auth) |
| GET | `/api/recommendations/similar/:movieId` | Similar movies |

---

## 🧠 Recommendation Engine

### Content-Based Filtering
Builds a TF-IDF matrix from movie metadata (genres, keywords, overview, cast, director). Computes **cosine similarity** between movies to find similar content.

### Collaborative Filtering
Uses a **User-Item rating matrix** with **Singular Value Decomposition (SVD)** via `scikit-learn`'s TruncatedSVD to decompose ratings into latent factors. Predicts unrated movie scores per user.

### Hybrid Scoring
```
final_score = (0.4 × content_score) + (0.6 × collaborative_score)
```
Falls back to content-based for new users (cold-start problem).

---

## 🎨 UI Features
- Dark/Light mode toggle (persisted in localStorage)
- Responsive grid layouts
- Skeleton loading states
- Infinite scroll / pagination
- Movie detail modal with trailer embed
- Star rating widget
- Watchlist heart toggle

---

## 🚢 Deployment

### Frontend → Vercel
```bash
cd frontend && vercel deploy
```

### Backend → Render
- Connect GitHub repo, set root to `backend/`
- Add environment variables in Render dashboard

### ML API → Render (Docker)
```bash
cd ml && docker build -t cinematch-ml .
# Push to Docker Hub, deploy on Render as Docker service
```
