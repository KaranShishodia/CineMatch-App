import { useState, useEffect, useCallback } from 'react'
import { moviesService } from '../services/movies'

/** Generic fetch hook with loading/error state */
export function useFetch(fetchFn, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const execute = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchFn()
      setData(res.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, deps)

  useEffect(() => { execute() }, [execute])

  return { data, loading, error, refetch: execute }
}

/** Trending movies */
export function useTrending() {
  return useFetch(() => moviesService.getTrending(), [])
}

/** Popular movies with pagination */
export function usePopular(initialPage = 1) {
  const [page, setPage] = useState(initialPage)
  const result = useFetch(() => moviesService.getPopular(page), [page])
  return { ...result, page, setPage }
}

/** Top-rated movies */
export function useTopRated(initialPage = 1) {
  const [page, setPage] = useState(initialPage)
  const result = useFetch(() => moviesService.getTopRated(page), [page])
  return { ...result, page, setPage }
}

/** Movie search */
export function useSearch() {
  const [query, setQuery] = useState('')
  const [genre, setGenre] = useState('')
  const [page, setPage] = useState(1)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const search = useCallback(async (q = query, g = genre, p = 1) => {
    if (!q && !g) return
    setLoading(true)
    setError(null)
    setPage(p)
    try {
      const res = await moviesService.search({ q, genre: g, page: p })
      setResults(res.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Search failed')
    } finally {
      setLoading(false)
    }
  }, [query, genre])

  return { query, setQuery, genre, setGenre, page, setPage, results, loading, error, search }
}

/** Watchlist management */
export function useWatchlist() {
  const [watchlist, setWatchlist] = useState([])
  const [watchlistIds, setWatchlistIds] = useState(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    moviesService.getWatchlist()
      .then(res => {
        setWatchlist(res.data.watchlist)
        setWatchlistIds(new Set(res.data.watchlist.map(m => m.id)))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const toggle = useCallback(async (movieId) => {
    if (watchlistIds.has(movieId)) {
      await moviesService.removeFromWatchlist(movieId)
      setWatchlistIds(prev => { const s = new Set(prev); s.delete(movieId); return s })
      setWatchlist(prev => prev.filter(m => m.id !== movieId))
    } else {
      await moviesService.addToWatchlist(movieId)
      setWatchlistIds(prev => new Set([...prev, movieId]))
    }
  }, [watchlistIds])

  return { watchlist, watchlistIds, loading, toggle }
}

/** User ratings */
export function useRatings() {
  const [ratings, setRatings] = useState({})  // { movieId: rating }

  useEffect(() => {
    moviesService.getRatings()
      .then(res => {
        const map = {}
        res.data.ratings.forEach(r => { map[r.movieId] = r.rating })
        setRatings(map)
      })
      .catch(() => {})
  }, [])

  const rate = useCallback(async (movieId, rating) => {
    await moviesService.rateMovie(movieId, rating)
    setRatings(prev => ({ ...prev, [movieId]: rating }))
  }, [])

  return { ratings, rate }
}

/** Personal recommendations */
export function useRecommendations() {
  return useFetch(() => moviesService.getPersonalRecs(), [])
}
