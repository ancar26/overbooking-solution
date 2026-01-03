// Backend server for overbooking prevention app
// This server provides API endpoints for the frontend

import express from 'express'
import cors from 'cors'

const app = express()
const PORT = 3000

// Enable CORS so frontend can talk to backend
app.use(cors())
app.use(express.json())

// ============================================
// MOCKED DATABASE (In-memory storage)
// ============================================

// Property configuration
// 4 rooms, each with 5 beds = 20 total beds
const ROOMS = ['A1', 'A2', 'B1', 'B2']
const BEDS_PER_ROOM = 5

// Property owner profile
let propertyProfile = {
  id: 1,
  name: 'Property Owner',
  propertyName: 'Sunset Hostel',
  totalRooms: 4,
  totalBeds: 20, // 4 rooms × 5 beds
  availableBeds: 2, // Will be calculated dynamically
  email: 'owner@example.com'
}

// Mocked bookings
// CONFIRMED bookings: 18 beds occupied (2 available)
// - Room A1: 4 beds occupied (Person 1-4)
// - Room A2: 5 beds occupied (Person 5-9)
// - Room B1: 5 beds occupied (Person 10-14)
// - Room B2: 4 beds occupied (Person 15-18)
// PENDING bookings: 6 people wanting beds
// - 2 early bookings (can be approved to fill 20 beds)
// - 4 late bookings (will auto-reject when capacity is full)

