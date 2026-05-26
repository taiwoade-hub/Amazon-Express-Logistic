import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [adminEmail, setAdminEmail] = useState(() => {
    const envEmail = import.meta.env.VITE_ADMIN_EMAIL
    return localStorage.getItem('axl_admin_email') || envEmail || 'admin@gmail.com'
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedSession = localStorage.getItem('axl_session')
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession)
        if (parsed?.role === 'admin' || supabase.isMock) {
          setUser(parsed)
        }
      } catch (e) {
        console.error('Failed to parse auth session', e)
        localStorage.removeItem('axl_session')
      }
    }
  }, [])

  const isSupabaseAuthEnabled = !supabase.isMock && !!supabase.auth

  const cleanEmail = (email) => String(email || '').trim().toLowerCase()

  const isAdminEmail = (email) => {
    const normalized = cleanEmail(email)
    return normalized && (normalized === cleanEmail(adminEmail) || normalized === 'admin@gmail.com')
  }

  const toSessionUser = (email, name) => ({
    email: cleanEmail(email),
    role: isAdminEmail(email) ? 'admin' : 'user',
    name: name || String(email || '').split('@')[0]
  })

  useEffect(() => {
    if (!isSupabaseAuthEnabled) {
      setLoading(false)
      return
    }

    const savedSession = localStorage.getItem('axl_session')
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession)
        if (parsed?.role === 'admin') {
          setUser(parsed)
          setLoading(false)
          return
        }
      } catch {
        localStorage.removeItem('axl_session')
      }
    }

    let cancelled = false

    const init = async () => {
      const { data } = await supabase.auth.getSession()
      if (cancelled) return
      const sbUser = data?.session?.user
      setUser(sbUser ? toSessionUser(sbUser.email, sbUser.user_metadata?.name) : null)
      setLoading(false)
    }

    init()

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      const sbUser = session?.user
      setUser(sbUser ? toSessionUser(sbUser.email, sbUser.user_metadata?.name) : null)
    })

    return () => {
      cancelled = true
      subscription?.subscription?.unsubscribe()
    }
  }, [isSupabaseAuthEnabled, adminEmail])

  useEffect(() => {
    if (!isSupabaseAuthEnabled) return

    let cancelled = false
    const loadAdminEmail = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'admin_email')
          .single()

        if (!cancelled && !error && data?.value) {
          setAdminEmail(String(data.value))
          localStorage.setItem('axl_admin_email', String(data.value))
        }
      } catch {}
    }
    loadAdminEmail()

    return () => {
      cancelled = true
    }
  }, [isSupabaseAuthEnabled])

  const getAdminEmail = () => {
    return adminEmail
  }

  const login = async (email, password) => {
    const adminEmail = getAdminEmail()
    const envAdminPassword = String(import.meta.env.VITE_ADMIN_PASSWORD || '').trim()
    const fallbackAdminPassword = '##5351235admin'

    const passwordOk = password === (envAdminPassword || fallbackAdminPassword)

    if (isAdminEmail(email) && passwordOk) {
      const adminUser = {
        email: cleanEmail(adminEmail) || 'admin@gmail.com',
        role: 'admin',
        name: 'System Administrator'
      }
      setUser(adminUser)
      localStorage.setItem('axl_session', JSON.stringify(adminUser))
      return { success: true, user: adminUser }
    }

    if (isSupabaseAuthEnabled) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail(email),
        password
      })
      if (error) return { success: false, error: error.message }
      const sessionUser = data?.user ? toSessionUser(data.user.email, data.user.user_metadata?.name) : null
      if (sessionUser) setUser(sessionUser)
      return { success: true, user: sessionUser }
    }

    // 2. Check for regular users
    const mockUsers = JSON.parse(localStorage.getItem('axl_users') || '[]')
    const foundUser = mockUsers.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    )
    
    if (foundUser) {
      const regularUser = { 
        email: foundUser.email, 
        role: 'user', 
        name: foundUser.name || foundUser.email.split('@')[0] 
      }
      setUser(regularUser)
      localStorage.setItem('axl_session', JSON.stringify(regularUser))
      return { success: true, user: regularUser }
    }

    return { success: false, error: 'Invalid email or password' }
  }

  const signup = async (name, email, password) => {
    const cleanEmailValue = email.trim().toLowerCase()
    const adminEmail = getAdminEmail()
    
    if (cleanEmailValue === adminEmail.toLowerCase()) {
      return { success: false, error: 'Email address reserved for administrator' }
    }

    if (isSupabaseAuthEnabled) {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmailValue,
        password,
        options: {
          data: { name }
        }
      })

      if (error) return { success: false, error: error.message }

      if (!data?.session) {
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: cleanEmailValue,
          password
        })
        if (loginError) {
          return { success: false, error: 'Email confirmation is enabled on Supabase. Disable it in Supabase Auth settings to allow instant signup.' }
        }

        const sessionUser = loginData?.user ? toSessionUser(loginData.user.email, loginData.user.user_metadata?.name) : null
        if (sessionUser) setUser(sessionUser)
        try {
          try {
            await supabase.from('user_signups').insert([{ email: cleanEmailValue, name }])
          } catch {}
          const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
          const accessToken = loginData?.session?.access_token
          if (apiBaseUrl && accessToken) {
            fetch(`${apiBaseUrl.replace(/\/+$/, '')}/auth/welcome`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${accessToken}` }
            })
          }
        } catch {}
        return { success: true, user: sessionUser }
      }

      const sessionUser = data?.user ? toSessionUser(data.user.email, data.user.user_metadata?.name) : null
      if (sessionUser) setUser(sessionUser)
      try {
        try {
          await supabase.from('user_signups').insert([{ email: cleanEmailValue, name }])
        } catch {}
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
        const accessToken = data?.session?.access_token
        if (apiBaseUrl && accessToken) {
          fetch(`${apiBaseUrl.replace(/\/+$/, '')}/auth/welcome`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}` }
          })
        }
      } catch {}
      return { success: true, user: sessionUser }
    }

    const mockUsers = JSON.parse(localStorage.getItem('axl_users') || '[]')
    if (mockUsers.some(u => u.email.toLowerCase() === cleanEmailValue)) {
      return { success: false, error: 'Email address already registered' }
    }

    const newUser = { name, email: cleanEmailValue, password }
    mockUsers.push(newUser)
    localStorage.setItem('axl_users', JSON.stringify(mockUsers))

    // Log the user in immediately after signup
    const userSession = { email: cleanEmailValue, role: 'user', name }
    setUser(userSession)
    localStorage.setItem('axl_session', JSON.stringify(userSession))

    return { success: true, user: userSession }
  }

  const changeAdminEmail = async (newEmail) => {
    const cleanEmail = newEmail.trim().toLowerCase()
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' }
    }

    localStorage.setItem('axl_admin_email', cleanEmail)
    setAdminEmail(cleanEmail)

    if (isSupabaseAuthEnabled) {
      try {
        await supabase.from('app_settings').upsert({ key: 'admin_email', value: cleanEmail })
      } catch {}
    }
    
    // Update currently active session if user is admin
    if (user && user.role === 'admin') {
      const updatedUser = { ...user, email: cleanEmail }
      setUser(updatedUser)
      localStorage.setItem('axl_session', JSON.stringify(updatedUser))
    }
    
    return { success: true }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('axl_session')
    if (isSupabaseAuthEnabled) {
      supabase.auth.signOut()
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAdmin: user?.role === 'admin', 
      login, 
      signup, 
      logout, 
      changeAdminEmail,
      getAdminEmail,
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
