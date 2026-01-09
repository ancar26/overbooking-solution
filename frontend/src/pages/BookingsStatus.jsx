import { useState, useEffect, useCallback, useRef } from 'react'
import BookingCalendar from '../components/BookingCalendar'
import NotificationBell from '../components/NotificationBell'
import { 
  requestNotificationPermission, 
  showNewBookingNotification
} from '../utils/notifications'
import '../styles/Pages.css'

const API_URL = '/api'
const NOTIF_STORAGE_KEY = 'booking-calendar-notifications'

function BookingsStatus() {
  const [bookings, setBookings] = useState([])
  const [rooms, setRooms] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  // Seed with previous notifications (unread so badge shows history)
  const [notifications, setNotifications] = useState([])
  const demoTriggeredRef = useRef(false)

  const fetchData = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true)
      
      const [profileRes, bookingsRes, roomsRes] = await Promise.all([
        fetch(`${API_URL}/profile`),
        fetch(`${API_URL}/bookings`),
        fetch(`${API_URL}/rooms`)
      ])

      if (!profileRes.ok || !bookingsRes.ok || !roomsRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const profileData = await profileRes.json()
      const bookingsData = await bookingsRes.json()
      const roomsData = await roomsRes.json()

      setProfile(profileData)
      setBookings(bookingsData)
      setRooms(roomsData)
      setError(null)
    } catch (err) {
      setError('Could not connect to backend. Make sure the backend server is running on port 3000.')
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Show toast notification
  const showToast = (type, booking) => {
    setToast({ type, booking })
    setTimeout(() => setToast(null), 4000)
  }

  // Add to notification history
  const addNotification = (type, booking) => {
    const newNotif = {
      type,
      booking,
      timestamp: new Date().toISOString(),
      read: false
    }
    setNotifications(prev => [newNotif, ...prev].slice(0, 20)) // Keep last 20
  }

  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([])
  }

  // Mark all notifications as read
  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  // Persist notifications
  useEffect(() => {
    // Load from storage on mount
    const saved = localStorage.getItem(NOTIF_STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setNotifications(parsed)
          return
        }
      } catch (err) {
        console.warn('Failed to parse stored notifications', err)
      }
    }
    // Seed defaults if none stored
    const seeded = [
      {
        type: 'new',
        booking: { guestName: 'Maria Garcia', roomNumber: 'A2', checkIn: '2026-01-15', checkOut: '2026-01-18', platform: 'Booking.com' },
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        read: false
      },
      {
        type: 'cancel',
        booking: { guestName: 'John Smith', roomNumber: 'B1', checkIn: '2026-01-20', checkOut: '2026-01-23', platform: 'Agoda' },
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        read: false
      }
    ]
    setNotifications(seeded)
  }, [])

  // Save to storage whenever notifications change
  useEffect(() => {
    localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(notifications))
  }, [notifications])

  // Demo: trigger notifications after page visit
  useEffect(() => {
    // Only trigger once per page load
    if (demoTriggeredRef.current) return
    demoTriggeredRef.current = true

    console.log('📱 Demo mode - new booking notification in 10 seconds...')
    
    // Request notification permission on load
    requestNotificationPermission()

    // After 10 seconds, create a new booking notification
    const newBookingTimer = setTimeout(async () => {
      console.log('🔔 Triggering new booking demo...')
      try {
        const response = await fetch(`${API_URL}/demo/random-booking`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
        
        if (response.ok) {
          const booking = await response.json()
          console.log('✅ New booking created:', booking.guestName)
          
          // Always show in-app notifications
          showToast('new', booking)
          addNotification('new', booking)
          fetchData(false)
          
          // Try push notification (may fail in some browsers)
          try {
            showNewBookingNotification(booking)
          } catch {
            console.log('Push notification not available')
          }
        }
      } catch (err) {
        console.error('Demo booking error:', err)
      }
    }, 10000) // 10 seconds

    return () => {
      clearTimeout(newBookingTimer)
      clearTimeout(newBookingTimer)
    }
  }, [fetchData])

  useEffect(() => {
    fetchData(true)
  }, [fetchData])

  if (loading) {
    return (
      <div className="calendar-page">
        <div className="calendar-loading">
          <div className="loading-spinner"></div>
          <p>Loading calendar...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="calendar-page">
        <div className="calendar-error">
          <h2>⚠️ Connection Error</h2>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="calendar-page">
      <div className="calendar-page-header">
        <div className="header-info">
          <h1>{profile?.propertyName || 'Booking Calendar'}</h1>
          <p className="header-subtitle">
            {bookings.length} confirmed bookings across {rooms.length} rooms
          </p>
        </div>
        <NotificationBell 
          notifications={notifications} 
          onClear={clearNotifications}
          onMarkAllRead={markAllRead}
        />
      </div>
      
      <BookingCalendar bookings={bookings} rooms={rooms} />

      {/* Toast Notification */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <div className="toast-icon">
            {toast.type === 'new' ? '🎉' : '❌'}
          </div>
          <div className="toast-content">
            <div className="toast-title">
              {toast.type === 'new' ? 'New Booking!' : 'Booking Cancelled'}
            </div>
            <div className="toast-body">
              <strong>{toast.booking.guestName}</strong>
              <span>Room {toast.booking.roomNumber}</span>
              <span className="toast-platform">{toast.booking.platform}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BookingsStatus
