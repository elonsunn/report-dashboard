/**
 * Toast notification system.
 * Usage:
 *   import { useToast, ToastContainer } from './Toast'
 *   const { toasts, showToast } = useToast()
 *   showToast('Saved!', 'success')
 *   <ToastContainer toasts={toasts} onDismiss={dismissToast} />
 */

import { useState, useCallback } from 'react'

let _id = 0

export function useToast() {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = ++_id
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { toasts, showToast, dismissToast }
}

const typeStyles = {
  success: 'bg-green-600',
  error:   'bg-red-600',
  info:    'bg-indigo-600',
  warning: 'bg-yellow-500',
}

export function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg text-white text-sm ${typeStyles[t.type] || typeStyles.info} animate-slide-in`}
        >
          <span className="flex-1">{t.message}</span>
          <button
            onClick={() => onDismiss(t.id)}
            className="text-white/70 hover:text-white leading-none mt-0.5"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
