import { PDFDocument, StandardFonts, rgb } from 'npm:pdf-lib@1.17.1'

function safe(value: unknown) {
  return String(value ?? '').trim()
}

function fmtDate(value: unknown) {
  const date = new Date(String(value || ''))
  if (Number.isNaN(date.getTime())) return ''
  try {
    return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
  } catch {
    return date.toISOString()
  }
}

function fmtMoney(value: unknown, currency: unknown) {
  const n = Number(value)
  const code = safe(currency).toUpperCase()
  const num = Number.isFinite(n) ? n : 0
  try {
    const formatted = new Intl.NumberFormat('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num)
    return code ? `${code} ${formatted}` : formatted
  } catch {
    return code ? `${code} ${num.toFixed(2)}` : num.toFixed(2)
  }
}

function toBase64(bytes: Uint8Array) {
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

export async function generateReceiptPdfBase64(delivery: Record<string, unknown>) {
  const doc = await PDFDocument.create()
  const page = doc.addPage([595.28, 841.89])
  const { width, height } = page.getSize()

  const appUrl = String(Deno.env.get('PUBLIC_APP_URL') || 'https://amazonlogisics.com').replace(/\/+$/, '')
  const trackUrl = `${appUrl}/#/track?id=${encodeURIComponent(safe(delivery.tracking_id))}`

  let qrImage
  try {
    const qrResp = await fetch(`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(trackUrl)}`)
    if (qrResp.ok) {
      const qrBytes = await qrResp.arrayBuffer()
      qrImage = await doc.embedPng(qrBytes)
    }
  } catch (e) {}

  let logoImage
  try {
    const logoResp = await fetch(`${appUrl}/favicon.jpg`)
    if (logoResp.ok) {
      const logoBytes = await logoResp.arrayBuffer()
      logoImage = await doc.embedJpg(logoBytes)
    }
  } catch (e) {}

  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
  const font = await doc.embedFont(StandardFonts.Helvetica)

  const primary = rgb(0.06, 0.09, 0.16)
  const muted = rgb(0.36, 0.42, 0.5)
  const border = rgb(0.9, 0.92, 0.95)

  const trackingId = safe(delivery.tracking_id).toUpperCase()
  const status = safe(delivery.status || 'processing').toUpperCase()

  page.drawRectangle({ x: 48, y: height - 120, width: width - 96, height: 88, borderColor: border, borderWidth: 1 })
  if (logoImage) {
    page.drawImage(logoImage, { x: 64, y: height - 100, width: 40, height: 40 })
    page.drawText('AmazonLogisics', { x: 114, y: height - 76, size: 18, font: fontBold, color: primary })
    page.drawText('Shipment Receipt', { x: 114, y: height - 94, size: 11, font, color: muted })
  } else {
    page.drawText('AmazonLogisics', { x: 64, y: height - 70, size: 18, font: fontBold, color: primary })
    page.drawText('Shipment Receipt', { x: 64, y: height - 94, size: 11, font, color: muted })
  }

  page.drawText('Tracking ID', { x: width - 220, y: height - 70, size: 9, font: fontBold, color: muted })
  page.drawText(trackingId || '—', { x: width - 220, y: height - 92, size: 14, font: fontBold, color: rgb(0.14, 0.39, 0.92) })

  const boxY = height - 220
  page.drawRectangle({ x: 48, y: boxY, width: width - 96, height: 84, borderColor: border, borderWidth: 1 })
  page.drawText('Status', { x: 64, y: boxY + 56, size: 9, font: fontBold, color: muted })
  page.drawText(status || '—', { x: 64, y: boxY + 34, size: 12, font: fontBold, color: primary })

  page.drawText('Registered', { x: 240, y: boxY + 56, size: 9, font: fontBold, color: muted })
  page.drawText(fmtDate(delivery.created_at), { x: 240, y: boxY + 34, size: 10, font, color: primary })

  page.drawText('Last Updated', { x: 400, y: boxY + 56, size: 9, font: fontBold, color: muted })
  page.drawText(fmtDate(delivery.updated_at), { x: 400, y: boxY + 34, size: 10, font, color: primary })

  const infoY = height - 520
  page.drawText('Sender', { x: 48, y: infoY + 160, size: 11, font: fontBold, color: primary })
  page.drawRectangle({ x: 48, y: infoY + 88, width: (width - 112) / 2, height: 64, borderColor: border, borderWidth: 1 })
  page.drawText(safe(delivery.sender_name) || '—', { x: 64, y: infoY + 130, size: 11, font: fontBold, color: primary })
  page.drawText(safe(delivery.pickup_location) || '—', { x: 64, y: infoY + 112, size: 9, font, color: muted, maxWidth: (width - 112) / 2 - 24 })

  page.drawText('Receiver', { x: 48 + (width - 112) / 2 + 16, y: infoY + 160, size: 11, font: fontBold, color: primary })
  page.drawRectangle({ x: 48 + (width - 112) / 2 + 16, y: infoY + 88, width: (width - 112) / 2, height: 64, borderColor: border, borderWidth: 1 })
  page.drawText(safe(delivery.receiver_name) || '—', {
    x: 64 + (width - 112) / 2 + 16,
    y: infoY + 130,
    size: 11,
    font: fontBold,
    color: primary,
    maxWidth: (width - 112) / 2 - 24
  })
  page.drawText(safe(delivery.destination) || '—', {
    x: 64 + (width - 112) / 2 + 16,
    y: infoY + 112,
    size: 9,
    font,
    color: muted,
    maxWidth: (width - 112) / 2 - 24
  })

  const detailsY = infoY + 24
  page.drawText('Shipment Details', { x: 48, y: detailsY + 46, size: 11, font: fontBold, color: primary })
  page.drawRectangle({ x: 48, y: detailsY, width: width - 96, height: 42, borderColor: border, borderWidth: 1 })
  page.drawText(`Package: ${safe(delivery.package_type) || '—'}`, { x: 64, y: detailsY + 16, size: 9, font, color: muted })
  page.drawText(`Declared item: ${safe(delivery.item_description) || '—'}`, { x: 220, y: detailsY + 16, size: 9, font, color: muted, maxWidth: width - 330 })
  page.drawText(`Price: ${fmtMoney(delivery.price, delivery.currency)}`, { x: width - 210, y: detailsY + 16, size: 9, font: fontBold, color: primary })

  page.drawText('Thank you for choosing AmazonLogisics.', { x: 48, y: 122, size: 11, font: fontBold, color: primary })
  page.drawText('+44 7385284814 • 123 Mabini Street, Barangay San Isidro, Quezon City, Metro Manila', { x: 48, y: 102, size: 9, font, color: muted })
  page.drawText('For help, reply to your shipment emails or visit the tracking page.', { x: 48, y: 82, size: 9, font, color: muted })
  page.drawText('© 2026 All rights reserved.', { x: 48, y: 62, size: 9, font, color: muted })

  if (qrImage) {
    page.drawImage(qrImage, { x: width - 128, y: 62, width: 80, height: 80 })
  }

  const bytes = await doc.save()
  return toBase64(bytes)
}

