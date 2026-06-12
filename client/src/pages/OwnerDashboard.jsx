import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiCalendar, FiHome, FiPlus, FiEdit2, FiTrash2,
  FiEye, FiToggleLeft, FiToggleRight, FiCheckCircle,
  FiXCircle, FiClock, FiUser, FiCreditCard, FiDollarSign,
  FiBell, FiStar, FiTrendingUp, FiArrowRight, FiBarChart2, FiSettings, FiMessageSquare,
  FiPercent, FiLock,
} from 'react-icons/fi';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { fetchOwnerDashboard } from '../services/dashboardService';
import { getProfile } from '../services/userService';
import ProfileCard from '../components/ProfileCard';
import { deleteProperty } from '../services/propertyService';
import { updateBookingStatus } from '../services/bookingService';
import { fetchOccupancyAnalytics } from '../services/availabilityService';
import { formatPrice } from '../utils/constants';
import ActivityFeed from '../components/ActivityFeed';
import BookingTimeline from '../components/BookingTimeline';
import { useChat } from '../context/ChatContext';
import { getUserAvatar } from '../utils/avatar';

// ─── Skeleton loader ──────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="animate-pulse rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
    <div className="flex items-center gap-4">
      <div className="h-12 w-12 rounded-xl bg-gray-100" />
      <div className="flex-1 space-y-2">
        <div className="h-5 w-16 rounded bg-gray-100" />
        <div className="h-3 w-24 rounded bg-gray-100" />
      </div>
    </div>
  </div>
);

const SkeletonChart = () => (
  <div className="animate-pulse rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
    <div className="mb-4 h-5 w-32 rounded bg-gray-100" />
    <div className="h-64 rounded-xl bg-gray-50" />
  </div>
);

