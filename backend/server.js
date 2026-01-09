// Backend server for Booking Calendar App
// Displays confirmed bookings from external platforms (Booking.com, Agoda)
// Each room is private - only one booking per room at a time

import express from 'express'
import cors from 'cors'

const app = express()
const PORT = 3000

app.use(cors())
app.use(express.json())

// ============================================
// DATABASE (In-memory storage)
// ============================================

// Property configuration
const ROOMS = ['A1', 'A2', 'B1', 'B2']

// Property profile
const propertyProfile = {
  id: 1,
  name: 'Property Owner',
  propertyName: 'Sunset Villa',
  totalRooms: 4,
  email: 'owner@example.com'
}

// Booking platforms
const PLATFORMS = ['Booking.com', 'Agoda']

// Color palette for bookings
const BOOKING_COLORS = [
  '#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0',
  '#00BCD4', '#F44336', '#8BC34A', '#FF5722', '#3F51B5'
]

// Random guest names for demo
const DEMO_FIRST_NAMES = [
  'James', 'Maria', 'David', 'Sarah', 'Michael', 'Emma', 'John', 'Olivia',
  'Robert', 'Sophia', 'William', 'Isabella', 'Thomas', 'Mia', 'Daniel', 'Charlotte'
]

const DEMO_LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Wilson', 'Anderson', 'Taylor', 'Moore', 'Jackson', 'Lee'
]

function getBookingColor(bookingId) {
  return BOOKING_COLORS[bookingId % BOOKING_COLORS.length]
}

function generateGuestName() {
  const firstName = DEMO_FIRST_NAMES[Math.floor(Math.random() * DEMO_FIRST_NAMES.length)]
  const lastName = DEMO_LAST_NAMES[Math.floor(Math.random() * DEMO_LAST_NAMES.length)]
  return `${firstName} ${lastName}`
}

function generateEmail(name) {
  const [first, last] = name.toLowerCase().split(' ')
  return `${first}.${last.charAt(0)}@email.com`
}

let nextBookingId = 20

