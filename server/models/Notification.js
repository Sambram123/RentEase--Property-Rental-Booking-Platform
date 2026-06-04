import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notification must have a recipient'],
      index: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    type: {
      type: String,
      enum: {
        values: [
          'booking_created',
          'booking_confirmed',
          'booking_cancelled',
          'booking_completed',
          'payment_success',
          'payment_failed',
          'review_added',
          'property_listed',
          'system',
        ],
        message: '{VALUE} is not a valid notification type',
      },
      required: [true, 'Notification type is required'],
    },

    title: {
      type: String,
      required: [true, 'Notification title is required'],
      maxlength: 200,
    },

    message: {
      type: String,
      required: [true, 'Notification message is required'],
      maxlength: 500,
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    referenceType: {
      type: String,
      enum: ['Booking', 'Payment', 'Property', 'Review', null],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Compound indexes ──────────────────────────────────────────────────────────
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
