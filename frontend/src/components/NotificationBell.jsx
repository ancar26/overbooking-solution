import { useState, useEffect, useRef } from 'react'
import '../styles/NotificationBell.css'

function NotificationBell({ notifications, onClear }) {
  const [isOpen, setIsOpen] = useState(false)
  const bellRef = useRef(null)

  const unreadCount = notifications.filter(n => !n.read).length

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleOpen = () => {
    setIsOpen(!isOpen)
  }

  const formatTime = (date) => {
    const now = new Date()
    const diff = now - new Date(date)
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (seconds < 60) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return new Date(date).toLocaleDateString()
  }

  const formatDateRange = (checkIn, checkOut) => {
    const options = { month: 'short', day: 'numeric' }
    const start = new Date(checkIn).toLocaleDateString('en-US', options)
    const end = new Date(checkOut).toLocaleDateString('en-US', options)
    return `${start} - ${end}`
  }

  return (
    <div className="notification-bell" ref={bellRef}>
      <button className="bell-button" onClick={toggleOpen}>
        <svg 
          className="bell-icon" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="dropdown-header">
            <h4>Recent Activity</h4>
            {notifications.length > 0 && (
              <button className="clear-btn" onClick={onClear}>
                Clear all
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">🔔</span>
                <p>No recent activity</p>
              </div>
            ) : (
              notifications.map((notif, index) => (
                <div 
                  key={index} 
                  className={`notification-item ${notif.type} ${!notif.read ? 'unread' : ''}`}
                >
                  <div className="notif-icon">
                    {notif.type === 'new' ? '🎉' : '❌'}
                  </div>
                  <div className="notif-content">
                    <div className="notif-title">
                      {notif.type === 'new' ? 'New Booking' : 'Cancellation'}
                    </div>
                    <div className="notif-details">
                      <strong>{notif.booking.guestName}</strong>
                      <span className="notif-room">Room {notif.booking.roomNumber}</span>
                    </div>
                    <div className="notif-meta">
                      <span className="notif-dates">
                        {formatDateRange(notif.booking.checkIn, notif.booking.checkOut)}
                      </span>
                      <span className="notif-platform">{notif.booking.platform}</span>
                    </div>
                  </div>
                  <div className="notif-time">
                    {formatTime(notif.timestamp)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell

