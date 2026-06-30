/**
 * Creates a fully configured Express app instance for Supertest.
 * Does NOT start listening (Supertest handles that internally).
 * Does NOT connect to MongoDB (tests use testDb.js for that).
 */
import express from 'express';
import applyMiddleware from '../../middleware/index.js';
import registerRoutes from '../../routes/index.js';
import { notFound, errorHandler } from '../../middleware/errorMiddleware.js';

const createTestApp = () => {
  const app = express();

  // Attach a no-op io object so socket-dependent controllers don't crash
  app.set('io', { to: () => ({ emit: () => {} }) });

  // Disable rate limiters in test environment by patching process env
  // (rateLimiter.js checks NODE_ENV to skip in test mode)
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'test';

  applyMiddleware(app);
  registerRoutes(app);
  app.use(notFound);
  app.use(errorHandler);

  // Restore env after middleware setup
  process.env.NODE_ENV = originalEnv;

  return app;
};

export default createTestApp;
