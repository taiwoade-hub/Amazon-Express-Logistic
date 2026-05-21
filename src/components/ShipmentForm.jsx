import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { Copy, Check, Upload, Trash2, Phone, MapPin, Package, AlertCircle } from 'lucide-react'

function generateTrackingId() {
  const random = Math.floor(Math.random() * 1000000)
  return `AXL-${String(random).padStart(6, '0')}`
}

function ShipmentForm({ title, description }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [trackingId, setTrackingId] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  const [dragActive, setDragActive] = useState(false)

  const [formData, setFormData] = useState({
    sender_name: user?.name || '',
    sender_email: user?.email || '',
    receiver_name: '',
    pickup_location: '',
    destination: '',
    phone: '',
    package_type: 'standard'
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target.result
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const MAX_WIDTH = 600
          const MAX_HEIGHT = 600
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width
              width = MAX_WIDTH
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height
              height = MAX_HEIGHT
            }
          }
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
          resolve(dataUrl)
        }
        img.onerror = (err) => reject(err)
      }
      reader.onerror = (err) => reject(err)
    })
  }

  const handleImageChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.')
      return
    }

    try {
      setError('')
      const compressedBase64 = await compressImage(file)
      setImagePreview(compressedBase64)
    } catch {
      setError('Failed to process image. Please try another one.')
    }
  }

  const removeImage = () => setImagePreview('')

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    if (e.type === 'dragleave') setDragActive(false)
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (!file.type.startsWith('image/')) {
        setError('Please drop an image file.')
        return
      }
      try {
        const compressedBase64 = await compressImage(file)
        setImagePreview(compressedBase64)
      } catch {
        setError('Failed to process dropped image.')
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const newTrackingId = generateTrackingId()

      const payload = {
        ...formData,
        tracking_id: newTrackingId,
        status: 'processing',
        package_image: imagePreview || null,
        sender_email: user?.email || formData.sender_email || null
      }

      const { error: insertError } = await supabase.from('deliveries').insert([payload])
      if (insertError) {
        const message = String(insertError.message || '')
        if (message.toLowerCase().includes('package_image') && (message.toLowerCase().includes('schema') || message.toLowerCase().includes('column'))) {
          const fallbackPayload = { ...payload }
          delete fallbackPayload.package_image
          const { error: fallbackError } = await supabase.from('deliveries').insert([fallbackPayload])
          if (fallbackError) throw fallbackError
        } else {
          throw insertError
        }
      }

      setTrackingId(newTrackingId)
      setSuccess(true)
      setFormData({
        sender_name: user?.name || '',
        sender_email: user?.email || '',
        receiver_name: '',
        pickup_location: '',
        destination: '',
        phone: '',
        package_type: 'standard'
      })
      setImagePreview('')
    } catch (err) {
      setError(err.message || 'Failed to register delivery. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(trackingId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (success) {
    return (
      <div className="glass-panel rounded-3xl p-8 text-center bg-white">
        <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Check className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-2xl font-black text-primary tracking-tight">Package Created</h2>
        <p className="text-text-muted font-semibold text-sm mt-1 mb-6">{description || 'Your delivery request has been successfully processed.'}</p>

        <div className="bg-primary text-white rounded-2xl p-6 mb-6">
          <p className="text-[11px] font-black uppercase tracking-wider text-white/70 mb-2">Tracking ID</p>
          <p className="text-3xl font-black tracking-tight mb-4">{trackingId}</p>
          <button
            onClick={handleCopy}
            className="w-full bg-white text-primary py-3 rounded-xl font-black transition-colors hover:bg-white/90 flex items-center justify-center gap-2"
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
            <span>{copied ? 'Copied' : 'Copy Tracking ID'}</span>
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => setSuccess(false)}
            className="w-full bg-primary hover:bg-black text-white py-3.5 rounded-xl font-black transition-colors text-sm"
          >
            Send Another Package
          </button>
          <Link
            to={user ? '/dashboard' : '/'}
            className="w-full bg-white hover:bg-black/5 text-primary py-3.5 rounded-xl font-black transition-colors text-sm border border-border"
          >
            Back to {user ? 'Portal' : 'Home'}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {(title || description) && (
        <div className="text-center sm:text-left">
          {title && <h2 className="text-2xl sm:text-3xl font-black text-primary tracking-tight">{title}</h2>}
          {description && <p className="text-text-muted font-semibold mt-1 text-sm">{description}</p>}
        </div>
      )}

      {error && (
        <div className="bg-primary text-white rounded-2xl p-4 flex gap-3 items-start">
          <AlertCircle size={18} className="text-white flex-shrink-0 mt-0.5" />
          <p className="text-sm font-black">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass-panel rounded-3xl p-6 sm:p-8 bg-white space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-black uppercase tracking-wider text-primary">Sender Name</label>
              <input
                type="text"
                name="sender_name"
                value={formData.sender_name}
                onChange={handleChange}
                required
                placeholder="Sender name"
                className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:border-border-active text-sm font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-black uppercase tracking-wider text-primary">Sender Email (Optional)</label>
              <input
                type="email"
                name="sender_email"
                value={formData.sender_email}
                onChange={handleChange}
                disabled={!!user}
                placeholder="email@example.com"
                className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:border-border-active text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-black uppercase tracking-wider text-primary">Receiver Name</label>
              <input
                type="text"
                name="receiver_name"
                value={formData.receiver_name}
                onChange={handleChange}
                required
                placeholder="Receiver name"
                className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:border-border-active text-sm font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-black uppercase tracking-wider text-primary">Receiver Phone</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-text-muted">
                  <Phone size={16} />
                </span>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="Phone number"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-border focus:outline-none focus:border-border-active text-sm font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-black uppercase tracking-wider text-primary">Pickup Location</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-text-muted">
                  <MapPin size={16} />
                </span>
                <input
                  type="text"
                  name="pickup_location"
                  value={formData.pickup_location}
                  onChange={handleChange}
                  required
                  placeholder="Pickup city/address"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-border focus:outline-none focus:border-border-active text-sm font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-black uppercase tracking-wider text-primary">Destination</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-text-muted">
                  <MapPin size={16} />
                </span>
                <input
                  type="text"
                  name="destination"
                  value={formData.destination}
                  onChange={handleChange}
                  required
                  placeholder="Destination city/address"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-border focus:outline-none focus:border-border-active text-sm font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-black uppercase tracking-wider text-primary">Package Type</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-text-muted">
                  <Package size={16} />
                </span>
                <select
                  name="package_type"
                  value={formData.package_type}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-border focus:outline-none focus:border-border-active text-sm font-semibold bg-white"
                >
                  <option value="standard">Standard</option>
                  <option value="fragile">Fragile</option>
                  <option value="perishable">Perishable</option>
                  <option value="hazardous">Hazardous</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-black uppercase tracking-wider text-primary">Package Image</label>

              {imagePreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-border bg-white p-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={imagePreview} alt="Upload Preview" className="w-14 h-14 rounded-xl object-cover border border-border" />
                    <div>
                      <p className="text-sm font-black text-primary">Attachment Ready</p>
                      <p className="text-xs text-text-muted font-semibold">Compressed image</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="p-2 bg-primary text-white rounded-xl transition-colors hover:bg-black"
                    title="Remove Image"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : (
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border border-dashed rounded-2xl px-4 py-4 transition-colors ${
                    dragActive ? 'border-border-active bg-black/5' : 'border-border bg-white hover:bg-black/5'
                  }`}
                >
                  <label className="cursor-pointer block">
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white">
                        <Upload size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-primary">Upload image or drag file</p>
                        <p className="text-xs text-text-muted font-semibold mt-0.5">JPG, PNG (auto-compressed)</p>
                      </div>
                    </div>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-black text-white py-4 rounded-2xl font-black transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
              <span>Creating...</span>
            </>
          ) : (
            <span>Create Delivery</span>
          )}
        </button>
      </form>
    </div>
  )
}

export default ShipmentForm
