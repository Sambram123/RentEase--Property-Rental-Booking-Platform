# Day 10 — Wishlist System Testing Guide

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/wishlist` | ✅ | Get saved properties (populated) |
| POST | `/api/wishlist/:propertyId` | ✅ | Add to wishlist |
| DELETE | `/api/wishlist/:propertyId` | ✅ | Remove from wishlist |

## Business Rules

- **No duplicates** — adding the same property twice returns 409
- **Property must exist** — returns 404 for invalid IDs
- **Authenticated only** — all endpoints require JWT

## Testing Steps

### 1. Add to Wishlist
```bash
POST /api/wishlist/<propertyId>
Expected: 200 OK — { wishlist: [<id>] }
```

### 2. Duplicate Prevention
```bash
POST /api/wishlist/<same-propertyId>
Expected: 409 Conflict — "Property already in wishlist"
```

### 3. Get Wishlist (Populated)
```bash
GET /api/wishlist
Expected: 200 OK — { count: N, properties: [...populated data...] }
```

### 4. Remove from Wishlist
```bash
DELETE /api/wishlist/<propertyId>
Expected: 200 OK — removed from array
```

### 5. Remove Non-Existent
```bash
DELETE /api/wishlist/<propertyId-not-in-wishlist>
Expected: 404 — "Property not in wishlist"
```

## UI Verification

1. **PropertyDetails** → heart icon in gallery overlay
   - Click to add → fills red, toast "Saved to wishlist ❤️"
   - Click again → unfills, toast "Removed from wishlist"
   - Not authenticated → toast "Sign in to save properties"

2. **Navbar** → "Wishlist" link in nav (desktop + mobile)

3. **Wishlist Page** (`/wishlist`)
   - Shows saved properties in responsive grid
   - Each card has "Remove" button
   - Empty state with link to browse properties

4. **Dashboard** → "Saved properties" stat card links to /wishlist
   - Shows correct count
   - Tenant CTA includes "Saved properties" button
