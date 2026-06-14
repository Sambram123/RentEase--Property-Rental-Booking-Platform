import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiCalendar, FiMapPin, FiHome, FiArrowLeft,
  FiClock, FiCheckCircle, FiXCircle, FiAlertCircle,
  FiCreditCard, FiRefreshCw, FiInfo, FiX, FiAlertTriangle,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import Loader from '../components/Loader';
import { fetchMyBookings } from '../services/bookingService';
import { fetchMyRefunds, fetchRefundEstimate, cancelBookingWithRefund } from '../services/refundService';
import { createPaymentOrder, verifyPayment } from '../services/paymentService';
import { openRazorpayCheckout } from '../utils/razorpayCheckout';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../utils/constants';

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&q=60';

// ─── Status badge config ──────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending:   { label: 'Pending',   icon: FiClock,       cls: 'bg-amber-50 text-amber-600 border-amber-200' },
  confirmed: { label: 'Confirmed', icon: FiCheckCircle, cls: 'bg-green-50 text-green-600 border-green-200' },
  cancelled: { label: 'Cancelled', icon: FiXCircle,     cls: 'bg-red-50 text-red-500 border-red-200' },
  completed: { label: 'Completed', icon: FiCheckCircle, cls: 'bg-blue-50 text-blue-600 border-blue-200' },
};

const REFUND_STATUS_CONFIG = {
  requested: { label: 'Refund Requested', cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: FiClock },
  approved:  { label: 'Refund Approved',  cls: 'bg-green-50 text-green-700 border-green-200', icon: FiCheckCircle },
  rejected:  { label: 'Refund Rejected',  cls: 'bg-red-50 text-red-600 border-red-200',       icon: FiXCircle },
  processed: { label: 'Refund Processed', cls: 'bg-blue-50 text-blue-700 border-blue-200',    icon: FiRefreshCw },
};

const PAYMENT_CONFIG = {
  pending: { label: 'Payment pending', cls: 'text-amber-600' },
  paid:    { label: 'Paid',            cls: 'text-green-600' },
  failed:  { label: 'Payment failed',  cls: 'text-red-500'  },
};

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const diffDays = (a, b) =>
  Math.ceil((new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24));

// ─── StatusBadge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${cfg.cls}`}>
      <Icon className="h-3.5 w-3.5" />
      {cfg.label}
    </span>
  );
};

