import { test, expect } from '@playwright/test'

// "Public route contract" tests:
// verify route guards and baseline screen composition without login state.
test('unauthenticated users are redirected to login and see auth navigation', async ({ page }) => {
  await page.goto('/bookings')
  await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Login' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Register' })).toBeVisible()
})

test('register and forgot password pages render core form fields', async ({ page }) => {
  await page.goto('/register')
  await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible()
  await expect(page.getByLabel('Name')).toBeVisible()
  await expect(page.getByLabel('Email')).toBeVisible()
  await expect(page.getByLabel('Password')).toBeVisible()

  await page.goto('/forgot-password')
  await expect(page.getByRole('heading', { name: 'Forgot Password' })).toBeVisible()
  await expect(page.getByLabel('Email')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Send reset link' })).toBeVisible()
})

