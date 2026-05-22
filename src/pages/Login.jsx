import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function Login() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { login, signup, user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  const redirect = searchParams.get('redirect') || 'dashboard'
  const isUnauthorized = searchParams.get('error') === 'unauthorized'
  const normalizeRedirect = (value) => {
    const cleaned = String(value || '').trim()
    if (!cleaned) return '/dashboard'
    if (cleaned.startsWith('/')) return cleaned
    return `/${cleaned}`
  }

  useEffect(() => {
    // If already logged in, redirect away
    if (user) {
      navigate(user.role === 'admin' ? '/admin' : normalizeRedirect(redirect), { replace: true })
    }
  }, [user, navigate, redirect])

  useEffect(() => {
    if (isUnauthorized) {
      setError('Access denied. Please log in with administrator credentials.')
    }
  }, [isUnauthorized])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        const res = await login(email, password)
        if (res.success) {
          navigate(res.user.role === 'admin' ? '/admin' : normalizeRedirect(redirect), { replace: true })
        } else {
          setError(res.error || 'Login failed')
        }
      } else {
        if (!name.trim()) {
          setError('Name is required')
          setLoading(false)
          return
        }
        const res = await signup(name, email, password)
        if (res.success) {
          navigate(normalizeRedirect(redirect), { replace: true })
        } else {
          setError(res.error || 'Registration failed')
        }
      }
    } catch (err) {
      console.error('Auth error:', err)
      setError('An error occurred during authentication. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="relative bg-background min-h-[100dvh] w-full overflow-hidden flex items-center justify-center">
      <div className="w-full max-w-md px-6">
        <div className="bg-white flex flex-col items-center gap-y-8 rounded-3xl border border-border px-6 sm:px-8 py-8 sm:py-10 shadow-2xl">
          <div className="flex flex-col items-center gap-y-4 text-center">
            <Link to="/" className="flex flex-col items-center gap-3 mb-2 hover:opacity-90 transition-opacity">
              <img src="/logo.svg" alt="Amazon Logistics Logo" className="w-14 h-14" />
              <span className="font-black text-primary tracking-tight text-lg">amazonlogisics.com</span>
            </Link>
            <h1 className="text-3xl font-black tracking-tight text-primary">
              {isLogin ? 'Welcome Back' : 'Create an account'}
            </h1>
            <p className="text-text-muted text-sm font-medium px-4">
              {isLogin ? 'Login to manage deliveries and tracking.' : 'Sign up to save and track all your deliveries.'}
            </p>
          </div>

          <div className="flex w-full flex-col gap-5">
            {error && (
              <div className="w-full rounded-2xl bg-red-50 text-red-600 px-4 py-3 text-sm font-semibold border border-red-100 text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
              {!isLogin && (
                <Input
                  type="text"
                  placeholder="Full Name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 rounded-xl border-border bg-gray-50/50"
                />
              )}
              <Input
                type="email"
                placeholder="Email Address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl border-border bg-gray-50/50"
              />
              <Input
                type="password"
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl border-border bg-gray-50/50"
              />

              <Button type="submit" disabled={loading} className="w-full h-12 text-base font-bold rounded-xl mt-2 shadow-md hover:shadow-lg transition-all">
                {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            <div className="text-text-muted flex justify-center gap-2 text-sm font-medium mt-2">
              <span>{isLogin ? "Don't have an account?" : 'Already have an account?'}</span>
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin)
                  setError('')
                }}
                className="text-primary font-bold hover:underline transition-all"
              >
                {isLogin ? 'Sign up' : 'Log in'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-4 px-6">
        <div className="max-w-md mx-auto text-center text-[11px] text-text-muted font-semibold leading-relaxed">
          <a href="tel:+447385284814" className="font-black text-primary hover:text-black transition-colors">
            +44 7385284814
          </a>
          <span className="mx-2">•</span>
          <span>123 Mabini Street, Barangay San Isidro, Quezon City, Metro Manila 🇵🇭</span>
        </div>
      </div>
    </section>
  )
}

export default Login
