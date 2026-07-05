import React from 'react'
import MovieCard from './MovieCard'

export function SkeletonCard() {
  return (
    <div className="card">
      <div className="aspect-[2/3] skeleton" />
      <div className="p-3 space-y-2">
        <div className="h-4 skeleton rounded w-3/4" />
        <div className="h-3 skeleton rounded w-1/2" />
      </div>
    </div>
  )
}

export default function MovieGrid({ movies, loading, watchlistIds = new Set(), onWatchlistToggle, ratings = {} }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  if (!movies?.length) {
    return (
      <div className="text-center py-24">
        <p className="text-5xl mb-4">🎬</p>
        <p className="text-cinema-muted text-lg">No movies found</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {movies.map(movie => (
        <MovieCard
          key={movie.id}
          movie={movie}
          isWatchlisted={watchlistIds.has(movie.id)}
          onWatchlistToggle={onWatchlistToggle}
          userRating={ratings[movie.id]}
        />
      ))}
    </div>
  )
}
