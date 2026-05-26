import { resend, defaultFrom } from '../emails/resend.mjs'
import {
  adminAlertTemplate,
  packageApprovedTemplate,
  packageCancelledTemplate,
  packageCreatedTemplate,
  packageDeliveredTemplate,
  receiptTemplate,
  welcomeTemplate
} from '../emails/templates.mjs'
import { generateReceiptPdf } from './receiptPdf.mjs'

function getBaseUrls() {
  const appUrl = String(process.env.PUBLIC_APP_URL || 'https://amazonlogisics.com').replace(/\/+$/, '')
  const apiUrl = String(process.env.PUBLIC_API_URL || '').replace(/\/+$/, '')
  return { appUrl, apiUrl }
}

function trackingUrl(trackingId) {
  const { appUrl } = getBaseUrls()
  return `${appUrl}/#/track?id=${encodeURIComponent(String(trackingId || '').trim())}`
}

function buildReceiptUrl(trackingId, token) {
  const { apiUrl } = getBaseUrls()
  if (!apiUrl) return ''
  const base = `${apiUrl}/receipts/${encodeURIComponent(String(trackingId || '').trim())}.pdf`
  return token ? `${base}?token=${encodeURIComponent(token)}` : base
}

function extractFirstImageUrl(packageImage) {
  if (!packageImage) return ''
  const raw = String(packageImage)
  const trimmed = raw.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed)
      const first = Array.isArray(parsed) ? parsed[0] : ''
      return typeof first === 'string' ? first : ''
    } catch {
      return ''
    }
  }
  return trimmed
}

async function logEmailEvent({ supabaseAdmin, eventType, trackingId, recipient, resendId, status, errorMessage }) {
  if (!supabaseAdmin) return
  const { error } = await supabaseAdmin.from('email_events').insert([
    {
      event_type: eventType,
      tracking_id: trackingId || null,
      recipient,
      resend_id: resendId || null,
      status,
      error_message: errorMessage || null
    }
  ])
  if (error) {
    console.error(error)
  }
}

export async function sendPackageCreatedEmail({ supabaseAdmin, to, delivery }) {
  const trackingId = delivery?.tracking_id
  const { subject, html } = packageCreatedTemplate({
    trackingId,
    trackingUrl: trackingUrl(trackingId),
    imageUrl: extractFirstImageUrl(delivery?.package_image)
  })

  const { data, error } = await resend.emails.send({
    from: defaultFrom,
    to: [to],
    subject,
    html,
    idempotencyKey: `package-created/${trackingId}`,
    tags: [{ name: 'type', value: 'package_created' }]
  })

  await logEmailEvent({
    supabaseAdmin,
    eventType: 'package_created',
    trackingId,
    recipient: to,
    resendId: data?.id,
    status: error ? 'failed' : 'sent',
    errorMessage: error ? String(error?.message || error) : null
  })

  if (error) {
    console.error(error)
  }

  return data
}

export async function sendPackageApprovedEmail({ supabaseAdmin, to, delivery }) {
  const trackingId = delivery?.tracking_id
  const { subject, html } = packageApprovedTemplate({
    trackingId,
    trackingUrl: trackingUrl(trackingId)
  })

  const { data, error } = await resend.emails.send({
    from: defaultFrom,
    to: [to],
    subject,
    html,
    idempotencyKey: `package-approved/${trackingId}`,
    tags: [{ name: 'type', value: 'package_approved' }]
  })

  await logEmailEvent({
    supabaseAdmin,
    eventType: 'package_approved',
    trackingId,
    recipient: to,
    resendId: data?.id,
    status: error ? 'failed' : 'sent',
    errorMessage: error ? String(error?.message || error) : null
  })

  if (error) {
    console.error(error)
  }

  return data
}

