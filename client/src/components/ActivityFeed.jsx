import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiBell, FiChevronRight } from 'react-icons/fi';
import { fetchNotifications } from '../services/notificationService';
import { getNotifConfig } from '../context/NotificationContext';

const TYPE_COLORS = {
  booking_created:   'bg-blue-500/10 text-blue-500',
  booking_confirmed: 'bg-green-500/10 text-green-600',
  booking_cancelled: 'bg-red-500/10 text-red-500',
  booking_completed: 'bg-indigo-500/10 text-indigo-600',
  payment_success:   'bg-emerald-500/10 text-emerald-600',
  payment_failed:    'bg-orange-500/10 text-orange-600',
  review_added:      'bg-amber-500/10 text-amber-600',
  system:            'bg-gray-500/10 text-gray-600',
};

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

const ActivityFeed = ({ maxItems = 5 }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const result = await fetchNotifications({ page: 1, limit: maxItems });
        setActivities(result.notifications);
      } catch {
        // silently skip
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [maxItems]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <FiBell className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-secondary">Recent Activity</h3>
        </div>
        <div className="flex h-24 items-center justify-center">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FiBell className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-secondary">Recent Activity</h3>
        </div>
        <Link
          to="/notifications"
          className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-dark"
        >
          View all <FiChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {activities.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">No recent activity</p>
      ) : (
        <div className="space-y-3">
          {activities.map((item) => {
            const config = getNotifConfig(item.type);
            const colorCls = TYPE_COLORS[item.type] || TYPE_COLORS.system;
            return (
              <div key={item._id} className="flex items-start gap-3">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm ${colorCls}`}>
                  {config.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-secondary line-clamp-1">
                    {item.title}
                  </p>
                  <p className="text-xs text-muted line-clamp-1">{item.message}</p>
                </div>
                <span className="shrink-0 text-[10px] text-muted">{fmtTime(item.createdAt)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;
