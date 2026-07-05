/**
 * TMDB Service
 * All TMDB API interactions go through here.
 * Results are cached in Redis (if available) for 10 minutes.
 */

const axios = require('axios');

const BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const API_KEY = process.env.TMDB_API_KEY;

// Optional Redis cache
let redisClient = null;
try {
  if (process.env.REDIS_URL) {
    const { createClient } = require('redis');
    redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.connect().catch(() => { redisClient = null; });
  }
} catch (_) { /* Redis is optional */ }

const CACHE_TTL = 600; // 10 minutes

/** Get from cache or fetch from TMDB */
const cachedFetch = async (url, params = {}) => {
  const cacheKey = `tmdb:${url}:${JSON.stringify(params)}`;

  // Try cache first
  if (redisClient?.isOpen) {
    const cached = await redisClient.get(cacheKey).catch(() => null);
    if (cached) return JSON.parse(cached);
  }

  // Fetch from TMDB
  const response = await axios.get(`${BASE_URL}${url}`, {
    params: { api_key: API_KEY, ...params },
    timeout: 8000,
  });

  const data = response.data;

  // Store in cache
  if (redisClient?.isOpen) {
    redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(data)).catch(() => {});
  }

  return data;
};

module.exports = {
  getTrending: (timeWindow = 'week') =>
    cachedFetch(`/trending/movie/${timeWindow}`),

  getPopular: (page = 1) =>
    cachedFetch('/movie/popular', { page }),

  getTopRated: (page = 1) =>
    cachedFetch('/movie/top_rated', { page }),

  getMovieDetails: (movieId) =>
    cachedFetch(`/movie/${movieId}`, {
      append_to_response: 'credits,videos,similar,keywords',
    }),

  searchMovies: ({ query, genre, page = 1, language = 'en-US' }) => {
    if (query) {
      return cachedFetch('/search/movie', { query, page, language });
    }
    // Genre-only browse
    return cachedFetch('/discover/movie', {
      with_genres: genre,
      page,
      language,
      sort_by: 'popularity.desc',
    });
  },

  getGenres: () =>
    cachedFetch('/genre/movie/list'),

  getMoviesByIds: async (ids) => {
    const results = await Promise.allSettled(
      ids.map((id) => cachedFetch(`/movie/${id}`))
    );
    return results
      .filter((r) => r.status === 'fulfilled')
      .map((r) => r.value);
  },
};
