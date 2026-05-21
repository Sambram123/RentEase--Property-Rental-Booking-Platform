import { useState, useEffect, useCallback } from 'react';
import { FiSearch, FiSliders, FiX } from 'react-icons/fi';
import PropertyCard from '../components/PropertyCard';
import Loader from '../components/Loader';
import { fetchProperties } from '../services/propertyService';
import { FEATURED_PROPERTIES } from '../utils/constants';

const PROPERTY_TYPES = [
  { value: '',           label: 'All types' },
  { value: 'apartment',  label: 'Apartment' },
  { value: 'house',      label: 'House' },
  { value: 'villa',      label: 'Villa' },
  { value: 'studio',     label: 'Studio' },
  { value: 'pg',         label: 'PG' },
  { value: 'commercial', label: 'Commercial' },
];

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest first' },
  { value: 'price_asc',  label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'rating',     label: 'Highest rated' },
];

const INITIAL_FILTERS = {
  city:     '',
  type:     '',
  minPrice: '',
  maxPrice: '',
  sort:     'newest',
};

const Properties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [total, setTotal]           = useState(0);
  const [filters, setFilters]       = useState(INITIAL_FILTERS);
  const [applied, setApplied]       = useState(INITIAL_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  // ── Fetch from backend ────────────────────────────────────────────────────
  const loadProperties = useCallback(async (params) => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchProperties(params);
      setProperties(result.properties);
      setTotal(result.total);
    } catch {
      // Fallback to mock data when backend is not running
      setProperties(FEATURED_PROPERTIES);
      setTotal(FEATURED_PROPERTIES.length);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProperties(applied);
  }, [applied, loadProperties]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    setApplied(filters);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters(INITIAL_FILTERS);
    setApplied(INITIAL_FILTERS);
    setShowFilters(false);
  };

  const hasActiveFilters =
    applied.city || applied.type || applied.minPrice || applied.maxPrice;

  const inputCls =
    'w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20';

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary">Properties</h1>
          <p className="mt-1 text-sm text-muted">
            {loading ? 'Loading…' : `${total} rental${total !== 1 ? 's' : ''} available`}
          </p>
        </div>

        {/* Sort + Filter toggle */}
        <div className="flex items-center gap-3">
          <select
            name="sort"
            value={filters.sort}
            onChange={(e) => {
              handleFilterChange(e);
              setApplied((prev) => ({ ...prev, sort: e.target.value }));
            }}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setShowFilters((p) => !p)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition ${
              hasActiveFilters
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-gray-200 bg-white text-secondary hover:bg-gray-50'
            }`}
          >
            <FiSliders className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                !
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Filter panel ───────────────────────────────────────────────── */}
      {showFilters && (
        <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            {/* City search */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">City</label>
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                <FiSearch className="h-4 w-4 shrink-0 text-muted" />
                <input
                  name="city"
                  type="text"
                  placeholder="e.g. Bangalore"
                  value={filters.city}
                  onChange={handleFilterChange}
                  className="w-full py-2.5 text-sm outline-none"
                />
              </div>
            </div>

            {/* Property type */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Type</label>
              <select
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                className={inputCls}
              >
                {PROPERTY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Min price */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">
                Min price (₹/mo)
              </label>
              <input
                name="minPrice"
                type="number"
                placeholder="0"
                min="0"
                value={filters.minPrice}
                onChange={handleFilterChange}
                className={inputCls}
              />
            </div>

            {/* Max price */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">
                Max price (₹/mo)
              </label>
              <input
                name="maxPrice"
                type="number"
                placeholder="Any"
                min="0"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                className={inputCls}
              />
            </div>

          </div>

          {/* Filter actions */}
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={applyFilters}
              className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark"
            >
              Apply filters
            </button>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-secondary transition hover:bg-gray-50"
              >
                <FiX className="h-4 w-4" />
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {hasActiveFilters && !showFilters && (
        <div className="mb-4 flex flex-wrap gap-2">
          {applied.city && (
            <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              City: {applied.city}
              <button onClick={() => { setFilters((p) => ({...p, city:''})); setApplied((p) => ({...p, city:''})); }}>
                <FiX className="h-3 w-3" />
              </button>
            </span>
          )}
          {applied.type && (
            <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Type: {applied.type}
              <button onClick={() => { setFilters((p) => ({...p, type:''})); setApplied((p) => ({...p, type:''})); }}>
                <FiX className="h-3 w-3" />
              </button>
            </span>
          )}
          {(applied.minPrice || applied.maxPrice) && (
            <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              ₹{applied.minPrice || 0} – {applied.maxPrice ? `₹${applied.maxPrice}` : 'any'}
              <button onClick={() => { setFilters((p) => ({...p, minPrice:'', maxPrice:''})); setApplied((p) => ({...p, minPrice:'', maxPrice:''})); }}>
                <FiX className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* ── Content ────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader size="lg" />
        </div>
      ) : error ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
          <p className="text-center text-muted">{error}</p>
          <button
            onClick={() => loadProperties(applied)}
            className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white"
          >
            Retry
          </button>
        </div>
      ) : properties.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
          <span className="text-5xl">🏘️</span>
          <h2 className="text-lg font-semibold text-secondary">No properties found</h2>
          <p className="max-w-xs text-sm text-muted">
            Try adjusting your filters or check back later.
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-secondary transition hover:bg-gray-50"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {properties.map((property) => (
            <PropertyCard
              key={property._id || property.id}
              property={property}
            />
          ))}
        </div>
      )}

    </div>
  );
};

export default Properties;
