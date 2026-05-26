import http from 'node:http'
import { createSupabaseAdminClient } from './supabase/client.mjs'
import { startDeliveryEmailListeners } from './supabase/listeners.mjs'
import { getRequestUrl, json, readJson, text, withCors } from './http.mjs'
import { getAuthUser, isAdminRequest } from './auth.mjs'
import { generateReceiptPdf } from './services/receiptPdf.mjs'
import { createReceiptLinkToken, validateReceiptToken } from './services/receiptLinks.mjs'
import {
  sendAdminAlert,
  sendPackageCreatedEmail,
  sendPackageApprovedEmail,
  sendPackageCancelledEmail,
  sendPackageDeliveredEmail,
  sendReceiptEmail,
  sendWelcomeEmail
} from './services/emailService.mjs'

async function loadAdminEmailFromDb({ supabaseAdmin }) {
  const { data, error } = await supabaseAdmin
    .from('app_settings')
    .select('value')
    .eq('key', 'admin_email')
    .maybeSingle()

  if (!error && data?.value) {
    process.env.ADMIN_EMAIL_FROM_DB = String(data.value)
  }
}

async function handleWelcome({ supabaseAdmin, req, res }) {
  const user = await getAuthUser({ supabaseAdmin, req })
  if (!user?.email) return json(res, 401, { error: 'Unauthorized' })

  const name = user?.user_metadata?.name || ''

  const { error: signupError } = await supabaseAdmin.from('user_signups').upsert(
    [{ id: user.id, email: user.email, name }],
    { onConflict: 'id' }
  )
  if (signupError) {
    console.error(signupError)
  }

  await sendWelcomeEmail({ supabaseAdmin, to: user.email, name, userId: user.id })

  const adminEmail = String(process.env.ADMIN_EMAIL_FROM_DB || process.env.ADMIN_EMAIL || '').trim()
  if (adminEmail) {
    await sendAdminAlert({
      supabaseAdmin,
      to: adminEmail,
      title: 'New user signup',
      lines: [`Email: ${user.email}`, `User ID: ${user.id}`],
      idempotencyKey: `admin-signup/${user.id}`,
      tagValue: 'admin_user_signup'
    })
  }

  return json(res, 200, { ok: true })
}

async function handleSendCreatedEmail({ supabaseAdmin, req, res }) {
  const user = await getAuthUser({ supabaseAdmin, req })
  if (!user?.email) return json(res, 401, { error: 'Unauthorized' })

  let body = null
  try {
    body = await readJson(req)
  } catch {
    return json(res, 400, { error: 'Invalid JSON body' })
  }

  const deliveryId = String(body?.deliveryId || '').trim()
  const trackingId = String(body?.trackingId || '').trim()

  let delivery = null
  if (deliveryId) {
    const { data } = await supabaseAdmin.from('deliveries').select('*').eq('id', deliveryId).maybeSingle()
    delivery = data
  } else if (trackingId) {
    const { data } = await supabaseAdmin.from('deliveries').select('*').eq('tracking_id', trackingId).maybeSingle()
    delivery = data
  }

  if (!delivery) return json(res, 404, { error: 'Delivery not found' })

  const senderEmail = String(delivery?.sender_email || '').trim().toLowerCase()
  if (!senderEmail) return json(res, 400, { error: 'Missing sender_email for delivery' })

  const callerEmail = String(user.email || '').trim().toLowerCase()
  if (!callerEmail || callerEmail !== senderEmail) return json(res, 403, { error: 'Forbidden' })

  await sendPackageCreatedEmail({ supabaseAdmin, to: senderEmail, delivery })

  const adminEmail = String(process.env.ADMIN_EMAIL_FROM_DB || process.env.ADMIN_EMAIL || '').trim()
  if (adminEmail) {
    await sendAdminAlert({
      supabaseAdmin,
      to: adminEmail,
      title: 'New package created',
      lines: [
        `Tracking ID: ${delivery?.tracking_id || ''}`,
        `Sender: ${delivery?.sender_name || ''} (${delivery?.sender_email || ''})`,
        `Receiver: ${delivery?.receiver_name || ''}`
      ],
      idempotencyKey: `admin-package-created/${delivery?.tracking_id || ''}`,
      tagValue: 'admin_package_created'
    })
  }

  return json(res, 200, { ok: true })
}

async function handleAdminUsers({ supabaseAdmin, req, res }) {
  const { ok } = await isAdminRequest({ supabaseAdmin, req })
  if (!ok) return json(res, 403, { error: 'Forbidden' })

  const limit = Math.min(50, Math.max(1, Number(getRequestUrl(req).searchParams.get('limit') || 20)))
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: limit })
  if (error) return json(res, 500, { error: String(error?.message || error) })
  const users = (data?.users || []).map((u) => ({
    id: u.id,
    email: u.email,
    createdAt: u.created_at
  }))
  return json(res, 200, { users })
}

async function handleAdminSummary({ supabaseAdmin, req, res }) {
  const { ok } = await isAdminRequest({ supabaseAdmin, req })
  if (!ok) return json(res, 403, { error: 'Forbidden' })

  const { data, error } = await supabaseAdmin.from('deliveries').select('status', { count: 'exact', head: false })
  if (error) return json(res, 500, { error: String(error?.message || error) })

  const byStatus = {}
  for (const row of data || []) {
    const status = String(row.status || 'unknown')
    byStatus[status] = (byStatus[status] || 0) + 1
  }
  return json(res, 200, { byStatus, total: (data || []).length })
}

