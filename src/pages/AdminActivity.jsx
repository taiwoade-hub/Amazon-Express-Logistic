import { useEffect, useState } from 'react'
import { Bell, Users, RefreshCcw } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import AdminShell from '../components/AdminShell'

function formatRelativeDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${format(date, 'HH:mm')} • ${formatDistanceToNow(date, { addSuffix: true })}`
}

function AdminActivity() {
  const { isAdmin } = useAuth()
  const [emailEvents, setEmailEvents] = useState([])
  const [signups, setSignups] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchInsights = async () => {
    if (!isAdmin) return
    try {
      setLoading(true)
      setError('')
      const [{ data: emailsData, error: emailsError }, { data: signupsData, error: signupsError }] = await Promise.all([
        supabase.from('email_events').select('*').order('created_at', { ascending: false }).limit(25),
        supabase.from('user_signups').select('*').order('created_at', { ascending: false }).limit(25)
      ])
      if (emailsError) throw emailsError
      if (signupsError) throw signupsError
      setEmailEvents(emailsData || [])
      setSignups(signupsData || [])
    } catch (err) {
      setError(err?.message || 'Failed to load activity.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInsights()
  }, [isAdmin])

  return (
    <AdminShell
      title="Activity"
      subtitle="Email events and recent signups recorded by the backend services."
      actions={
        <button
          type="button"
          onClick={fetchInsights}
          disabled={loading}
          className="bg-primary hover:bg-navy text-white px-4 py-2 rounded-2xl text-xs font-black transition-colors disabled:opacity-60"
        >
          <span className="inline-flex items-center gap-2">
            <RefreshCcw size={14} />
            <span>{loading ? 'Refreshing…' : 'Refresh'}</span>
          </span>
        </button>
      }
    >
      <div className="space-y-6">
        {error && (
          <div className="bg-accent text-white rounded-2xl p-4 text-sm font-black">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-3xl border border-border bg-white p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-primary text-white flex items-center justify-center flex-shrink-0">
                  <Bell size={18} />
                </div>
                <div>
                  <h2 className="text-base font-black text-primary">Email Activity</h2>
                  <p className="text-xs text-text-muted font-semibold mt-1">Resend events logged by the backend sender.</p>
                </div>
              </div>
              <div className="text-[10px] font-black uppercase tracking-wider text-text-muted">{emailEvents.length}</div>
            </div>
            <div className="mt-4 space-y-2">
              {emailEvents.length === 0 ? (
                <div className="text-xs font-black text-text-muted">No email events yet.</div>
              ) : (
                emailEvents.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border border-border rounded-2xl px-4 py-3">
                    <div className="text-xs font-black text-primary">{String(item.event_type || '').replaceAll('_', ' ')}</div>
                    <div className="text-[11px] font-semibold text-text-muted truncate">{item.recipient}</div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-primary">{item.status}</div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-text-muted">{formatRelativeDateTime(item.created_at)}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-white p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-navy text-white flex items-center justify-center flex-shrink-0">
                  <Users size={18} />
                </div>
                <div>
                  <h2 className="text-base font-black text-primary">Recent Signups</h2>
                  <p className="text-xs text-text-muted font-semibold mt-1">Users who registered in the system.</p>
                </div>
              </div>
              <div className="text-[10px] font-black uppercase tracking-wider text-text-muted">{signups.length}</div>
            </div>
            <div className="mt-4 space-y-2">
              {signups.length === 0 ? (
                <div className="text-xs font-black text-text-muted">No signups tracked yet.</div>
              ) : (
                signups.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border border-border rounded-2xl px-4 py-3">
                    <div className="text-xs font-black text-primary">{item.name || 'User'}</div>
                    <div className="text-[11px] font-semibold text-text-muted truncate">{item.email}</div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-primary">{formatRelativeDateTime(item.created_at)}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  )
}

export default AdminActivity
