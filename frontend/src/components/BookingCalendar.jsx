import { useCallback, useMemo, useState, useRef, useEffect } from 'react'
import '../styles/BookingCalendar.css'
import GuestModal from './GuestModal'
import { apiFetch } from '../utils/api'

function formatISODateLocal(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function addDaysISO(dateStr, daysToAdd) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + daysToAdd)
  return formatISODateLocal(d)
}

function BookingCalendar({ bookings, rooms }) {
  // Check if a date is today (function declaration so it’s safely hoisted)
  function isToday(date) {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  // Check if date is weekend (function declaration so it’s safely hoisted)
  function isWeekend(date) {
    const day = date.getDay()
    return day === 0 || day === 6
  }

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

  const { days, monthStart, monthEnd } = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const list = []
    for (let day = 1; day <= daysInMonth; day++) {
      list.push(new Date(year, month, day))
    }

    const start = new Date(year, month, 1)
    start.setHours(0, 0, 0, 0)
    const end = new Date(year, month, daysInMonth)
    end.setHours(23, 59, 59, 999)

    return { days: list, monthStart: start, monthEnd: end }
  }, [currentDate])

  const dayMeta = useMemo(() => {
    return days.map((day) => ({
      day,
      dateStr: formatISODateLocal(day),
      isToday: isToday(day),
      isWeekend: isWeekend(day)
    }))
  }, [days])

  const bookingsByRoom = useMemo(() => {
    const map = new Map()
    for (const booking of bookings || []) {
      const checkIn = new Date(booking.checkIn + 'T00:00:00')
      const checkOut = new Date(booking.checkOut + 'T00:00:00') // exclusive
      const overlaps = checkIn <= monthEnd && checkOut >= monthStart
      if (!overlaps) continue

      const key = booking.roomNumber
      const list = map.get(key)
      if (list) list.push(booking)
      else map.set(key, [booking])
    }
    return map
  }, [bookings, monthStart, monthEnd])

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

  const [guestModal, setGuestModal] = useState({
    open: false,
    mode: 'create', // 'create' | 'edit'
    roomNumber: '',
    date: '',
    bookingId: null,
    initialGuest: null,
    error: null,
    saving: false,
    deleting: false
  })

  const suppressOpenUntilRef = useRef(0)

  const closeGuestModal = useCallback(() => {
    setGuestModal(prev => ({ ...prev, open: false, error: null, saving: false, deleting: false }))
  }, [])

  const findBookingForCell = useCallback((roomNumber, dateStr) => {
    const roomBookings = bookingsByRoom.get(roomNumber) || []
    // Booking interval: [checkIn, checkOut) (checkout day is not occupied).
    return roomBookings.find(b => dateStr >= b.checkIn && dateStr < b.checkOut) || null
  }, [bookingsByRoom])

  const openGuestModalForCell = useCallback((roomNumber, dateStr) => {
    if (Date.now() < suppressOpenUntilRef.current) return

    const booking = findBookingForCell(roomNumber, dateStr)
    if (booking) {
      setGuestModal({
        open: true,
        mode: 'edit',
        roomNumber,
        date: dateStr,
        bookingId: booking.id,
        initialGuest: {
          guest: booking.guest || { fullName: booking.guestName, email: booking.guestEmail },
          stay: { checkIn: booking.checkIn, checkOut: booking.checkOut }
        },
        error: null,
        saving: false,
        deleting: false
      })
      return
    }

    setGuestModal({
      open: true,
      mode: 'create',
      roomNumber,
      date: dateStr,
      bookingId: null,
      initialGuest: {
        guest: { fullName: '', email: '', phone: '', gender: '' },
        stay: { checkIn: dateStr, checkOut: addDaysISO(dateStr, 1) }
      },
      error: null,
      saving: false,
      deleting: false
    })
  }, [findBookingForCell])

  const handleCellClick = useCallback((e) => {
    const roomNumber = e.currentTarget.dataset.room
    const dateStr = e.currentTarget.dataset.date
    if (!roomNumber || !dateStr) return
    openGuestModalForCell(roomNumber, dateStr)
  }, [openGuestModalForCell])

  const handleSaveGuest = useCallback(async (value) => {
    setGuestModal(prev => ({ ...prev, saving: true, error: null }))
    try {
      const guest = value?.guest || {}
      const stay = value?.stay || {}
      if (guestModal.mode === 'edit' && guestModal.bookingId) {
        const res = await apiFetch(`/api/bookings/${guestModal.bookingId}/guest`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guest, stay })
        })
        const data = await res.json().catch(() => null)
        if (!res.ok) throw new Error(data?.error || 'Failed to save guest')
      } else {
        const res = await apiFetch('/api/bookings/cell', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomNumber: guestModal.roomNumber,
            checkIn: stay.checkIn || guestModal.date,
            checkOut: stay.checkOut || addDaysISO(guestModal.date, 1),
            guest
          })
        })
        const data = await res.json().catch(() => null)
        if (!res.ok) throw new Error(data?.error || 'Failed to add guest')
      }

      // On mobile, the tap that hits "Save" can also hit the underlying cell after the modal unmounts.
      // Suppress cell-open for a short window so the modal actually stays closed.
      suppressOpenUntilRef.current = Date.now() + 700
      closeGuestModal()
      window.dispatchEvent(new Event('booking-changed'))
    } catch (err) {
      setGuestModal(prev => ({ ...prev, saving: false, error: err.message || 'Save failed' }))
    }
  }, [guestModal.mode, guestModal.bookingId, guestModal.roomNumber, guestModal.date, closeGuestModal])

  const handleDeleteGuest = useCallback(async () => {
    if (!guestModal.bookingId) return
    setGuestModal(prev => ({ ...prev, deleting: true, error: null }))
    try {
      const res = await apiFetch(`/api/bookings/${guestModal.bookingId}`, { method: 'DELETE' })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Failed to delete booking')

      suppressOpenUntilRef.current = Date.now() + 700
      closeGuestModal()
      window.dispatchEvent(new Event('booking-changed'))
    } catch (err) {
      setGuestModal(prev => ({ ...prev, deleting: false, error: err.message || 'Delete failed' }))
    }
  }, [guestModal.bookingId, closeGuestModal])

  // Format month/year for header
  const formatMonthYear = (date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  // Format day header
  const formatDayHeader = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short' })
  }

  const getRoomBookings = (roomNumber) => bookingsByRoom.get(roomNumber) || []

  // Calculate booking block position and width
  const getBookingStyle = (booking) => {
    if (!days || days.length === 0) {
      console.warn('No days available for style calculation')
      return { left: '0px', width: '0px', backgroundColor: booking.color || '#4CAF50' }
    }
    
    // Parse check-in and check-out dates (YYYY-MM-DD format)
    // Check-in: Jan 14 means guest arrives on Jan 14
    // Booking interval: [checkIn, checkOut) (checkout day is not occupied).
    const [checkInYear, checkInMonth, checkInDay] = booking.checkIn.split('-').map(Number)
    const [checkOutYear, checkOutMonth, checkOutDay] = booking.checkOut.split('-').map(Number)
    
    const checkIn = new Date(checkInYear, checkInMonth - 1, checkInDay, 0, 0, 0)
    const checkOutExclusive = new Date(checkOutYear, checkOutMonth - 1, checkOutDay, 0, 0, 0)
    const checkOutInclusive = new Date(checkOutExclusive)
    checkOutInclusive.setDate(checkOutInclusive.getDate() - 1)
    
    const monthStart = new Date(days[0])
    monthStart.setHours(0, 0, 0, 0)
    const monthEnd = new Date(days[days.length - 1])
    monthEnd.setHours(23, 59, 59, 999)

    // Clamp dates to current month view
    const displayStart = checkIn < monthStart ? monthStart : checkIn
    const displayEnd = checkOutInclusive > monthEnd ? monthEnd : checkOutInclusive

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
    const checkOut = new Date(booking.checkOut + 'T00:00:00')
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
            {dayMeta.map(({ day, isToday: dayIsToday, isWeekend: dayIsWeekend }, index) => (
              <div 
                key={index} 
                className={`day-cell header-cell ${dayIsToday ? 'today' : ''} ${dayIsWeekend ? 'weekend' : ''}`}
                ref={dayIsToday ? todayRef : null}
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
                  <span className="room-type">{room.label || room.type || 'Private'}</span>
                </div>
                <div className="bookings-track">
                  {/* Day grid background */}
                  {dayMeta.map(({ isToday: dayIsToday, isWeekend: dayIsWeekend, dateStr }, index) => (
                    <div 
                      key={index} 
                      className={`day-slot ${dayIsToday ? 'today' : ''} ${dayIsWeekend ? 'weekend' : ''}`}
                      data-room={room.roomNumber}
                      data-date={dateStr}
                      onClick={handleCellClick}
                    >
                      <button
                        type="button"
                        className="cell-add-btn"
                        aria-label="Add or edit guest"
                        onClick={(e) => {
                          e.stopPropagation()
                          openGuestModalForCell(room.roomNumber, dateStr)
                        }}
                      >
                        +
                      </button>
                    </div>
                  ))}
                  
                  {/* Booking blocks */}
                  {roomBookings.map(booking => {
                    const style = getBookingStyle(booking)
                    return (
                      <div
                        key={booking.id}
                        className={`booking-block ${startsBeforeMonth(booking) ? 'continues-left' : ''} ${endsAfterMonth(booking) ? 'continues-right' : ''}`}
                        style={style}
                        onClick={(e) => handleBookingClick(booking, e)}
                        title={`${booking.guestName} - ${booking.checkIn} to ${booking.checkOut}`}
                      >
                        <span
                          className="booking-guest"
                          onClick={(e) => {
                            e.stopPropagation()
                            setGuestModal({
                              open: true,
                              mode: 'edit',
                              roomNumber: booking.roomNumber,
                              date: booking.checkIn,
                              bookingId: booking.id,
                              initialGuest: {
                                guest: booking.guest || { fullName: booking.guestName, email: booking.guestEmail },
                                stay: { checkIn: booking.checkIn, checkOut: booking.checkOut }
                              },
                              error: null,
                              saving: false,
                              deleting: false
                            })
                          }}
                          title="Edit guest"
                        >
                          {booking.guestName}
                        </span>
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

      {/* Guest modal */}
      <GuestModal
        key={`${guestModal.mode}:${guestModal.bookingId || ''}:${guestModal.roomNumber}:${guestModal.date}:${guestModal.open ? 'open' : 'closed'}`}
        open={guestModal.open}
        title={guestModal.mode === 'edit' ? 'Edit Guest' : 'Add Guest'}
        initialValue={guestModal.initialGuest}
        popupClassName="guest-modal"
        saving={guestModal.saving}
        deleting={guestModal.deleting}
        onClose={closeGuestModal}
        onSave={handleSaveGuest}
        onDelete={guestModal.mode === 'edit' ? handleDeleteGuest : undefined}
      />
      {guestModal.open && guestModal.error && (
        <div className="auth-error" style={{ margin: '12px 16px 0 16px' }}>
          {guestModal.error}
        </div>
      )}

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

