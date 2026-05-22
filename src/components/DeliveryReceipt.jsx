import { useMemo } from 'react'
import { Bell, CheckCircle2, XCircle, Phone, MapPin, Package, Hash, Calendar, User } from 'lucide-react'
import { COMPANY_PROFILE } from '../lib/companyProfile'
import { getDeliveryImages } from '../lib/deliveryImages'

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function DeliveryReceipt({ delivery, onImageClick }) {
  const images = useMemo(() => getDeliveryImages(delivery?.package_image), [delivery?.package_image])

  const isDelivered = delivery?.status === 'delivered'
  const isCancelled = delivery?.status === 'cancelled'
  const statusLabel = isDelivered ? 'Delivered' : isCancelled ? 'Cancelled' : 'Update'

  return (
    <section className="glass-panel rounded-3xl bg-white overflow-hidden">
      <header className="px-6 sm:px-8 pt-6 sm:pt-8 pb-6 border-b border-border">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center flex-shrink-0">
              <Bell size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-black text-text-muted">Delivery Notification</p>
              <h2 className="text-2xl sm:text-3xl font-black text-primary tracking-tight leading-tight">
                {statusLabel} Receipt
              </h2>
              <p className="text-xs text-text-muted font-semibold mt-1 max-w-xl">
                This receipt is generated from the administrator tracking update for your package.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start">
            <span
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border ${
                isDelivered
                  ? 'bg-white text-primary border-border'
                  : isCancelled
                    ? 'bg-black text-white border-black'
                    : 'bg-primary text-white border-primary'
              }`}
            >
              {isDelivered ? <CheckCircle2 size={14} /> : isCancelled ? <XCircle size={14} /> : <Bell size={14} />}
              <span>{statusLabel}</span>
            </span>
          </div>
        </div>
      </header>

      <div className="px-6 sm:px-8 py-7 space-y-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <img src={COMPANY_PROFILE.logoSrc} alt={`${COMPANY_PROFILE.name} logo`} className="w-10 h-10" />
            <div>
              <p className="text-sm font-black text-primary tracking-tight">{COMPANY_PROFILE.name}</p>
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 gap-1 mt-1">
                <a href={COMPANY_PROFILE.phoneHref} className="inline-flex items-center gap-2 text-xs font-black text-primary hover:text-black transition-colors">
                  <Phone size={14} />
                  <span>{COMPANY_PROFILE.phoneDisplay}</span>
                </a>
                <a
                  href={COMPANY_PROFILE.addressHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-start gap-2 text-xs text-text-muted font-semibold hover:text-primary transition-colors leading-snug"
                >
                  <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                  <span className="max-w-md">{COMPANY_PROFILE.addressDisplay}</span>
                </a>
              </div>
            </div>
          </div>

          <div className="bg-black text-white rounded-2xl px-5 py-4 min-w-[240px]">
            <p className="text-[10px] uppercase tracking-widest font-black text-white/60">Tracking Code</p>
            <div className="flex items-center gap-2 mt-2">
              <Hash size={16} className="text-white/70" />
              <p className="text-lg font-black tracking-tight">{delivery?.tracking_id}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="glass-panel rounded-3xl bg-white border border-border p-6 space-y-3">
            <div className="flex items-center gap-2 text-primary">
              <User size={16} />
              <p className="text-xs font-black uppercase tracking-wider">Sender</p>
            </div>
            <div className="space-y-1">
              <p className="text-base font-black text-primary">{delivery?.sender_name}</p>
              <p className="text-xs text-text-muted font-semibold leading-relaxed">{delivery?.pickup_location}</p>
            </div>
          </div>

          <div className="glass-panel rounded-3xl bg-white border border-border p-6 space-y-3">
            <div className="flex items-center gap-2 text-primary">
              <User size={16} />
              <p className="text-xs font-black uppercase tracking-wider">Receiver</p>
            </div>
            <div className="space-y-1">
              <p className="text-base font-black text-primary">{delivery?.receiver_name}</p>
              <p className="text-xs text-text-muted font-semibold leading-relaxed">{delivery?.destination}</p>
              <p className="text-xs text-text-muted font-semibold">{delivery?.phone}</p>
            </div>
          </div>

          <div className="glass-panel rounded-3xl bg-white border border-border p-6 space-y-3">
            <div className="flex items-center gap-2 text-primary">
              <Package size={16} />
              <p className="text-xs font-black uppercase tracking-wider">Package</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-4">
                <p className="text-xs text-text-muted font-black uppercase tracking-wider">Type</p>
                <p className="text-xs font-black text-primary capitalize">{delivery?.package_type}</p>
              </div>
              <div className="flex items-start justify-between gap-4">
                <p className="text-xs text-text-muted font-black uppercase tracking-wider">Created</p>
                <p className="text-xs font-black text-primary">{formatDate(delivery?.created_at) || '—'}</p>
              </div>
              <div className="flex items-start justify-between gap-4">
                <p className="text-xs text-text-muted font-black uppercase tracking-wider">Last Update</p>
                <p className="text-xs font-black text-primary">{formatDate(delivery?.updated_at) || '—'}</p>
              </div>
              <div className="pt-2 border-t border-border">
                <div className="flex items-center gap-2 text-primary">
                  <Calendar size={14} />
                  <p className="text-[10px] font-black uppercase tracking-wider">What Was Sent</p>
                </div>
                <p className="text-xs text-text-muted font-semibold mt-1 leading-relaxed">
                  {delivery?.delivery_notes ? delivery.delivery_notes : 'No delivery notes were provided.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {images.length > 0 && (
          <div className="glass-panel rounded-3xl bg-white border border-border p-6">
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-border">
              <div className="flex items-center gap-2 text-primary">
                <Package size={16} />
                <p className="text-xs font-black uppercase tracking-wider">Package Photos</p>
              </div>
              <p className="text-[10px] font-black uppercase tracking-wider text-text-muted">
                {images.length}/4
              </p>
            </div>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {images.map((src, index) => (
                <button
                  key={`${src}-${index}`}
                  type="button"
                  onClick={() => onImageClick?.(images, index)}
                  className="group relative rounded-2xl overflow-hidden border border-border bg-white active:scale-95 transition-transform"
                >
                  <img src={src} alt={`Package ${index + 1}`} className="w-full h-28 object-cover group-hover:opacity-95 transition-opacity" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default DeliveryReceipt

