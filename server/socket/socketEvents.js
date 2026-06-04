import Notification from '../models/Notification.js';
import { emitToUser } from './socketServer.js';

/**
 * Create a notification in DB and emit it via socket in real-time.
 * @param {import('socket.io').Server} io - Socket.IO server instance
 * @param {Object} opts
 * @param {string} opts.recipient    - User ID of the recipient
 * @param {string} opts.sender       - User ID of the sender (optional)
 * @param {string} opts.type         - Notification type enum
 * @param {string} opts.title        - Short title
 * @param {string} opts.message      - Longer message body
 * @param {string} opts.referenceId  - ID of the related document (optional)
 * @param {string} opts.referenceType - Model name of the reference (optional)
 */
const createAndEmitNotification = async (io, opts) => {
  try {
    const notification = await Notification.create({
      recipient: opts.recipient,
      sender: opts.sender || null,
      type: opts.type,
      title: opts.title,
      message: opts.message,
      referenceId: opts.referenceId || null,
      referenceType: opts.referenceType || null,
    });

    // Populate sender info for the real-time event
    const populated = await notification.populate('sender', 'name avatar');

    // Emit to recipient in real-time
    emitToUser(io, opts.recipient, 'notification', {
      notification: populated,
    });

    // Also emit an unread-count update
    const unreadCount = await Notification.countDocuments({
      recipient: opts.recipient,
      isRead: false,
    });
    emitToUser(io, opts.recipient, 'unread_count', { count: unreadCount });

    return notification;
  } catch (err) {
    console.error('Failed to create notification:', err.message);
    return null;
  }
};

// ─── Booking notification helpers ──────────────────────────────────────────────

const notifyBookingCreated = async (io, { booking, tenant, property }) => {
  // Notify property owner
  await createAndEmitNotification(io, {
    recipient: property.owner.toString(),
    sender: tenant._id.toString(),
    type: 'booking_created',
    title: 'New Booking Request',
    message: `${tenant.name} has requested to book "${property.title}"`,
    referenceId: booking._id,
    referenceType: 'Booking',
  });
};

const notifyBookingConfirmed = async (io, { booking, property, tenantId }) => {
  // Notify tenant
  await createAndEmitNotification(io, {
    recipient: tenantId.toString(),
    sender: property.owner.toString(),
    type: 'booking_confirmed',
    title: 'Booking Confirmed',
    message: `Your booking for "${property.title}" has been confirmed!`,
    referenceId: booking._id,
    referenceType: 'Booking',
  });
};

const notifyBookingCancelled = async (io, { booking, property, cancelledBy, recipientId }) => {
  await createAndEmitNotification(io, {
    recipient: recipientId.toString(),
    sender: cancelledBy.toString(),
    type: 'booking_cancelled',
    title: 'Booking Cancelled',
    message: `A booking for "${property.title}" has been cancelled`,
    referenceId: booking._id,
    referenceType: 'Booking',
  });
};

// ─── Payment notification helpers ──────────────────────────────────────────────

const notifyPaymentSuccess = async (io, { payment, booking, tenant, property }) => {
  // Notify tenant
  await createAndEmitNotification(io, {
    recipient: tenant._id.toString(),
    sender: null,
    type: 'payment_success',
    title: 'Payment Successful',
    message: `Your advance payment of ₹${payment.amount} for "${property.title}" was successful`,
    referenceId: payment._id,
    referenceType: 'Payment',
  });

  // Notify property owner
  await createAndEmitNotification(io, {
    recipient: property.owner.toString(),
    sender: tenant._id.toString(),
    type: 'payment_success',
    title: 'Payment Received',
    message: `${tenant.name} paid ₹${payment.amount} advance for "${property.title}"`,
    referenceId: payment._id,
    referenceType: 'Payment',
  });
};

const notifyPaymentFailed = async (io, { booking, tenant, property }) => {
  // Notify tenant
  await createAndEmitNotification(io, {
    recipient: tenant._id.toString(),
    sender: null,
    type: 'payment_failed',
    title: 'Payment Failed',
    message: `Your payment for "${property.title}" could not be verified. Please try again.`,
    referenceId: booking._id,
    referenceType: 'Booking',
  });
};

// ─── Review notification helpers ───────────────────────────────────────────────

const notifyReviewAdded = async (io, { review, reviewer, property }) => {
  // Notify property owner
  await createAndEmitNotification(io, {
    recipient: property.owner.toString(),
    sender: reviewer._id.toString(),
    type: 'review_added',
    title: 'New Review',
    message: `${reviewer.name} left a ${review.rating}-star review on "${property.title}"`,
    referenceId: review._id,
    referenceType: 'Review',
  });
};

export {
  createAndEmitNotification,
  notifyBookingCreated,
  notifyBookingConfirmed,
  notifyBookingCancelled,
  notifyPaymentSuccess,
  notifyPaymentFailed,
  notifyReviewAdded,
};
