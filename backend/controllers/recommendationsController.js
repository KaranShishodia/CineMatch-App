const axios = require('axios');
const tmdb = require('../services/tmdbService');

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

/**
 * Fetch personalized recommendations from the ML service,
 * then hydrate with full TMDB movie data.
 */
exports.getPersonalRecommendations = async (req, res) => {
  try {
    const user = req.user;
    const ratedMovies = user.ratings.map((r) => ({ movieId: r.movieId, rating: r.rating }));
    const watchlist = user.watchlist.map((w) => w.movieId);
    const genres = user.preferences?.favoriteGenres || [];

    // Call ML service with user context
    const mlResponse = await axios.post(`${ML_URL}/recommend/personal`, {
      userId: user._id.toString(),
      ratings: ratedMovies,
      watchlist,
      genres,
    }, { timeout: 10000 });

    const movieIds = mlResponse.data.recommendations || [];

    // Hydrate with TMDB data
    const movies = await tmdb.getMoviesByIds(movieIds);

    // Filter out already-rated movies (show fresh recommendations)
    const ratedIds = new Set(ratedMovies.map((r) => r.movieId));
    const fresh = movies.filter((m) => !ratedIds.has(m.id));

    res.json({ recommendations: fresh, source: mlResponse.data.source });
  } catch (err) {
    console.error('ML service error:', err.message);
    // Fallback: return popular movies from user's preferred genres
    try {
      const genre = req.user.preferences?.favoriteGenres?.[0];
      const data = await tmdb.getPopular(1);
      res.json({ recommendations: data.results.slice(0, 20), source: 'fallback' });
    } catch (fallbackErr) {
      res.status(500).json({ error: 'Recommendation service temporarily unavailable.' });
    }
  }
};

/**
 * Get movies similar to a given movie using content-based filtering.
 */
exports.getSimilarMovies = async (req, res) => {
  try {
    const { movieId } = req.params;

    const mlResponse = await axios.get(`${ML_URL}/recommend/similar/${movieId}`, {
      timeout: 8000,
    });
    const movieIds = mlResponse.data.similar || [];

    const movies = await tmdb.getMoviesByIds(movieIds);
    res.json({ similar: movies });
  } catch (err) {
    // Fallback: use TMDB's own similar endpoint
    try {
      const data = await tmdb.getMovieDetails(req.params.movieId);
      res.json({ similar: data.similar?.results || [], source: 'tmdb_fallback' });
    } catch (_) {
      res.status(500).json({ error: 'Failed to fetch similar movies.' });
    }
  }
};
