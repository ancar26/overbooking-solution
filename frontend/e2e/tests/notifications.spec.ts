import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  // Auth + setup completed to access /bookings.
  await page.addInitScript(() => {
    localStorage.setItem('authToken', 'e2e-token')
    localStorage.setItem(
      'authUser',
      JSON.stringify({ name: 'E2E User', email: 'e2e@example.com', setupCompleted: true })
    )
  })

  // Mock backend calls required for BookingsStatus.
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ name: 'E2E User', email: 'e2e@example.com', setupCompleted: true })
    })
  )
  await page.route('**/api/profile', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ propertyName: 'E2E Property', name: 'E2E User', email: 'e2e@example.com' })
    })
  )
  await page.route('**/api/bookings', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
  )
  await page.route('**/api/rooms', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
  )
})

test('notification bell opens, shows activity, and can clear all', async ({ page }) => {
  // Ensure we start from a clean notification storage so the seed happens.
  await page.addInitScript(() => {
    localStorage.removeItem('booking-calendar-notifications')
  })

  await page.goto('/bookings')

  const bellButton = page.locator('.notification-bell .bell-button')
  await expect(bellButton).toBeVisible()

  // Seeded notifications should show a badge.
  await expect(page.locator('.notification-bell .bell-badge')).toBeVisible()

  await bellButton.click()
  await expect(page.getByText('Recent Activity')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Clear all' })).toBeVisible()

  await page.getByRole('button', { name: 'Clear all' }).click()
  await expect(page.getByText('No recent activity')).toBeVisible()
})

test('opening the notifications dropdown marks all as read (badge disappears)', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem('booking-calendar-notifications')
  })

  await page.goto('/bookings')

  const bellButton = page.locator('.notification-bell .bell-button')
  const badge = page.locator('.notification-bell .bell-badge')

  await expect(bellButton).toBeVisible()
  await expect(badge).toBeVisible()

  await bellButton.click()
  await expect(page.getByText('Recent Activity')).toBeVisible()

  // NotificationBell calls onMarkAllRead after 500ms when opening.
  await expect(badge).toHaveCount(0, { timeout: 3000 })
})

