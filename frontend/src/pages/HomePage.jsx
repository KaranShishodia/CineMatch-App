import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTrending, usePopular, useTopRated, useRecommendations, useWatchlist, useRatings } from '../hooks/useMovies'
import HeroSection from '../components/movies/HeroSection'
import MovieRow from '../components/movies/MovieRow'

export default function HomePage() {
  const { user } = useAuth()
  const { data: trending, loading: trendingLoading } = useTrending()
  const { data: popular, loading: popularLoading } = usePopular()
  const { data: topRated, loading: topRatedLoading } = useTopRated()
  const { data: recs, loading: recsLoading } = useRecommendations()
  const { watchlistIds, toggle: toggleWatchlist } = useWatchlist()
  const { ratings } = useRatings()

  const trendingMovies = trending?.results || []
  const popularMovies = popular?.results || []
  const topRatedMovies = topRated?.results || []
  const recMovies = recs?.recommendations || []

  const sharedProps = {
    watchlistIds,
    onWatchlistToggle: toggleWatchlist,
    ratings,
  }

  return (
    <div>
      {/* Hero */}
      <HeroSection movies={trendingMovies} />

      {/* Recommendations (logged-in users) */}
      {user && (
        <div className="pt-12">
          {recMovies.length > 0 ? (
            <MovieRow
              title="For You"
              badge="AI Picks"
              movies={recMovies}
              loading={recsLoading}
              viewAllLink="/search"
              {...sharedProps}
            />
          ) : !recsLoading && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-12">
              <div className="card p-8 text-center border-dashed">
                <p className="text-4xl mb-3">🎯</p>
                <h3 className="text-cinema-text font-semibold mb-2">Get Personalized Recommendations</h3>
                <p className="text-cinema-muted text-sm mb-4">
                  Rate a few movies and our AI will learn your taste!
                </p>
                <Link to="/search" className="btn-primary inline-block">
                  Discover Movies to Rate
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Trending */}
      <div className={user ? '' : 'pt-12'}>
        <MovieRow
          title="Trending"
          badge="This Week"
          movies={trendingMovies}
          loading={trendingLoading}
          viewAllLink="/search?sort=trending"
          {...sharedProps}
        />
      </div>

      {/* Popular */}
      <MovieRow
        title="Popular"
        movies={popularMovies}
        loading={popularLoading}
        viewAllLink="/search?sort=popular"
        {...sharedProps}
      />

      {/* Top Rated */}
      <MovieRow
        title="Top Rated"
        badge="All Time"
        movies={topRatedMovies}
        loading={topRatedLoading}
        viewAllLink="/search?sort=top-rated"
        {...sharedProps}
      />

      {/* CTA for guests */}
      {!user && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-16">
          <div className="card p-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-radial from-cinema-accent/10 to-transparent" />
            <div className="relative">
              <h2 className="font-display text-4xl tracking-widest text-cinema-text mb-3">
                GET PERSONAL PICKS
              </h2>
              <p className="text-cinema-muted mb-6 max-w-md mx-auto">
                Sign up to get AI-powered recommendations tailored to your unique taste.
              </p>
              <div className="flex gap-3 justify-center">
                <Link to="/register" className="btn-primary">Create Free Account</Link>
                <Link to="/login" className="btn-ghost">Sign In</Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
