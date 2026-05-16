# RentEase

**RentEase** is a full-stack property rental and booking platform (Airbnb-style) where users can browse rental properties, book apartments, and pay advance rent online.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React (Vite), Tailwind CSS, React Router |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth | Firebase Authentication |
| Payments | Razorpay |
| Maps | Google Maps API |

## Project Structure

```
RentEase/
├── client/                 # React frontend (Vite)
│   ├── src/
│   │   ├── components/     # Navbar, Footer, PropertyCard, Loader
│   │   ├── pages/          # Home, Login, Register, Properties, etc.
│   │   ├── layouts/        # MainLayout
│   │   ├── routes/         # AppRoutes
│   │   ├── services/       # API, Firebase
│   │   ├── context/        # AuthContext
│   │   ├── hooks/          # useApi
│   │   ├── utils/          # constants, helpers
│   │   ├── assets/
│   │   └── styles/
│   └── .env.example
├── server/                 # Express API
│   ├── config/             # MongoDB connection
│   ├── controllers/
│   ├── middleware/         # Error handling
│   ├── models/             # User, Property, Booking
│   ├── routes/
│   ├── utils/
│   └── server.js
├── package.json            # Root scripts (run both apps)
├── .gitignore
└── README.md
```

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MongoDB](https://www.mongodb.com/) running locally or Atlas URI
- Firebase, Razorpay, and Google Maps keys (for later phases)

## Installation

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd RentEase--Property-Rental-Booking-Platform
```

### 2. Install dependencies

```bash
npm run install:all
```

Or install separately:

```bash
npm install
npm install --prefix client
npm install --prefix server
```

### 3. Environment variables

**Server** — copy and edit:

```bash
cp server/.env.example server/.env
```

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/rentease
CLIENT_URL=http://localhost:5173
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=7d
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

**Client** — copy and edit:

```bash
cp client/.env.example client/.env
```

```env
VITE_API_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

> The Vite dev server proxies `/api` to `http://localhost:5000`, so `VITE_API_URL` can also be set to `/api` during local development.

### 4. Start MongoDB

Ensure MongoDB is running before starting the server:

```bash
# Local MongoDB (example)
mongod
```

## Running the Application

### Run frontend and backend together

```bash
npm run dev
```

### Run separately

**Backend** (port 5000):

```bash
npm run server
# or
cd server && npm run dev
```

**Frontend** (port 5173):

```bash
npm run client
# or
cd client && npm run dev
```

### Verify setup

1. Open [http://localhost:5173](http://localhost:5173)
2. On the homepage hero, confirm the green **Backend: RentEase API is running** badge
3. Or hit the API directly: [http://localhost:5000/api/test](http://localhost:5000/api/test)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API welcome message |
| GET | `/api/test` | Health check |

## Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Run client + server concurrently |
| `npm run client` | Start Vite dev server |
| `npm run server` | Start Express with nodemon |
| `npm run install:all` | Install root, client, and server deps |

## Upcoming Features

- Firebase auth integration (login/register)
- Property CRUD and search filters
- Booking flow with Razorpay payments
- Google Maps property locations
- Landlord dashboard

## License

MIT
