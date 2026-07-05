import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './components/ui/Toast'
import ErrorBoundary from './components/ui/ErrorBoundary'
import Layout from './components/layout/Layout'
import CineBot from './components/ui/CineBot'
import HomePage from './pages/HomePage'
import MovieDetailPage from './pages/MovieDetailPage'
import SearchPage from './pages/SearchPage'
import WatchlistPage from './pages/WatchlistPage'
import ProfilePage from './pages/ProfilePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

function GuestRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  return user ? <Navigate to="/" replace /> : children
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  return user ? children : <Navigate to="/login" replace />
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-cinema-bg flex items-center justify-center">
      <div className="text-center">
        <div className="font-display text-3xl tracking-widest text-cinema-text mb-4 animate-pulse">
          CINEMATCH
        </div>
        <div className="w-8 h-8 border-2 border-cinema-gold border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    </div>
  )
}

function AppRoutes() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<ErrorBoundary><HomePage /></ErrorBoundary>} />
          <Route path="movie/:id" element={<ErrorBoundary><MovieDetailPage /></ErrorBoundary>} />
          <Route path="search" element={<ErrorBoundary><SearchPage /></ErrorBoundary>} />
          <Route path="watchlist" element={
            <ProtectedRoute><ErrorBoundary><WatchlistPage /></ErrorBoundary></ProtectedRoute>
          } />
          <Route path="profile" element={
            <ProtectedRoute><ErrorBoundary><ProfilePage /></ErrorBoundary></ProtectedRoute>
          } />
        </Route>
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <CineBot />
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