export async function sendPackageDeliveredEmail({ supabaseAdmin, to, delivery, receiptUrl }) {
  const trackingId = delivery?.tracking_id
  const { subject, html } = packageDeliveredTemplate({
    trackingId,
    trackingUrl: trackingUrl(trackingId),
    receiptUrl
  })

  const { data, error } = await resend.emails.send({
    from: defaultFrom,
    to: [to],
    subject,
    html,
    idempotencyKey: `package-delivered/${trackingId}`,
    tags: [{ name: 'type', value: 'package_delivered' }]
  })

  await logEmailEvent({
    supabaseAdmin,
    eventType: 'package_delivered',
    trackingId,
    recipient: to,
    resendId: data?.id,
    status: error ? 'failed' : 'sent',
    errorMessage: error ? String(error?.message || error) : null
  })

  if (error) {
    console.error(error)
  }

  return data
}

export async function sendPackageCancelledEmail({ supabaseAdmin, to, delivery }) {
  const trackingId = delivery?.tracking_id
  const { subject, html } = packageCancelledTemplate({
    trackingId,
    trackingUrl: trackingUrl(trackingId)
  })

  const { data, error } = await resend.emails.send({
    from: defaultFrom,
    to: [to],
    subject,
    html,
    idempotencyKey: `package-cancelled/${trackingId}`,
    tags: [{ name: 'type', value: 'package_cancelled' }]
  })

  await logEmailEvent({
    supabaseAdmin,
    eventType: 'package_cancelled',
    trackingId,
    recipient: to,
    resendId: data?.id,
    status: error ? 'failed' : 'sent',
    errorMessage: error ? String(error?.message || error) : null
  })

  if (error) {
    console.error(error)
  }

  return data
}

export async function sendReceiptEmail({ supabaseAdmin, to, delivery, receiptToken }) {
  const trackingId = delivery?.tracking_id
  const receiptUrl = buildReceiptUrl(trackingId, receiptToken)
  const pdf = await generateReceiptPdf({ delivery })

  const { subject, html } = receiptTemplate({ trackingId, receiptUrl })

  const { data, error } = await resend.emails.send({
    from: defaultFrom,
    to: [to],
    subject,
    html,
    idempotencyKey: `receipt/${trackingId}`,
    attachments: [{ filename: `receipt-${trackingId}.pdf`, content: pdf }],
    tags: [{ name: 'type', value: 'receipt' }]
  })

  await logEmailEvent({
    supabaseAdmin,
    eventType: 'receipt',
    trackingId,
    recipient: to,
    resendId: data?.id,
    status: error ? 'failed' : 'sent',
    errorMessage: error ? String(error?.message || error) : null
  })

  if (error) {
    console.error(error)
  }

  return data
}

export async function sendWelcomeEmail({ supabaseAdmin, to, name, userId }) {
  const { subject, html } = welcomeTemplate({ name })

  const { data, error } = await resend.emails.send({
    from: defaultFrom,
    to: [to],
    subject,
    html,
    idempotencyKey: `user-welcome/${userId || to}`,
    tags: [{ name: 'type', value: 'user_welcome' }]
  })

  await logEmailEvent({
    supabaseAdmin,
    eventType: 'user_welcome',
    trackingId: null,
    recipient: to,
    resendId: data?.id,
    status: error ? 'failed' : 'sent',
    errorMessage: error ? String(error?.message || error) : null
  })

  if (error) {
    console.error(error)
  }

  return data
}

export async function sendAdminAlert({ supabaseAdmin, to, title, lines, idempotencyKey, tagValue }) {
  const { subject, html } = adminAlertTemplate({ title, lines })

  const { data, error } = await resend.emails.send({
    from: defaultFrom,
    to: [to],
    subject,
    html,
    idempotencyKey,
    tags: [{ name: 'type', value: tagValue }]
  })

  await logEmailEvent({
    supabaseAdmin,
    eventType: tagValue,
    trackingId: null,
    recipient: to,
    resendId: data?.id,
    status: error ? 'failed' : 'sent',
    errorMessage: error ? String(error?.message || error) : null
  })

  if (error) {
    console.error(error)
  }

  return data
}
