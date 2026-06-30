/**
 * Auth API Tests — POST /api/auth/register, /login, GET /api/auth/profile
 * Uses in-memory MongoDB for full isolation.
 */
import request from 'supertest';
import { connect, clearDatabase, disconnect } from './setup/testDb.js';
import createTestApp from './helpers/createTestApp.js';
import jwt from 'jsonwebtoken';

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

// ─── Registration ─────────────────────────────────────────────────────────────
describe('POST /api/auth/register', () => {
  const validUser = {
    name: 'Alice Tenant',
    email: 'alice@test.com',
    password: 'password123',
    role: 'tenant',
  };

  test('201 — registers a new user and returns token', async () => {
    const res = await request(app).post('/api/auth/register').send(validUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user.email).toBe('alice@test.com');
    expect(res.body.data.user.role).toBe('tenant');
    expect(res.body.data.user).not.toHaveProperty('password');
  });

  test('201 — registers an owner role correctly', async () => {
    const res = await request(app).post('/api/auth/register').send({
      ...validUser,
      email: 'owner@test.com',
      role: 'owner',
    });

    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('owner');
  });

  test('400 — rejects registration with missing name', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'alice@test.com', password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('400 — rejects registration with missing email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('400 — rejects password shorter than 6 characters', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice@test.com', password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/6 characters/i);
  });

  test('409 — rejects duplicate email registration', async () => {
    await request(app).post('/api/auth/register').send(validUser);
    const res = await request(app).post('/api/auth/register').send(validUser);

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already exists/i);
  });

  test('admin role is blocked — defaults to tenant instead', async () => {
    const res = await request(app).post('/api/auth/register').send({
      ...validUser,
      email: 'fake-admin@test.com',
      role: 'admin',
    });

    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('tenant');
  });
});

// ─── Login ────────────────────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Alice',
      email: 'alice@test.com',
      password: 'password123',
    });
  });

  test('200 — successful login returns token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@test.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user.email).toBe('alice@test.com');
  });

  test('401 — wrong password rejected', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@test.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  test('401 — unknown email rejected', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'password123' });

    expect(res.status).toBe(401);
  });

  test('400 — missing email and password', async () => {
    const res = await request(app).post('/api/auth/login').send({});

    expect(res.status).toBe(400);
  });
});

// ─── Profile (Protected) ─────────────────────────────────────────────────────
describe('GET /api/auth/profile', () => {
  let token;

  beforeEach(async () => {
    const reg = await request(app).post('/api/auth/register').send({
      name: 'Alice',
      email: 'alice@test.com',
      password: 'password123',
    });
    token = reg.body.data?.token;
  });

  test('200 — returns profile with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('alice@test.com');
    expect(res.body.data.user).not.toHaveProperty('password');
  });

  test('401 — no token returns 401', async () => {
    const res = await request(app).get('/api/auth/profile');
    expect(res.status).toBe(401);
  });

  test('401 — invalid token string returns 401', async () => {
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', 'Bearer this.is.not.valid');
    expect(res.status).toBe(401);
  });

  test('401 — expired token returns 401', async () => {
    const expiredToken = jwt.sign(
      { id: '000000000000000000000001', role: 'tenant' },
      process.env.JWT_SECRET,
      { expiresIn: '0s' }
    );
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
  });
});
