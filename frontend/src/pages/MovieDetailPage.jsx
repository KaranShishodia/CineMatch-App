import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { moviesService, getBackdropUrl, getPosterUrl } from '../services/movies'
import { useAuth } from '../context/AuthContext'
import { useWatchlist, useRatings } from '../hooks/useMovies'
import StarRating from '../components/ui/StarRating'
import MovieRow from '../components/movies/MovieRow'

export default function MovieDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [movie, setMovie] = useState(null)
  const [similar, setSimilar] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showTrailer, setShowTrailer] = useState(false)
  const [ratingSubmitting, setRatingSubmitting] = useState(false)

  const { watchlistIds, toggle: toggleWatchlist } = useWatchlist()
  const { ratings, rate } = useRatings()

  useEffect(() => {
    setLoading(true)
    setError(null)
    window.scrollTo(0, 0)

    Promise.all([
      moviesService.getDetails(id),
      moviesService.getSimilar(id),
    ])
      .then(([detailRes, similarRes]) => {
        setMovie(detailRes.data)
        setSimilar(similarRes.data.similar || [])
      })
      .catch(err => setError(err.response?.data?.error || 'Failed to load movie'))
      .finally(() => setLoading(false))
  }, [id])

  const handleRate = async (rating) => {
    if (!user) return
    setRatingSubmitting(true)
    try { await rate(movie.id, rating) }
    finally { setRatingSubmitting(false) }
  }

  if (loading) return <MovieDetailSkeleton />
  if (error) return (
    <div className="max-w-7xl mx-auto px-4 py-24 text-center">
      <p className="text-5xl mb-4">😕</p>
      <p className="text-cinema-muted">{error}</p>
      <Link to="/" className="btn-ghost mt-6 inline-block">Go Home</Link>
    </div>
  )
  if (!movie) return null

  const backdrop = getBackdropUrl(movie.backdrop_path)
  const poster = getPosterUrl(movie.poster_path, 'w500')
  const userRating = ratings[movie.id] || 0
  const inWatchlist = watchlistIds.has(movie.id)
  const trailer = movie.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube')
  const cast = movie.credits?.cast?.slice(0, 12) || []
  const directors = movie.credits?.crew?.filter(c => c.job === 'Director') || []
  const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : ''

  return (
    <div>
      {/* Backdrop hero */}
      <div className="relative h-[50vh] overflow-hidden">
        {backdrop && (
          <img src={backdrop} alt={movie.title} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-cinema-bg via-cinema-bg/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-cinema-bg/80 to-transparent" />
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-40 relative">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster */}
          <div className="shrink-0 mx-auto md:mx-0">
            <div className="w-48 md:w-64 rounded-xl overflow-hidden shadow-2xl border border-cinema-border">
              <img src={poster} alt={movie.title} className="w-full" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 pt-40 md:pt-8">
            {/* Title */}
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-wider text-cinema-text mb-2">
              {movie.title}
            </h1>

            {/* Tagline */}
            {movie.tagline && (
              <p className="text-cinema-muted italic mb-4">"{movie.tagline}"</p>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-4 mb-6 text-sm">
              {movie.vote_average > 0 && (
                <span className="flex items-center gap-1">
                  <span className="text-cinema-gold text-lg">★</span>
                  <span className="text-white font-bold text-lg">{(movie.vote_average / 2).toFixed(1)}</span>
                  <span className="text-cinema-muted">/ 5</span>
                </span>
              )}
              {movie.release_date && <span className="text-cinema-muted">{movie.release_date.slice(0, 4)}</span>}
              {runtime && <span className="text-cinema-muted">{runtime}</span>}
              {movie.genres?.map(g => (
                <Link key={g.id} to={`/search?genre=${g.id}`}
                  className="px-2 py-0.5 bg-cinema-surface border border-cinema-border rounded-full
                  text-cinema-muted hover:border-cinema-gold hover:text-cinema-gold transition-colors text-xs">
                  {g.name}
                </Link>
              ))}
            </div>

            {/* Directors */}
            {directors.length > 0 && (
              <p className="text-sm text-cinema-muted mb-4">
                <span className="text-cinema-text font-medium">Directed by</span>{' '}
                {directors.map(d => d.name).join(', ')}
              </p>
            )}

            {/* Overview */}
            <p className="text-cinema-muted leading-relaxed mb-6 max-w-2xl">{movie.overview}</p>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 mb-6">
              {trailer && (
                <button onClick={() => setShowTrailer(true)} className="btn-primary flex items-center gap-2">
                  <span>▶</span> Watch Trailer
                </button>
              )}
              {user && (
                <button
                  onClick={() => toggleWatchlist(movie.id)}
                  className={`btn-ghost flex items-center gap-2 ${inWatchlist ? 'border-cinema-accent text-cinema-accent' : ''}`}
                >
                  {inWatchlist ? '♥ In Watchlist' : '♡ Add to Watchlist'}
                </button>
              )}
            </div>

            {/* User rating */}
            {user && (
              <div className="card p-4 inline-block">
                <p className="text-xs text-cinema-muted mb-2 uppercase tracking-widest">Your Rating</p>
                <StarRating
                  value={userRating}
                  onChange={handleRate}
                  size="md"
                  readOnly={ratingSubmitting}
                />
                {userRating > 0 && (
                  <p className="text-xs text-cinema-muted mt-2">
                    {ratingSubmitting ? 'Saving...' : 'Rating saved ✓'}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Cast */}
        {cast.length > 0 && (
          <section className="mt-12">
            <h2 className="section-title mb-5">Cast</h2>
            <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
              {cast.map(person => (
                <div key={person.id} className="shrink-0 w-28 text-center">
                  <div className="w-20 h-20 mx-auto rounded-full overflow-hidden bg-cinema-surface border border-cinema-border mb-2">
                    {person.profile_path
                      ? <img src={getPosterUrl(person.profile_path, 'w185')} alt={person.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-2xl text-cinema-muted">👤</div>
                    }
                  </div>
                  <p className="text-xs font-semibold text-cinema-text line-clamp-2">{person.name}</p>
                  <p className="text-xs text-cinema-muted line-clamp-1">{person.character}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Stats */}
        <section className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Status', value: movie.status },
            { label: 'Budget', value: movie.budget ? `$${(movie.budget / 1e6).toFixed(0)}M` : 'N/A' },
            { label: 'Revenue', value: movie.revenue ? `$${(movie.revenue / 1e6).toFixed(0)}M` : 'N/A' },
            { label: 'Votes', value: movie.vote_count?.toLocaleString() },
          ].map(({ label, value }) => (
            <div key={label} className="card p-4 text-center">
              <p className="text-xs text-cinema-muted uppercase tracking-widest mb-1">{label}</p>
              <p className="text-cinema-text font-semibold">{value || 'N/A'}</p>
            </div>
          ))}
        </section>

        {/* Similar movies */}
        {similar.length > 0 && (
          <div className="mt-16">
            <MovieRow
              title="Similar Movies"
              movies={similar}
              loading={false}
              watchlistIds={watchlistIds}
              onWatchlistToggle={toggleWatchlist}
              ratings={ratings}
            />
          </div>
        )}
      </div>

      {/* Trailer modal */}
      {showTrailer && trailer && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowTrailer(false)}
        >
          <div className="relative w-full max-w-4xl aspect-video" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowTrailer(false)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white text-sm"
            >
              ✕ Close
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1`}
              className="w-full h-full rounded-xl"
              allowFullScreen
              allow="autoplay; encrypted-media"
            />
          </div>
        </div>
      )}
    </div>
  )
}

function MovieDetailSkeleton() {
  return (
    <div>
      <div className="h-[50vh] skeleton" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-40 relative">
        <div className="flex gap-8">
          <div className="w-64 h-96 skeleton rounded-xl" />
          <div className="flex-1 pt-40 space-y-4">
            <div className="h-12 skeleton rounded w-2/3" />
            <div className="h-4 skeleton rounded w-1/4" />
            <div className="h-24 skeleton rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}
