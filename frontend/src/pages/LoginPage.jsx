import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cinema-bg flex items-center justify-center px-4"
      style={{ backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(229,9,20,0.1), transparent)' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <span className="text-cinema-accent text-3xl">▶</span>
            <span className="font-display text-3xl tracking-widest text-cinema-text">CINEMATCH</span>
          </Link>
          <p className="text-cinema-muted text-sm mt-2">Your AI movie companion</p>
        </div>

        <div className="card p-8">
          <h1 className="font-display text-2xl tracking-widest text-cinema-text mb-6">SIGN IN</h1>

          {error && (
            <div className="mb-4 p-3 bg-cinema-accent/10 border border-cinema-accent/40 rounded-lg text-cinema-accent text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-cinema-muted uppercase tracking-widest mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="input-field"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-xs text-cinema-muted uppercase tracking-widest mb-1.5">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="input-field"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-cinema-muted text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-cinema-gold hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
