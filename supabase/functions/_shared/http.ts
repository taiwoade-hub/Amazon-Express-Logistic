export const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
  'access-control-allow-methods': 'POST, GET, OPTIONS'
} as const

export function handleOptions(req: Request) {
  if (req.method !== 'OPTIONS') return null
  return new Response('ok', { headers: corsHeaders })
}

export function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers)
  for (const [k, v] of Object.entries(corsHeaders)) headers.set(k, v)
  headers.set('content-type', 'application/json; charset=utf-8')
  return new Response(JSON.stringify(data), { ...init, headers })
}

