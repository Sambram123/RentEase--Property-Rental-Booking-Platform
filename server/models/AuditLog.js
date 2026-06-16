import mongoose from 'mongoose';

// ─────────────────────────────────────────────────────────────────────────────
// AuditLog Schema — tracks important actions for security & compliance
// ─────────────────────────────────────────────────────────────────────────────
const auditLogSchema = new mongoose.Schema(
  {
    // Who performed the action (null for anonymous/failed auth)
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Action category
    action: {
      type: String,
      required: true,
      enum: [
        // Auth
        'login_success',
        'login_failed',
        'register',
        'firebase_auth',
        'logout',
        'token_invalid',
        // User
        'profile_update',
        'password_change',
        'avatar_update',
        'account_delete',
        // Booking
        'booking_create',
        'booking_cancel',
        'booking_update',
        // Payment
        'payment_create_order',
        'payment_verified',
        'payment_failed',
        // Refund
        'refund_request',
        'refund_approve',
        'refund_reject',
        'refund_process',
        // Property
        'property_create',
        'property_update',
        'property_delete',
        // Admin
        'admin_user_update',
        'admin_user_delete',
        'admin_property_update',
        'admin_property_delete',
        'admin_review_delete',
        'admin_refund_update',
        // Security events
        'rate_limit_hit',
        'unauthorized_access',
        'suspicious_activity',
      ],
      index: true,
    },

    // Resource type and ID
    resource: {
      type: {
        type: String,
        enum: ['User', 'Booking', 'Payment', 'Refund', 'Property', 'Review', 'Message', 'System'],
      },
      id: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },
    },

    // IP address of the request
    ipAddress: {
      type: String,
      default: null,
    },

    // User-agent / device info
    userAgent: {
      type: String,
      default: null,
    },

    // Additional context data (flexible)
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Whether the action succeeded
    success: {
      type: Boolean,
      default: true,
    },

    // Optional error message for failed actions
    errorMessage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    // Auto-expire logs after 90 days (TTL index)
    expireAfterSeconds: 90 * 24 * 60 * 60,
  }
);

// Index for efficient queries
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ actor: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ ipAddress: 1, createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
