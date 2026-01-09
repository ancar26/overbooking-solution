import { useState, useRef, useEffect } from 'react'
import '../styles/BookingCalendar.css'

function BookingCalendar({ bookings, rooms }) {
  const [currentDate, setCurrentDate] = useState(new Date('2026-01-01'))
  const [selectedBooking, setSelectedBooking] = useState(null)
  const calendarRef = useRef(null)
  const todayRef = useRef(null)

  // Get days in current month view
  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    const days = []
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    return days
  }

  const days = getDaysInMonth(currentDate)

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1))
    // Scroll to today after state updates
    setTimeout(() => {
      if (todayRef.current) {
        todayRef.current.scrollIntoView({ behavior: 'smooth', inline: 'center' })
      }
    }, 100)
  }

  // Check if a date is today
  const isToday = (date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  // Check if date is weekend
  const isWeekend = (date) => {
    const day = date.getDay()
    return day === 0 || day === 6
  }

  // Format month/year for header
  const formatMonthYear = (date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  // Format day header
  const formatDayHeader = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short' })
  }

  // Get bookings for a specific room that overlap with current month
  const getRoomBookings = (roomNumber) => {
    const monthStart = days[0]
    const monthEnd = days[days.length - 1]
    
    return bookings.filter(booking => {
      if (booking.roomNumber !== roomNumber) return false
      const checkIn = new Date(booking.checkIn)
      const checkOut = new Date(booking.checkOut)
      // Booking overlaps if it starts before month ends AND ends after month starts
      return checkIn <= monthEnd && checkOut >= monthStart
    })
  }

  // Calculate booking block position and width
  const getBookingStyle = (booking) => {
    const checkIn = new Date(booking.checkIn)
    const checkOut = new Date(booking.checkOut)
    const monthStart = days[0]
    const monthEnd = new Date(days[days.length - 1])
    monthEnd.setHours(23, 59, 59, 999)

    // Clamp dates to current month view
    const displayStart = checkIn < monthStart ? monthStart : checkIn
    const displayEnd = checkOut > monthEnd ? monthEnd : checkOut

    // Calculate position (day index)
    const startDayIndex = Math.floor((displayStart - monthStart) / (1000 * 60 * 60 * 24))
    const endDayIndex = Math.ceil((displayEnd - monthStart) / (1000 * 60 * 60 * 24))
    const duration = endDayIndex - startDayIndex

    // Each day cell is ~60px wide on desktop
    const dayWidth = 60
    const left = startDayIndex * dayWidth
    const width = duration * dayWidth - 4 // -4 for gap

    return {
      left: `${left}px`,
      width: `${width}px`,
      backgroundColor: booking.color
    }
  }

  // Check if booking starts before current month
  const startsBeforeMonth = (booking) => {
    const checkIn = new Date(booking.checkIn)
    return checkIn < days[0]
  }

  // Check if booking ends after current month
  const endsAfterMonth = (booking) => {
    const checkOut = new Date(booking.checkOut)
    const monthEnd = new Date(days[days.length - 1])
    monthEnd.setHours(23, 59, 59, 999)
    return checkOut > monthEnd
  }

  // Handle booking click
  const handleBookingClick = (booking, e) => {
    e.stopPropagation()
    setSelectedBooking(booking)
  }

  // Close popup
  const closePopup = () => {
    setSelectedBooking(null)
  }

  // Close popup on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (selectedBooking && !e.target.closest('.booking-popup') && !e.target.closest('.booking-block')) {
        closePopup()
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [selectedBooking])

  // Format date for display
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Calculate nights
  const calculateNights = (checkIn, checkOut) => {
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="booking-calendar">
      {/* Calendar Header */}
      <div className="calendar-header">
        <div className="calendar-nav">
          <button className="nav-btn" onClick={goToPreviousMonth}>
            ←
          </button>
          <h2 className="calendar-title">{formatMonthYear(currentDate)}</h2>
          <button className="nav-btn" onClick={goToNextMonth}>
            →
          </button>
        </div>
        <button className="today-btn" onClick={goToToday}>
          Today
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="calendar-container" ref={calendarRef}>
        <div className="calendar-grid">
          {/* Header Row - Days */}
          <div className="calendar-row header-row">
            <div className="room-label-cell header-cell">Room</div>
            {days.map((day, index) => (
              <div 
                key={index} 
                className={`day-cell header-cell ${isToday(day) ? 'today' : ''} ${isWeekend(day) ? 'weekend' : ''}`}
                ref={isToday(day) ? todayRef : null}
              >
                <span className="day-name">{formatDayHeader(day)}</span>
                <span className="day-number">{day.getDate()}</span>
              </div>
            ))}
          </div>

          {/* Room Rows */}
          {rooms.map(room => {
            const roomBookings = getRoomBookings(room.roomNumber)
            return (
              <div key={room.roomNumber} className="calendar-row room-row">
                <div className="room-label-cell">
                  <span className="room-name">{room.roomNumber}</span>
                  <span className="room-type">Private</span>
                </div>
                <div className="bookings-track">
                  {/* Day grid background */}
                  {days.map((day, index) => (
                    <div 
                      key={index} 
                      className={`day-slot ${isToday(day) ? 'today' : ''} ${isWeekend(day) ? 'weekend' : ''}`}
                    />
                  ))}
                  
                  {/* Booking blocks */}
                  {roomBookings.map(booking => (
                    <div
                      key={booking.id}
                      className={`booking-block ${startsBeforeMonth(booking) ? 'continues-left' : ''} ${endsAfterMonth(booking) ? 'continues-right' : ''}`}
                      style={getBookingStyle(booking)}
                      onClick={(e) => handleBookingClick(booking, e)}
                      title={`${booking.guestName} - ${booking.checkIn} to ${booking.checkOut}`}
                    >
                      <span className="booking-guest">{booking.guestName}</span>
                      <span className="booking-platform">{booking.platform}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Booking Detail Popup */}
      {selectedBooking && (
        <div className="booking-popup-overlay" onClick={closePopup}>
          <div className="booking-popup" onClick={e => e.stopPropagation()}>
            <button className="popup-close" onClick={closePopup}>×</button>
            <div className="popup-header" style={{ backgroundColor: selectedBooking.color }}>
              <h3>{selectedBooking.guestName}</h3>
              <span className="popup-platform">{selectedBooking.platform}</span>
            </div>
            <div className="popup-content">
              <div className="popup-row">
                <span className="popup-label">Room</span>
                <span className="popup-value">{selectedBooking.roomNumber}</span>
              </div>
              <div className="popup-row">
                <span className="popup-label">Check-in</span>
                <span className="popup-value">{formatDate(selectedBooking.checkIn)}</span>
              </div>
              <div className="popup-row">
                <span className="popup-label">Check-out</span>
                <span className="popup-value">{formatDate(selectedBooking.checkOut)}</span>
              </div>
              <div className="popup-row">
                <span className="popup-label">Duration</span>
                <span className="popup-value">{calculateNights(selectedBooking.checkIn, selectedBooking.checkOut)} nights</span>
              </div>
              <div className="popup-row">
                <span className="popup-label">Email</span>
                <span className="popup-value email">{selectedBooking.guestEmail}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BookingCalendar

