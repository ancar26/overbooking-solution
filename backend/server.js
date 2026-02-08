// Backend server for Booking Calendar App
// SQLite database for persistence

import express from 'express'
import cors from 'cors'
import crypto from 'crypto'
import db, { userQueries, propertyQueries, bookingQueries } from './database.js'

const app = express()
const PORT = process.env.PORT || 3000;

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || process.env.CORS_ORIGIN || ''
const ALLOWED_ORIGINS = [
  // Local dev (Vite)
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  // Optional production origin (Render static site)
  ...(FRONTEND_ORIGIN ? [FRONTEND_ORIGIN] : [])
]

app.use(cors({
  origin(origin, cb) {
    // Allow non-browser clients (no Origin header) like curl/Postman/Render health checks.
    if (!origin) return cb(null, true)
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true)
    return cb(new Error(`CORS blocked for origin: ${origin}`))
  }
}))
app.use(express.json())

// ============================================
// HELPER FUNCTIONS
// ============================================

const ROOMS = ['A1', 'A2', 'B1', 'B2']
const ROOM_LABELS = {
  A1: 'privateA',
  A2: 'privateB',
  B1: 'dorm1',
  B2: 'dorm2'
}

const BOOKING_COLORS = [
  '#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0',
  '#00BCD4', '#F44336', '#8BC34A', '#FF5722', '#3F51B5'
]

function getBookingColor(bookingId) {
  return BOOKING_COLORS[bookingId % BOOKING_COLORS.length]
}

function hashPassword(password, salt) {
  return crypto.createHash('sha256').update(password + salt).digest('hex')
}

function generateToken(email) {
  return Buffer.from(`${email}:${Date.now()}`).toString('base64')
}

function safeJsonParse(value, fallback) {
  if (!value || typeof value !== 'string') return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function normalizeISODate(value) {
  // Expect YYYY-MM-DD, keep as pure date (no timezone conversion).
  if (!value || typeof value !== 'string') return null
  const m = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return null
  const year = Number(m[1])
  const month = Number(m[2])
  const day = Number(m[3])
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null
  // Basic range validation (Date.UTC will normalize otherwise).
  if (month < 1 || month > 12) return null
  if (day < 1 || day > 31) return null
  return `${m[1]}-${m[2]}-${m[3]}`
}

function addDaysISO_UTC(isoDate, daysToAdd) {
  // Add days in UTC to avoid DST/timezone shifts.
  const m = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  const year = Number(m[1])
  const month = Number(m[2])
  const day = Number(m[3])
  const dt = new Date(Date.UTC(year, month - 1, day))
  dt.setUTCDate(dt.getUTCDate() + daysToAdd)
  const y = String(dt.getUTCFullYear()).padStart(4, '0')
  const mo = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const d = String(dt.getUTCDate()).padStart(2, '0')
  return `${y}-${mo}-${d}`
}

function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim()
  }
  const alt = req.headers['x-auth-token']
  if (alt && typeof alt === 'string') return alt
  return null
}

function getUserFromToken(token) {
  try {
    // Demo token format: base64("email:timestamp"). Not a JWT.
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const [email] = decoded.split(':')
    if (!email) return null
    return userQueries.findByEmail.get(email.toLowerCase())
  } catch {
    return null
  }
}

function requireAuth(req, res, next) {
  const token = getTokenFromRequest(req)
  if (!token) return res.status(401).json({ error: 'Unauthenticated' })

  const user = getUserFromToken(token)
  if (!user) return res.status(401).json({ error: 'Unauthenticated' })

  req.user = { id: user.id, name: user.name, email: user.email }
  next()
}

function ensurePropertyRowForUser(user) {
  // Assumption: each authenticated user manages exactly one property profile.
  let property = propertyQueries.getByUserId.get(user.id)
  if (property) return property

  // Reasonable defaults: create a scoped property row, but mark setup incomplete.
  propertyQueries.create.run(
    user.id,
    'My Property',
    user.name,
    0, // rooms (legacy field; treat as private rooms count)
    0, // dorm_beds (legacy field; use dorms_json for real config)
    0, // private_rooms
    JSON.stringify([]), // dorms_json
    0, // setup_completed
    0, // current_guests
    0, // checkins_today
    0 // cancels_today
  )
  property = propertyQueries.getByUserId.get(user.id)
  return property
}

