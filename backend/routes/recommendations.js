const express = require('express');
const { protect, optionalAuth } = require('../middleware/auth');
const { getPersonalRecommendations, getSimilarMovies } = require('../controllers/recommendationsController');

const router = express.Router();

// Personal recommendations require auth; similar movies are public
router.get('/personal', protect, getPersonalRecommendations);
router.get('/similar/:movieId', optionalAuth, getSimilarMovies);

module.exports = router;
