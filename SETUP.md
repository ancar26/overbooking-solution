# How to Run the Overbooking Prevention App

## Prerequisites

- **Node.js 20.19+ or 22.12+** (required for Vite 7)
  - Check your version: `node --version`
  - If you have nvm: `nvm install 20 && nvm use 20`
  - Or download from [nodejs.org](https://nodejs.org/)
- **Use zsh** (your default shell) - nvm is already configured there

---

## Quick Start (Local)

This app has two parts that need to run in separate terminals:

| Terminal | What | Port |
|----------|------|------|
| Terminal 1 | Backend API server | 3000 |
| Terminal 2 | Frontend React app | 5173 |

### Step 1: Start the Backend

```bash
cd overbooking-solution/backend
npm install  # (only first time)
npm run dev
```

You should see:
```
🚀 Backend server running at http://127.0.0.1:3000
📊 Initialized with 24 bookings
🛏️  Total beds: 20, Occupied: 18, Available: 2
```

**Keep this terminal open!**

### Step 2: Start the Frontend

Open a **new terminal**:

```bash
nvm use 20  # Make sure you're on Node.js 20+

cd overbooking-solution/frontend
npm install  # (only first time)
npm run dev
```

You should see:
```
VITE v7.x.x  ready in xxx ms
➜  Local:   http://127.0.0.1:5173/
```

### Step 3: Open in Browser

```
http://127.0.0.1:5173
```

---

## Share with ngrok (Remote Access)

To let someone else access your app from anywhere:

### Step 1: Get ngrok auth token

1. Sign up at https://ngrok.com/signup (free)
2. Copy your auth token from https://dashboard.ngrok.com/get-started/your-authtoken

### Step 2: Configure ngrok (one time only)

```bash
cd overbooking-solution
./ngrok config add-authtoken YOUR_TOKEN_HERE
```

**Note:** Don't use quotes around the token!

### Step 3: Start ngrok tunnel

Make sure backend and frontend are running, then in a **third terminal**:

```bash
cd overbooking-solution
./ngrok http 5173
```

You'll see:
```
Forwarding    https://something.ngrok-free.app -> http://localhost:5173
```

### Step 4: Share the URL!

Give your friend the `https://something.ngrok-free.app` URL - they can access the full app!

---

## Demo Flow

The app demonstrates overbooking prevention for hostels:

### Initial State
- **4 rooms** (A1, A2, B1, B2), each with **5 beds** = **20 total beds**
- **18 beds occupied** (confirmed bookings)
- **2 beds available**
- **6 pending bookings** (listed in order they were made)

### Demo Steps

1. **View Pending Bookings** - See 6 people who booked, listed by timestamp
2. **Approve 1st booking** (Sam Turner) → 19 beds occupied, 1 available
3. **Approve 2nd booking** (Tina Moore) → 20 beds occupied, **FULLY BOOKED**
4. **Auto-rejection** → Remaining 4 bookings automatically marked as `AUTO_REJECTED`
5. **See the message**: "✅ Informed: Property is fully booked - booking auto-rejected"
6. **Reset Demo** button appears → Click to start over

### Key Features Demonstrated

- ⚠️ Bookings listed in timestamp order (who booked first)
- ✅ Owner chooses who to approve
- 🚫 Auto-rejection when property is full
- 📧 "Send Possible Availability" button for rejected guests
- 🔄 Reset Demo to show multiple times

---

## Pages

| Page | URL | Description |
|------|-----|-------------|
| Owner Profile | `/` | Property info, bed counts |
| Bookings Status | `/bookings-status` | Pending bookings, room summary, demo controls |

---

## Troubleshooting

**Frontend can't connect to backend?**
- Make sure backend is running on port 3000
- Check the terminal for "Backend server running" message

**Port already in use?**
- Kill existing processes: `pkill -f "node.*server.js"` or `pkill -f "vite"`
- Or change ports in config files

**Node.js version error?**
- Vite 7.x requires Node.js 20.19+ or 22.12+
- Fix: `nvm install 20 && nvm use 20 && nvm alias default 20`
- Then reinstall: `cd frontend && rm -rf node_modules && npm install`

**ngrok "blocked host" error?**
- Already fixed in `vite.config.js` with `allowedHosts: true`
- If it happens, restart the frontend: `npm run dev`

**ngrok auth token invalid?**
- Don't use quotes around the token
- Make sure you copied the full token from ngrok dashboard

---

## Project Structure

```
overbooking-solution/
├── backend/
│   ├── server.js      # Express API server + mocked database
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── OwnerProfile.jsx
│   │   │   └── BookingsStatus.jsx
│   │   ├── components/
│   │   │   └── Navigation.jsx
│   │   └── styles/
│   │       └── Pages.css
│   ├── vite.config.js  # Dev server + API proxy config
│   └── package.json
├── ngrok              # ngrok binary for tunneling
└── SETUP.md           # This file
```

---

## Next Steps

- Connect to real booking APIs (Booking.com, Agoda webhooks)
- Add authentication for property owners
- Mobile-responsive improvements
- Database integration (SQLite → PostgreSQL)
