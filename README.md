# 🏨 Booking Calendar

A modern booking calendar application for property owners to visualize and manage private room reservations. Features a timeline-style calendar view where rooms are displayed as rows and days as columns, with colored booking blocks showing guest reservations.

## Features

- **Timeline Calendar View**: Visualize all bookings in a Gantt-chart style calendar
- **Room-Based Layout**: Each row represents a private room, showing all its bookings
- **Monthly Navigation**: Scroll through months with easy navigation controls
- **Booking Details Popup**: Click any booking block to see full guest details
- **Multi-Platform Support**: Integrates bookings from Booking.com, Agoda, and other platforms
- **Mobile Responsive**: Works smoothly on desktop, tablet, and mobile devices
- **Dark Theme**: Modern dark UI design for reduced eye strain

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Styling**: CSS (custom design inspired by Tableo)

## Quick Start

### 1. Start the Backend

```bash
cd backend
npm install
npm start
```

Backend runs at `http://localhost:3000`

### 2. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

### 3. Open the App

Navigate to `http://localhost:5173` in your browser.

## Project Structure

```
overbooking-solution/
├── backend/
│   ├── server.js          # Express API server
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── BookingCalendar.jsx   # Main calendar component
│   │   │   └── Navigation.jsx
│   │   ├── pages/
│   │   │   ├── BookingsStatus.jsx    # Calendar page
│   │   │   └── OwnerProfile.jsx      # Property info page
│   │   ├── styles/
│   │   │   ├── BookingCalendar.css
│   │   │   ├── Navigation.css
│   │   │   └── Pages.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
└── README.md
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/profile` | GET | Get property owner profile |
| `/api/rooms` | GET | Get list of all rooms |
| `/api/bookings` | GET | Get all confirmed bookings |
| `/api/bookings/:id` | GET | Get a specific booking |
| `/api/bookings/room/:roomNumber` | GET | Get bookings for a specific room |
| `/api/bookings/range/:startDate/:endDate` | GET | Get bookings in date range |

## Data Model

### Booking
```javascript
{
  id: number,
  platform: string,        // "Booking.com" | "Agoda"
  guestName: string,
  guestEmail: string,
  roomNumber: string,      // "A1", "A2", "B1", "B2"
  checkIn: string,         // "YYYY-MM-DD"
  checkOut: string,        // "YYYY-MM-DD"
  status: "CONFIRMED",
  createdAt: string,       // ISO timestamp
  color: string            // Hex color for calendar display
}
```

### Room
```javascript
{
  roomNumber: string,      // "A1", "A2", "B1", "B2"
  type: "Private"          // Room type
}
```

## Calendar Features

- **Horizontal Scrolling**: Navigate through days by scrolling horizontally
- **Today Indicator**: Current day is highlighted with a purple badge
- **Weekend Highlighting**: Saturday and Sunday have a darker background
- **Booking Overflow**: Bookings that span beyond the visible month show visual indicators
- **Click to View**: Click any booking block to see the full reservation details

## Mobile Support

The calendar is fully responsive:
- Sticky room labels for easy navigation while scrolling
- Touch-friendly scrolling for the timeline
- Optimized booking block sizes for smaller screens
- Full-screen popup details on mobile

## Booking Platforms

This app is designed to receive confirmed bookings from external platforms:
- **Booking.com**
- **Agoda**

Booking conflicts are handled by these platforms before reaching this application. All bookings displayed are confirmed and valid.

## License

MIT
