/**
 * Auth test helpers — create users and generate JWTs for test scenarios.
 */
import User from '../../models/User.js';
import generateToken from '../../utils/generateToken.js';

/**
 * Create a user document directly in the test DB.
 * Password is hashed via User pre-save hook.
 */
export const createUser = async ({ name, email, password = 'password123', role = 'tenant' } = {}) => {
  return User.create({ name, email, password, role });
};

/**
 * Get a valid JWT Authorization header for a user.
 */
export const getAuthHeader = (user) => {
  const token = generateToken({ id: user._id, role: user.role });
  return { Authorization: `Bearer ${token}` };
};

/**
 * Shorthand factories for common user types.
 */
export const createTenant = (overrides = {}) =>
  createUser({
    name: 'Test Tenant',
    email: `tenant_${Date.now()}@test.com`,
    role: 'tenant',
    ...overrides,
  });

export const createOwner = (overrides = {}) =>
  createUser({
    name: 'Test Owner',
    email: `owner_${Date.now()}@test.com`,
    role: 'owner',
    ...overrides,
  });

export const createAdmin = (overrides = {}) =>
  createUser({
    name: 'Test Admin',
    email: `admin_${Date.now()}@test.com`,
    role: 'admin',
    ...overrides,
  });
