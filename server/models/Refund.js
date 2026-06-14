import mongoose from 'mongoose';

const refundSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Refund must be linked to a booking'],
    },

    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Refund must be linked to a property'],
    },

    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Refund must have a tenant'],
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Refund must have an owner'],
    },

    refundAmount: {
      type: Number,
      required: [true, 'Refund amount is required'],
      min: [0, 'Refund amount cannot be negative'],
    },

    refundPercentage: {
      type: Number,
      required: [true, 'Refund percentage is required'],
      min: 0,
      max: 100,
    },

    originalAmount: {
      type: Number,
      required: [true, 'Original payment amount is required'],
    },

    refundReason: {
      type: String,
      required: [true, 'Refund reason is required'],
      maxlength: 500,
    },

    cancellationPolicy: {
      type: String,
      enum: ['flexible', 'moderate', 'strict'],
      required: true,
    },

    daysBeforeCheckIn: {
      type: Number,
      required: true,
    },

    refundStatus: {
      type: String,
      enum: {
        values: ['requested', 'approved', 'rejected', 'processed'],
        message: '{VALUE} is not a valid refund status',
      },
      default: 'requested',
    },

    adminNote: {
      type: String,
      maxlength: 500,
      default: null,
    },

    requestedAt: {
      type: Date,
      default: Date.now,
    },

    processedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
refundSchema.index({ booking: 1 });
refundSchema.index({ tenant: 1 });
refundSchema.index({ owner: 1 });
refundSchema.index({ refundStatus: 1 });
refundSchema.index({ requestedAt: -1 });

const Refund = mongoose.model('Refund', refundSchema);

export default Refund;
