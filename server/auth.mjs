export async function getAuthUser({ supabaseAdmin, req }) {
  const raw = String(req.headers.authorization || '').trim()
  if (!raw.toLowerCase().startsWith('bearer ')) return null
  const token = raw.slice(7).trim()
  if (!token) return null
  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error) return null
  return data?.user || null
}

export async function isAdminRequest({ supabaseAdmin, req }) {
  const user = await getAuthUser({ supabaseAdmin, req })
  if (user?.email) {
    const envAdmin = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase()
    const dbAdmin = String(process.env.ADMIN_EMAIL_FROM_DB || '').trim().toLowerCase()
    const email = String(user.email).trim().toLowerCase()
    const ok = !!email && (email === envAdmin || email === dbAdmin)
    return { ok, user }
  }

  const headerEmail = String(req.headers['x-admin-email'] || '').trim().toLowerCase()
  const headerPassword = String(req.headers['x-admin-password'] || '').trim()
  const envAdmin = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase()
  const dbAdmin = String(process.env.ADMIN_EMAIL_FROM_DB || '').trim().toLowerCase()
  const adminPassword = String(process.env.ADMIN_PASSWORD || '##5351235admin').trim()

  const ok =
    !!headerEmail &&
    (headerEmail === envAdmin || headerEmail === dbAdmin) &&
    !!headerPassword &&
    headerPassword === adminPassword

  return { ok, user: ok ? { email: headerEmail } : null }
}