function normalizeDorms(inputDorms) {
  const dorms = Array.isArray(inputDorms) ? inputDorms : []
  const normalized = dorms
    .map((d, idx) => {
      const id = (typeof d?.id === 'string' && d.id.trim()) ? d.id.trim() : `D${idx + 1}`
      const name = (typeof d?.name === 'string' && d.name.trim()) ? d.name.trim() : `Dorm ${idx + 1}`
      const beds = Number(d?.beds)
      return { id, name, beds: Number.isFinite(beds) ? Math.max(0, Math.floor(beds)) : 0 }
    })
    .filter(d => d.id && d.beds >= 0)

  // Ensure unique ids (stable keys for calendar rows / bookings).
  const seen = new Set()
  const deduped = []
  for (const dorm of normalized) {
    if (seen.has(dorm.id)) continue
    seen.add(dorm.id)
    deduped.push(dorm)
  }
  return deduped
}

function getDormsFromPropertyRow(propertyRow) {
  return normalizeDorms(safeJsonParse(propertyRow?.dorms_json, []))
}

function buildRoomsFromProperty(propertyRow) {
  const privateRooms = Number(propertyRow?.private_rooms ?? propertyRow?.rooms ?? 0) || 0
  const dorms = getDormsFromPropertyRow(propertyRow)

  const rooms = []
  for (let i = 1; i <= privateRooms; i++) {
    rooms.push({
      roomNumber: `P${i}`,
      type: 'Private',
      label: `Private ${i}`
    })
  }

  for (const dorm of dorms) {
    for (let bedIndex = 1; bedIndex <= dorm.beds; bedIndex++) {
      rooms.push({
        roomNumber: `${dorm.id}-B${bedIndex}`,
        type: 'Dorm',
        label: `${dorm.name} - Bed ${bedIndex}`,
        dormId: dorm.id,
        dormName: dorm.name,
        bedIndex
      })
    }
  }

  return rooms
}

// Convert DB row to booking format
function formatBooking(row) {
  const guestData = safeJsonParse(row.guest_data_json, {})
  const guest = {
    // Keep names consistent for frontend modal
    fullName: guestData.fullName ?? row.guest_name,
    email: guestData.email ?? row.guest_email,
    phone: guestData.phone ?? '',
    gender: guestData.gender ?? guestData.sex ?? row.sex ?? ''
  }
  // Preserve any extra fields for future extension
  const extra = { ...guestData }
  delete extra.fullName
  delete extra.email
  delete extra.phone
  delete extra.gender
  delete extra.sex

  return {
    id: row.id,
    platform: row.platform,
    guestName: guest.fullName,
    guestEmail: guest.email,
    guest: { ...guest, ...extra },
    roomNumber: row.room_number,
    checkIn: row.check_in,
    checkOut: row.check_out,
    meta: { sex: row.sex, bed: row.bed },
    status: row.status,
    createdAt: row.created_at,
    color: getBookingColor(row.id)
  }
}

// Convert DB property row to object
function formatProperty(row) {
  const dorms = getDormsFromPropertyRow(row)
  const privateRooms = Number(row.private_rooms ?? row.rooms ?? 0) || 0
  const setupCompleted = Boolean(row.setup_completed)
  return {
    locationName: row.location_name,
    ownerName: row.owner_name,
    // Legacy fields (kept for backwards compatibility with existing UI components)
    rooms: row.rooms,
    dormBeds: row.dorm_beds,
    // New setup config
    privateRooms,
    dorms,
    setupCompleted,
    currentGuests: row.current_guests,
    checkinsToday: row.checkins_today,
    cancelsToday: row.cancels_today
  }
}

// ============================================
// API ENDPOINTS
// ============================================

// Get property profile
app.get('/api/profile', requireAuth, (req, res) => {
  const property = ensurePropertyRowForUser(req.user)
  if (!property) {
    return res.status(404).json({ error: 'Property not found' })
  }
  const privateRooms = Number(property.private_rooms ?? property.rooms ?? 0) || 0
  const dorms = getDormsFromPropertyRow(property)
  const totalDormBeds = dorms.reduce((sum, d) => sum + (Number(d.beds) || 0), 0)
  res.json({
    propertyName: property.location_name,
    ownerName: property.owner_name,
    totalRooms: privateRooms,
    totalCalendarRows: privateRooms + totalDormBeds,
    setupCompleted: Boolean(property.setup_completed),
    name: req.user.name,
    email: req.user.email
  })
})

