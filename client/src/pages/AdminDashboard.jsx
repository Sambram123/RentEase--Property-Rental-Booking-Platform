import { useState, useEffect, useCallback } from 'react';
import {
  FiUsers, FiHome, FiCalendar, FiDollarSign, FiStar,
  FiBarChart2, FiSearch, FiTrash2, FiEdit, FiCheck,
  FiX, FiChevronLeft, FiChevronRight, FiShield, FiActivity,
  FiRefreshCw, FiLock, FiAlertTriangle, FiEye, FiServer,
  FiDatabase, FiWifi, FiArchive, FiCpu,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';
import {
  fetchAdminDashboard,
  fetchAdminUsers, updateAdminUser, deleteAdminUser,
  fetchAdminProperties, updatePropertyStatus, deleteAdminProperty,
  fetchAdminBookings,
  fetchAdminPayments,
  fetchAdminReviews, deleteAdminReview,
} from '../services/adminService';
import { fetchAdminRefunds, updateRefundStatus } from '../services/refundService';
import { fetchSecurityDashboard, fetchAuditLogs } from '../services/securityService';
import { fetchSystemMonitoring, triggerBackup } from '../services/systemService';
import PerformanceDashboard from '../components/PerformanceDashboard';
import { useAuth } from '../context/AuthContext';

// ── Shared helpers ────────────────────────────────────────────────────────────
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmtTrend = (arr, valueKey = 'count') =>
  arr.map((d) => ({ name: `${MONTHS[(d._id?.month || 1) - 1]} ${d._id?.year}`, value: d[valueKey] ?? d.count ?? 0 }));
const fmtCurrency = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const COLORS = ['#ff385c','#00b894','#6c5ce7','#fdcb6e','#0984e3','#e17055'];

const TAB_ITEMS = [
  { key: 'overview',     label: 'Overview',     icon: FiBarChart2 },
  { key: 'users',        label: 'Users',        icon: FiUsers },
  { key: 'properties',   label: 'Properties',   icon: FiHome },
  { key: 'bookings',     label: 'Bookings',     icon: FiCalendar },
  { key: 'payments',     label: 'Payments',     icon: FiDollarSign },
  { key: 'reviews',      label: 'Reviews',      icon: FiStar },
  { key: 'refunds',      label: 'Refunds',      icon: FiRefreshCw },
  { key: 'security',     label: 'Security',     icon: FiShield },
  { key: 'performance',  label: 'Performance',  icon: FiActivity },
  { key: 'system',       label: 'System',       icon: FiServer },
];

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color = '#ff385c', sub }) => (
  <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
    <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-10" style={{ background: color }} />
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted">{label}</p>
        <p className="mt-1 text-2xl font-bold text-secondary">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
      </div>
      <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${color}15` }}>
        <Icon className="h-5 w-5" style={{ color }} />
      </span>
    </div>
  </div>
);

// ─── Pagination ──────────────────────────────────────────────────────────────
const Pagination = ({ page, pages, onPageChange }) => {
  if (pages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-muted transition hover:bg-gray-50 disabled:opacity-40"
      >
        <FiChevronLeft className="h-4 w-4" />
      </button>
      <span className="text-sm text-muted">Page {page} of {pages}</span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pages}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-muted transition hover:bg-gray-50 disabled:opacity-40"
      >
        <FiChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
};

// ─── CHART CARD ──────────────────────────────────────────────────────────────
const ChartCard = ({ title, children }) => (
  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
    <h3 className="mb-4 text-sm font-semibold text-secondary">{title}</h3>
    {children}
  </div>
);

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
const AdminDashboard = () => {
  const { token } = useAuth();
  const [tab, setTab] = useState('overview');
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);


  // Section states
  const [users, setUsers] = useState({ users: [], total: 0, page: 1, pages: 1 });
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');

  const [properties, setProperties] = useState({ properties: [], total: 0, page: 1, pages: 1 });
  const [propSearch, setPropSearch] = useState('');

  const [bookings, setBookings] = useState({ bookings: [], total: 0, page: 1, pages: 1 });
  const [bookingStatus, setBookingStatus] = useState('');

  const [payments, setPayments] = useState({ payments: [], total: 0, page: 1, pages: 1, summary: {} });
  const [paymentStatus, setPaymentStatus] = useState('');

  const [reviews, setReviews] = useState({ reviews: [], total: 0, page: 1, pages: 1 });

  // Refund state
  const [refunds, setRefunds] = useState({ refunds: [], total: 0, page: 1, pages: 1, summary: {} });
  const [refundStatusFilter, setRefundStatusFilter] = useState('');

  // Security state
  const [securityData, setSecurityData] = useState(null);
  const [auditLogs, setAuditLogs] = useState({ logs: [], total: 0, page: 1, pages: 1 });
  const [auditActionFilter, setAuditActionFilter] = useState('');
  const [securityLoading, setSecurityLoading] = useState(false);

  // System monitoring state
  const [systemData, setSystemData] = useState(null);
  const [systemLoading, setSystemLoading] = useState(false);
  const [backupInProgress, setBackupInProgress] = useState(false);

  // ── Load dashboard ────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchAdminDashboard();
        setDashboard(data);
      } catch (err) {
        toast.error(err.message || 'Failed to load admin dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Section data loaders ──────────────────────────────────────────────────
  const loadUsers = useCallback(async (page = 1) => {
    try {
      const data = await fetchAdminUsers({ page, search: userSearch, role: userRoleFilter });
      setUsers(data);
    } catch (err) { toast.error(err.message); }
  }, [userSearch, userRoleFilter]);

  const loadProperties = useCallback(async (page = 1) => {
    try {
      const data = await fetchAdminProperties({ page, search: propSearch });
      setProperties(data);
    } catch (err) { toast.error(err.message); }
  }, [propSearch]);

  const loadBookings = useCallback(async (page = 1) => {
    try {
      const data = await fetchAdminBookings({ page, status: bookingStatus });
      setBookings(data);
    } catch (err) { toast.error(err.message); }
  }, [bookingStatus]);

  const loadPayments = useCallback(async (page = 1) => {
    try {
      const data = await fetchAdminPayments({ page, status: paymentStatus });
      setPayments(data);
    } catch (err) { toast.error(err.message); }
  }, [paymentStatus]);

  const loadReviews = useCallback(async (page = 1) => {
    try {
      const data = await fetchAdminReviews({ page });
      setReviews(data);
    } catch (err) { toast.error(err.message); }
  }, []);

  const loadRefunds = useCallback(async (page = 1) => {
    try {
      const data = await fetchAdminRefunds({ page, status: refundStatusFilter });
      setRefunds(data);
    } catch (err) { toast.error(err.message); }
  }, [refundStatusFilter]);

  const loadSecurity = useCallback(async () => {
    setSecurityLoading(true);
    try {
      const data = await fetchSecurityDashboard();
      setSecurityData(data);
    } catch (err) { toast.error(err.message || 'Failed to load security data'); }
    finally { setSecurityLoading(false); }
  }, []);

  const loadAuditLogs = useCallback(async (page = 1) => {
    try {
      const data = await fetchAuditLogs({ page, action: auditActionFilter || undefined });
      setAuditLogs(data);
    } catch (err) { toast.error(err.message); }
  }, [auditActionFilter]);

  const loadSystem = useCallback(async () => {
    setSystemLoading(true);
    try {
      const data = await fetchSystemMonitoring();
      setSystemData(data);
    } catch (err) { toast.error(err.message || 'Failed to load system data'); }
    finally { setSystemLoading(false); }
  }, []);

  const handleTriggerBackup = async () => {
    setBackupInProgress(true);
    try {
      const result = await triggerBackup('manual');
      if (result.success) {
        toast.success('Backup completed successfully');
      } else {
        toast.error(`Backup skipped: ${result.error}`);
      }
      loadSystem();
    } catch (err) { toast.error(err.message); }
    finally { setBackupInProgress(false); }
  };

  // ── Load on tab switch ─────────────────────────────────────────────────────
  useEffect(() => {
    if (tab === 'users') loadUsers();
    else if (tab === 'properties') loadProperties();
    else if (tab === 'bookings') loadBookings();
    else if (tab === 'payments') loadPayments();
    else if (tab === 'reviews') loadReviews();
    else if (tab === 'refunds') loadRefunds();
    else if (tab === 'security') { loadSecurity(); loadAuditLogs(); }
    else if (tab === 'system') loadSystem();
  }, [tab, loadUsers, loadProperties, loadBookings, loadPayments, loadReviews, loadRefunds, loadSecurity, loadAuditLogs, loadSystem]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleRoleChange = async (id, role) => {
    try {
      await updateAdminUser(id, { role });
      toast.success('Role updated');
      loadUsers(users.page);
    } catch (err) { toast.error(err.message); }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    try {
      await deleteAdminUser(id);
      toast.success('User deleted');
      loadUsers(users.page);
    } catch (err) { toast.error(err.message); }
  };

  const handlePropertyAction = async (id, status) => {
    try {
      await updatePropertyStatus(id, status);
      toast.success(`Property ${status}`);
      loadProperties(properties.page);
    } catch (err) { toast.error(err.message); }
  };

  const handleDeleteProperty = async (id) => {
    if (!confirm('Delete this property?')) return;
    try {
      await deleteAdminProperty(id);
      toast.success('Property deleted');
      loadProperties(properties.page);
    } catch (err) { toast.error(err.message); }
  };

  const handleDeleteReview = async (id) => {
    if (!confirm('Delete this review?')) return;
    try {
      await deleteAdminReview(id);
      toast.success('Review deleted');
      loadReviews(reviews.page);
    } catch (err) { toast.error(err.message); }
  };

  const handleRefundStatusChange = async (id, status, note = '') => {
    try {
      await updateRefundStatus(id, status, note);
      toast.success(`Refund ${status}`);
      loadRefunds(refunds.page);
    } catch (err) { toast.error(err.message); }
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const s = dashboard?.stats || {};
  const analytics = dashboard?.analytics || {};

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <FiShield className="h-5 w-5 text-primary" />
            </span>
            <h1 className="text-2xl font-bold text-secondary">Admin Dashboard</h1>
          </div>
          <p className="mt-1 text-sm text-muted">Manage your platform from one place</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">
          <FiActivity className="h-3 w-3" />
          Platform Active
        </span>
      </div>

      {/* Sidebar Tabs (horizontal on mobile, sidebar-ish on desktop) */}
      <div className="flex flex-col gap-6 lg:flex-row">
        <nav className="flex flex-row gap-1 overflow-x-auto rounded-2xl border border-gray-100 bg-gray-50/60 p-1.5 lg:w-52 lg:flex-col lg:self-start" id="admin-sidebar">
          {TAB_ITEMS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              id={`admin-tab-${key}`}
              className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                tab === key
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-muted hover:bg-white/60 hover:text-secondary'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* Content area */}
        <div className="min-w-0 flex-1">
          {/* ═══════ OVERVIEW ═══════ */}
          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                <StatCard icon={FiUsers} label="Total Users" value={s.totalUsers} color="#6c5ce7" sub={`${s.totalOwners} owners · ${s.totalTenants} tenants`} />
                <StatCard icon={FiHome} label="Properties" value={s.totalProperties} color="#00b894" sub={`${s.activeProperties} active`} />
                <StatCard icon={FiCalendar} label="Bookings" value={s.totalBookings} color="#0984e3" sub={`${s.activeBookings} active`} />
                <StatCard icon={FiDollarSign} label="Revenue" value={fmtCurrency(s.totalRevenue)} color="#ff385c" sub={`${s.successPayments} payments`} />
              </div>

              {/* Charts */}
              <div className="grid gap-6 md:grid-cols-2">
                <ChartCard title="User Growth (6 months)">
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={fmtTrend(analytics.userGrowth || [])}>
                      <defs>
                        <linearGradient id="ugFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6c5ce7" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#6c5ce7" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="value" stroke="#6c5ce7" fill="url(#ugFill)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Revenue Trend (6 months)">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={fmtTrend(analytics.revenueTrend || [], 'revenue')}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => fmtCurrency(v)} />
                      <Bar dataKey="value" fill="#ff385c" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Booking Trends (6 months)">
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={fmtTrend(analytics.bookingTrend || [])}>
                      <defs>
                        <linearGradient id="btFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0984e3" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#0984e3" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="value" stroke="#0984e3" fill="url(#btFill)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Property Growth (6 months)">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={fmtTrend(analytics.propertyGrowth || [])}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#00b894" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>

              {/* Recent Activity */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <h3 className="mb-3 text-sm font-semibold text-secondary">Recent Users</h3>
                  <div className="space-y-3">
                    {(dashboard?.recentUsers || []).map((u) => (
                      <div key={u._id} className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {u.name?.[0]?.toUpperCase() || '?'}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-secondary">{u.name}</p>
                          <p className="text-xs text-muted">{u.email}</p>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          u.role === 'admin' ? 'bg-purple-100 text-purple-600'
                            : u.role === 'owner' ? 'bg-emerald-100 text-emerald-600'
                            : 'bg-blue-100 text-blue-600'
                        }`}>{u.role}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <h3 className="mb-3 text-sm font-semibold text-secondary">Recent Bookings</h3>
                  <div className="space-y-3">
                    {(dashboard?.recentBookings || []).map((b) => (
                      <div key={b._id} className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                          <FiCalendar className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-secondary">
                            {b.property?.title || 'Property'}
                          </p>
                          <p className="text-xs text-muted">{b.user?.name} · {fmtCurrency(b.totalAmount)}</p>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          b.bookingStatus === 'confirmed' ? 'bg-emerald-100 text-emerald-600'
                            : b.bookingStatus === 'pending' ? 'bg-amber-100 text-amber-600'
                            : b.bookingStatus === 'cancelled' ? 'bg-red-100 text-red-600'
                            : 'bg-gray-100 text-gray-600'
                        }`}>{b.bookingStatus}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════ USERS ═══════ */}
          {tab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    placeholder="Search users…"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
                    className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm text-secondary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    id="admin-user-search"
                  />
                </div>
                <select
                  value={userRoleFilter}
                  onChange={(e) => { setUserRoleFilter(e.target.value); }}
                  className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-secondary outline-none transition focus:border-primary"
                  id="admin-user-role-filter"
                >
                  <option value="">All Roles</option>
                  <option value="tenant">Tenant</option>
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                </select>
                <button onClick={() => loadUsers()} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-dark">Search</button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <th className="px-4 py-3 font-semibold text-muted">Name</th>
                      <th className="px-4 py-3 font-semibold text-muted">Email</th>
                      <th className="px-4 py-3 font-semibold text-muted">Role</th>
                      <th className="px-4 py-3 font-semibold text-muted">Joined</th>
                      <th className="px-4 py-3 font-semibold text-muted">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.users.map((u) => (
                      <tr key={u._id} className="border-b border-gray-50 transition hover:bg-gray-50/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                              {u.name?.[0]?.toUpperCase() || '?'}
                            </span>
                            <span className="font-medium text-secondary">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted">{u.email}</td>
                        <td className="px-4 py-3">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u._id, e.target.value)}
                            className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-medium outline-none transition focus:border-primary"
                          >
                            <option value="tenant">Tenant</option>
                            <option value="owner">Owner</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-muted">{fmtDate(u.createdAt)}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleDeleteUser(u._id)}
                            className="rounded-lg p-1.5 text-red-400 transition hover:bg-red-50 hover:text-red-600"
                            title="Delete user"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {users.users.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">No users found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination page={users.page} pages={users.pages} onPageChange={(p) => loadUsers(p)} />
            </div>
          )}

          {/* ═══════ PROPERTIES ═══════ */}
          {tab === 'properties' && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    placeholder="Search properties…"
                    value={propSearch}
                    onChange={(e) => setPropSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadProperties()}
                    className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm text-secondary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    id="admin-prop-search"
                  />
                </div>
                <button onClick={() => loadProperties()} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-dark">Search</button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <th className="px-4 py-3 font-semibold text-muted">Property</th>
                      <th className="px-4 py-3 font-semibold text-muted">Owner</th>
                      <th className="px-4 py-3 font-semibold text-muted">Price</th>
                      <th className="px-4 py-3 font-semibold text-muted">Status</th>
                      <th className="px-4 py-3 font-semibold text-muted">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {properties.properties.map((p) => (
                      <tr key={p._id} className="border-b border-gray-50 transition hover:bg-gray-50/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {p.images?.[0] ? (
                              <img src={p.images[0]} alt="" className="h-8 w-8 rounded-lg object-cover" />
                            ) : (
                              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100"><FiHome className="h-4 w-4 text-muted" /></span>
                            )}
                            <div className="min-w-0">
                              <p className="truncate font-medium text-secondary">{p.title}</p>
                              <p className="text-xs text-muted">{p.city || p.address?.city}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted">{p.owner?.name || '—'}</td>
                        <td className="px-4 py-3 font-medium">{fmtCurrency(p.price)}/mo</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                            p.availability ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                          }`}>{p.availability ? 'Active' : 'Inactive'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => handlePropertyAction(p._id, 'approved')} title="Approve" className="rounded-lg p-1.5 text-emerald-400 transition hover:bg-emerald-50 hover:text-emerald-600">
                              <FiCheck className="h-4 w-4" />
                            </button>
                            <button onClick={() => handlePropertyAction(p._id, 'rejected')} title="Reject" className="rounded-lg p-1.5 text-amber-400 transition hover:bg-amber-50 hover:text-amber-600">
                              <FiX className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDeleteProperty(p._id)} title="Delete" className="rounded-lg p-1.5 text-red-400 transition hover:bg-red-50 hover:text-red-600">
                              <FiTrash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {properties.properties.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">No properties found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination page={properties.page} pages={properties.pages} onPageChange={(p) => loadProperties(p)} />
            </div>
          )}

          {/* ═══════ BOOKINGS ═══════ */}
          {tab === 'bookings' && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <select
                  value={bookingStatus}
                  onChange={(e) => setBookingStatus(e.target.value)}
                  className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-secondary outline-none transition focus:border-primary"
                  id="admin-booking-status"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
                <button onClick={() => loadBookings()} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-dark">Filter</button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <th className="px-4 py-3 font-semibold text-muted">Property</th>
                      <th className="px-4 py-3 font-semibold text-muted">User</th>
                      <th className="px-4 py-3 font-semibold text-muted">Check-in</th>
                      <th className="px-4 py-3 font-semibold text-muted">Check-out</th>
                      <th className="px-4 py-3 font-semibold text-muted">Amount</th>
                      <th className="px-4 py-3 font-semibold text-muted">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.bookings.map((b) => (
                      <tr key={b._id} className="border-b border-gray-50 transition hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium text-secondary">{b.property?.title || '—'}</td>
                        <td className="px-4 py-3 text-muted">{b.user?.name || '—'}</td>
                        <td className="px-4 py-3 text-muted">{fmtDate(b.checkInDate)}</td>
                        <td className="px-4 py-3 text-muted">{fmtDate(b.checkOutDate)}</td>
                        <td className="px-4 py-3 font-medium">{fmtCurrency(b.totalAmount)}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                            b.bookingStatus === 'confirmed' ? 'bg-emerald-100 text-emerald-600'
                              : b.bookingStatus === 'pending' ? 'bg-amber-100 text-amber-600'
                              : b.bookingStatus === 'cancelled' ? 'bg-red-100 text-red-600'
                              : 'bg-gray-100 text-gray-600'
                          }`}>{b.bookingStatus}</span>
                        </td>
                      </tr>
                    ))}
                    {bookings.bookings.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">No bookings found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination page={bookings.page} pages={bookings.pages} onPageChange={(p) => loadBookings(p)} />
            </div>
          )}

          {/* ═══════ PAYMENTS ═══════ */}
          {tab === 'payments' && (
            <div className="space-y-4">
              {/* Summary cards */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatCard icon={FiDollarSign} label="Total Revenue" value={fmtCurrency(payments.summary?.totalRevenue)} color="#ff385c" />
                <StatCard icon={FiCheck} label="Successful" value={payments.summary?.successCount || 0} color="#00b894" />
                <StatCard icon={FiX} label="Failed" value={payments.summary?.failedCount || 0} color="#e17055" />
                <StatCard icon={FiActivity} label="Pending" value={payments.summary?.pendingCount || 0} color="#fdcb6e" />
              </div>

              <div className="flex gap-3">
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-secondary outline-none transition focus:border-primary"
                  id="admin-payment-status"
                >
                  <option value="">All Statuses</option>
                  <option value="success">Success</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
                <button onClick={() => loadPayments()} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-dark">Filter</button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <th className="px-4 py-3 font-semibold text-muted">User</th>
                      <th className="px-4 py-3 font-semibold text-muted">Property</th>
                      <th className="px-4 py-3 font-semibold text-muted">Amount</th>
                      <th className="px-4 py-3 font-semibold text-muted">Status</th>
                      <th className="px-4 py-3 font-semibold text-muted">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.payments.map((p) => (
                      <tr key={p._id} className="border-b border-gray-50 transition hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-secondary">{p.user?.name || '—'}</td>
                        <td className="px-4 py-3 text-muted">{p.property?.title || '—'}</td>
                        <td className="px-4 py-3 font-medium">{fmtCurrency(p.amount)}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                            p.paymentStatus === 'success' ? 'bg-emerald-100 text-emerald-600'
                              : p.paymentStatus === 'pending' ? 'bg-amber-100 text-amber-600'
                              : 'bg-red-100 text-red-600'
                          }`}>{p.paymentStatus}</span>
                        </td>
                        <td className="px-4 py-3 text-muted">{fmtDate(p.transactionDate || p.createdAt)}</td>
                      </tr>
                    ))}
                    {payments.payments.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">No payments found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination page={payments.page} pages={payments.pages} onPageChange={(p) => loadPayments(p)} />
            </div>
          )}

          {/* ═══════ REVIEWS ═══════ */}
          {tab === 'reviews' && (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <th className="px-4 py-3 font-semibold text-muted">User</th>
                      <th className="px-4 py-3 font-semibold text-muted">Property</th>
                      <th className="px-4 py-3 font-semibold text-muted">Rating</th>
                      <th className="px-4 py-3 font-semibold text-muted">Comment</th>
                      <th className="px-4 py-3 font-semibold text-muted">Date</th>
                      <th className="px-4 py-3 font-semibold text-muted">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.reviews.map((r) => (
                      <tr key={r._id} className="border-b border-gray-50 transition hover:bg-gray-50/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                              {r.user?.name?.[0]?.toUpperCase() || '?'}
                            </span>
                            <span className="text-secondary">{r.user?.name || '—'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted">{r.property?.title || '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <FiStar key={i} className={`h-3.5 w-3.5 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                            ))}
                          </div>
                        </td>
                        <td className="max-w-xs px-4 py-3 text-muted">
                          <p className="line-clamp-2">{r.comment}</p>
                        </td>
                        <td className="px-4 py-3 text-muted">{fmtDate(r.createdAt)}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleDeleteReview(r._id)}
                            className="rounded-lg p-1.5 text-red-400 transition hover:bg-red-50 hover:text-red-600"
                            title="Delete review"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {reviews.reviews.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">No reviews found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination page={reviews.page} pages={reviews.pages} onPageChange={(p) => loadReviews(p)} />
            </div>
          )}

          {/* ═══════ REFUNDS ═══════ */}
          {tab === 'refunds' && (
            <div className="space-y-4">
              {/* Summary cards */}
              {refunds.summary && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <StatCard icon={FiRefreshCw} label="Total Refunds" value={refunds.total || 0} color="#6c5ce7" />
                  <StatCard icon={FiDollarSign} label="Total Amount" value={`₹${((refunds.summary?.totalRefundAmount || 0)).toLocaleString('en-IN')}`} color="#e17055" />
                  <StatCard icon={FiActivity} label="Pending" value={refunds.summary?.pendingCount || 0} color="#fdcb6e" />
                  <StatCard icon={FiCheck} label="Processed" value={refunds.summary?.processedCount || 0} color="#00b894" />
                </div>
              )}

              {/* Filter */}
              <div className="flex gap-3">
                <select
                  value={refundStatusFilter}
                  onChange={(e) => setRefundStatusFilter(e.target.value)}
                  className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-secondary outline-none transition focus:border-primary"
                  id="admin-refund-status"
                >
                  <option value="">All Statuses</option>
                  <option value="requested">Requested</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="processed">Processed</option>
                </select>
                <button onClick={() => loadRefunds()} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-dark">Filter</button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <th className="px-4 py-3 font-semibold text-muted">Tenant</th>
                      <th className="px-4 py-3 font-semibold text-muted">Property</th>
                      <th className="px-4 py-3 font-semibold text-muted">Amount</th>
                      <th className="px-4 py-3 font-semibold text-muted">%</th>
                      <th className="px-4 py-3 font-semibold text-muted">Policy</th>
                      <th className="px-4 py-3 font-semibold text-muted">Requested</th>
                      <th className="px-4 py-3 font-semibold text-muted">Status</th>
                      <th className="px-4 py-3 font-semibold text-muted">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refunds.refunds.map((r) => (
                      <tr key={r._id} className="border-b border-gray-50 transition hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-secondary">{r.tenant?.name || '—'}</td>
                        <td className="px-4 py-3 text-muted">{r.property?.title || '—'}</td>
                        <td className="px-4 py-3 font-medium text-red-600">₹{(r.refundAmount || 0).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-secondary">{r.refundPercentage}%</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                            r.cancellationPolicy === 'flexible' ? 'bg-green-100 text-green-700'
                              : r.cancellationPolicy === 'moderate' ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                          }`}>{r.cancellationPolicy}</span>
                        </td>
                        <td className="px-4 py-3 text-muted">{fmtDate(r.requestedAt)}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                            r.refundStatus === 'requested' ? 'bg-amber-100 text-amber-700'
                              : r.refundStatus === 'approved' ? 'bg-green-100 text-green-700'
                              : r.refundStatus === 'rejected' ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>{r.refundStatus}</span>
                        </td>
                        <td className="px-4 py-3">
                          {r.refundStatus === 'requested' && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleRefundStatusChange(r._id, 'approved')}
                                title="Approve"
                                className="rounded-lg p-1.5 text-emerald-500 transition hover:bg-emerald-50 hover:text-emerald-700"
                                id={`approve-refund-${r._id}`}
                              >
                                <FiCheck className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleRefundStatusChange(r._id, 'rejected')}
                                title="Reject"
                                className="rounded-lg p-1.5 text-red-400 transition hover:bg-red-50 hover:text-red-600"
                                id={`reject-refund-${r._id}`}
                              >
                                <FiX className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                          {r.refundStatus === 'approved' && (
                            <button
                              onClick={() => handleRefundStatusChange(r._id, 'processed')}
                              title="Mark as processed"
                              className="rounded-lg px-2 py-1 text-[10px] font-medium text-blue-600 hover:bg-blue-50"
                              id={`process-refund-${r._id}`}
                            >
                              Mark processed
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {refunds.refunds.length === 0 && (
                      <tr><td colSpan={8} className="px-4 py-10 text-center text-muted">No refunds found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination page={refunds.page} pages={refunds.pages} onPageChange={(p) => loadRefunds(p)} />
            </div>
          )}

          {/* ═══════ SECURITY ═══════ */}
          {tab === 'security' && (
            <div className="space-y-6">
              {securityLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : (
                <>
                  {/* Summary stat cards */}
                  {securityData && (
                    <>
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                        <StatCard icon={FiAlertTriangle} label="Failed Logins (24h)" value={securityData.summary?.failedLoginsLast24h ?? '—'} color="#e17055" />
                        <StatCard icon={FiCheck} label="Successful Logins (24h)" value={securityData.summary?.totalLoginsLast24h ?? '—'} color="#00b894" />
                        <StatCard icon={FiUsers} label="New Registrations (24h)" value={securityData.summary?.registrationsLast24h ?? '—'} color="#6c5ce7" />
                        <StatCard icon={FiLock} label="Unauthorized Attempts" value={securityData.summary?.unauthorizedAccessLast24h ?? '—'} color="#ff385c" />
                        <StatCard icon={FiActivity} label="Failure Rate" value={`${securityData.summary?.loginFailureRate ?? 0}%`} color="#fdcb6e" />
                      </div>

                      {/* Suspicious IPs */}
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                          <div className="mb-3 flex items-center gap-2">
                            <FiAlertTriangle className="h-4 w-4 text-amber-500" />
                            <h3 className="text-sm font-semibold text-secondary">Top Suspicious IPs (7 days)</h3>
                          </div>
                          <div className="space-y-2">
                            {(securityData.topSuspiciousIPs || []).length === 0 && (
                              <p className="py-4 text-center text-xs text-muted">No suspicious activity detected</p>
                            )}
                            {(securityData.topSuspiciousIPs || []).map((ip, i) => (
                              <div key={i} className="flex items-center justify-between rounded-xl border border-gray-50 bg-gray-50/60 px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                                    ip.count >= 10 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                                  }`}>{i + 1}</span>
                                  <span className="font-mono text-sm text-secondary">{ip._id}</span>
                                </div>
                                <div className="text-right">
                                  <span className="block text-sm font-semibold text-red-500">{ip.count} attempts</span>
                                  <span className="text-[10px] text-muted">{ip.lastAttempt ? new Date(ip.lastAttempt).toLocaleDateString('en-IN') : ''}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Recent failed logins */}
                        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                          <div className="mb-3 flex items-center gap-2">
                            <FiLock className="h-4 w-4 text-red-500" />
                            <h3 className="text-sm font-semibold text-secondary">Recent Failed Logins</h3>
                          </div>
                          <div className="space-y-2">
                            {(securityData.recentFailedLogins || []).length === 0 && (
                              <p className="py-4 text-center text-xs text-muted">No recent failures</p>
                            )}
                            {(securityData.recentFailedLogins || []).map((log) => (
                              <div key={log._id} className="flex items-center justify-between rounded-xl border border-gray-50 bg-red-50/40 px-3 py-2">
                                <div>
                                  <p className="text-xs font-medium text-secondary">{log.metadata?.email || 'Unknown'}</p>
                                  <p className="font-mono text-[10px] text-muted">{log.ipAddress || 'N/A'}</p>
                                </div>
                                <span className="text-[10px] text-muted">{new Date(log.createdAt).toLocaleString('en-IN', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Action breakdown */}
                      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="mb-3 flex items-center gap-2">
                          <FiActivity className="h-4 w-4 text-primary" />
                          <h3 className="text-sm font-semibold text-secondary">Action Breakdown (7 days)</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(securityData.actionBreakdown7d || []).map((item) => (
                            <span key={item._id} className="rounded-full border border-gray-100 bg-gray-50 px-3 py-1 text-xs font-medium text-secondary">
                              <span className="text-muted">{item._id}</span>: <span className="font-bold text-primary">{item.count}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Audit Logs */}
                  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <FiEye className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-semibold text-secondary">Audit Logs</h3>
                      </div>
                      <div className="flex gap-2">
                        <select
                          value={auditActionFilter}
                          onChange={(e) => setAuditActionFilter(e.target.value)}
                          className="rounded-xl border border-gray-200 px-3 py-2 text-xs text-secondary outline-none focus:border-primary"
                          id="audit-action-filter"
                        >
                          <option value="">All Actions</option>
                          <option value="login_success">Login Success</option>
                          <option value="login_failed">Login Failed</option>
                          <option value="register">Register</option>
                          <option value="payment_verified">Payment Verified</option>
                          <option value="payment_failed">Payment Failed</option>
                          <option value="booking_create">Booking Create</option>
                          <option value="booking_cancel">Booking Cancel</option>
                          <option value="refund_request">Refund Request</option>
                          <option value="admin_user_delete">Admin User Delete</option>
                          <option value="unauthorized_access">Unauthorized Access</option>
                        </select>
                        <button
                          onClick={() => loadAuditLogs()}
                          className="rounded-xl bg-primary px-3 py-2 text-xs font-medium text-white hover:bg-primary-dark"
                          id="audit-filter-btn"
                        >
                          Filter
                        </button>
                        <button
                          onClick={() => { setAuditActionFilter(''); loadAuditLogs(1); }}
                          className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-muted hover:bg-gray-50"
                        >
                          Reset
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gray-50/60">
                            <th className="px-4 py-3 font-semibold text-muted">Action</th>
                            <th className="px-4 py-3 font-semibold text-muted">Actor</th>
                            <th className="px-4 py-3 font-semibold text-muted">IP Address</th>
                            <th className="px-4 py-3 font-semibold text-muted">Status</th>
                            <th className="px-4 py-3 font-semibold text-muted">Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {auditLogs.logs?.map((log) => (
                            <tr key={log._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                              <td className="px-4 py-2.5">
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  log.action.includes('failed') || log.action.includes('invalid')
                                    ? 'bg-red-100 text-red-600'
                                    : log.action.includes('success') || log.action.includes('verified')
                                    ? 'bg-emerald-100 text-emerald-600'
                                    : log.action.includes('delete') || log.action.includes('cancel')
                                    ? 'bg-amber-100 text-amber-600'
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {log.action}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-muted">{log.actor?.email || log.actor?.name || 'Anonymous'}</td>
                              <td className="px-4 py-2.5 font-mono text-muted">{log.ipAddress || '—'}</td>
                              <td className="px-4 py-2.5">
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  log.success ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                                }`}>{log.success ? 'Success' : 'Failed'}</span>
                              </td>
                              <td className="px-4 py-2.5 text-muted">{new Date(log.createdAt).toLocaleString('en-IN', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                            </tr>
                          ))}
                          {(!auditLogs.logs || auditLogs.logs.length === 0) && (
                            <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">No audit logs found</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <Pagination page={auditLogs.page} pages={auditLogs.pages} onPageChange={(p) => loadAuditLogs(p)} />
                  </div>
                </>
              )}
            </div>
          )}

          {/* ═══════ PERFORMANCE ═══════ */}
          {tab === 'performance' && (
            <PerformanceDashboard token={token} />
          )}

          {/* ═══════ SYSTEM MONITORING ═══════ */}
          {tab === 'system' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-secondary">System Monitoring</h2>
                <div className="flex gap-2">
                  <button
                    onClick={loadSystem}
                    disabled={systemLoading}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-muted hover:bg-gray-50 transition"
                  >
                    <FiRefreshCw className={`h-3.5 w-3.5 ${systemLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                  <button
                    onClick={handleTriggerBackup}
                    disabled={backupInProgress}
                    className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-sm text-primary hover:bg-primary/20 transition"
                  >
                    <FiArchive className="h-3.5 w-3.5" />
                    {backupInProgress ? 'Backing up…' : 'Trigger Backup'}
                  </button>
                </div>
              </div>

              {systemLoading && !systemData ? (
                <div className="flex h-40 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : systemData ? (
                <>
                  {/* Health Cards */}
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
                          <FiServer className="h-4 w-4 text-emerald-500" />
                        </span>
                        <div>
                          <p className="text-xs text-muted">Server</p>
                          <p className="text-sm font-semibold capitalize text-emerald-600">{systemData.server?.status}</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                          systemData.database?.status === 'connected' ? 'bg-emerald-50' : 'bg-red-50'
                        }`}>
                          <FiDatabase className={`h-4 w-4 ${
                            systemData.database?.status === 'connected' ? 'text-emerald-500' : 'text-red-500'
                          }`} />
                        </span>
                        <div>
                          <p className="text-xs text-muted">Database</p>
                          <p className={`text-sm font-semibold capitalize ${
                            systemData.database?.status === 'connected' ? 'text-emerald-600' : 'text-red-600'
                          }`}>{systemData.database?.status}</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                          <FiWifi className="h-4 w-4 text-blue-500" />
                        </span>
                        <div>
                          <p className="text-xs text-muted">API</p>
                          <p className="text-sm font-semibold capitalize text-blue-600">{systemData.api?.status}</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50">
                          <FiActivity className="h-4 w-4 text-purple-500" />
                        </span>
                        <div>
                          <p className="text-xs text-muted">Uptime</p>
                          <p className="text-sm font-semibold text-purple-600">{systemData.server?.uptimeFormatted}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Server & Memory Details */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <FiCpu className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-semibold text-secondary">Memory Usage</h3>
                      </div>
                      <div className="space-y-3">
                        {[['Heap Used', systemData.server?.memory?.heapUsedMB],
                          ['Heap Total', systemData.server?.memory?.heapTotalMB],
                          ['RSS', systemData.server?.memory?.rssMB]].map(([label, val]) => (
                          <div key={label}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-muted">{label}</span>
                              <span className="font-medium text-secondary">{val} MB</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${Math.min((val / 512) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <FiServer className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-semibold text-secondary">Server Info</h3>
                      </div>
                      <dl className="space-y-2 text-sm">
                        {[
                          ['Environment', systemData.api?.environment],
                          ['Version', systemData.api?.version],
                          ['Node.js', systemData.server?.nodeVersion],
                          ['Platform', systemData.server?.platform],
                          ['DB Host', systemData.database?.host],
                          ['DB Name', systemData.database?.name],
                        ].map(([k, v]) => (
                          <div key={k} className="flex justify-between">
                            <dt className="text-muted">{k}</dt>
                            <dd className="font-medium text-secondary truncate max-w-[160px]">{v || '—'}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </div>

                  {/* Error Summary */}
                  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <FiAlertTriangle className="h-4 w-4 text-amber-500" />
                      <h3 className="text-sm font-semibold text-secondary">Error Summary</h3>
                      <span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-xs text-muted">
                        {systemData.errors?.total || 0} total
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {[
                        { label: 'API Failures', val: systemData.errors?.apiFailures, color: 'red' },
                        { label: 'Payment Failures', val: systemData.errors?.paymentFailures, color: 'orange' },
                        { label: 'Auth Failures', val: systemData.errors?.authFailures, color: 'yellow' },
                        { label: 'Email Failures', val: systemData.errors?.emailFailures, color: 'purple' },
                      ].map(({ label, val, color }) => (
                        <div key={label} className={`rounded-xl bg-${color}-50 p-3`}>
                          <p className={`text-xs text-${color}-600`}>{label}</p>
                          <p className={`text-2xl font-bold text-${color}-700 mt-0.5`}>{val || 0}</p>
                        </div>
                      ))}
                    </div>
                    {systemData.errors?.recentErrors?.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-medium text-muted mb-2">Recent Errors</p>
                        <div className="space-y-1.5">
                          {systemData.errors.recentErrors.slice(0, 5).map((e) => (
                            <div key={e.id} className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs">
                              <FiAlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-red-500" />
                              <div className="min-w-0">
                                <span className="font-medium text-red-700">[{e.type}]</span>{' '}
                                <span className="text-red-600 truncate">{e.route} — {e.message}</span>
                              </div>
                              <span className="ml-auto shrink-0 text-red-400">
                                {new Date(e.timestamp).toLocaleTimeString('en-IN')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Backups */}
                  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <FiArchive className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold text-secondary">Backup Status</h3>
                      <span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-xs text-muted">
                        {systemData.backups?.count || 0} backups
                      </span>
                    </div>
                    {systemData.backups?.recent?.length > 0 ? (
                      <div className="space-y-2">
                        {systemData.backups.recent.map((b, i) => (
                          <div key={i} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                            <span className="font-mono text-xs text-secondary truncate max-w-[200px]">{b.name}</span>
                            <span className="text-xs text-muted">
                              {new Date(b.createdAt).toLocaleDateString('en-IN')}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted text-center py-4">
                        No backups yet. Click "Trigger Backup" to create one.
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex h-40 items-center justify-center text-muted">
                  Click Refresh to load system data.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

