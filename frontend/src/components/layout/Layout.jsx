import React, { useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

export default function Layout() {
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const navLink = (to, label) => (
    <Link
      to={to}
      className={`text-sm font-medium transition-colors duration-200 ${
        location.pathname === to
          ? 'text-cinema-gold'
          : 'text-cinema-muted hover:text-cinema-text'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-cinema-bg/80 backdrop-blur-xl border-b border-cinema-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="text-cinema-accent text-2xl">▶</span>
            <span className="font-display text-2xl tracking-widest text-cinema-text">CINEMATCH</span>
          </Link>

          {/* Desktop search bar */}
          <form
            onSubmit={e => { e.preventDefault(); navigate(`/search?q=${e.target.q.value}`) }}
            className="hidden md:flex flex-1 max-w-md"
          >
            <div className="relative w-full">
              <input
                name="q"
                placeholder="Search movies, genres, cast..."
                className="input-field py-2 pr-10 text-sm"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-cinema-muted hover:text-cinema-gold">
                <SearchIcon />
              </button>
            </div>
          </form>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6">
            {navLink('/', 'Discover')}
            {navLink('/search', 'Browse')}
            {user && navLink('/watchlist', 'Watchlist')}

            {/* Theme toggle */}
            <button onClick={toggle} className="text-cinema-muted hover:text-cinema-gold transition-colors">
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>

            {user ? (
              <div className="flex items-center gap-3">
                <Link to="/profile" className="w-8 h-8 rounded-full bg-cinema-accent flex items-center justify-center text-sm font-bold text-white">
                  {user.username[0].toUpperCase()}
                </Link>
                <button onClick={handleLogout} className="text-sm text-cinema-muted hover:text-cinema-accent transition-colors">
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="btn-ghost py-1.5 text-sm">Login</Link>
                <Link to="/register" className="btn-primary py-1.5 text-sm">Sign Up</Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden text-cinema-muted" onClick={() => setMenuOpen(!menuOpen)}>
            <MenuIcon />
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-cinema-surface border-t border-cinema-border p-4 space-y-4 animate-fade-in">
            <form onSubmit={e => { e.preventDefault(); navigate(`/search?q=${e.target.q.value}`); setMenuOpen(false) }}>
              <input name="q" placeholder="Search movies..." className="input-field text-sm" />
            </form>
            <div className="flex flex-col gap-3">
              {navLink('/', 'Discover')}
              {navLink('/search', 'Browse')}
              {user && navLink('/watchlist', 'Watchlist')}
              {user && navLink('/profile', 'Profile')}
              {!user && <Link to="/login" className="btn-primary text-center text-sm">Login</Link>}
              {user && <button onClick={handleLogout} className="text-sm text-cinema-accent">Logout</button>}
            </div>
          </div>
        )}
      </nav>

      {/* ── Page content ── */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-cinema-border py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center text-cinema-muted text-sm">
          <p className="font-display text-xl tracking-widest text-cinema-text mb-2">CINEMATCH</p>
          <p>Powered by <a href="https://www.themoviedb.org/" className="text-cinema-gold hover:underline" target="_blank" rel="noreferrer">TMDB</a> · Built with React + Node.js + Python ML</p>
        </div>
      </footer>
    </div>
  )
}

// ── Icon components ────────────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)
const SunIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
  </svg>
)
const MoonIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
)
const MenuIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
)