// Get rooms
app.get('/api/rooms', requireAuth, (req, res) => {
  const property = ensurePropertyRowForUser(req.user)
  if (!property || !property.setup_completed) {
    return res.json([])
  }
  res.json(buildRoomsFromProperty(property))
})

// Get property data
app.get('/api/property', requireAuth, (req, res) => {
  const property = ensurePropertyRowForUser(req.user)
  if (!property) {
    return res.status(404).json({ error: 'Property not found' })
  }
  res.json(formatProperty(property))
})

// Update property data
app.post('/api/property', requireAuth, (req, res) => {
  const {
    locationName,
    ownerName,
    // New config
    privateRooms,
    dorms,
    // Legacy config (fallback)
    rooms,
    dormBeds,
    // Stats
    currentGuests,
    checkinsToday,
    cancelsToday
  } = req.body
  
  // Ensure property row exists before updating it.
  const existing = ensurePropertyRowForUser(req.user)

  // Assumption (documented): if dorms are not provided, we treat dormBeds as "beds per dorm"
  // and use a default of 2 dorms (legacy behavior).
  const nextPrivateRooms = Number.isFinite(Number(privateRooms))
    ? Math.max(0, Math.floor(Number(privateRooms)))
    : Math.max(0, Math.floor(Number(rooms) || 0))

  let nextDorms = Array.isArray(dorms) ? normalizeDorms(dorms) : null
  if (!nextDorms) {
    const bedsPerDorm = Math.max(0, Math.floor(Number(dormBeds) || 0))
    nextDorms = [
      { id: 'D1', name: 'Dorm 1', beds: bedsPerDorm },
      { id: 'D2', name: 'Dorm 2', beds: bedsPerDorm }
    ]
  }

  const setupCompleted = nextPrivateRooms > 0 || nextDorms.some(d => (Number(d.beds) || 0) > 0)

  propertyQueries.update.run(
    locationName ?? existing.location_name,
    ownerName ?? existing.owner_name,
    nextPrivateRooms, // rooms (legacy)
    // legacy dorm_beds: keep the first dorm's bed count for compatibility
    Number(nextDorms?.[0]?.beds) || 0,
    nextPrivateRooms, // private_rooms
    JSON.stringify(nextDorms),
    setupCompleted ? 1 : 0,
    Number(currentGuests) || 0,
    Number(checkinsToday) || 0,
    Number(cancelsToday) || 0,
    req.user.id
  )
  
  const property = ensurePropertyRowForUser(req.user)
  res.json(formatProperty(property))
})

// Get all bookings
app.get('/api/bookings', requireAuth, (req, res) => {
  const rows = bookingQueries.getAllByUserId.all(req.user.id)
  const bookings = rows.map(formatBooking)
  res.json(bookings)
})

// Get bookings for a room
app.get('/api/bookings/room/:roomNumber', requireAuth, (req, res) => {
  const rows = bookingQueries.getByRoomByUserId.all(req.user.id, req.params.roomNumber)
  const bookings = rows.map(formatBooking)
  res.json(bookings)
})

// Get single booking
app.get('/api/bookings/:id', requireAuth, (req, res) => {
  const row = bookingQueries.getByIdByUserId.get(req.user.id, parseInt(req.params.id))
  if (!row) {
    return res.status(404).json({ error: 'Booking not found' })
  }
  res.json(formatBooking(row))
})

