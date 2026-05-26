import { supabase } from '../supabaseClient'

type InvokeResult<T> = { ok: true; data: T } | { ok: false; error: string }

function errorMessage(err: unknown) {
  const anyErr = err as any
  const ctx = anyErr?.context
  const ctxMessage = String(ctx?.message || '').trim()
  const errMessage = String(anyErr?.message || '').trim()
  const raw = String(anyErr || '').trim()

  let message = ctxMessage || errMessage || raw || 'Request failed'

  const status = ctx?.status
  const body = ctx?.body
  if (body) {
    try {
      const parsed = typeof body === 'string' ? JSON.parse(body) : body
      const parsedError = String(parsed?.error || parsed?.message || '').trim()
      if (parsedError) message = parsedError
    } catch {}
  }

  if (status) message = `${message} (HTTP ${status})`
  return message
}

export async function invokeEdgeFunction<T = any>(name: string, body?: Record<string, unknown>): Promise<InvokeResult<T>> {
  if ((supabase as any).isMock) return { ok: false, error: 'Supabase Edge Functions are unavailable in mock mode.' }
  if (!(supabase as any).functions?.invoke) return { ok: false, error: 'Supabase Edge Functions are not available.' }

  try {
    const { data, error } = await (supabase as any).functions.invoke(name, body ? { body } : undefined)
    if (error) {
      const msg = errorMessage(error)
      if (msg.toLowerCase().includes('failed to fetch')) {
        const url = String(import.meta.env.VITE_SUPABASE_URL || '').trim()
        const isLocal = url.includes('127.0.0.1') || url.includes('localhost')
        const hint = isLocal
          ? 'Your Supabase URL points to local Supabase, but local Supabase is not running. Either install/run Docker for local Supabase, or use a hosted Supabase project URL.'
          : 'Cannot reach Supabase Edge Functions. Confirm VITE_SUPABASE_URL is correct (https://<project>.supabase.co) and that Edge Functions are deployed in your Supabase project.'
        return { ok: false, error: `${msg}. ${hint}` }
      }
      return { ok: false, error: msg }
    }
    return { ok: true, data: data as T }
  } catch (err) {
    const msg = errorMessage(err)
    if (msg.toLowerCase().includes('failed to fetch')) {
      const url = String(import.meta.env.VITE_SUPABASE_URL || '').trim()
      const isLocal = url.includes('127.0.0.1') || url.includes('localhost')
      const hint = isLocal
        ? 'Your Supabase URL points to local Supabase, but local Supabase is not running. Either install/run Docker for local Supabase, or use a hosted Supabase project URL.'
        : 'Cannot reach Supabase Edge Functions. Confirm VITE_SUPABASE_URL is correct (https://<project>.supabase.co) and that Edge Functions are deployed in your Supabase project.'
      return { ok: false, error: `${msg}. ${hint}` }
    }
    return { ok: false, error: msg }
  }
}
