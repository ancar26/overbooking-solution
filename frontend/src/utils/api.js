export function getAuthToken() {
  return localStorage.getItem('authToken')
}

export function getAuthUser() {
  const raw = localStorage.getItem('authUser')
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function apiFetch(url, options = {}) {
  const token = getAuthToken()
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }

  return fetch(url, { ...options, headers })
}