// Store initial bookings for reset functionality
const INITIAL_BOOKINGS = [
  // ========== ROOM A1: 4 beds occupied ==========
  {
    id: 1,
    platform: 'Booking.com',
    guestName: 'Alice Johnson',
    guestEmail: 'alice.j@email.com',
    roomNumber: 'A1',
    beds: 1,
    checkIn: '2024-02-15',
    checkOut: '2024-02-18',
    status: 'CONFIRMED',
    createdAt: '2024-02-01T08:00:00Z'
  },
  {
    id: 2,
    platform: 'Agoda',
    guestName: 'Bob Smith',
    guestEmail: 'bob.s@email.com',
    roomNumber: 'A1',
    beds: 1,
    checkIn: '2024-02-15',
    checkOut: '2024-02-18',
    status: 'CONFIRMED',
    createdAt: '2024-02-01T09:00:00Z'
  },
  {
    id: 3,
    platform: 'Hostelworld',
    guestName: 'Carol Davis',
    guestEmail: 'carol.d@email.com',
    roomNumber: 'A1',
    beds: 1,
    checkIn: '2024-02-15',
    checkOut: '2024-02-18',
    status: 'CONFIRMED',
    createdAt: '2024-02-01T10:00:00Z'
  },
  {
    id: 4,
    platform: 'Booking.com',
    guestName: 'Dan Wilson',
    guestEmail: 'dan.w@email.com',
    roomNumber: 'A1',
    beds: 1,
    checkIn: '2024-02-15',
    checkOut: '2024-02-18',
    status: 'CONFIRMED',
    createdAt: '2024-02-01T11:00:00Z'
  },
  // ========== ROOM A2: 5 beds occupied (FULL) ==========
  {
    id: 5,
    platform: 'Agoda',
    guestName: 'Emma Brown',
    guestEmail: 'emma.b@email.com',
    roomNumber: 'A2',
    beds: 1,
    checkIn: '2024-02-15',
    checkOut: '2024-02-18',
    status: 'CONFIRMED',
    createdAt: '2024-02-02T08:00:00Z'
  },
  {
    id: 6,
    platform: 'Hostelworld',
    guestName: 'Frank Miller',
    guestEmail: 'frank.m@email.com',
    roomNumber: 'A2',
    beds: 1,
    checkIn: '2024-02-15',
    checkOut: '2024-02-18',
    status: 'CONFIRMED',
    createdAt: '2024-02-02T09:00:00Z'
  },
  {
    id: 7,
    platform: 'Booking.com',
    guestName: 'Grace Lee',
    guestEmail: 'grace.l@email.com',
    roomNumber: 'A2',
    beds: 1,
    checkIn: '2024-02-15',
    checkOut: '2024-02-18',
    status: 'CONFIRMED',
    createdAt: '2024-02-02T10:00:00Z'
  },
  {
    id: 8,
    platform: 'Agoda',
    guestName: 'Henry Taylor',
    guestEmail: 'henry.t@email.com',
    roomNumber: 'A2',
    beds: 1,
    checkIn: '2024-02-15',
    checkOut: '2024-02-18',
    status: 'CONFIRMED',
    createdAt: '2024-02-02T11:00:00Z'
  },
  {
    id: 9,
    platform: 'Hostelworld',
    guestName: 'Ivy Chen',
    guestEmail: 'ivy.c@email.com',
    roomNumber: 'A2',
    beds: 1,
    checkIn: '2024-02-15',
    checkOut: '2024-02-18',
    status: 'CONFIRMED',
    createdAt: '2024-02-02T12:00:00Z'
  },
  // ========== ROOM B1: 5 beds occupied (FULL) ==========
  {
    id: 10,
    platform: 'Booking.com',
    guestName: 'Jack Anderson',
    guestEmail: 'jack.a@email.com',
    roomNumber: 'B1',
    beds: 1,
    checkIn: '2024-02-15',
    checkOut: '2024-02-18',
    status: 'CONFIRMED',
    createdAt: '2024-02-03T08:00:00Z'
  },
  {
    id: 11,
    platform: 'Agoda',
    guestName: 'Kate White',
    guestEmail: 'kate.w@email.com',
    roomNumber: 'B1',
    beds: 1,
    checkIn: '2024-02-15',
    checkOut: '2024-02-18',
    status: 'CONFIRMED',
    createdAt: '2024-02-03T09:00:00Z'
  },
  {
    id: 12,
    platform: 'Hostelworld',
    guestName: 'Leo Garcia',
    guestEmail: 'leo.g@email.com',
    roomNumber: 'B1',
    beds: 1,
    checkIn: '2024-02-15',
    checkOut: '2024-02-18',
    status: 'CONFIRMED',
    createdAt: '2024-02-03T10:00:00Z'
  },
  {
    id: 13,
    platform: 'Booking.com',
    guestName: 'Mia Robinson',
    guestEmail: 'mia.r@email.com',
    roomNumber: 'B1',
    beds: 1,
    checkIn: '2024-02-15',
    checkOut: '2024-02-18',
    status: 'CONFIRMED',
    createdAt: '2024-02-03T11:00:00Z'
  },
  {
    id: 14,
    platform: 'Agoda',
    guestName: 'Noah Martinez',
    guestEmail: 'noah.m@email.com',
    roomNumber: 'B1',
    beds: 1,
    checkIn: '2024-02-15',
    checkOut: '2024-02-18',
    status: 'CONFIRMED',
    createdAt: '2024-02-03T12:00:00Z'
  },
  // ========== ROOM B2: 4 beds occupied (1 available) ==========
  {
    id: 15,
    platform: 'Hostelworld',
    guestName: 'Olivia Thomas',
    guestEmail: 'olivia.t@email.com',
    roomNumber: 'B2',
    beds: 1,
    checkIn: '2024-02-15',
    checkOut: '2024-02-18',
    status: 'CONFIRMED',
    createdAt: '2024-02-04T08:00:00Z'
  },
  {
    id: 16,
    platform: 'Booking.com',
    guestName: 'Paul Jackson',
    guestEmail: 'paul.j@email.com',
    roomNumber: 'B2',
    beds: 1,
    checkIn: '2024-02-15',
    checkOut: '2024-02-18',
    status: 'CONFIRMED',
    createdAt: '2024-02-04T09:00:00Z'
  },
  {
    id: 17,
    platform: 'Agoda',
    guestName: 'Quinn Harris',
    guestEmail: 'quinn.h@email.com',
    roomNumber: 'B2',
    beds: 1,
    checkIn: '2024-02-15',
    checkOut: '2024-02-18',
    status: 'CONFIRMED',
    createdAt: '2024-02-04T10:00:00Z'
  },
  {
    id: 18,
    platform: 'Hostelworld',
    guestName: 'Rachel Clark',
    guestEmail: 'rachel.c@email.com',
    roomNumber: 'B2',
    beds: 1,
    checkIn: '2024-02-15',
    checkOut: '2024-02-18',
    status: 'CONFIRMED',
    createdAt: '2024-02-04T11:00:00Z'
  },

  // ========== PENDING BOOKINGS ==========
  // 4 people want to book, only 2 beds available
  // 2 early bookings (can be approved) + 2 late bookings (will auto-reject)

  // EARLY BOOKING 1: Room A1 (09:00:00) - CAN APPROVE (18 → 19)
  {
    id: 19,
    platform: 'Booking.com',
    guestName: 'Sam Turner',
    guestEmail: 'sam.t@email.com',
    roomNumber: 'A1',
    beds: 1,
    checkIn: '2024-02-15',
    checkOut: '2024-02-18',
    status: 'PENDING',
    createdAt: '2024-02-10T09:00:00Z' // EARLY - first in line
  },
  // EARLY BOOKING 2: Room B2 (09:01:00) - CAN APPROVE (19 → 20)
  {
    id: 20,
    platform: 'Agoda',
    guestName: 'Tina Moore',
    guestEmail: 'tina.m@email.com',
    roomNumber: 'B2',
    beds: 1,
    checkIn: '2024-02-15',
    checkOut: '2024-02-18',
    status: 'PENDING',
    createdAt: '2024-02-10T09:01:00Z' // EARLY - second in line
  },
  // LATE BOOKING 1: Room A1 (09:10:00) - WILL AUTO-REJECT (no capacity after first 2 approved)
  {
    id: 21,
    platform: 'Hostelworld',
    guestName: 'Uma Nelson',
    guestEmail: 'uma.n@email.com',
    roomNumber: 'A1', // Same room as Sam Turner
    beds: 1,
    checkIn: '2024-02-15',
    checkOut: '2024-02-18',
    status: 'PENDING',
    createdAt: '2024-02-10T09:10:00Z' // LATE - booked after Sam
  },
  // LATE BOOKING 2: Room B2 (09:11:00) - WILL AUTO-REJECT (no capacity after first 2 approved)
  {
    id: 22,
    platform: 'Booking.com',
    guestName: 'Victor Adams',
    guestEmail: 'victor.a@email.com',
    roomNumber: 'B2', // Same room as Tina Moore
    beds: 1,
    checkIn: '2024-02-15',
    checkOut: '2024-02-18',
    status: 'PENDING',
    createdAt: '2024-02-10T09:11:00Z' // LATE - booked after Tina
  },
  // LATE BOOKING 3: Room A2 (09:15:00) - WILL AUTO-REJECT
  {
    id: 23,
    platform: 'Agoda',
    guestName: 'Wendy Parker',
    guestEmail: 'wendy.p@email.com',
    roomNumber: 'A2', // Different room but no capacity
    beds: 1,
    checkIn: '2024-02-15',
    checkOut: '2024-02-18',
    status: 'PENDING',
    createdAt: '2024-02-10T09:15:00Z' // LATE - booked even later
  },
  // LATE BOOKING 4: Room B1 (09:16:00) - WILL AUTO-REJECT
  {
    id: 24,
    platform: 'Hostelworld',
    guestName: 'Xavier Rodriguez',
    guestEmail: 'xavier.r@email.com',
    roomNumber: 'B1', // Different room but no capacity
    beds: 1,
    checkIn: '2024-02-15',
    checkOut: '2024-02-18',
    status: 'PENDING',
    createdAt: '2024-02-10T09:16:00Z' // LATE - booked even later
  }
]

