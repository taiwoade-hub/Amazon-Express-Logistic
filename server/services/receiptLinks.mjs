import { nanoid } from 'nanoid'

export async function createReceiptLinkToken({ supabaseAdmin, trackingId }) {
  const token = nanoid(32)
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString()

  const { error } = await supabaseAdmin.from('receipt_links').insert([
    { tracking_id: trackingId, token, expires_at: expiresAt }
  ])

  if (error) {
    console.error(error)
    return { token: '' }
  }

  return { token }
}

export async function validateReceiptToken({ supabaseAdmin, trackingId, token }) {
  if (!token) return false
  const { data, error } = await supabaseAdmin
    .from('receipt_links')
    .select('expires_at')
    .eq('tracking_id', trackingId)
    .eq('token', token)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data?.expires_at) return false
  return new Date(data.expires_at).getTime() > Date.now()
}

