/**
 * CacheService — In-memory LRU-like cache with TTL support.
 * Designed for easy Redis migration: just swap the get/set/del implementation.
 *
 * Usage:
 *   import cache from './cacheService.js';
 *   const val = await cache.get(key);
 *   await cache.set(key, value, ttlSeconds);
 *   await cache.del(key);
 *   await cache.invalidatePattern('dashboard:*');
 */

class MemoryCache {
  constructor({ maxSize = 500 } = {}) {
    this.store = new Map();       // key → { value, expiresAt }
    this.maxSize = maxSize;
    this.hits   = 0;
    this.misses = 0;

    // Periodic cleanup every 5 minutes to evict stale entries
    this._cleanupTimer = setInterval(() => this._cleanup(), 5 * 60 * 1000);
    if (this._cleanupTimer.unref) this._cleanupTimer.unref(); // don't block process exit
  }

  /** Get a cached value. Returns null on miss/expiry. */
  async get(key) {
    const entry = this.store.get(key);
    if (!entry) { this.misses++; return null; }

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.value;
  }

  /** Set a cached value with optional TTL in seconds (default: no expiry). */
  async set(key, value, ttlSeconds = 0) {
    // Evict oldest entry if at capacity
    if (this.store.size >= this.maxSize && !this.store.has(key)) {
      const firstKey = this.store.keys().next().value;
      this.store.delete(firstKey);
    }

    this.store.set(key, {
      value,
      expiresAt: ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null,
    });
  }

  /** Delete a single key. */
  async del(key) {
    this.store.delete(key);
  }

  /** Invalidate all keys matching a prefix pattern (e.g. 'dashboard:*'). */
  async invalidatePattern(pattern) {
    const prefix = pattern.endsWith('*')
      ? pattern.slice(0, -1)
      : pattern;

    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }

  /** Get cache statistics. */
  stats() {
    const total = this.hits + this.misses;
    return {
      size: this.store.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? ((this.hits / total) * 100).toFixed(1) + '%' : '0%',
    };
  }

  /** Flush all cached entries. */
  async flush() {
    this.store.clear();
  }

  /** Internal: remove expired entries. */
  _cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

// ─── Singleton instance ───────────────────────────────────────────────────────
const cache = new MemoryCache({ maxSize: 1000 });

// ─── TTL presets (seconds) ────────────────────────────────────────────────────
export const TTL = {
  SHORT:      30,      // 30 s  — real-time-ish data (unread counts)
  MEDIUM:     5 * 60,  // 5 min — dashboard summaries
  LONG:       15 * 60, // 15 min — trending/featured properties
  VERY_LONG:  60 * 60, // 1 hr  — rarely changing data (admin stats counts)
};

// ─── Cached-fetch helper ──────────────────────────────────────────────────────
/**
 * Get from cache or compute + cache the result.
 * @param {string}   key         Cache key
 * @param {Function} fn          Async factory function
 * @param {number}   ttl         TTL in seconds
 */
export const getOrSet = async (key, fn, ttl = TTL.MEDIUM) => {
  const cached = await cache.get(key);
  if (cached !== null) return cached;

  const value = await fn();
  await cache.set(key, value, ttl);
  return value;
};

export default cache;
