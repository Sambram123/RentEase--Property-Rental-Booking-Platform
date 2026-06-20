import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Booking must belong to a user'],
    },

    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Booking must reference a property'],
    },

    checkInDate: {
      type: Date,
      required: [true, 'Check-in date is required'],
    },

    checkOutDate: {
      type: Date,
      required: [true, 'Check-out date is required'],
    },

    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },

    advancePaid: {
      type: Number,
      default: 0,
      min: [0, 'Advance paid cannot be negative'],
    },

    paymentStatus: {
      type: String,
      enum: {
        values: ['pending', 'paid', 'failed'],
        message: '{VALUE} is not a valid payment status',
      },
      default: 'pending',
    },

    bookingStatus: {
      type: String,
      enum: {
        values: ['pending', 'confirmed', 'cancelled', 'completed'],
        message: '{VALUE} is not a valid booking status',
      },
      default: 'pending',
    },

    cancellationStatus: {
      type: String,
      enum: {
        values: ['none', 'requested', 'processed'],
        message: '{VALUE} is not a valid cancellation status',
      },
      default: 'none',
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancellationReason: {
      type: String,
      maxlength: 500,
      default: null,
    },

    cancelledBy: {
      type: String,
      enum: ['tenant', 'owner', 'admin', null],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Validate check-out is after check-in ─────────────────────────────────────
bookingSchema.pre('save', function (next) {
  if (this.checkOutDate <= this.checkInDate) {
    return next(new Error('Check-out date must be after check-in date'));
  }
  next();
});

// ─── Indexes ─────────────────────────────────────────────────────────────────
// Single field
bookingSchema.index({ user: 1 });
bookingSchema.index({ property: 1 });
bookingSchema.index({ bookingStatus: 1 });
bookingSchema.index({ checkInDate: 1, checkOutDate: 1 });
// Compound indexes
bookingSchema.index({ user: 1, bookingStatus: 1, createdAt: -1 });    // tenant dashboard
bookingSchema.index({ property: 1, bookingStatus: 1, createdAt: -1 }); // owner dashboard
bookingSchema.index({ user: 1, createdAt: -1 });                       // pagination
bookingSchema.index({ property: 1, checkInDate: 1, checkOutDate: 1 }); // availability check
bookingSchema.index({ bookingStatus: 1, createdAt: -1 });              // admin dashboard

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
