import AuditLog from '../models/AuditLog.js';

// ─────────────────────────────────────────────────────────────────────────────
// Reusable audit logging service
// Usage: await audit(req, { action, resource, metadata, success, errorMessage })
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {import('express').Request} req  - Express request (for IP/UA)
 * @param {Object}  opts
 * @param {string}  opts.action        - AuditLog action enum value
 * @param {string}  [opts.actorId]     - Override actor (default: req.user._id)
 * @param {Object}  [opts.resource]    - { type, id }
 * @param {Object}  [opts.metadata]    - Extra context
 * @param {boolean} [opts.success]     - Default true
 * @param {string}  [opts.errorMessage]
 */
const audit = async (req, opts = {}) => {
  try {
    const {
      action,
      actorId,
      resource = {},
      metadata = {},
      success = true,
      errorMessage = null,
    } = opts;

    // Derive IP — handle proxy headers
    const ipAddress =
      (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
      req.socket?.remoteAddress ||
      null;

    await AuditLog.create({
      actor: actorId ?? req.user?._id ?? null,
      action,
      resource,
      ipAddress,
      userAgent: req.headers['user-agent'] || null,
      metadata,
      success,
      errorMessage,
    });
  } catch (err) {
    // Audit logging must NEVER crash the main flow
    console.error('[AuditLog] Failed to write audit entry:', err.message);
  }
};

/**
 * Convenience: log a failed auth attempt (no req.user set yet)
 */
const auditAuthFailure = async (req, { action, metadata = {}, errorMessage = null } = {}) => {
  await audit(req, {
    actorId: null,
    action,
    resource: { type: 'User' },
    metadata,
    success: false,
    errorMessage,
  });
};

export { audit, auditAuthFailure };
