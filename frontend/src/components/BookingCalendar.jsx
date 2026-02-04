import { useState, useRef, useEffect } from 'react'
import '../styles/BookingCalendar.css'

function BookingCalendar({ bookings, rooms }) {
  // Start with current month, or first booking's month if bookings exist
  const getInitialDate = () => {
    if (bookings && bookings.length > 0) {
      const firstBooking = bookings[0]
      const checkIn = new Date(firstBooking.checkIn)
      return new Date(checkIn.getFullYear(), checkIn.getMonth(), 1)
    }
    return new Date() // Current month
  }
  const [currentDate, setCurrentDate] = useState(getInitialDate)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const calendarRef = useRef(null)
  const todayRef = useRef(null)
  
  // Update to show month of latest booking when bookings change (only if calendar is empty)
  useEffect(() => {
    if (bookings && bookings.length > 0 && currentDate) {
      const latestBooking = bookings[bookings.length - 1]
      const checkIn = new Date(latestBooking.checkIn)
      const bookingMonth = new Date(checkIn.getFullYear(), checkIn.getMonth(), 1)
      const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      // Only update if booking is in a different month and we're showing a default month
      if (bookingMonth.getTime() !== currentMonth.getTime()) {
        // Use setTimeout to avoid cascading renders
        setTimeout(() => {
          setCurrentDate(bookingMonth)
        }, 0)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings?.length]) // Only depend on bookings length to avoid cascading

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
    if (!days || days.length === 0) return []
    
    const monthStart = new Date(days[0])
    monthStart.setHours(0, 0, 0, 0)
    const monthEnd = new Date(days[days.length - 1])
    monthEnd.setHours(23, 59, 59, 999)
    
    const filtered = bookings.filter(booking => {
      if (booking.roomNumber !== roomNumber) return false
      const checkIn = new Date(booking.checkIn + 'T00:00:00')
      const checkOut = new Date(booking.checkOut + 'T23:59:59')
      // Booking overlaps if it starts before month ends AND ends after month starts
      const overlaps = checkIn <= monthEnd && checkOut >= monthStart
      if (overlaps) {
        console.log(`✅ Booking ${booking.guestName} (${booking.checkIn} → ${booking.checkOut}) overlaps with ${formatMonthYear(currentDate)}`)
      }
      return overlaps
    })
    
    if (filtered.length > 0) {
      console.log(`📋 Room ${roomNumber}: ${filtered.length} booking(s)`, filtered)
    }
    
    return filtered
  }

  // Calculate booking block position and width
  const getBookingStyle = (booking) => {
    if (!days || days.length === 0) {
      console.warn('No days available for style calculation')
      return { left: '0px', width: '0px', backgroundColor: booking.color || '#4CAF50' }
    }
    
    // Parse check-in and check-out dates (YYYY-MM-DD format)
    // Check-in: Jan 14 means guest arrives on Jan 14
    // Check-out: Jan 15 means guest leaves on Jan 15 (room occupied until Jan 15)
    // Display: show from Jan 14 through the night to Jan 15 morning
    const [checkInYear, checkInMonth, checkInDay] = booking.checkIn.split('-').map(Number)
    const [checkOutYear, checkOutMonth, checkOutDay] = booking.checkOut.split('-').map(Number)
    
    const checkIn = new Date(checkInYear, checkInMonth - 1, checkInDay, 0, 0, 0)
    const checkOut = new Date(checkOutYear, checkOutMonth - 1, checkOutDay, 0, 0, 0)
    
    const monthStart = new Date(days[0])
    monthStart.setHours(0, 0, 0, 0)
    const monthEnd = new Date(days[days.length - 1])
    monthEnd.setHours(23, 59, 59, 999)

    // Clamp dates to current month view
    const displayStart = checkIn < monthStart ? monthStart : checkIn
    const displayEnd = checkOut > monthEnd ? monthEnd : checkOut

    // Calculate day index from month start (0-indexed)
    // Jan 1 = day 1 of month = index 0
    // Jan 14 = day 14 of month = index 13
    const startDay = displayStart.getDate() // 14
    const endDay = displayEnd.getDate() // 15
    
    const startDayIndex = startDay - 1 // 0-indexed: day 14 = index 13
    const endDayIndex = endDay - 1 // 0-indexed: day 15 = index 14
    const duration = Math.max(1, endDayIndex - startDayIndex + 1) // +1 to include both days

    // Each day cell is ~60px wide on desktop
    const dayWidth = 60
    const left = startDayIndex * dayWidth
    const width = duration * dayWidth - 4 // -4 for gap

    const style = {
      left: `${left}px`,
      width: `${width}px`,
      backgroundColor: booking.color || '#4CAF50',
      zIndex: 5
    }
    
    console.log(`🎨 Style for ${booking.guestName}:`, {
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      startDay,
      endDay,
      startDayIndex,
      endDayIndex,
      duration,
      left: style.left,
      width: style.width
    })

    return style
  }

  // Check if booking starts before current month
  const startsBeforeMonth = (booking) => {
    if (!days || days.length === 0) return false
    const checkIn = new Date(booking.checkIn + 'T00:00:00')
    const monthStart = new Date(days[0])
    monthStart.setHours(0, 0, 0, 0)
    return checkIn < monthStart
  }

  // Check if booking ends after current month
  const endsAfterMonth = (booking) => {
    if (!days || days.length === 0) return false
    const checkOut = new Date(booking.checkOut + 'T23:59:59')
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
            console.log(`🏠 Room ${room.roomNumber}: ${roomBookings.length} bookings`, roomBookings)
            
            return (
              <div key={room.roomNumber} className="calendar-row room-row">
                <div className="room-label-cell">
                  <span className="room-name">{room.roomNumber}</span>
                  <span className="room-type">{room.label || room.type || 'Private'}</span>
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
                  {roomBookings.map(booking => {
                    const style = getBookingStyle(booking)
                    console.log(`📦 Rendering booking ${booking.guestName}:`, {
                      checkIn: booking.checkIn,
                      checkOut: booking.checkOut,
                      style,
                      room: booking.roomNumber
                    })
                    return (
                      <div
                        key={booking.id}
                        className={`booking-block ${startsBeforeMonth(booking) ? 'continues-left' : ''} ${endsAfterMonth(booking) ? 'continues-right' : ''}`}
                        style={style}
                        onClick={(e) => handleBookingClick(booking, e)}
                        title={`${booking.guestName} - ${booking.checkIn} to ${booking.checkOut}`}
                      >
                        <span className="booking-guest">{booking.guestName}</span>
                        <span className="booking-platform">{booking.meta?.bed || 'N/A'}</span>
                      </div>
                    )
                  })}
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

