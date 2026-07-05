import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSearch, useWatchlist, useRatings, useFetch } from '../hooks/useMovies'
import { moviesService } from '../services/movies'
import MovieGrid from '../components/movies/MovieGrid'

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQ = searchParams.get('q') || ''
  const initialGenre = searchParams.get('genre') || ''

  const { query, setQuery, genre, setGenre, results, loading, error, search } = useSearch()
  const { watchlistIds, toggle } = useWatchlist()
  const { ratings } = useRatings()
  const { data: genresData } = useFetch(() => moviesService.getGenres(), [])

  const [hasSearched, setHasSearched] = useState(false)

  // Run search from URL params on mount
  useEffect(() => {
    if (initialQ || initialGenre) {
      setQuery(initialQ)
      setGenre(initialGenre)
      search(initialQ, initialGenre, 1)
      setHasSearched(true)
    }
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    setSearchParams({ q: query, genre })
    search(query, genre, 1)
    setHasSearched(true)
  }

  const handleGenreClick = (genreId) => {
    const g = String(genreId)
    setGenre(g)
    setSearchParams({ genre: g })
    search('', g, 1)
    setHasSearched(true)
  }

  const genres = genresData?.genres || []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="section-title mb-8">Browse Movies</h1>

      {/* Search form */}
      <form onSubmit={handleSubmit} className="flex gap-3 mb-8">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by title, cast, or keywords..."
          className="input-field flex-1"
        />
        <button type="submit" className="btn-primary shrink-0">Search</button>
      </form>

      {/* Genre filter chips */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => handleGenreClick('')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${
            !genre ? 'bg-cinema-gold text-black border-cinema-gold' : 'border-cinema-border text-cinema-muted hover:border-cinema-gold'
          }`}
        >
          All
        </button>
        {genres.map(g => (
          <button
            key={g.id}
            onClick={() => handleGenreClick(g.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${
              genre === String(g.id)
                ? 'bg-cinema-gold text-black border-cinema-gold'
                : 'border-cinema-border text-cinema-muted hover:border-cinema-gold hover:text-cinema-gold'
            }`}
          >
            {g.name}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="card p-4 mb-6 border-cinema-accent/40 text-cinema-accent text-sm">{error}</div>
      )}

      {/* Results */}
      {hasSearched ? (
        <>
          {results && !loading && (
            <div className="flex items-center justify-between mb-4">
              <p className="text-cinema-muted text-sm">
                {results.total_results?.toLocaleString()} results
                {query && ` for "${query}"`}
              </p>
              <p className="text-cinema-muted text-sm">
                Page {results.page} of {Math.min(results.total_pages, 500)}
              </p>
            </div>
          )}

          <MovieGrid
            movies={results?.results}
            loading={loading}
            watchlistIds={watchlistIds}
            onWatchlistToggle={toggle}
            ratings={ratings}
          />

          {/* Pagination */}
          {results && results.total_pages > 1 && (
            <div className="flex justify-center gap-3 mt-10">
              <button
                disabled={results.page <= 1}
                onClick={() => search(query, genre, results.page - 1)}
                className="btn-ghost disabled:opacity-30"
              >
                ← Previous
              </button>
              <span className="flex items-center text-cinema-muted text-sm">
                {results.page} / {Math.min(results.total_pages, 500)}
              </span>
              <button
                disabled={results.page >= results.total_pages}
                onClick={() => search(query, genre, results.page + 1)}
                className="btn-ghost disabled:opacity-30"
              >
                Next →
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-cinema-muted text-lg">Search for a movie or pick a genre to get started</p>
        </div>
      )}
    </div>
  )
}
