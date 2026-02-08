import { useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/Pages.css'
import { apiFetch } from '../utils/api'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)
    try {
      const res = await apiFetch(`/api/auth/forgot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')
      setMessage(data.message)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Forgot Password</h2>
        <p className="auth-subtitle">We’ll send you a reset link (simulated)</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </label>
          {error && <div className="auth-error">{error}</div>}
          {message && <div className="auth-success">{message}</div>}
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
        <div className="auth-links">
          <Link to="/login">Back to login</Link>
          <Link to="/register">Create account</Link>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
