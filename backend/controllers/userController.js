const User = require('../models/User');
const tmdb = require('../services/tmdbService');

// ── GET /api/user/profile ─────────────────────────────────────────────────────
exports.getProfile = async (req, res) => {
  res.json({ user: req.user });
};

// ── PUT /api/user/preferences ─────────────────────────────────────────────────
exports.updatePreferences = async (req, res) => {
  try {
    const { favoriteGenres, favoriteActors, language, theme } = req.body;
    const update = {};
    if (favoriteGenres !== undefined) update['preferences.favoriteGenres'] = favoriteGenres;
    if (favoriteActors !== undefined) update['preferences.favoriteActors'] = favoriteActors;
    if (language) update['preferences.language'] = language;
    if (theme) update['preferences.theme'] = theme;

    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true });
    res.json({ preferences: user.preferences });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update preferences.' });
  }
};

// ── GET /api/user/watchlist ───────────────────────────────────────────────────
exports.getWatchlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('watchlist');
    const movieIds = user.watchlist.map((w) => w.movieId);

    // Fetch movie details from TMDB in parallel
    const movies = await tmdb.getMoviesByIds(movieIds);
    res.json({ watchlist: movies, total: movies.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch watchlist.' });
  }
};

// ── POST /api/user/watchlist ──────────────────────────────────────────────────
exports.addToWatchlist = async (req, res) => {
  try {
    const { movieId } = req.body;
    if (!movieId) return res.status(400).json({ error: 'movieId is required.' });

    const user = await User.findById(req.user._id);
    const alreadyAdded = user.watchlist.some((w) => w.movieId === Number(movieId));
    if (alreadyAdded) return res.status(409).json({ error: 'Movie already in watchlist.' });

    user.watchlist.push({ movieId: Number(movieId) });
    await user.save();

    res.json({ message: 'Added to watchlist.', watchlistCount: user.watchlist.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add to watchlist.' });
  }
};

// ── DELETE /api/user/watchlist/:movieId ───────────────────────────────────────
exports.removeFromWatchlist = async (req, res) => {
  try {
    const movieId = Number(req.params.movieId);
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { watchlist: { movieId } },
    });
    res.json({ message: 'Removed from watchlist.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove from watchlist.' });
  }
};

// ── GET /api/user/ratings ─────────────────────────────────────────────────────
exports.getRatings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('ratings');
    res.json({ ratings: user.ratings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch ratings.' });
  }
};

// ── POST /api/user/rate ───────────────────────────────────────────────────────
exports.rateMovie = async (req, res) => {
  try {
    const { movieId, rating } = req.body;
    if (!movieId || rating === undefined) {
      return res.status(400).json({ error: 'movieId and rating are required.' });
    }
    if (rating < 0.5 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 0.5 and 5.' });
    }

    const user = await User.findById(req.user._id);
    const existingIdx = user.ratings.findIndex((r) => r.movieId === Number(movieId));

    if (existingIdx >= 0) {
      // Update existing rating
      user.ratings[existingIdx].rating = rating;
      user.ratings[existingIdx].ratedAt = new Date();
    } else {
      // Add new rating
      user.ratings.push({ movieId: Number(movieId), rating });
    }

    await user.save();
    res.json({ message: 'Rating saved.', movieId, rating });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save rating.' });
  }
};
