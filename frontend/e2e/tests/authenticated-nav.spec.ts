import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  // Seed auth state so routes unlock.
  await page.addInitScript(() => {
    localStorage.setItem('authToken', 'e2e-token')
    localStorage.setItem(
      'authUser',
      JSON.stringify({ name: 'E2E User', email: 'e2e@example.com', setupCompleted: true })
    )
  })

  // Minimal API mocks so pages can render without backend.
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

test('authenticated nav shows Calendar + Dashboard and logout returns to login', async ({ page }) => {
  await page.goto('/bookings')

  await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Calendar' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Property Setup' })).toBeVisible()

  await page.getByRole('button', { name: /Logout/ }).click()
  await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible()
})

