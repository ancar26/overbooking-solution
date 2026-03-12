import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BookingCalendar from './BookingCalendar'

describe('BookingCalendar', () => {
  beforeEach(() => {
    // Make requestAnimationFrame run immediately in tests.
    vi.stubGlobal('requestAnimationFrame', (cb) => {
      cb(0)
      return 0
    })
  })

  it('renders month title based on first booking and opens booking detail popup', async () => {
    const user = userEvent.setup()

    render(
      <BookingCalendar
        rooms={[{ roomNumber: 'A1', label: 'Private' }]}
        bookings={[
          {
            id: 'b1',
            roomNumber: 'A1',
            guestName: 'Maria Garcia',
            guestEmail: 'maria@example.com',
            platform: 'Booking.com',
            checkIn: '2026-01-15',
            checkOut: '2026-01-18',
            meta: { bed: 'B1' },
            color: '#4CAF50'
          }
        ]}
      />
    )

    expect(screen.getByText(/January 2026/i)).toBeInTheDocument()
    expect(screen.getByText('A1')).toBeInTheDocument()

    // Click booking platform label to open booking detail popup (not the guest modal).
    await user.click(screen.getByText('B1'))

    expect(screen.getByRole('heading', { name: 'Maria Garcia' })).toBeInTheDocument()
    expect(screen.getByText('maria@example.com')).toBeInTheDocument()
  })
})

