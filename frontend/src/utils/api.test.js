import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { apiFetch, getAuthToken, getAuthUser } from './api'

describe('utils/api', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(null, { status: 200 }))))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('getAuthToken returns token from localStorage', () => {
    localStorage.setItem('authToken', 't-123')
    expect(getAuthToken()).toBe('t-123')
  })

  it('getAuthUser returns parsed user or null if invalid JSON', () => {
    localStorage.setItem('authUser', JSON.stringify({ name: 'Ana' }))
    expect(getAuthUser()).toEqual({ name: 'Ana' })

    localStorage.setItem('authUser', '{not-json')
    expect(getAuthUser()).toBeNull()
  })

  it('apiFetch adds Authorization header when token exists', async () => {
    localStorage.setItem('authToken', 'token-abc')
    await apiFetch('/api/profile')

    expect(fetch).toHaveBeenCalledTimes(1)
    const [, init] = fetch.mock.calls[0]
    expect(init.headers.Authorization).toBe('Bearer token-abc')
  })

  it('apiFetch preserves existing headers and does not add Authorization when no token', async () => {
    await apiFetch('/api/profile', { headers: { 'X-Test': '1' } })

    const [, init] = fetch.mock.calls[0]
    expect(init.headers['X-Test']).toBe('1')
    expect(init.headers.Authorization).toBeUndefined()
  })
})

