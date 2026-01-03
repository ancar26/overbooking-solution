import { useState, useEffect } from 'react'
import '../styles/Pages.css'

const API_URL = '/api' // Uses Vite proxy in dev, works with ngrok

function OwnerProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchProfile()
    // Refresh every 5 seconds to get real-time updates
    const interval = setInterval(fetchProfile, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/profile`)
      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }
      const data = await response.json()
      setProfile(data)
      setError(null)
    } catch (err) {
      setError('Could not connect to backend. Make sure the backend server is running on port 3000.')
      console.error('Error fetching profile:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-content">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="page-content">
          <div className="error-message">
            <h2>⚠️ Connection Error</h2>
            <p>{error}</p>
            <p>Make sure to run: <code>cd backend && npm start</code></p>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="page-container">
        <div className="page-content">
          <p>No profile data available.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-content">
        <header className="page-header">
          <h2>Property Owner Profile</h2>
        </header>

        <div className="profile-card">
          <div className="profile-info">
            <div className="profile-row">
              <strong>Name:</strong>
              <span>{profile.name}</span>
            </div>
            
            <div className="profile-row">
              <strong>Property:</strong>
              <span>{profile.propertyName}</span>
            </div>
            
            <div className="profile-row">
              <strong>Total number of rooms:</strong>
              <span>{profile.totalRooms}</span>
            </div>
            
            <div className="profile-row">
              <strong>Total number of beds:</strong>
              <span>{profile.totalBeds}</span>
            </div>
            
            <div className="profile-row">
              <strong>Booked beds:</strong>
              <span className={profile.bookedBeds > 0 ? 'booked-beds' : ''}>
                {profile.bookedBeds || 0}
              </span>
            </div>
            
            <div className="profile-row">
              <strong className={profile.availableBeds < 5 ? 'low-beds' : ''}>
                Available Beds:
              </strong>
              <span className={profile.availableBeds < 5 ? 'low-beds' : ''}>
                {profile.availableBeds}
              </span>
            </div>
            
            <div className="profile-row">
              <strong>Email:</strong>
              <span>{profile.email}</span>
            </div>
          </div>
        </div>

        <div className="info-box">
          <p>📊 This page updates automatically every 5 seconds to show real-time bed availability.</p>
        </div>
      </div>
    </div>
  )
}

export default OwnerProfile

