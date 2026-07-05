import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getBackdropUrl, getPosterUrl } from '../../services/movies'

export default function HeroSection({ movies = [] }) {
  const [current, setCurrent] = useState(0)
  const featured = movies.slice(0, 5)

  useEffect(() => {
    if (!featured.length) return
    const timer = setInterval(() => setCurrent(i => (i + 1) % featured.length), 6000)
    return () => clearInterval(timer)
  }, [featured.length])

  if (!featured.length) return <div className="h-[70vh] skeleton" />

  const movie = featured[current]
  const backdrop = getBackdropUrl(movie.backdrop_path)

  return (
    <div className="relative h-[75vh] min-h-[500px] overflow-hidden">
      {/* Backdrop */}
      {backdrop && (
        <img
          key={movie.id}
          src={backdrop}
          alt={movie.title}
          className="absolute inset-0 w-full h-full object-cover animate-fade-in"
        />
      )}

      {/* Gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-cinema-bg via-cinema-bg/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-cinema-bg via-transparent to-transparent" />

      {/* Content */}
      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 flex items-center">
        <div className="max-w-xl animate-slide-up" key={movie.id}>
          {/* Trending badge */}
          <div className="inline-flex items-center gap-2 bg-cinema-accent/20 border border-cinema-accent/40
            rounded-full px-3 py-1 text-xs font-semibold text-cinema-accent mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-cinema-accent animate-pulse" />
            TRENDING NOW
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl tracking-wider text-white mb-4 leading-none">
            {movie.title}
          </h1>

          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-cinema-muted mb-4">
            <span className="flex items-center gap-1">
              <span className="text-cinema-gold">★</span>
              <span className="text-white font-semibold">{(movie.vote_average / 2).toFixed(1)}</span>
            </span>
            <span>{movie.release_date?.slice(0, 4)}</span>
            {movie.genre_ids?.slice(0, 3).map(id => (
              <span key={id} className="px-2 py-0.5 bg-white/10 rounded-full text-xs text-white/80">
                Genre
              </span>
            ))}
          </div>

          <p className="text-cinema-muted text-sm leading-relaxed line-clamp-3 mb-6">
            {movie.overview}
          </p>

          <div className="flex gap-3">
            <Link to={`/movie/${movie.id}`} className="btn-primary">
              View Details
            </Link>
            <Link to="/search" className="btn-ghost">
              Browse All
            </Link>
          </div>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {featured.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === current ? 'w-8 bg-cinema-gold' : 'w-2 bg-white/30'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
