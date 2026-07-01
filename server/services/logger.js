import { createWriteStream, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';

// ─── Log directory setup ───────────────────────────────────────────────────────
const LOG_DIR = join(__dirname, '..', 'logs');
if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true });

// ─── ANSI color codes (terminal only) ─────────────────────────────────────────
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

const LEVEL_COLORS = {
  error: COLORS.red,
  warn: COLORS.yellow,
  info: COLORS.cyan,
  debug: COLORS.gray,
};

// ─── File streams (append mode) ───────────────────────────────────────────────
const errorStream = createWriteStream(join(LOG_DIR, 'error.log'), { flags: 'a' });
const combinedStream = createWriteStream(join(LOG_DIR, 'combined.log'), { flags: 'a' });

// ─── Core formatter ───────────────────────────────────────────────────────────
const formatEntry = (level, message, meta = {}) => {
  const ts = new Date().toISOString();
  const entry = {
    timestamp: ts,
    level,
    message,
    env: process.env.NODE_ENV || 'development',
    ...meta,
  };
  return JSON.stringify(entry);
};

const log = (level, message, meta = {}) => {
  const json = formatEntry(level, message, meta);

  // Always write to combined log file
  combinedStream.write(json + '\n');

  // Errors also go to error.log
  if (level === 'error') errorStream.write(json + '\n');

  // Console output — colorized in dev, plain JSON in prod
  if (isProduction) {
    if (level !== 'debug') process.stdout.write(json + '\n');
  } else {
    const color = LEVEL_COLORS[level] || '';
    const tag = `${color}[${level.toUpperCase()}]${COLORS.reset}`;
    const metaStr = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
    console.log(`${COLORS.gray}${new Date().toISOString()}${COLORS.reset} ${tag} ${message}${metaStr}`);
  }
};

// ─── Public API ───────────────────────────────────────────────────────────────
const logger = {
  info:  (message, meta = {}) => log('info',  message, meta),
  warn:  (message, meta = {}) => log('warn',  message, meta),
  error: (message, meta = {}) => log('error', message, meta),
  debug: (message, meta = {}) => log('debug', message, meta),

  // Domain-specific helpers
  http:  (method, url, status, ms) =>
    log('info', 'HTTP Request', { method, url, status, responseTimeMs: ms }),

  auth:  (event, userId, meta = {}) =>
    log('info', `Auth: ${event}`, { userId, ...meta }),

  payment: (event, orderId, meta = {}) =>
    log('info', `Payment: ${event}`, { orderId, ...meta }),

  critical: (message, meta = {}) =>
    log('error', `CRITICAL: ${message}`, meta),
};

export default logger;