// Deep copy function for resetting bookings
function deepCopyBookings(bookingsArray) {
  return bookingsArray.map(b => ({ ...b }))
}

// Active bookings (starts as copy of initial state)
let bookings = deepCopyBookings(INITIAL_BOOKINGS)

// ============================================
// HELPER FUNCTIONS
// ============================================

// Calculate booked beds from confirmed bookings
function calculateBookedBeds() {
  return bookings
    .filter(b => b.status === 'CONFIRMED')
    .reduce((total, booking) => total + booking.beds, 0)
}

// Update available beds
function updateAvailableBeds() {
  propertyProfile.availableBeds = propertyProfile.totalBeds - calculateBookedBeds()
}

// Auto-reject ALL remaining pending bookings when property is fully booked
function autoRejectFullyBookedBookings() {
  updateAvailableBeds()
  
  // Only auto-reject if property is truly fully booked (0 available beds)
  if (propertyProfile.availableBeds > 0) {
    return // Still have capacity, don't auto-reject anything
  }
  
  // Property is fully booked - auto-reject ALL remaining pending bookings
  const pendingBookings = bookings.filter(b => b.status === 'PENDING')
  
  pendingBookings.forEach(booking => {
    booking.status = 'AUTO_REJECTED'
    booking.autoRejectedReason = 'Informed: Property is fully booked'
  })
  
  if (pendingBookings.length > 0) {
    console.log(`⚠️  Auto-rejected ${pendingBookings.length} pending bookings (property fully booked)`)
  }
}

// ============================================
// API ENDPOINTS
// ============================================

// Get room occupancy summary
app.get('/api/rooms/summary', (req, res) => {
  const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED')
  
  // Build room summary
  const roomSummary = ROOMS.map(roomNum => {
    const roomBookings = confirmedBookings.filter(b => b.roomNumber === roomNum)
    const occupiedBeds = roomBookings.length // Each booking is 1 bed
    
    // Create bed slots (5 per room)
    const bedSlots = []
    for (let i = 0; i < BEDS_PER_ROOM; i++) {
      if (i < roomBookings.length) {
        // Occupied bed
        const booking = roomBookings[i]
        bedSlots.push({
          bedNumber: i + 1,
          occupied: true,
          guestName: booking.guestName,
          guestEmail: booking.guestEmail,
          platform: booking.platform,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          createdAt: booking.createdAt
        })
      } else {
        // Empty bed
        bedSlots.push({
          bedNumber: i + 1,
          occupied: false
        })
      }
    }
    
    return {
      roomNumber: roomNum,
      capacity: BEDS_PER_ROOM,
      occupiedBeds: occupiedBeds,
      bedSlots: bedSlots
    }
  })
  
  res.json(roomSummary)
})

