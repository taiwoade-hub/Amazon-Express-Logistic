import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { Download, Edit2, Save, X, Search, Package, ShieldAlert, Eye, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { getDeliveryImages } from '../lib/deliveryImages'
import { format, formatDistanceToNow } from 'date-fns'
import AdminShell from '../components/AdminShell'

function formatRelativeDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${format(date, 'HH:mm')} • ${formatDistanceToNow(date, { addSuffix: true })}`
}

function Admin() {
  const { user, isAdmin, changeAdminEmail, getAdminEmail } = useAuth()
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editingStatus, setEditingStatus] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  
  const [zoomImages, setZoomImages] = useState([])
  const [zoomIndex, setZoomIndex] = useState(0)
  const [pendingEmail, setPendingEmail] = useState(null)
  const [sendingEmail, setSendingEmail] = useState(false)

  // Profile Edit States
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [emailEditSuccess, setEmailEditSuccess] = useState('')
  const [emailEditError, setEmailEditError] = useState('')
  const [showSettings, setShowSettings] = useState(false)

  const handleUpdateEmail = async (e) => {
    e.preventDefault()
    setEmailEditError('')
    setEmailEditSuccess('')
    try {
      const res = await changeAdminEmail(newAdminEmail)
      if (res.success) {
        setEmailEditSuccess('Admin email updated successfully. Use this email for your next login.')
        setTimeout(() => setEmailEditSuccess(''), 4000)
      } else {
        setEmailEditError(res.error || 'Failed to update admin email.')
      }
    } catch (err) {
      setEmailEditError('An unexpected error occurred.')
    }
  }

  useEffect(() => {
    if (isAdmin) {
      fetchDeliveries()

      // Set up realtime subscription
      const subscription = supabase
        .channel('admin_deliveries_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'deliveries' }, () => {
          fetchDeliveries()
        })
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [isAdmin])

  const fetchDeliveries = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('deliveries')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setDeliveries(data || [])
    } catch (err) {
      console.error('Error fetching deliveries:', err)
      setError('Failed to load courier shipments database.')
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = (delivery) => {
    setEditingId(delivery.id)
    setEditingStatus(delivery.status)
    setError('')
    setSuccess('')
  }

  const handleSaveStatus = async (deliveryId) => {
    try {
      setError('')
      setSuccess('')
      
      const { error: updateError } = await supabase
        .from('deliveries')
        .update({ 
          status: editingStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', deliveryId)

      if (updateError) throw updateError

      setSuccess('Status updated successfully')
      setEditingId(null)
      fetchDeliveries()
      if (editingStatus === 'picked_up' || editingStatus === 'delivered' || editingStatus === 'cancelled') {
        setPendingEmail({ deliveryId, status: editingStatus })
      } else {
        setPendingEmail(null)
      }
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Error updating status:', err)
      setError('Failed to update shipment status.')
    }
  }

  const sendPendingStatusEmail = async () => {
    if (!pendingEmail?.deliveryId || !pendingEmail?.status) return
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
    if (!apiBaseUrl) {
      setError('VITE_API_BASE_URL is not configured.')
      return
    }

    const status = pendingEmail.status
    const type = status === 'picked_up' ? 'approved' : status

    try {
      setSendingEmail(true)
      setError('')
      setSuccess('')

      const headers = { 'content-type': 'application/json' }
      if (!supabase.isMock && supabase.auth) {
        const { data } = await supabase.auth.getSession()
        const token = data?.session?.access_token
        if (token) {
          headers.Authorization = `Bearer ${token}`
        }
      }

      if (!headers.Authorization) {
        headers['x-admin-email'] = user?.email || ''
        headers['x-admin-password'] = '##5351235admin'
      }

      const resp = await fetch(`${apiBaseUrl.replace(/\/+$/, '')}/admin/send-status-email`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ deliveryId: pendingEmail.deliveryId, type })
      })

      let payload = null
      try {
        payload = await resp.json()
      } catch {
      }

      if (!resp.ok) {
        setError(payload?.error || 'Failed to send email.')
        return
      }

      setSuccess('Email sent successfully')
      setPendingEmail(null)
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setError('Failed to send email.')
    } finally {
      setSendingEmail(false)
    }
  }

  const downloadReceiptPdf = async (trackingId) => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
    if (!apiBaseUrl) {
      setError('VITE_API_BASE_URL is not configured.')
      return
    }

    const cleanTrackingId = String(trackingId || '').trim()
    if (!cleanTrackingId) return

    try {
      setError('')
      setSuccess('')

      const headers = {}
      if (!supabase.isMock && supabase.auth) {
        const { data } = await supabase.auth.getSession()
        const token = data?.session?.access_token
        if (token) headers.Authorization = `Bearer ${token}`
      }

      if (!headers.Authorization) {
        headers['x-admin-email'] = user?.email || ''
        headers['x-admin-password'] = '##5351235admin'
      }

      const url = `${apiBaseUrl.replace(/\/+$/, '')}/admin/receipts/${encodeURIComponent(cleanTrackingId)}.pdf`
      const resp = await fetch(url, { headers })
      if (!resp.ok) {
        let payload = null
        try {
          payload = await resp.json()
        } catch {
        }
        setError(payload?.error || 'Failed to download PDF.')
        return
      }

      const blob = await resp.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = `receipt-${cleanTrackingId}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(objectUrl)
    } catch {
      setError('Failed to download PDF.')
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditingStatus('')
  }

  // Delete option for admin convenience
  const handleDelete = async (deliveryId) => {
    if (!window.confirm('Are you sure you want to delete this delivery record from the registry?')) return
    try {
      setError('')
      setSuccess('')
      const { error: deleteError } = await supabase
        .from('deliveries')
        .delete()
        .eq('id', deliveryId)

      if (deleteError) throw deleteError
      
      setSuccess('Record deleted successfully')
      fetchDeliveries()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Delete error:', err)
      setError('Failed to delete shipment record.')
    }
  }

  const statusOptions = ['processing', 'picked_up', 'in_transit', 'delivered', 'cancelled']
  const statusLabels = {
    processing: 'Processing',
    picked_up: 'Picked Up',
    in_transit: 'In Transit',
    delivered: 'Delivered',
    cancelled: 'Cancelled'
  }

  const statusColors = {
    processing: 'text-white bg-status-pending border-status-pending font-black uppercase tracking-wider px-2 py-0.5 rounded text-[10px]',
    picked_up: 'text-white bg-status-transit border-status-transit font-black uppercase tracking-wider px-2 py-0.5 rounded text-[10px]',
    in_transit: 'text-white bg-status-transit border-status-transit font-black uppercase tracking-wider px-2 py-0.5 rounded text-[10px]',
    delivered: 'text-white bg-status-delivered border-status-delivered font-black uppercase tracking-wider px-2 py-0.5 rounded text-[10px]',
    cancelled: 'text-white bg-accent border-accent line-through font-black uppercase tracking-wider px-2 py-0.5 rounded text-[10px]'
  }

  // Security check fallback
  if (!isAdmin) {
    return (
      <main className="min-h-screen py-20 px-6 flex items-center justify-center bg-white">
        <div className="glass-panel rounded-3xl p-8 border-navy bg-navy text-center max-w-sm text-white shadow-2xl">
          <ShieldAlert className="w-16 h-16 text-white mx-auto mb-4" />
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Access Denied</h2>
          <p className="text-white/80 font-semibold text-sm mt-4">
            Your account credentials do not grant access to the system administrator dashboard.
          </p>
        </div>
      </main>
    )
  }

  // Filter deliveries
  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesSearch = 
      delivery.tracking_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.sender_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.receiver_name.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || delivery.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Stats summaries
  const totalCount = deliveries.length
  const processingCount = deliveries.filter(d => d.status === 'processing').length
  const transitCount = deliveries.filter(d => d.status === 'in_transit').length
  const deliveredCount = deliveries.filter(d => d.status === 'delivered').length

  return (
    <AdminShell
      title="Shipments"
      subtitle="Manage shipment records, update live statuses, and trigger customer notifications."
      actions={
        <button
          type="button"
          onClick={() => {
            setShowSettings(!showSettings)
            setNewAdminEmail(getAdminEmail ? getAdminEmail() : user?.email || '')
          }}
          className="bg-primary hover:bg-navy text-white px-4 py-2 rounded-2xl text-xs font-black transition-colors"
        >
          {showSettings ? 'Close settings' : 'Settings'}
        </button>
      }
    >
      <div className="space-y-6">
        {showSettings && (
          <div className="rounded-3xl border border-border bg-background p-5">
            <h2 className="text-sm font-black text-primary">Administrator Email</h2>
            <p className="text-xs text-text-muted font-semibold mt-1 max-w-2xl">
              Update the system administrator email address used for administrator checks and sign-in.
            </p>

            <form onSubmit={handleUpdateEmail} className="mt-4 flex flex-col sm:flex-row gap-3 items-end max-w-xl">
              <div className="w-full space-y-1">
                <label className="block text-[10px] font-black text-primary uppercase tracking-wider">Admin Email</label>
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full px-4 py-3 bg-white border border-border rounded-2xl focus:outline-none focus:border-border-active transition-colors text-sm placeholder-black/30 text-primary font-semibold"
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-primary hover:bg-navy text-white px-6 py-3 rounded-2xl text-sm font-black transition-colors flex-shrink-0"
              >
                Save
              </button>
            </form>

            {emailEditError && <p className="text-xs text-accent mt-3 font-black">{emailEditError}</p>}
            {emailEditSuccess && <p className="text-xs text-primary mt-3 font-black">{emailEditSuccess}</p>}
          </div>
        )}

        {error && (
          <div className="bg-accent text-white rounded-2xl p-4 text-sm font-black">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-status-delivered text-white rounded-2xl p-4 text-sm font-black">
            {success}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-3xl border border-border bg-white p-5">
            <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Total Shipments</p>
            <p className="text-3xl font-black text-primary mt-1">{loading ? '...' : totalCount}</p>
          </div>
          <div className="rounded-3xl border border-border bg-white p-5">
            <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Pending Processing</p>
            <p className="text-3xl font-black text-primary mt-1">{loading ? '...' : processingCount}</p>
          </div>
          <div className="rounded-3xl border border-border bg-white p-5">
            <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Active Transit</p>
            <p className="text-3xl font-black text-primary mt-1">{loading ? '...' : transitCount}</p>
          </div>
          <div className="rounded-3xl border border-border bg-white p-5">
            <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Delivered Packages</p>
            <p className="text-3xl font-black text-primary mt-1">{loading ? '...' : deliveredCount}</p>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-white p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:max-w-md">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-text-muted">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Search tracking ID, sender, receiver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-border rounded-2xl focus:outline-none focus:border-border-active transition-colors text-sm placeholder-black/30 text-primary font-semibold"
            />
          </div>

          <div className="flex bg-background rounded-2xl p-1 w-full md:w-auto overflow-x-auto gap-1 border border-border">
            {['all', 'processing', 'picked_up', 'in_transit', 'delivered', 'cancelled'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-colors ${
                  statusFilter === status ? 'bg-white text-primary' : 'text-text-muted hover:text-primary'
                }`}
              >
                {status === 'all' ? 'All' : statusLabels[status]}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl overflow-hidden bg-white border border-border">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
            <p className="text-text-muted font-semibold text-sm">Synchronizing shipments database...</p>
          </div>
        ) : filteredDeliveries.length === 0 ? (
          <div className="py-20 text-center max-w-sm mx-auto px-6">
            <Package className="w-16 h-16 mx-auto mb-4 text-primary opacity-15" />
            <h3 className="text-lg font-black text-primary mb-1">No Shipments Found</h3>
            <p className="text-xs text-text-muted font-semibold mt-1">There are no package records matching the selected search query.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-navy bg-navy text-xs font-black uppercase tracking-wider text-white">
                    <th className="py-4 px-6">Tracking Details</th>
                    <th className="py-4 px-6">Sender Details</th>
                    <th className="py-4 px-6">Receiver Details</th>
                    <th className="py-4 px-6">Transit Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm text-text bg-white">
                  {filteredDeliveries.map((delivery) => {
                    const images = getDeliveryImages(delivery.package_image)
                    const mainImage = images[0]
                    const extraCount = Math.max(0, images.length - 1)
                    const showInlineEmail = String(pendingEmail?.deliveryId || '') === String(delivery.id)

                    return [
                    <tr key={delivery.id} className="hover:bg-navy/5 transition-all">
                      {/* Tracking ID & Picture */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          {mainImage ? (
                            <div 
                              className="relative cursor-zoom-in group flex-shrink-0"
                              onClick={() => {
                                setZoomImages(images)
                                setZoomIndex(0)
                              }}
                              title="Click to zoom image"
                            >
                              <img 
                                src={mainImage} 
                                alt="Package Thumbnail" 
                                className="w-12 h-12 rounded-xl object-cover border border-border group-hover:opacity-90 transition-all bg-white"
                              />
                              {extraCount > 0 && (
                                <div className="absolute -bottom-2 -right-2 bg-navy text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-navy">
                                  +{extraCount}
                                </div>
                              )}
                              <div className="absolute inset-0 bg-navy/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-xl transition-all">
                                <Eye size={12} className="text-white" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-navy border border-navy flex items-center justify-center text-white flex-shrink-0">
                              <Package size={20} />
                            </div>
                          )}
                          <div>
                            <div className="font-black text-text">{delivery.tracking_id}</div>
                            <div className="text-[10px] text-text-muted font-black uppercase mt-0.5">{delivery.package_type}</div>
                            <div className="text-[10px] text-text-muted font-black uppercase mt-0.5">{formatRelativeDateTime(delivery.created_at)}</div>
                          </div>
                        </div>
                      </td>

                      {/* Sender */}
                      <td className="py-4 px-6">
                        <div className="font-black">{delivery.sender_name}</div>
                        <div className="text-xs text-text-muted font-semibold">{delivery.sender_email || 'Guest Sender'}</div>
                        <div className="text-xs text-text-muted font-semibold truncate max-w-[180px]">{delivery.pickup_location}</div>
                      </td>

                      {/* Receiver */}
                      <td className="py-4 px-6">
                        <div className="font-black">{delivery.receiver_name}</div>
                        <div className="text-xs text-text-muted font-semibold">{delivery.receiver_phone || delivery.phone}</div>
                        <div className="text-xs text-text-muted font-semibold truncate max-w-[180px]">{delivery.destination}</div>
                      </td>

                      {/* Status select editor */}
                      <td className="py-4 px-6">
                        {editingId === delivery.id ? (
                          <select
                            value={editingStatus}
                            onChange={(e) => setEditingStatus(e.target.value)}
                            className="bg-white border border-border text-text font-black rounded-lg px-3 py-1.5 focus:outline-none focus:border-border-active text-xs"
                          >
                            {statusOptions.map(status => (
                              <option key={status} value={status}>
                                {statusLabels[status]}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColors[delivery.status]}`}>
                            {statusLabels[delivery.status]}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex gap-2 justify-end">
                          {editingId === delivery.id ? (
                            <>
                              <button
                                onClick={() => handleSaveStatus(delivery.id)}
                                className="bg-navy hover:bg-white text-white hover:text-text p-2 rounded-lg border border-navy transition-all"
                                title="Save"
                              >
                                <Save size={14} />
                              </button>
                              <button
                                onClick={handleCancel}
                                className="bg-white hover:bg-navy text-text hover:text-white p-2 rounded-lg border border-navy transition-all"
                                title="Cancel"
                              >
                                <X size={14} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => downloadReceiptPdf(delivery.tracking_id)}
                                className="bg-white hover:bg-navy text-text hover:text-white p-2 rounded-lg border border-navy transition-all"
                                title="Download PDF"
                              >
                                <Download size={14} />
                              </button>
                              <button
                                onClick={() => handleEditClick(delivery)}
                                className="bg-navy hover:bg-white text-white hover:text-text p-2 rounded-lg border border-navy transition-all"
                                title="Edit Status"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDelete(delivery.id)}
                                className="bg-white hover:bg-navy text-text hover:text-white p-2 rounded-lg border border-navy transition-all"
                                title="Delete Record"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    ,
                    showInlineEmail ? (
                      <tr key={`${delivery.id}-email`} className="bg-navy/5">
                        <td colSpan={5} className="px-6 pb-6">
                          <div className="glass-panel rounded-3xl p-5 bg-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-border">
                            <div>
                              <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Manual Email Action</p>
                              <p className="text-base font-black text-primary mt-1">
                                {pendingEmail.status === 'picked_up' ? 'Send approval email to customer' : pendingEmail.status === 'cancelled' ? 'Send cancellation email to customer' : 'Send delivered + receipt email to customer'}
                              </p>
                              <p className="text-xs text-text-muted font-semibold mt-1">
                                This is manual to prevent accidental sending. You can click it once (idempotency is enabled).
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setPendingEmail(null)}
                                disabled={sendingEmail}
                                className="bg-white hover:bg-navy text-text hover:text-white px-5 py-3 rounded-2xl text-sm font-black transition-colors border border-border disabled:opacity-60"
                              >
                                Dismiss
                              </button>
                              <button
                                type="button"
                                onClick={sendPendingStatusEmail}
                                disabled={sendingEmail}
                                className="bg-primary hover:bg-navy text-white px-6 py-3 rounded-2xl text-sm font-black transition-colors disabled:opacity-60"
                              >
                                {sendingEmail ? 'Sending…' : 'Send email now'}
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null
                    ].filter(Boolean)
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-border">
              {filteredDeliveries.map((delivery) => {
                const images = getDeliveryImages(delivery.package_image)
                const mainImage = images[0]
                const extraCount = Math.max(0, images.length - 1)
                const showInlineEmail = String(pendingEmail?.deliveryId || '') === String(delivery.id)

                return (
                <div key={delivery.id} className="p-6 space-y-4 bg-white">
                  {/* Header: ID, Image & Actions */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex gap-3">
                      {mainImage ? (
                        <div className="relative">
                          <img 
                            src={mainImage} 
                            alt="Package Preview" 
                            onClick={() => {
                              setZoomImages(images)
                              setZoomIndex(0)
                            }}
                            className="w-14 h-14 rounded-xl object-cover border border-border bg-white cursor-zoom-in"
                          />
                          {extraCount > 0 && (
                            <div className="absolute -bottom-2 -right-2 bg-navy text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-navy">
                              +{extraCount}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-navy border border-navy flex items-center justify-center text-white flex-shrink-0">
                          <Package size={24} />
                        </div>
                      )}
                      <div>
                        <div className="font-black text-text text-base">{delivery.tracking_id}</div>
                        <div className="text-xs text-text-muted font-black uppercase tracking-wider mt-0.5">{delivery.package_type} Courier</div>
                        <div className="text-[10px] text-text-muted font-black uppercase tracking-wider mt-0.5">{formatRelativeDateTime(delivery.created_at)}</div>
                      </div>
                    </div>
                    
                    {/* Inline edit controller for mobile */}
                    <div className="flex gap-1">
                      {editingId === delivery.id ? (
                        <>
                          <button
                            onClick={() => handleSaveStatus(delivery.id)}
                            className="bg-navy text-white p-2 rounded-lg border border-navy"
                          >
                            <Save size={14} />
                          </button>
                          <button
                            onClick={handleCancel}
                            className="bg-white text-text p-2 rounded-lg border border-navy"
                          >
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => downloadReceiptPdf(delivery.tracking_id)}
                            className="bg-white text-text p-2 rounded-lg border border-navy"
                          >
                            <Download size={14} />
                          </button>
                          <button
                            onClick={() => handleEditClick(delivery)}
                            className="bg-navy text-white p-2 rounded-lg border border-navy"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(delivery.id)}
                            className="bg-white text-text p-2 rounded-lg border border-navy"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Route & Contact info */}
                  <div className="bg-navy border border-navy rounded-2xl p-4 space-y-3 text-xs text-white">
                    <div className="grid grid-cols-2 gap-2 pb-2.5 border-b border-white/20">
                      <div>
                        <p className="text-white/60 font-black uppercase tracking-wider mb-0.5">Sender</p>
                        <p className="font-black text-white">{delivery.sender_name}</p>
                        <p className="text-[10px] text-white/60 truncate">{delivery.sender_email || 'Guest'}</p>
                      </div>
                      <div>
                        <p className="text-white/60 font-black uppercase tracking-wider mb-0.5">Receiver</p>
                        <p className="font-black text-white">{delivery.receiver_name}</p>
                        <p className="text-[10px] text-white/60">{delivery.receiver_phone || delivery.phone}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-white/60 font-black uppercase tracking-wider mb-0.5">From</p>
                        <p className="font-black text-white truncate">{delivery.pickup_location}</p>
                      </div>
                      <div>
                        <p className="text-white/60 font-black uppercase tracking-wider mb-0.5">Destination</p>
                        <p className="font-black text-white truncate">{delivery.destination}</p>
                      </div>
                    </div>
                  </div>

                  {/* Status update widget */}
                  <div>
                    {editingId === delivery.id ? (
                      <div className="space-y-1">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-text">Modify Status</label>
                        <select
                          value={editingStatus}
                          onChange={(e) => setEditingStatus(e.target.value)}
                          className="w-full bg-white border border-border text-text font-black rounded-xl px-3 py-2.5 text-xs"
                        >
                          {statusOptions.map(status => (
                            <option key={status} value={status}>
                              {statusLabels[status]}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-text font-black">Delivery Progress:</span>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColors[delivery.status]}`}>
                          {statusLabels[delivery.status]}
                        </span>
                      </div>
                    )}
                  </div>

                  {showInlineEmail && (
                    <div className="glass-panel rounded-3xl p-5 bg-white shadow-xl border border-border">
                      <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Manual Email Action</p>
                      <p className="text-base font-black text-primary mt-1">
                        {pendingEmail.status === 'picked_up' ? 'Send approval email to customer' : pendingEmail.status === 'cancelled' ? 'Send cancellation email to customer' : 'Send delivered + receipt email to customer'}
                      </p>
                      <p className="text-xs text-text-muted font-semibold mt-1">
                        This is manual to prevent accidental sending. You can click it once (idempotency is enabled).
                      </p>
                      <div className="mt-4 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPendingEmail(null)}
                          disabled={sendingEmail}
                          className="flex-1 bg-white hover:bg-navy text-text hover:text-white px-4 py-3 rounded-2xl text-sm font-black transition-colors border border-border disabled:opacity-60"
                        >
                          Dismiss
                        </button>
                        <button
                          type="button"
                          onClick={sendPendingStatusEmail}
                          disabled={sendingEmail}
                          className="flex-1 bg-primary hover:bg-navy text-white px-4 py-3 rounded-2xl text-sm font-black transition-colors disabled:opacity-60"
                        >
                          {sendingEmail ? 'Sending…' : 'Send email'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Full zoom Image Modal */}
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

            {zoomImages.length > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                {zoomImages.map((src, index) => (
                  <button
                    key={`${src}-${index}`}
                    type="button"
                    onClick={() => setZoomIndex(index)}
                    className={`w-14 h-14 rounded-xl overflow-hidden border transition-colors ${
                      index === zoomIndex ? 'border-white' : 'border-white/20 hover:border-white/60'
                    }`}
                  >
                    <img src={src} alt={`Thumb ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      </div>
    </AdminShell>
  )
}

export default Admin
