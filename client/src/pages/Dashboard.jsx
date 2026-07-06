import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiCalendar, FiHome, FiHeart, FiCreditCard,
  FiBell, FiCheckCircle, FiXCircle, FiClock, FiSearch,
  FiArrowRight, FiTrendingUp, FiUser, FiSettings, FiMessageSquare,
  FiBookmark, FiTrash2,
} from 'react-icons/fi';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { fetchTenantDashboard } from '../services/dashboardService';
import { getProfile } from '../services/userService';
import ProfileCard from '../components/ProfileCard';
import { formatPrice, formatTimeAgo } from '../utils/constants';
import ActivityFeed from '../components/ActivityFeed';
import { useChat } from '../context/ChatContext';
import { getUserAvatar } from '../utils/avatar';
import RecentlyViewed from '../components/RecentlyViewed';
import { fetchRecommendations, fetchSavedSearches, deleteSavedSearch } from '../services/recommendationService';

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
const StatCard = ({ icon: Icon, label, value, color = 'bg-primary/10 text-primary', className = '' }) => (
  <div className={`flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md ${className}`}>
    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
      <Icon className="h-6 w-6" />
    </div>
    <div>
      <p className="text-2xl font-bold text-secondary">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </div>
  </div>
);

// ─── Status badge ─────────────────────────────────────────────────────────────
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

const PLACEHOLDER = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&q=60';
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

