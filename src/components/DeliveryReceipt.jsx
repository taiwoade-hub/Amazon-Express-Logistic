import { useMemo } from 'react'
import { Calendar, Hash, Mail, MapPin, Phone } from 'lucide-react'
import { COMPANY_PROFILE } from '../lib/companyProfile'
import { getDeliveryVerificationId } from '../lib/deliveryVerificationId'

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
}

function addDays(value, days) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  date.setDate(date.getDate() + days)
  return date
}

function formatCurrencyCode(value, currency) {
  const n = Number(value)
  if (!Number.isFinite(n)) return ''
  const code = String(currency || '').trim().toUpperCase()
  const formatted = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
  return code ? `${code} ${formatted}` : formatted
}

function DeliveryReceipt({ delivery }) {
  const trackingId = String(delivery?.tracking_id || '').trim()
  const deliveryVerificationId = useMemo(
    () => getDeliveryVerificationId(delivery),
    [delivery?.tracking_id, delivery?.id, delivery?.updated_at, delivery?.created_at]
  )

  const status = String(delivery?.status || '').trim().toLowerCase()
  const statusLabel = status === 'delivered' ? 'Delivered' : status === 'cancelled' ? 'Cancelled' : 'Pending'
  const statusBadge =
    statusLabel === 'Delivered'
      ? 'bg-status-delivered text-white border-status-delivered'
      : statusLabel === 'Cancelled'
        ? 'bg-accent text-white border-accent'
        : 'bg-amber-500 text-white border-amber-500'

  const invoiceNumber = trackingId ? `INV-${trackingId}` : 'INV-—'
  const invoiceDate = delivery?.updated_at || delivery?.created_at
  const dueDate = invoiceDate ? addDays(invoiceDate, 7) : null

  const trackUrl = (() => {
    const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : ''
    const base = origin || `https://${COMPANY_PROFILE.domain}`
    return `${String(base).replace(/\/+$/, '')}/#/track?id=${encodeURIComponent(trackingId)}`
  })()
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(trackUrl)}`

  const description = String(delivery?.item_description || delivery?.delivery_notes || '').trim() || 'Courier shipment'
  const location = `${String(delivery?.pickup_location || '').trim()} → ${String(delivery?.destination || '').trim()}`.trim()
  const price = formatCurrencyCode(delivery?.price, delivery?.currency)
  const managerName = 'System Administrator'

  return (
    <section className="receipt-sheet bg-white border border-border rounded-3xl overflow-hidden">
      <div className="grid md:grid-cols-[320px_1fr]">
        <aside className="bg-background border-b md:border-b-0 md:border-r border-border p-6 sm:p-8 flex flex-col">
          <div className="flex items-center gap-3">
            <img src={COMPANY_PROFILE.logoSrc} alt="Amazon Logistics logo" className="w-10 h-10" />
            <div className="min-w-0">
              <p className="text-base font-black text-primary tracking-tight truncate">Amazon Logistics</p>
              <p className="text-[11px] font-semibold text-text-muted truncate">{COMPANY_PROFILE.domain}</p>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Invoice Number</p>
              <p className="mt-1 text-sm font-black text-text">{invoiceNumber}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Delivery Verification ID</p>
              <p className="mt-1 text-sm font-black text-text tracking-[0.18em]">{deliveryVerificationId}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Invoice Date</p>
                <p className="mt-1 text-xs font-black text-text">{formatDate(invoiceDate) || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Due Date</p>
                <p className="mt-1 text-xs font-black text-text">{dueDate ? formatDate(dueDate) : '—'}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-border pt-6 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Company Contact</p>
            <a href={`https://${COMPANY_PROFILE.domain}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs font-black text-primary">
              <Hash size={14} />
              <span>{COMPANY_PROFILE.domain}</span>
            </a>
            <a href={COMPANY_PROFILE.emailHref} className="flex items-center gap-2 text-xs font-black text-primary">
              <Mail size={14} />
              <span>{COMPANY_PROFILE.emailDisplay}</span>
            </a>
            <a href={COMPANY_PROFILE.phoneHref} className="flex items-center gap-2 text-xs font-black text-primary">
              <Phone size={14} />
              <span>{COMPANY_PROFILE.phoneDisplay}</span>
            </a>
            <a href={COMPANY_PROFILE.addressHref} target="_blank" rel="noreferrer" className="flex items-start gap-2 text-xs text-text-muted font-semibold leading-snug">
              <MapPin size={14} className="mt-0.5 flex-shrink-0 text-text-muted" />
              <span>{COMPANY_PROFILE.addressDisplay}</span>
            </a>
          </div>

          <div className="mt-auto pt-8">
            <div className="rounded-2xl border border-border bg-white p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Scan to Track</p>
              <div className="mt-3 flex items-center justify-center">
                <img src={qrSrc} alt="Tracking QR code" className="w-32 h-32" />
              </div>
              <p className="mt-3 text-[10px] text-text-muted font-semibold break-all">{trackUrl}</p>
            </div>
          </div>
        </aside>

        <div className="p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">International Courier Air Waybill</p>
              <h2 className="mt-1 text-2xl sm:text-3xl font-black text-text tracking-tight">Shipment Invoice</h2>
              <p className="mt-2 text-xs text-text-muted font-semibold max-w-2xl">
                This document confirms the shipment registration and status update recorded by the courier administrator.
              </p>
            </div>
            <div className="flex items-start justify-between sm:flex-col sm:items-end gap-3">
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider border ${statusBadge}`}>
                {statusLabel}
              </span>
              <div className="rounded-2xl border border-border bg-background px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Tracking ID</p>
                <p className="mt-1 text-base font-black text-primary">{trackingId || '—'}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid sm:grid-cols-2 gap-5">
            <div className="rounded-3xl border border-border bg-white p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Sender</p>
              <p className="mt-2 text-sm font-black text-text">{delivery?.sender_name || '—'}</p>
              {delivery?.sender_email ? <p className="mt-1 text-xs font-semibold text-text-muted">{delivery.sender_email}</p> : null}
              {delivery?.sender_phone ? <p className="mt-1 text-xs font-semibold text-text-muted">{delivery.sender_phone}</p> : null}
              <div className="mt-3 pt-3 border-t border-border text-xs font-semibold text-text-muted leading-snug">
                {String(delivery?.pickup_location || '').trim() || '—'}
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-white p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Receiver</p>
              <p className="mt-2 text-sm font-black text-text">{delivery?.receiver_name || '—'}</p>
              <p className="mt-1 text-xs font-semibold text-text-muted">{delivery?.receiver_phone || delivery?.phone || '—'}</p>
              <div className="mt-3 pt-3 border-t border-border text-xs font-semibold text-text-muted leading-snug">
                {String(delivery?.destination || '').trim() || '—'}
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-border overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background border-b border-border">
                  <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Description</th>
                  <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Location</th>
                  <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Status</th>
                  <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted text-right">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr className="bg-white">
                  <td className="px-5 py-4 text-sm font-black text-text">{description}</td>
                  <td className="px-5 py-4 text-xs font-semibold text-text-muted">{location || '—'}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusBadge}`}>
                      {statusLabel}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right text-sm font-black text-text">{price || '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex justify-end">
            <div className="rounded-3xl border border-border bg-white p-5 w-full max-w-[320px]">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-text-muted">
                  <span>Subtotal</span>
                  <span className="font-black text-text">{price || '—'}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold text-text-muted">
                  <span>Total</span>
                  <span className="font-black text-text">{price || '—'}</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 items-end">
                <div className="relative h-20">
                  <div
                    className={`absolute left-0 top-2 rotate-[-12deg] rounded-full border-2 px-5 py-3 text-[11px] font-black uppercase tracking-[0.22em] ${
                      statusLabel === 'Delivered'
                        ? 'border-status-delivered text-status-delivered'
                        : statusLabel === 'Cancelled'
                          ? 'border-accent text-accent'
                          : 'border-amber-500 text-amber-600'
                    }`}
                  >
                    {statusLabel === 'Delivered' ? 'Approved' : statusLabel}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Digital Signature</p>
                  <div className="mt-2 h-10 border-b border-border" />
                  <p className="mt-2 text-xs font-black text-text">{managerName}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-border text-center">
            <p className="text-sm font-black text-text">
              Thank you for choosing Amazon Logistics.
              <br />
              We appreciate your trust and look forward to serving you again.
            </p>
            <p className="mt-2 text-xs font-semibold text-text-muted">
              {COMPANY_PROFILE.phoneDisplay} • {COMPANY_PROFILE.addressDisplay}
              <br />
              © 2026 All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default DeliveryReceipt
