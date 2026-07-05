import React, { useRef } from 'react'
import { Link } from 'react-router-dom'
import MovieCard from './MovieCard'
import { SkeletonCard } from './MovieGrid'

export default function MovieRow({ title, badge, movies, loading, watchlistIds, onWatchlistToggle, ratings, viewAllLink }) {
  const scrollRef = useRef(null)

  const scroll = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' })
  }

  return (
    <section className="mb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <h2 className="section-title">{title}</h2>
          {badge && (
            <span className="px-2 py-0.5 bg-cinema-accent/20 text-cinema-accent text-xs font-semibold rounded-full border border-cinema-accent/30">
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Scroll buttons */}
          <button onClick={() => scroll(-1)}
            className="w-8 h-8 rounded-full border border-cinema-border flex items-center justify-center
            text-cinema-muted hover:border-cinema-gold hover:text-cinema-gold transition-all">
            ‹
          </button>
          <button onClick={() => scroll(1)}
            className="w-8 h-8 rounded-full border border-cinema-border flex items-center justify-center
            text-cinema-muted hover:border-cinema-gold hover:text-cinema-gold transition-all">
            ›
          </button>
          {viewAllLink && (
            <Link to={viewAllLink} className="text-sm text-cinema-gold hover:underline ml-2">
              View all
            </Link>
          )}
        </div>
      </div>

      {/* Scrollable row */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide px-4 sm:px-6 pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="shrink-0 w-40 sm:w-44">
                <SkeletonCard />
              </div>
            ))
          : movies?.map(movie => (
              <div key={movie.id} className="shrink-0 w-40 sm:w-44">
                <MovieCard
                  movie={movie}
                  isWatchlisted={watchlistIds?.has(movie.id)}
                  onWatchlistToggle={onWatchlistToggle}
                  userRating={ratings?.[movie.id]}
                />
              </div>
            ))
        }
      </div>
    </section>
  )
}
