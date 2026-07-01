import 'dotenv/config';               // side-effect: loads .env before other imports

import { createServer } from 'http';
import express from 'express';
import connectDB from './config/db.js';
import applyMiddleware from './middleware/index.js';
import registerRoutes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { initializeSocket } from './socket/socketServer.js';
import logger from './services/logger.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server for both Express and Socket.IO
const httpServer = createServer(app);

applyMiddleware(app);

// Initialize Socket.IO and attach to app for access in controllers
const io = initializeSocket(httpServer);
app.set('io', io);

registerRoutes(app);

app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  await connectDB();

  httpServer.listen(PORT, () => {
    logger.info(`Server started`, {
      mode: process.env.NODE_ENV || 'development',
      port: PORT,
    });
    logger.info('Socket.IO ready', { port: PORT });
  });
};

startServer();

// ─── Process-level error guards ───────────────────────────────────────────────
process.on('unhandledRejection', (reason) => {
  logger.critical('Unhandled Promise Rejection', { reason: String(reason) });
  if (process.env.NODE_ENV === 'production') process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.critical('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received — shutting down gracefully');
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});
