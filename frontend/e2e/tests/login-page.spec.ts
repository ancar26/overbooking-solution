import { test, expect } from '@playwright/test'

test('login with valid credentials', async ({ page }) => {
  await page.goto('http://localhost:5173/login')
  await page.getByLabel('Email').fill('ana@gmail.com')
  await page.getByLabel('Password').fill('#Test123!')
  await page.getByRole('button', { name: 'Login' }).click()
  await expect(page.getByText('Dashboard')).toBeVisible()
})