# RentEase — Portfolio Showcase

## Project Description

**RentEase** is a production-grade, full-stack Airbnb-style property rental platform built entirely in 30 days using the MERN stack (MongoDB, Express, React, Node.js). The platform supports the complete rental lifecycle — from property discovery and booking to payment processing, real-time messaging, and admin management.

---

## Resume Version (3 Bullet Points)

> Copy-paste ready for your resume's Projects section.

```
RentEase — Property Rental & Booking Platform | MERN Stack | Deployed
• Built a full-stack Airbnb-style web app with React 19, Node.js/Express 5, MongoDB Atlas,
  and Socket.IO featuring real-time chat, Razorpay payment processing with refund workflows,
  Google Maps integration, and an AI-powered property recommendation engine.
• Implemented role-based dashboards (Tenant, Owner, Admin) with analytics charts, booking
  lifecycle management, Cloudinary image uploads, Firebase OAuth, JWT auth, and a complete
  admin panel with user moderation, audit logs, and system health monitoring.
• Deployed on Vercel (frontend) + Render (backend) with MongoDB Atlas; optimized to
  90+ Lighthouse score; covered with Vitest unit, Jest server, and Playwright E2E tests;
  PWA-enabled with offline support and installable app experience.
```

---

## LinkedIn Version

> For the Featured section or a LinkedIn post.

```
🚀 Just shipped RentEase — a full-stack property rental platform built in 30 days!

Think Airbnb: browse rental properties on an interactive map, book with real-time
availability, pay via Razorpay, and chat instantly with owners via Socket.IO.

Tech stack: React 19 · Node.js · Express 5 · MongoDB Atlas · Socket.IO ·
Firebase Auth · Razorpay · Google Maps · Cloudinary · Vite · Tailwind CSS

Key features shipped:
✅ Real-time messaging & notifications
✅ Razorpay payments + refund workflows
✅ Owner & Admin dashboards with analytics
✅ AI-powered property recommendations
✅ PWA (offline-ready, installable)
✅ E2E tested with Playwright
✅ Deployed on Vercel + Render

#MERN #React #NodeJS #MongoDB #FullStack #WebDevelopment #OpenSource
```

---

## Portfolio Version (Detailed)

> For your portfolio website's project page.

### RentEase — Property Rental & Booking Platform

**Live:** [rentease.vercel.app](#) | **GitHub:** [github.com/Sambram123/RentEase](https://github.com/Sambram123/RentEase--Property-Rental-Booking-Platform) | **Duration:** 30 days

#### Overview

RentEase is a production-ready property rental marketplace built end-to-end with the MERN stack. Users can discover properties on an interactive Google Maps interface, book dates with real-time availability checking, process payments via Razorpay, and communicate with property owners through a real-time Socket.IO messaging system.

#### Technical Challenges & Solutions

**Challenge: Real-time bidirectional communication**
Implemented Socket.IO with namespaced rooms per property conversation. Each user joins a personal notification room on connection, and property-specific rooms for messaging. Handled reconnection, read receipts, and unread badge counts across browser tabs.

**Challenge: Payment integrity**
Integrated Razorpay with full server-side order creation and HMAC-SHA256 signature verification to prevent payment tampering. Built a time-based refund calculator (100% / 50% / 0% based on days before check-in) with an owner approval workflow.

**Challenge: Role-based access at scale**
Designed a 3-role system (Tenant / Owner / Admin) with Express middleware guards on every route. Firebase Auth handles OAuth flows; custom JWTs carry roles. Admin panel includes user banning, property moderation, audit logging, and system health monitoring.

**Challenge: Performance & UX**
Implemented lazy image loading, skeleton loaders, client-side caching (in-memory + localStorage), and code splitting via Vite. PWA service worker provides offline fallback. Achieved 90+ Lighthouse scores for Performance and Accessibility.

#### Key Features

| Feature                | Implementation Detail                                    |
|------------------------|----------------------------------------------------------|
| Property Search        | MongoDB text index + geospatial query + multi-filter     |
| Google Maps            | Property pins, click-to-detail, geocoding via API        |
| Booking System         | Availability check, date conflict prevention, status FSM |
| Razorpay Payments      | Order API + webhook verify + refund API                  |
| Real-time Chat         | Socket.IO rooms, message persistence, read receipts      |
| AI Recommendations     | Collaborative filtering on booking + view history        |
| Owner Analytics        | Revenue charts, occupancy %, top properties              |
| Admin Panel            | User/property moderation + audit log + DB backup         |
| PWA                    | Manifest, service worker, offline page, install prompt   |
| SEO                    | Dynamic meta tags, Open Graph, semantic HTML             |
| Testing                | Vitest (frontend), Jest (backend), Playwright (E2E)      |

#### Stack

- **Frontend:** React 19, Vite 8, React Router 7, Tailwind CSS, Socket.IO Client, Firebase SDK
- **Backend:** Node.js, Express 5, Socket.IO, Mongoose 8, bcryptjs, Winston
- **Database:** MongoDB Atlas (12 collections, indexed, production cluster)
- **Services:** Razorpay, Firebase Auth, Cloudinary, Google Maps API
- **DevOps:** Vercel (CDN + CI/CD), Render (web service), GitHub

---

## Interview Q&A Preparation

### Technical Questions

**Q: How does your authentication work?**
> A: Hybrid approach — Firebase handles the OAuth UI and identity verification (Google sign-in, email/password). The Firebase idToken is sent to my Express server where Firebase Admin SDK verifies it, then I issue a short-lived JWT (7 days) stored in the client. All API routes use the JWT via `authenticate()` middleware. Role-based access is checked separately with `authorizeRole(['admin'])` guards.

**Q: How do you prevent booking conflicts?**
> A: When a booking request arrives, the server queries for any existing confirmed bookings for the same property where the date ranges overlap using MongoDB's date comparison operators. I also check the owner's blocked availability dates. This happens in a single atomic-style check before creating the booking.

**Q: How does the real-time chat scale?**
> A: Socket.IO rooms are created per conversation. When a user opens a chat, they `join` the room for that conversationId. Messages are persisted to MongoDB before broadcasting, so late-joiners see history. The server also emits to the recipient's personal room for notification delivery even if they're not in the chat view.

**Q: How do you handle payment security?**
> A: The Razorpay secret key lives only on the server (never exposed to client). When a payment completes client-side, I receive `razorpayOrderId`, `razorpayPaymentId`, and `signature`. On the server, I recompute the HMAC-SHA256 signature using `orderId + "|" + paymentId` and compare with the received signature. If they don't match, the payment is rejected.

**Q: What was the hardest part to build?**
> A: The refund system. It required coordinating booking status, payment status, refund policy calculation, owner approval/denial flow, actual Razorpay refund API call, and notification delivery — all with correct state transitions. I built a state machine for booking/payment status and a dedicated `refundCalculator.js` utility for policy logic.

---

## Project Stats

| Metric                | Value        |
|-----------------------|--------------|
| Total lines of code   | ~8,000+      |
| React components      | 32           |
| Page routes           | 21           |
| API controllers       | 18           |
| Database collections  | 12           |
| API endpoints         | 50+          |
| Build time            | 30 days      |
| Test coverage         | Unit + E2E   |
| Deployment            | Production   |
