import { sendResendEmail } from './resend.ts'

type SupabaseServiceClient = {
  from: (table: string) => any
  storage: any
}

async function logEmailEvent(args: {
  supabase: SupabaseServiceClient
  eventType: string
  trackingId?: string
  recipient: string
  resendId?: string
  status: 'sent' | 'failed'
  errorMessage?: string
}) {
  await args.supabase.from('email_events').insert([
    {
      event_type: args.eventType,
      tracking_id: args.trackingId || null,
      recipient: args.recipient,
      resend_id: args.resendId || null,
      status: args.status,
      error_message: args.errorMessage || null
    }
  ])
}

export async function sendAndLogEmail(args: {
  supabase: SupabaseServiceClient
  eventType: string
  trackingId?: string
  recipient: string
  idempotencyKey?: string
  body: Parameters<typeof sendResendEmail>[0]['body']
}) {
  const { data, error } = await sendResendEmail({ body: args.body, idempotencyKey: args.idempotencyKey })
  await logEmailEvent({
    supabase: args.supabase,
    eventType: args.eventType,
    trackingId: args.trackingId,
    recipient: args.recipient,
    resendId: data?.id,
    status: error ? 'failed' : 'sent',
    errorMessage: error || undefined
  })

  if (error) return { ok: false as const, error }
  return { ok: true as const, id: data?.id || '' }
}

