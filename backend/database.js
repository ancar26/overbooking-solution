// SQLite Database Setup
import Database from 'better-sqlite3'
import crypto from 'crypto'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Create/open database file
const db = new Database(path.join(__dirname, 'booking-calendar.db'))

// Enable foreign keys
db.pragma('foreign_keys = ON')

// ============================================
// CREATE TABLES
// ============================================

// Users table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    salt TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  )
`)

// Property data table
db.exec(`
  CREATE TABLE IF NOT EXISTS property_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    location_name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    rooms INTEGER NOT NULL,
    dorm_beds INTEGER NOT NULL,
    current_guests INTEGER DEFAULT 0,
    checkins_today INTEGER DEFAULT 0,
    cancels_today INTEGER DEFAULT 0,
    updated_at TEXT DEFAULT (datetime('now'))
  )
`)

// Bookings table
db.exec(`
  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    guest_name TEXT NOT NULL,
    guest_email TEXT NOT NULL,
    room_number TEXT NOT NULL,
    check_in TEXT NOT NULL,
    check_out TEXT NOT NULL,
    sex TEXT,
    bed TEXT,
    status TEXT DEFAULT 'CONFIRMED',
    created_at TEXT DEFAULT (datetime('now'))
  )
`)

// ============================================
// MIGRATIONS (keep existing architecture simple)
// ============================================

function tableHasColumn(tableName, columnName) {
  const rows = db.prepare(`PRAGMA table_info(${tableName})`).all()
  return rows.some(r => r.name === columnName)
}

function getFirstUser() {
  return db.prepare('SELECT id, name, email FROM users ORDER BY id ASC LIMIT 1').get()
}

function addColumnIfMissing(tableName, columnName, columnDDL) {
  // columnDDL example: "INTEGER DEFAULT 0"
  if (tableHasColumn(tableName, columnName)) return
  db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDDL}`)
}

// Migrate property_data from single-row table (id=1) to per-user rows.
if (!tableHasColumn('property_data', 'user_id')) {
  const defaultUser = getFirstUser()
  db.exec('BEGIN')
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS property_data_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        location_name TEXT NOT NULL,
        owner_name TEXT NOT NULL,
        rooms INTEGER NOT NULL,
        dorm_beds INTEGER NOT NULL,
        current_guests INTEGER DEFAULT 0,
        checkins_today INTEGER DEFAULT 0,
        cancels_today INTEGER DEFAULT 0,
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `)

    const existingRows = db.prepare('SELECT * FROM property_data').all()
    if (defaultUser && existingRows.length > 0) {
      const row = existingRows[0]
      db.prepare(`
        INSERT OR IGNORE INTO property_data_new
          (user_id, location_name, owner_name, rooms, dorm_beds, current_guests, checkins_today, cancels_today, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        defaultUser.id,
        row.location_name,
        row.owner_name,
        row.rooms,
        row.dorm_beds,
        row.current_guests || 0,
        row.checkins_today || 0,
        row.cancels_today || 0,
        row.updated_at || null
      )
    }

    db.exec('DROP TABLE property_data')
    db.exec('ALTER TABLE property_data_new RENAME TO property_data')
    db.exec('COMMIT')
    console.log('✅ Migrated property_data to per-user rows')
  } catch (err) {
    db.exec('ROLLBACK')
    console.warn('⚠️ Failed to migrate property_data:', err)
  }
}

// Property setup columns (per-user scoped)
try {
  addColumnIfMissing('property_data', 'private_rooms', 'INTEGER DEFAULT 0')
  addColumnIfMissing('property_data', 'dorms_json', "TEXT DEFAULT '[]'")
  addColumnIfMissing('property_data', 'setup_completed', 'INTEGER DEFAULT 0')

  // Best-effort backfill for existing rows (keep setup_completed false so user must confirm).
  if (tableHasColumn('property_data', 'rooms') && tableHasColumn('property_data', 'private_rooms')) {
    db.prepare(`
      UPDATE property_data
      SET private_rooms = rooms
      WHERE private_rooms IS NULL
    `).run()
  }
  if (tableHasColumn('property_data', 'dorm_beds') && tableHasColumn('property_data', 'dorms_json')) {
    // If dorms_json is empty, assume 2 dorms as legacy default.
    db.prepare(`
      UPDATE property_data
      SET dorms_json = ?
      WHERE (dorms_json IS NULL OR dorms_json = '' OR dorms_json = '[]')
    `).run(JSON.stringify([
      { id: 'D1', name: 'Dorm 1', beds: 0 },
      { id: 'D2', name: 'Dorm 2', beds: 0 }
    ]))
  }
} catch (err) {
  console.warn('⚠️ Failed to migrate property setup columns:', err)
}

