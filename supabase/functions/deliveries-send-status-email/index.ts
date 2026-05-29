import { handleOptions, json } from '../_shared/http.ts'
import { createSupabaseServiceClient, getAdminEmail, getUserEmailFromRequest } from '../_shared/supabase.ts'
import { sendAndLogEmail } from '../_shared/emailService.ts'
import { packageApprovedTemplate, packageCancelledTemplate, packageDeliveredTemplate, receiptTemplate } from '../_shared/templates.ts'
import { generateReceiptPdfBase64 } from '../_shared/receiptPdf.ts'

type StatusType = 'approved' | 'cancelled' | 'delivered'

function trackingUrl(trackingId: string) {
  const appUrl = String(Deno.env.get('PUBLIC_APP_URL') || 'http://localhost:5173').replace(/\/+$/, '')
  return `${appUrl}/#/track?id=${encodeURIComponent(String(trackingId || '').trim())}`
}

function fromBase64(value: string) {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function putReceiptPdf(args: {
  supabase: ReturnType<typeof createSupabaseServiceClient>
  trackingId: string
  pdfBase64: string
}) {
  const bucket = 'receipts'
  const objectPath = `${args.trackingId}.pdf`
  const bytes = fromBase64(args.pdfBase64)

  try {
    const buckets = await args.supabase.storage.listBuckets()
    const exists = Array.isArray(buckets.data) && buckets.data.some((b: any) => String(b?.id || b?.name) === bucket)
    if (!exists) {
      await args.supabase.storage.createBucket(bucket, { public: false }).catch(() => {})
    }
  } catch {}

  const upsert = true
  const uploadResp = await args.supabase.storage.from(bucket).upload(objectPath, bytes, {
    contentType: 'application/pdf',
    upsert
  })
  if (uploadResp.error) return { ok: false as const, error: uploadResp.error.message, objectPath: '' }

  const signed = await args.supabase.storage.from(bucket).createSignedUrl(objectPath, 60 * 60 * 24 * 7)
  if (signed.error) return { ok: false as const, error: signed.error.message, objectPath }
  return { ok: true as const, url: signed.data?.signedUrl || '', objectPath }
}

Deno.serve(async (req) => {
  const options = handleOptions(req)
  if (options) return options

  try {
    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 })

    const service = createSupabaseServiceClient()
    const requesterEmail = await getUserEmailFromRequest(req)
    if (!requesterEmail) return json({ error: 'Unauthorized' }, { status: 401 })

    const adminEmail = (await getAdminEmail(service)) || (Deno.env.get('ADMIN_EMAIL') || 'admin@gmail.com').trim().toLowerCase()
    if (!adminEmail || requesterEmail !== adminEmail) return json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json().catch(() => null) as { deliveryId?: string; type?: StatusType } | null
    const deliveryId = String(body?.deliveryId || '').trim()
    const type = String(body?.type || '').trim() as StatusType
    if (!deliveryId) return json({ error: 'Missing deliveryId' }, { status: 400 })
    if (type !== 'approved' && type !== 'cancelled' && type !== 'delivered') return json({ error: 'Invalid type' }, { status: 400 })

    const { data: delivery, error } = await service.from('deliveries').select('*').eq('id', deliveryId).maybeSingle()
    if (error || !delivery) return json({ error: 'Delivery not found' }, { status: 404 })

    const { count, error: countError } = await service
      .from('email_events')
      .select('*', { count: 'exact', head: true })
      .eq('tracking_id', delivery.tracking_id)

    if (count !== null && count >= 4) {
      return json({ error: 'Email limit reached (max 4 times per shipment)' }, { status: 403 })
    }

    const trackingId = String(delivery.tracking_id || '').trim().toUpperCase()
    const to = String(delivery.sender_email || '').trim().toLowerCase()
    if (!to) return json({ error: 'Sender email is missing for this delivery' }, { status: 400 })

    const from = (Deno.env.get('RESEND_FROM') || 'AmazonLogisics <contact@amazonlogisics.com>').trim()
    const track = trackingUrl(trackingId)

    if (type === 'approved') {
      const tpl = packageApprovedTemplate({ trackingId, trackingUrl: track })
      const res = await sendAndLogEmail({
        supabase: service,
        eventType: 'package_approved',
        trackingId,
        recipient: to,
        idempotencyKey: `package-approved/${trackingId}`,
        body: { from, to: [to], subject: tpl.subject, html: tpl.html, tags: [{ name: 'type', value: 'package_approved' }] }
      })
      if (!res.ok) return json({ error: res.error }, { status: 502 })
      return json({ ok: true })
    }

    if (type === 'cancelled') {
      const tpl = packageCancelledTemplate({ trackingId, trackingUrl: track })
      const res = await sendAndLogEmail({
        supabase: service,
        eventType: 'package_cancelled',
        trackingId,
        recipient: to,
        idempotencyKey: `package-cancelled/${trackingId}`,
        body: { from, to: [to], subject: tpl.subject, html: tpl.html, tags: [{ name: 'type', value: 'package_cancelled' }] }
      })
      if (!res.ok) return json({ error: res.error }, { status: 502 })
      return json({ ok: true })
    }

    const pdfBase64 = await generateReceiptPdfBase64(delivery as Record<string, unknown>)
    const receipt = await putReceiptPdf({ supabase: service, trackingId, pdfBase64 })
    const receiptUrl = receipt.ok ? receipt.url : ''

    const deliveredTpl = packageDeliveredTemplate({ trackingId, trackingUrl: track, receiptUrl })
    const deliveredRes = await sendAndLogEmail({
      supabase: service,
      eventType: 'package_delivered',
      trackingId,
      recipient: to,
      idempotencyKey: `package-delivered/${trackingId}`,
      body: { from, to: [to], subject: deliveredTpl.subject, html: deliveredTpl.html, tags: [{ name: 'type', value: 'package_delivered' }] }
    })
    if (!deliveredRes.ok) return json({ error: deliveredRes.error }, { status: 502 })

    const receiptTpl = receiptTemplate({ trackingId, receiptUrl })
    const receiptRes = await sendAndLogEmail({
      supabase: service,
      eventType: 'receipt',
      trackingId,
      recipient: to,
      idempotencyKey: `receipt/${trackingId}`,
      body: {
        from,
        to: [to],
        subject: receiptTpl.subject,
        html: receiptTpl.html,
        attachments: [{ filename: `receipt-${trackingId}.pdf`, content: pdfBase64, contentType: 'application/pdf' }],
        tags: [{ name: 'type', value: 'receipt' }]
      }
    })
    if (!receiptRes.ok) return json({ error: receiptRes.error }, { status: 502 })

    if (!receipt.ok) return json({ ok: true, receiptUrl: '', receiptError: receipt.error }, { status: 200 })
    return json({ ok: true, receiptUrl })
  } catch (err) {
    const message = String((err as any)?.message || err || 'Request failed')
    return json({ error: message }, { status: 500 })
  }
})
