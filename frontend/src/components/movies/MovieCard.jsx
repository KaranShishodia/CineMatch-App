import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { getPosterUrl } from '../../services/movies'
import { useAuth } from '../../context/AuthContext'

export default function MovieCard({ movie, onWatchlistToggle, isWatchlisted, userRating }) {
  const { user } = useAuth()
  const [imgLoaded, setImgLoaded] = useState(false)
  const [toggling, setToggling] = useState(false)

  const handleWatchlist = async (e) => {
    e.preventDefault()
    if (!user || toggling) return
    setToggling(true)
    try { await onWatchlistToggle?.(movie.id) }
    finally { setToggling(false) }
  }

  const posterUrl = getPosterUrl(movie.poster_path, 'w342')
  const rating = (movie.vote_average / 2).toFixed(1)  // Convert 10-scale to 5-scale

  return (
    <Link to={`/movie/${movie.id}`} className="group relative block">
      <div className="card h-full">
        {/* Poster */}
        <div className="relative aspect-[2/3] overflow-hidden bg-cinema-surface">
          {!imgLoaded && (
            <div className="absolute inset-0 skeleton" />
          )}
          <img
            src={posterUrl}
            alt={movie.title}
            className={`w-full h-full object-cover transition-all duration-500
              group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImgLoaded(true)}
            onError={e => { e.target.src = 'https://via.placeholder.com/342x513/1a1a26/6b6b80?text=No+Poster'; setImgLoaded(true) }}
          />

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent
            opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
            <p className="text-white text-xs line-clamp-3">{movie.overview}</p>
          </div>

          {/* Watchlist button */}
          {user && (
            <button
              onClick={handleWatchlist}
              disabled={toggling}
              className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center
                backdrop-blur-sm border transition-all duration-200 z-10
                ${isWatchlisted
                  ? 'bg-cinema-accent/90 border-cinema-accent text-white'
                  : 'bg-black/50 border-white/20 text-white/70 hover:border-cinema-accent hover:text-cinema-accent'
                }`}
            >
              <HeartIcon filled={isWatchlisted} />
            </button>
          )}

          {/* Rating badge */}
          {movie.vote_average > 0 && (
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm
              rounded-full px-2 py-0.5 text-xs font-semibold">
              <span className="text-cinema-gold">★</span>
              <span className="text-white">{rating}</span>
            </div>
          )}

          {/* User's own rating */}
          {userRating && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-cinema-gold/20 backdrop-blur-sm
              rounded-full px-2 py-0.5 text-xs font-semibold border border-cinema-gold/40">
              <span className="text-cinema-gold">You: {userRating}★</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="font-semibold text-sm text-cinema-text line-clamp-1 group-hover:text-cinema-gold transition-colors">
            {movie.title}
          </h3>
          <p className="text-cinema-muted text-xs mt-1">
            {movie.release_date?.slice(0, 4) || 'N/A'}
            {movie.genre_ids?.length > 0 && ` · ${movie.genre_ids.slice(0, 2).length} genres`}
          </p>
        </div>
      </div>
    </Link>
  )
}

const HeartIcon = ({ filled }) => (
  <svg className="w-4 h-4" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
)