const SkeletonRow = () => (
  <div className="animate-pulse flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
    <div className="h-14 w-20 rounded-xl bg-gray-100" />
    <div className="flex-1 space-y-2">
      <div className="h-4 w-40 rounded bg-gray-100" />
      <div className="h-3 w-56 rounded bg-gray-100" />
    </div>
  </div>
);

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color = 'bg-primary/10 text-primary', subtitle }) => (
  <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md">
    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
      <Icon className="h-6 w-6" />
    </div>
    <div>
      <p className="text-2xl font-bold text-secondary">{value}</p>
      <p className="text-sm text-muted">{label}</p>
      {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
    </div>
  </div>
);

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS = {
  pending: { cls: 'bg-amber-50 text-amber-600', icon: FiClock, label: 'Pending' },
  confirmed: { cls: 'bg-green-50 text-green-600', icon: FiCheckCircle, label: 'Confirmed' },
  cancelled: { cls: 'bg-red-50 text-red-500', icon: FiXCircle, label: 'Cancelled' },
  completed: { cls: 'bg-blue-50 text-blue-600', icon: FiCheckCircle, label: 'Completed' },
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

const PLACEHOLDER = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&q=60';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const fmtTime = (d) => {
  const now = new Date();
  const date = new Date(d);
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

// ─── Owner Dashboard ──────────────────────────────────────────────────────────
const OwnerDashboard = () => {
  const { user, loading: authLoading, token } = useAuth();
  const navigate = useNavigate();
  const isOwnerOrAdmin = ['owner', 'admin'].includes(user?.role);
  const { conversations, onlineUsers, loadingConversations } = useChat();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [updatingBk, setUpdatingBk] = useState(null);
  const [occupancy, setOccupancy] = useState([]);
  const [showTimeline, setShowTimeline] = useState(false);

  // Redirect non-owners to /dashboard
  useEffect(() => {
    if (!isOwnerOrAdmin) {
      navigate('/dashboard', { replace: true });
    }
  }, [isOwnerOrAdmin, navigate]);

  useEffect(() => {
    if (authLoading || !token || !isOwnerOrAdmin) return;
    const load = async () => {
      try {
        const [result, profile, occ] = await Promise.all([
          fetchOwnerDashboard(),
          getProfile().catch(() => null),
          fetchOccupancyAnalytics().catch(() => []),
        ]);
        setData(result);
        if (profile) setProfileData(profile);
        setOccupancy(occ || []);
      } catch {
        // silently skip
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authLoading, token, isOwnerOrAdmin]);

  // ── Delete property ───────────────────────────────────────────────────────
  const handleDeleteProperty = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await deleteProperty(id);
      // Refresh data
      const result = await fetchOwnerDashboard();
      setData(result);
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
      // Update local data
      setData((prev) => ({
        ...prev,
        recentBookings: prev.recentBookings.map((b) =>
          b._id === bookingId ? { ...b, bookingStatus: newStatus } : b
        ),
      }));
      toast.success(`Booking ${newStatus}`);
    } catch (err) {
      toast.error(err.message || 'Failed to update booking');
    } finally {
      setUpdatingBk(null);
    }
  };

  if (!isOwnerOrAdmin) return null;

  const stats = data?.stats || {};
  const recentBookings = data?.recentBookings || [];
  const recentPayments = data?.recentPayments || [];
  const recentReviews = data?.recentReviews || [];
  const propertyPerformance = data?.propertyPerformance || [];

  // Format chart data
  const revenueChartData = (data?.revenueTrend || []).map((item) => ({
    name: MONTHS[(item._id.month - 1) % 12],
    revenue: item.revenue,
    bookings: item.count,
  }));

  const bookingChartData = (data?.bookingTrend || []).map((item) => ({
    name: MONTHS[(item._id.month - 1) % 12],
    bookings: item.count,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary">
            Owner Dashboard 📊
          </h1>
          <p className="mt-1 text-sm text-muted">
            Welcome back, {user?.name?.split(' ')[0]} • Manage your properties and track performance
          </p>
        </div>
        <div className="flex items-center gap-3 self-start">
          <Link
            to="/properties/add"
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark"
          >
            <FiPlus className="h-4 w-4" /> Add property
          </Link>
          <Link
            to="/notifications"
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-secondary transition hover:bg-gray-50"
          >
            <FiBell className="h-4 w-4" /> Notifications
          </Link>
        </div>
      </div>

      {/* ── Profile summary ──────────────────────────────────────────── */}
      {profileData && (
        <section className="mb-10">
          <ProfileCard profile={profileData.user} completion={profileData.profileCompletion} />
          <div className="mt-3 flex flex-wrap gap-3">
            <Link
              to="/profile"
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-secondary transition hover:bg-gray-50"
            >
              <FiUser className="h-4 w-4" /> Edit profile
            </Link>
            <Link
              to="/settings"
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-secondary transition hover:bg-gray-50"
            >
              <FiSettings className="h-4 w-4" /> Account settings
            </Link>
          </div>
        </section>
      )}

      {/* ── Stats row ──────────────────────────────────────────────── */}
      {loading ? (
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={FiHome} label="Total properties" value={stats.totalProperties || 0} />
          <StatCard icon={FiCheckCircle} label="Active bookings" value={stats.activeBookings || 0} color="bg-green-50 text-green-600" />
          <StatCard
            icon={FiDollarSign}
            label="Total revenue"
            value={formatPrice(stats.totalRevenue || 0)}
            color="bg-emerald-50 text-emerald-600"
            subtitle={`This month: ${formatPrice(stats.monthlyRevenue || 0)}`}
          />
          <StatCard icon={FiClock} label="Pending bookings" value={stats.pendingBookings || 0} color="bg-amber-50 text-amber-600" />
        </div>
      )}

      {/* ── Occupancy Metrics ────────────────────────────────────────── */}
      {!loading && occupancy.length > 0 && (
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold text-secondary">
              <FiPercent className="h-5 w-5 text-primary" /> Occupancy Analytics
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {occupancy.map((item) => (
              <div key={item.property._id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md">
                <div className="relative">
                  <img
                    src={Array.isArray(item.property.images) && item.property.images[0]
                      ? item.property.images[0]
                      : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&q=60'}
                    alt={item.property.title}
                    className="h-24 w-full object-cover"
                    onError={e => { e.currentTarget.src = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&q=60'; }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/60 to-transparent">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-white">{item.occupancyPercent}%</p>
                      <p className="text-xs text-white/80">Occupancy</p>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <p className="line-clamp-1 font-semibold text-secondary">{item.property.title}</p>
                  <p className="mb-3 text-xs text-muted">{item.property.city}</p>
                  {/* Progress bar */}
                  <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-500"
                      style={{ width: `${item.occupancyPercent}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-blue-50/50 p-2">
                      <p className="text-sm font-bold text-blue-600">{item.bookedDays}</p>
                      <p className="text-[10px] text-muted">Booked</p>
                    </div>
                    <div className="rounded-lg bg-red-50/50 p-2">
                      <p className="text-sm font-bold text-red-500">{item.blockedDays}</p>
                      <p className="text-[10px] text-muted">Blocked</p>
                    </div>
                    <div className="rounded-lg bg-green-50/50 p-2">
                      <p className="text-sm font-bold text-green-600">{item.availableDays}</p>
                      <p className="text-[10px] text-muted">Available</p>
                    </div>
                  </div>
                  <Link
                    to={`/availability/${item.property._id}`}
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-primary/20 py-2 text-xs font-medium text-primary transition hover:bg-primary hover:text-white"
                  >
                    <FiCalendar className="h-3.5 w-3.5" /> Manage Calendar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Revenue & Booking Stats Row ─────────────────────────────── */}
      {!loading && (
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={FiCalendar} label="Total bookings" value={stats.totalBookings || 0} color="bg-blue-50 text-blue-600" />
          <StatCard icon={FiTrendingUp} label="Completed" value={stats.completedBookings || 0} color="bg-indigo-50 text-indigo-600" />
          <StatCard icon={FiCreditCard} label="Paid payments" value={stats.paidPayments || 0} color="bg-green-50 text-green-600" />
          <StatCard icon={FiClock} label="Pending payments" value={stats.pendingPayments || 0} color="bg-orange-50 text-orange-600" />
        </div>
      )}

      {/* ── Charts Row ──────────────────────────────────────────────── */}
      {loading ? (
        <div className="mb-10 grid gap-6 lg:grid-cols-2">
          <SkeletonChart />
          <SkeletonChart />
        </div>
      ) : (
        <div className="mb-10 grid gap-6 lg:grid-cols-2">
          {/* Revenue Trend */}
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-secondary">
              <FiTrendingUp className="h-5 w-5 text-emerald-500" /> Revenue Trend
            </h2>
            {revenueChartData.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-sm text-muted">
                No revenue data yet
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#717171' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#717171' }} />
                    <Tooltip
                      formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #f0f0f0', fontSize: '13px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          {/* Booking Trend */}
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-secondary">
              <FiBarChart2 className="h-5 w-5 text-blue-500" /> Booking Trend
            </h2>
            {bookingChartData.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-sm text-muted">
                No booking data yet
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bookingChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#717171' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#717171' }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: '1px solid #f0f0f0', fontSize: '13px' }}
                    />
                    <Bar dataKey="bookings" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>
        </div>
      )}

      {/* ── Property Performance ────────────────────────────────────── */}
      {!loading && propertyPerformance.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-secondary">
            <FiBarChart2 className="h-5 w-5 text-primary" /> Property Performance
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {propertyPerformance.map((prop) => {
              const image = (Array.isArray(prop.images) && prop.images[0]) || PLACEHOLDER;
              return (
                <div key={prop._id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md">
                  <div className="relative aspect-[16/9]">
                    <img
                      src={image}
                      alt={prop.title}
                      className="h-full w-full object-cover"
                      onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
                    />
                    <span className={`absolute left-3 top-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${prop.availability ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                      }`}>
                      {prop.availability ? <FiToggleRight className="h-3.5 w-3.5" /> : <FiToggleLeft className="h-3.5 w-3.5" />}
                      {prop.availability ? 'Available' : 'Unlisted'}
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="line-clamp-1 font-semibold text-secondary">{prop.title}</p>
                    <p className="mt-1 text-sm text-muted">
                      {prop.city} • {formatPrice(prop.price)}/mo
                    </p>

                    {/* Performance metrics */}
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-blue-50/50 p-2 text-center">
                        <p className="text-lg font-bold text-blue-600">{prop.totalBookings}</p>
                        <p className="text-[10px] text-muted">Bookings</p>
                      </div>
                      <div className="rounded-lg bg-emerald-50/50 p-2 text-center">
                        <p className="text-lg font-bold text-emerald-600">{formatPrice(prop.revenue)}</p>
                        <p className="text-[10px] text-muted">Revenue</p>
                      </div>
                      <div className="rounded-lg bg-amber-50/50 p-2 text-center">
                        <p className="text-lg font-bold text-amber-600 flex items-center justify-center gap-1">
                          <FiStar className="h-3.5 w-3.5" /> {prop.averageRating?.toFixed(1) || '0.0'}
                        </p>
                        <p className="text-[10px] text-muted">Avg rating</p>
                      </div>
                      <div className="rounded-lg bg-purple-50/50 p-2 text-center">
                        <p className="text-lg font-bold text-purple-600">{prop.reviewCount}</p>
                        <p className="text-[10px] text-muted">Reviews</p>
                      </div>
                    </div>

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
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* ── Recent Bookings ──────────────────────────────────────── */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-secondary">Recent Bookings</h2>
            <Link
              to="/my-bookings"
              className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-dark"
            >
              View all <FiArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {recentBookings.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <FiCalendar className="h-10 w-10 text-gray-200" />
              <p className="mt-3 text-sm font-medium text-secondary">No bookings yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((bk) => {
                const prop = bk.property || {};
                const guest = bk.user || {};
                const img = (Array.isArray(prop.images) && prop.images[0]) || PLACEHOLDER;
                return (
                  <div key={bk._id} className="flex items-center gap-3 rounded-xl border border-gray-50 bg-gray-50/30 p-3 transition hover:bg-gray-50">
                    <img
                      src={img}
                      alt={prop.title}
                      className="h-12 w-16 shrink-0 rounded-lg object-cover"
                      onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-semibold text-secondary">{prop.title}</p>
                      <p className="text-xs text-muted">
                        <FiUser className="inline h-3 w-3 mr-1" />
                        {guest.name || 'Guest'} • {fmtDate(bk.checkInDate)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge status={bk.bookingStatus} />
                      {bk.bookingStatus === 'pending' && (
                        <div className="flex gap-1">
                          <button
                            type="button"
                            disabled={updatingBk === bk._id}
                            onClick={() => handleBookingStatus(bk._id, 'confirmed')}
                            className="rounded-lg bg-green-50 px-2 py-1 text-[10px] font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
                          >
                            ✓
                          </button>
                          <button
                            type="button"
                            disabled={updatingBk === bk._id}
                            onClick={() => handleBookingStatus(bk._id, 'cancelled')}
                            className="rounded-lg bg-red-50 px-2 py-1 text-[10px] font-medium text-red-500 hover:bg-red-100 disabled:opacity-50"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Recent Payments ──────────────────────────────────────── */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-secondary">Recent Payments</h2>
            <Link
              to="/my-payments"
              className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-dark"
            >
              View all <FiArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {recentPayments.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <FiCreditCard className="h-10 w-10 text-gray-200" />
              <p className="mt-3 text-sm font-medium text-secondary">No payments received yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPayments.map((pmt) => (
                <div key={pmt._id} className="flex items-center justify-between rounded-xl border border-gray-50 bg-gray-50/30 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-semibold text-secondary">
                      {pmt.property?.title || 'Property'}
                    </p>
                    <p className="text-xs text-muted">
                      <FiUser className="inline h-3 w-3 mr-1" />
                      {pmt.user?.name || 'Guest'} • {pmt.transactionDate ? fmtDate(pmt.transactionDate) : fmtDate(pmt.createdAt)}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-emerald-600">{formatPrice(pmt.amount)}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Recent Chats (Messaging Widget) ─────────────────────── */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-secondary">Recent Chats</h2>
            <Link
              to="/messages"
              className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-dark"
            >
              View all <FiArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {loadingConversations ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <FiMessageSquare className="h-10 w-10 text-gray-200" />
              <p className="mt-3 text-sm font-medium text-secondary">No chats yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {conversations.slice(0, 3).map((conv) => {
                const otherParticipant = conv.participants.find((p) => p._id !== user._id);
                const isOnline = onlineUsers.get(otherParticipant?._id.toString())?.isOnline ?? false;
                const unreadCount = conv.unreadCounts?.get?.(user._id) ?? conv.unreadCounts?.[user._id] ?? 0;
                const avatar = otherParticipant ? getUserAvatar(otherParticipant) : '';

                return (
                  <Link
                    key={conv._id}
                    to={`/messages?id=${conv._id}`}
                    className="flex items-center gap-3 rounded-xl border border-gray-50 bg-gray-50/30 p-3 transition hover:bg-gray-50"
                  >
                    <div className="relative shrink-0">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={otherParticipant?.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                          {otherParticipant?.name?.charAt(0)}
                        </div>
                      )}
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="truncate text-sm font-semibold text-secondary">
                          {otherParticipant?.name || 'User'}
                        </p>
                        <span className="text-[10px] text-muted">
                          {conv.lastMessageAt ? fmtTime(conv.lastMessageAt) : ''}
                        </span>
                      </div>
                      <p className="truncate text-xs font-medium text-primary">
                        {conv.property?.title || 'Property'}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {conv.lastMessage || 'No messages yet'}
                      </p>
                    </div>
                    {unreadCount > 0 && (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* ── Recent Reviews ──────────────────────────────────────────── */}
      {recentReviews.length > 0 && (
        <section className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-secondary">
            <FiStar className="h-5 w-5 text-amber-500" /> Recent Reviews
          </h2>
          <div className="space-y-3">
            {recentReviews.map((review) => (
              <div key={review._id} className="flex items-start gap-3 rounded-xl border border-gray-50 bg-gray-50/30 p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600 font-bold text-sm">
                  {review.rating}★
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-secondary">{review.user?.name || 'User'}</p>
                    <span className="text-xs text-muted">on {review.property?.title || 'Property'}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted line-clamp-2">{review.comment}</p>
                </div>
                <span className="shrink-0 text-[10px] text-muted">{fmtDate(review.createdAt)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Quick Actions ──────────────────────────────────────────── */}
      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link
          to="/properties/add"
          className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-primary/20 hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white">
            <FiPlus className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-secondary">Add Property</p>
            <p className="text-xs text-muted">List a new rental</p>
          </div>
          <FiArrowRight className="ml-auto h-4 w-4 text-muted opacity-0 transition group-hover:opacity-100" />
        </Link>
        <Link
          to="/properties"
          className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-primary/20 hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
            <FiHome className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-secondary">Manage Properties</p>
            <p className="text-xs text-muted">Edit or remove listings</p>
          </div>
          <FiArrowRight className="ml-auto h-4 w-4 text-muted opacity-0 transition group-hover:opacity-100" />
        </Link>
        <Link
          to="/my-bookings"
          className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-primary/20 hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600 transition group-hover:bg-green-600 group-hover:text-white">
            <FiCalendar className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-secondary">View Bookings</p>
            <p className="text-xs text-muted">Manage all bookings</p>
          </div>
          <FiArrowRight className="ml-auto h-4 w-4 text-muted opacity-0 transition group-hover:opacity-100" />
        </Link>
        <Link
          to="/messages"
          className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-primary/20 hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600 transition group-hover:bg-purple-600 group-hover:text-white">
            <FiMessageSquare className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-secondary">Messages</p>
            <p className="text-xs text-muted">Tenant conversations</p>
          </div>
          <FiArrowRight className="ml-auto h-4 w-4 text-muted opacity-0 transition group-hover:opacity-100" />
        </Link>
      </section>


      {/* ── Booking Timeline ────────────────────────────────────────────── */}
      <section className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-secondary">
            <FiCalendar className="h-5 w-5 text-primary" /> Booking Timeline
          </h2>
          <button
            type="button"
            onClick={() => setShowTimeline(t => !t)}
            className="text-xs font-medium text-primary hover:text-primary-dark"
          >
            {showTimeline ? 'Hide' : 'Show all'}
          </button>
        </div>
        {showTimeline ? (
          <BookingTimeline isOwnerView />
        ) : (
          <BookingTimeline isOwnerView maxItems={3} />
        )}
      </section>

      {/* ── Activity Feed ──────────────────────────────────────────── */}
      <section className="mt-8">
        <ActivityFeed maxItems={6} />
      </section>
    </div>
  );
};

export default OwnerDashboard;
