import {
  sendAdminAlert,
  sendPackageCreatedEmail
} from '../services/emailService.mjs'

function getAdminAlertEmail({ delivery }) {
  const envEmail = String(process.env.ADMIN_EMAIL || '').trim()
  const settingsEmail = String(process.env.ADMIN_EMAIL_FROM_DB || '').trim()
  const fallback = String(delivery?.admin_email || '').trim()
  return settingsEmail || envEmail || fallback
}

export async function startDeliveryEmailListeners({ supabaseAdmin }) {
  const channel = supabaseAdmin
    .channel('server_delivery_email_events')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'deliveries' }, async (payload) => {
      const delivery = payload?.new
      const to = String(delivery?.sender_email || '').trim()
      if (!to) return
      const createdResult = await sendPackageCreatedEmail({ supabaseAdmin, to, delivery })
      if (createdResult?.error) {
        console.error(createdResult.error)
      }

      const adminEmail = getAdminAlertEmail({ delivery })
      if (adminEmail) {
        const adminResult = await sendAdminAlert({
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
        if (adminResult?.error) {
          console.error(adminResult.error)
        }
      }
    })
    .subscribe()

  return () => {
    channel.unsubscribe()
  }
}
