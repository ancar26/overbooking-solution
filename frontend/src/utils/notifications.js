// Notification Service for Booking Calendar
// Handles push notifications and in-app toast notifications

// Check if notifications are supported
export function isNotificationSupported() {
  return 'Notification' in window
}

// Request notification permission
export async function requestNotificationPermission() {
  if (!isNotificationSupported()) {
    console.warn('Notifications not supported in this browser')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

// Get current permission status
export function getNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported'
  return Notification.permission
}

// Show a native push notification
export function showPushNotification(title, options = {}) {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    console.warn('Cannot show notification - permission not granted')
    return null
  }

  const defaultOptions = {
    icon: '/vite.svg',
    badge: '/vite.svg',
    vibrate: [200, 100, 200],
    requireInteraction: false,
    silent: false,
    ...options
  }

  try {
    const notification = new Notification(title, defaultOptions)
    
    // Auto-close after 5 seconds
    setTimeout(() => notification.close(), 5000)
    
    return notification
  } catch (error) {
    console.error('Error showing notification:', error)
    return null
  }
}

// Show new booking notification
export function showNewBookingNotification(booking) {
  const title = '🎉 New Booking!'
  const options = {
    body: `${booking.guestName} booked Room ${booking.roomNumber}\n${booking.checkIn} → ${booking.checkOut}\nvia ${booking.platform}`,
    tag: `booking-new-${booking.id}`,
    data: { type: 'new-booking', booking },
    vibrate: [200, 100, 200, 100, 200]
  }
  
  return showPushNotification(title, options)
}

// Show cancellation notification
export function showCancellationNotification(booking) {
  const title = '❌ Booking Cancelled'
  const options = {
    body: `${booking.guestName} cancelled Room ${booking.roomNumber}\n${booking.checkIn} → ${booking.checkOut}\nvia ${booking.platform}`,
    tag: `booking-cancel-${booking.id}`,
    data: { type: 'cancellation', booking },
    vibrate: [300, 100, 300]
  }
  
  return showPushNotification(title, options)
}

