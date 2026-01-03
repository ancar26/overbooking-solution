import { Link, useLocation } from 'react-router-dom'
import '../styles/Navigation.css'

function Navigation() {
  const location = useLocation()

  return (
    <nav className="navigation">
      <div className="nav-container">
        <h1 className="nav-logo">Overbooking Prevention</h1>
        <div className="nav-links">
          <Link 
            to="/" 
            className={location.pathname === '/' ? 'nav-link active' : 'nav-link'}
          >
            Owner Profile
          </Link>
          <Link 
            to="/bookings" 
            className={location.pathname === '/bookings' ? 'nav-link active' : 'nav-link'}
          >
            Bookings Status
          </Link>
        </div>
      </div>
    </nav>
  )
}

export default Navigation

