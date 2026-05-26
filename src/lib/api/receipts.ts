import { invokeEdgeFunction } from './edgeFunctions'

export async function getAdminReceiptUrl(trackingId: string) {
  const res = await invokeEdgeFunction<{ url?: string }>('receipts-get-admin-url', { trackingId })
  if (!res.ok) return res
  const url = String(res.data?.url || '').trim()
  if (!url) return { ok: false as const, error: 'Missing receipt URL.' }
  return { ok: true as const, data: { url } }
}

