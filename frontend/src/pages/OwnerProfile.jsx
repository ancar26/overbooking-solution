import { useMemo, useState, useEffect, useCallback } from 'react'
import '../styles/Pages.css'
import { apiFetch } from '../utils/api'

const API_URL = '/api'

function OwnerProfile() {
  const [profile, setProfile] = useState(null)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      const [profileRes, bookingsRes] = await Promise.all([
        apiFetch(`${API_URL}/profile`),
        apiFetch(`${API_URL}/bookings`)
      ])

      if (profileRes.status === 401 || bookingsRes.status === 401) {
        // Session is not valid anymore.
        localStorage.removeItem('authToken')
        localStorage.removeItem('authUser')
        window.dispatchEvent(new Event('auth-changed'))
        return
      }

      if (!profileRes.ok || !bookingsRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const profileData = await profileRes.json()
      const bookingsData = await bookingsRes.json()

      setProfile(profileData)
      setBookings(bookingsData)
      setError(null)
    } catch (err) {
      setError('Could not connect to backend. Make sure the backend server is running on port 3000.')
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    const listener = () => fetchData()
    window.addEventListener('booking-changed', listener)
    return () => window.removeEventListener('booking-changed', listener)
  }, [fetchData])

  const todayISO = useMemo(() => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }, [])

  const todays = useMemo(() => {
    // Requirement: derived from manually inserted bookings.
    const manual = bookings.filter(b => b.platform === 'Manual')
    const checkIns = manual.filter(b => b.checkIn === todayISO)
    const checkOuts = manual.filter(b => b.checkOut === todayISO)
    return { manual, checkIns, checkOuts }
  }, [bookings, todayISO])

  // Get unique platforms from bookings
  const getPlatforms = () => {
    const platforms = [...new Set(bookings.map(b => b.platform))]
    return platforms
  }

  // Get bookings by platform
  const getBookingsByPlatform = (platform) => {
    return bookings.filter(b => b.platform === platform).length
  }

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          <div className="loading-spinner"></div>
          <p>Loading property info...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="profile-page">
        <div className="profile-error">
            <h2>⚠️ Connection Error</h2>
            <p>{error}</p>
          <p className="error-hint">Make sure to run: <code>cd backend && npm start</code></p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="profile-page">
        <div className="profile-error">
          <p>No profile data available.</p>
        </div>
      </div>
    )
  }

  const platforms = getPlatforms()

  return (
    <div className="profile-page">
      <div className="profile-container">
        <header className="profile-header">
          <h1>{profile.propertyName}</h1>
          <p className="profile-subtitle">Dashboard</p>
        </header>

        <div className="profile-grid">
          {/* Today's Live Status */}
          <div className="profile-card stats-card">
            <h3>Today</h3>
            <div className="stats-grid stats-grid-2">
              <div className="stat-item">
                <span className="stat-value">{todays.checkIns.length}</span>
                <span className="stat-label">Check-ins</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{todays.checkOuts.length}</span>
                <span className="stat-label">Check-outs</span>
              </div>
            </div>
            <p className="sources-note" style={{ marginTop: 16 }}>
              Counts are derived from manual bookings for {todayISO}.
            </p>
          </div>

          {/* Property Stats */}
          <div className="profile-card stats-card">
            <h3>Property Statistics</h3>
            <div className="stats-grid stats-grid-2">
              <div className="stat-item">
                <span className="stat-value">{profile.totalRooms}</span>
                <span className="stat-label">Rooms</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{bookings.length}</span>
                <span className="stat-label">Bookings</span>
              </div>
            </div>
            </div>
            
          {/* Owner Info */}
          <div className="profile-card info-card">
            <h3>Owner Information</h3>
            <div className="info-list">
              <div className="info-row">
                <span className="info-label">Name</span>
                <span className="info-value">{profile.name}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Email</span>
                <span className="info-value email">{profile.email}</span>
            </div>
            </div>
            </div>
            
          {/* Booking Sources */}
          <div className="profile-card sources-card">
            <h3>Booking Sources</h3>
            <div className="sources-list">
              {platforms.map(platform => (
                <div key={platform} className="source-item">
                  <span className="source-name">{platform}</span>
                  <span className="source-count">{getBookingsByPlatform(platform)} bookings</span>
            </div>
              ))}
            </div>
            <p className="sources-note">
              Bookings will be synced from external platforms. Conflicts will be automatically prevented.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OwnerProfile
