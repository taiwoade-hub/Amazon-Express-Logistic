import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Activity, LogOut } from 'lucide-react'
import { COMPANY_PROFILE } from '../lib/companyProfile'
import { useAuth } from '../context/AuthContext'

function AdminShell({ title, subtitle, actions, children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()

  const navItems = [
    { to: '/admin', label: 'Shipments', icon: LayoutDashboard },
    { to: '/admin/activity', label: 'Activity', icon: Activity }
  ]

  const isActive = (to) => (to === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(to))

  return (
    <div className="min-h-[100dvh] bg-background text-text">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="lg:sticky lg:top-6 h-fit rounded-3xl bg-navy text-white border border-navy overflow-hidden">
            <div className="px-6 py-6 border-b border-white/10">
              <Link to="/admin" className="flex items-center gap-3">
                <img src={COMPANY_PROFILE.logoSrc} alt={`${COMPANY_PROFILE.name} logo`} className="w-9 h-9" />
                <div className="min-w-0">
                  <p className="text-sm font-black tracking-tight truncate">{COMPANY_PROFILE.name}</p>
                  <p className="text-[11px] font-semibold text-white/70 truncate">Admin Dashboard</p>
                </div>
              </Link>
            </div>

            <nav className="px-3 py-3">
              {navItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.to)
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black transition-colors ${
                      active ? 'bg-white text-navy' : 'text-white/85 hover:bg-white/10'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            <div className="px-6 py-6 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  logout()
                  navigate('/login', { replace: true })
                }}
                className="w-full inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white px-4 py-3 rounded-2xl text-sm font-black transition-colors"
              >
                <LogOut size={16} />
                <span>Sign out</span>
              </button>
              <p className="mt-3 text-[11px] font-semibold text-white/60 text-center">{COMPANY_PROFILE.domain}</p>
            </div>
          </aside>

          <section className="rounded-3xl bg-white border border-border overflow-hidden">
            <header className="px-6 sm:px-8 py-6 border-b border-border bg-white">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Admin</p>
                  <h1 className="text-2xl sm:text-3xl font-black text-primary tracking-tight">{title}</h1>
                  {subtitle ? <p className="text-xs text-text-muted font-semibold mt-2 max-w-2xl">{subtitle}</p> : null}
                </div>
                {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
              </div>
            </header>
            <div className="p-6 sm:p-8">{children}</div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default AdminShell
