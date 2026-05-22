import { useEffect } from 'react'
import { X, Bell, CheckCircle2, XCircle } from 'lucide-react'
import { useToast } from '../context/ToastContext'

function iconFor(variant) {
  if (variant === 'success') return <CheckCircle2 size={18} />
  if (variant === 'danger') return <XCircle size={18} />
  return <Bell size={18} />
}

function classesFor(variant) {
  if (variant === 'success') return 'bg-white text-primary border-border'
  if (variant === 'danger') return 'bg-black text-white border-black'
  return 'bg-primary text-white border-primary'
}

function ToastItem({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast?.durationMs || toast.durationMs <= 0) return
    const id = window.setTimeout(() => onDismiss(toast.id), toast.durationMs)
    return () => window.clearTimeout(id)
  }, [toast?.id, toast?.durationMs, onDismiss])

  const variant = toast?.variant || 'info'

  return (
    <div className={`w-full max-w-sm border rounded-3xl shadow-2xl overflow-hidden ${classesFor(variant)}`}>
      <div className="px-5 py-4 flex gap-3 items-start">
        <div className="w-9 h-9 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
          {iconFor(variant)}
        </div>
        <div className="flex-1 min-w-0">
          {toast?.title && <p className="text-sm font-black tracking-tight leading-snug">{toast.title}</p>}
          {toast?.message && <p className="text-xs font-semibold opacity-90 mt-1 leading-relaxed">{toast.message}</p>}
          {(toast?.actionLabel && toast?.onAction) && (
            <button
              type="button"
              onClick={() => {
                toast.onAction()
                onDismiss(toast.id)
              }}
              className="mt-3 inline-flex items-center justify-center px-4 py-2 rounded-2xl bg-white text-primary font-black text-xs hover:bg-white/90 transition-colors"
            >
              {toast.actionLabel}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="p-2 rounded-2xl hover:bg-white/10 transition-colors flex-shrink-0"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

function ToastHost() {
  const { toasts, dismiss } = useToast()

  if (!toasts || toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[60] space-y-3 w-[calc(100%-2rem)] sm:w-auto">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
      ))}
    </div>
  )
}

export default ToastHost

