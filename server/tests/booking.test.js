/**
 * Booking API Tests — creation, date validation, overlap, cancellation, access control.
 */
import request from 'supertest';
import { connect, clearDatabase, disconnect } from './setup/testDb.js';
import createTestApp from './helpers/createTestApp.js';
import { createOwner, createTenant, createAdmin, getAuthHeader } from './helpers/authHelper.js';

let app;

beforeAll(async () => {
  await connect();
  app = createTestApp();
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await disconnect();
});

// ─── Shared helpers ───────────────────────────────────────────────────────────
const propertyBody = {
  title: 'Test Property',
  description: 'A nice test property for bookings.',
  type: 'apartment',
  price: 20000,
  address: { street: '1 Test Lane', city: 'Bangalore', state: 'Karnataka', country: 'India' },
  bedrooms: 2,
  bathrooms: 1,
  amenities: ['wifi'],
  availability: true,
};

// Returns future dates relative to now
const futureDate = (daysFromNow) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
};

const createProperty = async (owner) => {
  const res = await request(app)
    .post('/api/properties')
    .set(getAuthHeader(owner))
    .send(propertyBody);
  return res.body.data.property;
};

const createBooking = async (tenant, propertyId, checkIn, checkOut) => {
  return request(app)
    .post('/api/bookings')
    .set(getAuthHeader(tenant))
    .send({ propertyId, checkInDate: checkIn, checkOutDate: checkOut });
};

// ─── Create Booking ───────────────────────────────────────────────────────────
describe('POST /api/bookings', () => {
  test('201 — tenant successfully creates a booking', async () => {
    const owner = await createOwner();
    const tenant = await createTenant();
    const property = await createProperty(owner);

    const res = await createBooking(
      tenant,
      property._id,
      futureDate(5),
      futureDate(35)
    );

    expect(res.status).toBe(201);
    expect(res.body.data.booking.property._id || res.body.data.booking.property).toBeTruthy();
    expect(res.body.data.booking.bookingStatus).toBe('pending');
    expect(res.body.data.booking.paymentStatus).toBe('pending');
  });

  test('400 — check-in date in the past rejected', async () => {
    const owner = await createOwner();
    const tenant = await createTenant();
    const property = await createProperty(owner);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const res = await createBooking(
      tenant,
      property._id,
      yesterday.toISOString().split('T')[0],
      futureDate(30)
    );

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/past/i);
  });

  test('400 — check-out before check-in rejected', async () => {
    const owner = await createOwner();
    const tenant = await createTenant();
    const property = await createProperty(owner);

    const res = await createBooking(
      tenant,
      property._id,
      futureDate(30),
      futureDate(5)
    );

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/after/i);
  });

  test('409 — overlapping dates rejected', async () => {
    const owner = await createOwner();
    const tenant1 = await createTenant({ email: 'tenant1@test.com' });
    const tenant2 = await createTenant({ email: 'tenant2@test.com' });
    const property = await createProperty(owner);

    // First booking: days 10–40
    await createBooking(tenant1, property._id, futureDate(10), futureDate(40));

    // Second booking overlapping (days 20–50) — should conflict
    const res = await createBooking(tenant2, property._id, futureDate(20), futureDate(50));

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already booked/i);
  });

  test('400 — owner cannot book their own property', async () => {
    const owner = await createOwner();
    const property = await createProperty(owner);

    const res = await createBooking(owner, property._id, futureDate(5), futureDate(35));

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/own property/i);
  });

  test('400 — unavailable property cannot be booked', async () => {
    const owner = await createOwner();

    const unavailRes = await request(app)
      .post('/api/properties')
      .set(getAuthHeader(owner))
      .send({ ...propertyBody, title: 'Unavailable Prop', availability: false });

    const tenant = await createTenant();
    const res = await createBooking(
      tenant,
      unavailRes.body.data.property._id,
      futureDate(5),
      futureDate(35)
    );

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/not available/i);
  });

  test('404 — non-existent property returns 404', async () => {
    const tenant = await createTenant();
    const res = await createBooking(
      tenant,
      '000000000000000000000001',
      futureDate(5),
      futureDate(35)
    );
    expect(res.status).toBe(404);
  });

  test('401 — unauthenticated request rejected', async () => {
    const owner = await createOwner();
    const property = await createProperty(owner);

    const res = await request(app)
      .post('/api/bookings')
      .send({ propertyId: property._id, checkInDate: futureDate(5), checkOutDate: futureDate(35) });

    expect(res.status).toBe(401);
  });
});

