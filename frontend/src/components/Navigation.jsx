import { Link, useLocation } from 'react-router-dom'
import '../styles/Navigation.css'

function Navigation() {
  const location = useLocation()

  return (
    <nav className="navigation">
      <div className="nav-container">
        <h1 className="nav-logo">🏨 Booking Calendar</h1>
        <div className="nav-links">
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
        </div>
      </div>
    </nav>
  )
}

export default Navigation
