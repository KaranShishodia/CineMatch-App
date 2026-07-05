const tmdb = require('../services/tmdbService');

// ── GET /api/movies/trending ──────────────────────────────────────────────────
exports.getTrending = async (req, res) => {
  try {
    const data = await tmdb.getTrending(req.query.window || 'week');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trending movies.' });
  }
};

// ── GET /api/movies/popular ───────────────────────────────────────────────────
exports.getPopular = async (req, res) => {
  try {
    const data = await tmdb.getPopular(req.query.page);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch popular movies.' });
  }
};

// ── GET /api/movies/top-rated ─────────────────────────────────────────────────
exports.getTopRated = async (req, res) => {
  try {
    const data = await tmdb.getTopRated(req.query.page);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch top-rated movies.' });
  }
};

// ── GET /api/movies/search ────────────────────────────────────────────────────
exports.searchMovies = async (req, res) => {
  try {
    const { q, genre, page } = req.query;
    const data = await tmdb.searchMovies({ query: q, genre, page });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Search failed.' });
  }
};

// ── GET /api/movies/genres ────────────────────────────────────────────────────
exports.getGenres = async (req, res) => {
  try {
    const data = await tmdb.getGenres();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch genres.' });
  }
};

// ── GET /api/movies/:id ───────────────────────────────────────────────────────
exports.getMovieDetails = async (req, res) => {
  try {
    const movie = await tmdb.getMovieDetails(req.params.id);

    // If user is logged in, annotate with their watchlist/rating
    if (req.user) {
      const watchlistEntry = req.user.watchlist.find((w) => w.movieId === movie.id);
      const ratingEntry = req.user.ratings.find((r) => r.movieId === movie.id);
      movie.userWatchlisted = !!watchlistEntry;
      movie.userRating = ratingEntry?.rating || null;
    }

    res.json(movie);
  } catch (err) {
    if (err.response?.status === 404) return res.status(404).json({ error: 'Movie not found.' });
    res.status(500).json({ error: 'Failed to fetch movie details.' });
  }
};
