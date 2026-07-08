# RentEase — Architecture Documentation

> Technical architecture overview of the RentEase MERN stack property rental platform.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Frontend Architecture](#frontend-architecture)
3. [Backend Architecture](#backend-architecture)
4. [Database Design](#database-design)
5. [Third-party Integrations](#third-party-integrations)
6. [Real-time Communication](#real-time-communication)
7. [Security Architecture](#security-architecture)
8. [Deployment Architecture](#deployment-architecture)

---

## System Overview

RentEase follows a decoupled **client-server architecture** with the following layers:

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT TIER                                  │
│   React 19 SPA (Vite) → Vercel CDN → PWA                       │
└───────────────────────────┬─────────────────────────────────────┘
                            │  HTTPS (REST + WebSocket)
┌───────────────────────────▼─────────────────────────────────────┐
│                     APPLICATION TIER                             │
│   Node.js + Express 5 → Render Web Service                      │
│   Socket.IO Server  │  Winston Logger  │  Cache Service         │
└───────┬─────────────┬─────────┬─────────────┬───────────────────┘
        │             │         │             │
   MongoDB        Razorpay  Firebase     Cloudinary
   Atlas          Payments   Auth         Images
```

---

## Frontend Architecture

### Technology

| Layer          | Choice               | Reason                                         |
|----------------|----------------------|------------------------------------------------|
| Framework      | React 19             | Concurrent rendering, stable ecosystem         |
| Build Tool     | Vite 8               | Fast HMR, ESM-native, PWA plugin               |
| Routing        | React Router 7       | File-based routing, nested layouts             |
| Styling        | Tailwind CSS         | Utility-first, consistent design system        |
| State          | React Context API    | Lightweight, no external dep for app-level state |
| HTTP Client    | Axios (via services) | Interceptors for JWT auth headers              |
| Maps           | @react-google-maps/api | Google Maps integration                      |
| Payments       | Razorpay JS SDK      | Client-side payment modal                     |
| Auth           | Firebase SDK         | Google OAuth + Email/Password                  |
| Real-time      | socket.io-client     | WebSocket with polling fallback                |
| PWA            | vite-plugin-pwa      | Service worker, manifest, offline support      |

### Folder Structure

```
client/src/
├── components/       # Reusable, stateless/stateful UI components
│   ├── Navbar.jsx           # Responsive navigation with auth state
│   ├── PropertyCard.jsx     # Listing card (lazy image, wishlist)
│   ├── ChatWindow.jsx       # Real-time chat UI
│   ├── BookingTimeline.jsx  # Visual booking history
│   ├── SEO.jsx              # react-helmet-async wrapper
│   ├── SkeletonLoaders.jsx  # Content loading placeholders
│   ├── FilterSidebar.jsx    # Property search filters
│   ├── PropertiesMapView.jsx# Google Maps property pins
│   ├── PerformanceDashboard.jsx # Core Web Vitals display
│   └── ...32 components total
│
├── pages/            # Route-level views (one per URL)
│   ├── Home.jsx             # Landing page, hero, featured properties
│   ├── Properties.jsx       # Search results, filters, map toggle
│   ├── PropertyDetails.jsx  # Gallery, amenities, booking widget, reviews
│   ├── Dashboard.jsx        # Tenant: bookings, payments, notifications
│   ├── OwnerDashboard.jsx   # Revenue charts, listings, calendar
│   ├── AdminDashboard.jsx   # Full admin panel with tabs
│   ├── Messages.jsx         # Conversation list + chat window
│   ├── MyBookings.jsx       # Booking management with actions
│   ├── Notifications.jsx    # Notification centre
│   └── ...21 pages total
│
├── context/          # React Context providers (global state)
│   ├── AuthContext.jsx      # User, token, login/logout, role
│   ├── SocketContext.jsx    # Socket.IO connection lifecycle
│   └── NotificationContext.jsx # Unread count, notification list
│
├── services/         # API abstraction layer (Axios modules)
│   ├── api.js               # Base Axios instance with interceptors
│   ├── propertyService.js
│   ├── bookingService.js
│   ├── paymentService.js
│   ├── messageService.js
│   ├── adminService.js
│   └── ...19 service files
│
├── hooks/            # Custom React hooks
└── utils/            # Pure helper functions
```

### State Management Pattern

```
AuthContext (global)
  └── user, token, role, loading
  └── login(), logout(), refreshToken()

SocketContext (global)
  └── socket instance (connected on login)
  └── emits: join-room, send-message, mark-read
  └── listens: new-message, notification, booking-update

NotificationContext (global)
  └── notifications[], unreadCount
  └── markRead(), markAllRead()

Local component state
  └── form inputs, loading flags, modal open/close
```

---

## Backend Architecture

### Technology

| Layer          | Choice            | Reason                                           |
|----------------|-------------------|--------------------------------------------------|
| Runtime        | Node.js 18+       | Non-blocking I/O, npm ecosystem                  |
| Framework      | Express 5         | Minimal, flexible, async error handling          |
| ODM            | Mongoose 8        | Schema validation, middleware hooks              |
| Auth           | Firebase Admin + JWT | Hybrid: Firebase for OAuth, JWT for API      |
| Real-time      | Socket.IO 4       | Rooms, namespaces, polling fallback              |
| Logging        | Winston           | Structured logs, file + console transports       |
| Security       | helmet, cors, express-rate-limit | Defense in depth            |
| Payments       | razorpay (npm)    | Official Razorpay Node SDK                       |

### Controller Responsibility Map

| Controller               | Responsibility                                      |
|--------------------------|-----------------------------------------------------|
| `authController.js`      | Register, login, Firebase token sync, JWT issue     |
| `propertyController.js`  | CRUD, search/filter, image upload, geo-query        |
| `bookingController.js`   | Create, cancel, status transitions, owner actions   |
| `paymentController.js`   | Razorpay order create, signature verify, history    |
| `refundController.js`    | Refund request, owner approval/denial, calc         |
| `messageController.js`   | Conversations list, message CRUD, read receipts     |
| `notificationController.js` | List, mark read, mark all read, delete           |
| `reviewController.js`    | Post-stay review, reply, aggregate ratings          |
| `dashboardController.js` | Owner revenue, occupancy, booking stats             |
| `adminController.js`     | User/property moderation, audit log, backup         |
| `systemController.js`    | Health, status, metrics, error log viewer           |
| `wishlistController.js`  | Toggle, list saved properties                       |
| `recommendationController.js` | AI-style recommendations, recently viewed   |
| `securityController.js`  | Rate limit info, security report                    |
| `userController.js`      | Profile update, avatar upload, account settings     |

### Middleware Stack (per request)

```
Request
  → helmet()                  # Security headers
  → cors()                    # Origin whitelist
  → express.json()            # Body parsing
  → rateLimit()               # 100 req/15 min per IP
  → authenticate()            # JWT verification
  → authorizeRole()           # Role-based guard
  → Controller function
  → asyncHandler()            # Catches async errors
  → globalErrorHandler()      # Formats and sends error response
```

---

## Database Design

### Collections Overview

```
rentease (database)
├── users            # All user accounts
├── properties       # Property listings
├── bookings         # Reservations
├── payments         # Razorpay transactions
├── refunds          # Refund requests
├── reviews          # Post-stay reviews
├── conversations    # Message threads
├── messages         # Individual messages
├── notifications    # In-app alerts
├── savedSearches    # Tenant saved filters
├── availability     # Owner blocked dates
└── auditlogs        # Admin action history
```

### Key Relationships

```
User (1) ──────────── (many) Property          [owner → listings]
User (1) ──────────── (many) Booking           [tenant → bookings]
Property (1) ──────── (many) Booking           [listing → reservations]
Booking (1) ──────── (1)    Payment            [booking → transaction]
Booking (1) ──────── (0..1) Refund             [booking → refund request]
Property (1) ──────── (many) Review            [listing → ratings]
User (1) ──────────── (many) Notification      [user → alerts]
User[] (many) ─────── (1)   Conversation       [participants → thread]
Conversation (1) ──── (many) Message           [thread → messages]
```

### Schema Highlights

**User**
```js
{ name, email, password (bcrypt), role: ['tenant','owner','admin'],
  firebaseUid, avatar, isVerified, isBanned, createdAt }
```

**Property**
```js
{ title, description, location: {address, city, coordinates: {lat,lng}},
  price, type, bedrooms, bathrooms, maxGuests, amenities[],
  images[]: [{url, publicId}], owner→User, isAvailable, isApproved,
  rating (computed), reviewCount, createdAt }
```

**Booking**
```js
{ property→Property, tenant→User, checkIn, checkOut, totalNights,
  totalPrice, status: ['pending','confirmed','completed','cancelled'],
  paymentStatus, createdAt }
```

**Payment**
```js
{ booking→Booking, user→User, razorpayOrderId, razorpayPaymentId,
  amount, currency, status: ['created','paid','failed'],
  signature, createdAt }
```

---

## Third-party Integrations

### Razorpay Payment Flow

```
Client                    Server                    Razorpay
  │                          │                          │
  │──POST /payments/order───►│──createOrder()──────────►│
  │◄─ {orderId, amount} ─────│◄─ {id, amount, currency}─│
  │                          │                          │
  │── Razorpay Checkout ────────────────────────────────►│
  │◄── paymentId, signature ────────────────────────────│
  │                          │                          │
  │──POST /payments/verify──►│──verifySignature()        │
  │                          │  (HMAC-SHA256)            │
  │◄─ { success: true } ─────│                          │
```

### Firebase Authentication Flow

```
Client                    Firebase               Server
  │                          │                     │
  │──── Google Sign-In ─────►│                     │
  │◄─── idToken ─────────────│                     │
  │                          │                     │
  │──POST /auth/firebase ──────────────────────────►│
  │                          │    verifyIdToken()──►│ (Firebase Admin)
  │                          │◄── decoded uid ──────│
  │◄─── JWT (our own) ────────────────────────────── │
```

### Cloudinary Image Upload

```
Client ──multipart/form-data──► Server middleware
                                  │
                              cloudinary.uploader.upload()
                                  │
                              { secure_url, public_id }
                                  │
                              Saved to Property.images[]
```

---

## Real-time Communication

### Socket.IO Event Architecture

**Server-side rooms:**
```
/                          # Default namespace
├── user:{userId}          # Personal room (notifications)
└── property:{propertyId}  # Property chat room
```

**Events:**

| Event (emit → listen)          | Direction       | Payload                              |
|-------------------------------|-----------------|--------------------------------------|
| `join-room`                   | Client → Server | `{ propertyId }`                     |
| `send-message`                | Client → Server | `{ conversationId, text }`           |
| `new-message`                 | Server → Client | `{ message, conversationId }`        |
| `notification`                | Server → Client | `{ type, message, data }`            |
| `booking-update`              | Server → Client | `{ bookingId, status }`              |
| `mark-read`                   | Client → Server | `{ conversationId }`                 |
| `messages-read`               | Server → Client | `{ conversationId, readBy }`         |

---

## Security Architecture

| Concern              | Implementation                                        |
|----------------------|-------------------------------------------------------|
| Auth                 | JWT (7d expiry) + Firebase token verification         |
| Password hashing     | bcryptjs, salt rounds: 12                             |
| CORS                 | Whitelist CLIENT_URL only                             |
| Rate limiting        | 100 req / 15 min per IP (express-rate-limit)         |
| Security headers     | helmet() (CSP, HSTS, X-Frame, etc.)                  |
| Payment integrity    | HMAC-SHA256 Razorpay signature verification           |
| Role-based access    | `authorizeRole()` middleware per route                |
| Admin audit log      | All destructive admin actions recorded to AuditLog    |
| Input validation     | Mongoose schema validation + manual guards            |
| Sensitive data       | Passwords never returned; tokens server-side only     |

---

## Deployment Architecture

```
GitHub (source)
     │
     ├─── Vercel (frontend)
     │      ├── Automatic CI/CD on push to main
     │      ├── CDN edge network globally
     │      └── SPA routing via vercel.json rewrites
     │
     └─── Render (backend)
            ├── Web Service with render.yaml
            ├── Auto-deploys on push to main
            ├── Persistent disk for logs
            └── Environment variables in dashboard
                    │
                    └── MongoDB Atlas
                           ├── M0 free tier (dev)
                           ├── M10+ (production)
                           └── Connection via MONGO_URI
```

### Render Configuration (`render.yaml`)

- Build command: `npm install --prefix server`
- Start command: `node server/server.js`
- Health check: `GET /api/health`
- Environment: production

### Vercel Configuration (`client/vercel.json`)

- Root: `client`
- Build: `vite build`
- Output: `dist`
- Rewrites: all routes → `index.html` (SPA fallback)
