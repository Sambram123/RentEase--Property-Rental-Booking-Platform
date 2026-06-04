# Day 11 — Notification Testing Guide

## Pre-requisites

1. MongoDB running locally or Atlas connection configured
2. Backend running: `cd server && npm run dev`
3. Frontend running: `cd client && npm run dev`
4. Two user accounts (one owner, one tenant)

## Testing Socket Connection

### 1. Login and check console
- Log in with any account
- Open browser DevTools → Console
- You should see: `🔌 Socket connected: <socket-id>`
- Server logs should show: `🔌 Socket connected: <user-id> (<socket-id>)`

### 2. Multi-tab support
- Open the app in two tabs with the same user
- Both tabs should show socket connected in console
- Closing one tab should not disconnect the other

## Testing Booking Notifications

### 1. Booking Created (owner notification)
1. Open **two browser windows** — one as tenant, one as owner
2. As tenant: browse to a property owned by the owner and create a booking
3. Owner should see:
   - A toast notification instantly
   - Notification bell count increases
   - Notification appears in dropdown

### 2. Booking Confirmed (tenant notification)
1. As owner: go to Dashboard → Booking requests → click "Confirm"
2. Tenant should see:
   - Toast: "Booking Confirmed"
   - Bell count updates

### 3. Booking Cancelled (other party notification)
1. As tenant: go to My Bookings → cancel a pending booking
2. Owner should see cancellation notification
3. Or as owner: decline a booking → tenant sees notification

## Testing Payment Notifications

### 1. Payment Success
1. As tenant: create a booking and proceed to payment
2. Complete the Razorpay payment flow
3. Both tenant and owner should receive notifications:
   - Tenant: "Payment Successful"
   - Owner: "Payment Received"

### 2. Payment Failed
1. Trigger a payment failure (invalid card or cancel payment)
2. Tenant should see "Payment Failed" notification

## Testing Review Notifications

### 1. New Review
1. As tenant: go to a property you've booked → add a review
2. Property owner should see:
   - Toast: "New Review"
   - Notification with star rating

## Testing Notification Center

Navigate to `/notifications` page:

### 1. Filter tabs
- Click "All", "Unread", "Read" tabs
- Verify correct filtering

### 2. Mark as read
- Hover over an unread notification
- Click the check icon
- Verify it moves from unread to read

### 3. Mark all as read
- Click "Mark all as read" button
- All notifications should become read
- Bell count should reset to 0

### 4. Delete
- Hover and click trash icon
- Notification should be removed
- If it was unread, bell count should decrease

### 5. Pagination
- Generate 20+ notifications
- Verify pagination controls work

## Testing Activity Feed

1. Go to Dashboard (both tenant and owner views)
2. Verify "Recent Activity" widget shows latest notifications
3. Click "View all" → navigates to notifications page

## API Testing (curl)

```bash
# Get notifications
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:5000/api/notifications

# Get unread count
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:5000/api/notifications/unread-count

# Mark as read
curl -X PUT -H "Authorization: Bearer <TOKEN>" \
  http://localhost:5000/api/notifications/<ID>/read

# Mark all as read
curl -X PUT -H "Authorization: Bearer <TOKEN>" \
  http://localhost:5000/api/notifications/read-all

# Delete
curl -X DELETE -H "Authorization: Bearer <TOKEN>" \
  http://localhost:5000/api/notifications/<ID>
```

## Debugging

### Common Issues

1. **Socket not connecting**: Check JWT token is valid, server CORS config
   matches client URL
2. **Notifications not appearing**: Check server console for errors, verify
   `app.set('io', io)` is called before routes
3. **Bell count not updating**: Verify `unread_count` event is being emitted
4. **Multiple notifications**: Check for duplicate socket registrations

### Server Logs
- `🔌 Socket connected: <userId>` — successful connection
- `🔌 Socket disconnected: <userId>` — client disconnected
- `Failed to create notification: ...` — DB error

### Client Logs
- `🔌 Socket connected: <socketId>` — WebSocket open
- `🔌 Socket disconnected: <reason>` — WebSocket closed
- `🔌 Socket connection error: <message>` — handshake failed
