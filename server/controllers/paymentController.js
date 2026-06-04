import crypto from 'crypto';
import asyncHandler from '../utils/asyncHandler.js';
import { razorpay, keyId } from '../utils/razorpay.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Property from '../models/Property.js';
import User from '../models/User.js';
import { notifyPaymentSuccess, notifyPaymentFailed } from '../socket/socketEvents.js';

// Advance = 30% of total rent, minimum ₹100
const ADVANCE_PERCENT = 0.3;
const MIN_ADVANCE_INR = 100;

const calcAdvanceAmount = (totalAmount) => {
  const advance = Math.round(totalAmount * ADVANCE_PERCENT);
  return Math.max(advance, MIN_ADVANCE_INR);
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Create Razorpay order for booking advance
// @route   POST /api/payments/create-order
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const createOrder = asyncHandler(async (req, res) => {
  const { bookingId } = req.body;

  if (!bookingId) {
    res.status(400);
    throw new Error('bookingId is required');
  }

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_SECRET) {
    res.status(503);
    throw new Error('Payment gateway is not configured on the server');
  }

  const booking = await Booking.findById(bookingId).populate('property', 'title');

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  if (booking.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to pay for this booking');
  }

  if (booking.paymentStatus === 'paid') {
    res.status(400);
    throw new Error('Advance payment already completed for this booking');
  }

  if (booking.paymentStatus === 'failed') {
    booking.paymentStatus = 'pending';
    await booking.save();
  }

  if (booking.bookingStatus === 'cancelled') {
    res.status(400);
    throw new Error('Cannot pay for a cancelled booking');
  }

  const amountInr = calcAdvanceAmount(booking.totalAmount);
  const amountPaise = amountInr * 100;

  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency: 'INR',
    receipt: `bk_${booking._id.toString().slice(-8)}_${Date.now()}`,
    notes: {
      bookingId: booking._id.toString(),
      userId: req.user._id.toString(),
      propertyId: booking.property._id?.toString() || booking.property.toString(),
    },
  });

  // Upsert pending payment record for this order
  await Payment.findOneAndUpdate(
    { razorpayOrderId: order.id },
    {
      user: req.user._id,
      booking: booking._id,
      property: booking.property._id || booking.property,
      razorpayOrderId: order.id,
      amount: amountInr,
      currency: 'INR',
      paymentStatus: 'pending',
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.status(201).json({
    success: true,
    message: 'Payment order created successfully',
    data: {
      orderId: order.id,
      amount: amountInr,
      amountPaise,
      currency: order.currency,
      keyId,
      booking: {
        _id: booking._id,
        totalAmount: booking.totalAmount,
        advanceAmount: amountInr,
        propertyTitle: booking.property?.title,
      },
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Verify Razorpay payment signature and update booking
// @route   POST /api/payments/verify
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const verifyPayment = asyncHandler(async (req, res) => {
  const {
    bookingId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body;

  if (!bookingId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    res.status(400);
    throw new Error(
      'bookingId, razorpay_order_id, razorpay_payment_id, and razorpay_signature are required'
    );
  }

  const booking = await Booking.findById(bookingId);

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  if (booking.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to verify payment for this booking');
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    booking.paymentStatus = 'failed';
    await booking.save();

    await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      { paymentStatus: 'failed', razorpayPaymentId: razorpay_payment_id }
    );

    // ── Notify tenant of failed payment ──────────────────────────────────────
    const io = req.app.get('io');
    if (io) {
      const fullProperty = await Property.findById(booking.property);
      if (fullProperty) {
        notifyPaymentFailed(io, {
          booking,
          tenant: req.user,
          property: fullProperty,
        });
      }
    }

    res.status(400);
    throw new Error('Payment verification failed — invalid signature');
  }

  const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });

  if (!payment) {
    res.status(404);
    throw new Error('Payment record not found for this order');
  }

  const advanceAmount = payment.amount;

  payment.razorpayPaymentId = razorpay_payment_id;
  payment.paymentStatus = 'success';
  payment.transactionDate = new Date();
  await payment.save();

  booking.paymentStatus = 'paid';
  booking.advancePaid = advanceAmount;
  if (booking.bookingStatus === 'pending') {
    booking.bookingStatus = 'confirmed';
  }
  await booking.save();

  const populatedPayment = await Payment.findById(payment._id)
    .populate('booking', 'checkInDate checkOutDate totalAmount bookingStatus paymentStatus')
    .populate('property', 'title city images');

  // ── Notify both tenant and owner of successful payment ────────────────
  const io = req.app.get('io');
  if (io) {
    const fullProperty = await Property.findById(payment.property);
    if (fullProperty) {
      notifyPaymentSuccess(io, {
        payment,
        booking,
        tenant: req.user,
        property: fullProperty,
      });
    }
  }

  res.status(200).json({
    success: true,
    message: 'Payment verified successfully',
    data: {
      payment: populatedPayment,
      booking,
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get logged-in user's payment history
// @route   GET /api/payments/my-payments
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const getMyPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ user: req.user._id })
    .populate('booking', 'checkInDate checkOutDate totalAmount bookingStatus paymentStatus')
    .populate('property', 'title city images')
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    message: 'Payments fetched successfully',
    data: { count: payments.length, payments },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get payments for owner's properties
// @route   GET /api/payments/owner/payments
// @access  Private (owner / admin)
// ─────────────────────────────────────────────────────────────────────────────
const getOwnerPayments = asyncHandler(async (req, res) => {
  if (!['owner', 'admin'].includes(req.user.role)) {
    res.status(403);
    throw new Error('Access denied — property owners only');
  }

  const myProperties = await Property.find({ owner: req.user._id }).select('_id');
  const propertyIds = myProperties.map((p) => p._id);

  const payments = await Payment.find({
    property: { $in: propertyIds },
    paymentStatus: 'success',
  })
    .populate('user', 'name email')
    .populate('booking', 'checkInDate checkOutDate totalAmount bookingStatus paymentStatus')
    .populate('property', 'title city')
    .sort({ transactionDate: -1 })
    .lean();

  const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  res.status(200).json({
    success: true,
    message: 'Owner payments fetched successfully',
    data: { count: payments.length, totalRevenue, payments },
  });
});

export { createOrder, verifyPayment, getMyPayments, getOwnerPayments };
