import { getEnv } from './env.ts'

type ResendSendBody = {
  from: string
  to: string[] | string
  subject: string
  html?: string
  text?: string
  attachments?: Array<{ filename: string; content: string; contentType?: string }>
  tags?: Array<{ name: string; value: string }>
  headers?: Record<string, string>
}

export async function sendResendEmail(args: { body: ResendSendBody; idempotencyKey?: string }) {
  const apiKey = getEnv('RESEND_API_KEY')
  if (!apiKey) {
    return { data: null as null, error: 'Email service is not configured (missing RESEND_API_KEY).' }
  }

  const makeRequest = async (body: ResendSendBody) => {
    try {
      return await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${apiKey}`,
          'content-type': 'application/json',
          ...(args.idempotencyKey ? { 'Idempotency-Key': args.idempotencyKey } : {})
        },
        body: JSON.stringify(body)
      })
    } catch (err) {
      const message = String((err as any)?.message || err || 'Failed to reach email provider.')
      console.error('Resend fetch failed:', message)
      return new Response(JSON.stringify({ error: message }), { status: 500 })
    }
  }

  let resp = await makeRequest(args.body)
  let payload = await resp.json().catch(() => ({}))

  if (!resp.ok) {
    const message = String(payload?.message || payload?.error || 'Failed to send email.')
    console.error('Resend error:', resp.status, message)

    const isUnverifiedDomain = message.toLowerCase().includes('not verified') || 
                               message.toLowerCase().includes('unverified') ||
                               message.toLowerCase().includes('invalid from') ||
                               message.toLowerCase().includes('invalid `from`')

    if (isUnverifiedDomain && args.body.from !== 'onboarding@resend.dev') {
      console.warn(`Domain for sender '${args.body.from}' is not verified. Retrying with sandbox sender 'onboarding@resend.dev'...`)
      const retryBody = {
        ...args.body,
        from: 'onboarding@resend.dev'
      }
      resp = await makeRequest(retryBody)
      payload = await resp.json().catch(() => ({}))
      
      if (!resp.ok) {
        const retryMessage = String(payload?.message || payload?.error || 'Failed to send email on retry.')
        console.error('Resend retry error:', resp.status, retryMessage)
        return { data: null as null, error: retryMessage }
      }
    } else {
      return { data: null as null, error: message }
    }
  }

  return { data: payload as { id?: string }, error: '' }
}
