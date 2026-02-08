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
  const baseUrl = (import.meta?.env?.VITE_API_URL || '').replace(/\/+$/, '')
  const token = getAuthToken()
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }

  const finalUrl =
    typeof url === 'string' && url.startsWith('/') && baseUrl
      ? `${baseUrl}${url}`
      : url

  return fetch(finalUrl, { ...options, headers })
}

