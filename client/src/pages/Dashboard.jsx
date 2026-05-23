import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiCalendar, FiHome, FiPlus, FiEdit2, FiTrash2,
  FiEye, FiToggleLeft, FiToggleRight, FiCheckCircle,
  FiXCircle, FiClock, FiUser, FiCreditCard, FiDollarSign,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import { fetchMyProperties, deleteProperty } from '../services/propertyService';
import { fetchOwnerBookings, updateBookingStatus } from '../services/bookingService';
import { fetchOwnerPayments } from '../services/paymentService';
import { formatPrice } from '../utils/constants';

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&q=60';

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color = 'text-primary' }) => (
  <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
    <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ${color}`}>
      <Icon className="h-6 w-6" />
    </div>
    <div>
      <p className="text-2xl font-bold text-secondary">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </div>
  </div>
);

// ─── Booking status badge ─────────────────────────────────────────────────────
const STATUS = {
  pending:   { cls: 'bg-amber-50 text-amber-600',  icon: FiClock,        label: 'Pending'   },
  confirmed: { cls: 'bg-green-50 text-green-600',   icon: FiCheckCircle, label: 'Confirmed' },
  cancelled: { cls: 'bg-red-50 text-red-500',       icon: FiXCircle,     label: 'Cancelled' },
  completed: { cls: 'bg-blue-50 text-blue-600',     icon: FiCheckCircle, label: 'Completed' },
};

const StatusBadge = ({ status }) => {
  const s = STATUS[status] || STATUS.pending;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${s.cls}`}>
      <Icon className="h-3 w-3" />{s.label}
    </span>
  );
};

const PAYMENT_STATUS = {
  pending: { cls: 'bg-amber-50 text-amber-600', label: 'Payment pending' },
  paid:    { cls: 'bg-green-50 text-green-600',  label: 'Paid' },
  failed:  { cls: 'bg-red-50 text-red-500',     label: 'Payment failed' },
};

