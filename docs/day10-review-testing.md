# Day 10 — Review & Rating System Testing Guide

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/reviews` | ✅ | Create a review |
| GET | `/api/reviews/property/:propertyId` | ❌ | Get reviews for a property |
| PUT | `/api/reviews/:id` | ✅ | Update own review |
| DELETE | `/api/reviews/:id` | ✅ | Delete own review |

## Business Rules

- **One review per property per user** — enforced via unique compound index
- **Booking required** — user must have a confirmed/completed booking to review
- **No self-reviews** — property owners cannot review their own listings
- **Auto-rating** — `Property.rating` and `Property.reviewsCount` auto-update on create/update/delete

## Testing Steps

### 1. Create a Review (Happy Path)
```bash
POST /api/reviews
Body: { "propertyId": "<id>", "rating": 4, "comment": "Great place!" }
Expected: 201 Created
```

### 2. Duplicate Review Prevention
```bash
POST /api/reviews (same user, same property)
Expected: 409 Conflict — "You have already reviewed this property"
```

### 3. Booking Requirement
```bash
POST /api/reviews (user with no booking for this property)
Expected: 403 Forbidden — "You can only review properties you have booked"
```

### 4. Update Review
```bash
PUT /api/reviews/:id
Body: { "rating": 5, "comment": "Updated comment" }
Expected: 200 OK, Property.rating should recalculate
```

### 5. Delete Review
```bash
DELETE /api/reviews/:id
Expected: 200 OK, Property.rating + reviewsCount should recalculate
```

### 6. Average Rating Verification
After add/update/delete, check `GET /api/properties/:id`:
- `rating` should be the average of all reviews (1 decimal)
- `reviewsCount` should equal the number of reviews

## UI Verification

1. Open a property detail page → reviews section should load
2. If authenticated and booked → review form visible
3. Submit a review → appears in list, rating updates
4. Edit own review → inline edit, star + comment
5. Delete own review → removed from list, rating updates
6. Non-authenticated → no review form, reviews still visible
