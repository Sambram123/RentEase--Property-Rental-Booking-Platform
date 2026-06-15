import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiClock, FiArrowRight, FiHome, FiMapPin, FiStar } from 'react-icons/fi';
import { fetchRecentlyViewed } from '../services/recommendationService';
import { formatPrice } from '../utils/constants';
import { useAuth } from '../context/AuthContext';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&q=60';

const fmtTime = (d) => {
  if (!d) return '';
  const now  = new Date();
  const date = new Date(d);
  const diff = Math.floor((now - date) / 60000);
  if (diff < 1) return 'Just now';
  if (diff < 60) return `${diff}m ago`;
  const hrs = Math.floor(diff / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const RecentlyViewed = ({ maxItems = 6, showTitle = true }) => {
  const { isAuthenticated } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    fetchRecentlyViewed(maxItems)
      .then((d) => setProperties(d.properties || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated, maxItems]);

  if (!isAuthenticated || (!loading && properties.length === 0)) return null;

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      {showTitle && (
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-secondary">
            <FiClock className="h-5 w-5 text-primary" /> Recently Viewed
          </h2>
          <Link
            to="/properties"
            className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-dark"
          >
            Browse all <FiArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-gray-100 bg-gray-50 p-3">
              <div className="h-28 rounded-lg bg-gray-200 mb-3" />
              <div className="h-4 w-3/4 rounded bg-gray-200 mb-2" />
              <div className="h-3 w-1/2 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => {
            const img = (Array.isArray(p.images) && p.images[0]) || PLACEHOLDER;
            const city = p.city || p.address?.city || '';
            return (
              <Link
                key={p._id}
                to={`/properties/${p._id}`}
                className="group overflow-hidden rounded-xl border border-gray-100 bg-white transition hover:shadow-md"
                id={`recently-viewed-${p._id}`}
              >
                <div className="relative h-28 overflow-hidden">
                  <img
                    src={img}
                    alt={p.title}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                    onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
                  />
                  {p.viewedAt && (
                    <span className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white">
                      {fmtTime(p.viewedAt)}
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <p className="line-clamp-1 text-sm font-semibold text-secondary">{p.title}</p>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                    {city && <><FiMapPin className="h-3 w-3" />{city}</>}
                    {p.rating > 0 && (
                      <span className="ml-auto flex items-center gap-0.5 text-amber-500">
                        <FiStar className="h-3 w-3 fill-current" />
                        {p.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm font-bold text-primary">{formatPrice(p.price)}<span className="text-xs font-normal text-muted">/mo</span></p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default RecentlyViewed;
