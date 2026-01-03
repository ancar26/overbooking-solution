import { useState, useEffect } from 'react'
import '../styles/Pages.css'

const API_URL = '/api' // Uses Vite proxy in dev, works with ngrok

function BookingsStatus() {
  const [bookings, setBookings] = useState([])
  const [profile, setProfile] = useState(null)
  const [roomSummary, setRoomSummary] = useState([])
  const [expandedRoom, setExpandedRoom] = useState(null) // Track which room is expanded
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [profileRes, bookingsRes, roomsRes] = await Promise.all([
        fetch(`${API_URL}/profile`),
        fetch(`${API_URL}/bookings`),
        fetch(`${API_URL}/rooms/summary`)
      ])

      if (!profileRes.ok || !bookingsRes.ok || !roomsRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const profileData = await profileRes.json()
      const bookingsData = await bookingsRes.json()
      const roomsData = await roomsRes.json()

      setProfile(profileData)
      setBookings(bookingsData)
      setRoomSummary(roomsData)
      setError(null)
    } catch (err) {
      setError('Could not connect to backend. Make sure the backend server is running on port 3000.')
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (bookingId) => {
    try {
      const response = await fetch(`${API_URL}/bookings/${bookingId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()

      if (!response.ok) {
        // Check if it's a fully booked error
        if (data.error === 'PROPERTY_FULLY_BOOKED') {
          alert(`⚠️ ${data.message}`)
          // Refresh data to get updated state
          fetchData()
          return
        }
        throw new Error(data.message || 'Failed to approve booking')
      }

      setBookings(bookings.map(b => b.id === bookingId ? data.booking : b))
      setProfile({ ...profile, availableBeds: data.availableBeds, bookedBeds: data.bookedBeds })
      alert(`✅ Booking approved! Available beds: ${data.availableBeds}`)
      // Refresh to get updated booking order
      fetchData()
    } catch (err) {
      // If JSON parsing failed, show generic error
      if (err.message.includes('JSON')) {
        alert('Error approving booking: Server error')
      } else {
        alert('Error approving booking: ' + err.message)
      }
    }
  }

  const handleReject = async (bookingId) => {
    if (!window.confirm('Are you sure you want to reject this booking?')) return

    try {
      const response = await fetch(`${API_URL}/bookings/${bookingId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) throw new Error('Failed to reject booking')

      const data = await response.json()
      setBookings(bookings.map(b => b.id === bookingId ? data.booking : b))
      alert('Booking rejected')
    } catch (err) {
      alert('Error rejecting booking: ' + err.message)
    }
  }


  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'status-pending'
      case 'CONFIRMED': return 'status-confirmed'
      case 'REJECTED': return 'status-rejected'
      case 'AUTO_REJECTED': return 'status-rejected'
      case 'CANCELLED': return 'status-cancelled'
      default: return ''
    }
  }

  const handleSendAvailability = (booking) => {
    // This would trigger in the booking platform (Booking.com, Agoda, etc.)
    // to suggest alternative dates when property is available
    alert(`📧 Sending availability suggestions to ${booking.guestName} via ${booking.platform}\n\nThis would notify the guest about alternative dates when beds are available.`)
  }

  const handleResetDemo = async () => {
    if (!confirm('Reset demo to initial state? (18 beds occupied, 6 pending bookings)')) {
      return
    }
    
    try {
      const response = await fetch(`${API_URL}/reset`, { method: 'POST' })
      const data = await response.json()
      
      alert(`✅ Demo reset!\n\nBeds: ${data.bookedBeds}/${data.totalBeds} occupied\nAvailable: ${data.availableBeds}\nPending bookings: ${data.pendingBookings}`)
      
      // Refresh all data
      fetchData()
    } catch (err) {
      alert('Failed to reset demo: ' + err.message)
    }
  }

  // Format booking date/time
  const formatBookingDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
          </div>
        </div>
      </div>
    )
  }

  // Show all PENDING and AUTO_REJECTED bookings
  // Sorted by booking date (oldest first) - owner can approve any pending booking
  const pendingBookings = bookings
    .filter(b => b.status === 'PENDING' || b.status === 'AUTO_REJECTED')
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

  return (
    <div className="page-container">
      <div className="page-content">
        <header className="page-header">
          <h2>Bookings Status</h2>
          {/* Only show Reset button after demo is done (auto-rejected bookings exist) */}
          {bookings.some(b => b.status === 'AUTO_REJECTED') && (
            <button 
              className="btn btn-reset"
              onClick={handleResetDemo}
            >
              🔄 Reset Demo
            </button>
          )}
        </header>

        {pendingBookings.length > 0 && (
          <section className="bookings-section">
            <h3 className="section-title">⚠️ Pending Bookings ({pendingBookings.filter(b => b.status === 'PENDING').length})</h3>
            <div className="bookings-list">
                {pendingBookings.map((booking, index) => {
                  const positionNames = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th']
                  
                  return (
                    <div 
                      key={booking.id} 
                      className={`booking-card ${booking.status === 'AUTO_REJECTED' ? 'auto-rejected-card' : ''}`}
                    >
                      {/* Show booking position in queue with room number */}
                      <div className="booking-order-info">
                        {positionNames[index] || `${index + 1}th`} booking for {booking.roomNumber} (made at {formatBookingDate(booking.createdAt)})
                      </div>
                      
                      {/* Show auto-rejected info banner */}
                      {booking.status === 'AUTO_REJECTED' && (
                        <div className="auto-rejected-info">
                          ✅ Informed: Property is fully booked - booking auto-rejected
                        </div>
                      )}
                      
                      <div className="booking-header">
                        <h4>{booking.guestName}</h4>
                        <span className={`status-badge ${getStatusColor(booking.status)}`}>
                          {booking.status === 'AUTO_REJECTED' ? 'AUTO REJECTED' : booking.status}
                        </span>
                      </div>
                      <div className="booking-details">
                        <p><strong>Platform:</strong> {booking.platform}</p>
                        <p><strong>Room:</strong> {booking.roomNumber}</p>
                        <p><strong>Beds:</strong> {booking.beds}</p>
                        <p><strong>Check-in:</strong> {booking.checkIn}</p>
                        <p><strong>Check-out:</strong> {booking.checkOut}</p>
                        <p><strong>Email:</strong> {booking.guestEmail}</p>
                      </div>
                      <div className="booking-actions">
                        {booking.status === 'AUTO_REJECTED' ? (
                          <>
                            <button className="btn btn-disabled" disabled>
                              ✓ Approve
                            </button>
                            <button className="btn btn-disabled" disabled>
                              ✗ Reject
                            </button>
                            <button 
                              className="btn btn-availability"
                              onClick={() => handleSendAvailability(booking)}
                            >
                              📧 Send Possible Availability
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              className="btn btn-approve"
                              onClick={() => handleApprove(booking.id)}
                            >
                              ✓ Approve
                            </button>
                            <button 
                              className="btn btn-reject"
                              onClick={() => handleReject(booking.id)}
                            >
                              ✗ Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
            </div>
          </section>
        )}

        {/* Room Occupancy Summary */}
        {roomSummary.length > 0 && (
          <section className="bookings-section">
            <h3 className="section-title">Room Occupancy Summary</h3>
            <div className="room-summary-grid">
              {roomSummary.map(room => {
                const isExpanded = expandedRoom === room.roomNumber
                return (
                  <div key={room.roomNumber} className="room-summary-card">
                    <div 
                      className="room-summary-header clickable"
                      onClick={() => setExpandedRoom(isExpanded ? null : room.roomNumber)}
                    >
                      <h4>Room {room.roomNumber}</h4>
                      <div className="room-header-right">
                        <span className="room-occupancy-badge">
                          {room.occupiedBeds} / {room.capacity} beds occupied
                        </span>
                        <span className="room-expand-icon">
                          {isExpanded ? '▼' : '▶'}
                        </span>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="room-bookings-list">
                        {room.bedSlots && room.bedSlots.length > 0 ? (
                          room.bedSlots.map((bed, idx) => (
                            <div key={idx} className={`room-bed-card ${bed.occupied ? 'occupied' : 'empty'}`}>
                              <div className="room-bed-header">
                                <h5>Bed {bed.bedNumber}</h5>
                                <span className={`bed-status-badge ${bed.occupied ? 'status-occupied' : 'status-empty'}`}>
                                  {bed.occupied ? 'Occupied' : 'Empty'}
                                </span>
                              </div>
                              {bed.occupied && (
                                <div className="room-bed-info">
                                  <p><strong>Guest:</strong> {bed.guestName}</p>
                                  <p><strong>Email:</strong> {bed.guestEmail}</p>
                                  <p><strong>Platform:</strong> {bed.platform}</p>
                                  <p><strong>Check-in:</strong> {bed.checkIn}</p>
                                  <p><strong>Check-out:</strong> {bed.checkOut}</p>
                                  <p><strong>Booked:</strong> {formatBookingDate(bed.createdAt)}</p>
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="room-empty-message">
                            No bed information available
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

export default BookingsStatus

