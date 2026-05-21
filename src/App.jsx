import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import MobileTabBar from './components/MobileTabBar'
import Home from './pages/Home'
import SendPackage from './pages/SendPackage'
import Track from './pages/Track'
import Admin from './pages/Admin'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

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

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <div className="min-h-screen bg-background text-text flex flex-col">
          <Navbar />
          <div className="flex-grow pb-24 md:pb-0">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/send" element={<SendPackage />} />
              <Route 
                path="/track" 
                element={
                  <ProtectedUserRoute>
                    <Track />
                  </ProtectedUserRoute>
                } 
              />
              <Route path="/login" element={<Login />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedUserRoute>
                    <Dashboard />
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
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          <MobileTabBar />
        </div>
      </HashRouter>
    </AuthProvider>
  )
}

export default App
