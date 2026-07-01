// ─── In-memory error event store (ring-buffer, last 500 entries) ──────────────
const MAX_EVENTS = 500;
const errorEvents = [];

let counters = {
  apiFailures: 0,
  paymentFailures: 0,
  emailFailures: 0,
  authFailures: 0,
  total: 0,
};

// ─── Record an error event ────────────────────────────────────────────────────
const trackError = (type, { route = null, message = '', meta = {} } = {}) => {
  const event = {
    id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    type,          // 'api' | 'payment' | 'email' | 'auth' | 'frontend' | 'other'
    route,
    message,
    meta,
  };

  // Ring-buffer: drop oldest when full
  if (errorEvents.length >= MAX_EVENTS) errorEvents.shift();
  errorEvents.push(event);

  // Increment counters
  counters.total += 1;
  if (type === 'payment')  counters.paymentFailures += 1;
  else if (type === 'email') counters.emailFailures += 1;
  else if (type === 'auth')  counters.authFailures  += 1;
  else                       counters.apiFailures   += 1;
};

// ─── Query helpers ────────────────────────────────────────────────────────────
const getRecentErrors = (limit = 50) =>
  [...errorEvents].reverse().slice(0, limit);

const getErrorSummary = () => ({
  ...counters,
  recentErrors: getRecentErrors(10),
});

const resetCounters = () => {
  counters = { apiFailures: 0, paymentFailures: 0, emailFailures: 0, authFailures: 0, total: 0 };
};

export { trackError, getRecentErrors, getErrorSummary, resetCounters };
