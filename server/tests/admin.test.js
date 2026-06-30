/**
 * Admin API Tests — role protection, user management, platform oversight.
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

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
describe('GET /api/admin/dashboard', () => {
  test('200 — admin accesses dashboard', async () => {
    const admin = await createAdmin();
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set(getAuthHeader(admin));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('403 — tenant cannot access admin dashboard', async () => {
    const tenant = await createTenant();
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set(getAuthHeader(tenant));

    expect(res.status).toBe(403);
  });

  test('403 — owner cannot access admin dashboard', async () => {
    const owner = await createOwner();
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set(getAuthHeader(owner));

    expect(res.status).toBe(403);
  });

  test('401 — unauthenticated request rejected', async () => {
    const res = await request(app).get('/api/admin/dashboard');
    expect(res.status).toBe(401);
  });
});

// ─── Admin: Get Users ─────────────────────────────────────────────────────────
describe('GET /api/admin/users', () => {
  beforeEach(async () => {
    await createTenant({ email: 'tenant1@test.com' });
    await createOwner({ email: 'owner1@test.com' });
  });

  test('200 — admin lists all users', async () => {
    const admin = await createAdmin();
    const res = await request(app)
      .get('/api/admin/users')
      .set(getAuthHeader(admin));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.users)).toBe(true);
    expect(res.body.data.users.length).toBeGreaterThanOrEqual(2);
  });

  test('403 — non-admin cannot list users', async () => {
    const tenant = await createTenant();
    const res = await request(app)
      .get('/api/admin/users')
      .set(getAuthHeader(tenant));

    expect(res.status).toBe(403);
  });
});

// ─── Admin: Get Properties ────────────────────────────────────────────────────
describe('GET /api/admin/properties', () => {
  test('200 — admin lists all properties', async () => {
    const admin = await createAdmin();
    const res = await request(app)
      .get('/api/admin/properties')
      .set(getAuthHeader(admin));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.properties)).toBe(true);
  });

  test('403 — owner cannot access admin properties list', async () => {
    const owner = await createOwner();
    const res = await request(app)
      .get('/api/admin/properties')
      .set(getAuthHeader(owner));

    expect(res.status).toBe(403);
  });
});

// ─── Admin: Get Bookings ──────────────────────────────────────────────────────
describe('GET /api/admin/bookings', () => {
  test('200 — admin lists all bookings', async () => {
    const admin = await createAdmin();
    const res = await request(app)
      .get('/api/admin/bookings')
      .set(getAuthHeader(admin));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.bookings)).toBe(true);
  });
});

// ─── Admin: Update User ───────────────────────────────────────────────────────
describe('PUT /api/admin/users/:id', () => {
  test('200 — admin can update a user', async () => {
    const admin = await createAdmin();
    const tenant = await createTenant({ email: 'update-me@test.com' });

    const res = await request(app)
      .put(`/api/admin/users/${tenant._id}`)
      .set(getAuthHeader(admin))
      .send({ name: 'Updated Name' });

    expect(res.status).toBe(200);
  });

  test('403 — tenant cannot update another user', async () => {
    const tenant = await createTenant({ email: 'actor@test.com' });
    const target = await createTenant({ email: 'target@test.com' });

    const res = await request(app)
      .put(`/api/admin/users/${target._id}`)
      .set(getAuthHeader(tenant))
      .send({ name: 'Hacked' });

    expect(res.status).toBe(403);
  });
});
