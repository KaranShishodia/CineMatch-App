const express = require('express');
const {
  getTrending, getPopular, getTopRated,
  getMovieDetails, searchMovies, getGenres,
} = require('../controllers/moviesController');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/trending', getTrending);
router.get('/popular', getPopular);
router.get('/top-rated', getTopRated);
router.get('/search', searchMovies);
router.get('/genres', getGenres);
router.get('/:id', optionalAuth, getMovieDetails);  // optionalAuth marks watchlist/rating status

module.exports = router;
