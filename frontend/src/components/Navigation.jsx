import { Link, useLocation, useNavigate } from 'react-router-dom'
import '../styles/Navigation.css'

function Navigation({ isAuthenticated, user: userProp, onLogout }) {
  const location = useLocation()
  const navigate = useNavigate()
  const token = isAuthenticated ?? Boolean(localStorage.getItem('authToken'))
  const userRaw = localStorage.getItem('authUser')
  let userFromStorage = null
  if (userRaw) {
    try {
      userFromStorage = JSON.parse(userRaw)
    } catch {
      userFromStorage = null
    }
  }
  const user = userProp ?? userFromStorage
  const setupCompleted = Boolean(user?.setupCompleted)

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('authUser')
    window.dispatchEvent(new Event('auth-changed'))
    if (typeof onLogout === 'function') onLogout()
    navigate('/login')
  }

  return (
    <nav className="navigation">
      <div className="nav-container">
        <h1 className="nav-logo">🏨 Booking Calendar</h1>
        <div className="nav-links">
          {token && (
            <>
              <Link 
                to="/property" 
                className={location.pathname === '/property' ? 'nav-link active' : 'nav-link'}
              >
                Property Setup
              </Link>
              {setupCompleted && (
                <>
                  <Link 
                    to="/" 
                    className={location.pathname === '/' ? 'nav-link active' : 'nav-link'}
                  >
                    Property Info
                  </Link>
                  <Link 
                    to="/bookings" 
                    className={location.pathname === '/bookings' ? 'nav-link active' : 'nav-link'}
                  >
                    Calendar
                  </Link>
                </>
              )}
            </>
          )}
          {!token && (
            <>
              <Link 
                to="/login" 
                className={location.pathname === '/login' ? 'nav-link active' : 'nav-link'}
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className={location.pathname === '/register' ? 'nav-link active' : 'nav-link'}
              >
                Register
              </Link>
            </>
          )}
          {token && (
            <button className="nav-link nav-btn-link" onClick={handleLogout}>
              Logout {user?.name ? `(${user.name})` : ''}
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navigation
