import { test, expect } from '@playwright/test'

function disableLongDemoTimeouts(page) {
  // Production code triggers long demo timers; shorten test runtime by neutralizing them.
  // Prefer this over hard waits in tests.
  return page.addInitScript(() => {
    const original = window.setTimeout
    window.setTimeout = ((fn, timeout, ...args) => {
      if (typeof timeout === 'number' && timeout >= 9000) return 0
      return original(fn, timeout, ...args)
    }) as typeof window.setTimeout
  })
}

async function mockCommonAuthedApi(page, { setupCompleted }) {
  // Shared fixture-style helper:
  // centralize common mocks so tests stay focused on scenario differences.
  const user = { name: 'E2E User', email: 'e2e@example.com', setupCompleted }
  const profile = { propertyName: 'E2E Property', name: 'E2E User', email: 'e2e@example.com' }

  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(user) })
  )
  await page.route('**/api/profile', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(profile) })
  )
  await page.route('**/api/bookings', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
  )
  await page.route('**/api/rooms', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
  )
}

test('if setup is incomplete, /bookings redirects to Property Setup and Calendar link is hidden', async ({ page }) => {
  await disableLongDemoTimeouts(page)
  await page.addInitScript(() => {
    localStorage.setItem('authToken', 'e2e-token')
    localStorage.setItem(
      'authUser',
      JSON.stringify({ name: 'E2E User', email: 'e2e@example.com', setupCompleted: false })
    )
  })

  await mockCommonAuthedApi(page, { setupCompleted: false })
  await page.route('**/api/property', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        locationName: 'E2E Hostel',
        ownerName: 'E2E Owner',
        privateRooms: 2,
        dorms: [
          { id: 'D1', name: 'Dorm 1', beds: 4 },
          { id: 'D2', name: 'Dorm 2', beds: 4 }
        ]
      })
    })
  )

  await page.goto('/bookings')

  await expect(page.getByRole('heading', { name: 'Property Setup' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Property Setup' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Calendar' })).toHaveCount(0)
})

test('saving property with setupCompleted=true navigates to /bookings and unlocks Calendar link', async ({ page }) => {
  await disableLongDemoTimeouts(page)
  await page.addInitScript(() => {
    localStorage.setItem('authToken', 'e2e-token')
    localStorage.setItem(
      'authUser',
      JSON.stringify({ name: 'E2E User', email: 'e2e@example.com', setupCompleted: false })
    )
  })

  await mockCommonAuthedApi(page, { setupCompleted: false })

  // Route handler acts like a tiny in-memory backend:
  // GET returns initial state, POST returns persisted state transition.
  await page.route('**/api/property', async (route) => {
    const method = route.request().method()
    if (method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          locationName: 'E2E Hostel',
          ownerName: 'E2E Owner',
          privateRooms: 2,
          dorms: [
            { id: 'D1', name: 'Dorm 1', beds: 4 },
            { id: 'D2', name: 'Dorm 2', beds: 4 }
          ],
          setupCompleted: false
        })
      })
    }
    if (method === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          locationName: 'E2E Hostel',
          ownerName: 'E2E Owner',
          privateRooms: 2,
          dorms: [
            { id: 'D1', name: 'Dorm 1', beds: 4 },
            { id: 'D2', name: 'Dorm 2', beds: 4 }
          ],
          setupCompleted: true
        })
      })
    }
    return route.fallback()
  })

  await page.goto('/property')
  await expect(page.getByRole('heading', { name: 'Property Setup' })).toBeVisible()

  await page.getByRole('button', { name: 'Save Property' }).click()

  // After saving, app should navigate to bookings and show calendar page header.
  await expect(page).toHaveURL(/\/bookings/)
  await expect(page.getByRole('heading', { name: 'E2E Property' })).toBeVisible()

  // Router should unlock Calendar/Dashboard links after setupCompleted is persisted.
  await expect(page.getByRole('link', { name: 'Calendar' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()
})

