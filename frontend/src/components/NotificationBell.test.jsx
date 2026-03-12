import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import NotificationBell from './NotificationBell'

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows unread badge, opens dropdown, and calls onClear', async () => {
    const onClear = vi.fn()
    const onMarkAllRead = vi.fn()

    render(
      <NotificationBell
        notifications={[
          {
            type: 'new',
            booking: { guestName: 'Maria', roomNumber: 'A2', checkIn: '2026-01-15', checkOut: '2026-01-18', platform: 'Booking.com' },
            timestamp: new Date().toISOString(),
            read: false
          }
        ]}
        onClear={onClear}
        onMarkAllRead={onMarkAllRead}
      />
    )

    // Badge present
    expect(screen.getByText('1')).toBeInTheDocument()

    // Open dropdown
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('Recent Activity')).toBeInTheDocument()

    // Mark read is deferred by 500ms
    expect(onMarkAllRead).not.toHaveBeenCalled()
    vi.advanceTimersByTime(600)
    expect(onMarkAllRead).toHaveBeenCalledTimes(1)

    // Clear all
    fireEvent.click(screen.getByRole('button', { name: 'Clear all' }))
    expect(onClear).toHaveBeenCalledTimes(1)
  })
})

