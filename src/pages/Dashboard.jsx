import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { Bell, Plus, Package, Search, Copy, Check, Eye } from 'lucide-react'

function Dashboard() {
  const { user } = useAuth()
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [copiedId, setCopiedId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user?.email) {
      fetchUserDeliveries()
    }
  }, [user])

  const fetchUserDeliveries = async () => {
    try {
      setLoading(true)
      setError('')
      const { data, error: fetchError } = await supabase
        .from('deliveries')
        .select('*')
        .eq('sender_email', user.email)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setDeliveries(data || [])
    } catch (err) {
      console.error('Error loading user shipments:', err)
      setError('Failed to load your packages.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (id) => {
    navigator.clipboard.writeText(id)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const statusLabels = {
    processing: 'Processing',
    picked_up: 'Picked Up',
    in_transit: 'In Transit',
    delivered: 'Delivered',
    cancelled: 'Cancelled'
  }

  const statusPillClass = (status) => {
    if (status === 'cancelled') return 'bg-accent text-white line-through'
    if (status === 'delivered') return 'bg-status-delivered text-white'
    if (status === 'processing') return 'bg-status-pending text-white'
    return 'bg-status-transit text-white'
  }

  // Filter & Search deliveries
  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesSearch = 
      delivery.tracking_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.receiver_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.destination.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'in_transit'
        ? ['processing', 'picked_up', 'in_transit'].includes(delivery.status)
        : delivery.status === statusFilter)

    return matchesSearch && matchesStatus
  })

  // Stats summaries
  const totalShipments = deliveries.length
  const activeShipments = deliveries.filter(d => ['processing', 'picked_up', 'in_transit'].includes(d.status)).length
  const completedShipments = deliveries.filter(d => d.status === 'delivered').length

  return (
    <main className="min-h-screen py-10 px-6 max-w-6xl mx-auto bg-background">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-primary tracking-tight">My Deliveries</h1>
          <p className="text-text-muted mt-1 font-semibold">Hello, {user?.name}. Track and manage your sent packages.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Link
            to="/notifications"
            className="inline-flex items-center justify-center gap-2 bg-white hover:bg-navy/5 text-primary px-5 py-3 rounded-2xl font-black transition-colors border border-border"
          >
            <Bell size={18} />
            <span>Inbox</span>
          </Link>
          <Link
            to="/send"
            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-navy text-white px-5 py-3 rounded-2xl font-black transition-colors"
          >
            <Plus size={18} />
            <span>Send a Package</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-accent text-white rounded-2xl p-4 mb-6 text-sm font-black">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="glass-panel rounded-3xl p-5 bg-white">
          <p className="text-[11px] font-black uppercase tracking-wider text-text-muted">Total</p>
          <p className="text-2xl font-black text-primary mt-1">{loading ? '...' : totalShipments}</p>
        </div>
        <div className="glass-panel rounded-3xl p-5 bg-white">
          <p className="text-[11px] font-black uppercase tracking-wider text-text-muted">In Transit</p>
          <p className="text-2xl font-black text-primary mt-1">{loading ? '...' : activeShipments}</p>
        </div>
        <div className="glass-panel rounded-3xl p-5 bg-white col-span-2 sm:col-span-1">
          <p className="text-[11px] font-black uppercase tracking-wider text-text-muted">Delivered</p>
          <p className="text-2xl font-black text-primary mt-1">{loading ? '...' : completedShipments}</p>
        </div>
      </div>

      <div className="glass-panel rounded-3xl p-4 bg-white mb-6 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="relative w-full md:max-w-md">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-text-muted">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Search by tracking ID, receiver, or destination..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border focus:outline-none focus:border-border-active text-sm font-semibold"
          />
        </div>

        <div className="flex bg-navy/5 rounded-2xl p-1 w-full md:w-auto border border-border">
          {[
            { key: 'all', label: 'All' },
            { key: 'in_transit', label: 'In Transit' },
            { key: 'delivered', label: 'Delivered' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-sm font-black transition-colors ${
                statusFilter === tab.key ? 'bg-white text-primary' : 'text-text-muted hover:text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
          <p className="text-text-muted font-semibold text-sm">Loading deliveries...</p>
        </div>
      ) : filteredDeliveries.length === 0 ? (
        <div className="glass-panel rounded-3xl p-10 bg-white text-center">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 text-white">
            <Package size={24} />
          </div>
            <h3 className="text-lg font-black text-primary">No Deliveries Found</h3>
          <p className="text-text-muted font-semibold text-sm mt-2 max-w-sm mx-auto">
            {deliveries.length === 0 ? "You haven't created any deliveries yet." : 'No deliveries match your current filters.'}
          </p>
          {deliveries.length === 0 && (
            <Link
              to="/send"
                className="inline-flex items-center justify-center bg-primary hover:bg-navy text-white px-6 py-3 rounded-2xl font-black transition-colors mt-6"
            >
              Send Your First Package
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDeliveries.map((delivery) => (
            <div key={delivery.id} className="glass-panel rounded-3xl p-5 bg-white flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-black text-primary">{delivery.tracking_id}</p>
                  <button
                    onClick={() => handleCopy(delivery.tracking_id)}
                    className="p-1 rounded-lg hover:bg-navy/5 text-text-muted transition-colors"
                    title="Copy Tracking ID"
                  >
                    {copiedId === delivery.tracking_id ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
                <p className="text-sm font-semibold text-text-muted mt-1 truncate">
                  {delivery.pickup_location} → {delivery.destination}
                </p>
                <p className="text-xs font-semibold text-text-muted mt-1">
                  {new Date(delivery.created_at).toLocaleString()}
                </p>
              </div>

              <div className="flex flex-col items-end gap-3 flex-shrink-0">
                <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${statusPillClass(delivery.status)}`}>
                  {statusLabels[delivery.status]}
                </span>
                <Link
                  to={`/track?id=${delivery.tracking_id}`}
                  className="inline-flex items-center gap-1.5 bg-primary hover:bg-navy text-white px-4 py-2 rounded-2xl text-sm font-black transition-colors"
                >
                  <Eye size={16} />
                  <span>Track</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-10 glass-panel rounded-3xl p-6 bg-white flex items-center justify-between gap-4">
        <div>
          <p className="font-black text-primary">Ship with Confidence</p>
          <p className="text-sm text-text-muted font-semibold mt-1">Create a new delivery in seconds and share the tracking ID.</p>
        </div>
        <Link to="/send" className="bg-primary hover:bg-navy text-white px-5 py-3 rounded-2xl font-black transition-colors">
          Send a Package
        </Link>
      </div>
    </main>
  )
}

export default Dashboard
