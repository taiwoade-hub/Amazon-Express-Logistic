import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import DeliveryReceipt from '../components/DeliveryReceipt'
import { Bell, CheckCircle2, XCircle, ArrowLeft, X, ChevronLeft, ChevronRight } from 'lucide-react'

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function Notifications() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [deliveries, setDeliveries] = useState([])
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [zoomImages, setZoomImages] = useState([])
  const [zoomIndex, setZoomIndex] = useState(0)

  const seenKey = useMemo(() => (user?.email ? `axl_notifications_seen_${user.email}` : ''), [user?.email])
  const seenAt = useMemo(() => {
    if (!seenKey) return 0
    const raw = localStorage.getItem(seenKey)
    const parsed = Number(raw || 0)
    return Number.isFinite(parsed) ? parsed : 0
  }, [seenKey])

  const load = async () => {
    if (!user?.email) return
    setLoading(true)
    setError('')
    try {
      const { data, error: fetchError } = await supabase
        .from('deliveries')
        .select('*')
        .eq('sender_email', user.email)
        .in('status', ['delivered', 'cancelled'])
        .order('updated_at', { ascending: false })

      if (fetchError) throw fetchError
      const next = data || []
      setDeliveries(next)

      if (!selectedId && next.length > 0) {
        setSelectedId(String(next[0].id))
      }

      if (seenKey) {
        const latest = next.reduce((max, item) => {
          const ts = new Date(item.updated_at || item.created_at || 0).getTime()
          return Number.isFinite(ts) ? Math.max(max, ts) : max
        }, 0)
        if (latest > 0) localStorage.setItem(seenKey, String(latest))
      }
    } catch (err) {
      setError(err?.message || 'Failed to load notifications.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [user?.email])

  useEffect(() => {
    if (!user?.email || supabase.isMock) return

    const channel = supabase
      .channel(`notifications_${user.email}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deliveries' }, (payload) => {
        const next = payload?.new
        if (!next) return
        if (String(next.sender_email || '').toLowerCase() !== String(user.email || '').toLowerCase()) return
        if (next.status !== 'delivered' && next.status !== 'cancelled') return

        setDeliveries((prev) => {
          const without = prev.filter((item) => String(item.id) !== String(next.id))
          return [next, ...without].sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0))
        })
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [user?.email])

  const selected = deliveries.find((item) => String(item.id) === String(selectedId)) || null

  return (
    <main className="relative overflow-hidden bg-background min-h-screen">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div
          className="absolute inset-0 bg-cover bg-center lg:bg-fixed"
          style={{ backgroundImage: 'url(/track-bg.jpg)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/75 to-white/90" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto py-12 px-6 space-y-8">
        <div className="flex items-center justify-between gap-4">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-xs font-black text-primary hover:text-navy transition-colors">
            <ArrowLeft size={14} />
            <span>Back to Portal</span>
          </Link>
          <button
            type="button"
            onClick={load}
            className="bg-primary hover:bg-navy text-white px-4 py-2 rounded-2xl text-xs font-black transition-colors"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <header className="glass-panel rounded-3xl bg-white p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center flex-shrink-0">
                <Bell size={20} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-black text-text-muted">Notifications</p>
                <h1 className="text-2xl sm:text-3xl font-black text-primary tracking-tight">Receipts & Updates</h1>
                <p className="text-xs text-text-muted font-semibold mt-1 max-w-xl">
                  Delivered and cancelled receipts, saved here so you can always review past shipments.
                </p>
              </div>
            </div>
            <div className="bg-navy text-white rounded-2xl px-5 py-4 min-w-[220px]">
              <p className="text-[10px] uppercase tracking-widest font-black text-white/60">Total Receipts</p>
              <p className="text-2xl font-black tracking-tight mt-1">{loading ? '…' : deliveries.length}</p>
              <p className="text-[10px] font-black uppercase tracking-wider text-white/60 mt-2">
                New: {loading ? '…' : deliveries.filter((d) => new Date(d.updated_at || d.created_at || 0).getTime() > seenAt).length}
              </p>
            </div>
          </div>
        </header>

        {error && (
          <div className="bg-accent text-white rounded-2xl p-4 flex gap-3 items-start">
            <Bell size={18} className="text-white flex-shrink-0 mt-0.5" />
            <p className="text-sm font-black">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="glass-panel rounded-3xl p-10 bg-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mx-auto"></div>
            <p className="text-text-muted font-semibold text-sm mt-4">Loading notifications...</p>
          </div>
        ) : deliveries.length === 0 ? (
          <div className="glass-panel rounded-3xl p-10 bg-white text-center">
            <Bell className="w-16 h-16 mx-auto mb-4 text-primary opacity-15" />
            <h2 className="text-lg font-black text-primary">No receipts yet</h2>
            <p className="text-xs text-text-muted font-semibold mt-2 max-w-sm mx-auto">
              When an admin marks your package as delivered or cancelled, the receipt will appear here.
            </p>
            <Link to="/send" className="inline-flex items-center justify-center mt-6 bg-primary hover:bg-navy text-white px-6 py-3 rounded-2xl font-black text-sm transition-colors">
              Send a package
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            <div className="lg:col-span-2 glass-panel rounded-3xl bg-white overflow-hidden">
              <div className="px-6 py-5 border-b border-border flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-wider text-primary">Receipt Inbox</p>
                <p className="text-[10px] font-black uppercase tracking-wider text-text-muted">{deliveries.length}</p>
              </div>
              <div className="divide-y divide-border">
                {deliveries.map((item) => {
                  const isDelivered = item.status === 'delivered'
                  const isNew = new Date(item.updated_at || item.created_at || 0).getTime() > seenAt
                  const active = String(item.id) === String(selectedId)

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedId(String(item.id))}
                      className={`w-full text-left px-6 py-5 transition-colors ${active ? 'bg-navy/5' : 'hover:bg-navy/5'}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${isDelivered ? 'bg-status-delivered text-white' : 'bg-accent text-white'}`}>
                          {isDelivered ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-black text-primary truncate">{item.tracking_id}</p>
                            {isNew && (
                              <span className="text-[10px] font-black uppercase tracking-wider bg-primary text-white px-2 py-1 rounded-full">
                                New
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-text-muted font-semibold mt-1 leading-relaxed">
                            {isDelivered ? `Delivered to ${item.destination}` : 'Cancelled by administrator'}
                          </p>
                          <p className="text-[11px] text-text-muted font-semibold mt-2">{formatDate(item.updated_at || item.created_at)}</p>
                          <div className="mt-3">
                            <Link
                              to={`/track?id=${encodeURIComponent(String(item.tracking_id || '').toUpperCase())}`}
                              className="inline-flex items-center justify-center bg-white hover:bg-navy/5 text-primary px-4 py-2 rounded-2xl font-black text-xs transition-colors border border-border"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Open in tracking
                            </Link>
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="lg:col-span-3 space-y-6">
              {selected && (
                <DeliveryReceipt
                  delivery={selected}
                  onImageClick={(nextImages, index) => {
                    setZoomImages(nextImages || [])
                    setZoomIndex(index || 0)
                  }}
                />
              )}
            </div>
          </div>
        )}

        {zoomImages.length > 0 && (
          <div
            className="fixed inset-0 z-50 bg-navy/90 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setZoomImages([])}
          >
            <div className="relative max-w-4xl w-full max-h-full" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setZoomImages([])}
                className="absolute top-4 right-4 bg-navy hover:bg-white text-white hover:text-text p-2 rounded-full border border-navy transition-all"
              >
                <X size={20} />
              </button>

              {zoomImages.length > 1 && (
                <>
                  <button
                    onClick={() => setZoomIndex((prev) => (prev - 1 + zoomImages.length) % zoomImages.length)}
                    className="absolute top-1/2 -translate-y-1/2 left-4 bg-navy/70 hover:bg-white text-white hover:text-text p-2 rounded-full border border-navy transition-all"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setZoomIndex((prev) => (prev + 1) % zoomImages.length)}
                    className="absolute top-1/2 -translate-y-1/2 right-4 bg-navy/70 hover:bg-white text-white hover:text-text p-2 rounded-full border border-navy transition-all"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}

              <img
                src={zoomImages[zoomIndex]}
                alt="Package zoomed preview"
                className="rounded-2xl max-w-full max-h-[85vh] object-contain border border-navy mx-auto"
              />
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default Notifications
