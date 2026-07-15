import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiClock, FiCheckCircle, FiXCircle, FiCalendar,
  FiHome, FiUser, FiDollarSign, FiChevronDown, FiChevronUp,
} from 'react-icons/fi';
import { fetchOwnerBookings, fetchMyBookings } from '../services/bookingService';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../utils/constants';
import { getFirstImageUrl } from '../utils/imageUtils';

const STATUS_CONFIG = {
  pending: { cls: 'bg-amber-50 text-amber-600 border-amber-100', icon: FiClock, label: 'Pending' },
  confirmed: { cls: 'bg-green-50 text-green-600 border-green-100', icon: FiCheckCircle, label: 'Confirmed' },
  cancelled: { cls: 'bg-red-50 text-red-500 border-red-100', icon: FiXCircle, label: 'Cancelled' },
  completed: { cls: 'bg-blue-50 text-blue-600 border-blue-100', icon: FiCheckCircle, label: 'Completed' },
};

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const diffDays = (a, b) =>
  Math.ceil((new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24));

// ─── BookingTimeline component ────────────────────────────────────────────────
const BookingTimeline = ({ isOwnerView = false, maxItems = null }) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const result = isOwnerView
          ? await fetchOwnerBookings()
          : await fetchMyBookings();
        setBookings(result.bookings || []);
      } catch {
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isOwnerView]);

  const now = new Date();

  // Classify bookings
  const classify = (b) => {
    const checkIn = new Date(b.checkInDate);
    const checkOut = new Date(b.checkOutDate);
    if (b.bookingStatus === 'cancelled') return 'cancelled';
    if (checkIn > now) return 'upcoming';
    if (checkOut > now && checkIn <= now) return 'active';
    return 'completed';
  };

  // Filter
  const filtered = bookings.filter(b => {
    if (filter === 'all') return true;
    return classify(b) === filter;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'date') return new Date(a.checkInDate) - new Date(b.checkInDate);
    if (sortBy === 'property') return (a.property?.title || '').localeCompare(b.property?.title || '');
    if (sortBy === 'amount') return b.totalAmount - a.totalAmount;
    return 0;
  });

  const displayed = maxItems ? sorted.slice(0, maxItems) : sorted;

  const toggleExpand = (id) =>
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const FILTERS = ['all', 'upcoming', 'active', 'completed', 'cancelled'];

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse rounded-2xl border border-gray-100 bg-white p-5">
            <div className="flex gap-4">
              <div className="h-16 w-24 rounded-xl bg-gray-100" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 rounded bg-gray-100" />
                <div className="h-3 w-60 rounded bg-gray-100" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Controls */}
      {!maxItems && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          {/* Filter tabs */}
          <div className="flex flex-wrap gap-2">
            {FILTERS.map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition ${filter === f
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-muted hover:bg-gray-200'
                  }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>Sort:</span>
            {['date', 'property', 'amount'].map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setSortBy(s)}
                className={`rounded-lg px-2.5 py-1 capitalize transition ${sortBy === s ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-gray-100'
                  }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      {displayed.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center">
          <FiCalendar className="h-12 w-12 text-gray-200" />
          <p className="mt-3 text-sm font-medium text-secondary">No bookings found</p>
          <p className="text-xs text-muted mt-1">Try changing the filter</p>
        </div>
      ) : (
        <div className="relative space-y-3">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 h-full w-px bg-gradient-to-b from-primary/30 via-gray-200 to-transparent" />

          {displayed.map((bk) => {
            const status = STATUS_CONFIG[bk.bookingStatus] || STATUS_CONFIG.pending;
            const Icon = status.icon;
            const cat = classify(bk);
            const days = diffDays(bk.checkInDate, bk.checkOutDate);
            const prop = bk.property || {};
            const img = getFirstImageUrl(prop.images, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&q=60');
            const isExp = expanded[bk._id];

            return (
              <div key={bk._id} className="relative pl-12">
                {/* Timeline dot */}
                <div className={`absolute left-2.5 top-4 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full border-2 border-white ${cat === 'active' ? 'bg-green-500' :
                    cat === 'upcoming' ? 'bg-primary' :
                      cat === 'completed' ? 'bg-blue-500' :
                        'bg-gray-300'
                  } shadow`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                </div>

                <div className={`rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md ${status.cls}`}>
                  <div className="flex items-start gap-3">
                    {/* Property image */}
                    <img
                      src={img}
                      alt={prop.title}
                      className="h-16 w-20 shrink-0 rounded-xl object-cover"
                      onError={e => { e.currentTarget.src = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&q=60'; }}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="line-clamp-1 font-semibold text-secondary">{prop.title || 'Property'}</p>
                          <p className="text-xs text-muted">{prop.city || prop.address?.city}</p>
                        </div>
                        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${status.cls}`}>
                          <Icon className="h-3 w-3" /> {status.label}
                        </span>
                      </div>

                      {/* Date row */}
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                        <span className="flex items-center gap-1">
                          <FiCalendar className="h-3 w-3" />
                          {fmtDate(bk.checkInDate)} → {fmtDate(bk.checkOutDate)}
                        </span>
                        <span className="font-medium text-secondary">{days} day{days !== 1 ? 's' : ''}</span>
                        <span className="flex items-center gap-1 font-semibold text-emerald-600">
                          <FiDollarSign className="h-3 w-3" />
                          {formatPrice(bk.totalAmount)}
                        </span>
                      </div>

                      {/* Owner view: show guest */}
                      {isOwnerView && bk.user && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-muted">
                          <FiUser className="h-3 w-3" />
                          <span>{bk.user.name || 'Guest'}</span>
                          {bk.user.email && <span>• {bk.user.email}</span>}
                        </div>
                      )}
                    </div>

                    {/* Expand toggle */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(bk._id)}
                      className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg hover:bg-gray-100 transition"
                    >
                      {isExp ? <FiChevronUp className="h-4 w-4" /> : <FiChevronDown className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Expanded details */}
                  {isExp && (
                    <div className="mt-3 border-t border-gray-100 pt-3">
                      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                        <div className="rounded-lg bg-gray-50 p-2">
                          <p className="text-[10px] text-muted uppercase">Payment</p>
                          <p className="mt-0.5 font-medium text-secondary capitalize">{bk.paymentStatus}</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-2">
                          <p className="text-[10px] text-muted uppercase">Duration</p>
                          <p className="mt-0.5 font-medium text-secondary">{days} days</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-2">
                          <p className="text-[10px] text-muted uppercase">Check-in</p>
                          <p className="mt-0.5 font-medium text-secondary">{fmtDate(bk.checkInDate)}</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-2">
                          <p className="text-[10px] text-muted uppercase">Check-out</p>
                          <p className="mt-0.5 font-medium text-secondary">{fmtDate(bk.checkOutDate)}</p>
                        </div>
                      </div>
                      {prop._id && (
                        <Link
                          to={`/properties/${prop._id}`}
                          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-dark"
                        >
                          <FiHome className="h-3 w-3" /> View Property
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BookingTimeline;
