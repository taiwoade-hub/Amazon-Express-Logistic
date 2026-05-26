import { URL } from 'node:url'

export function json(res, statusCode, payload) {
  const body = JSON.stringify(payload ?? {})
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body)
  })
  res.end(body)
}

export function text(res, statusCode, body) {
  const value = String(body ?? '')
  res.writeHead(statusCode, {
    'content-type': 'text/plain; charset=utf-8',
    'content-length': Buffer.byteLength(value)
  })
  res.end(value)
}

export function getRequestUrl(req) {
  const host = req.headers.host || 'localhost'
  const proto = req.headers['x-forwarded-proto'] || 'http'
  return new URL(req.url || '/', `${proto}://${host}`)
}

export async function readJson(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw.trim()) return null
  return JSON.parse(raw)
}

function getDefaultCorsOrigins() {
  const appUrl = String(process.env.PUBLIC_APP_URL || '').trim()
  if (!appUrl) return []
  try {
    const parsed = new URL(appUrl)
    const origin = parsed.origin
    if (!origin) return []
    if (parsed.hostname.startsWith('www.')) {
      return [origin, `${parsed.protocol}//${parsed.hostname.slice(4)}`]
    }
    return [origin, `${parsed.protocol}//www.${parsed.hostname}`]
  } catch {
    return []
  }
}

export function withCors(req, res) {
  const origin = String(req.headers.origin || '')
  const envAllowed = String(process.env.CORS_ORIGINS || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
  const allowed = envAllowed.length ? envAllowed : getDefaultCorsOrigins()

  let allowOrigin = ''
  if (origin) {
    if (allowed.includes('*')) {
      allowOrigin = origin
    } else if (allowed.includes(origin)) {
      allowOrigin = origin
    } else if (allowed.some((entry) => entry.endsWith('*') && origin.startsWith(entry.slice(0, -1)))) {
      allowOrigin = origin
    } else if (process.env.NODE_ENV !== 'production' && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
      allowOrigin = origin
    }
  }

  if (allowOrigin) {
    res.setHeader('access-control-allow-origin', allowOrigin)
    res.setHeader('vary', 'origin')
  }

  res.setHeader('access-control-allow-methods', 'GET,POST,OPTIONS')
  res.setHeader('access-control-allow-headers', 'content-type,authorization,x-admin-email,x-admin-password')
  res.setHeader('access-control-max-age', '86400')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return true
  }

  return false
}
