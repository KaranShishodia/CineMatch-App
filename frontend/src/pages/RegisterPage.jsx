import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirm) {
      return setError('Passwords do not match.')
    }
    if (form.password.length < 6) {
      return setError('Password must be at least 6 characters.')
    }

    setLoading(true)
    try {
      await register(form.username, form.email, form.password)
      navigate('/')
    } catch (err) {
      const errors = err.response?.data?.errors
      setError(errors?.[0]?.msg || err.response?.data?.error || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  const field = (key, label, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-xs text-cinema-muted uppercase tracking-widest mb-1.5">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm({ ...form, [key]: e.target.value })}
        className="input-field"
        placeholder={placeholder}
        required
      />
    </div>
  )

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
          <p className="text-cinema-muted text-sm mt-2">Join millions of movie lovers</p>
        </div>

        <div className="card p-8">
          <h1 className="font-display text-2xl tracking-widest text-cinema-text mb-6">CREATE ACCOUNT</h1>

          {error && (
            <div className="mb-4 p-3 bg-cinema-accent/10 border border-cinema-accent/40 rounded-lg text-cinema-accent text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {field('username', 'Username', 'text', 'cinephile42')}
            {field('email', 'Email', 'email', 'you@example.com')}
            {field('password', 'Password', 'password', '••••••••')}
            {field('confirm', 'Confirm Password', 'password', '••••••••')}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-cinema-muted text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-cinema-gold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
