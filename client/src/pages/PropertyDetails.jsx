import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiMapPin, FiHome, FiDroplet, FiStar,
  FiCalendar, FiUser, FiCheckCircle, FiShare2,
  FiHeart, FiEdit2, FiTrash2, FiMessageSquare,
  FiLock, FiChevronLeft, FiChevronRight,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import Loader from '../components/Loader';
import ImageCarousel from '../components/ImageCarousel';
import ConfirmModal from '../components/ConfirmModal';
import StarRating from '../components/StarRating';
import SEO, { buildPropertySchema } from '../components/SEO';
import { fetchPropertyById } from '../services/propertyService';
import { createBooking } from '../services/bookingService';
import { fetchCalendar } from '../services/availabilityService';
import { createPaymentOrder, verifyPayment } from '../services/paymentService';
import { fetchPropertyReviews, createReview, updateReview, deleteReview } from '../services/reviewService';
import { addToWishlist, removeFromWishlist, fetchWishlist } from '../services/wishlistService';
import PropertyMap from '../components/PropertyMap';
import { geoJsonToLatLng } from '../services/mapsService';
import { openRazorpayCheckout } from '../utils/razorpayCheckout';
import { formatPrice, FEATURED_PROPERTIES } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import { createConversation } from '../services/messageService';
import { trackPropertyView, fetchSimilarProperties } from '../services/recommendationService';
import { getFirstImageUrl } from '../utils/imageUtils';

const AMENITY_ICONS = {
  wifi:         { icon: '📶', label: 'WiFi' },
  parking:      { icon: '🅿️', label: 'Parking' },
  furnished:    { icon: '🪑', label: 'Furnished' },
  ac:           { icon: '❄️', label: 'Air Conditioning' },
  gym:          { icon: '💪', label: 'Gym' },
  pool:         { icon: '🏊', label: 'Swimming Pool' },
  security:     { icon: '🔒', label: '24/7 Security' },
  lift:         { icon: '🛗', label: 'Lift / Elevator' },
  power_backup: { icon: '⚡', label: 'Power Backup' },
  garden:       { icon: '🌿', label: 'Garden' },
};

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80';

// ─── Date helpers ─────────────────────────────────────────────────────────────
const toISO = (d) => d.toISOString().split('T')[0];
const today = () => toISO(new Date());

const diffDays = (a, b) =>
  Math.ceil((new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24));

const calcTotal = (pricePerMonth, checkIn, checkOut) => {
  if (!checkIn || !checkOut || checkOut <= checkIn) return 0;
  const days = diffDays(checkIn, checkOut);
  return Math.round((pricePerMonth / 30) * days);
};

// ─── Availability Mini-Calendar helpers ──────────────────────────────────────
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CAL_DAYS     = ['Su','Mo','Tu','We','Th','Fr','Sa'];

const buildGrid = (year, month) => {
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const grid        = [];
  for (let i = 0; i < firstDay; i++) grid.push(null);
  for (let d = 1; d <= daysInMonth; d++) grid.push(new Date(year, month, d));
  return grid;
};

const inRange = (d, s, e) => {
  const date = new Date(d); date.setHours(12, 0, 0, 0);
  const st   = new Date(s); st.setHours(0, 0, 0, 0);
  const en   = new Date(e); en.setHours(23, 59, 59, 999);
  return date >= st && date <= en;
};

const sameDay = (a, b) => {
  const da = new Date(a); const db = new Date(b);
  return da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
};

const getDayStatusPublic = (date, calData) => {
  if (!date) return null;
  const { bookedRanges = [], blockedDates = [], blockedRanges = [] } = calData;
  const today2 = new Date(); today2.setHours(0, 0, 0, 0);
  const d = new Date(date); d.setHours(0, 0, 0, 0);
  if (d < today2) return 'past';
  for (const br of bookedRanges) {
    if (inRange(date, br.startDate, br.endDate)) return 'booked';
  }
  for (const bd of blockedDates) {
    if (sameDay(date, bd.date)) return 'blocked';
  }
  for (const br of blockedRanges) {
    if (inRange(date, br.startDate, br.endDate)) return 'blocked';
  }
  return 'available';
};

