import React from 'react'

/**
 * ErrorBoundary catches unhandled JS errors in child components
 * and renders a fallback UI instead of crashing the entire app.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // In production, send to an error tracking service (e.g. Sentry)
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
          <p className="text-5xl mb-4">⚠️</p>
          <h2 className="font-display text-2xl tracking-widest text-cinema-text mb-2">SOMETHING WENT WRONG</h2>
          <p className="text-cinema-muted text-sm mb-6 max-w-md">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="btn-ghost"
          >
            Try Again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