// ─── Get My Bookings ──────────────────────────────────────────────────────────
describe('GET /api/bookings/my-bookings', () => {
  test('200 — tenant sees their own bookings', async () => {
    const owner = await createOwner();
    const tenant = await createTenant();
    const property = await createProperty(owner);

    await createBooking(tenant, property._id, futureDate(5), futureDate(35));

    const res = await request(app)
      .get('/api/bookings/my-bookings')
      .set(getAuthHeader(tenant));

    expect(res.status).toBe(200);
    expect(res.body.data.bookings.length).toBe(1);
  });

  test('200 — different tenant does not see other tenant bookings', async () => {
    const owner = await createOwner();
    const tenant1 = await createTenant({ email: 't1@test.com' });
    const tenant2 = await createTenant({ email: 't2@test.com' });
    const property = await createProperty(owner);

    await createBooking(tenant1, property._id, futureDate(5), futureDate(35));

    const res = await request(app)
      .get('/api/bookings/my-bookings')
      .set(getAuthHeader(tenant2));

    expect(res.status).toBe(200);
    expect(res.body.data.bookings.length).toBe(0);
  });
});

// ─── Get Booking By ID ────────────────────────────────────────────────────────
describe('GET /api/bookings/:id', () => {
  test('200 — booking owner can view their booking', async () => {
    const owner = await createOwner();
    const tenant = await createTenant();
    const property = await createProperty(owner);

    const bookRes = await createBooking(tenant, property._id, futureDate(5), futureDate(35));
    const bookingId = bookRes.body.data.booking._id;

    const res = await request(app)
      .get(`/api/bookings/${bookingId}`)
      .set(getAuthHeader(tenant));

    expect(res.status).toBe(200);
    expect(res.body.data.booking._id).toBe(bookingId);
  });

  test('403 — unrelated user cannot view booking', async () => {
    const owner = await createOwner();
    const tenant = await createTenant({ email: 't1@test.com' });
    const otherTenant = await createTenant({ email: 't2@test.com' });
    const property = await createProperty(owner);

    const bookRes = await createBooking(tenant, property._id, futureDate(5), futureDate(35));
    const bookingId = bookRes.body.data.booking._id;

    const res = await request(app)
      .get(`/api/bookings/${bookingId}`)
      .set(getAuthHeader(otherTenant));

    expect(res.status).toBe(403);
  });
});

// ─── Update Booking Status ────────────────────────────────────────────────────
describe('PUT /api/bookings/:id/status', () => {
  let owner, tenant, bookingId;

  beforeEach(async () => {
    owner = await createOwner();
    tenant = await createTenant();
    const property = await createProperty(owner);
    const bookRes = await createBooking(tenant, property._id, futureDate(5), futureDate(35));
    bookingId = bookRes.body.data.booking._id;
  });

  test('200 — tenant can cancel their own pending booking', async () => {
    const res = await request(app)
      .put(`/api/bookings/${bookingId}/status`)
      .set(getAuthHeader(tenant))
      .send({ status: 'cancelled' });

    expect(res.status).toBe(200);
    expect(res.body.data.booking.bookingStatus).toBe('cancelled');
  });

  test('403 — tenant cannot confirm their own booking', async () => {
    const res = await request(app)
      .put(`/api/bookings/${bookingId}/status`)
      .set(getAuthHeader(tenant))
      .send({ status: 'confirmed' });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/only cancel/i);
  });

  test('200 — owner can confirm a booking for their property', async () => {
    const res = await request(app)
      .put(`/api/bookings/${bookingId}/status`)
      .set(getAuthHeader(owner))
      .send({ status: 'confirmed' });

    expect(res.status).toBe(200);
    expect(res.body.data.booking.bookingStatus).toBe('confirmed');
  });

  test('400 — invalid status value rejected', async () => {
    const res = await request(app)
      .put(`/api/bookings/${bookingId}/status`)
      .set(getAuthHeader(owner))
      .send({ status: 'flying' });

    expect(res.status).toBe(400);
  });
});

// ─── Delete Booking ───────────────────────────────────────────────────────────
describe('DELETE /api/bookings/:id', () => {
  test('200 — booking owner can delete their booking', async () => {
    const owner = await createOwner();
    const tenant = await createTenant();
    const property = await createProperty(owner);
    const bookRes = await createBooking(tenant, property._id, futureDate(5), futureDate(35));
    const bookingId = bookRes.body.data.booking._id;

    const res = await request(app)
      .delete(`/api/bookings/${bookingId}`)
      .set(getAuthHeader(tenant));

    expect(res.status).toBe(200);
  });

  test('403 — unrelated user cannot delete booking', async () => {
    const owner = await createOwner();
    const tenant = await createTenant({ email: 't1@test.com' });
    const other = await createTenant({ email: 't2@test.com' });
    const property = await createProperty(owner);
    const bookRes = await createBooking(tenant, property._id, futureDate(5), futureDate(35));
    const bookingId = bookRes.body.data.booking._id;

    const res = await request(app)
      .delete(`/api/bookings/${bookingId}`)
      .set(getAuthHeader(other));

    expect(res.status).toBe(403);
  });

  test('200 — admin can delete any booking', async () => {
    const admin = await createAdmin();
    const owner = await createOwner();
    const tenant = await createTenant();
    const property = await createProperty(owner);
    const bookRes = await createBooking(tenant, property._id, futureDate(5), futureDate(35));
    const bookingId = bookRes.body.data.booking._id;

    const res = await request(app)
      .delete(`/api/bookings/${bookingId}`)
      .set(getAuthHeader(admin));

    expect(res.status).toBe(200);
  });
});
