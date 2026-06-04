# Day 11 — Socket.IO Setup Guide

## Overview

RentEase now uses Socket.IO for real-time notifications. The system pushes
live notifications to connected clients when bookings, payments, or reviews
are created/updated.

## Architecture

```
┌─────────────────┐    WebSocket     ┌──────────────────┐
│   React Client  │ ◄──────────────► │  Express Server  │
│  (socket.io-    │    (auth token)  │  (socket.io)     │
│   client)       │                  │                  │
└─────────────────┘                  └──────────────────┘
                                              │
                                     ┌────────┴────────┐
                                     │  MongoDB        │
                                     │  Notification   │
                                     │  Collection     │
                                     └─────────────────┘
```

## Dependencies

### Backend (server/)
```bash
npm install socket.io
```

### Frontend (client/)
```bash
npm install socket.io-client
```

## Server Setup

### 1. Entry Point (`server.js`)

The Express app is now wrapped in an HTTP server to support Socket.IO:

```js
import { createServer } from 'http';
const httpServer = createServer(app);
const io = initializeSocket(httpServer);
app.set('io', io); // accessible in controllers via req.app.get('io')
httpServer.listen(PORT);
```

### 2. Socket Server (`socket/socketServer.js`)

- JWT authentication on handshake
- User → socket mapping (supports multiple tabs/devices)
- Connection/disconnection handling
- `emitToUser()` helper for sending events to specific users

### 3. Socket Events (`socket/socketEvents.js`)

Provides helper functions that:
1. Create a `Notification` document in MongoDB
2. Emit the notification via WebSocket to the recipient
3. Emit updated unread count

Helper functions:
- `notifyBookingCreated()` — owner receives new booking request
- `notifyBookingConfirmed()` — tenant receives confirmation
- `notifyBookingCancelled()` — other party receives cancellation
- `notifyPaymentSuccess()` — both tenant and owner notified
- `notifyPaymentFailed()` — tenant notified
- `notifyReviewAdded()` — owner notified of new review

### 4. Notification Model (`models/Notification.js`)

Fields:
| Field         | Type     | Description                   |
|---------------|----------|-------------------------------|
| recipient     | ObjectId | User receiving the notif      |
| sender        | ObjectId | User who triggered it         |
| type          | String   | Enum of notification types    |
| title         | String   | Short title                   |
| message       | String   | Longer message body           |
| isRead        | Boolean  | Read/unread state             |
| referenceId   | ObjectId | Related document ID           |
| referenceType | String   | Model name (Booking, etc.)    |

### 5. REST API Routes

| Method | Route                          | Description          |
|--------|--------------------------------|----------------------|
| GET    | `/api/notifications`           | Paginated list       |
| GET    | `/api/notifications/unread-count` | Unread count      |
| PUT    | `/api/notifications/:id/read`  | Mark one as read     |
| PUT    | `/api/notifications/read-all`  | Mark all as read     |
| DELETE | `/api/notifications/:id`       | Delete notification  |

All routes require authentication (Bearer token).

## Frontend Setup

### 1. Socket Service (`services/socketService.js`)

Manages the Socket.IO client connection:
- Connects with auth token
- Automatic reconnection (up to 10 attempts)
- Event subscription/unsubscription helpers

### 2. Notification Context (`context/NotificationContext.jsx`)

Wraps the app and provides:
- Socket lifecycle management
- `unreadCount` state (auto-updated via socket)
- `recentNotifications` array for dropdown
- Toast notifications on incoming events

### 3. Navbar Integration

- Notification bell icon with unread count badge
- Dropdown preview of recent notifications
- Mobile-friendly notification link

## Environment Variables

No additional env vars needed. Socket.IO runs on the same port as Express.

Optional client-side override:
```env
VITE_SOCKET_URL=http://localhost:5000
```

## Running

```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
cd client
npm run dev
```

The Socket.IO server starts automatically with the Express server.
