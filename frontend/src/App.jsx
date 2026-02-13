import { useCallback, useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Navigation from './components/Navigation'
import OwnerProfile from './pages/OwnerProfile'
import BookingsStatus from './pages/BookingsStatus'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import PropertySetup from './pages/PropertySetup'
import { apiFetch, getAuthToken, getAuthUser } from './utils/api'
import './App.css'

function App() {
  // Treat localStorage token as the persisted session. If no token exists, user is unauthenticated.
  const [auth, setAuth] = useState(() => ({
    token: getAuthToken(),
    user: getAuthUser()
  }))

  const syncAuthFromStorage = useCallback(() => {
    setAuth({ token: getAuthToken(), user: getAuthUser() })
  }, [])

  useEffect(() => {
    // Keep app shell in sync with login/logout without adding new state libraries.
    window.addEventListener('auth-changed', syncAuthFromStorage)
    window.addEventListener('storage', syncAuthFromStorage)
    return () => {
      window.removeEventListener('auth-changed', syncAuthFromStorage)
      window.removeEventListener('storage', syncAuthFromStorage)
    }
  }, [syncAuthFromStorage])

  useEffect(() => {
    // Validate token (best-effort). If invalid/expired, clear the session.
    const validate = async () => {
      if (!auth.token) return
      try {
        const res = await apiFetch('/api/auth/me')
        if (res.status === 401) {
          localStorage.removeItem('authToken')
          localStorage.removeItem('authUser')
          window.dispatchEvent(new Event('auth-changed'))
          return
        }
        if (res.ok) {
          const user = await res.json()
          localStorage.setItem('authUser', JSON.stringify(user))
          window.dispatchEvent(new Event('auth-changed'))
        }
      } catch {
        // If backend is down, keep the stored session and let API calls surface errors.
      }
    }
    validate()
    // Only re-validate when token changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.token])

  const isAuthenticated = Boolean(auth.token)
  const isSetupCompleted = Boolean(auth.user?.setupCompleted)

  const requireAuth = (element) =>
    isAuthenticated ? element : <Navigate to="/login" replace />

/*  const requireSetup = (element) =>
    isSetupCompleted ? element : <Navigate to="/property" replace />
*/
  const requireAuthAndSetup = (element) =>
    isAuthenticated ? (isSetupCompleted ? element : <Navigate to="/property" replace />) : <Navigate to="/login" replace />

  return (
    <Router>
      <div className="app">
        <Navigation isAuthenticated={isAuthenticated} user={auth.user} />
        <Routes>
          <Route path="/" element={requireAuthAndSetup(<OwnerProfile />)} />
          <Route path="/bookings" element={requireAuthAndSetup(<BookingsStatus />)} />
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to={isSetupCompleted ? '/bookings' : '/property'} replace /> : <Login />}
          />
          <Route
            path="/register"
            element={isAuthenticated ? <Navigate to={isSetupCompleted ? '/bookings' : '/property'} replace /> : <Register />}
          />
          <Route
            path="/forgot-password"
            element={isAuthenticated ? <Navigate to={isSetupCompleted ? '/bookings' : '/property'} replace /> : <ForgotPassword />}
          />
          <Route path="/property" element={requireAuth(<PropertySetup />)} />
          <Route
            path="*"
            element={<Navigate to={isAuthenticated ? (isSetupCompleted ? '/bookings' : '/property') : '/login'} replace />}
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App
