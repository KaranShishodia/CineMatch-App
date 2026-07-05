import React from 'react'
import { Link } from 'react-router-dom'
import { useWatchlist, useRatings } from '../hooks/useMovies'
import MovieGrid from '../components/movies/MovieGrid'

export default function WatchlistPage() {
  const { watchlist, watchlistIds, loading, toggle } = useWatchlist()
  const { ratings } = useRatings()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="section-title">My Watchlist</h1>
          {!loading && (
            <p className="text-cinema-muted text-sm mt-1">{watchlist.length} movies saved</p>
          )}
        </div>
        <Link to="/search" className="btn-ghost text-sm">+ Add Movies</Link>
      </div>

      {!loading && watchlist.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-5xl mb-4">🎬</p>
          <h3 className="text-cinema-text font-semibold mb-2">Your watchlist is empty</h3>
          <p className="text-cinema-muted text-sm mb-6">
            Save movies by clicking the heart icon on any movie card
          </p>
          <Link to="/search" className="btn-primary">Browse Movies</Link>
        </div>
      ) : (
        <MovieGrid
          movies={watchlist}
          loading={loading}
          watchlistIds={watchlistIds}
          onWatchlistToggle={toggle}
          ratings={ratings}
        />
      )}
    </div>
  )
}