// ─── RefundBadge ──────────────────────────────────────────────────────────────
const RefundBadge = ({ status }) => {
  const cfg = REFUND_STATUS_CONFIG[status];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${cfg.cls}`}>
      <Icon className="h-3.5 w-3.5" />
      {cfg.label}
    </span>
  );
};

// ─── Cancellation Modal ───────────────────────────────────────────────────────
const CancelModal = ({ booking, estimate, loadingEstimate, onConfirm, onClose, cancelling }) => {
  const [reason, setReason] = useState('');

  const REASONS = [
    'Change of plans',
    'Found a better option',
    'Financial reasons',
    'Emergency / personal reasons',
    'Property not as described',
    'Other',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl animate-in fade-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50">
              <FiAlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-secondary">Cancel Booking</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-gray-100">
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Property info */}
          <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3">
            <p className="font-semibold text-secondary text-sm">{booking.property?.title}</p>
            <p className="text-xs text-muted mt-0.5">
              {fmtDate(booking.checkInDate)} → {fmtDate(booking.checkOutDate)}
            </p>
          </div>

          {/* Refund estimate */}
          {loadingEstimate ? (
            <div className="flex items-center gap-2 rounded-xl bg-blue-50 p-3 text-sm text-blue-700">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-300 border-t-blue-700" />
              Calculating refund...
            </div>
          ) : estimate ? (
            <div className={`rounded-xl border p-4 ${estimate.refundPercentage > 0 ? 'border-green-200 bg-green-50' : 'border-red-100 bg-red-50'}`}>
              <div className="flex items-center gap-2 mb-2">
                <FiInfo className={`h-4 w-4 ${estimate.refundPercentage > 0 ? 'text-green-600' : 'text-red-500'}`} />
                <p className="text-sm font-semibold text-secondary">Refund Estimate</p>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Amount paid</span>
                  <span className="font-medium text-secondary">{formatPrice(estimate.paidAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Refund %</span>
                  <span className="font-medium text-secondary">{estimate.refundPercentage}%</span>
                </div>
                <div className="flex justify-between text-sm border-t border-dashed border-gray-200 pt-1.5 mt-1.5">
                  <span className="font-semibold text-secondary">Refund amount</span>
                  <span className={`font-bold text-base ${estimate.refundPercentage > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {formatPrice(estimate.refundAmount)}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted">{estimate.breakdown}</p>
              <p className="mt-1 text-xs text-muted">Policy: <span className="capitalize font-medium">{estimate.policy}</span> · {estimate.daysBeforeCheckIn} days before check-in</p>
            </div>
          ) : null}

          {/* Reason */}
          <div>
            <label className="mb-2 block text-sm font-medium text-secondary">
              Cancellation reason <span className="text-red-400">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-secondary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              id="cancel-reason"
            >
              <option value="">Select a reason…</option>
              {REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-gray-100 px-6 py-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-secondary transition hover:bg-gray-50"
          >
            Keep booking
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={!reason || cancelling}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
            id="confirm-cancel-btn"
          >
            {cancelling ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <FiXCircle className="h-4 w-4" />
            )}
            Cancel booking
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Refund Card ──────────────────────────────────────────────────────────────
const RefundCard = ({ refund }) => {
  const cfg = REFUND_STATUS_CONFIG[refund.refundStatus] || REFUND_STATUS_CONFIG.requested;
  const Icon = cfg.icon;
  return (
    <div className="rounded-xl border border-gray-100 bg-gradient-to-r from-blue-50/30 to-indigo-50/30 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
            <FiRefreshCw className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-sm font-semibold text-secondary">Refund Tracking</p>
        </div>
        <RefundBadge status={refund.refundStatus} />
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted">Refund Amount</p>
          <p className="font-bold text-lg text-blue-600">{formatPrice(refund.refundAmount)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Refund %</p>
          <p className="font-semibold text-secondary">{refund.refundPercentage}%</p>
        </div>
        <div>
          <p className="text-xs text-muted">Policy</p>
          <p className="font-medium text-secondary capitalize">{refund.cancellationPolicy}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Requested</p>
          <p className="font-medium text-secondary">{fmtDate(refund.requestedAt)}</p>
        </div>
      </div>
      {refund.adminNote && (
        <div className="mt-3 rounded-lg bg-white border border-gray-100 px-3 py-2 text-xs text-muted">
          <span className="font-medium text-secondary">Note: </span>{refund.adminNote}
        </div>
      )}
      {refund.processedAt && (
        <p className="mt-2 text-xs text-muted">Processed: {fmtDate(refund.processedAt)}</p>
      )}
    </div>
  );
};

// ─── BookingCard ──────────────────────────────────────────────────────────────
const BookingCard = ({ booking, refundsMap, onCancelClick, onPay, paying }) => {
  const prop   = booking.property || {};
  const image  = (Array.isArray(prop.images) && prop.images[0]) || PLACEHOLDER;
  const city   = prop.city || prop.address?.city || '';
  const nights = diffDays(booking.checkInDate, booking.checkOutDate);
  const refund = refundsMap[booking._id];

  const canCancel =
    booking.bookingStatus === 'pending' || booking.bookingStatus === 'confirmed';

  const canPay =
    booking.paymentStatus === 'pending' &&
    booking.bookingStatus !== 'cancelled';

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md">
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        <div className="relative h-44 shrink-0 sm:h-auto sm:w-48">
          <img
            src={image}
            alt={prop.title}
            className="h-full w-full object-cover"
            onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
          />
          {booking.bookingStatus === 'cancelled' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">Cancelled</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col justify-between p-5">
          <div>
            <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="line-clamp-1 font-semibold text-secondary">
                  {prop.title || 'Property'}
                </h3>
                {city && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                    <FiMapPin className="h-3 w-3" /> {city}
                  </p>
                )}
              </div>
              <StatusBadge status={booking.bookingStatus} />
            </div>

            {/* Dates */}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted">Check-in</p>
                <p className="mt-1 text-sm font-semibold text-secondary">{fmtDate(booking.checkInDate)}</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted">Check-out</p>
                <p className="mt-1 text-sm font-semibold text-secondary">{fmtDate(booking.checkOutDate)}</p>
              </div>
            </div>

            {/* Cancellation info */}
            {booking.bookingStatus === 'cancelled' && booking.cancellationReason && (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50/50 p-3">
                <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                <div>
                  <p className="text-xs font-medium text-red-700">Reason: {booking.cancellationReason}</p>
                  {booking.cancelledAt && (
                    <p className="text-xs text-muted mt-0.5">Cancelled: {fmtDate(booking.cancelledAt)}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer row */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted">{nights} night{nights !== 1 ? 's' : ''}</p>
              <p className="mt-0.5 text-base font-bold text-secondary">{formatPrice(booking.totalAmount)}</p>
              <p className={`text-xs ${PAYMENT_CONFIG[booking.paymentStatus]?.cls || 'text-muted'}`}>
                {PAYMENT_CONFIG[booking.paymentStatus]?.label}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {canPay && (
                <button
                  type="button"
                  disabled={paying === booking._id}
                  onClick={() => onPay(booking)}
                  className="flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-medium text-white transition hover:bg-primary-dark disabled:opacity-50"
                >
                  {paying === booking._id ? (
                    <span className="h-3 w-3 animate-spin rounded-full border border-white/40 border-t-white" />
                  ) : (
                    <FiCreditCard className="h-3.5 w-3.5" />
                  )}
                  Pay advance
                </button>
              )}
              <Link
                to={`/properties/${prop._id || prop}`}
                className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-medium text-secondary transition hover:bg-gray-50"
              >
                <FiHome className="mr-1 inline h-3.5 w-3.5" />
                View property
              </Link>

              {canCancel && (
                <button
                  type="button"
                  onClick={() => onCancelClick(booking)}
                  className="rounded-xl border border-red-100 px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50"
                  id={`cancel-booking-${booking._id}`}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Refund tracking section */}
      {refund && (
        <div className="border-t border-gray-100 px-5 py-4">
          <RefundCard refund={refund} />
        </div>
      )}
    </div>
  );
};

// ─── MyBookings page ──────────────────────────────────────────────────────────
const MyBookings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings,   setBookings]   = useState([]);
  const [refundsMap, setRefundsMap] = useState({});
  const [loading,    setLoading]    = useState(true);
  const [paying,     setPaying]     = useState(null);
  const [filter,     setFilter]     = useState('all');

  // Cancel modal state
  const [cancelModal, setCancelModal]       = useState(null); // booking object
  const [cancelEstimate, setCancelEstimate] = useState(null);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [cancelling, setCancelling]         = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bookingResult, refundResult] = await Promise.all([
        fetchMyBookings(),
        fetchMyRefunds().catch(() => ({ refunds: [] })),
      ]);
      setBookings(bookingResult.bookings);
      // Map refunds by booking._id
      const map = {};
      (refundResult.refunds || []).forEach((r) => {
        const bId = r.booking?._id || r.booking;
        if (bId) map[bId] = r;
      });
      setRefundsMap(map);
    } catch (err) {
      toast.error(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handlePay = async (booking) => {
    const prop = booking.property || {};
    setPaying(booking._id);
    try {
      const orderData = await createPaymentOrder(booking._id);
      const response = await openRazorpayCheckout({
        orderId: orderData.orderId,
        amount: orderData.amount,
        keyId: orderData.keyId,
        user,
        propertyTitle: prop.title,
      });
      const verified = await verifyPayment({
        bookingId: booking._id,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      });
      setBookings((prev) =>
        prev.map((b) =>
          b._id === booking._id
            ? { ...b, paymentStatus: 'paid', bookingStatus: verified.booking?.bookingStatus || 'confirmed', advancePaid: orderData.amount }
            : b
        )
      );
      toast.success('Payment successful!');
      navigate('/payment/success', {
        state: {
          bookingId: booking._id,
          paymentId: response.razorpay_payment_id,
          orderId: response.razorpay_order_id,
          amount: orderData.amount,
          property: { title: prop.title },
        },
      });
    } catch (err) {
      if (err.code !== 'PAYMENT_CANCELLED') {
        toast.error(err.message || 'Payment failed');
        navigate('/payment/failed', {
          state: {
            message: err.message,
            bookingId: booking._id,
            amount: booking.totalAmount,
            propertyTitle: prop.title,
            retryPath: '/my-bookings',
          },
        });
      }
    } finally {
      setPaying(null);
    }
  };

  // Open cancel modal and fetch estimate
  const openCancelModal = async (booking) => {
    setCancelModal(booking);
    setCancelEstimate(null);
    if (booking.advancePaid > 0) {
      setLoadingEstimate(true);
      try {
        const estimate = await fetchRefundEstimate(booking._id);
        setCancelEstimate(estimate);
      } catch {
        // skip estimate on error
      } finally {
        setLoadingEstimate(false);
      }
    }
  };

  const handleConfirmCancel = async (reason) => {
    if (!cancelModal) return;
    setCancelling(true);
    try {
      const result = await cancelBookingWithRefund(cancelModal._id, reason);
      setBookings((prev) =>
        prev.map((b) =>
          b._id === cancelModal._id
            ? {
                ...b,
                bookingStatus: 'cancelled',
                cancellationStatus: result.booking?.cancellationStatus || 'requested',
                cancellationReason: reason,
                cancelledAt: new Date().toISOString(),
              }
            : b
        )
      );
      if (result.refund) {
        setRefundsMap((prev) => ({ ...prev, [cancelModal._id]: result.refund }));
        toast.success(`Booking cancelled. Refund of ${formatPrice(result.refund.refundAmount)} requested!`);
      } else {
        toast.success('Booking cancelled successfully');
      }
      setCancelModal(null);
    } catch (err) {
      toast.error(err.message || 'Failed to cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  const FILTER_TABS = [
    { key: 'all',       label: 'All' },
    { key: 'pending',   label: 'Pending' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  const visible = filter === 'all'
    ? bookings
    : bookings.filter((b) => b.bookingStatus === filter);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Link
          to="/dashboard"
          className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-primary"
        >
          <FiArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
        <span className="text-muted">/</span>
        <h1 className="text-2xl font-bold text-secondary">My bookings</h1>
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => {
          const count = tab.key === 'all'
            ? bookings.length
            : bookings.filter((b) => b.bookingStatus === tab.key).length;
          return (
            <button
              key={tab.key}
              id={`filter-tab-${tab.key}`}
              onClick={() => setFilter(tab.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                filter === tab.key
                  ? 'bg-primary text-white shadow-sm'
                  : 'border border-gray-200 bg-white text-secondary hover:bg-gray-50'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`ml-1.5 text-xs ${filter === tab.key ? 'text-white/80' : 'text-muted'}`}>
                  ({count})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Refund summary banner */}
      {Object.keys(refundsMap).length > 0 && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-3">
          <FiRefreshCw className="h-5 w-5 text-blue-600" />
          <div>
            <p className="text-sm font-semibold text-blue-800">
              You have {Object.keys(refundsMap).length} refund{Object.keys(refundsMap).length > 1 ? 's' : ''} in progress
            </p>
            <p className="text-xs text-blue-600">Scroll down to see refund details on each cancelled booking</p>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader size="lg" />
        </div>
      ) : visible.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
          <FiCalendar className="h-12 w-12 text-gray-200" />
          <h2 className="text-lg font-semibold text-secondary">
            {filter === 'all' ? 'No bookings yet' : `No ${filter} bookings`}
          </h2>
          <p className="max-w-xs text-sm text-muted">
            {filter === 'all'
              ? 'Find a property and make your first booking!'
              : 'Try switching to a different filter.'}
          </p>
          {filter === 'all' && (
            <Link
              to="/properties"
              className="mt-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
            >
              Browse properties
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((booking) => (
            <BookingCard
              key={booking._id}
              booking={booking}
              refundsMap={refundsMap}
              onCancelClick={openCancelModal}
              onPay={handlePay}
              paying={paying}
            />
          ))}
        </div>
      )}

      {/* Cancellation modal */}
      {cancelModal && (
        <CancelModal
          booking={cancelModal}
          estimate={cancelEstimate}
          loadingEstimate={loadingEstimate}
          onConfirm={handleConfirmCancel}
          onClose={() => { setCancelModal(null); setCancelEstimate(null); }}
          cancelling={cancelling}
        />
      )}
    </div>
  );
};

export default MyBookings;
