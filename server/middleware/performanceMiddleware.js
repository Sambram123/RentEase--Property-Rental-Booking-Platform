/**
 * Performance tracking middleware.
 * Records response time, method, route, status per request.
 * Stores last N entries in a ring-buffer for the Admin performance dashboard.
 */

const MAX_RECORDS = 500;
const SLOW_THRESHOLD_MS = 500; // flag requests > 500 ms as slow

const metrics = {
  requests: [],          // ring-buffer of recent requests
  totalRequests: 0,
  totalErrors: 0,
  slowRequests: 0,
  routeSummary: {},      // route → { count, totalMs, errors }
};

/** Middleware: attach to Express before routes. */
const performanceMiddleware = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const route = `${req.method} ${req.route?.path || req.path}`;
    const status = res.statusCode;
    const isError = status >= 400;
    const isSlow  = durationMs > SLOW_THRESHOLD_MS;

    metrics.totalRequests++;
    if (isError) metrics.totalErrors++;
    if (isSlow)  metrics.slowRequests++;

    // Route-level aggregation
    if (!metrics.routeSummary[route]) {
      metrics.routeSummary[route] = { count: 0, totalMs: 0, errors: 0, maxMs: 0 };
    }
    const r = metrics.routeSummary[route];
    r.count++;
    r.totalMs += durationMs;
    r.errors += isError ? 1 : 0;
    r.maxMs = Math.max(r.maxMs, durationMs);

    // Ring-buffer of recent raw records
    if (metrics.requests.length >= MAX_RECORDS) {
      metrics.requests.shift();
    }
    metrics.requests.push({
      method: req.method,
      path: req.path,
      status,
      durationMs,
      isSlow,
      timestamp: new Date().toISOString(),
    });
  });

  next();
};

/** Get aggregated performance report. */
export const getPerformanceReport = () => {
  const uptime = process.uptime();
  const mem    = process.memoryUsage();

  // Top slow routes by average response time
  const routeStats = Object.entries(metrics.routeSummary)
    .map(([route, s]) => ({
      route,
      count: s.count,
      avgMs: Math.round(s.totalMs / s.count),
      maxMs: s.maxMs,
      errors: s.errors,
      errorRate: ((s.errors / s.count) * 100).toFixed(1) + '%',
    }))
    .sort((a, b) => b.avgMs - a.avgMs);

  return {
    server: {
      uptimeSeconds: Math.round(uptime),
      memoryMB: {
        heapUsed:  (mem.heapUsed  / 1024 / 1024).toFixed(1),
        heapTotal: (mem.heapTotal / 1024 / 1024).toFixed(1),
        rss:       (mem.rss       / 1024 / 1024).toFixed(1),
      },
    },
    summary: {
      totalRequests: metrics.totalRequests,
      totalErrors: metrics.totalErrors,
      slowRequests: metrics.slowRequests,
      slowThresholdMs: SLOW_THRESHOLD_MS,
      errorRate: metrics.totalRequests > 0
        ? ((metrics.totalErrors / metrics.totalRequests) * 100).toFixed(1) + '%'
        : '0%',
    },
    topSlowRoutes: routeStats.slice(0, 10),
    recentRequests: metrics.requests.slice(-50).reverse(),
  };
};

/** Reset metrics (useful for testing). */
export const resetMetrics = () => {
  metrics.requests = [];
  metrics.totalRequests = 0;
  metrics.totalErrors = 0;
  metrics.slowRequests = 0;
  metrics.routeSummary = {};
};

export default performanceMiddleware;
