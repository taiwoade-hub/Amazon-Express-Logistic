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
    <section className="bg-background h-[100svh] overflow-hidden">
      <div className="flex h-[100svh] items-center justify-center px-6">
        <div className="bg-white flex w-full max-w-sm flex-col items-center gap-y-8 rounded-3xl border border-border px-6 py-12 shadow-xl max-h-[calc(100svh-48px)] overflow-auto">
          <div className="flex flex-col items-center gap-y-3">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white">
                <Truck size={20} />
              </div>
              <span className="font-black text-primary tracking-tight">amazonlogisics.com</span>
            </Link>
            <h1 className="text-3xl font-black tracking-tight text-primary">
              {isLogin ? 'Welcome Back' : 'Create an account'}
            </h1>
            <p className="text-text-muted text-sm font-semibold">
              {isLogin ? 'Login to manage deliveries and tracking.' : 'Sign up to save and track all your deliveries.'}
            </p>
          </div>

          <div className="flex w-full flex-col gap-4">
            {error && (
              <div className="w-full rounded-2xl bg-primary text-white px-4 py-3 text-sm font-black">
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
                />
              )}
              <Input
                type="email"
                placeholder="Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <div className="flex flex-col gap-3">
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Please wait...' : isLogin ? 'Login' : 'Create an account'}
                </Button>
              </div>
            </form>

            <div className="text-text-muted flex justify-center gap-1 text-sm font-semibold">
              <p>{isLogin ? "Don't have an account?" : 'Already have an account?'}</p>
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin)
                  setError('')
                }}
                className="text-primary font-black hover:underline"
              >
                {isLogin ? 'Sign up' : 'Login'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Login
