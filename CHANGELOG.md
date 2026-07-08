# Changelog

All notable changes to RentEase are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.0.0] — 2026-07-08 — Production Release

### Added (30-Day Build Summary)

#### Phase 1 — Foundation (Days 1–5)
- Project scaffolding: MERN monorepo with Vite + React 19, Express 5, MongoDB Atlas
- Firebase Auth integration (Google OAuth + Email/Password)
- JWT authentication middleware with role-based access control (tenant/owner/admin)
- Mongoose models: User, Property, Booking, Review, Notification
- Responsive Navbar with auth state, mobile hamburger menu

#### Phase 2 — Core Features (Days 6–12)
- Property CRUD: create, edit, delete with Cloudinary multi-image upload
- Property search: full-text, city filter, type filter, price range, amenities
- Google Maps integration: interactive map view, property pins, geocoding
- Booking system: date-range picker, availability conflict checking, confirmation
- Availability calendar: owner-managed block dates

#### Phase 3 — Payments & Financials (Days 13–16)
- Razorpay payment integration: order creation, checkout modal, webhook verification
- HMAC-SHA256 signature validation for payment security
- Refund system: request → owner approval → Razorpay refund API
- Time-based refund policy calculator (flexible/moderate/strict)
- Payment history and receipt display

#### Phase 4 — Real-time Features (Days 17–20)
- Socket.IO messaging: per-property conversation rooms
- Real-time message delivery, read receipts, unread badge counts
- In-app notification system (Socket.IO + MongoDB persistence)
- Live booking status updates via WebSocket

#### Phase 5 — Dashboards & Analytics (Days 21–23)
- Tenant Dashboard: booking history, payment records, notifications
- Owner Dashboard: revenue charts, occupancy rate, property analytics, top listings
- Admin Dashboard: platform KPIs, user/property growth, booking trends
- System Monitor: uptime, memory, DB health, error log viewer

#### Phase 6 — AI & Intelligence (Days 24–25)
- AI-powered property recommendations (collaborative filtering)
- Recently viewed properties with localStorage persistence
- Saved searches with one-click re-apply
- Wishlist / favourites system

#### Phase 7 — Quality & Testing (Days 26–27)
- Vitest unit tests (frontend components and services)
- Jest unit tests (server controllers and utilities)
- Playwright E2E tests (auth, booking, payment flows)
- Error boundary components, global error handler

#### Phase 8 — Performance & PWA (Days 28–29)
- Progressive Web App: manifest, Vite PWA plugin, service worker
- Offline fallback page, install prompt banner
- Lazy image loading with blur placeholder
- Skeleton loaders for all async content
- Client-side caching (in-memory + localStorage)
- Lighthouse optimization (90+ scores)
- SEO: dynamic meta tags, Open Graph, semantic HTML

#### Phase 9 — Portfolio & Documentation (Day 30)
- Professional README with badges, architecture diagrams, deployment guide
- ARCHITECTURE.md: full system design documentation
- PORTFOLIO.md: resume bullets, LinkedIn post, interview Q&A prep
- Demo data seeder (8 properties, 5 bookings, 7 reviews)
- `npm run seed` convenience command
- Architecture diagram and database schema visuals

### Security
- helmet.js security headers (CSP, HSTS, X-Frame-Options)
- CORS whitelisting (only CLIENT_URL allowed)
- Express rate limiting (100 req/15 min per IP)
- bcryptjs password hashing (12 salt rounds)
- JWT with 7-day expiry
- Admin audit logging for all destructive actions
- Payment signature verification (HMAC-SHA256)

### Deployment
- Frontend: Vercel (CDN + CI/CD from GitHub)
- Backend: Render (Web Service, render.yaml config)
- Database: MongoDB Atlas (production cluster)
- Winston structured logging to `/server/logs/`