// Get property owner profile
app.get('/api/profile', (req, res) => {
  updateAvailableBeds()
  const bookedBeds = calculateBookedBeds()
  res.json({
    ...propertyProfile,
    bookedBeds: bookedBeds
  })
})

// Get all bookings (sorted by creation date - oldest first)
app.get('/api/bookings', (req, res) => {
  autoRejectFullyBookedBookings()
  
  const sortedBookings = [...bookings].sort((a, b) => {
    return new Date(a.createdAt) - new Date(b.createdAt)
  })
  res.json(sortedBookings)
})

// Get a single booking by ID
app.get('/api/bookings/:id', (req, res) => {
  const booking = bookings.find(b => b.id === parseInt(req.params.id))
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' })
  }
  res.json(booking)
})

// Approve a booking
app.post('/api/bookings/:id/approve', (req, res) => {
  const booking = bookings.find(b => b.id === parseInt(req.params.id))
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' })
  }

  if (booking.status !== 'PENDING') {
    return res.status(400).json({ error: 'Only pending bookings can be approved' })
  }

  // Check if there are enough beds available
  updateAvailableBeds()
  
  if (propertyProfile.availableBeds < booking.beds) {
    return res.status(400).json({ 
      error: 'PROPERTY_FULLY_BOOKED',
      message: 'Property fully booked',
      currentBookedBeds: calculateBookedBeds(),
      totalBeds: propertyProfile.totalBeds,
      availableBeds: propertyProfile.availableBeds
    })
  }

  // Approve the booking
  booking.status = 'CONFIRMED'
  
  // Update available beds and auto-reject others if needed
  updateAvailableBeds()
  autoRejectFullyBookedBookings()
  
  const bookedBeds = calculateBookedBeds()
  
  res.json({ 
    message: 'Booking approved',
    booking: booking,
    availableBeds: propertyProfile.availableBeds,
    bookedBeds: bookedBeds
  })
})

// Reject a booking
app.post('/api/bookings/:id/reject', (req, res) => {
  const booking = bookings.find(b => b.id === parseInt(req.params.id))
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' })
  }

  if (booking.status !== 'PENDING') {
    return res.status(400).json({ error: 'Only pending bookings can be rejected' })
  }

  booking.status = 'REJECTED'
  
  res.json({ 
    message: 'Booking rejected',
    booking: booking,
    availableBeds: propertyProfile.availableBeds
  })
})

// Cancel a booking (restore beds)
app.post('/api/bookings/:id/cancel', (req, res) => {
  const booking = bookings.find(b => b.id === parseInt(req.params.id))
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' })
  }

  if (booking.status === 'CANCELLED') {
    return res.status(400).json({ error: 'Booking already cancelled' })
  }

  booking.status = 'CANCELLED'
  updateAvailableBeds()
  
  res.json({ 
    message: 'Booking cancelled',
    booking: booking,
    availableBeds: propertyProfile.availableBeds,
    bookedBeds: calculateBookedBeds()
  })
})

// Reset demo to initial state
app.post('/api/reset', (req, res) => {
  // Reset bookings to initial state
  bookings = deepCopyBookings(INITIAL_BOOKINGS)
  updateAvailableBeds()
  
  console.log('🔄 Demo reset to initial state')
  console.log(`🛏️  Total beds: ${propertyProfile.totalBeds}, Occupied: ${calculateBookedBeds()}, Available: ${propertyProfile.availableBeds}`)
  
  res.json({
    message: 'Demo reset successfully',
    totalBeds: propertyProfile.totalBeds,
    bookedBeds: calculateBookedBeds(),
    availableBeds: propertyProfile.availableBeds,
    pendingBookings: bookings.filter(b => b.status === 'PENDING').length
  })
})

// Initialize available beds on startup
updateAvailableBeds()

// Start the server
app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 Backend server running at http://127.0.0.1:${PORT}`)
  console.log(`📊 Initialized with ${bookings.length} bookings`)
  console.log(`🛏️  Total beds: ${propertyProfile.totalBeds}, Occupied: ${calculateBookedBeds()}, Available: ${propertyProfile.availableBeds}`)
})
