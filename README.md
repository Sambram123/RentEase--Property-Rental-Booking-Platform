<div align="center">

<img src="https://img.shields.io/badge/RentEase-Property%20Rental%20Platform-ff385c?style=for-the-badge" alt="RentEase">

# RentEase — Property Rental & Booking Platform

**A full-stack Airbnb-style rental platform built with the MERN stack.**
Browse, list, book and manage rental properties with real-time chat, payments, and an admin dashboard.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb)](https://mongodb.com/atlas)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?logo=socket.io)](https://socket.io)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)](https://vite.dev)

</div>

---

## 🚀 Live Deployment

| Service  | URL                                           |
|----------|-----------------------------------------------|
| Frontend | _Deploy to Vercel → update this URL_          |
| Backend  | _Deploy to Render → update this URL_          |
| Database | MongoDB Atlas (production cluster)            |

> After deploying, replace the placeholder URLs above with your actual Vercel and Render URLs.

---

## ✨ Features

### Tenant
- 🔍 **Property Search** — filters by city, price, type, amenities
- 🗺️ **Google Maps** — interactive map with property pins
- 📅 **Booking Flow** — date picker, availability check, booking confirmation
- 💳 **Razorpay Payments** — secure online payment with refund support
- ⭐ **Reviews & Ratings** — post-stay feedback system
- 💬 **Real-time Chat** — Socket.IO messaging with owners
- 🔔 **Notifications** — live booking & message notifications
- 🤍 **Wishlist** — save favourite properties
- 📱 **PWA** — installable, offline-ready progressive web app

### Owner / Host
- 🏠 **Property Management** — create, edit, publish/unpublish listings
- 🖼️ **Cloudinary Uploads** — property photo and avatar management
- 📆 **Availability Calendar** — block-off dates, manage bookings
- 💰 **Refund Management** — approve/deny refund requests
- 📊 **Owner Dashboard** — revenue, occupancy stats

### Admin
- 🛡️ **User Moderation** — ban/unban, role management
- 🏘️ **Property Moderation** — approve, flag, remove listings
- 📈 **Analytics Dashboard** — platform-wide charts and KPIs
- 🖥️ **System Monitoring** — health checks, uptime, memory, error logs
- 💾 **Database Backups** — on-demand backup trigger

---

## 🛠️ Tech Stack

| Layer        | Technology                                    |
|--------------|-----------------------------------------------|
| Frontend     | React 19, Vite 8, React Router 7, Tailwind CSS |
| Backend      | Node.js, Express 5, Socket.IO 4               |
| Database     | MongoDB Atlas, Mongoose 8                     |
| Auth         | Firebase Auth + JWT                           |
| Payments     | Razorpay                                      |
| File Uploads | Cloudinary                                    |
| Maps         | Google Maps API (`@react-google-maps/api`)    |
| Email        | Nodemailer / SMTP                             |
| Monitoring   | Winston logger, custom error monitor          |
| Testing      | Vitest, Jest, Playwright (E2E)                |
| Deployment   | Vercel (frontend), Render (backend)           |

---

## ⚙️ Environment Variables

### Backend (`server/.env`)

```env
PORT=5000
NODE_ENV=production

# MongoDB Atlas connection string
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/rentease

# JWT — use 64+ char random string in production
JWT_SECRET=your_64_char_secret_here
JWT_EXPIRE=7d

# Frontend URL (Vercel deployment)
CLIENT_URL=https://your-app.vercel.app

# Razorpay
RAZORPAY_KEY_ID=rzp_live_xxxx
RAZORPAY_SECRET=your_razorpay_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email / SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your_app_password
EMAIL_FROM=noreply@rentease.com
```

### Frontend (`client/.env`)

```env
VITE_API_URL=https://your-render-api.onrender.com/api
VITE_RAZORPAY_KEY_ID=rzp_live_xxxx
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key

VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=1:xxx:web:xxx
```

> See `server/.env.example` and `client/.env.example` for full reference.

---

## 💻 Local Setup

**Prerequisites:** Node.js v18+, MongoDB (local or Atlas), API keys for Firebase, Razorpay, Google Maps.

```bash
# 1. Clone
git clone https://github.com/your-username/RentEase--Property-Rental-Booking-Platform.git
cd RentEase--Property-Rental-Booking-Platform

# 2. Install all dependencies
npm run install:all

# 3. Set up environment files
cp server/.env.example server/.env
cp client/.env.example client/.env
# Edit both files with your credentials

# 4. Start development servers (concurrent)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) for the frontend.
API runs on [http://localhost:5000](http://localhost:5000).

### Available Scripts

| Command                   | Description                          |
|---------------------------|--------------------------------------|
| `npm run dev`             | Start client + server concurrently   |
| `npm run client`          | Start frontend only                  |
| `npm run server`          | Start backend only                   |
| `npm run install:all`     | Install all dependencies             |
| `npm run test`            | Run all unit tests                   |
| `npm run test:e2e`        | Run Playwright E2E tests             |
| `node server/utils/seedDb.js` | Seed demo users into database    |

---

## 🌐 Deployment

### Backend → Render

1. Push this repo to GitHub.
2. Go to [render.com](https://render.com) → **New Web Service** → Connect repo.
3. Render auto-detects `render.yaml` — configure env vars in the dashboard.
4. Set **MONGO_URI**, **JWT_SECRET**, **CLIENT_URL**, **RAZORPAY_\*** and optionally **CLOUDINARY_\*** and **SMTP_\*** in Render's Environment tab.
5. Deploy. Health check: `GET /api/health`

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project** → Import repo.
2. Set **Root Directory** to `client`.
3. Add environment variables: `VITE_API_URL`, `VITE_RAZORPAY_KEY_ID`, `VITE_GOOGLE_MAPS_API_KEY`, Firebase keys.
4. Deploy. `client/vercel.json` handles SPA routing automatically.

### Database → MongoDB Atlas

1. Create a free M0 cluster at [mongodb.com/atlas](https://mongodb.com/atlas).
2. Create a database user with read/write permissions.
3. Set **Network Access** → `0.0.0.0/0` (required for Render's dynamic IPs).
4. Copy the connection string into Render's `MONGO_URI` env var.
5. Run seed (optional): `node server/utils/seedDb.js`

---

## 📡 API Health Endpoints

```
GET /api/health   →  Quick health ping (DB + uptime)
GET /api/status   →  Detailed status (memory, version)
```

---

## 📁 Project Structure

```
RentEase/
├── client/              # React + Vite frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Route-level page components
│   │   ├── context/     # Auth, notification, socket context
│   │   ├── hooks/       # Custom React hooks
│   │   ├── services/    # Axios API calls
│   │   └── utils/       # Helpers
│   └── vercel.json      # Vercel deployment config
├── server/              # Express API
│   ├── config/          # DB connection
│   ├── controllers/     # Route handlers
│   ├── middleware/       # Auth, CORS, rate limiting, security
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API route definitions
│   ├── services/        # Logger, email, analytics
│   ├── socket/          # Socket.IO server
│   └── utils/           # Helpers, seed script
├── render.yaml          # Render deployment config
└── playwright.config.js # E2E test config
```

---

## 🤝 Contributing

Open an issue or submit a pull request. Keep changes small and focused.

## 📄 License

MIT © RentEase