// Confirmed bookings - NO OVERLAPPING dates per room
// Each room is private, one guest at a time
const bookings = [
  // ========== ROOM A1 (sequential, no overlap) ==========
  {
    id: 1,
    platform: 'Booking.com',
    guestName: 'Alice Johnson',
    guestEmail: 'alice.j@email.com',
    roomNumber: 'A1',
    checkIn: '2026-01-02',
    checkOut: '2026-01-05',
    status: 'CONFIRMED',
    createdAt: '2025-12-20T08:00:00Z'
  },
  {
    id: 2,
    platform: 'Agoda',
    guestName: 'Bob Smith',
    guestEmail: 'bob.s@email.com',
    roomNumber: 'A1',
    checkIn: '2026-01-06',
    checkOut: '2026-01-10',
    status: 'CONFIRMED',
    createdAt: '2025-12-21T09:00:00Z'
  },
  {
    id: 3,
    platform: 'Booking.com',
    guestName: 'Carol Davis',
    guestEmail: 'carol.d@email.com',
    roomNumber: 'A1',
    checkIn: '2026-01-12',
    checkOut: '2026-01-16',
    status: 'CONFIRMED',
    createdAt: '2025-12-22T10:00:00Z'
  },
  {
    id: 4,
    platform: 'Agoda',
    guestName: 'Dan Wilson',
    guestEmail: 'dan.w@email.com',
    roomNumber: 'A1',
    checkIn: '2026-01-18',
    checkOut: '2026-01-22',
    status: 'CONFIRMED',
    createdAt: '2025-12-23T11:00:00Z'
  },
  {
    id: 5,
    platform: 'Booking.com',
    guestName: 'Eve Martinez',
    guestEmail: 'eve.m@email.com',
    roomNumber: 'A1',
    checkIn: '2026-01-25',
    checkOut: '2026-01-29',
    status: 'CONFIRMED',
    createdAt: '2025-12-24T12:00:00Z'
  },
  
  // ========== ROOM A2 (sequential, no overlap) ==========
  {
    id: 6,
    platform: 'Agoda',
    guestName: 'Frank Miller',
    guestEmail: 'frank.m@email.com',
    roomNumber: 'A2',
    checkIn: '2026-01-03',
    checkOut: '2026-01-07',
    status: 'CONFIRMED',
    createdAt: '2025-12-18T08:00:00Z'
  },
  {
    id: 7,
    platform: 'Booking.com',
    guestName: 'Grace Lee',
    guestEmail: 'grace.l@email.com',
    roomNumber: 'A2',
    checkIn: '2026-01-08',
    checkOut: '2026-01-12',
    status: 'CONFIRMED',
    createdAt: '2025-12-19T09:00:00Z'
  },
  {
    id: 8,
    platform: 'Agoda',
    guestName: 'Henry Taylor',
    guestEmail: 'henry.t@email.com',
    roomNumber: 'A2',
    checkIn: '2026-01-14',
    checkOut: '2026-01-18',
    status: 'CONFIRMED',
    createdAt: '2025-12-20T10:00:00Z'
  },
  {
    id: 9,
    platform: 'Booking.com',
    guestName: 'Ivy Chen',
    guestEmail: 'ivy.c@email.com',
    roomNumber: 'A2',
    checkIn: '2026-01-20',
    checkOut: '2026-01-24',
    status: 'CONFIRMED',
    createdAt: '2025-12-21T11:00:00Z'
  },
  {
    id: 10,
    platform: 'Agoda',
    guestName: 'Jack Anderson',
    guestEmail: 'jack.a@email.com',
    roomNumber: 'A2',
    checkIn: '2026-01-26',
    checkOut: '2026-01-30',
    status: 'CONFIRMED',
    createdAt: '2025-12-22T12:00:00Z'
  },
  
  // ========== ROOM B1 (sequential, no overlap) ==========
  {
    id: 11,
    platform: 'Booking.com',
    guestName: 'Kate White',
    guestEmail: 'kate.w@email.com',
    roomNumber: 'B1',
    checkIn: '2026-01-01',
    checkOut: '2026-01-04',
    status: 'CONFIRMED',
    createdAt: '2025-12-15T08:00:00Z'
  },
  {
    id: 12,
    platform: 'Agoda',
    guestName: 'Leo Garcia',
    guestEmail: 'leo.g@email.com',
    roomNumber: 'B1',
    checkIn: '2026-01-05',
    checkOut: '2026-01-09',
    status: 'CONFIRMED',
    createdAt: '2025-12-16T09:00:00Z'
  },
  {
    id: 13,
    platform: 'Booking.com',
    guestName: 'Mia Robinson',
    guestEmail: 'mia.r@email.com',
    roomNumber: 'B1',
    checkIn: '2026-01-11',
    checkOut: '2026-01-15',
    status: 'CONFIRMED',
    createdAt: '2025-12-17T10:00:00Z'
  },
  {
    id: 14,
    platform: 'Agoda',
    guestName: 'Noah Brown',
    guestEmail: 'noah.b@email.com',
    roomNumber: 'B1',
    checkIn: '2026-01-17',
    checkOut: '2026-01-21',
    status: 'CONFIRMED',
    createdAt: '2025-12-18T11:00:00Z'
  },
  {
    id: 15,
    platform: 'Booking.com',
    guestName: 'Olivia Thomas',
    guestEmail: 'olivia.t@email.com',
    roomNumber: 'B1',
    checkIn: '2026-01-23',
    checkOut: '2026-01-27',
    status: 'CONFIRMED',
    createdAt: '2025-12-19T12:00:00Z'
  },
  
  // ========== ROOM B2 (sequential, no overlap) ==========
  {
    id: 16,
    platform: 'Agoda',
    guestName: 'Paul Jackson',
    guestEmail: 'paul.j@email.com',
    roomNumber: 'B2',
    checkIn: '2026-01-02',
    checkOut: '2026-01-06',
    status: 'CONFIRMED',
    createdAt: '2025-12-14T08:00:00Z'
  },
  {
    id: 17,
    platform: 'Booking.com',
    guestName: 'Quinn Harris',
    guestEmail: 'quinn.h@email.com',
    roomNumber: 'B2',
    checkIn: '2026-01-07',
    checkOut: '2026-01-11',
    status: 'CONFIRMED',
    createdAt: '2025-12-15T09:00:00Z'
  },
  {
    id: 18,
    platform: 'Agoda',
    guestName: 'Rachel Clark',
    guestEmail: 'rachel.c@email.com',
    roomNumber: 'B2',
    checkIn: '2026-01-13',
    checkOut: '2026-01-17',
    status: 'CONFIRMED',
    createdAt: '2025-12-16T10:00:00Z'
  },
  {
    id: 19,
    platform: 'Booking.com',
    guestName: 'Sam Turner',
    guestEmail: 'sam.t@email.com',
    roomNumber: 'B2',
    checkIn: '2026-01-19',
    checkOut: '2026-01-23',
    status: 'CONFIRMED',
    createdAt: '2025-12-17T11:00:00Z'
  }
]

// ============================================
// HELPER: Check if dates overlap for a room
// ============================================
function hasOverlap(roomNumber, checkIn, checkOut, excludeBookingId = null) {
  const newStart = new Date(checkIn)
  const newEnd = new Date(checkOut)
  
  return bookings.some(booking => {
    if (booking.roomNumber !== roomNumber) return false
    if (excludeBookingId && booking.id === excludeBookingId) return false
    
    const existingStart = new Date(booking.checkIn)
    const existingEnd = new Date(booking.checkOut)
    
    // Overlap if new booking starts before existing ends AND new booking ends after existing starts
    return newStart < existingEnd && newEnd > existingStart
  })
}