const PaymentBadge = ({ status }) => {
  const s = PAYMENT_STATUS[status] || PAYMENT_STATUS.pending;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${s.cls}`}>
      <FiCreditCard className="h-3 w-3" /> {s.label}
    </span>
  );
};

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { user } = useAuth();
  const isOwnerOrAdmin = ['owner', 'admin'].includes(user?.role);

  const [myProperties,  setMyProperties]  = useState([]);
  const [ownerBookings, setOwnerBookings] = useState([]);
  const [ownerRevenue,  setOwnerRevenue]  = useState(0);
  const [paidCount,     setPaidCount]     = useState(0);
  const [loadingProps,  setLoadingProps]  = useState(false);
  const [loadingBks,    setLoadingBks]    = useState(false);
  const [deletingId,    setDeletingId]    = useState(null);
  const [updatingBk,    setUpdatingBk]    = useState(null);
  const [bookingFilter, setBookingFilter] = useState('all');

  // ── Load owner properties ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isOwnerOrAdmin) return;
    const load = async () => {
      setLoadingProps(true);
      try {
        const result = await fetchMyProperties();
        setMyProperties(result.properties);
      } catch {
        // silently skip
      } finally {
        setLoadingProps(false);
      }
    };
    load();
  }, [isOwnerOrAdmin]);

  // ── Load owner bookings ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isOwnerOrAdmin) return;
    const load = async () => {
      setLoadingBks(true);
      try {
        const result = await fetchOwnerBookings();
        setOwnerBookings(result.bookings);
      } catch {
        // silently skip
      } finally {
        setLoadingBks(false);
      }
    };
    load();
  }, [isOwnerOrAdmin]);

  // ── Load owner payment revenue ────────────────────────────────────────────
  useEffect(() => {
    if (!isOwnerOrAdmin) return;
    const load = async () => {
      try {
        const result = await fetchOwnerPayments();
        setOwnerRevenue(result.totalRevenue || 0);
        setPaidCount(result.count || 0);
      } catch {
        // silently skip
      }
    };
    load();
  }, [isOwnerOrAdmin]);

  // ── Delete property ───────────────────────────────────────────────────────
  const handleDeleteProperty = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await deleteProperty(id);
      setMyProperties((prev) => prev.filter((p) => p._id !== id));
      toast.success('Property deleted');
    } catch (err) {
      toast.error(err.message || 'Failed to delete property');
    } finally {
      setDeletingId(null);
    }
  };

  // ── Update booking status ─────────────────────────────────────────────────
  const handleBookingStatus = async (bookingId, newStatus) => {
    setUpdatingBk(bookingId);
    try {
      await updateBookingStatus(bookingId, newStatus);
      setOwnerBookings((prev) =>
        prev.map((b) => b._id === bookingId ? { ...b, bookingStatus: newStatus } : b)
      );
      toast.success(`Booking ${newStatus}`);
    } catch (err) {
      toast.error(err.message || 'Failed to update booking');
    } finally {
      setUpdatingBk(null);
    }
  };

  const activeCount   = myProperties.filter((p) => p.availability).length;
  const pendingCount  = ownerBookings.filter((b) => b.bookingStatus === 'pending').length;

  const BOOKING_TABS = [
    { key: 'all',       label: 'All' },
    { key: 'pending',   label: 'Pending' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];
  const visibleBookings = bookingFilter === 'all'
    ? ownerBookings
    : ownerBookings.filter((b) => b.bookingStatus === bookingFilter);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-muted capitalize">
            {user?.role} account
          </p>
        </div>
        <div className="flex items-center gap-3 self-start">
          <Link
            to="/my-bookings"
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-secondary transition hover:bg-gray-50"
          >
            <FiCalendar className="h-4 w-4" /> My bookings
          </Link>
          <Link
            to="/my-payments"
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-secondary transition hover:bg-gray-50"
          >
            <FiCreditCard className="h-4 w-4" /> Payments
          </Link>
          {isOwnerOrAdmin && (
            <Link
              to="/properties/add"
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark"
            >
              <FiPlus className="h-4 w-4" /> Add property
            </Link>
          )}
        </div>
      </div>

      {/* ── Stats row ──────────────────────────────────────────────────── */}
      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FiCalendar} label="My bookings" value={0} />
        <StatCard icon={FiHome}     label="Saved properties" value={0} />
        {isOwnerOrAdmin && (
          <>
            <StatCard icon={FiHome}        label="My listings"    value={myProperties.length} />
            <StatCard icon={FiToggleRight} label="Active listings" value={activeCount} />
            <StatCard icon={FiDollarSign}  label="Advance received" value={formatPrice(ownerRevenue)} color="text-green-600" />
            <StatCard icon={FiCreditCard}  label="Paid bookings"  value={paidCount} />
          </>
        )}
      </div>

      {/* ── Tenant: browse CTA ─────────────────────────────────────────── */}
      {!isOwnerOrAdmin && (
        <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <span className="text-5xl">🏡</span>
          <h2 className="mt-4 text-lg font-semibold text-secondary">Start your search</h2>
          <p className="mt-2 text-sm text-muted">
            Browse hundreds of verified rental properties across India.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              to="/properties"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
            >
              Browse properties
            </Link>
            <Link
              to="/my-payments"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-medium text-secondary transition hover:bg-gray-50"
            >
              <FiCreditCard className="h-4 w-4" /> Payment history
            </Link>
          </div>
        </div>
      )}

      {/* ── Owner sections ─────────────────────────────────────────────── */}
      {isOwnerOrAdmin && (
        <>
          {/* ── Booking requests ─────────────────────────────────────── */}
          <section className="mb-12">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-secondary">Booking requests</h2>
                {pendingCount > 0 && (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                    {pendingCount}
                  </span>
                )}
              </div>
              {/* Filter tabs */}
              <div className="flex flex-wrap gap-2">
                {BOOKING_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setBookingFilter(tab.key)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      bookingFilter === tab.key
                        ? 'bg-primary text-white'
                        : 'border border-gray-200 bg-white text-secondary hover:bg-gray-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {loadingBks ? (
              <div className="flex h-32 items-center justify-center">
                <Loader />
              </div>
            ) : visibleBookings.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-8 text-center">
                <FiCalendar className="mx-auto h-10 w-10 text-gray-200" />
                <p className="mt-3 text-sm font-medium text-secondary">
                  No {bookingFilter === 'all' ? '' : bookingFilter} bookings yet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {visibleBookings.map((bk) => {
                  const prop  = bk.property  || {};
                  const guest = bk.user      || {};
                  const img   = (Array.isArray(prop.images) && prop.images[0]) || PLACEHOLDER;
                  return (
                    <div
                      key={bk._id}
                      className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center"
                    >
                      {/* Property thumb */}
                      <img
                        src={img}
                        alt={prop.title}
                        className="h-16 w-24 shrink-0 rounded-xl object-cover"
                        onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
                      />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className="line-clamp-1 font-semibold text-secondary">{prop.title}</p>
                          <div className="flex flex-wrap gap-1.5">
                            <StatusBadge status={bk.bookingStatus} />
                            <PaymentBadge status={bk.paymentStatus} />
                          </div>
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-4 text-xs text-muted">
                          <span className="flex items-center gap-1">
                            <FiUser className="h-3 w-3" /> {guest.name || 'Guest'} · {guest.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <FiCalendar className="h-3 w-3" />
                            {fmtDate(bk.checkInDate)} → {fmtDate(bk.checkOutDate)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-semibold text-secondary">
                          {formatPrice(bk.totalAmount)}
                          {bk.paymentStatus === 'paid' && bk.advancePaid > 0 && (
                            <span className="ml-2 text-xs font-normal text-green-600">
                              · {formatPrice(bk.advancePaid)} advance received
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Actions — only for pending bookings */}
                      {bk.bookingStatus === 'pending' && (
                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            disabled={updatingBk === bk._id}
                            onClick={() => handleBookingStatus(bk._id, 'confirmed')}
                            className="flex items-center gap-1.5 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-700 transition hover:bg-green-100 disabled:opacity-50"
                          >
                            <FiCheckCircle className="h-3.5 w-3.5" /> Confirm
                          </button>
                          <button
                            type="button"
                            disabled={updatingBk === bk._id}
                            onClick={() => handleBookingStatus(bk._id, 'cancelled')}
                            className="flex items-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-medium text-red-500 transition hover:bg-red-100 disabled:opacity-50"
                          >
                            <FiXCircle className="h-3.5 w-3.5" /> Decline
                          </button>
                        </div>
                      )}
                      {/* Mark completed if confirmed */}
                      {bk.bookingStatus === 'confirmed' && (
                        <button
                          type="button"
                          disabled={updatingBk === bk._id}
                          onClick={() => handleBookingStatus(bk._id, 'completed')}
                          className="shrink-0 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-600 transition hover:bg-blue-100 disabled:opacity-50"
                        >
                          Mark complete
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ── My properties ────────────────────────────────────────── */}
          <section>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-secondary">My properties</h2>
              <Link
                to="/properties/add"
                className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark"
              >
                <FiPlus className="h-4 w-4" /> Add new
              </Link>
            </div>

            {loadingProps ? (
              <div className="flex h-40 items-center justify-center"><Loader /></div>
            ) : myProperties.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-10 text-center">
                <span className="text-4xl">🏘️</span>
                <p className="mt-3 font-medium text-secondary">No properties listed yet</p>
                <Link
                  to="/properties/add"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
                >
                  <FiPlus className="h-4 w-4" /> Add property
                </Link>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {myProperties.map((prop) => {
                  const image = (Array.isArray(prop.images) && prop.images[0]) || PLACEHOLDER;
                  return (
                    <div key={prop._id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                      <div className="relative aspect-[16/9]">
                        <img
                          src={image}
                          alt={prop.title}
                          className="h-full w-full object-cover"
                          onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
                        />
                        <span className={`absolute left-3 top-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                          prop.availability ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {prop.availability ? <FiToggleRight className="h-3.5 w-3.5" /> : <FiToggleLeft className="h-3.5 w-3.5" />}
                          {prop.availability ? 'Available' : 'Unlisted'}
                        </span>
                      </div>
                      <div className="p-4">
                        <p className="line-clamp-1 font-semibold text-secondary">{prop.title}</p>
                        <p className="mt-1 text-sm text-muted">
                          {prop.city || prop.address?.city} · {prop.bedrooms}bed / {prop.bathrooms}bath
                        </p>
                        <p className="mt-1 text-sm font-semibold text-secondary">
                          {formatPrice(prop.price)}<span className="text-xs font-normal text-muted">/mo</span>
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                          <Link
                            to={`/properties/${prop._id}`}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2 text-xs font-medium text-secondary transition hover:bg-gray-50"
                          >
                            <FiEye className="h-3.5 w-3.5" /> View
                          </Link>
                          <Link
                            to={`/properties/${prop._id}/edit`}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2 text-xs font-medium text-secondary transition hover:bg-gray-50"
                          >
                            <FiEdit2 className="h-3.5 w-3.5" /> Edit
                          </Link>
                          <button
                            type="button"
                            disabled={deletingId === prop._id}
                            onClick={() => handleDeleteProperty(prop._id, prop.title)}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-100 py-2 text-xs font-medium text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            {deletingId === prop._id
                              ? <span className="h-3 w-3 animate-spin rounded-full border border-red-300 border-t-red-500" />
                              : <FiTrash2 className="h-3.5 w-3.5" />}
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

    </div>
  );
};

export default Dashboard;
