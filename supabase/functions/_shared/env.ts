export function getEnv(key: string) {
  return (Deno.env.get(key) || '').trim()
}

export function requireEnv(key: string) {
  const value = getEnv(key)
  if (!value) throw new Error(`Missing environment variable: ${key}`)
  return value
}

export function requireAnyEnv(keys: string[]) {
  for (const key of keys) {
    const value = getEnv(key)
    if (value) return value
  }
  throw new Error(`Missing environment variable (any of): ${keys.join(', ')}`)
}
