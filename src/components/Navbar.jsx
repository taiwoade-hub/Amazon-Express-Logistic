import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Truck, Info, Menu, X, LogOut, User, ShieldAlert, Package, Home, Bell } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { COMPANY_PROFILE } from '../lib/companyProfile'

function Navbar() {
  const isMock = supabase.isMock
  const { user, isAdmin, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  if (location.pathname === '/login') return null;

  const handleLogout = () => {
    logout()
    setMobileMenuOpen(false)
    navigate('/')
  }

  const isActive = (path) => location.pathname === path

  const navLinkClass = (path) => 
    `text-sm transition-all ${
      isActive(path) 
        ? 'text-primary font-extrabold' 
        : 'text-text-muted font-semibold hover:text-primary'
    }`

  const mobileNavLinkClass = (path) => 
    `block px-4 py-3 rounded-xl text-base font-semibold transition-all ${
      isActive(path) 
        ? 'bg-primary text-white' 
        : 'text-primary/80 hover:bg-black/5'
    }`

  return (
    <div className="sticky top-0 z-50">
      {/* Sandbox Banner */}
      {isMock && (
        <div className="bg-black text-white border-b border-black text-xs py-2 px-6 flex items-center justify-center gap-2 font-black uppercase tracking-wider">
          <Info size={14} className="text-white flex-shrink-0" />
          <span>
            <strong>Sandbox Mode:</strong> Running with local storage.
          </span>
        </div>
      )}

      {/* Main Nav */}
      <nav className="bg-white/90 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          
          <Link to="/" className="flex items-center gap-3 font-black text-primary tracking-tight">
            <img src={COMPANY_PROFILE.logoSrc} alt={`${COMPANY_PROFILE.name} logo`} className="w-8 h-8" />
            <span className="text-base sm:text-xl truncate max-w-[180px]">{COMPANY_PROFILE.name}</span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className={navLinkClass('/')}>Home</Link>
            <Link to="/send" className={navLinkClass('/send')}>Send Package</Link>
            <Link to="/track" className={navLinkClass('/track')}>Track</Link>
            
            {user && !isAdmin && (
              <>
                <Link to="/dashboard" className={navLinkClass('/dashboard')}>My Portal</Link>
                <Link to="/notifications" className={navLinkClass('/notifications')}>Notifications</Link>
              </>
            )}
            
            {isAdmin && (
              <Link to="/admin" className={navLinkClass('/admin')}>Admin Control</Link>
            )}
          </div>

          {/* Desktop User Panel */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-xs text-text-muted font-semibold">Logged in as</span>
                  <span className="text-sm font-extrabold text-primary truncate max-w-[140px]">{user.name}</span>
                </div>
                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-primary font-black border border-border">
                  {isAdmin ? <ShieldAlert size={18} className="text-primary" /> : <User size={18} />}
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-primary hover:bg-black/5 rounded-xl transition-all"
                  title="Sign Out"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link 
                to="/login" 
                className="bg-primary hover:bg-black text-white px-5 py-2 rounded-xl text-sm font-black transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-primary hover:bg-black/5 rounded-xl transition-all"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border py-4 px-4 space-y-2 bg-white">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass('/')}>
              <div className="flex items-center gap-3">
                <Home size={18} />
                <span>Home</span>
              </div>
            </Link>
            <Link to="/send" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass('/send')}>
              <div className="flex items-center gap-3">
                <Package size={18} />
                <span>Send Package</span>
              </div>
            </Link>
            <Link to="/track" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass('/track')}>
              <div className="flex items-center gap-3">
                <Truck size={18} />
                <span>Track Package</span>
              </div>
            </Link>
            
            {user && !isAdmin && (
              <>
                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass('/dashboard')}>
                  <div className="flex items-center gap-3">
                    <User size={18} />
                    <span>My Portal</span>
                  </div>
                </Link>
                <Link to="/notifications" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass('/notifications')}>
                  <div className="flex items-center gap-3">
                    <Bell size={18} />
                    <span>Notifications</span>
                  </div>
                </Link>
              </>
            )}
 
            {isAdmin && (
              <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass('/admin')}>
                <div className="flex items-center gap-3">
                  <ShieldAlert size={18} className="text-black" />
                  <span>Admin Control</span>
                </div>
              </Link>
            )}

            {/* Mobile User Panel Bottom */}
            <div className="pt-4 border-t border-border">
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-border">
                    <div className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center font-black text-primary">
                      {isAdmin ? <ShieldAlert size={16} className="text-primary" /> : <User size={16} />}
                    </div>
                    <div className="truncate">
                      <p className="text-xs text-text-muted font-semibold">Account Profile</p>
                      <p className="text-sm font-extrabold text-primary truncate">{user.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-black text-white py-3 rounded-xl text-base font-black transition-colors"
                  >
                    <LogOut size={18} />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full block text-center bg-primary hover:bg-black text-white py-3 rounded-xl text-base font-black transition-colors"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </div>
  )
}

export default Navbar
