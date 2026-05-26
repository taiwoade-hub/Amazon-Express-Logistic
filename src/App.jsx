import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import Navbar from './components/Navbar'
import SiteFooter from './components/SiteFooter'
import ToastHost from './components/ToastHost'
import Home from './pages/Home'
import SendPackage from './pages/SendPackage'
import Track from './pages/Track'
import Admin from './pages/Admin'
import AdminActivity from './pages/AdminActivity'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Notifications from './pages/Notifications'

function ProtectedAdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
      </div>
    )
  }
  if (!user || !isAdmin) {
    return <Navigate to="/login?redirect=admin&error=unauthorized" replace />
  }
  return children
}

function ProtectedUserRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
      </div>
    )
  }
  if (!user) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`/login?redirect=${redirect}`} replace />
  }
  return children
}

function BlockAdminRoute({ children }) {
  const { loading, isAdmin } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
      </div>
    )
  }
  if (isAdmin) return <Navigate to="/admin" replace />
  return children
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <HashRouter>
          <AppLayout />
        </HashRouter>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App

function AppLayout() {
  const location = useLocation()
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup'
  const isAdminArea = location.pathname.startsWith('/admin')

  return (
    <div className="min-h-screen bg-background text-text flex flex-col">
      <ToastHost />
      {!isAdminArea && <Navbar />}
      <div className={`flex-grow flex flex-col ${isAuthPage || isAdminArea ? 'pb-0 overflow-hidden' : 'pb-0'}`}>
        <div className="flex-grow">
          <Routes>
            <Route
              path="/"
              element={
                <BlockAdminRoute>
                  <Home />
                </BlockAdminRoute>
              }
            />
            <Route
              path="/send"
              element={
                <BlockAdminRoute>
                  <SendPackage />
                </BlockAdminRoute>
              }
            />
            <Route
              path="/track"
              element={
                <Track />
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Login initialMode="signup" />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedUserRoute>
                  <BlockAdminRoute>
                    <Dashboard />
                  </BlockAdminRoute>
                </ProtectedUserRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedUserRoute>
                  <BlockAdminRoute>
                    <Notifications />
                  </BlockAdminRoute>
                </ProtectedUserRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedAdminRoute>
                  <Admin />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/activity"
              element={
                <ProtectedAdminRoute>
                  <AdminActivity />
                </ProtectedAdminRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        {!isAuthPage && !isAdminArea && <SiteFooter />}
      </div>
    </div>
  )
}
