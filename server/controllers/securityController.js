import asyncHandler from '../utils/asyncHandler.js';
import AuditLog from '../models/AuditLog.js';

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get security dashboard summary
// @route   GET /api/admin/security/dashboard
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────────────────────────
const getSecurityDashboard = asyncHandler(async (req, res) => {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    failedLoginsLast24h,
    totalLoginsLast24h,
    registrationsLast24h,
    unauthorizedAccessLast24h,
    recentFailedLogins,
    actionBreakdown7d,
    topSuspiciousIPs,
    paymentFailures24h,
  ] = await Promise.all([
    // Failed logins in 24h
    AuditLog.countDocuments({ action: 'login_failed', createdAt: { $gte: since24h } }),

    // Total logins in 24h
    AuditLog.countDocuments({ action: 'login_success', createdAt: { $gte: since24h } }),

    // New registrations in 24h
    AuditLog.countDocuments({ action: 'register', createdAt: { $gte: since24h } }),

    // Unauthorized access attempts in 24h
    AuditLog.countDocuments({ action: 'unauthorized_access', createdAt: { $gte: since24h } }),

    // Recent failed login attempts (last 10)
    AuditLog.find({ action: 'login_failed' })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('actor', 'name email')
      .lean(),

    // Action breakdown over 7 days
    AuditLog.aggregate([
      { $match: { createdAt: { $gte: since7d } } },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    // IPs with most failed logins (potential brute-force)
    AuditLog.aggregate([
      {
        $match: {
          action: 'login_failed',
          createdAt: { $gte: since7d },
          ipAddress: { $ne: null },
        },
      },
      {
        $group: {
          _id: '$ipAddress',
          count: { $sum: 1 },
          lastAttempt: { $max: '$createdAt' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),

    // Payment failures in 24h
    AuditLog.countDocuments({ action: 'payment_failed', createdAt: { $gte: since24h } }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      summary: {
        failedLoginsLast24h,
        totalLoginsLast24h,
        registrationsLast24h,
        unauthorizedAccessLast24h,
        paymentFailures24h,
        loginFailureRate:
          totalLoginsLast24h + failedLoginsLast24h > 0
            ? Math.round(
                (failedLoginsLast24h / (totalLoginsLast24h + failedLoginsLast24h)) * 100
              )
            : 0,
      },
      recentFailedLogins,
      actionBreakdown7d,
      topSuspiciousIPs,
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get paginated audit logs with filters
// @route   GET /api/admin/security/logs
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────────────────────────
const getAuditLogs = asyncHandler(async (req, res) => {
  const { action, success, page = 1, limit = 50, ipAddress } = req.query;

  const filter = {};
  if (action) filter.action = action;
  if (success !== undefined) filter.success = success === 'true';
  if (ipAddress) filter.ipAddress = ipAddress;

  const skip = (Number(page) - 1) * Number(limit);

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('actor', 'name email role')
      .lean(),
    AuditLog.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: {
      logs,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get failed login attempts (for monitoring)
// @route   GET /api/admin/security/failed-logins
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────────────────────────
const getFailedLogins = asyncHandler(async (req, res) => {
  const { hours = 24 } = req.query;
  const since = new Date(Date.now() - Number(hours) * 60 * 60 * 1000);

  const failedLogins = await AuditLog.find({
    action: 'login_failed',
    createdAt: { $gte: since },
  })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  res.status(200).json({
    success: true,
    data: {
      count: failedLogins.length,
      failedLogins,
    },
  });
});

export { getSecurityDashboard, getAuditLogs, getFailedLogins };
