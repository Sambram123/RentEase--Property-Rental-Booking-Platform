/**
 * Property API Tests — CRUD, filtering, and access control.
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

// ─── Shared factory ──────────────────────────────────────────────────────────
const validPropertyBody = {
  title: 'Cozy Studio in Mumbai',
  description: 'A beautiful fully furnished studio apartment near the sea.',
  type: 'studio',
  price: 15000,
  address: { street: '12 Marine Drive', city: 'Mumbai', state: 'Maharashtra', country: 'India' },
  bedrooms: 1,
  bathrooms: 1,
  amenities: ['wifi', 'ac'],
  availability: true,
};

// ─── Create Property ─────────────────────────────────────────────────────────
describe('POST /api/properties', () => {
  test('201 — owner creates a property', async () => {
    const owner = await createOwner();
    const res = await request(app)
      .post('/api/properties')
      .set(getAuthHeader(owner))
      .send(validPropertyBody);

    expect(res.status).toBe(201);
    expect(res.body.data.property.title).toBe('Cozy Studio in Mumbai');
    expect(res.body.data.property.owner.toString()).toBe(owner._id.toString());
  });

  test('201 — admin can create a property', async () => {
    const admin = await createAdmin();
    const res = await request(app)
      .post('/api/properties')
      .set(getAuthHeader(admin))
      .send(validPropertyBody);

    expect(res.status).toBe(201);
  });

  test('403 — tenant cannot create a property', async () => {
    const tenant = await createTenant();
    const res = await request(app)
      .post('/api/properties')
      .set(getAuthHeader(tenant))
      .send(validPropertyBody);

    expect(res.status).toBe(403);
  });

  test('401 — unauthenticated request rejected', async () => {
    const res = await request(app).post('/api/properties').send(validPropertyBody);
    expect(res.status).toBe(401);
  });

  test('400 — missing title rejected', async () => {
    const owner = await createOwner();
    const { title, ...withoutTitle } = validPropertyBody;
    const res = await request(app)
      .post('/api/properties')
      .set(getAuthHeader(owner))
      .send(withoutTitle);

    expect(res.status).toBe(400);
  });

  test('400 — missing address fields rejected', async () => {
    const owner = await createOwner();
    const res = await request(app)
      .post('/api/properties')
      .set(getAuthHeader(owner))
      .send({ ...validPropertyBody, address: { city: 'Mumbai' } }); // missing state/country

    expect(res.status).toBe(400);
  });

  test('400 — invalid property type rejected', async () => {
    const owner = await createOwner();
    const res = await request(app)
      .post('/api/properties')
      .set(getAuthHeader(owner))
      .send({ ...validPropertyBody, type: 'castle' });

    expect(res.status).toBe(400);
  });
});

// ─── Get Properties (Public) ─────────────────────────────────────────────────
describe('GET /api/properties', () => {
  let owner;

  beforeEach(async () => {
    owner = await createOwner();
    // Seed two properties
    await request(app)
      .post('/api/properties')
      .set(getAuthHeader(owner))
      .send({ ...validPropertyBody, title: 'Mumbai Studio', price: 12000 });
    await request(app)
      .post('/api/properties')
      .set(getAuthHeader(owner))
      .send({
        ...validPropertyBody,
        title: 'Delhi Apartment',
        price: 25000,
        type: 'apartment',
        address: { ...validPropertyBody.address, city: 'Delhi', state: 'Delhi' },
      });
  });

  test('200 — returns list of properties (public)', async () => {
    const res = await request(app).get('/api/properties');

    expect(res.status).toBe(200);
    expect(res.body.data.properties.length).toBeGreaterThanOrEqual(2);
    expect(res.body.data).toHaveProperty('total');
    expect(res.body.data).toHaveProperty('page');
  });

  test('200 — filters by city', async () => {
    const res = await request(app).get('/api/properties?city=Delhi');

    expect(res.status).toBe(200);
    expect(res.body.data.properties.every((p) => /Delhi/i.test(p.city))).toBe(true);
  });

  test('200 — filters by type', async () => {
    const res = await request(app).get('/api/properties?type=apartment');

    expect(res.status).toBe(200);
    res.body.data.properties.forEach((p) => {
      expect(p.type).toBe('apartment');
    });
  });

  test('200 — filters by minPrice', async () => {
    const res = await request(app).get('/api/properties?minPrice=20000');

    expect(res.status).toBe(200);
    res.body.data.properties.forEach((p) => {
      expect(p.price).toBeGreaterThanOrEqual(20000);
    });
  });

  test('200 — pagination works', async () => {
    const res = await request(app).get('/api/properties?page=1&limit=1');

    expect(res.status).toBe(200);
    expect(res.body.data.properties.length).toBe(1);
  });
});

// ─── Get Single Property ──────────────────────────────────────────────────────
describe('GET /api/properties/:id', () => {
  test('200 — returns a single property', async () => {
    const owner = await createOwner();
    const create = await request(app)
      .post('/api/properties')
      .set(getAuthHeader(owner))
      .send(validPropertyBody);

    const id = create.body.data.property._id;
    const res = await request(app).get(`/api/properties/${id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.property._id).toBe(id);
  });

  test('404 — non-existent property ID', async () => {
    const res = await request(app).get('/api/properties/000000000000000000000001');
    expect(res.status).toBe(404);
  });

  test('400 — malformed ID', async () => {
    const res = await request(app).get('/api/properties/not-a-valid-id');
    expect(res.status).toBe(400);
  });
});

// ─── Update Property ─────────────────────────────────────────────────────────
describe('PUT /api/properties/:id', () => {
  let owner, propertyId;

  beforeEach(async () => {
    owner = await createOwner();
    const create = await request(app)
      .post('/api/properties')
      .set(getAuthHeader(owner))
      .send(validPropertyBody);
    propertyId = create.body.data.property._id;
  });

  test('200 — owner updates their property', async () => {
    const res = await request(app)
      .put(`/api/properties/${propertyId}`)
      .set(getAuthHeader(owner))
      .send({ title: 'Updated Title', price: 18000 });

    expect(res.status).toBe(200);
    expect(res.body.data.property.title).toBe('Updated Title');
    expect(res.body.data.property.price).toBe(18000);
  });

  test('403 — another user cannot update', async () => {
    const other = await createOwner({ email: 'other@test.com' });
    const res = await request(app)
      .put(`/api/properties/${propertyId}`)
      .set(getAuthHeader(other))
      .send({ title: 'Hacked' });

    expect(res.status).toBe(403);
  });

  test('200 — admin can update any property', async () => {
    const admin = await createAdmin();
    const res = await request(app)
      .put(`/api/properties/${propertyId}`)
      .set(getAuthHeader(admin))
      .send({ title: 'Admin Updated' });

    expect(res.status).toBe(200);
    expect(res.body.data.property.title).toBe('Admin Updated');
  });
});

// ─── Delete Property ──────────────────────────────────────────────────────────
describe('DELETE /api/properties/:id', () => {
  let owner, propertyId;

  beforeEach(async () => {
    owner = await createOwner();
    const create = await request(app)
      .post('/api/properties')
      .set(getAuthHeader(owner))
      .send(validPropertyBody);
    propertyId = create.body.data.property._id;
  });

  test('200 — owner deletes their property', async () => {
    const res = await request(app)
      .delete(`/api/properties/${propertyId}`)
      .set(getAuthHeader(owner));

    expect(res.status).toBe(200);

    // Verify it's gone
    const check = await request(app).get(`/api/properties/${propertyId}`);
    expect(check.status).toBe(404);
  });

  test('403 — tenant cannot delete a property', async () => {
    const tenant = await createTenant();
    const res = await request(app)
      .delete(`/api/properties/${propertyId}`)
      .set(getAuthHeader(tenant));

    expect(res.status).toBe(403);
  });

  test('200 — admin can delete any property', async () => {
    const admin = await createAdmin();
    const res = await request(app)
      .delete(`/api/properties/${propertyId}`)
      .set(getAuthHeader(admin));

    expect(res.status).toBe(200);
  });
});