// ─── Tenant Dashboard ────────────────────────────────────────────────────────
const Dashboard = () => {
  const { user, loading: authLoading, token } = useAuth();
  const navigate = useNavigate();
  const isOwnerOrAdmin = ['owner', 'admin'].includes(user?.role);
  const { conversations, onlineUsers, loadingConversations } = useChat();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);

  // Redirect owner/admin to /owner/dashboard
  useEffect(() => {
    if (isOwnerOrAdmin) {
      navigate('/owner/dashboard', { replace: true });
    }
  }, [isOwnerOrAdmin, navigate]);

  useEffect(() => {
    if (authLoading || !token || isOwnerOrAdmin) return;
    const load = async () => {
      try {
        const [result, profile] = await Promise.all([
          fetchTenantDashboard(),
          getProfile().catch(() => null),
        ]);
        setData(result);
        if (profile) setProfileData(profile);
      } catch {
        // silently skip
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authLoading, token, isOwnerOrAdmin]);

  // Load personalization data
  useEffect(() => {
    if (authLoading || !token || isOwnerOrAdmin) return;
    fetchRecommendations()
      .then((d) => setRecommendations(d.personalized || []))
      .catch(() => {});
    fetchSavedSearches()
      .then((d) => setSavedSearches(d.searches || []))
      .catch(() => {});
  }, [authLoading, token, isOwnerOrAdmin]);

  if (isOwnerOrAdmin) return null;

  const stats = data?.stats || {};
  const recentBookings = data?.recentBookings || [];
  const recentPayments = data?.recentPayments || [];

  // Format booking trend for chart
  const chartData = (data?.bookingTrend || []).map((item) => ({
    name: MONTHS[(item._id.month - 1) % 12],
    bookings: item.count,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-muted capitalize">
            {user?.role} account • Dashboard overview
          </p>
        </div>
        <div className="flex items-center gap-3 self-start">
          <Link
            to="/properties"
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark"
          >
            <FiSearch className="h-4 w-4" /> Browse properties
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
          <StatCard icon={FiCalendar} label="Total bookings" value={stats.totalBookings || 0} />
          <StatCard icon={FiCheckCircle} label="Active bookings" value={stats.activeBookings || 0} color="bg-green-50 text-green-600" />
          <StatCard icon={FiTrendingUp} label="Completed" value={stats.completedBookings || 0} color="bg-blue-50 text-blue-600" />
          <StatCard icon={FiXCircle} label="Cancelled" value={stats.cancelledBookings || 0} color="bg-red-50 text-red-500" />
        </div>
      )}

      {/* ── Booking Trend Chart ─────────────────────────────────────── */}
      {!loading && chartData.length > 0 && (
        <section className="mb-10 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-secondary">Booking History</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff385c" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ff385c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#717171' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#717171' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #f0f0f0', fontSize: '13px' }}
                />
                <Area
                  type="monotone"
                  dataKey="bookings"
                  stroke="#ff385c"
                  strokeWidth={2}
                  fill="url(#colorBookings)"
                />
              </AreaChart>
            </ResponsiveContainer>
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
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}
            </div>
          ) : recentBookings.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <FiCalendar className="h-10 w-10 text-gray-200" />
              <p className="mt-3 text-sm font-medium text-secondary">No bookings yet</p>
              <Link
                to="/properties"
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
              >
                Browse properties
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((bk) => {
                const prop = bk.property || {};
                const img = (Array.isArray(prop.images) && prop.images[0]) || PLACEHOLDER;
                return (
                  <div key={bk._id} className="flex items-center gap-4 rounded-xl border border-gray-50 bg-gray-50/30 p-3 transition hover:bg-gray-50">
                    <img
                      src={img}
                      alt={prop.title}
                      className="h-14 w-20 shrink-0 rounded-lg object-cover"
                      onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-semibold text-secondary">{prop.title}</p>
                      <p className="text-xs text-muted">
                        {fmtDate(bk.checkInDate)} → {fmtDate(bk.checkOutDate)}
                      </p>
                    </div>
                    <StatusBadge status={bk.bookingStatus} />
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Recent Payments ─────────────────────────────────────── */}
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
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}
            </div>
          ) : recentPayments.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <FiCreditCard className="h-10 w-10 text-gray-200" />
              <p className="mt-3 text-sm font-medium text-secondary">No payments yet</p>
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
                      {pmt.transactionDate ? fmtDate(pmt.transactionDate) : fmtDate(pmt.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-secondary">{formatPrice(pmt.amount)}</p>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      pmt.paymentStatus === 'success' ? 'bg-green-50 text-green-600' :
                      pmt.paymentStatus === 'failed' ? 'bg-red-50 text-red-500' :
                      'bg-amber-50 text-amber-600'
                    }`}>
                      {pmt.paymentStatus === 'success' ? 'Paid' : pmt.paymentStatus === 'failed' ? 'Failed' : 'Pending'}
                    </span>
                  </div>
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
                const otherParticipant = conv.participants.find((p) => p._id !== user?._id);
                const isOnline = onlineUsers.get(otherParticipant?._id.toString())?.isOnline ?? false;
                const unreadCount = conv.unreadCounts?.get?.(user?._id) ?? conv.unreadCounts?.[user?._id] ?? 0;
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
                          {conv.lastMessageAt ? formatTimeAgo(conv.lastMessageAt) : ''}
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

      {/* ── Quick Actions ──────────────────────────────────────────── */}
      <section className="mt-10 grid gap-4 sm:grid-cols-3">
        <Link
          to="/properties"
          className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-primary/20 hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white">
            <FiSearch className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-secondary">Browse Properties</p>
            <p className="text-xs text-muted">Find your next home</p>
          </div>
          <FiArrowRight className="ml-auto h-4 w-4 text-muted opacity-0 transition group-hover:opacity-100" />
        </Link>
        <Link
          to="/my-bookings"
          className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-primary/20 hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
            <FiCalendar className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-secondary">My Bookings</p>
            <p className="text-xs text-muted">Manage your stays</p>
          </div>
          <FiArrowRight className="ml-auto h-4 w-4 text-muted opacity-0 transition group-hover:opacity-100" />
        </Link>
        <Link
          to="/wishlist"
          className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-primary/20 hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-500 transition group-hover:bg-red-500 group-hover:text-white">
            <FiHeart className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-secondary">Wishlist</p>
            <p className="text-xs text-muted">Saved properties</p>
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
            <p className="text-xs text-muted">Your conversations</p>
          </div>
          <FiArrowRight className="ml-auto h-4 w-4 text-muted opacity-0 transition group-hover:opacity-100" />
        </Link>
      </section>

      {/* ── Activity Feed ──────────────────────────────────────────── */}
      <section className="mt-8">
        <ActivityFeed maxItems={5} />
      </section>

      {/* ── Recently Viewed ────────────────────────────────────────── */}
      <section className="mt-8">
        <RecentlyViewed maxItems={6} />
      </section>

      {/* ── Recommended For You ────────────────────────────────────── */}
      {recommendations.length > 0 && (
        <section className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-secondary">✨ Recommended For You</h2>
            <Link to="/properties" className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-dark">
              View all <FiArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.slice(0, 6).map((p) => {
              const img  = (Array.isArray(p.images) && p.images[0]) || PLACEHOLDER;
              const city = p.city || p.address?.city || '';
              return (
                <Link
                  key={p._id}
                  to={`/properties/${p._id}`}
                  className="group overflow-hidden rounded-xl border border-gray-100 transition hover:shadow-md"
                  id={`rec-prop-${p._id}`}
                >
                  <div className="relative h-28 overflow-hidden">
                    <img src={img} alt={p.title} className="h-full w-full object-cover transition group-hover:scale-105"
                      onError={(e) => { e.currentTarget.src = PLACEHOLDER; }} />
                    <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] capitalize font-semibold text-secondary shadow-sm">{p.type}</span>
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-1 text-sm font-semibold text-secondary">{p.title}</p>
                    <p className="text-xs text-muted">{city}</p>
                    <p className="mt-1 text-sm font-bold text-primary">{formatPrice(p.price)}<span className="text-xs font-normal text-muted">/mo</span></p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Saved Searches ─────────────────────────────────────────── */}
      {savedSearches.length > 0 && (
        <section className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-secondary">
              <FiBookmark className="h-5 w-5 text-primary" /> Saved Searches
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {savedSearches.slice(0, 6).map((s) => {
              const params = new URLSearchParams();
              if (s.filters?.city) params.set('city', s.filters.city);
              if (s.filters?.type) params.set('type', s.filters.type);
              if (s.filters?.q)    params.set('q', s.filters.q);
              return (
                <div key={s._id} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/40 p-3">
                  <Link
                    to={`/properties?${params.toString()}`}
                    className="min-w-0 flex-1"
                  >
                    <p className="truncate text-sm font-semibold text-secondary">{s.name}</p>
                    <p className="truncate text-xs text-muted">
                      {[s.filters?.city, s.filters?.type, s.filters?.q].filter(Boolean).join(' · ') || 'All properties'}
                    </p>
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      await deleteSavedSearch(s._id).catch(() => {});
                      setSavedSearches((prev) => prev.filter((x) => x._id !== s._id));
                    }}
                    className="shrink-0 rounded p-1 text-muted transition hover:text-red-500"
                  >
                    <FiTrash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default Dashboard;
