import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiMap, FiGrid, FiBookmark } from 'react-icons/fi';
import PropertyCard from '../components/PropertyCard';
import PropertiesMapView from '../components/PropertiesMapView';
import SearchBar from '../components/SearchBar';
import FilterSidebar from '../components/FilterSidebar';
import Loader from '../components/Loader';
import SEO from '../components/SEO';
import { fetchProperties } from '../services/propertyService';
import { FEATURED_PROPERTIES } from '../utils/constants';
import { saveSearch, trackSearch } from '../services/recommendationService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const LARGE_LIMIT = 500; // fetch all properties at once
const parseList = (value) => (value ? value.split(',').map((x) => x.trim()).filter(Boolean) : []);

const Properties = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [total, setTotal]           = useState(0);
  const [draftFilters, setDraftFilters] = useState({ type: '', minPrice: '', maxPrice: '', bedrooms: '', bathrooms: '', availability: 'true', amenities: [] });
  const [viewMode, setViewMode]         = useState('grid'); // 'grid' | 'map'
  const [savingSearch, setSavingSearch] = useState(false);

  const query = useMemo(() => ({
    q:            searchParams.get('q') || '',
    city:         searchParams.get('city') || '',
    state:        searchParams.get('state') || '',
    country:      searchParams.get('country') || '',
    type:         searchParams.get('type') || '',
    minPrice:     searchParams.get('minPrice') || '',
    maxPrice:     searchParams.get('maxPrice') || '',
    bedrooms:     searchParams.get('bedrooms') || '',
    bathrooms:    searchParams.get('bathrooms') || '',
    availability: searchParams.get('availability') || 'true',
    amenities:    parseList(searchParams.get('amenities')),
    sort:         searchParams.get('sort') || 'newest',
    limit:        LARGE_LIMIT,
  }), [searchParams]);

  useEffect(() => {
    setDraftFilters({
      type:         query.type,
      minPrice:     query.minPrice,
      maxPrice:     query.maxPrice,
      bedrooms:     query.bedrooms,
      bathrooms:    query.bathrooms,
      availability: query.availability,
      amenities:    query.amenities,
    });
  }, [query.type, query.minPrice, query.maxPrice, query.bedrooms, query.bathrooms, query.availability, query.amenities]);

  const updateParams = useCallback((patch) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      const isEmptyArray = Array.isArray(value) && value.length === 0;
      if (value === '' || value == null || isEmptyArray) {
        next.delete(key);
      } else if (Array.isArray(value)) {
        next.set(key, value.join(','));
      } else {
        next.set(key, String(value));
      }
    });
    // Always remove page since we show all at once
    next.delete('page');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const loadProperties = useCallback(async (params) => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchProperties({ ...params, limit: LARGE_LIMIT });
      setProperties(result.properties);
      setTotal(result.total);
    } catch {
      setProperties(FEATURED_PROPERTIES);
      setTotal(FEATURED_PROPERTIES.length);
      setError('API unavailable. Showing fallback properties.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProperties(query);
  }, [query, loadProperties]);

  const hasActiveFilters =
    query.q || query.city || query.state || query.country || query.type ||
    query.minPrice || query.maxPrice || query.bedrooms || query.bathrooms ||
    (query.amenities && query.amenities.length) || query.availability !== 'true';

  const applyFilters = () => {
    updateParams(draftFilters);
    if (isAuthenticated) {
      trackSearch({
        city: draftFilters.city || query.city || undefined,
        type: draftFilters.type || undefined,
        q:    query.q || undefined,
      }).catch(() => {});
    }
  };

  const handleSaveSearch = async () => {
    if (!isAuthenticated) { toast.error('Sign in to save searches'); return; }
    setSavingSearch(true);
    try {
      const name = [query.city, query.type, query.q].filter(Boolean).join(' · ') || 'My Search';
      await saveSearch(name, {
        q:        query.q || '',
        city:     query.city || '',
        type:     query.type || '',
        minPrice: query.minPrice ? Number(query.minPrice) : null,
        maxPrice: query.maxPrice ? Number(query.maxPrice) : null,
      });
      toast.success('Search saved! Find it in your dashboard.');
    } catch (err) {
      toast.error(err.message || 'Failed to save search');
    } finally {
      setSavingSearch(false);
    }
  };

  const resetFilters = () => {
    setDraftFilters({ type: '', minPrice: '', maxPrice: '', bedrooms: '', bathrooms: '', availability: 'true', amenities: [] });
    updateParams({
      type: '', minPrice: '', maxPrice: '', bedrooms: '',
      bathrooms: '', amenities: [], availability: 'true',
    });
  };

  // ── Dynamic SEO ─────────────────────────────────────────────────────────────
  const seoCity = query.city || '';
  const seoType = query.type ? query.type.charAt(0).toUpperCase() + query.type.slice(1) : '';
  const seoTitle = [seoType, seoCity ? `Rentals in ${seoCity}` : 'Rental Properties'].filter(Boolean).join(' ') || 'Browse Rental Properties';
  const seoDesc  = seoCity
    ? `Browse ${total || ''} ${seoType.toLowerCase() || 'rental'} properties in ${seoCity}. Book instantly on RentEase.`
    : `Browse ${total || ''} verified rental properties across India. Filter by city, type, and budget.`;
  const seoCanonical = `/properties${query.city ? `?city=${query.city}` : query.type ? `?type=${query.type}` : ''}`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <SEO
        title={seoTitle}
        description={seoDesc.slice(0, 160)}
        canonical={seoCanonical}
        keywords={`${seoCity} rentals, ${seoType.toLowerCase()} for rent, find rental property${seoCity ? ` ${seoCity}` : ''}`}
      />

      {/* ── Header row ──────────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary">Properties</h1>
          <p className="mt-1 text-sm text-muted">
            {loading ? 'Loading…' : `${total} rental${total !== 1 ? 's' : ''} available`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Grid / Map toggle */}
          <div className="flex rounded-xl border border-gray-200 bg-white overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition ${
                viewMode === 'grid' ? 'bg-primary text-white' : 'text-secondary hover:bg-gray-50'
              }`}
            >
              <FiGrid className="h-4 w-4" /> Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition ${
                viewMode === 'map' ? 'bg-primary text-white' : 'text-secondary hover:bg-gray-50'
              }`}
            >
              <FiMap className="h-4 w-4" /> Map
            </button>
          </div>

          {/* Save search */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleSaveSearch}
              disabled={savingSearch}
              id="save-search-btn"
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-secondary transition hover:bg-gray-50 disabled:opacity-50"
            >
              <FiBookmark className="h-4 w-4" />
              {savingSearch ? 'Saving…' : 'Save search'}
            </button>
          )}
        </div>
      </div>

      {/* ── Search bar ──────────────────────────────────────────────────────── */}
      <SearchBar
        value={query.q}
        locationValue={query.city}
        onSearchChange={(v) => updateParams({ q: v })}
        onLocationChange={(v) => updateParams({ city: v })}
        onSubmit={() => updateParams({})}
      />

      {/* ── Main layout: sidebar + results ──────────────────────────────────── */}
      <div className="mt-6 grid gap-6 md:grid-cols-[280px_1fr]">
        <FilterSidebar
          filters={draftFilters}
          setFilters={setDraftFilters}
          onApply={applyFilters}
          onReset={resetFilters}
          open={false}
          onClose={() => {}}
          sort={query.sort}
          onSortChange={(val) => updateParams({ sort: val })}
        />

        <div>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-72 animate-pulse rounded-2xl bg-gray-100" />
              ))}
            </div>
          ) : error ? (
            <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
              <p className="text-center text-muted">{error}</p>
              <button
                onClick={() => loadProperties(query)}
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
                  onClick={resetFilters}
                  className="mt-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-secondary transition hover:bg-gray-50"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : viewMode === 'map' ? (
            <div className="relative">
              <PropertiesMapView properties={properties} className="h-[560px] w-full" />
              <p className="mt-3 text-center text-xs text-muted">
                Only properties with a pinned location appear on the map. Use Grid view to see all {total} listings.
              </p>
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
      </div>
    </div>
  );
};

export default Properties;