// ─── Mini availability calendar ───────────────────────────────────────────────
const AvailabilityMiniCalendar = ({ propertyId, checkIn, checkOut, onDateBlocked }) => {
  const now   = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [calData, setCalData] = useState({ bookedRanges: [], blockedDates: [], blockedRanges: [] });

  useEffect(() => {
    if (!propertyId || /^[0-9]+$/.test(propertyId)) return;
    fetchCalendar(propertyId).then(setCalData).catch(() => {});
  }, [propertyId]);

  const prev = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const next = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const grid = buildGrid(year, month);

  const dayClass = (date) => {
    const status = getDayStatusPublic(date, calData);
    const today2 = new Date(); today2.setHours(0, 0, 0, 0);
    const d = new Date(date); d.setHours(0, 0, 0, 0);
    const isInSelected = checkIn && checkOut && inRange(date, checkIn, checkOut);
    const isCheckIn    = checkIn  && sameDay(date, checkIn);
    const isCheckOut   = checkOut && sameDay(date, checkOut);

    let base = 'flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-all ';
    if (isCheckIn || isCheckOut) return base + 'bg-primary text-white';
    if (isInSelected && status === 'available') return base + 'bg-primary/20 text-primary';
    switch (status) {
      case 'booked':    return base + 'bg-blue-100 text-blue-600 cursor-not-allowed';
      case 'blocked':   return base + 'bg-red-100 text-red-500 cursor-not-allowed line-through';
      case 'past':      return base + 'text-gray-300 cursor-not-allowed';
      default:          return base + 'hover:bg-primary/10 text-gray-700 cursor-default';
    }
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={prev} className="flex h-6 w-6 items-center justify-center rounded-lg text-muted hover:bg-gray-100">
          <FiChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="text-sm font-semibold text-secondary">
          {MONTHS_SHORT[month]} {year}
        </span>
        <button type="button" onClick={next} className="flex h-6 w-6 items-center justify-center rounded-lg text-muted hover:bg-gray-100">
          <FiChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="mb-1 grid grid-cols-7 text-center">
        {CAL_DAYS.map(d => (
          <div key={d} className="text-[9px] font-semibold text-muted">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {grid.map((date, i) => (
          <div key={i} className="flex justify-center">
            {date ? (
              <div className={dayClass(date)}>{date.getDate()}</div>
            ) : (
              <div className="h-7 w-7" />
            )}
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-3 border-t border-gray-50 pt-3">
        {[
          { color: 'bg-gray-50 border border-gray-200', label: 'Available' },
          { color: 'bg-blue-100',  label: 'Booked' },
          { color: 'bg-red-100',   label: 'Blocked' },
          { color: 'bg-primary',   label: 'Selected' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1 text-[10px] text-muted">
            <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── BookingPanel ─────────────────────────────────────────────────────────────
const ADVANCE_PERCENT = 0.3;
const MIN_ADVANCE     = 100;
const calcAdvance = (total) => Math.max(Math.round(total * ADVANCE_PERCENT), MIN_ADVANCE);

const BookingPanel = ({ property, isAuthenticated, navigate, propertyId, user }) => {
  const [checkIn,  setCheckIn]  = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [paying,   setPaying]   = useState(false);
  const [calData,  setCalData]  = useState({ bookedRanges: [], blockedDates: [], blockedRanges: [] });

  // Load availability for validation
  useEffect(() => {
    if (!propertyId || /^[0-9]+$/.test(propertyId)) return;
    fetchCalendar(propertyId).then(setCalData).catch(() => {});
  }, [propertyId]);

  const price       = property.price ?? property.pricePerMonth ?? 0;
  const nights      = checkIn && checkOut ? diffDays(checkIn, checkOut) : 0;
  const totalAmount = useMemo(
    () => calcTotal(price, checkIn, checkOut),
    [price, checkIn, checkOut]
  );

  const isValidRange = checkIn && checkOut && checkOut > checkIn;
  const advanceAmount = isValidRange ? calcAdvance(totalAmount) : 0;

  // ── Check if selected range contains blocked dates ──────────────────────────
  const selectedRangeBlocked = useMemo(() => {
    if (!isValidRange) return false;
    const { bookedRanges = [], blockedDates = [], blockedRanges = [] } = calData;
    const start = new Date(checkIn);  start.setHours(0, 0, 0, 0);
    const end   = new Date(checkOut); end.setHours(23, 59, 59, 999);
    for (const br of bookedRanges) {
      const s = new Date(br.startDate); const e = new Date(br.endDate);
      if (s <= end && e >= start) return true;
    }
    for (const bd of blockedDates) {
      const d = new Date(bd.date); d.setHours(12, 0, 0, 0);
      if (d >= start && d <= end) return true;
    }
    for (const br of blockedRanges) {
      const s = new Date(br.startDate); const e = new Date(br.endDate);
      if (s <= end && e >= start) return true;
    }
    return false;
  }, [isValidRange, checkIn, checkOut, calData]);

  const processPayment = async (booking) => {
    setPaying(true);
    try {
      const orderData = await createPaymentOrder(booking._id);

      const response = await openRazorpayCheckout({
        orderId: orderData.orderId,
        amount: orderData.amount,
        keyId: orderData.keyId,
        user,
        propertyTitle: property.title,
      });

      const verified = await verifyPayment({
        bookingId: booking._id,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      });

      toast.success('Payment successful! Booking confirmed.');
      navigate('/payment/success', {
        state: {
          bookingId: booking._id,
          booking: verified.booking,
          paymentId: response.razorpay_payment_id,
          orderId: response.razorpay_order_id,
          amount: orderData.amount,
          property: { title: property.title },
        },
      });
    } catch (err) {
      if (err.code === 'PAYMENT_CANCELLED') {
        toast.error('Payment cancelled');
        navigate('/my-bookings');
        return;
      }
      toast.error(err.message || 'Payment failed');
      navigate('/payment/failed', {
        state: {
          message: err.message,
          bookingId: booking._id,
          amount: advanceAmount,
          propertyTitle: property.title,
          retryPath: `/properties/${propertyId}`,
        },
      });
    } finally {
      setPaying(false);
    }
  };

  const handleBook = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to book this property');
      navigate('/login', { state: { from: { pathname: `/properties/${propertyId}` } } });
      return;
    }
    if (!checkIn || !checkOut) {
      toast.error('Please select check-in and check-out dates');
      return;
    }
    if (checkOut <= checkIn) {
      toast.error('Check-out must be after check-in');
      return;
    }
    if (selectedRangeBlocked) {
      toast.error('Selected dates include blocked or booked periods. Please choose different dates.');
      return;
    }

    setLoading(true);
    try {
      const booking = await createBooking({ propertyId, checkInDate: checkIn, checkOutDate: checkOut });
      toast.success('Booking created — opening payment…');
      await processPayment(booking);
    } catch (err) {
      toast.error(err.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">
        {/* Price header */}
        <div className="mb-5">
          <p className="text-3xl font-bold text-secondary">
            {formatPrice(price)}
          </p>
          <p className="text-sm text-muted">per month</p>
        </div>

        {/* Date pickers */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Check-in
            </label>
            <input
              type="date"
              min={today()}
              value={checkIn}
              onChange={(e) => {
                setCheckIn(e.target.value);
                if (checkOut && e.target.value >= checkOut) setCheckOut('');
              }}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Check-out
            </label>
            <input
              type="date"
              min={checkIn || today()}
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              disabled={!checkIn}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            />
          </div>
        </div>

        {/* Blocked warning */}
        {selectedRangeBlocked && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-600">
            <FiLock className="h-3.5 w-3.5 shrink-0" />
            Selected dates include blocked or booked periods
          </div>
        )}

        {/* Summary */}
        {isValidRange && !selectedRangeBlocked && (
          <div className="mb-4 space-y-2 rounded-xl border border-gray-100 bg-gray-50/60 p-4 text-sm">
            <div className="flex justify-between text-muted">
              <span>
                {formatPrice(price)} × {nights} night{nights !== 1 ? 's' : ''}
              </span>
              <span className="font-medium text-secondary">{formatPrice(totalAmount)}</span>
            </div>
            <div className="flex justify-between font-semibold text-secondary">
              <span>Total</span>
              <span className="text-primary">{formatPrice(totalAmount)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Advance due now (30%)</span>
              <span className="font-medium text-secondary">{formatPrice(advanceAmount)}</span>
            </div>
          </div>
        )}

        {/* Key details */}
        <ul className="mb-5 space-y-1.5 text-sm">
          {[
            ['Type',      property.type ? property.type.charAt(0).toUpperCase() + property.type.slice(1) : '—'],
            ['Bedrooms',  property.bedrooms],
            ['Bathrooms', property.bathrooms],
            ['City',      property.city || property.address?.city],
          ].map(([label, val]) => (
            <li key={label} className="flex justify-between border-b border-gray-50 py-1.5">
              <span className="text-muted">{label}</span>
              <span className="font-medium capitalize text-secondary">{val}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button
          type="button"
          onClick={handleBook}
          disabled={loading || paying || !property.availability || !isValidRange || selectedRangeBlocked}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {(loading || paying) ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            <FiCalendar className="h-4 w-4" />
          )}
          {loading
            ? 'Creating booking…'
            : paying
              ? 'Processing payment…'
              : selectedRangeBlocked
                ? 'Dates unavailable'
                : property.availability
                  ? 'Book & pay advance'
                  : 'Not available'}
        </button>

        {!isAuthenticated && (
          <p className="mt-3 text-center text-xs text-muted">
            <Link to="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>{' '}
            to book this property
          </p>
        )}

        <p className="mt-3 text-center text-xs text-muted">
          Pay a 30% advance via Razorpay to confirm your booking instantly.
        </p>
      </div>

      {/* Availability mini-calendar */}
      {property._id && !/^[0-9]+$/.test(property._id) && (
        <AvailabilityMiniCalendar
          propertyId={property._id}
          checkIn={checkIn}
          checkOut={checkOut}
        />
      )}
    </div>
  );
};


// ─── ReviewSection ────────────────────────────────────────────────────────────
const ReviewSection = ({ propertyId, isAuthenticated, currentUserId }) => {
  const [reviews, setReviews]           = useState([]);
  const [averageRating, setAvgRating]   = useState(0);
  const [loadingReviews, setLoadingR]   = useState(true);
  const [newRating, setNewRating]       = useState(0);
  const [newComment, setNewComment]     = useState('');
  const [submitting, setSubmitting]     = useState(false);
  const [editingId, setEditingId]       = useState(null);
  const [editRating, setEditRating]     = useState(0);
  const [editComment, setEditComment]   = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const loadReviews = useCallback(async () => {
    if (!propertyId || /^[0-9]+$/.test(propertyId)) return; // skip mock IDs
    try {
      const data = await fetchPropertyReviews(propertyId);
      setReviews(data.reviews);
      setAvgRating(data.averageRating);
    } catch { /* ignore */ }
    finally { setLoadingR(false); }
  }, [propertyId]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  const hasReviewed = reviews.some((r) => r.user?._id === currentUserId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newRating < 1) { toast.error('Please select a rating'); return; }
    if (!newComment.trim()) { toast.error('Please write a comment'); return; }
    setSubmitting(true);
    try {
      await createReview({ propertyId, rating: newRating, comment: newComment });
      toast.success('Review added!');
      setNewRating(0); setNewComment('');
      await loadReviews();
    } catch (err) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };

  const startEdit = (r) => { setEditingId(r._id); setEditRating(r.rating); setEditComment(r.comment); };
  const cancelEdit = () => { setEditingId(null); setEditRating(0); setEditComment(''); };

  const handleUpdate = async (reviewId) => {
    setSubmitting(true);
    try {
      await updateReview(reviewId, { rating: editRating, comment: editComment });
      toast.success('Review updated!');
      cancelEdit(); await loadReviews();
    } catch (err) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (reviewId) => {
    try {
      await deleteReview(reviewId);
      toast.success('Review deleted');
      setConfirmDeleteId(null);
      await loadReviews();
    } catch (err) { toast.error(err.message); }
  };

  const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      {/* Delete review confirm modal */}
      <ConfirmModal
        open={Boolean(confirmDeleteId)}
        title="Delete review?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => handleDelete(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FiMessageSquare className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-secondary">Reviews</h2>
          {reviews.length > 0 && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-muted">
              {reviews.length}
            </span>
          )}
        </div>
        {averageRating > 0 && (
          <div className="flex items-center gap-2">
            <StarRating value={averageRating} size="sm" />
            <span className="text-sm font-semibold text-secondary">{averageRating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Review form — only if authenticated and hasn't reviewed */}
      {isAuthenticated && !hasReviewed && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-gray-100 bg-gray-50/60 p-4">
          <p className="mb-2 text-sm font-medium text-secondary">Write a review</p>
          <StarRating value={newRating} onChange={setNewRating} size="md" />
          <textarea
            rows={3}
            placeholder="Share your experience…"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            maxLength={1000}
            className="mt-3 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-muted">{newComment.length}/1000</span>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit review'}
            </button>
          </div>
        </form>
      )}

      {/* Review list */}
      {loadingReviews ? (
        <div className="flex h-20 items-center justify-center"><Loader /></div>
      ) : reviews.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">No reviews yet. Be the first to review!</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r._id} className="rounded-xl border border-gray-50 bg-gray-50/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {r.user?.avatar ? (
                    <img src={r.user.avatar} alt={r.user.name} className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                      <FiUser className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-secondary">{r.user?.name || 'User'}</p>
                    <p className="text-xs text-muted">{fmtDate(r.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StarRating value={r.rating} size="sm" />
                  {r.user?._id === currentUserId && editingId !== r._id && (
                    <div className="flex gap-1">
                      <button type="button" onClick={() => startEdit(r)} aria-label="Edit review" className="rounded p-1 text-muted transition hover:text-primary"><FiEdit2 className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => setConfirmDeleteId(r._id)} aria-label="Delete review" className="rounded p-1 text-muted transition hover:text-red-500"><FiTrash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  )}
                </div>
              </div>
              {editingId === r._id ? (
                <div className="mt-3">
                  <StarRating value={editRating} onChange={setEditRating} size="md" />
                  <textarea
                    rows={2}
                    value={editComment}
                    onChange={(e) => setEditComment(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary resize-none"
                  />
                  <div className="mt-2 flex gap-2">
                    <button type="button" onClick={() => handleUpdate(r._id)} disabled={submitting} className="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-white hover:bg-primary-dark disabled:opacity-50">Save</button>
                    <button type="button" onClick={cancelEdit} className="rounded-lg border border-gray-200 px-4 py-1.5 text-xs font-medium text-secondary hover:bg-gray-50">Cancel</button>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-sm leading-relaxed text-muted">{r.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [property,  setProperty]  = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [wishlisted, setWishlisted] = useState(false);
  const [wishLoading, setWishLoading] = useState(false);
  const [similarProperties, setSimilarProperties] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchPropertyById(id);
        setProperty(data);
        // Track view (fire-and-forget)
        if (isAuthenticated && data._id && !/^[0-9]+$/.test(data._id)) {
          trackPropertyView(data._id);
        }
        // Fetch similar
        if (data._id && !/^[0-9]+$/.test(data._id)) {
          fetchSimilarProperties(data._id, 4)
            .then((d) => setSimilarProperties(d.properties || []))
            .catch(() => {});
        }
      } catch {
        const mock = FEATURED_PROPERTIES.find((p) => p.id === id);
        if (mock) {
          setProperty({
            ...mock,
            _id:         mock.id,
            price:       mock.pricePerMonth,
            images:      [mock.image],
            description: 'A beautiful property available for rent.',
            type:        'apartment',
            address:     { city: mock.location, state: '', country: 'India' },
            amenities:   ['wifi', 'parking'],
            availability: true,
          });
        } else {
          setError('Property not found');
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isAuthenticated]);

  // Check if property is in wishlist
  useEffect(() => {
    if (!isAuthenticated) return;
    const checkWishlist = async () => {
      try {
        const data = await fetchWishlist();
        setWishlisted(data.properties.some((p) => (p._id || p) === id));
      } catch { /* ignore */ }
    };
    checkWishlist();
  }, [isAuthenticated, id]);

  const toggleWishlist = async () => {
    if (!isAuthenticated) { toast.error('Sign in to save properties'); return; }
    setWishLoading(true);
    try {
      if (wishlisted) {
        await removeFromWishlist(id);
        setWishlisted(false);
        toast.success('Removed from wishlist');
      } else {
        await addToWishlist(id);
        setWishlisted(true);
        toast.success('Saved to wishlist ❤️');
      }
    } catch (err) { toast.error(err.message); }
    finally { setWishLoading(false); }
  };

  const handleShare = async () => {
    const shareData = {
      title: property.title,
      text: `Check out this rental property on RentEase: ${property.title}`,
      url: window.location.href,
    };
    if (navigator.share && navigator.canShare?.(shareData)) {
      try { await navigator.share(shareData); return; } catch { /* fallback */ }
    }
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <span className="text-5xl">🏚️</span>
        <h1 className="mt-4 text-2xl font-bold text-secondary">Property not found</h1>
        <p className="mt-2 text-sm text-muted">
          The listing may have been removed or the link is incorrect.
        </p>
        <Link
          to="/properties"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          <FiArrowLeft /> Browse properties
        </Link>
      </div>
    );
  }

  // Normalise images: support [{url,public_id}] objects AND legacy strings
  const rawImages = property.images?.length ? property.images : [];
  const images    = rawImages.length ? rawImages : [PLACEHOLDER_IMAGE];
  const address   = property.address || {};
  const cityLabel = property.city || address.city || '';
  const fullAddr  = [address.street, address.city, address.state, address.country]
    .filter(Boolean).join(', ');

  // ── SEO helpers ────────────────────────────────────────────────────────────
  const seoTitle  = property.title;
  const seoDesc   = property.description
    ? property.description.slice(0, 155)
    : `${property.type ? property.type.charAt(0).toUpperCase() + property.type.slice(1) : 'Property'} for rent in ${cityLabel}. ${formatPrice(property.price ?? 0)}/month. Book instantly on RentEase.`;
  const seoImage  = getFirstImageUrl(images, PLACEHOLDER_IMAGE);
  const seoKeywords = [
    property.type ? `${property.type} for rent` : '',
    cityLabel ? `rental properties ${cityLabel}` : '',
    cityLabel ? `apartments in ${cityLabel}` : '',
    property.bedrooms ? `${property.bedrooms} BHK` : '',
    'rent house', 'rental apartment India',
  ].filter(Boolean).join(', ');

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <SEO
        title={seoTitle}
        description={seoDesc}
        keywords={seoKeywords}
        canonical={`/properties/${property._id}`}
        ogImage={seoImage}
        type="website"
        structuredData={buildPropertySchema(property)}
      />
      <Link
        to="/properties"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-primary"
      >
        <FiArrowLeft /> Back to properties
      </Link>

      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">

        {/* ── Left column ─────────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* Gallery */}
          <div className="relative">
            <ImageCarousel images={images} title={property.title} />
            {/* Wishlist & Share overlay buttons */}
            <div className="absolute right-3 top-3 z-30 flex gap-2">
              <button
                type="button"
                onClick={toggleWishlist}
                disabled={wishLoading}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow transition hover:bg-white disabled:opacity-50"
                aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
              >
                <FiHeart className={`h-4 w-4 transition ${wishlisted ? 'fill-primary text-primary' : 'text-secondary'}`} />
              </button>
              <button
                type="button"
                onClick={handleShare}
                aria-label="Share this property"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow transition hover:bg-white"
              >
                <FiShare2 className="h-4 w-4 text-secondary" />
              </button>
            </div>
            {!property.availability && (
              <span className="absolute left-3 top-3 z-30 rounded-full bg-gray-800/80 px-3 py-1 text-xs font-semibold text-white">
                Currently unavailable
              </span>
            )}
          </div>

          {/* Title & basics */}
          <div>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="mb-2 inline-block rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold capitalize text-primary">
                  {property.type}
                </span>
                <h1 className="text-2xl font-bold text-secondary sm:text-3xl">
                  {property.title}
                </h1>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
                  <FiMapPin className="h-4 w-4 shrink-0 text-primary" />
                  {fullAddr || cityLabel}
                </p>
              </div>
              {property.rating > 0 && (
                <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5">
                  <FiStar className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-secondary">
                    {Number(property.rating).toFixed(1)}
                  </span>
                  <span className="text-xs text-muted">({property.reviewsCount || 0} reviews)</span>
                </div>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-4">
              <span className="flex items-center gap-1.5 text-sm text-secondary">
                <FiHome className="h-4 w-4 text-primary" />
                {property.bedrooms} Bedroom{property.bedrooms !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1.5 text-sm text-secondary">
                <FiDroplet className="h-4 w-4 text-primary" />
                {property.bathrooms} Bathroom{property.bathrooms !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1.5 text-sm text-secondary">
                <FiCheckCircle className="h-4 w-4 text-green-500" />
                {property.availability ? 'Available now' : 'Not available'}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-3 font-semibold text-secondary">About this property</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted">
              {property.description}
            </p>
          </div>

          {/* Amenities */}
          {property.amenities?.length > 0 && (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-semibold text-secondary">Amenities</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {property.amenities.map((a) => {
                  const meta = AMENITY_ICONS[a];
                  return (
                    <div key={a} className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3 text-sm font-medium text-secondary">
                      <span>{meta?.icon || '✅'}</span>
                      {meta?.label || a}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Owner info */}
          {property.owner && (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-semibold text-secondary">Listed by</h2>
              <div className="flex items-center gap-3">
                {property.owner.avatar ? (
                  <img src={property.owner.avatar} alt={property.owner.name}
                    className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <FiUser className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-secondary">{property.owner.name}</p>
                  <p className="text-sm text-muted">{property.owner.email}</p>
                </div>
              </div>
              {/* Contact Owner button */}
              {isAuthenticated && user?._id !== (property.owner._id || property.owner) && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const conv = await createConversation(
                        property._id || id,
                        property.owner._id || property.owner
                      );
                      navigate(`/messages?conversation=${conv._id}`);
                    } catch (err) {
                      toast.error(err.message || 'Failed to start conversation');
                    }
                  }}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-primary bg-primary/5 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white"
                  id="contact-owner-btn"
                >
                  <FiMessageSquare className="h-4 w-4" />
                  Contact Owner
                </button>
              )}
              {!isAuthenticated && (
                <p className="mt-3 text-center text-xs text-muted">
                  <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>{' '}
                  to contact the owner
                </p>
              )}
            </div>
          )}

          {/* Location map */}
          {(() => {
            const coords = geoJsonToLatLng(property.location?.coordinates);
            return (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 font-semibold text-secondary">
                  <FiMapPin className="h-4 w-4 text-primary" /> Location
                </h2>
                <PropertyMap
                  lat={coords?.lat}
                  lng={coords?.lng}
                  title={property.title}
                  className="h-64 w-full"
                />
                {(fullAddr || cityLabel) && (
                  <p className="mt-3 flex items-center gap-1.5 text-sm text-muted">
                    <FiMapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                    {fullAddr || cityLabel}
                  </p>
                )}
              </div>
            );
          })()}

          {/* Reviews */}
          <ReviewSection
            propertyId={property._id || id}
            isAuthenticated={isAuthenticated}
            currentUserId={user?._id}
          />

          {/* Similar Properties */}
          {similarProperties.length > 0 && (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 font-semibold text-secondary">
                <FiHome className="h-4 w-4 text-primary" /> Similar Properties
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {similarProperties.map((sp) => {
                  const spImg = getFirstImageUrl(sp.images, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&q=60');
                  const spCity = sp.city || sp.address?.city || '';
                  return (
                    <Link
                      key={sp._id}
                      to={`/properties/${sp._id}`}
                      className="group overflow-hidden rounded-xl border border-gray-100 transition hover:shadow-md"
                      id={`similar-property-${sp._id}`}
                    >
                      <div className="relative h-32 overflow-hidden">
                        <img
                          src={spImg}
                          alt={sp.title}
                          className="h-full w-full object-cover transition group-hover:scale-105"
                          onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE; }}
                        />
                        <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold capitalize text-secondary shadow">
                          {sp.type}
                        </span>
                      </div>
                      <div className="p-3">
                        <p className="line-clamp-1 text-sm font-semibold text-secondary">{sp.title}</p>
                        <div className="mt-1 flex items-center gap-1 text-xs text-muted">
                          {spCity && <><FiMapPin className="h-3 w-3" />{spCity}</>}
                          {sp.rating > 0 && (
                            <span className="ml-auto flex items-center gap-0.5 text-amber-500">
                              <FiStar className="h-3 w-3 fill-current" />{sp.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm font-bold text-primary">
                          {formatPrice(sp.price)}<span className="text-xs font-normal text-muted">/mo</span>
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Right column — Booking panel ────────────────────────────── */}
        <div className="h-fit lg:sticky lg:top-24">
          <BookingPanel
            property={property}
            isAuthenticated={isAuthenticated}
            navigate={navigate}
            propertyId={property._id || id}
            user={user}
          />
        </div>

      </div>
    </div>
  );
};

export default PropertyDetails;
