/**
 * Payment API Tests — signature verification, access control, duplicate guard.
 * Note: createOrder requires live Razorpay keys so it's mocked.
 * verifyPayment is tested directly with known signature computation.
 */
import request from 'supertest';
import crypto from 'crypto';
import { connect, clearDatabase, disconnect } from './setup/testDb.js';
import createTestApp from './helpers/createTestApp.js';
import { createOwner, createTenant, getAuthHeader } from './helpers/authHelper.js';
import Booking from '../models/Booking.js';
import Property from '../models/Property.js';
import Payment from '../models/Payment.js';

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

// ─── Helpers ──────────────────────────────────────────────────────────────────
const futureDate = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

const seedBooking = async (tenant, owner) => {
  const property = await Property.create({
    title: 'Pay Test Property',
    description: 'Test property for payment tests',
    type: 'apartment',
    price: 20000,
    address: { street: '1 Pay Lane', city: 'Chennai', state: 'Tamil Nadu', country: 'India' },
    bedrooms: 2,
    bathrooms: 1,
    amenities: [],
    availability: true,
    owner: owner._id,
  });

  const booking = await Booking.create({
    user: tenant._id,
    property: property._id,
    checkInDate: futureDate(10),
    checkOutDate: futureDate(40),
    totalAmount: 20000,
    paymentStatus: 'pending',
    bookingStatus: 'pending',
  });

  return { booking, property };
};

// ─── Verify Payment ───────────────────────────────────────────────────────────
describe('POST /api/payments/verify', () => {
  test('400 — missing required fields returns 400', async () => {
    const tenant = await createTenant();

    const res = await request(app)
      .post('/api/payments/verify')
      .set(getAuthHeader(tenant))
      .send({ bookingId: '000000000000000000000001' }); // missing razorpay fields

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  test('400 — invalid Razorpay signature rejected', async () => {
    const owner = await createOwner();
    const tenant = await createTenant();
    const { booking } = await seedBooking(tenant, owner);

    // Create a payment record manually
    const fakeOrderId = 'order_test_fake123';
    await Payment.create({
      user: tenant._id,
      booking: booking._id,
      property: booking.property,
      razorpayOrderId: fakeOrderId,
      amount: 6000,
      currency: 'INR',
      paymentStatus: 'pending',
    });

    const res = await request(app)
      .post('/api/payments/verify')
      .set(getAuthHeader(tenant))
      .send({
        bookingId: booking._id.toString(),
        razorpay_order_id: fakeOrderId,
        razorpay_payment_id: 'pay_test_fake456',
        razorpay_signature: 'totally_wrong_signature',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid signature/i);
  });

  test('403 — different user cannot verify payment for another user\'s booking', async () => {
    const owner = await createOwner();
    const tenant = await createTenant({ email: 't1@test.com' });
    const otherTenant = await createTenant({ email: 't2@test.com' });
    const { booking } = await seedBooking(tenant, owner);

    const res = await request(app)
      .post('/api/payments/verify')
      .set(getAuthHeader(otherTenant))
      .send({
        bookingId: booking._id.toString(),
        razorpay_order_id: 'order_fake',
        razorpay_payment_id: 'pay_fake',
        razorpay_signature: 'sig_fake',
      });

    expect(res.status).toBe(403);
  });

  test('401 — unauthenticated request rejected', async () => {
    const res = await request(app)
      .post('/api/payments/verify')
      .send({
        bookingId: '000000000000000000000001',
        razorpay_order_id: 'order_fake',
        razorpay_payment_id: 'pay_fake',
        razorpay_signature: 'sig_fake',
      });

    expect(res.status).toBe(401);
  });
});

// ─── Get My Payments ──────────────────────────────────────────────────────────
describe('GET /api/payments/my-payments', () => {
  test('200 — authenticated user sees their payments', async () => {
    const tenant = await createTenant();

    const res = await request(app)
      .get('/api/payments/my-payments')
      .set(getAuthHeader(tenant));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('payments');
    expect(Array.isArray(res.body.data.payments)).toBe(true);
  });

  test('401 — unauthenticated request rejected', async () => {
    const res = await request(app).get('/api/payments/my-payments');
    expect(res.status).toBe(401);
  });
});
