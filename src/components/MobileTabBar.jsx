import { Link, useLocation } from 'react-router-dom'
import { Home, Package, Truck, User, ShieldAlert, Bell } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function MobileTabBar() {
  const location = useLocation()
  const { user, isAdmin } = useAuth()

  if (location.pathname === '/login') return null

  const items = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/track', label: 'Track', icon: Truck },
    { to: '/send', label: 'Send', icon: Package },
    user && !isAdmin ? { to: '/notifications', label: 'Inbox', icon: Bell } : null,
    user
      ? isAdmin
        ? { to: '/admin', label: 'Admin', icon: ShieldAlert }
        : { to: '/dashboard', label: 'Portal', icon: User }
      : { to: '/login', label: 'Sign In', icon: User }
  ].filter(Boolean)

  const isActive = (to) => (to === '/' ? location.pathname === '/' : location.pathname.startsWith(to))

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-white/95 backdrop-blur">
      <div className={`max-w-7xl mx-auto px-6 pt-2 pb-5 grid ${items.length === 5 ? 'grid-cols-5' : 'grid-cols-4'}`}>
        {items.map((item) => {
          const Icon = item.icon
          const active = isActive(item.to)
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center gap-1 py-2 text-xs font-semibold ${
                active ? 'text-primary' : 'text-text-muted'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${
                  active ? 'bg-primary text-white' : 'bg-transparent text-text-muted'
                }`}
              >
                <Icon size={18} />
              </div>
              <span className="text-[11px]">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default MobileTabBar
