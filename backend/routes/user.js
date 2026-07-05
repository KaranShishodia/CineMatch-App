const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getWatchlist, addToWatchlist, removeFromWatchlist,
  getRatings, rateMovie,
  updatePreferences, getProfile,
} = require('../controllers/userController');

const router = express.Router();

// All user routes require authentication
router.use(protect);

router.get('/profile', getProfile);
router.put('/preferences', updatePreferences);

router.get('/watchlist', getWatchlist);
router.post('/watchlist', addToWatchlist);
router.delete('/watchlist/:movieId', removeFromWatchlist);

router.get('/ratings', getRatings);
router.post('/rate', rateMovie);

module.exports = router;
