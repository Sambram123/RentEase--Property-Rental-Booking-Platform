import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FiCalendar, FiArrowLeft, FiPlus, FiTrash2, FiLock,
  FiUnlock, FiInfo, FiCheck, FiX, FiClock, FiUser,
  FiAlertCircle, FiChevronLeft, FiChevronRight,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
  fetchCalendar,
  blockDates,
  unblockDates,
  blockRange,
  unblockRange,
} from '../services/availabilityService';

// ─── Date helpers ─────────────────────────────────────────────────────────────
const isoDate = (d) => {
  const date = new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const sameDay = (a, b) => {
  const da = new Date(a); const db = new Date(b);
  return da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate();
};

const inRange = (d, start, end) => {
  const date  = new Date(d); date.setHours(0, 0, 0, 0);
  const s = new Date(start); s.setHours(0, 0, 0, 0);
  const e = new Date(end);   e.setHours(23, 59, 59, 999);
  return date >= s && date <= e;
};

const MONTHS = ['January','February','March','April','May','June',
  'July','August','September','October','November','December'];
const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa'];

// ─── Calendar grid builder ────────────────────────────────────────────────────
const buildCalendarDays = (year, month) => {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d));
  return days;
};

// ─── Day status classifier ────────────────────────────────────────────────────
const getDayStatus = (date, calData) => {
  if (!date) return null;
  const { bookedRanges = [], blockedDates = [], blockedRanges = [] } = calData;

  for (const br of bookedRanges) {
    if (inRange(date, br.startDate, br.endDate)) return { type: 'booked', data: br };
  }
  for (const bd of blockedDates) {
    if (sameDay(date, bd.date)) return { type: 'blocked', data: bd };
  }
  for (const br of blockedRanges) {
    if (inRange(date, br.startDate, br.endDate)) return { type: 'blocked_range', data: br };
  }

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(date); d.setHours(0, 0, 0, 0);
  if (d < today) return { type: 'past' };
  return { type: 'available' };
};

