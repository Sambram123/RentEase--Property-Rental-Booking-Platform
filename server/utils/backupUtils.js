import { execFile } from 'child_process';
import { promisify } from 'util';
import { existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import logger from '../services/logger.js';

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKUP_DIR = join(__dirname, '..', 'backups');

if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true });

// ─── Parse connection parts from MONGO_URI ────────────────────────────────────
const parseMongoUri = (uri) => {
  try {
    const url = new URL(uri);
    return {
      host: url.hostname || '127.0.0.1',
      port: url.port || '27017',
      db:   url.pathname.replace('/', '') || 'rentease',
    };
  } catch {
    return { host: '127.0.0.1', port: '27017', db: 'rentease' };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc   Trigger a mongodump backup
// @return {object} { success, path, timestamp, db }
// ─────────────────────────────────────────────────────────────────────────────
export const triggerBackup = async (label = '') => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const slug = label ? `${label}_${timestamp}` : timestamp;
  const outDir = join(BACKUP_DIR, slug);

  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rentease-dev';
  const { db } = parseMongoUri(uri);

  logger.info('Backup triggered', { label: slug, db });

  try {
    await execFileAsync('mongodump', [
      `--uri=${uri}`,
      `--db=${db}`,
      `--out=${outDir}`,
    ]);
    logger.info('Backup completed', { path: outDir });
    return { success: true, path: outDir, timestamp, db };
  } catch (err) {
    // mongodump may not be installed in dev — log and return graceful response
    logger.warn('Backup skipped (mongodump unavailable or failed)', { error: err.message });
    return { success: false, error: err.message, timestamp };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc   List available backups (synchronous directory scan)
// ─────────────────────────────────────────────────────────────────────────────
export const listBackups = () => {
  try {
    const entries = readdirSync(BACKUP_DIR).map((name) => {
      const stat = statSync(join(BACKUP_DIR, name));
      return { name, createdAt: stat.birthtime, sizeBytes: stat.size };
    });
    return entries.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
};
