import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiCalendar, FiHome, FiPlus, FiEdit2, FiTrash2,
  FiEye, FiToggleLeft, FiToggleRight,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import { fetchMyProperties, deleteProperty } from '../services/propertyService';
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

const Dashboard = () => {
  const { user } = useAuth();
  const isOwnerOrAdmin = ['owner', 'admin'].includes(user?.role);

  const [myProperties, setMyProperties] = useState([]);
  const [loadingProps, setLoadingProps] = useState(false);
  const [deletingId, setDeletingId]     = useState(null);

  // ── Load owner's properties ───────────────────────────────────────────────
  useEffect(() => {
    if (!isOwnerOrAdmin) return;
    const load = async () => {
      setLoadingProps(true);
      try {
        const result = await fetchMyProperties();
        setMyProperties(result.properties);
      } catch {
        // silently skip — tenant users or network error
      } finally {
        setLoadingProps(false);
      }
    };
    load();
  }, [isOwnerOrAdmin]);

  // ── Delete property ───────────────────────────────────────────────────────
  const handleDelete = async (id, title) => {
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

  const activeCount = myProperties.filter((p) => p.availability).length;

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
            {user?.isVerified && (
              <span className="ml-2 inline-flex items-center gap-1 text-green-600">
                ✓ Verified
              </span>
            )}
          </p>
        </div>

        {isOwnerOrAdmin && (
          <Link
            to="/properties/add"
            className="flex items-center gap-2 self-start rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark"
          >
            <FiPlus className="h-4 w-4" />
            Add property
          </Link>
        )}
      </div>

      {/* ── Stats row ──────────────────────────────────────────────────── */}
      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FiCalendar} label="Bookings" value="0" />
        <StatCard icon={FiHome}     label="Saved properties" value="0" />
        {isOwnerOrAdmin && (
          <>
            <StatCard icon={FiHome} label="My listings" value={myProperties.length} />
            <StatCard icon={FiToggleRight} label="Active listings" value={activeCount} />
          </>
        )}
      </div>

      {/* ── Tenant: browse CTA ─────────────────────────────────────────── */}
      {!isOwnerOrAdmin && (
        <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <span className="text-5xl">🏡</span>
          <h2 className="mt-4 text-lg font-semibold text-secondary">
            Start your search
          </h2>
          <p className="mt-2 text-sm text-muted">
            Browse hundreds of verified rental properties across India.
          </p>
          <Link
            to="/properties"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
          >
            Browse properties
          </Link>
        </div>
      )}

      {/* ── Owner: my properties ───────────────────────────────────────── */}
      {isOwnerOrAdmin && (
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
            <div className="flex h-40 items-center justify-center">
              <Loader />
            </div>
          ) : myProperties.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-10 text-center">
              <span className="text-4xl">🏘️</span>
              <p className="mt-3 font-medium text-secondary">No properties listed yet</p>
              <p className="mt-1 text-sm text-muted">
                Click "Add property" to list your first rental.
              </p>
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
                const image =
                  (Array.isArray(prop.images) && prop.images[0]) || PLACEHOLDER;
                return (
                  <div
                    key={prop._id}
                    className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-[16/9]">
                      <img
                        src={image}
                        alt={prop.title}
                        className="h-full w-full object-cover"
                        onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
                      />
                      {/* Availability pill */}
                      <span
                        className={`absolute left-3 top-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                          prop.availability
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {prop.availability ? (
                          <FiToggleRight className="h-3.5 w-3.5" />
                        ) : (
                          <FiToggleLeft className="h-3.5 w-3.5" />
                        )}
                        {prop.availability ? 'Available' : 'Unlisted'}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <p className="line-clamp-1 font-semibold text-secondary">
                        {prop.title}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {prop.city || prop.address?.city} · {prop.bedrooms}bed / {prop.bathrooms}bath
                      </p>
                      <p className="mt-1 text-sm font-semibold text-secondary">
                        {formatPrice(prop.price)}<span className="text-xs font-normal text-muted">/mo</span>
                      </p>

                      {/* Actions */}
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
                          onClick={() => handleDelete(prop._id, prop.title)}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-100 py-2 text-xs font-medium text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          {deletingId === prop._id ? (
                            <span className="h-3 w-3 animate-spin rounded-full border border-red-300 border-t-red-500" />
                          ) : (
                            <FiTrash2 className="h-3.5 w-3.5" />
                          )}
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
      )}

    </div>
  );
};

export default Dashboard;
