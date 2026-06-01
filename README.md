# RentEase

RentEase is a full-stack property rental and booking platform (Airbnb-style) built with a React + Vite frontend and an Express + MongoDB backend. This README provides a quick, developer-focused guide to get the project running locally.

## Features

- Browse and search properties
- User authentication (Firebase)
- Property listing and management
- Booking flow with Razorpay payments
- Reviews and wishlist
- Google Maps integration for property locations

## Quick Start

Prerequisites: Node.js v18+, MongoDB (local or Atlas), and required API keys (Firebase, Razorpay, Google Maps).

Clone and install:

```bash
git clone <your-repo-url>
cd RentEase--Property-Rental-Booking-Platform
npm run install:all
```

Copy example env files and update values:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Start both apps (concurrent):

```bash
npm run dev
```

Run separately:

- Backend: `npm run server` or `cd server && npm run dev`
- Frontend: `npm run client` or `cd client && npm run dev`

Open http://localhost:5173 to view the frontend.

## Environment variables

See `server/.env.example` and `client/.env.example`. At minimum you should set:

- `MONGODB_URI` — MongoDB connection string
- `JWT_SECRET` — backend JWT secret
- `VITE_API_URL` — API base URL for the client
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` — Razorpay keys
- Firebase keys for client

## Project layout

- `client/` — React (Vite) frontend
- `server/` — Express API, routes, controllers, models

## Remove accidentally pushed `docs` folder

If a `docs/` folder was pushed accidentally, you can remove it and push a fix:

```bash
git rm -r docs
git add README.md
git commit -m "Update README and remove accidentally pushed docs folder"
git push
```

Note: this removes `docs/` from the latest commit. If you need to erase it from history, consider using the BFG Repo-Cleaner or `git filter-repo` (advanced).

## Scripts

- `npm run dev` — start client + server
- `npm run client` — start frontend
- `npm run server` — start backend
- `npm run install:all` — install dependencies for all packages

## Contributing

Open an issue or submit a PR. Keep changes small and focused.

## License

MIT
