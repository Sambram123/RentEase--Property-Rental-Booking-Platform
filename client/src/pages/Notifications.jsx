import { useState, useEffect, useCallback } from 'react';
import {
  FiBell, FiCheck, FiCheckCircle, FiTrash2, FiChevronLeft,
  FiChevronRight, FiInbox, FiFilter,
} from 'react-icons/fi';
import { MdNotificationsActive } from 'react-icons/md';
import toast from 'react-hot-toast';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '../services/notificationService';
import { useNotifications, getNotifConfig } from '../context/NotificationContext';
import { usePushNotifications } from '../hooks/usePushNotifications';
import Loader from '../components/Loader';

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
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const TYPE_COLORS = {
  booking_created:   'bg-blue-500/10 text-blue-500 border-blue-500/20',
  booking_confirmed: 'bg-green-500/10 text-green-600 border-green-500/20',
  booking_cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
  booking_completed: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  payment_success:   'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  payment_failed:    'bg-orange-500/10 text-orange-600 border-orange-500/20',
  review_added:      'bg-amber-500/10 text-amber-600 border-amber-500/20',
  system:            'bg-gray-500/10 text-gray-600 border-gray-500/20',
};

const FILTER_TABS = [
  { key: 'all',    label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'read',   label: 'Read' },
];

const Notifications = () => {
  const { refreshUnreadCount, decrementUnread, clearUnreadCount } = useNotifications();
  const { permission, isSupported, requestPermission } = usePushNotifications();
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);
  const [permDismissed, setPermDismissed] = useState(
    () => localStorage.getItem('push-perm-dismissed') === 'true'
  );

  const handleEnableNotifications = async () => {
    const result = await requestPermission();
    if (result === 'granted') {
      toast.success('Push notifications enabled!');
    } else if (result === 'denied') {
      toast.error('Notification permission denied. Enable in browser settings.');
    }
    setPermDismissed(true);
    localStorage.setItem('push-perm-dismissed', 'true');
  };

  // ── Fetch notifications ─────────────────────────────────────────────────
  const loadNotifications = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const isRead = filter === 'unread' ? false : filter === 'read' ? true : undefined;
      const result = await fetchNotifications({ page, limit: 15, isRead });
      setNotifications(result.notifications);
      setPagination(result.pagination);
    } catch (err) {
      toast.error(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadNotifications(1);
  }, [loadNotifications]);

  // ── Mark single as read ─────────────────────────────────────────────────
  const handleMarkRead = async (id) => {
    setActionLoading(id);
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      decrementUnread();
    } catch (err) {
      toast.error(err.message || 'Failed');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Mark all as read ────────────────────────────────────────────────────
  const handleMarkAllRead = async () => {
    setActionLoading('all');
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      clearUnreadCount();
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error(err.message || 'Failed');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Delete notification ─────────────────────────────────────────────────
  const handleDelete = async (id, wasUnread) => {
    setActionLoading(id);
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (wasUnread) decrementUnread();
      toast.success('Notification deleted');
    } catch (err) {
      toast.error(err.message || 'Failed');
    } finally {
      setActionLoading(null);
    }
  };

  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
            <FiBell className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-secondary">Notifications</h1>
            <p className="text-sm text-muted">{pagination.total} total</p>
          </div>
        </div>
        {hasUnread && (
          <button
            type="button"
            disabled={actionLoading === 'all'}
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 self-start rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-secondary transition hover:bg-gray-50 disabled:opacity-50"
          >
            <FiCheckCircle className="h-4 w-4" />
            Mark all as read
          </button>
        )}
      </div>

      {/* ── Push notification permission banner ─────────────────────── */}
      {isSupported && permission === 'default' && !permDismissed && (
        <div className="mb-6 flex items-center gap-4 rounded-2xl border border-primary/20 bg-primary/[0.04] p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <MdNotificationsActive className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-secondary">Enable Push Notifications</p>
            <p className="text-xs text-muted">Get notified about bookings, payments and messages</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleEnableNotifications}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-dark"
            >
              Enable
            </button>
            <button
              type="button"
              onClick={() => { setPermDismissed(true); localStorage.setItem('push-perm-dismissed', 'true'); }}
              className="rounded-lg px-2 py-1.5 text-xs text-muted transition hover:text-secondary"
            >
              Later
            </button>
          </div>
        </div>
      )}

      {/* ── Filter tabs ────────────────────────────────────────────── */}
      <div className="mb-6 flex gap-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              filter === tab.key
                ? 'bg-primary text-white'
                : 'border border-gray-200 bg-white text-secondary hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Notification list ──────────────────────────────────────── */}
      {loading ? (
        <div className="flex h-60 items-center justify-center">
          <Loader />
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-20 text-center">
          <FiInbox className="mx-auto h-12 w-12 text-gray-200" />
          <p className="mt-4 font-medium text-secondary">No notifications</p>
          <p className="mt-1 text-sm text-muted">
            {filter === 'unread' ? "You're all caught up!" : "Nothing here yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const config = getNotifConfig(notif.type);
            const colorCls = TYPE_COLORS[notif.type] || TYPE_COLORS.system;
            return (
              <div
                key={notif._id}
                className={`group relative flex items-start gap-4 rounded-2xl border p-4 transition ${
                  notif.isRead
                    ? 'border-gray-100 bg-white'
                    : 'border-primary/10 bg-primary/[0.02]'
                }`}
              >
                {/* Icon */}
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-lg ${colorCls}`}>
                  {config.emoji}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${notif.isRead ? 'text-secondary' : 'text-secondary'}`}>
                      {notif.title}
                    </p>
                    <span className="shrink-0 text-xs text-muted">{fmtTime(notif.createdAt)}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-muted line-clamp-2">{notif.message}</p>
                  {notif.sender && (
                    <p className="mt-1 text-xs text-muted">
                      from <span className="font-medium text-secondary">{notif.sender.name}</span>
                    </p>
                  )}
                </div>

                {/* Unread dot */}
                {!notif.isRead && (
                  <span className="absolute left-2 top-2 h-2 w-2 rounded-full bg-primary" />
                )}

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
                  {!notif.isRead && (
                    <button
                      type="button"
                      disabled={actionLoading === notif._id}
                      onClick={() => handleMarkRead(notif._id)}
                      title="Mark as read"
                      className="rounded-lg p-1.5 text-muted transition hover:bg-gray-100 hover:text-secondary disabled:opacity-50"
                    >
                      <FiCheck className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={actionLoading === notif._id}
                    onClick={() => handleDelete(notif._id, !notif.isRead)}
                    title="Delete"
                    className="rounded-lg p-1.5 text-muted transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ─────────────────────────────────────────────── */}
      {pagination.pages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            type="button"
            disabled={pagination.page <= 1}
            onClick={() => loadNotifications(pagination.page - 1)}
            className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-secondary transition hover:bg-gray-50 disabled:opacity-40"
          >
            <FiChevronLeft className="h-4 w-4" />
            Prev
          </button>
          <span className="text-sm text-muted">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            type="button"
            disabled={pagination.page >= pagination.pages}
            onClick={() => loadNotifications(pagination.page + 1)}
            className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-secondary transition hover:bg-gray-50 disabled:opacity-40"
          >
            Next
            <FiChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Notifications;
