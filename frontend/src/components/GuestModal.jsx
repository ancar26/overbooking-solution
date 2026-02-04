import { useMemo, useState } from 'react'
import '../styles/Pages.css'

// Field definitions are data-driven so guest data can be extended later
// without changing rendering logic.
const DEFAULT_STAY_FIELDS = [
  { id: 'checkIn', label: 'Check-in', type: 'date', required: true },
  { id: 'checkOut', label: 'Check-out', type: 'date', required: true }
]

const DEFAULT_GUEST_FIELDS = [
  { id: 'fullName', label: 'Full name', type: 'text', required: false },
  { id: 'email', label: 'Email', type: 'email', required: true },
  { id: 'phone', label: 'Phone number', type: 'tel', required: false },
  { id: 'gender', label: 'Gender', type: 'text', required: false }
]

function normalizeGuestValue(value) {
  if (value === null || value === undefined) return ''
  return String(value)
}

export default function GuestModal({
  open,
  title = 'Guest',
  guestFields = DEFAULT_GUEST_FIELDS,
  stayFields = DEFAULT_STAY_FIELDS,
  initialValue,
  popupClassName,
  onClose,
  onSave,
  saving,
  onDelete,
  deleting
}) {
  const initial = useMemo(() => {
    // Backwards compatibility: if old callers pass `initialGuest`, treat it as guest object.
    const v = initialValue || {}
    const guest = v.guest || v
    const stay = v.stay || {}
    return { guest, stay }
  }, [initialValue])
  const [value, setValue] = useState(() => initial)

  if (!open) return null

  const handleChange = (scope, id, next) => {
    setValue(prev => ({
      ...prev,
      [scope]: { ...(prev[scope] || {}), [id]: next }
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (typeof onSave === 'function') await onSave(value)
  }

  return (
    <div className="booking-popup-overlay" onClick={onClose}>
      <div className={`booking-popup ${popupClassName || ''}`.trim()} onClick={e => e.stopPropagation()}>
        <button className="popup-close" onClick={onClose}>×</button>
        <div className="popup-header">
          <h3>{title}</h3>
        </div>
        <div className="popup-content">
          <form className="auth-form" onSubmit={handleSubmit}>
            {stayFields.map((f) => (
              <label key={`stay-${f.id}`}>
                {f.label}
                <input
                  type={f.type || 'text'}
                  value={normalizeGuestValue(value.stay?.[f.id])}
                  required={Boolean(f.required)}
                  onChange={(e) => handleChange('stay', f.id, e.target.value)}
                />
              </label>
            ))}
            {guestFields.map((f) => (
              <label key={`guest-${f.id}`}>
                {f.label}
                <input
                  type={f.type || 'text'}
                  value={normalizeGuestValue(value.guest?.[f.id])}
                  required={Boolean(f.required)}
                  onChange={(e) => handleChange('guest', f.id, e.target.value)}
                />
              </label>
            ))}
            <button type="submit" className="auth-btn" disabled={Boolean(saving)}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            {typeof onDelete === 'function' && (
              <div className="booking-actions">
                <button
                  type="button"
                  className={`btn btn-reject ${deleting ? 'btn-disabled' : ''}`}
                  onClick={onDelete}
                  disabled={Boolean(deleting) || Boolean(saving)}
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

