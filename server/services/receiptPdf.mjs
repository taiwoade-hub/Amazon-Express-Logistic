import PDFDocument from 'pdfkit'
import { fileURLToPath } from 'node:url'

function toBuffer(doc) {
  return new Promise((resolve) => {
    const chunks = []
    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.end()
  })
}

function safe(value) {
  return String(value ?? '').trim()
}

function parseDate(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function fmtDate(date) {
  if (!date) return ''
  try {
    return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
  } catch {
    const yyyy = String(date.getFullYear())
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    return `${dd}/${mm}/${yyyy}`
  }
}

function addDays(date, days) {
  if (!date) return null
  const next = new Date(date)
  if (Number.isNaN(next.getTime())) return null
  next.setDate(next.getDate() + days)
  return next
}

function fmtMoneyWithCurrency(value, currency) {
  const n = Number(value)
  const code = safe(currency).toUpperCase()
  try {
    const formatted = new Intl.NumberFormat('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
      Number.isFinite(n) ? n : 0
    )
    return code ? `${code} ${formatted}` : formatted
  } catch {
    const fallback = Number.isFinite(n) ? n.toFixed(2) : '0.00'
    return code ? `${code} ${fallback}` : fallback
  }
}

function fnv1a32(value) {
  let hash = 0x811c9dc5
  const str = String(value ?? '')
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

function getDeliveryVerificationId(delivery) {
  const existing = safe(delivery?.delivery_verification_id || delivery?.dvi)
  if (existing) return existing

  const tracking = safe(delivery?.tracking_id).toUpperCase()
  const id = safe(delivery?.id)
  const dateValue = delivery?.updated_at || delivery?.created_at
  const date = parseDate(dateValue) || new Date()
  const year = date.getFullYear()
  const seed = `${tracking}|${id}|${safe(dateValue)}`
  const code = fnv1a32(seed).toString(36).toUpperCase().padStart(6, '0').slice(0, 6)
  return `DLV-${code}-${year}`
}

function companyInfo() {
  const name = String(process.env.COMPANY_NAME || 'Amazon Logistics')
  const website = String(process.env.COMPANY_WEBSITE || 'https://amazonlogisics.com')
  const email = String(process.env.COMPANY_EMAIL || 'contact@amazonlogisics.com')
  const phone = String(process.env.COMPANY_PHONE || '+44 7385284814')
  const address = String(process.env.COMPANY_ADDRESS || '123 Mabini Street, Barangay San Isidro, Quezon City, Metro Manila')
  return { name, website, email, phone, address }
}

export async function generateReceiptPdf({ delivery }) {
  const doc = new PDFDocument({ size: 'A4', margin: 36 })

  const { name: companyName, website, email, phone, address } = companyInfo()
  const createdAt = parseDate(delivery?.created_at)
  const updatedAt = parseDate(delivery?.updated_at)
  const invoiceDate = updatedAt || createdAt
  const dueDate = addDays(invoiceDate, 7)
  const deliveryVerificationId = getDeliveryVerificationId(delivery)

  const trackingId = safe(delivery?.tracking_id).toUpperCase()
  const invoiceNumber = trackingId ? `INV-${trackingId}` : 'INV-—'
  const receiverPhone = safe(delivery?.receiver_phone || delivery?.phone)
  const senderPhone = safe(delivery?.sender_phone)
  const senderEmail = safe(delivery?.sender_email)
  const itemDescription = safe(delivery?.item_description || delivery?.delivery_notes || delivery?.package_type)
  const pickupLocation = safe(delivery?.pickup_location)
  const destination = safe(delivery?.destination)
  const currency = safe(delivery?.currency)
  const price = fmtMoneyWithCurrency(delivery?.price, currency)
  const route = `${pickupLocation}${pickupLocation && destination ? ' → ' : ''}${destination}`
  const managerName = String(process.env.ADMIN_NAME || 'System Administrator')

  const pageWidth = doc.page.width
  const pageHeight = doc.page.height
  const margin = doc.page.margins.left
  const sidebarWidth = 210
  const sidebarX = margin
  const sidebarY = margin
  const sidebarH = pageHeight - margin * 2

  doc.save()
  doc.rect(sidebarX, sidebarY, sidebarWidth, sidebarH).fill('#f7f9fb')
  doc.restore()

  const logoPath = fileURLToPath(new URL('../../public/favicon.jpg', import.meta.url))
  try {
    doc.image(logoPath, sidebarX + 62, sidebarY + 24, { width: 86, height: 86 })
  } catch {
  }

  const domain = safe(website).replace(/^https?:\/\//, '').replace(/\/+$/, '')

  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(12).text('Amazon Logistics', sidebarX + 18, sidebarY + 118, {
    width: sidebarWidth - 36,
    align: 'center'
  })
  doc.fillColor('#64748b').font('Helvetica').fontSize(9).text(domain || 'amazonlogisics.com', sidebarX + 18, sidebarY + 136, {
    width: sidebarWidth - 36,
    align: 'center'
  })

  let cursorY = sidebarY + 170
  const labelStyle = () => doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(9)
  const valueStyle = () => doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(11)

  labelStyle().text('Invoice Number', sidebarX + 18, cursorY)
  cursorY += 14
  valueStyle().text(invoiceNumber, sidebarX + 18, cursorY)
  cursorY += 30

  labelStyle().text('Delivery Verification ID', sidebarX + 18, cursorY)
  cursorY += 14
  valueStyle().text(deliveryVerificationId, sidebarX + 18, cursorY)
  cursorY += 30

  labelStyle().text('Invoice Date', sidebarX + 18, cursorY)
  cursorY += 14
  valueStyle().text(fmtDate(invoiceDate), sidebarX + 18, cursorY)
  cursorY += 30

  labelStyle().text('Due Date', sidebarX + 18, cursorY)
  cursorY += 14
  valueStyle().text(fmtDate(dueDate), sidebarX + 18, cursorY)
  cursorY += 34

  doc.save()
  doc.moveTo(sidebarX + 18, cursorY).lineTo(sidebarX + sidebarWidth - 18, cursorY).lineWidth(1).strokeColor('#e2e8f0').stroke()
  doc.restore()
  cursorY += 18

  doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(9).text('Company Contact', sidebarX + 18, cursorY)
  cursorY += 16
  doc.fillColor('#0f172a').font('Helvetica').fontSize(9).text(domain || 'amazonlogisics.com', sidebarX + 18, cursorY, { width: sidebarWidth - 36 })
  cursorY += 14
  doc.text(email, sidebarX + 18, cursorY, { width: sidebarWidth - 36 })
  cursorY += 14
  doc.text(phone, sidebarX + 18, cursorY, { width: sidebarWidth - 36 })
  cursorY += 14
  doc.fillColor('#0f172a').font('Helvetica').fontSize(9).text(address, sidebarX + 18, cursorY, { width: sidebarWidth - 36 })

  const appUrl = String(process.env.PUBLIC_APP_URL || 'https://amazonlogisics.com').replace(/\/+$/, '')
  const trackUrl = trackingId ? `${appUrl}/#/track?id=${encodeURIComponent(trackingId)}` : appUrl

  const qrAreaY = sidebarY + sidebarH - 190
  doc.save()
  doc.moveTo(sidebarX + 18, qrAreaY - 18).lineTo(sidebarX + sidebarWidth - 18, qrAreaY - 18).lineWidth(1).strokeColor('#e2e8f0').stroke()
  doc.restore()

  doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(9).text('Scan to Track', sidebarX + 18, qrAreaY)

  try {
    const qrResp = await fetch(
      `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(trackUrl)}`
    )
    if (qrResp.ok) {
      const qrBuf = Buffer.from(await qrResp.arrayBuffer())
      doc.image(qrBuf, sidebarX + 40, qrAreaY + 18, { width: 130, height: 130 })
    }
  } catch {
  }

  doc.fillColor('#64748b').font('Helvetica').fontSize(7).text(trackUrl, sidebarX + 18, qrAreaY + 154, {
    width: sidebarWidth - 36,
    align: 'center'
  })

  const rightX = sidebarX + sidebarWidth + 22
  const rightW = pageWidth - rightX - margin
  const topY = sidebarY + 22

  doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(9).text('International Courier Air Waybill', rightX, topY)
  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(22).text('Shipment Invoice', rightX, topY + 14)
  doc.fillColor('#64748b')
    .font('Helvetica')
    .fontSize(9)
    .text('This document confirms the shipment registration and status update recorded by the courier administrator.', rightX, topY + 42, {
      width: rightW
    })

  const statusRaw = safe(delivery?.status || 'processing').toLowerCase()
  const statusLabel =
    statusRaw === 'delivered' ? 'Delivered' : statusRaw === 'cancelled' ? 'Cancelled' : 'Pending'
  const statusColor = statusLabel === 'Delivered' ? '#10b981' : statusLabel === 'Cancelled' ? '#dc2626' : '#f59e0b'

  const badgeW = 92
  const badgeH = 22
  doc.save()
  doc.roundedRect(rightX + rightW - badgeW, topY + 10, badgeW, badgeH, 10).fill(statusColor)
  doc.restore()
  doc.fillColor('#ffffff')
    .font('Helvetica-Bold')
    .fontSize(9)
    .text(statusLabel, rightX + rightW - badgeW, topY + 16, { width: badgeW, align: 'center' })

  const trackingBoxY = topY + 74
  doc.save()
  doc.roundedRect(rightX + rightW - 180, trackingBoxY, 180, 48, 12).fill('#f7f9fb')
  doc.restore()
  doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(8).text('Tracking ID', rightX + rightW - 168, trackingBoxY + 12)
  doc.fillColor('#2563eb').font('Helvetica-Bold').fontSize(14).text(trackingId, rightX + rightW - 168, trackingBoxY + 24)

  const colGap = 14
  const colW = (rightW - colGap) / 2
  const cardsY = trackingBoxY + 74

  const drawPartyCard = ({ x, title, name, emailValue, phoneValue, addressValue }) => {
    doc.save()
    doc.roundedRect(x, cardsY, colW, 112, 14).strokeColor('#e2e8f0').lineWidth(1).stroke()
    doc.restore()
    doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(8).text(title, x + 14, cardsY + 12)
    doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(12).text(name || '—', x + 14, cardsY + 26, { width: colW - 28 })
    let y = cardsY + 44
    if (emailValue) {
      doc.fillColor('#64748b').font('Helvetica').fontSize(9).text(emailValue, x + 14, y, { width: colW - 28 })
      y += 14
    }
    if (phoneValue) {
      doc.fillColor('#64748b').font('Helvetica').fontSize(9).text(phoneValue, x + 14, y, { width: colW - 28 })
      y += 14
    }
    doc.fillColor('#64748b').font('Helvetica').fontSize(9).text(addressValue || '—', x + 14, y, { width: colW - 28 })
  }

  drawPartyCard({
    x: rightX,
    title: 'Sender',
    name: safe(delivery?.sender_name),
    emailValue: senderEmail,
    phoneValue: senderPhone,
    addressValue: pickupLocation
  })

  drawPartyCard({
    x: rightX + colW + colGap,
    title: 'Receiver',
    name: safe(delivery?.receiver_name),
    emailValue: '',
    phoneValue: receiverPhone,
    addressValue: destination
  })

  const tableY = cardsY + 132
  doc.save()
  doc.roundedRect(rightX, tableY, rightW, 112, 14).strokeColor('#e2e8f0').lineWidth(1).stroke()
  doc.restore()
  doc.save()
  doc.rect(rightX, tableY, rightW, 30).fill('#f7f9fb')
  doc.restore()

  const colDesc = Math.floor(rightW * 0.36)
  const colLoc = Math.floor(rightW * 0.34)
  const colStatus = Math.floor(rightW * 0.16)
  const colPrice = rightW - colDesc - colLoc - colStatus

  doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(8).text('Description', rightX + 14, tableY + 11, { width: colDesc - 18 })
  doc.text('Location', rightX + colDesc, tableY + 11, { width: colLoc - 18 })
  doc.text('Status', rightX + colDesc + colLoc, tableY + 11, { width: colStatus - 18 })
  doc.text('Price', rightX + colDesc + colLoc + colStatus, tableY + 11, { width: colPrice - 14, align: 'right' })

  const rowY = tableY + 38
  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(10).text(itemDescription || '—', rightX + 14, rowY, { width: colDesc - 18 })
  doc.fillColor('#64748b').font('Helvetica').fontSize(9).text(route || '—', rightX + colDesc, rowY, { width: colLoc - 18 })

  const statusPillX = rightX + colDesc + colLoc + 8
  doc.save()
  doc.roundedRect(statusPillX, rowY - 2, colStatus - 16, 18, 9).fill(statusColor)
  doc.restore()
  doc.fillColor('#ffffff')
    .font('Helvetica-Bold')
    .fontSize(8)
    .text(statusLabel, statusPillX, rowY + 2, { width: colStatus - 16, align: 'center' })

  doc.fillColor('#0f172a')
    .font('Helvetica-Bold')
    .fontSize(10)
    .text(price || '—', rightX + colDesc + colLoc + colStatus, rowY, { width: colPrice - 14, align: 'right' })

  const agreementY = tableY + 128

  const totalsX = rightX + rightW - 206
  doc.save()
  doc.roundedRect(totalsX, agreementY, 206, 138, 14).strokeColor('#e2e8f0').lineWidth(1).stroke()
  doc.restore()
  doc.fillColor('#64748b').font('Helvetica').fontSize(9).text('Subtotal', totalsX + 14, agreementY + 16)
  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(10).text(price || '—', totalsX + 14, agreementY + 16, { width: 178, align: 'right' })
  doc.fillColor('#64748b').font('Helvetica').fontSize(9).text('Total', totalsX + 14, agreementY + 36)
  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(10).text(price || '—', totalsX + 14, agreementY + 36, { width: 178, align: 'right' })

  const stampY = agreementY + 64
  doc.save()
  doc.circle(totalsX + 56, stampY + 30, 28).lineWidth(2).strokeColor(statusColor).stroke()
  doc.restore()
  doc.fillColor(statusColor).font('Helvetica-Bold').fontSize(10).text(statusLabel === 'Delivered' ? 'Approved' : statusLabel, totalsX + 28, stampY + 26, {
    width: 56,
    align: 'center'
  })

  doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(8).text('Digital Signature', totalsX + 110, stampY + 10)
  doc.save()
  doc.moveTo(totalsX + 110, stampY + 44).lineTo(totalsX + 192, stampY + 44).lineWidth(1).strokeColor('#e2e8f0').stroke()
  doc.restore()
  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(9).text(managerName, totalsX + 110, stampY + 50, { width: 96 })

  const footerY = pageHeight - margin - 72
  doc.save()
  doc.moveTo(rightX, footerY - 14).lineTo(rightX + rightW, footerY - 14).lineWidth(1).strokeColor('#e2e8f0').stroke()
  doc.restore()

  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(11).text(
    'Thank you for choosing Amazon Logistics.\nWe appreciate your trust and look forward to serving you again.',
    rightX,
    footerY,
    { width: rightW, align: 'center' }
  )
  doc.fillColor('#64748b')
    .font('Helvetica')
    .fontSize(9)
    .text(`Support: ${email} • ${phone}`, rightX, footerY + 34, { width: rightW, align: 'center' })

  return toBuffer(doc)
}
