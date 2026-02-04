import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/Pages.css'
import { apiFetch } from '../utils/api'

const API_URL = '/api'

function PropertySetup() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    locationName: '',
    ownerName: '',
    // Setup config
    privateRooms: '',
    dormCount: '2',
    bedsPerDorm: '',
    // Legacy fields (kept as stats)
    currentGuests: '',
    checkinsToday: '',
    cancelsToday: ''
  })
  const [roomOptions, setRoomOptions] = useState([])
  const [guestForm, setGuestForm] = useState({
    name: '',
    sex: '',
    room: '',
    bed: '',
    checkIn: '',
    checkOut: ''
  })
  const [message, setMessage] = useState(null)
  const [guestMessage, setGuestMessage] = useState(null)
  const [error, setError] = useState(null)

  // Assumption: dorms are configured as N dorms with a uniform "beds per dorm" count.
  // We store a clear dorm model and generate calendar rows as: P1..Pn and Dk-Bm (dorm bed rows).
  const dormsPayload = useMemo(() => {
    const dormCount = Math.max(0, Math.floor(Number(form.dormCount) || 0))
    const bedsPerDorm = Math.max(0, Math.floor(Number(form.bedsPerDorm) || 0))
    return Array.from({ length: dormCount }, (_, idx) => ({
      id: `D${idx + 1}`,
      name: `Dorm ${idx + 1}`,
      beds: bedsPerDorm
    }))
  }, [form.dormCount, form.bedsPerDorm])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch(`${API_URL}/property`)
        if (res.status === 401) {
          localStorage.removeItem('authToken')
          localStorage.removeItem('authUser')
          window.dispatchEvent(new Event('auth-changed'))
          return
        }
        const data = await res.json()
        const dorms = Array.isArray(data.dorms) ? data.dorms : null
        const dormCount = dorms ? dorms.length : 2
        const bedsPerDorm = dorms && dorms.length > 0 ? dorms[0].beds : data.dormBeds
        setForm({
          locationName: data.locationName || '',
          ownerName: data.ownerName || '',
          privateRooms: data.privateRooms ?? data.rooms ?? '',
          dormCount: String(dormCount),
          bedsPerDorm: bedsPerDorm ?? '',
          currentGuests: data.currentGuests || '',
          checkinsToday: data.checkinsToday || '',
          cancelsToday: data.cancelsToday || ''
        })
      } catch (err) {
        console.error(err)
      }
    }
    load()
  }, [])

  useEffect(() => {
    const loadRooms = async () => {
      try {
        const res = await apiFetch(`${API_URL}/rooms`)
        if (!res.ok) return
        const data = await res.json()
        if (Array.isArray(data)) setRoomOptions(data)
      } catch {
        // ignore
      }
    }
    loadRooms()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleGuestChange = (e) => {
    const { name, value } = e.target
    setGuestForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setMessage(null)
    setError(null)
    try {
      const res = await apiFetch(`${API_URL}/property`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationName: form.locationName,
          ownerName: form.ownerName,
          privateRooms: form.privateRooms,
          dorms: dormsPayload,
          currentGuests: form.currentGuests,
          checkinsToday: form.checkinsToday,
          cancelsToday: form.cancelsToday
        })
      })
      if (res.status === 401) {
        localStorage.removeItem('authToken')
        localStorage.removeItem('authUser')
        window.dispatchEvent(new Event('auth-changed'))
        return
      }
      if (!res.ok) throw new Error('Failed to save')
      const data = await res.json()
      setMessage('Property saved')
      // Update local auth user so the router can unlock calendar routes immediately.
      const rawUser = localStorage.getItem('authUser')
      if (rawUser) {
        try {
          const user = JSON.parse(rawUser)
          localStorage.setItem('authUser', JSON.stringify({ ...user, setupCompleted: Boolean(data.setupCompleted) }))
          window.dispatchEvent(new Event('auth-changed'))
        } catch {
          // ignore
        }
      }
      setForm({
        locationName: data.locationName || '',
        ownerName: data.ownerName || '',
        privateRooms: data.privateRooms ?? data.rooms ?? '',
        dormCount: String(Array.isArray(data.dorms) ? data.dorms.length : Number(form.dormCount) || 0),
        bedsPerDorm: Array.isArray(data.dorms) && data.dorms.length > 0 ? data.dorms[0].beds : form.bedsPerDorm,
        currentGuests: data.currentGuests || '',
        checkinsToday: data.checkinsToday || '',
        cancelsToday: data.cancelsToday || ''
      })
      if (data.setupCompleted) {
        // Calendar is hidden until setup is completed.
        navigate('/bookings')
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const handleGuestAdd = async (e) => {
    e.preventDefault()
    setGuestMessage(null)
    setError(null)
    try {
      const res = await apiFetch(`${API_URL}/manual-guests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(guestForm)
      })
      const data = await res.json()
      if (res.status === 401) {
        localStorage.removeItem('authToken')
        localStorage.removeItem('authUser')
        window.dispatchEvent(new Event('auth-changed'))
        return
      }
      if (!res.ok) throw new Error(data.error || 'Failed to add guest')
      setGuestMessage(`Guest ${data.guest.guestName} added`)
      setGuestForm({
        name: '',
        sex: '',
        room: '',
        bed: '',
        checkIn: '',
        checkOut: ''
      })
      window.dispatchEvent(new Event('booking-changed'))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <header className="profile-header">
          <h1>Property Setup</h1>
          <p className="profile-subtitle">Configure your property details</p>
        </header>

        <div className="profile-grid">
          <div className="profile-card info-card">
            <h3>Property Info</h3>
            <form className="auth-form" onSubmit={handleSave}>
              <label>
                Location Name
                <input name="locationName" value={form.locationName} onChange={handleChange} required />
              </label>
              <label>
                Owner Name
                <input name="ownerName" value={form.ownerName} onChange={handleChange} required />
              </label>
              <label>
                Private Rooms
                <input name="privateRooms" type="number" min="0" value={form.privateRooms} onChange={handleChange} required />
              </label>
              <label>
                Dorms
                <input name="dormCount" type="number" min="0" value={form.dormCount} onChange={handleChange} required />
              </label>
              <label>
                Beds per Dorm
                <input name="bedsPerDorm" type="number" min="0" value={form.bedsPerDorm} onChange={handleChange} required />
              </label>
              <label>
                Current Guests
                <input name="currentGuests" type="number" min="0" value={form.currentGuests} onChange={handleChange} />
              </label>
              <label>
                Check-ins Today (placeholder)
                <input name="checkinsToday" type="number" min="0" value={form.checkinsToday} onChange={handleChange} />
              </label>
              <label>
                Cancels Today (placeholder)
                <input name="cancelsToday" type="number" min="0" value={form.cancelsToday} onChange={handleChange} />
              </label>
              {error && <div className="auth-error">{error}</div>}
              {message && <div className="auth-success">{message}</div>}
              <button className="auth-btn" type="submit">Save Property</button>
            </form>
          </div>

          <div className="profile-card info-card">
            <h3>Add Guest (manual)</h3>
            <form className="auth-form" onSubmit={handleGuestAdd}>
              <label>
                Name
                <input name="name" value={guestForm.name} onChange={handleGuestChange} required />
              </label>
              <label>
                Sex
                <input name="sex" value={guestForm.sex} onChange={handleGuestChange} placeholder="M / F / Other" />
              </label>
              <label>
                Room
                <input
                  name="room"
                  value={guestForm.room}
                  onChange={handleGuestChange}
                  placeholder="P1, P2, D1-B1, D2-B3"
                  list="room-options"
                  required
                />
                <datalist id="room-options">
                  {roomOptions.map(r => (
                    <option key={r.roomNumber} value={r.roomNumber}>
                      {r.label}
                    </option>
                  ))}
                </datalist>
              </label>
              <label>
                Bed
                <input name="bed" value={guestForm.bed} onChange={handleGuestChange} placeholder="Bed number/ label" />
              </label>
              <label>
                Check-in
                <input name="checkIn" type="date" value={guestForm.checkIn} onChange={handleGuestChange} required />
              </label>
              <label>
                Check-out
                <input name="checkOut" type="date" value={guestForm.checkOut} onChange={handleGuestChange} required />
              </label>
              {guestMessage && <div className="auth-success">{guestMessage}</div>}
              <button className="auth-btn" type="submit">Add Guest</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PropertySetup
