import { handleOptions, json } from '../_shared/http.ts'
import { createSupabaseServiceClient, getAdminEmail, getUserEmailFromRequest } from '../_shared/supabase.ts'
import { sendAndLogEmail } from '../_shared/emailService.ts'
import { adminAlertTemplate, packageCreatedTemplate } from '../_shared/templates.ts'

function trackingUrl(trackingId: string) {
  const appUrl = String(Deno.env.get('PUBLIC_APP_URL') || 'http://localhost:5173').replace(/\/+$/, '')
  return `${appUrl}/#/track?id=${encodeURIComponent(String(trackingId || '').trim())}`
}

function extractFirstImageUrl(packageImage: unknown) {
  if (!packageImage) return ''
  const raw = String(packageImage).trim()
  if (!raw) return ''
  if (raw.startsWith('[')) {
    try {
      const parsed = JSON.parse(raw)
      const first = Array.isArray(parsed) ? parsed[0] : ''
      return typeof first === 'string' ? first : ''
    } catch {
      return ''
    }
  }
  return raw
}

Deno.serve(async (req) => {
  const options = handleOptions(req)
  if (options) return options

  try {
    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 })

    const service = createSupabaseServiceClient()
    const requesterEmail = await getUserEmailFromRequest(req)
    if (!requesterEmail) return json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => null) as { trackingId?: string } | null
    const trackingId = String(body?.trackingId || '').trim().toUpperCase()
    if (!trackingId) return json({ error: 'Missing trackingId' }, { status: 400 })

    const { data: delivery, error } = await service
      .from('deliveries')
      .select('*')
      .eq('tracking_id', trackingId)
      .maybeSingle()

    if (error || !delivery) return json({ error: 'Delivery not found' }, { status: 404 })

    const senderEmail = String(delivery.sender_email || '').trim().toLowerCase()
    const adminEmail = (await getAdminEmail(service)) || (Deno.env.get('ADMIN_EMAIL') || 'admin@gmail.com').trim().toLowerCase()

    const isAdminCaller = requesterEmail && adminEmail && requesterEmail === adminEmail
    const isOwnerCaller = senderEmail && requesterEmail === senderEmail
    if (!isAdminCaller && !isOwnerCaller) return json({ error: 'Forbidden' }, { status: 403 })

    if (!senderEmail) return json({ error: 'Sender email is missing for this delivery' }, { status: 400 })

    const from = (Deno.env.get('RESEND_FROM') || 'AmazonLogisics <contact@amazonlogisics.com>').trim()
    const tpl = packageCreatedTemplate({
      trackingId,
      trackingUrl: trackingUrl(trackingId),
      imageUrl: extractFirstImageUrl(delivery.package_image)
    })

    const sendResult = await sendAndLogEmail({
      supabase: service,
      eventType: 'package_created',
      trackingId,
      recipient: senderEmail,
      idempotencyKey: `package-created/${trackingId}`,
      body: { from, to: [senderEmail], subject: tpl.subject, html: tpl.html, tags: [{ name: 'type', value: 'package_created' }] }
    })

    if (adminEmail) {
      const adminTpl = adminAlertTemplate({
        title: 'New package created',
        lines: [trackingId, `Sender: ${String(delivery.sender_name || '').trim()}`, `Receiver: ${String(delivery.receiver_name || '').trim()}`].filter(Boolean)
      })
      await sendAndLogEmail({
        supabase: service,
        eventType: 'admin_alert_package_created',
        recipient: adminEmail,
        idempotencyKey: `admin-alert/package-created/${trackingId}`,
        body: { from, to: [adminEmail], subject: adminTpl.subject, html: adminTpl.html, tags: [{ name: 'type', value: 'admin_alert_package_created' }] }
      })
    }

    if (!sendResult.ok) return json({ error: sendResult.error }, { status: 502 })
    return json({ ok: true })
  } catch (err) {
    const message = String((err as any)?.message || err || 'Request failed')
    return json({ error: message }, { status: 500 })
  }
})
