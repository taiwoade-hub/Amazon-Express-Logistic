import { handleOptions, json } from '../_shared/http.ts'
import { createSupabaseServiceClient, getAdminEmail, getUserEmailFromRequest } from '../_shared/supabase.ts'
import { generateReceiptPdfBase64 } from '../_shared/receiptPdf.ts'

function fromBase64(value: string) {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function ensureReceiptPdf(args: {
  supabase: ReturnType<typeof createSupabaseServiceClient>
  trackingId: string
}) {
  const bucket = 'receipts'
  const objectPath = `${args.trackingId}.pdf`

  try {
    const buckets = await args.supabase.storage.listBuckets()
    const exists = Array.isArray(buckets.data) && buckets.data.some((b: any) => String(b?.id || b?.name) === bucket)
    if (!exists) {
      await args.supabase.storage.createBucket(bucket, { public: false }).catch(() => {})
    }
  } catch {}

  // Removed the early return so the PDF is ALWAYS regenerated with the latest status and layout


  const { data: delivery, error } = await args.supabase
    .from('deliveries')
    .select('*')
    .eq('tracking_id', args.trackingId)
    .maybeSingle()
  if (error || !delivery) return { ok: false as const, error: 'Delivery not found', objectPath: '' }

  const pdfBase64 = await generateReceiptPdfBase64(delivery as Record<string, unknown>)
  const bytes = fromBase64(pdfBase64)
  const upload = await args.supabase.storage.from(bucket).upload(objectPath, bytes, {
    contentType: 'application/pdf',
    upsert: true
  })
  if (upload.error) return { ok: false as const, error: upload.error.message, objectPath: '' }

  const signed = await args.supabase.storage.from(bucket).createSignedUrl(objectPath, 60 * 15)
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

    const body = await req.json().catch(() => null) as { trackingId?: string } | null
    const trackingId = String(body?.trackingId || '').trim().toUpperCase()
    if (!trackingId) return json({ error: 'Missing trackingId' }, { status: 400 })

    const result = await ensureReceiptPdf({ supabase: service, trackingId })
    if (!result.ok) return json({ error: result.error }, { status: 404 })
    return json({ ok: true, url: result.url })
  } catch (err) {
    const message = String((err as any)?.message || err || 'Request failed')
    return json({ error: message }, { status: 500 })
  }
})
