import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { moviesService } from '../services/movies'
import { useRatings, useFetch } from '../hooks/useMovies'
import api from '../services/api'

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const { ratings } = useRatings()
  const { data: genresData } = useFetch(() => moviesService.getGenres(), [])
  const [selectedGenres, setSelectedGenres] = useState(user?.preferences?.favoriteGenres || [])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const genres = genresData?.genres || []
  const ratingCount = Object.keys(ratings).length
  const avgRating = ratingCount > 0
    ? (Object.values(ratings).reduce((a, b) => a + b, 0) / ratingCount).toFixed(1)
    : null

  const toggleGenre = (id) => {
    setSelectedGenres(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    )
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await api.put('/user/preferences', { favoriteGenres: selectedGenres })
      updateUser({ preferences: res.data.preferences })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (_) {}
    finally { setSaving(false) }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex items-center gap-5 mb-10">
        <div className="w-20 h-20 rounded-full bg-cinema-accent flex items-center justify-center text-3xl font-bold text-white">
          {user.username[0].toUpperCase()}
        </div>
        <div>
          <h1 className="font-display text-3xl tracking-widest text-cinema-text">{user.username}</h1>
          <p className="text-cinema-muted text-sm">{user.email}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { label: 'Movies Rated', value: ratingCount },
          { label: 'Avg Rating', value: avgRating ? `${avgRating}★` : '—' },
          { label: 'Genre Picks', value: selectedGenres.length },
        ].map(({ label, value }) => (
          <div key={label} className="card p-5 text-center">
            <p className="text-2xl font-bold text-cinema-gold mb-1">{value}</p>
            <p className="text-cinema-muted text-xs uppercase tracking-widest">{label}</p>
          </div>
        ))}
      </div>

      {/* Favorite genres */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-cinema-text font-semibold">Favorite Genres</h2>
            <p className="text-cinema-muted text-xs mt-0.5">These improve your AI recommendations</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`btn-primary text-sm py-1.5 ${saved ? 'bg-green-600' : ''}`}
          >
            {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Preferences'}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {genres.map(g => (
            <button
              key={g.id}
              onClick={() => toggleGenre(g.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${
                selectedGenres.includes(g.id)
                  ? 'bg-cinema-gold text-black border-cinema-gold'
                  : 'border-cinema-border text-cinema-muted hover:border-cinema-gold hover:text-cinema-gold'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      </div>

      {/* Ratings list */}
      {ratingCount > 0 && (
        <div className="card p-6">
          <h2 className="text-cinema-text font-semibold mb-4">Your Ratings</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {Object.entries(ratings).map(([movieId, rating]) => (
              <div key={movieId} className="flex items-center justify-between py-2 border-b border-cinema-border last:border-0">
                <span className="text-cinema-muted text-sm">Movie #{movieId}</span>
                <span className="text-cinema-gold text-sm">{'★'.repeat(Math.round(rating))} {rating}/5</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
