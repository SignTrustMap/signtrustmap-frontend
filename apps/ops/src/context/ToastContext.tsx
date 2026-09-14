import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { CheckCircle, XCircle, Warning, Info, X } from '@phosphor-icons/react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastAction {
  label: string
  href?: string
  onClick?: () => void
}

export interface ToastItem {
  id: string
  type: ToastType
  message: string
  title?: string
  duration?: number
  action?: ToastAction
}

interface ToastContextType {
  toasts: ToastItem[]
  showToast: (toast: Omit<ToastItem, 'id'>) => string
  removeToast: (id: string) => void
  success: (message: string, title?: string, duration?: number, action?: ToastAction) => string
  error: (message: string, title?: string, duration?: number, action?: ToastAction) => string
  warning: (message: string, title?: string, duration?: number, action?: ToastAction) => string
  info: (message: string, title?: string, duration?: number, action?: ToastAction) => string
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    ({ type, message, title, duration = 4000, action }: Omit<ToastItem, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      const newToast: ToastItem = { id, type, message, title, duration, action }

      setToasts((prev) => {
        const next = [...prev, newToast]
        if (next.length > 4) {
          return next.slice(next.length - 4)
        }
        return next
      })

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id)
        }, duration)
      }

      return id
    },
    [removeToast]
  )

  const success = useCallback(
    (message: string, title?: string, duration?: number, action?: ToastAction) =>
      showToast({ type: 'success', message, title, duration, action }),
    [showToast]
  )

  const error = useCallback(
    (message: string, title?: string, duration?: number, action?: ToastAction) =>
      showToast({ type: 'error', message, title, duration, action }),
    [showToast]
  )

  const warning = useCallback(
    (message: string, title?: string, duration?: number, action?: ToastAction) =>
      showToast({ type: 'warning', message, title, duration, action }),
    [showToast]
  )

  const info = useCallback(
    (message: string, title?: string, duration?: number, action?: ToastAction) =>
      showToast({ type: 'info', message, title, duration, action }),
    [showToast]
  )

  const value = useMemo(
    () => ({
      toasts,
      showToast,
      removeToast,
      success,
      error,
      warning,
      info,
    }),
    [toasts, showToast, removeToast, success, error, warning, info]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* ─── Global Top-Right Corner Toast Viewport Container ─── */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed top-6 right-6 sm:top-20 sm:right-8 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0 select-none left-0 right-0 sm:left-auto sm:right-8 mx-auto sm:mx-0"
      >
        {toasts.map((toast) => {
          let icon = <CheckCircle size={20} weight="fill" className="text-emerald-500 shrink-0 mt-0.5" />
          let cardStyle =
            'bg-white/95 text-gray-900 border-emerald-300 dark:bg-[#061513]/95 dark:text-emerald-100 dark:border-emerald-500/40 shadow-xl shadow-black/10 dark:shadow-black/70'

          if (toast.type === 'error') {
            icon = <XCircle size={20} weight="fill" className="text-rose-500 shrink-0 mt-0.5" />
            cardStyle =
              'bg-white/95 text-gray-900 border-rose-300 dark:bg-[#1a0808]/95 dark:text-rose-100 dark:border-rose-500/40 shadow-xl shadow-black/10 dark:shadow-black/70'
          } else if (toast.type === 'warning') {
            icon = <Warning size={20} weight="fill" className="text-amber-500 shrink-0 mt-0.5" />
            cardStyle =
              'bg-white/95 text-gray-900 border-amber-300 dark:bg-[#191206]/95 dark:text-amber-100 dark:border-amber-500/40 shadow-xl shadow-black/10 dark:shadow-black/70'
          } else if (toast.type === 'info') {
            icon = <Info size={20} weight="fill" className="text-[#007b8b] dark:text-[#00c4de] shrink-0 mt-0.5" />
            cardStyle =
              'bg-white/95 text-gray-900 border-cyan-300 dark:bg-[#071317]/95 dark:text-cyan-100 dark:border-[#00c4de]/40 shadow-xl shadow-black/10 dark:shadow-black/70'
          }

          return (
            <div
              key={toast.id}
              role="alert"
              onClick={() => removeToast(toast.id)}
              className={`group pointer-events-auto cursor-pointer rounded-2xl border p-3.5 sm:p-4 shadow-xl backdrop-blur-md flex items-start gap-3 animate-in fade-in slide-in-from-top-3 duration-200 transition-all hover:scale-[1.01] hover:brightness-105 active:scale-[0.99] ${cardStyle}`}
              title="Click to dismiss"
            >
              {icon}
              <div className="flex-1 min-w-0 pr-1">
                {toast.title && (
                  <h5 className="font-extrabold text-sm text-gray-900 dark:text-white leading-tight mb-0.5">
                    {toast.title}
                  </h5>
                )}
                <p className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-100 leading-snug break-words">
                  {toast.message}
                </p>
                {toast.action && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        toast.action?.onClick?.()
                        removeToast(toast.id)
                      }}
                      className="text-xs font-bold underline hover:opacity-80 transition-opacity"
                    >
                      {toast.action.label}
                    </button>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  removeToast(toast.id)
                }}
                className="shrink-0 p-1 rounded-lg text-gray-400 group-hover:text-gray-700 dark:group-hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X size={14} weight="bold" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
