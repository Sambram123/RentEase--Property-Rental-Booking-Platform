import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiCalendar, FiMapPin, FiHome, FiArrowLeft,
  FiClock, FiCheckCircle, FiXCircle, FiAlertCircle,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import Loader from '../components/Loader';
import { fetchMyBookings, updateBookingStatus } from '../services/bookingService';
import { formatPrice } from '../utils/constants';

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&q=60';

// ─── Status badge config ──────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    icon:  FiClock,
    cls:   'bg-amber-50 text-amber-600 border-amber-200',
  },
  confirmed: {
    label: 'Confirmed',
    icon:  FiCheckCircle,
    cls:   'bg-green-50 text-green-600 border-green-200',
  },
  cancelled: {
    label: 'Cancelled',
    icon:  FiXCircle,
    cls:   'bg-red-50 text-red-500 border-red-200',
  },
  completed: {
    label: 'Completed',
    icon:  FiCheckCircle,
    cls:   'bg-blue-50 text-blue-600 border-blue-200',
  },
};

const PAYMENT_CONFIG = {
  pending: { label: 'Payment pending', cls: 'text-amber-600' },
  paid:    { label: 'Paid',            cls: 'text-green-600' },
  failed:  { label: 'Payment failed',  cls: 'text-red-500'  },
};

// ─── Format date ──────────────────────────────────────────────────────────────
const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

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

// ─── BookingCard ──────────────────────────────────────────────────────────────
const BookingCard = ({ booking, onCancel, cancelling }) => {
  const prop   = booking.property || {};
  const image  = (Array.isArray(prop.images) && prop.images[0]) || PLACEHOLDER;
  const city   = prop.city || prop.address?.city || '';
  const nights = diffDays(booking.checkInDate, booking.checkOutDate);

  const canCancel =
    booking.bookingStatus === 'pending' ||
    booking.bookingStatus === 'confirmed';

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
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
                  Check-in
                </p>
                <p className="mt-1 text-sm font-semibold text-secondary">
                  {fmtDate(booking.checkInDate)}
                </p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
                  Check-out
                </p>
                <p className="mt-1 text-sm font-semibold text-secondary">
                  {fmtDate(booking.checkOutDate)}
                </p>
              </div>
            </div>
          </div>

          {/* Footer row */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted">
                {nights} night{nights !== 1 ? 's' : ''}
              </p>
              <p className="mt-0.5 text-base font-bold text-secondary">
                {formatPrice(booking.totalAmount)}
              </p>
              <p className={`text-xs ${PAYMENT_CONFIG[booking.paymentStatus]?.cls || 'text-muted'}`}>
                {PAYMENT_CONFIG[booking.paymentStatus]?.label}
              </p>
            </div>

            <div className="flex items-center gap-2">
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
                  disabled={cancelling === booking._id}
                  onClick={() => onCancel(booking._id)}
                  className="rounded-xl border border-red-100 px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                >
                  {cancelling === booking._id ? (
                    <span className="h-3 w-3 animate-spin rounded-full border border-red-300 border-t-red-500 inline-block" />
                  ) : (
                    'Cancel'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── MyBookings page ──────────────────────────────────────────────────────────
const MyBookings = () => {
  const [bookings,   setBookings]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [filter,     setFilter]     = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const result = await fetchMyBookings();
      setBookings(result.bookings);
    } catch (err) {
      toast.error(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    setCancelling(id);
    try {
      await updateBookingStatus(id, 'cancelled');
      setBookings((prev) =>
        prev.map((b) => b._id === id ? { ...b, bookingStatus: 'cancelled' } : b)
      );
      toast.success('Booking cancelled');
    } catch (err) {
      toast.error(err.message || 'Failed to cancel');
    } finally {
      setCancelling(null);
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
              onCancel={handleCancel}
              cancelling={cancelling}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