// Find available date slot for a room
function findAvailableSlot(roomNumber) {
  const roomBookings = bookings
    .filter(b => b.roomNumber === roomNumber)
    .sort((a, b) => new Date(a.checkIn) - new Date(b.checkIn))
  
  // Look for gaps between bookings in January 2026
  const monthStart = new Date('2026-01-01')
  const monthEnd = new Date('2026-01-31')
  
  let searchStart = monthStart
  
  for (const booking of roomBookings) {
    const bookingStart = new Date(booking.checkIn)
    const bookingEnd = new Date(booking.checkOut)
    
    // Check if there's a gap before this booking (at least 2 days)
    const gapDays = Math.floor((bookingStart - searchStart) / (1000 * 60 * 60 * 24))
    if (gapDays >= 2) {
      const duration = Math.min(gapDays, 4) // Max 4 nights
      const checkOut = new Date(searchStart)
      checkOut.setDate(checkOut.getDate() + duration)
      return {
        checkIn: searchStart.toISOString().split('T')[0],
        checkOut: checkOut.toISOString().split('T')[0]
      }
    }
    
    searchStart = bookingEnd
  }
  
  // Check gap after last booking
  const gapDays = Math.floor((monthEnd - searchStart) / (1000 * 60 * 60 * 24))
  if (gapDays >= 2) {
    const duration = Math.min(gapDays, 4)
    const checkOut = new Date(searchStart)
    checkOut.setDate(checkOut.getDate() + duration)
    return {
      checkIn: searchStart.toISOString().split('T')[0],
      checkOut: checkOut.toISOString().split('T')[0]
    }
  }
  
  return null // No available slot
}

// ============================================
// API ENDPOINTS
// ============================================

app.get('/api/profile', (req, res) => {
  res.json(propertyProfile)
})

app.get('/api/rooms', (req, res) => {
  res.json(ROOMS.map(room => ({
    roomNumber: room,
    type: 'Private'
  })))
})

app.get('/api/bookings', (req, res) => {
  const bookingsWithColors = bookings.map(booking => ({
    ...booking,
    color: getBookingColor(booking.id)
  }))
  res.json(bookingsWithColors)
})

app.get('/api/bookings/room/:roomNumber', (req, res) => {
  const roomBookings = bookings
    .filter(b => b.roomNumber === req.params.roomNumber)
    .map(booking => ({
      ...booking,
      color: getBookingColor(booking.id)
    }))
  res.json(roomBookings)
})

app.get('/api/bookings/:id', (req, res) => {
  const booking = bookings.find(b => b.id === parseInt(req.params.id))
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' })
  }
  res.json({
    ...booking,
    color: getBookingColor(booking.id)
  })
})

// ============================================
// DEMO ENDPOINTS
// ============================================

// Generate a random booking (finds available slot)
app.post('/api/demo/random-booking', (req, res) => {
  // Try each room until we find one with availability
  const shuffledRooms = [...ROOMS].sort(() => Math.random() - 0.5)
  
  for (const roomNumber of shuffledRooms) {
    const slot = findAvailableSlot(roomNumber)
    if (slot) {
      const guestName = generateGuestName()
      const newBooking = {
        id: nextBookingId++,
        platform: PLATFORMS[Math.floor(Math.random() * PLATFORMS.length)],
        guestName,
        guestEmail: generateEmail(guestName),
        roomNumber,
        checkIn: slot.checkIn,
        checkOut: slot.checkOut,
        status: 'CONFIRMED',
        createdAt: new Date().toISOString()
      }
      
      bookings.push(newBooking)
      console.log(`📥 New booking: ${newBooking.guestName} in Room ${roomNumber} (${slot.checkIn} → ${slot.checkOut})`)
      
      return res.status(201).json({
        ...newBooking,
        color: getBookingColor(newBooking.id)
      })
    }
  }
  
  res.status(409).json({ error: 'No available slots' })
})

// Cancel a random booking
app.post('/api/demo/random-cancel', (req, res) => {
  if (bookings.length === 0) {
    return res.status(404).json({ error: 'No bookings to cancel' })
  }
  
  const randomIndex = Math.floor(Math.random() * bookings.length)
  const cancelledBooking = bookings.splice(randomIndex, 1)[0]
  
  console.log(`❌ Cancelled: ${cancelledBooking.guestName} in Room ${cancelledBooking.roomNumber}`)
  
  res.json({
    message: 'Booking cancelled',
    booking: {
      ...cancelledBooking,
      color: getBookingColor(cancelledBooking.id)
    }
  })
})

// Start the server
app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 Backend server running at http://127.0.0.1:${PORT}`)
  console.log(`📊 Loaded ${bookings.length} confirmed bookings`)
  console.log(`🏠 Rooms: ${ROOMS.join(', ')} (Private rooms - no overlapping bookings)`)
})
