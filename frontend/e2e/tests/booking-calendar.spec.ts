import { test, expect } from '@playwright/test'

function disableLongDemoTimeouts(page) {
  return page.addInitScript(() => {
    const original = window.setTimeout
    // Prevent the 10s demo booking timer from firing during E2E.
    window.setTimeout = ((fn, timeout, ...args) => {
      if (typeof timeout === 'number' && timeout >= 9000) return 0
      return original(fn, timeout, ...args)
    }) as typeof window.setTimeout
  })
}

async function seedAuthedSession(page) {
  // Session seeding models login as a precondition, so each test starts
  // directly at calendar behavior instead of auth behavior.
  await page.addInitScript(() => {
    localStorage.setItem('authToken', 'e2e-token')
    localStorage.setItem(
      'authUser',
      JSON.stringify({ name: 'E2E User', email: 'e2e@example.com', setupCompleted: true })
    )
  })
}

async function mockApi(page) {
  // Deterministic data fixture for the calendar surface:
  // room list + one booking make UI assertions stable and readable.
  const user = { name: 'E2E User', email: 'e2e@example.com', setupCompleted: true }
  const profile = { propertyName: 'E2E Property', name: 'E2E User', email: 'e2e@example.com' }
  const rooms = [
    { roomNumber: 'A1', label: 'Private' },
    { roomNumber: 'A2', label: 'Private' }
  ]
  const bookings = [
    {
      id: 'b1',
      roomNumber: 'A1',
      guestName: 'Maria Garcia',
      guestEmail: 'maria@example.com',
      platform: 'Booking.com',
      checkIn: '2026-01-15',
      checkOut: '2026-01-18',
      color: '#4CAF50',
      meta: { bed: 'B1' }
    }
  ]

  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(user) })
  )
  await page.route('**/api/profile', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(profile) })
  )
  await page.route('**/api/rooms', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(rooms) })
  )
  await page.route('**/api/bookings', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(bookings) })
  )
}

test.beforeEach(async ({ page }) => {
  // Standardized suite boot sequence: timers -> auth -> network fixtures.
  await disableLongDemoTimeouts(page)
  await seedAuthedSession(page)
  await mockApi(page)
})

test('calendar page loads and shows rooms + month header', async ({ page }) => {
  await page.goto('/bookings')

  await expect(page.getByRole('heading', { name: 'E2E Property' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Today' })).toBeVisible()

  // Month header is rendered in BookingCalendar.
  await expect(page.locator('.calendar-title')).toContainText('January')

  // Room labels should render.
  await expect(page.getByText('A1')).toBeVisible()
  await expect(page.getByText('A2')).toBeVisible()
})

test('calendar month navigation changes the title', async ({ page }) => {
  await page.goto('/bookings')

  const title = page.locator('.calendar-title')
  await expect(title).toContainText('January')

  await page.getByRole('button', { name: '→' }).click()
  await expect(title).toContainText('February')

  await page.getByRole('button', { name: '←' }).click()
  await expect(title).toContainText('January')
})

test('clicking a booking opens detail popup; clicking guest name opens edit modal', async ({ page }) => {
  await page.goto('/bookings')

  // Clicking the guest name opens the GuestModal (also uses .booking-popup),
  // so click a different part of the booking block to open the booking detail popup.
  const bookingBlock = page.locator('.booking-block', { hasText: 'Maria Garcia' }).first()
  await bookingBlock.locator('.booking-platform').click()

  await expect(page.locator('.booking-popup')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Maria Garcia', level: 3 })).toBeVisible()
  await expect(page.getByText('maria@example.com')).toBeVisible()

  // Close booking detail popup.
  await page.locator('.booking-popup-overlay').click({ position: { x: 5, y: 5 } })
  await expect(page.locator('.booking-popup')).toHaveCount(0)

  // Now open edit modal via guest name click (span has title="Edit guest").
  await page.getByTitle('Edit guest').click()
  await expect(page.getByRole('heading', { name: 'Edit Guest' })).toBeVisible()
  await expect(page.getByLabel('Email')).toHaveValue('maria@example.com')
})

test('clicking plus on a day cell opens Add Guest modal with date prefilled', async ({ page }) => {
  await page.goto('/bookings')

  // Pick a known day in the rendered month: 2026-01-10
  const dateStr = '2026-01-10'
  await page.locator(`.day-slot[data-room="A2"][data-date="${dateStr}"] .cell-add-btn`).click()

  await expect(page.getByRole('heading', { name: 'Add Guest' })).toBeVisible()
  await expect(page.getByLabel('Check-in')).toHaveValue(dateStr)
})

test('Add Guest modal can save via API and closes', async ({ page }) => {
  await page.route('**/api/bookings/cell', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback()
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true })
    })
  })

  await page.goto('/bookings')

  const dateStr = '2026-01-10'
  await page.locator(`.day-slot[data-room="A2"][data-date="${dateStr}"] .cell-add-btn`).click()
  await expect(page.getByRole('heading', { name: 'Add Guest' })).toBeVisible()

  await page.getByLabel('Email').fill('newguest@example.com')
  await page.getByRole('button', { name: 'Save' }).click()

  await expect(page.getByRole('heading', { name: 'Add Guest' })).toHaveCount(0)
})

