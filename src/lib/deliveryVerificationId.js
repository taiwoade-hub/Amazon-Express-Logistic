function fnv1a32(value) {
  let hash = 0x811c9dc5
  const str = String(value ?? '')
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

export function getDeliveryVerificationId(delivery) {
  const existing = String(delivery?.delivery_verification_id || delivery?.dvi || '').trim()
  if (existing) return existing

  const tracking = String(delivery?.tracking_id ?? '').trim().toUpperCase()
  const id = String(delivery?.id ?? '').trim()
  const dateValue = delivery?.updated_at || delivery?.created_at
  const year = (() => {
    const date = new Date(dateValue || Date.now())
    return Number.isNaN(date.getTime()) ? new Date().getFullYear() : date.getFullYear()
  })()

  const seed = `${tracking}|${id}|${String(dateValue ?? '').trim()}`
  const code = fnv1a32(seed).toString(36).toUpperCase().padStart(6, '0').slice(0, 6)
  return `DLV-${code}-${year}`
}
