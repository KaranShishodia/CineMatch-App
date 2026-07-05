import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

const ToastContext = createContext(null)

let toastId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    info: (msg) => addToast(msg, 'info'),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast container - fixed bottom-right */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
        {toasts.map(t => (
          <div
            key={t.id}
            onClick={() => remove(t.id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
              shadow-xl cursor-pointer animate-slide-up backdrop-blur-sm border
              ${t.type === 'success' ? 'bg-green-900/90 border-green-700 text-green-100' : ''}
              ${t.type === 'error'   ? 'bg-red-900/90 border-cinema-accent text-red-100' : ''}
              ${t.type === 'info'    ? 'bg-cinema-surface/90 border-cinema-border text-cinema-text' : ''}
            `}
          >
            <span>
              {t.type === 'success' && '✓'}
              {t.type === 'error'   && '✕'}
              {t.type === 'info'    && 'ℹ'}
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
