import 'dotenv/config';               // side-effect: loads .env before other imports

import { createServer } from 'http';
import express from 'express';
import connectDB from './config/db.js';
import applyMiddleware from './middleware/index.js';
import registerRoutes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { initializeSocket } from './socket/socketServer.js';

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
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`🔌 Socket.IO ready on port ${PORT}`);
  });
};

startServer();

// ─── Process-level error guards ───────────────────────────────────────────────
// Prevent silent crashes from unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️  Unhandled Promise Rejection:', reason);
  // In production, log and let the process manager restart
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Prevent crashes from unexpected synchronous errors
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

