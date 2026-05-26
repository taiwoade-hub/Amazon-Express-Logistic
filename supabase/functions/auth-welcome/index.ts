import { handleOptions, json } from '../_shared/http.ts'
import { createSupabaseServiceClient, createSupabaseUserClient, getAdminEmail } from '../_shared/supabase.ts'
import { sendAndLogEmail } from '../_shared/emailService.ts'
import { adminAlertTemplate, welcomeTemplate } from '../_shared/templates.ts'

Deno.serve(async (req) => {
  const options = handleOptions(req)
  if (options) return options

  try {
    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 })

    const service = createSupabaseServiceClient()
    const userClient = createSupabaseUserClient(req)
    const auth = req.headers.get('authorization') || ''
    const token = auth.replace(/^Bearer\s+/i, '').trim()
    const { data, error } = await userClient.auth.getUser(token || undefined)

    const email = String(data?.user?.email || '').trim().toLowerCase()
    if (error || !email) return json({ error: 'Unauthorized' }, { status: 401 })

    const name = String((data?.user?.user_metadata as any)?.name || '').trim()
    const from = (Deno.env.get('RESEND_FROM') || 'AmazonLogisics <contact@amazonlogisics.com>').trim()

    const { subject, html } = welcomeTemplate({ name })
    const result = await sendAndLogEmail({
      supabase: service,
      eventType: 'user_welcome',
      recipient: email,
      idempotencyKey: `user-welcome/${data?.user?.id || email}`,
      body: { from, to: [email], subject, html, tags: [{ name: 'type', value: 'user_welcome' }] }
    })

    const adminEmail = (await getAdminEmail(service)) || (Deno.env.get('ADMIN_EMAIL') || 'admin@gmail.com').trim().toLowerCase()
    if (adminEmail) {
      const admin = adminAlertTemplate({
        title: 'New user signup',
        lines: [email, name ? `Name: ${name}` : '', data?.user?.id ? `User ID: ${data.user.id}` : ''].filter(Boolean)
      })
      await sendAndLogEmail({
        supabase: service,
        eventType: 'admin_alert_user_signup',
        recipient: adminEmail,
        idempotencyKey: `admin-alert/user-signup/${data?.user?.id || email}`,
        body: { from, to: [adminEmail], subject: admin.subject, html: admin.html, tags: [{ name: 'type', value: 'admin_alert_user_signup' }] }
      })
    }

    if (!result.ok) return json({ error: result.error }, { status: 500 })
    return json({ ok: true })
  } catch (err) {
    const message = String((err as any)?.message || err || 'Request failed')
    return json({ error: message }, { status: 500 })
  }
})
