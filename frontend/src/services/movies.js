import api from './api'

export const TMDB_IMG = 'https://image.tmdb.org/t/p'

export const getPosterUrl = (path, size = 'w500') =>
  path ? `${TMDB_IMG}/${size}${path}` : '/placeholder-poster.jpg'

export const getBackdropUrl = (path, size = 'original') =>
  path ? `${TMDB_IMG}/${size}${path}` : null

export const moviesService = {
  getTrending: () => api.get('/movies/trending'),
  getPopular: (page = 1) => api.get('/movies/popular', { params: { page } }),
  getTopRated: (page = 1) => api.get('/movies/top-rated', { params: { page } }),
  search: (params) => api.get('/movies/search', { params }),
  getDetails: (id) => api.get(`/movies/${id}`),
  getGenres: () => api.get('/movies/genres'),

  // Recommendations
  getPersonalRecs: () => api.get('/recommendations/personal'),
  getSimilar: (movieId) => api.get(`/recommendations/similar/${movieId}`),

  // User actions
  getWatchlist: () => api.get('/user/watchlist'),
  addToWatchlist: (movieId) => api.post('/user/watchlist', { movieId }),
  removeFromWatchlist: (movieId) => api.delete(`/user/watchlist/${movieId}`),
  rateMovie: (movieId, rating) => api.post('/user/rate', { movieId, rating }),
  getRatings: () => api.get('/user/ratings'),
  updatePreferences: (prefs) => api.put('/user/preferences', prefs),
}
