export function getDeliveryImages(value) {
  if (!value) return []

  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 4)
  }

  if (typeof value !== 'string') return []

  const trimmed = value.trim()
  if (!trimmed) return []

  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 4)
      }
    } catch {
    }
  }

  return [trimmed]
}

export function serializeDeliveryImages(images) {
  const clean = (Array.isArray(images) ? images : [])
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .slice(0, 4)

  if (clean.length === 0) return null
  if (clean.length === 1) return clean[0]
  return JSON.stringify(clean)
}