// Add manual guest
app.post('/api/manual-guests', requireAuth, (req, res) => {
  const { name, sex, room, bed, checkIn, checkOut, email, phone, gender } = req.body
  
  console.log(`📝 Adding manual guest: ${name}, Room: ${room}, Dates: ${checkIn} → ${checkOut}, Bed: ${bed}`)
  
  // Validate required fields
  if (!name || !room || !checkIn || !checkOut) {
    console.log('❌ Missing required fields')
    return res.status(400).json({ error: 'Missing required fields' })
  }
  
  // If a bed is provided, treat it as a distinct calendar row (dorm bed).
  // Example accepted inputs:
  // - room="D1-B2" (already a bed row)
  // - room="D1", bed="2" (combined to "D1-B2")
  const roomKey = (bed && typeof bed === 'string' && bed.trim() && typeof room === 'string' && room.includes('-B'))
    ? room
    : (bed && `${room}-B${String(bed).trim()}`) || room

  // Check for overlapping bookings
  const overlapping = bookingQueries.getOverlapping.all(req.user.id, roomKey, checkOut, checkIn)
  
  if (overlapping.length > 0) {
    console.log(`❌ Overlap detected with existing bookings:`, overlapping)
    return res.status(409).json({ 
      error: 'Room already booked in that period',
      conflicts: overlapping.map(b => `${b.guest_name} (${b.check_in} → ${b.check_out})`)
    })
  }
  
  // Add booking to database
  const result = bookingQueries.create.run(
    req.user.id,
    'Manual',
    name,
    ((email || `${name.toLowerCase().replace(/\s+/g, '.')}@manual.local`) || '').toLowerCase(),
    JSON.stringify({
      fullName: name,
      email: ((email || '') || '').toLowerCase(),
      phone: phone || '',
      gender: gender || sex || ''
    }),
    roomKey,
    checkIn,
    checkOut,
    sex || null,
    bed || null,
    'CONFIRMED'
  )
  
  // Update current guests count
  const property = ensurePropertyRowForUser(req.user)
  propertyQueries.update.run(
    property.location_name,
    property.owner_name,
    property.rooms,
    property.dorm_beds,
    property.private_rooms ?? property.rooms ?? 0,
    property.dorms_json ?? '[]',
    property.setup_completed ? 1 : 0,
    (property.current_guests || 0) + 1,
    property.checkins_today,
    property.cancels_today,
    req.user.id
  )
  
  // Fetch the newly created booking
  const newBooking = bookingQueries.getByIdByUserId.get(req.user.id, result.lastInsertRowid)
  
  console.log(`✅ Manual guest added: ${newBooking.guest_name} in ${newBooking.room_number} (${newBooking.check_in} → ${newBooking.check_out})`)
  
  res.status(201).json({ guest: formatBooking(newBooking) })
})

// Create a 1-night booking from a specific calendar cell.
// Assumption: clicking an empty cell creates a one-night stay for that date (date -> next day).
app.post('/api/bookings/cell', requireAuth, (req, res) => {
  const { roomNumber, date, checkIn: checkInRaw, checkOut: checkOutRaw, guest } = req.body || {}
  const checkIn = normalizeISODate(checkInRaw || date)
  const checkOut = checkOutRaw ? normalizeISODate(checkOutRaw) : null
  if (!roomNumber || !checkIn) return res.status(400).json({ error: 'Missing roomNumber or checkIn' })
  if (checkOutRaw && !checkOut) return res.status(400).json({ error: 'Invalid checkOut' })

  const fullName = (guest?.fullName || '').trim()
  const email = (guest?.email || '').trim().toLowerCase()
  if (!email) return res.status(400).json({ error: 'Email is required' })

  // Default: 1-night booking (checkIn -> next day), unless checkOut is provided.
  const finalCheckIn = checkIn
  const finalCheckOut = checkOut || addDaysISO_UTC(checkIn, 1)
  if (finalCheckOut <= finalCheckIn) return res.status(400).json({ error: 'Check-out must be after check-in' })

  const overlapping = bookingQueries.getOverlapping.all(req.user.id, roomNumber, finalCheckOut, finalCheckIn)
  if (overlapping.length > 0) {
    return res.status(409).json({ error: 'Cell already has a guest booking' })
  }

  const guestData = { ...(guest || {}), fullName, email }
  const result = bookingQueries.create.run(
    req.user.id,
    'Manual',
    fullName || email.split('@')[0],
    email,
    JSON.stringify(guestData),
    roomNumber,
    finalCheckIn,
    finalCheckOut,
    guest?.gender || null,
    null,
    'CONFIRMED'
  )

  const newBooking = bookingQueries.getByIdByUserId.get(req.user.id, result.lastInsertRowid)
  res.status(201).json(formatBooking(newBooking))
})

