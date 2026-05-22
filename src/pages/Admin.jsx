import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { Edit2, Save, X, Search, Package, ShieldAlert, Image as ImageIcon, Eye, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { getDeliveryImages } from '../lib/deliveryImages'

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
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Error updating status:', err)
      setError('Failed to update shipment status.')
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
    processing: 'text-white bg-black border-black font-black uppercase tracking-wider px-2 py-0.5 rounded text-[10px]',
    picked_up: 'text-black bg-white border-black border-2 font-black uppercase tracking-wider px-2 py-0.5 rounded text-[10px]',
    in_transit: 'text-black bg-white border-black border-2 font-black uppercase tracking-wider px-2 py-0.5 rounded text-[10px]',
    delivered: 'text-black bg-white border-black border-4 font-black uppercase tracking-wider px-2 py-0.5 rounded text-[10px]',
    cancelled: 'text-white bg-black border-black line-through font-black uppercase tracking-wider px-2 py-0.5 rounded text-[10px]'
  }

  // Security check fallback
  if (!isAdmin) {
    return (
      <main className="min-h-screen py-20 px-6 flex items-center justify-center bg-white">
        <div className="glass-panel rounded-3xl p-8 border-black bg-black text-center max-w-sm text-white shadow-2xl">
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
    <main className="min-h-screen py-10 px-6 max-w-7xl mx-auto space-y-8 bg-background">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-primary tracking-tight flex flex-wrap items-center gap-3">
            <span>Admin Control Center</span>
            <span className="text-xs uppercase tracking-widest bg-primary text-white px-3 py-1 rounded-full font-black">Secured Mode</span>
          </h1>
          <p className="text-text-muted mt-1 font-semibold">Manage global shipment tracking registries, update live package statuses, and analyze courier performance.</p>
        </div>
        <button
          onClick={() => {
            setShowSettings(!showSettings)
            setNewAdminEmail(getAdminEmail ? getAdminEmail() : user?.email || '')
          }}
          className="bg-primary hover:bg-black text-white px-5 py-2.5 rounded-2xl text-sm font-black transition-colors shadow-sm"
        >
          {showSettings ? 'Close Settings' : 'Admin Profile Settings'}
        </button>
      </div>

      {/* Profile Settings Panel */}
      {showSettings && (
        <div className="glass-panel rounded-3xl p-6 bg-white shadow-xl">
          <h2 className="text-lg font-black text-primary mb-2">Change Administrator Email Address</h2>
          <p className="text-xs text-text-muted font-semibold mb-4">Update the system administrator email address. This will change your login identity and session profile.</p>
          
          <form onSubmit={handleUpdateEmail} className="flex flex-col sm:flex-row gap-4 items-end max-w-lg">
            <div className="w-full space-y-1">
              <label className="block text-[10px] font-black text-primary uppercase tracking-wider">Admin Email</label>
              <input
                type="email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="new-admin@gmail.com"
                className="w-full px-4 py-2 bg-white border border-border rounded-xl focus:outline-none focus:border-border-active transition-colors text-sm placeholder-black/30 text-primary font-semibold"
                required
              />
            </div>
            <button
              type="submit"
              className="bg-primary hover:bg-black text-white px-6 py-2.5 rounded-2xl text-sm font-black transition-colors flex-shrink-0"
            >
              Update Email
            </button>
          </form>

          {emailEditError && <p className="text-xs text-primary mt-2 font-black">{emailEditError}</p>}
          {emailEditSuccess && <p className="text-xs text-primary mt-2 font-black">{emailEditSuccess}</p>}
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="bg-primary text-white rounded-2xl p-4 text-sm font-black">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-primary text-white rounded-2xl p-4 text-sm font-black">
          {success}
        </div>
      )}

      {/* Stats Board */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel rounded-3xl p-5 bg-white">
          <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Total Shipments</p>
          <p className="text-3xl font-black text-primary mt-1">{loading ? '...' : totalCount}</p>
        </div>
        <div className="glass-panel rounded-3xl p-5 bg-white">
          <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Pending Processing</p>
          <p className="text-3xl font-black text-primary mt-1">{loading ? '...' : processingCount}</p>
        </div>
        <div className="glass-panel rounded-3xl p-5 bg-white">
          <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Active Transit</p>
          <p className="text-3xl font-black text-primary mt-1">{loading ? '...' : transitCount}</p>
        </div>
        <div className="glass-panel rounded-3xl p-5 bg-white">
          <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Delivered Packages</p>
          <p className="text-3xl font-black text-primary mt-1">{loading ? '...' : deliveredCount}</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="glass-panel rounded-3xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center bg-white">
        
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-text-muted">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Search tracking ID, sender, receiver name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-border rounded-2xl focus:outline-none focus:border-border-active transition-colors text-sm placeholder-black/30 text-primary font-semibold"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-black/5 rounded-2xl p-1 w-full md:w-auto overflow-x-auto gap-1 border border-border">
          {['all', 'processing', 'picked_up', 'in_transit', 'delivered', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-colors ${
                statusFilter === status 
                  ? 'bg-white text-primary' 
                  : 'text-text-muted hover:text-primary'
              }`}
            >
              {status === 'all' ? 'All' : statusLabels[status]}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table/Grid */}
      <div className="glass-panel rounded-3xl overflow-hidden bg-white">
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
                  <tr className="border-b border-black bg-black text-xs font-black uppercase tracking-wider text-white">
                    <th className="py-4 px-6">Tracking Details</th>
                    <th className="py-4 px-6">Sender Details</th>
                    <th className="py-4 px-6">Receiver Details</th>
                    <th className="py-4 px-6">Transit Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black text-sm text-black bg-white">
                  {filteredDeliveries.map((delivery) => {
                    const images = getDeliveryImages(delivery.package_image)
                    const mainImage = images[0]
                    const extraCount = Math.max(0, images.length - 1)

                    return (
                    <tr key={delivery.id} className="hover:bg-black/5 transition-all">
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
                                className="w-12 h-12 rounded-xl object-cover border border-black group-hover:opacity-90 transition-all bg-white"
                              />
                              {extraCount > 0 && (
                                <div className="absolute -bottom-2 -right-2 bg-black text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-black">
                                  +{extraCount}
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-xl transition-all">
                                <Eye size={12} className="text-white" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-black border border-black flex items-center justify-center text-white flex-shrink-0">
                              <Package size={20} />
                            </div>
                          )}
                          <div>
                            <div className="font-black text-black">{delivery.tracking_id}</div>
                            <div className="text-[10px] text-black opacity-60 font-black uppercase mt-0.5">{delivery.package_type}</div>
                          </div>
                        </div>
                      </td>

                      {/* Sender */}
                      <td className="py-4 px-6">
                        <div className="font-black">{delivery.sender_name}</div>
                        <div className="text-xs text-black opacity-70 font-semibold">{delivery.sender_email || 'Guest Sender'}</div>
                        <div className="text-xs text-black opacity-70 font-semibold truncate max-w-[180px]">{delivery.pickup_location}</div>
                      </td>

                      {/* Receiver */}
                      <td className="py-4 px-6">
                        <div className="font-black">{delivery.receiver_name}</div>
                        <div className="text-xs text-black opacity-70 font-semibold">{delivery.phone}</div>
                        <div className="text-xs text-black opacity-70 font-semibold truncate max-w-[180px]">{delivery.destination}</div>
                      </td>

                      {/* Status select editor */}
                      <td className="py-4 px-6">
                        {editingId === delivery.id ? (
                          <select
                            value={editingStatus}
                            onChange={(e) => setEditingStatus(e.target.value)}
                            className="bg-white border border-black text-black font-black rounded-lg px-3 py-1.5 focus:outline-none focus:border-black text-xs"
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
                                className="bg-black hover:bg-white text-white hover:text-black p-2 rounded-lg border border-black transition-all"
                                title="Save"
                              >
                                <Save size={14} />
                              </button>
                              <button
                                onClick={handleCancel}
                                className="bg-white hover:bg-black text-black hover:text-white p-2 rounded-lg border border-black transition-all"
                                title="Cancel"
                              >
                                <X size={14} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditClick(delivery)}
                                className="bg-black hover:bg-white text-white hover:text-black p-2 rounded-lg border border-black transition-all"
                                title="Edit Status"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDelete(delivery.id)}
                                className="bg-white hover:bg-black text-black hover:text-white p-2 rounded-lg border border-black transition-all"
                                title="Delete Record"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-black">
              {filteredDeliveries.map((delivery) => {
                const images = getDeliveryImages(delivery.package_image)
                const mainImage = images[0]
                const extraCount = Math.max(0, images.length - 1)

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
                            className="w-14 h-14 rounded-xl object-cover border border-black bg-white cursor-zoom-in"
                          />
                          {extraCount > 0 && (
                            <div className="absolute -bottom-2 -right-2 bg-black text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-black">
                              +{extraCount}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-black border border-black flex items-center justify-center text-white flex-shrink-0">
                          <Package size={24} />
                        </div>
                      )}
                      <div>
                        <div className="font-black text-black text-base">{delivery.tracking_id}</div>
                        <div className="text-xs text-black opacity-60 font-black uppercase tracking-wider mt-0.5">{delivery.package_type} Courier</div>
                      </div>
                    </div>
                    
                    {/* Inline edit controller for mobile */}
                    <div className="flex gap-1">
                      {editingId === delivery.id ? (
                        <>
                          <button
                            onClick={() => handleSaveStatus(delivery.id)}
                            className="bg-black text-white p-2 rounded-lg border border-black"
                          >
                            <Save size={14} />
                          </button>
                          <button
                            onClick={handleCancel}
                            className="bg-white text-black p-2 rounded-lg border border-black"
                          >
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEditClick(delivery)}
                            className="bg-black text-white p-2 rounded-lg border border-black"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(delivery.id)}
                            className="bg-white text-black p-2 rounded-lg border border-black"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Route & Contact info */}
                  <div className="bg-black border border-black rounded-2xl p-4 space-y-3 text-xs text-white">
                    <div className="grid grid-cols-2 gap-2 pb-2.5 border-b border-white/20">
                      <div>
                        <p className="text-white/60 font-black uppercase tracking-wider mb-0.5">Sender</p>
                        <p className="font-black text-white">{delivery.sender_name}</p>
                        <p className="text-[10px] text-white/60 truncate">{delivery.sender_email || 'Guest'}</p>
                      </div>
                      <div>
                        <p className="text-white/60 font-black uppercase tracking-wider mb-0.5">Receiver</p>
                        <p className="font-black text-white">{delivery.receiver_name}</p>
                        <p className="text-[10px] text-white/60">{delivery.phone}</p>
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
                        <label className="block text-[10px] font-black uppercase tracking-wider text-black">Modify Status</label>
                        <select
                          value={editingStatus}
                          onChange={(e) => setEditingStatus(e.target.value)}
                          className="w-full bg-white border border-black text-black font-black rounded-xl px-3 py-2.5 text-xs"
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
                        <span className="text-xs text-black font-black">Delivery Progress:</span>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColors[delivery.status]}`}>
                          {statusLabels[delivery.status]}
                        </span>
                      </div>
                    )}
                  </div>
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
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setZoomImages([])}
        >
          <div className="relative max-w-4xl w-full max-h-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setZoomImages([])}
              className="absolute top-4 right-4 bg-black hover:bg-white text-white hover:text-black p-2 rounded-full border border-black transition-all"
            >
              <X size={20} />
            </button>

            {zoomImages.length > 1 && (
              <>
                <button
                  onClick={() => setZoomIndex((prev) => (prev - 1 + zoomImages.length) % zoomImages.length)}
                  className="absolute top-1/2 -translate-y-1/2 left-4 bg-black/70 hover:bg-white text-white hover:text-black p-2 rounded-full border border-black transition-all"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => setZoomIndex((prev) => (prev + 1) % zoomImages.length)}
                  className="absolute top-1/2 -translate-y-1/2 right-4 bg-black/70 hover:bg-white text-white hover:text-black p-2 rounded-full border border-black transition-all"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            <img
              src={zoomImages[zoomIndex]}
              alt="Package zoomed preview"
              className="rounded-2xl max-w-full max-h-[85vh] object-contain border border-black mx-auto"
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

    </main>
  )
}

export default Admin
