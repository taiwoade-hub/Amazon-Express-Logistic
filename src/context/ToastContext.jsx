import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ToastContext = createContext(null)

function randomId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const notify = useCallback((toast) => {
    const id = toast?.id || randomId()
    const next = {
      id,
      title: String(toast?.title || '').trim(),
      message: String(toast?.message || '').trim(),
      variant: toast?.variant || 'info',
      actionLabel: toast?.actionLabel ? String(toast.actionLabel) : '',
      onAction: typeof toast?.onAction === 'function' ? toast.onAction : null,
      durationMs: Number.isFinite(toast?.durationMs) ? toast.durationMs : 5500
    }

    setToasts((prev) => [next, ...prev].slice(0, 3))
    return id
  }, [])

  const value = useMemo(() => ({ toasts, notify, dismiss }), [toasts, notify, dismiss])

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