// Update guest details for an existing booking.
app.patch('/api/bookings/:id/guest', requireAuth, (req, res) => {
  const bookingId = parseInt(req.params.id)
  if (!Number.isFinite(bookingId)) return res.status(400).json({ error: 'Invalid booking id' })

  const row = bookingQueries.getByIdByUserId.get(req.user.id, bookingId)
  if (!row) return res.status(404).json({ error: 'Booking not found' })

  const nextGuest = req.body?.guest || {}
  const stay = req.body?.stay || {}
  const fullName = String(nextGuest.fullName || '').trim()
  const email = String(nextGuest.email || '').trim().toLowerCase()
  if (!email) return res.status(400).json({ error: 'Email is required' })

  const nextCheckIn = normalizeISODate(stay.checkIn || row.check_in)
  const nextCheckOut = normalizeISODate(stay.checkOut || row.check_out)
  if (!nextCheckIn || !nextCheckOut) return res.status(400).json({ error: 'Missing check-in/check-out' })
  if (nextCheckOut <= nextCheckIn) return res.status(400).json({ error: 'Check-out must be after check-in' })

  const overlapping = bookingQueries.getOverlappingExcludingId.all(
    req.user.id,
    row.room_number,
    bookingId,
    nextCheckOut,
    nextCheckIn
  )
  if (overlapping.length > 0) {
    return res.status(409).json({ error: 'Booking overlaps with an existing booking' })
  }

  const guestData = { ...safeJsonParse(row.guest_data_json, {}), ...nextGuest, fullName, email }
  bookingQueries.updateDatesAndGuestByUserId.run(
    nextCheckIn,
    nextCheckOut,
    fullName || row.guest_name,
    email,
    JSON.stringify(guestData),
    req.user.id,
    bookingId
  )

  const updated = bookingQueries.getByIdByUserId.get(req.user.id, bookingId)
  res.json(formatBooking(updated))
})

// Delete booking
app.delete('/api/bookings/:id', requireAuth, (req, res) => {
  const bookingId = parseInt(req.params.id)
  const booking = bookingQueries.getByIdByUserId.get(req.user.id, bookingId)
  
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' })
  }
  
  bookingQueries.deleteByUserId.run(req.user.id, bookingId)
  console.log(`❌ Booking deleted: ${booking.guest_name}`)
  
  res.json({ message: 'Booking deleted', booking: formatBooking(booking) })
})

// ============================================
// AUTH ENDPOINTS
// ============================================

app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body
  
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Missing fields' })
  }
  
  const existing = userQueries.findByEmail.get(email.toLowerCase())
  if (existing) {
    return res.status(409).json({ error: 'User already exists' })
  }
  
  const salt = crypto.randomBytes(8).toString('hex')
  const passwordHash = hashPassword(password, salt)
  
  const result = userQueries.create.run(name, email.toLowerCase(), salt, passwordHash)
  const user = userQueries.getById.get(result.lastInsertRowid)
  // Ensure new accounts have a property row (scoped by user_id).
  const property = ensurePropertyRowForUser({ id: user.id, name: user.name, email: user.email })
  
  res.status(201).json({ 
    token: generateToken(user.email), 
    user: { id: user.id, name: user.name, email: user.email },
    setupCompleted: Boolean(property?.setup_completed)
  })
})

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body
  const user = userQueries.findByEmail.get((email || '').toLowerCase())
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }
  
  const passwordHash = hashPassword(password, user.salt)
  if (passwordHash !== user.password_hash) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const property = ensurePropertyRowForUser({ id: user.id, name: user.name, email: user.email })
  
  res.json({ 
    token: generateToken(user.email), 
    user: { id: user.id, name: user.name, email: user.email },
    setupCompleted: Boolean(property?.setup_completed)
  })
})

app.post('/api/auth/forgot', (req, res) => {
  const { email } = req.body
  const user = userQueries.findByEmail.get((email || '').toLowerCase())
  
  if (!user) {
    return res.json({ message: 'If the email exists, a reset link was sent (simulated).' })
  }
  
  res.json({ message: `Reset link sent to ${email} (simulated).` })
})

app.get('/api/auth/me', (req, res) => {
  const token = getTokenFromRequest(req)
  if (!token) return res.status(401).json({ error: 'Unauthenticated' })

  const user = getUserFromToken(token)
  if (!user) return res.status(401).json({ error: 'Unauthenticated' })

  const property = propertyQueries.getByUserId.get(user.id)
  res.json({ id: user.id, name: user.name, email: user.email, setupCompleted: Boolean(property?.setup_completed) })
})

// ============================================
// START SERVER
// ============================================

app.listen(PORT, '0.0.0.0', () => {
  const bookingCount = db.prepare('SELECT COUNT(*) as count FROM bookings').get().count
  console.log(`🚀 Backend server running on port ${PORT}`)
  console.log(`📊 Database loaded with ${bookingCount} bookings`)
  console.log(`🏠 Rooms: ${ROOMS.join(', ')} (Private rooms - no overlapping allowed)`)
})

// Graceful shutdown
process.on('SIGINT', () => {
  db.close()
  console.log('\n👋 Database closed')
  process.exit(0)
})