// ─── AvailabilityCalendar page ────────────────────────────────────────────────
const AvailabilityCalendar = () => {
  const { propertyId } = useParams();
  const { user } = useAuth();

  const today     = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const [calData,  setCalData]  = useState({ bookedRanges: [], blockedDates: [], blockedRanges: [] });
  const [propInfo, setPropInfo] = useState(null);
  const [loading,  setLoading]  = useState(true);

  // Selection state
  const [selected,      setSelected]      = useState([]);    // multi-date pick
  const [rangeStart,    setRangeStart]    = useState('');
  const [rangeEnd,      setRangeEnd]      = useState('');
  const [rangeReason,   setRangeReason]   = useState('');
  const [mode,          setMode]          = useState('view'); // 'view' | 'block' | 'range'
  const [submitting,    setSubmitting]    = useState(false);

  const load = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);
    try {
      const data = await fetchCalendar(propertyId);
      setCalData(data);
      setPropInfo(data.property);
    } catch (err) {
      toast.error(err.message || 'Failed to load calendar');
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => { load(); }, [load]);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  // ── Date click ─────────────────────────────────────────────────────────────
  const handleDayClick = (date) => {
    if (!date || mode === 'view') return;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const d = new Date(date); d.setHours(0, 0, 0, 0);
    if (d < today) return;
    if (mode === 'block') {
      const key = isoDate(date);
      setSelected(prev =>
        prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key]
      );
    }
  };

  // ── Block selected dates ───────────────────────────────────────────────────
  const handleBlockDates = async () => {
    if (selected.length === 0) { toast.error('Select at least one date'); return; }
    setSubmitting(true);
    try {
      await blockDates(propertyId, selected);
      toast.success(`${selected.length} date(s) blocked`);
      setSelected([]);
      await load();
    } catch (err) {
      toast.error(err.message || 'Failed to block dates');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Unblock selected dates ─────────────────────────────────────────────────
  const handleUnblockDates = async () => {
    if (selected.length === 0) { toast.error('Select at least one date'); return; }
    setSubmitting(true);
    try {
      await unblockDates(propertyId, selected);
      toast.success('Dates unblocked');
      setSelected([]);
      await load();
    } catch (err) {
      toast.error(err.message || 'Failed to unblock dates');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Block range ─────────────────────────────────────────────────────────────
  const handleBlockRange = async (e) => {
    e.preventDefault();
    if (!rangeStart || !rangeEnd) { toast.error('Select start and end dates'); return; }
    if (new Date(rangeEnd) <= new Date(rangeStart)) {
      toast.error('End date must be after start date'); return;
    }
    setSubmitting(true);
    try {
      await blockRange(propertyId, rangeStart, rangeEnd, rangeReason);
      toast.success('Date range blocked');
      setRangeStart(''); setRangeEnd(''); setRangeReason('');
      await load();
    } catch (err) {
      toast.error(err.message || 'Failed to block range');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Remove range ────────────────────────────────────────────────────────────
  const handleRemoveRange = async (rangeId) => {
    if (!window.confirm('Remove this blocked range?')) return;
    try {
      await unblockRange(propertyId, rangeId);
      toast.success('Range removed');
      await load();
    } catch (err) {
      toast.error(err.message || 'Failed to remove range');
    }
  };

  // ── Calendar grid ──────────────────────────────────────────────────────────
  const days = buildCalendarDays(year, month);

  const dayClass = (date) => {
    if (!date) return '';
    const status = getDayStatus(date, calData);
    const key    = isoDate(date);
    const isSelected = selected.includes(key);

    let base = 'relative flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-all cursor-pointer select-none ';

    if (isSelected) return base + 'bg-primary text-white ring-2 ring-primary/30';

    switch (status?.type) {
      case 'booked':        return base + 'bg-blue-100 text-blue-700';
      case 'blocked':       return base + 'bg-red-100 text-red-600 line-through';
      case 'blocked_range': return base + 'bg-orange-100 text-orange-600 line-through';
      case 'past':          return base + 'text-gray-300 cursor-not-allowed';
      case 'available':     return base + 'hover:bg-primary/10 hover:text-primary text-gray-700';
      default:              return base + 'text-gray-300 cursor-not-allowed';
    }
  };

  const today2 = new Date(); today2.setHours(0, 0, 0, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/owner/dashboard"
            className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary"
          >
            <FiArrowLeft className="h-4 w-4" /> Owner Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-secondary">
            <FiCalendar className="inline mr-2 h-6 w-6 text-primary" />
            Availability Calendar
          </h1>
          {propInfo && (
            <p className="mt-1 text-sm text-muted">{propInfo.title}</p>
          )}
        </div>

        {/* Mode switcher */}
        <div className="flex items-center gap-2 self-start rounded-2xl border border-gray-100 bg-white p-1 shadow-sm">
          {[
            { key: 'view',  label: 'View',   icon: FiCalendar },
            { key: 'block', label: 'Block',   icon: FiLock     },
            { key: 'range', label: 'Range',   icon: FiPlus     },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => { setMode(key); setSelected([]); }}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition ${
                mode === key
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-muted hover:text-secondary'
              }`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* ── Calendar ──────────────────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            {/* Month nav */}
            <div className="mb-6 flex items-center justify-between">
              <button type="button" onClick={prevMonth}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 transition">
                <FiChevronLeft className="h-4 w-4" />
              </button>
              <h2 className="text-lg font-bold text-secondary">
                {MONTHS[month]} {year}
              </h2>
              <button type="button" onClick={nextMonth}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 transition">
                <FiChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Day labels */}
            <div className="mb-2 grid grid-cols-7 text-center">
              {DAYS.map(d => (
                <div key={d} className="py-1 text-xs font-semibold text-muted">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            {loading ? (
              <div className="flex h-56 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-y-1">
                {days.map((date, i) => {
                  const status = date ? getDayStatus(date, calData) : null;
                  return (
                    <div key={i} className="flex justify-center">
                      {date ? (
                        <button
                          type="button"
                          title={status?.data?.reason || status?.data?.guest || status?.type}
                          onClick={() => handleDayClick(date)}
                          className={dayClass(date)}
                        >
                          {date.getDate()}
                          {(status?.type === 'booked' || status?.type === 'blocked_range') && (
                            <span className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-current opacity-60" />
                          )}
                        </button>
                      ) : (
                        <div className="h-9 w-9" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Legend */}
            <div className="mt-6 flex flex-wrap gap-4 border-t border-gray-50 pt-4">
              {[
                { color: 'bg-gray-100 border border-primary/30', label: 'Available' },
                { color: 'bg-blue-100',                           label: 'Booked' },
                { color: 'bg-red-100',                            label: 'Blocked (date)' },
                { color: 'bg-orange-100',                         label: 'Blocked (range)' },
                { color: 'bg-primary',                            label: 'Selected' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-xs text-muted">
                  <div className={`h-3 w-3 rounded-full ${color}`} />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* ── Block dates action ───────────────────────────────────────── */}
          {mode === 'block' && selected.length > 0 && (
            <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <p className="mb-3 text-sm font-medium text-secondary">
                {selected.length} date(s) selected
              </p>
              <div className="flex flex-wrap gap-2">
                {selected.map(d => (
                  <span key={d} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleBlockDates}
                  className="flex items-center gap-1.5 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
                >
                  <FiLock className="h-4 w-4" /> Block Dates
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleUnblockDates}
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-secondary hover:bg-gray-50 disabled:opacity-50"
                >
                  <FiUnlock className="h-4 w-4" /> Unblock
                </button>
                <button
                  type="button"
                  onClick={() => setSelected([])}
                  className="ml-auto rounded-xl px-3 py-2 text-sm text-muted hover:text-secondary"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* ── Block range form ─────────────────────────────────────────── */}
          {mode === 'range' && (
            <form onSubmit={handleBlockRange}
              className="mt-4 rounded-2xl border border-orange-100 bg-orange-50/30 p-5">
              <h3 className="mb-4 font-semibold text-secondary">Block Date Range</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">Start Date</label>
                  <input
                    type="date"
                    value={rangeStart}
                    min={isoDate(new Date())}
                    onChange={e => setRangeStart(e.target.value)}
                    required
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">End Date</label>
                  <input
                    type="date"
                    value={rangeEnd}
                    min={rangeStart || isoDate(new Date())}
                    onChange={e => setRangeEnd(e.target.value)}
                    required
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="mb-1 block text-xs font-medium text-muted">Reason (optional)</label>
                <input
                  type="text"
                  value={rangeReason}
                  onChange={e => setRangeReason(e.target.value)}
                  placeholder="e.g. Maintenance, Personal use"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="mt-4 flex items-center gap-1.5 rounded-xl bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
              >
                <FiLock className="h-4 w-4" />
                {submitting ? 'Blocking…' : 'Block Range'}
              </button>
            </form>
          )}
        </div>

        {/* ── Right sidebar ─────────────────────────────────────────────── */}
        <div className="space-y-5">
          {/* Instructions */}
          <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-secondary">
              <FiInfo className="h-4 w-4 text-blue-500" /> How it works
            </h3>
            <ul className="space-y-2 text-xs text-muted">
              <li className="flex items-start gap-2">
                <FiCheck className="mt-0.5 h-3 w-3 shrink-0 text-green-500" />
                <strong>View mode</strong>: See booked, blocked, and available dates
              </li>
              <li className="flex items-start gap-2">
                <FiLock className="mt-0.5 h-3 w-3 shrink-0 text-red-500" />
                <strong>Block mode</strong>: Click individual dates to block/unblock
              </li>
              <li className="flex items-start gap-2">
                <FiPlus className="mt-0.5 h-3 w-3 shrink-0 text-orange-500" />
                <strong>Range mode</strong>: Block a continuous date range
              </li>
            </ul>
          </div>

          {/* Upcoming bookings */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-secondary">
              <FiClock className="h-4 w-4 text-primary" /> Upcoming Bookings
            </h3>
            {calData.bookedRanges.length === 0 ? (
              <p className="text-sm text-muted">No upcoming bookings</p>
            ) : (
              <div className="space-y-3">
                {calData.bookedRanges
                  .filter(b => new Date(b.endDate) >= new Date())
                  .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
                  .slice(0, 5)
                  .map((b) => (
                    <div key={b.id} className="rounded-xl bg-blue-50/50 p-3">
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          b.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {b.status}
                        </span>
                        <FiUser className="h-3 w-3 text-muted" />
                        <span className="text-muted truncate">{b.guest}</span>
                      </div>
                      <p className="mt-1 text-xs font-medium text-secondary">
                        {new Date(b.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        {' → '}
                        {new Date(b.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Blocked ranges */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-secondary">
              <FiAlertCircle className="h-4 w-4 text-orange-500" /> Blocked Ranges
            </h3>
            {calData.blockedRanges.length === 0 ? (
              <p className="text-sm text-muted">No blocked ranges</p>
            ) : (
              <div className="space-y-2">
                {calData.blockedRanges.map((r) => (
                  <div key={r.id} className="flex items-start justify-between gap-2 rounded-xl bg-orange-50/60 p-3">
                    <div>
                      <p className="text-xs font-medium text-secondary">
                        {new Date(r.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        {' – '}
                        {new Date(r.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                      {r.reason && (
                        <p className="mt-0.5 text-[10px] text-muted">{r.reason}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveRange(r.id)}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition"
                      title="Remove range"
                    >
                      <FiX className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityCalendar;
