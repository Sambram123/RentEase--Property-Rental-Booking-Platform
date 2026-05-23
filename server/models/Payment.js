import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Payment must belong to a user'],
    },

    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Payment must reference a booking'],
    },

    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Payment must reference a property'],
    },

    razorpayOrderId: {
      type: String,
      required: [true, 'Razorpay order ID is required'],
      trim: true,
    },

    razorpayPaymentId: {
      type: String,
      trim: true,
      default: null,
    },

    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },

    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },

    paymentStatus: {
      type: String,
      enum: {
        values: ['pending', 'success', 'failed'],
        message: '{VALUE} is not a valid payment status',
      },
      default: 'pending',
    },

    transactionDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ booking: 1 });
paymentSchema.index({ razorpayOrderId: 1 }, { unique: true });
paymentSchema.index({ razorpayPaymentId: 1 }, { sparse: true });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
