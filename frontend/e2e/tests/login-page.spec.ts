import { test, expect } from '@playwright/test'

test('login with valid credentials', async ({ page }) => {
  // Avoid depending on a real backend in E2E.
  await page.route('**/api/auth/login', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback()
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        token: 'e2e-token',
        setupCompleted: true,
        user: { name: 'E2E User', email: 'ana@gmail.com', setupCompleted: true }
      })
    })
  })
  await page.route('**/api/auth/me', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ name: 'E2E User', email: 'ana@gmail.com', setupCompleted: true })
    })
  })
  await page.route('**/api/profile', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ propertyName: 'E2E Property', name: 'E2E User', email: 'ana@gmail.com' })
    })
  })
  await page.route('**/api/bookings', async (route) => {
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
  })
  await page.route('**/api/rooms', async (route) => {
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
  })

  await page.goto('/login')
  await page.getByLabel('Email').fill('ana@gmail.com')
  await page.getByLabel('Password').fill('#Test123!')
  await page.getByRole('button', { name: 'Login' }).click()
  await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()
})