// Add user_id to bookings and backfill existing rows to the default user.
if (!tableHasColumn('bookings', 'user_id')) {
  const defaultUser = getFirstUser()
  db.exec('BEGIN')
  try {
    db.exec(`ALTER TABLE bookings ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE`)
    if (defaultUser) {
      db.prepare('UPDATE bookings SET user_id = ? WHERE user_id IS NULL').run(defaultUser.id)
    }
    db.exec('COMMIT')
    console.log('✅ Migrated bookings to include user_id')
  } catch (err) {
    db.exec('ROLLBACK')
    console.warn('⚠️ Failed to migrate bookings:', err)
  }
} else {
  // Best-effort backfill if column exists but old rows are missing user_id.
  const defaultUser = getFirstUser()
  if (defaultUser) {
    try {
      db.prepare('UPDATE bookings SET user_id = ? WHERE user_id IS NULL').run(defaultUser.id)
    } catch {}
  }
}

try {
  if (tableHasColumn('property_data', 'user_id')) {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_property_data_user_id ON property_data(user_id)`)
  }
} catch {}

try {
  if (tableHasColumn('bookings', 'user_id')) {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id)`)
    db.exec(`CREATE INDEX IF NOT EXISTS idx_bookings_user_room ON bookings(user_id, room_number)`)
  }
} catch {}

// ============================================
// SEED DEFAULT DATA
// ============================================

// Seed default admin user if none exists
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get()
if (userCount.count === 0) {
  const salt = 'demo-salt'
  const passwordHash = crypto.createHash('sha256').update('Demo123' + salt).digest('hex')
  db.prepare(`
    INSERT INTO users (name, email, salt, password_hash)
    VALUES (?, ?, ?, ?)
  `).run('Property Owner', 'owner@example.com', salt, passwordHash)
  console.log('✅ Seeded default user: owner@example.com / Demo123')
}

// Seed default property data for the first user if none exists
const firstUser = getFirstUser()
if (firstUser) {
  const propertyCount = db
    .prepare('SELECT COUNT(*) as count FROM property_data WHERE user_id = ?')
    .get(firstUser.id)
  if (propertyCount.count === 0) {
    db.prepare(`
      INSERT INTO property_data (
        user_id, location_name, owner_name,
        rooms, dorm_beds,
        private_rooms, dorms_json, setup_completed
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      firstUser.id,
      'Vibe House',
      firstUser.name,
      0,
      0,
      0,
      JSON.stringify([
        { id: 'D1', name: 'Dorm 1', beds: 0 },
        { id: 'D2', name: 'Dorm 2', beds: 0 }
      ]),
      0
    )
    console.log('✅ Seeded default property data')
  }
}

// ============================================
// EXPORT DB AND PREPARED STATEMENTS
// ============================================

export default db

// User queries
export const userQueries = {
  findByEmail: db.prepare('SELECT * FROM users WHERE email = ?'),
  create: db.prepare('INSERT INTO users (name, email, salt, password_hash) VALUES (?, ?, ?, ?)'),
  getById: db.prepare('SELECT * FROM users WHERE id = ?')
}

// Property queries
export const propertyQueries = {
  getByUserId: db.prepare('SELECT * FROM property_data WHERE user_id = ?'),
  create: db.prepare(`
    INSERT INTO property_data (
      user_id, location_name, owner_name,
      rooms, dorm_beds,
      private_rooms, dorms_json, setup_completed,
      current_guests, checkins_today, cancels_today
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  update: db.prepare(`
    UPDATE property_data 
    SET location_name = ?, owner_name = ?, rooms = ?, dorm_beds = ?,
        private_rooms = ?, dorms_json = ?, setup_completed = ?,
        current_guests = ?, checkins_today = ?, cancels_today = ?, 
        updated_at = datetime('now')
    WHERE user_id = ?
  `)
}

// Booking queries
export const bookingQueries = {
  getAllByUserId: db.prepare('SELECT * FROM bookings WHERE user_id = ? ORDER BY check_in ASC'),
  getByRoomByUserId: db.prepare('SELECT * FROM bookings WHERE user_id = ? AND room_number = ? ORDER BY check_in ASC'),
  getByIdByUserId: db.prepare('SELECT * FROM bookings WHERE user_id = ? AND id = ?'),
  create: db.prepare(`
    INSERT INTO bookings (user_id, platform, guest_name, guest_email, room_number, check_in, check_out, sex, bed, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  deleteByUserId: db.prepare('DELETE FROM bookings WHERE user_id = ? AND id = ?'),
  getOverlapping: db.prepare(`
    SELECT * FROM bookings 
    WHERE user_id = ?
    AND room_number = ? 
    AND date(check_in) < date(?) 
    AND date(check_out) > date(?)
  `)
}