async function handleReceiptDownload({ supabaseAdmin, req, res, trackingId, token }) {
  const ok = await validateReceiptToken({ supabaseAdmin, trackingId, token })
  if (!ok) return json(res, 403, { error: 'Invalid or expired token' })

  const { data, error } = await supabaseAdmin
    .from('deliveries')
    .select('*')
    .eq('tracking_id', trackingId)
    .maybeSingle()

  if (error || !data) return json(res, 404, { error: 'Receipt not found' })

  const pdf = await generateReceiptPdf({ delivery: data })
  res.writeHead(200, {
    'content-type': 'application/pdf',
    'content-disposition': `attachment; filename="receipt-${trackingId}.pdf"`,
    'content-length': pdf.length
  })
  res.end(pdf)
}

async function handleAdminReceiptDownload({ supabaseAdmin, req, res, trackingId }) {
  const { ok } = await isAdminRequest({ supabaseAdmin, req })
  if (!ok) return json(res, 403, { error: 'Forbidden' })

  const { data, error } = await supabaseAdmin
    .from('deliveries')
    .select('*')
    .eq('tracking_id', trackingId)
    .maybeSingle()

  if (error || !data) return json(res, 404, { error: 'Receipt not found' })

  const pdf = await generateReceiptPdf({ delivery: data })
  res.writeHead(200, {
    'content-type': 'application/pdf',
    'content-disposition': `attachment; filename="receipt-${trackingId}.pdf"`,
    'content-length': pdf.length
  })
  res.end(pdf)
}

async function handleAdminSendStatusEmail({ supabaseAdmin, req, res }) {
  const { ok } = await isAdminRequest({ supabaseAdmin, req })
  if (!ok) return json(res, 403, { error: 'Forbidden' })

  let body = null
  try {
    body = await readJson(req)
  } catch {
    return json(res, 400, { error: 'Invalid JSON body' })
  }

  const type = String(body?.type || '').trim().toLowerCase()
  const deliveryId = String(body?.deliveryId || '').trim()
  const trackingId = String(body?.trackingId || '').trim()

  if (!type || (type !== 'approved' && type !== 'delivered' && type !== 'cancelled')) {
    return json(res, 400, { error: 'Invalid type' })
  }

  let delivery = null
  if (deliveryId) {
    const { data } = await supabaseAdmin.from('deliveries').select('*').eq('id', deliveryId).maybeSingle()
    delivery = data
  } else if (trackingId) {
    const { data } = await supabaseAdmin.from('deliveries').select('*').eq('tracking_id', trackingId).maybeSingle()
    delivery = data
  }

  if (!delivery) return json(res, 404, { error: 'Delivery not found' })

  const to = String(delivery?.sender_email || '').trim()
  if (!to) return json(res, 400, { error: 'Missing sender_email for delivery' })

  if (type === 'approved') {
    await sendPackageApprovedEmail({ supabaseAdmin, to, delivery })
    return json(res, 200, { ok: true })
  }

  if (type === 'cancelled') {
    await sendPackageCancelledEmail({ supabaseAdmin, to, delivery })
    return json(res, 200, { ok: true })
  }

  const { token } = await createReceiptLinkToken({ supabaseAdmin, trackingId: delivery?.tracking_id })
  const receiptUrl = token
    ? `${String(process.env.PUBLIC_API_URL || '').replace(/\/+$/, '')}/receipts/${encodeURIComponent(delivery?.tracking_id)}.pdf?token=${encodeURIComponent(token)}`
    : ''

  await sendPackageDeliveredEmail({ supabaseAdmin, to, delivery, receiptUrl })
  await sendReceiptEmail({ supabaseAdmin, to, delivery, receiptToken: token })
  return json(res, 200, { ok: true })
}

export async function startServer() {
  const supabaseAdmin = createSupabaseAdminClient()
  await loadAdminEmailFromDb({ supabaseAdmin })

  const stopListeners = await startDeliveryEmailListeners({ supabaseAdmin })

  const server = http.createServer(async (req, res) => {
    if (withCors(req, res)) return

    const url = getRequestUrl(req)
    if (req.method === 'GET' && url.pathname === '/healthz') return text(res, 200, 'ok')

    if (req.method === 'POST' && url.pathname === '/auth/welcome') {
      return handleWelcome({ supabaseAdmin, req, res })
    }

    if (req.method === 'POST' && url.pathname === '/deliveries/send-created-email') {
      return handleSendCreatedEmail({ supabaseAdmin, req, res })
    }

    if (req.method === 'GET' && url.pathname === '/admin/users') {
      return handleAdminUsers({ supabaseAdmin, req, res })
    }

    if (req.method === 'GET' && url.pathname === '/admin/summary') {
      return handleAdminSummary({ supabaseAdmin, req, res })
    }

    if (req.method === 'POST' && url.pathname === '/admin/send-status-email') {
      return handleAdminSendStatusEmail({ supabaseAdmin, req, res })
    }

    const adminReceiptMatch = url.pathname.match(/^\/admin\/receipts\/([^/]+)\.pdf$/)
    if (req.method === 'GET' && adminReceiptMatch) {
      const trackingId = decodeURIComponent(adminReceiptMatch[1] || '')
      return handleAdminReceiptDownload({ supabaseAdmin, req, res, trackingId })
    }

    const receiptMatch = url.pathname.match(/^\/receipts\/([^/]+)\.pdf$/)
    if (req.method === 'GET' && receiptMatch) {
      const trackingId = decodeURIComponent(receiptMatch[1] || '')
      const token = url.searchParams.get('token') || ''
      return handleReceiptDownload({ supabaseAdmin, req, res, trackingId, token })
    }

    return json(res, 404, { error: 'Not found' })
  })

  const port = Number(process.env.PORT || 8787)
  server.listen(port, () => {
    console.log(`Email server listening on :${port}`)
  })

  const close = async () => {
    stopListeners?.()
    server.close()
  }

  return { close }
}
