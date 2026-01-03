# Overbooking Prevention App (PoC)

## 1. Purpose of This Project

This project is a **Proof of Concept (PoC)** for an application that helps property owners prevent **overbooking** when their rooms are listed on multiple booking platforms (Booking.com, Agoda, Hostelworld, etc.).

At this stage:

* We **do NOT integrate** with Booking.com or Agoda directly
* We **simulate booking events** or use alternative free data sources
* The goal is to prove that the **logic, flow, and value** of the system work

The PoC demonstrates how booking and cancellation events can be **centralized**, **reviewed**, and **approved/rejected** by the property owner to keep availability consistent.

---

## 2. What Problem This App Solves

In many regions, especially where systems are not fully digitalized:

* The same room is listed on multiple platforms
* Availability is not synced correctly
* Two guests can book the same room
* Guests arrive and find no accommodation

This app acts as a **central control layer** that:

* Collects booking & cancellation events
* Shows them to the owner in real time
* Lets the owner approve or reject
* Keeps availability accurate

---

## 3. What This PoC Is (and Is Not)

### This PoC IS:

* A backend-driven system
* A centralized booking-status dashboard
* A demonstration of approval logic
* A foundation for future official integrations

### This PoC IS NOT:

* A direct Booking.com / Agoda integration
* A channel manager replacement
* A consumer-facing booking app

---

## 4. High-Level Architecture

```
[ Booking Platform Simulator / Free API ]
                |
             Webhook
                |
           Backend API
        (Business Logic)
                |
            Database
                |
        Web App Dashboard
     (Desktop & Mobile)
```

---

## 5. Tech Stack (PoC)

### Frontend

* React
* Vite
* Minimal CSS
* Runs as Web App / PWA

### Backend

* Node.js
* Express
* REST APIs + Webhooks

### Database

* SQLite (PoC)
* Single source of truth

### Hosting (Free Tier)

* Frontend: Vercel / Netlify
* Backend: Render / Railway / Fly.io

---

## 6. Data Source Strategy (Important)

### Why We Cannot Use Booking.com Yet

* Booking.com and Agoda APIs are **partner-only**
* Partnership requires:

  * Registered company
  * Existing customers
  * Working production system

Therefore, for this PoC we use **alternative data sources**.

### Data Sources Used in This PoC

#### Option A – Booking Platform Simulator (Recommended)

We simulate booking platforms by generating events such as:

* booking_created
* booking_cancelled

This allows us to:

* Control edge cases
* Simulate overbooking
* Test race conditions

#### Option B – Free / Open APIs

Optional for learning purposes:

* Mock hotel booking APIs
* Open travel datasets

In all cases, the backend treats events as if they came from real platforms.

---

## 7. Core Concepts

### Booking Event Types

* Room booked
* Room cancelled

### Booking States

```
CREATED → PENDING → CONFIRMED
                 → REJECTED
                 → CANCELLED
```

Only valid state transitions are allowed.

### Availability Rules

* Availability is decreased only after approval
* Availability is restored on cancellation approval
* Double booking is prevented at backend level

---

## 8. User Flow (Owner Perspective)

1. Booking event arrives (simulated)
2. Owner receives in-app notification:

   * "Room A2 booked"
3. Owner opens app (mobile or desktop)
4. Owner chooses:

   * Approve → availability decreases
   * Reject → availability unchanged
5. Cancellation events follow same logic

---

## 9. App Accessibility

* Web browser (desktop)
* Web browser (mobile)
* Installable as PWA
* Single public URL

No App Store required for PoC.

---

## 10. Development Phases

### Phase 1 – Design

* Define booking states
* Define availability rules
* Define API contracts

### Phase 2 – Backend

* Express app
* Database schema
* Webhook endpoints

### Phase 3 – Frontend

* Booking list
* Status indicators
* Approve / Reject actions

### Phase 4 – Simulator

* Generate booking events
* Generate cancellation events

### Phase 5 – Demo

* Show overbooking scenario
* Show prevention logic

---

## 11. Future (Out of Scope for PoC)

* Official Booking.com integration
* Agoda / Hostelworld integration
* Partner certification
* Billing & payments
* SLA & monitoring

---

## 12. Key Goal of This PoC

To prove that:

* Centralized approval works
* Overbooking can be prevented
* Owners gain control and visibility
* The system is technically sound

This PoC is the foundation for future official integrations.
