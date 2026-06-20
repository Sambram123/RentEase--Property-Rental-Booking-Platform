import { useState, useEffect, useCallback, memo } from 'react';
import {
  FiActivity, FiCpu, FiDatabase, FiZap, FiAlertTriangle,
  FiTrendingUp, FiRefreshCw, FiServer, FiClock,
} from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import axios from 'axios';

const API = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard = memo(({ icon: Icon, label, value, sub, color = 'text-primary', bg = 'bg-primary/10' }) => (
  <div className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${bg}`}>
      <Icon className={`h-6 w-6 ${color}`} />
    </div>
    <div className="min-w-0">
      <p className="text-2xl font-bold text-secondary">{value}</p>
      <p className="text-sm font-medium text-secondary">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  </div>
));
StatCard.displayName = 'StatCard';

// ─── PerformanceDashboard (embedded in AdminDashboard) ────────────────────────
const PerformanceDashboard = ({ token }) => {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/performance', API(token));
      setData(res.data.data);
      setLastRefresh(new Date().toLocaleTimeString());
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!data) return null;

  const { server, summary, topSlowRoutes, topViewedProperties, database, cache } = data;

  // Chart data: top slow routes
  const chartData = (topSlowRoutes || []).slice(0, 8).map((r) => ({
    name: r.route.replace(/\/api\//, '').replace(/\/:.*/, '/:id').slice(0, 20),
    avgMs: r.avgMs,
    maxMs: r.maxMs,
    count: r.count,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
            <FiActivity className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-secondary">Performance Monitor</h2>
            {lastRefresh && (
              <p className="text-xs text-muted">Last updated: {lastRefresh}</p>
            )}
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-secondary transition hover:bg-gray-50 disabled:opacity-50"
        >
          <FiRefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Server Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={FiServer}
          label="Total Requests"
          value={summary?.totalRequests?.toLocaleString() || 0}
          sub="Since server start"
          color="text-blue-600"
          bg="bg-blue-50"
        />
        <StatCard
          icon={FiAlertTriangle}
          label="Error Rate"
          value={summary?.errorRate || '0%'}
          sub={`${summary?.totalErrors || 0} errors`}
          color="text-red-500"
          bg="bg-red-50"
        />
        <StatCard
          icon={FiZap}
          label="Slow Requests"
          value={summary?.slowRequests || 0}
          sub={`>${summary?.slowThresholdMs || 500}ms threshold`}
          color="text-amber-600"
          bg="bg-amber-50"
        />
        <StatCard
          icon={FiCpu}
          label="Heap Used"
          value={`${server?.memoryMB?.heapUsed || 0} MB`}
          sub={`of ${server?.memoryMB?.heapTotal || 0} MB total`}
          color="text-purple-600"
          bg="bg-purple-50"
        />
      </div>

      {/* Cache Stats */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <FiDatabase className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-secondary">Cache Statistics</h3>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Cached Items', value: cache?.size || 0 },
            { label: 'Cache Hits',   value: cache?.hits || 0 },
            { label: 'Cache Misses', value: cache?.misses || 0 },
            { label: 'Hit Rate',     value: cache?.hitRate || '0%' },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl bg-gray-50/60 p-3 text-center">
              <p className="text-lg font-bold text-secondary">{value}</p>
              <p className="text-xs text-muted">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Database Stats */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <FiDatabase className="h-5 w-5 text-green-600" />
          <h3 className="font-semibold text-secondary">Database Overview</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Bookings',    value: database?.totalBookings    || 0 },
            { label: 'Pending Bookings',  value: database?.pendingBookings  || 0 },
            { label: 'Active Properties', value: database?.activeProperties || 0 },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl bg-gray-50/60 p-3 text-center">
              <p className="text-lg font-bold text-secondary">{value}</p>
              <p className="text-xs text-muted">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Slow Routes Chart */}
      {chartData.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <FiClock className="h-5 w-5 text-amber-600" />
            <h3 className="font-semibold text-secondary">Slowest API Endpoints (avg ms)</h3>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#717171' }}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11, fill: '#717171' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #f0f0f0', fontSize: '12px' }}
                  formatter={(v, n) => [`${v}ms`, n === 'avgMs' ? 'Avg' : 'Max']}
                />
                <Bar dataKey="avgMs" fill="#ff385c" radius={[4, 4, 0, 0]} name="avgMs" />
                <Bar dataKey="maxMs" fill="#ffb3c0" radius={[4, 4, 0, 0]} name="maxMs" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top Viewed Properties */}
      {topViewedProperties?.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <FiTrendingUp className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-secondary">Most Viewed Properties</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {topViewedProperties.map((p, i) => (
              <div key={p._id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-secondary">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-secondary">{p.title}</p>
                  <p className="text-xs text-muted">{p.city}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-secondary">{p.viewCount?.toLocaleString()}</p>
                  <p className="text-xs text-muted">views</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Slow routes table */}
      {topSlowRoutes?.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <FiAlertTriangle className="h-5 w-5 text-red-500" />
            <h3 className="font-semibold text-secondary">Endpoint Performance Table</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-semibold text-muted">
                  <th className="pb-2 pr-4">Endpoint</th>
                  <th className="pb-2 pr-4">Requests</th>
                  <th className="pb-2 pr-4">Avg (ms)</th>
                  <th className="pb-2 pr-4">Max (ms)</th>
                  <th className="pb-2">Error Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {topSlowRoutes.map((r) => (
                  <tr key={r.route} className="text-secondary">
                    <td className="py-2 pr-4">
                      <code className="rounded bg-gray-50 px-1.5 py-0.5 text-xs">
                        {r.route.length > 40 ? r.route.slice(0, 40) + '…' : r.route}
                      </code>
                    </td>
                    <td className="py-2 pr-4 text-xs">{r.count}</td>
                    <td className={`py-2 pr-4 text-xs font-medium ${r.avgMs > 500 ? 'text-red-500' : r.avgMs > 200 ? 'text-amber-600' : 'text-green-600'}`}>
                      {r.avgMs}ms
                    </td>
                    <td className="py-2 pr-4 text-xs">{r.maxMs}ms</td>
                    <td className={`py-2 text-xs ${parseFloat(r.errorRate) > 5 ? 'text-red-500 font-semibold' : 'text-muted'}`}>
                      {r.errorRate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(PerformanceDashboard);
