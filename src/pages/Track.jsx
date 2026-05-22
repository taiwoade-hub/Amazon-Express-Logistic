import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { Package, Search, MapPin, Calendar, Clock, Phone, AlertCircle, ArrowLeft, Image as ImageIcon } from 'lucide-react'

const statusSteps = ['processing', 'picked_up', 'in_transit', 'delivered']
const statusLabels = {
  processing: 'Processing',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
}

const statusDescriptions = {
  processing: 'Your parcel is being logged and prepared for courier assignment.',
  picked_up: 'The courier partner has collected the package and started transit.',
  in_transit: 'Package is in transit between shipping hubs.',
  delivered: 'Parcel successfully signed and delivered to destination.',
  cancelled: 'This shipping request has been cancelled.'
}

function Track() {
  const [searchParams] = useSearchParams()
  const [trackingId, setTrackingId] = useState(searchParams.get('id') || '')
  const [loading, setLoading] = useState(false)
  const [delivery, setDelivery] = useState(null)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    const idParam = searchParams.get('id')
    if (idParam) {
      performTracking(idParam)
    }
  }, [searchParams])

  const performTracking = async (id) => {
    if (!id.trim()) {
      setError('Please enter a tracking ID')
      return
    }

    setLoading(true)
    setError('')
    setSearched(true)

    try {
      const { data, error: fetchError } = await supabase
        .from('deliveries')
        .select('*')
        .eq('tracking_id', id.toUpperCase().trim())
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          setError('Tracking ID not found. Please verify the ID and try again.')
        } else {
          setError(fetchError.message)
        }
        setDelivery(null)
      } else {
        setDelivery(data)
      }
    } catch (err) {
      console.error('Error tracking delivery:', err)
      setError('Failed to load package details.')
      setDelivery(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    performTracking(trackingId)
  }

  const getCurrentStatusIndex = () => {
    if (!delivery) return -1
    return statusSteps.indexOf(delivery.status)
  }

  const currentStatusIndex = getCurrentStatusIndex()

  return (
    <main className="relative overflow-hidden bg-background min-h-screen">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div
          className="absolute inset-0 bg-cover bg-center lg:bg-fixed"
          style={{ backgroundImage: 'url(/track-bg.jpg)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/75 to-white/90" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto py-12 px-6">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-xs font-black text-primary hover:text-black transition-colors">
            <ArrowLeft size={14} />
            <span>Back to Home</span>
          </Link>
        </div>

        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-black text-primary tracking-tight">Track Package</h1>
          <p className="text-text-muted mt-1 font-semibold">Verify shipment milestones and delivery status instantly.</p>
        </div>

        <form onSubmit={handleSearch} className="mb-12">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow">
              <span className="absolute inset-y-0 left-0 pl-5 flex items-center text-text-muted">
                <Search size={18} />
              </span>
              <input
                type="text"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
                placeholder="Enter tracking ID (e.g. AXL-123456)"
                className="w-full pl-12 pr-5 py-4 bg-white border border-border rounded-2xl focus:outline-none focus:border-border-active transition-colors text-base placeholder-black/30 text-primary font-semibold"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-black text-white px-8 py-4 rounded-2xl font-black transition-colors disabled:opacity-50 active:scale-95"
            >
              {loading ? 'Searching...' : 'Track parcel'}
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-primary rounded-2xl p-5 mb-8 flex gap-3 items-start text-white">
            <AlertCircle size={20} className="text-white flex-shrink-0 mt-0.5" />
            <p className="text-sm font-black leading-snug">{error}</p>
          </div>
        )}

        {!searched && !delivery && (
          <div className="text-center py-16 glass-panel rounded-3xl bg-white">
            <Package className="w-16 h-16 mx-auto mb-4 text-primary opacity-15" />
            <p className="font-black text-primary text-sm uppercase tracking-wider">Waiting for Tracking Input</p>
            <p className="text-xs text-text-muted font-semibold mt-2 max-w-xs mx-auto">Enter a valid tracking ID above to retrieve your delivery timeline.</p>
          </div>
        )}

        {delivery && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
          
          {/* Left panel: Details & Picture */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Package Details */}
            <div className="glass-panel rounded-3xl p-6 bg-white space-y-5">
              <div className="pb-4 border-b border-border">
                <span className="text-[10px] uppercase font-black tracking-widest text-text-muted">Tracking ID</span>
                <h3 className="text-2xl font-black text-primary tracking-tight mt-1">{delivery.tracking_id}</h3>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <p className="text-text-muted font-black uppercase tracking-wider">Sender</p>
                  <p className="font-black text-primary text-sm mt-0.5">{delivery.sender_name}</p>
                  <p className="text-text-muted font-semibold mt-0.5">{delivery.pickup_location}</p>
                </div>
                <div>
                  <p className="text-text-muted font-black uppercase tracking-wider">Receiver</p>
                  <p className="font-black text-primary text-sm mt-0.5">{delivery.receiver_name}</p>
                  <p className="text-text-muted font-semibold mt-0.5">{delivery.destination}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-text-muted font-black uppercase tracking-wider">Package Type</p>
                    <p className="font-black text-primary text-sm capitalize mt-0.5">{delivery.package_type}</p>
                  </div>
                  <div>
                    <p className="text-text-muted font-black uppercase tracking-wider">Phone</p>
                    <p className="font-black text-primary text-sm mt-0.5 truncate">{delivery.phone}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Package Attachment (Image display) */}
            {delivery.package_image && (
              <div className="glass-panel rounded-3xl p-6 bg-white">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
                  <ImageIcon size={16} className="text-primary" />
                  <span className="text-xs font-black text-primary uppercase tracking-wider">Package Photo</span>
                </div>
                <div className="relative rounded-2xl overflow-hidden border border-border bg-white">
                  <img 
                    src={delivery.package_image} 
                    alt="Package Attachment" 
                    className="w-full h-auto max-h-[300px] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 flex items-end p-4">
                    <span className="text-[10px] font-black text-white uppercase tracking-wider">Verified Shipment Photo</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right panel: Timeline progression */}
          <div className="md:col-span-3 glass-panel rounded-3xl p-6 sm:p-8 bg-white">
            <h3 className="text-xl font-black text-primary tracking-tight mb-8 pb-3 border-b border-border">Delivery Route Milestones</h3>
            
            {delivery.status === 'cancelled' ? (
              /* Cancelled state timeline */
              <div className="flex gap-4 items-start bg-primary text-white p-6 rounded-2xl">
                <div className="w-8 h-8 rounded-full bg-white text-primary flex items-center justify-center font-black">
                  <AlertCircle size={18} />
                </div>
                <div>
                  <p className="font-black text-white text-lg uppercase tracking-tight">Cancelled</p>
                  <p className="text-xs text-white font-semibold mt-2 leading-relaxed">
                    This parcel shipment request was cancelled by the administrator. Please contact courier support.
                  </p>
                </div>
              </div>
            ) : (
              /* Normal pipeline tracking status */
              <div className="space-y-8 relative">
                {statusSteps.map((step, index) => {
                  const isActive = index <= currentStatusIndex
                  const isCurrent = index === currentStatusIndex

                  return (
                    <div key={step} className={`flex gap-5 relative ${!isActive ? 'opacity-40' : ''}`}>
                      
                      {/* Pathway connectors */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs transition-colors ${
                            isActive
                              ? 'bg-primary text-white'
                              : 'bg-white text-primary border border-border'
                          }`}
                        >
                          {isActive ? '✓' : index + 1}
                        </div>
                        {index < statusSteps.length - 1 && (
                          <div
                            className={`transition-colors ${
                              index < currentStatusIndex ? 'w-px bg-border-active h-16 my-1' : 'w-px bg-border h-16 my-1'
                            }`}
                          ></div>
                        )}
                      </div>

                      {/* Detail text */}
                      <div className="pt-0.5 pb-4">
                        <h4 className="font-black text-primary text-base">
                          {statusLabels[step]}
                        </h4>
                        <p className="text-xs text-text-muted font-semibold mt-1 leading-relaxed max-w-md">
                          {statusDescriptions[step]}
                        </p>
                        {isCurrent && (
                          <span className="inline-block bg-primary text-white text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded mt-3">
                            Current Status
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Footer timestamps */}
            <div className="mt-10 pt-6 border-t border-border text-xs text-text-muted space-y-1.5 font-semibold">
              <div className="flex justify-between">
                <span>Registered:</span>
                <span className="font-black text-primary">{new Date(delivery.created_at).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Updated:</span>
                <span className="font-black text-primary">{new Date(delivery.updated_at).toLocaleString()}</span>
              </div>
            </div>

          </div>

          </div>
        )}
      </div>
    </main>
  )
}

export default Track
