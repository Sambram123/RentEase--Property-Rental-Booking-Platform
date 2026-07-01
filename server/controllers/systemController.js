import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import { getErrorSummary } from '../services/errorMonitor.js';
import { listBackups, triggerBackup } from '../utils/backupUtils.js';
import logger from '../services/logger.js';

const SERVER_START = Date.now();

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Basic health ping — used by load-balancers / uptime monitors
// @route   GET /api/health
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
export const healthCheck = asyncHandler(async (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';
  const uptimeSeconds = Math.floor((Date.now() - SERVER_START) / 1000);

  res.status(dbState === 1 ? 200 : 503).json({
    success: dbState === 1,
    status: dbState === 1 ? 'healthy' : 'degraded',
    api: 'online',
    database: dbStatus,
    uptimeSeconds,
    env: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Detailed status — for admin monitoring
// @route   GET /api/status
// @access  Public (non-sensitive info only)
// ─────────────────────────────────────────────────────────────────────────────
export const statusCheck = asyncHandler(async (req, res) => {
  const uptimeSeconds = Math.floor((Date.now() - SERVER_START) / 1000);
  const dbState = mongoose.connection.readyState;

  const memUsage = process.memoryUsage();
  const memMB = {
    heapUsed: (memUsage.heapUsed / 1024 / 1024).toFixed(1),
    heapTotal: (memUsage.heapTotal / 1024 / 1024).toFixed(1),
    rss: (memUsage.rss / 1024 / 1024).toFixed(1),
  };

  res.json({
    success: true,
    status: dbState === 1 ? 'healthy' : 'degraded',
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    uptimeSeconds,
    uptimeFormatted: formatUptime(uptimeSeconds),
    database: {
      status: dbState === 1 ? 'connected' : 'disconnected',
      host: mongoose.connection.host || 'unknown',
    },
    memory: memMB,
    node: process.version,
    timestamp: new Date().toISOString(),
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Full system monitoring — admin only
// @route   GET /api/admin/system
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
export const getSystemMonitoring = asyncHandler(async (req, res) => {
  const uptimeSeconds = Math.floor((Date.now() - SERVER_START) / 1000);
  const dbState = mongoose.connection.readyState;
  const memUsage = process.memoryUsage();
  const errorSummary = getErrorSummary();
  const backups = listBackups();

  res.json({
    success: true,
    data: {
      server: {
        status: 'online',
        uptimeSeconds,
        uptimeFormatted: formatUptime(uptimeSeconds),
        nodeVersion: process.version,
        platform: process.platform,
        memory: {
          heapUsedMB: +(memUsage.heapUsed / 1024 / 1024).toFixed(1),
          heapTotalMB: +(memUsage.heapTotal / 1024 / 1024).toFixed(1),
          rssMB: +(memUsage.rss / 1024 / 1024).toFixed(1),
        },
        cpuUsage: process.cpuUsage(),
      },
      database: {
        status: dbState === 1 ? 'connected' : 'disconnected',
        readyState: dbState,
        host: mongoose.connection.host || 'unknown',
        name: mongoose.connection.name || 'unknown',
      },
      api: {
        status: 'online',
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0',
      },
      errors: errorSummary,
      backups: {
        count: backups.length,
        recent: backups.slice(0, 5),
      },
      timestamp: new Date().toISOString(),
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Trigger a database backup
// @route   POST /api/admin/system/backup
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
export const triggerDatabaseBackup = asyncHandler(async (req, res) => {
  const { label = '' } = req.body;
  logger.info('Manual backup triggered by admin', { adminId: req.user._id });
  const result = await triggerBackup(label);
  res.json({ success: true, data: result });
});

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Format uptime to human-readable string
// ─────────────────────────────────────────────────────────────────────────────
const formatUptime = (seconds) => {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${d}d ${h}h ${m}m ${s}s`;
};
