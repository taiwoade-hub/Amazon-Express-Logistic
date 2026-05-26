import { createClient } from 'npm:@supabase/supabase-js@2.106.1'
import { requireAnyEnv, requireEnv } from './env.ts'

export function createSupabaseServiceClient() {
  const url = requireAnyEnv(['SUPABASE_URL', 'SUPABASE_PROJECT_URL'])
  const serviceKey = requireAnyEnv(['SUPABASE_SERVICE_ROLE_KEY', 'SERVICE_ROLE_KEY'])
  return createClient(url, serviceKey, {
    auth: { persistSession: false }
  })
}

export function createSupabaseUserClient(req: Request) {
  const auth = req.headers.get('authorization') || ''
  const url = requireAnyEnv(['SUPABASE_URL', 'SUPABASE_PROJECT_URL'])
  const anonKey = requireAnyEnv(['SUPABASE_ANON_KEY', 'ANON_KEY'])
  return createClient(url, anonKey, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false }
  })
}

export async function getUserEmailFromRequest(req: Request) {
  const supabase = createSupabaseUserClient(req)
  const { data, error } = await supabase.auth.getUser()
  if (error) return ''
  return String(data?.user?.email || '').trim().toLowerCase()
}

export async function getAdminEmail(service: ReturnType<typeof createSupabaseServiceClient>) {
  const { data, error } = await service
    .from('app_settings')
    .select('value')
    .eq('key', 'admin_email')
    .maybeSingle()
  if (error) return ''
  return String(data?.value || '').trim().toLowerCase()
}
