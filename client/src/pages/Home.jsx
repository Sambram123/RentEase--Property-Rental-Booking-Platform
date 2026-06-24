import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiSearch, FiMapPin, FiTrendingUp, FiStar,
  FiHome, FiArrowRight, FiClock,
} from 'react-icons/fi';
import PropertyCard from '../components/PropertyCard';
import LazyImage from '../components/LazyImage';
import Loader from '../components/Loader';
import SEO, { organizationSchema, websiteSchema } from '../components/SEO';
import { healthCheck } from '../services/api';
import { fetchTrending, fetchFeatured, fetchPopularCities } from '../services/recommendationService';
import { trackSearch } from '../services/recommendationService';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../utils/constants';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&q=60';

const CITY_EMOJIS = { Delhi: '🏛️', Mumbai: '🌊', Bangalore: '🌿', Chennai: '🏖️', Hyderabad: '🍖', Pune: '🌸', Kolkata: '🎨', Ahmedabad: '🛕' };

// ─── Minimal PropertyMiniCard for trending/featured ───────────────────────────
const PropertyMiniCard = ({ property }) => {
  const img  = (Array.isArray(property.images) && property.images[0]) || PLACEHOLDER;
  const city = property.city || property.address?.city || '';
  return (
    <Link
      to={`/properties/${property._id}`}
      className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-lg hover:-translate-y-0.5"
      id={`home-prop-${property._id}`}
    >
      <div className="relative h-44 overflow-hidden">
        <LazyImage
          src={img}
          alt={property.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          placeholderClassName="h-44"
          fallback={<img src={PLACEHOLDER} alt={property.title} className="h-full w-full object-cover" />}
        />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold capitalize text-secondary shadow-sm">
          {property.type}
        </span>
        {property.rating > 0 && (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold text-amber-500 shadow-sm">
            <FiStar className="h-3 w-3 fill-current" /> {property.rating.toFixed(1)}
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="line-clamp-1 font-semibold text-secondary">{property.title}</p>
        {city && (
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
            <FiMapPin className="h-3 w-3" /> {city}
          </p>
        )}
        <p className="mt-2 text-base font-bold text-primary">
          {formatPrice(property.price)}<span className="text-xs font-normal text-muted"> /mo</span>
        </p>
      </div>
    </Link>
  );
};

// ─── Home Component ───────────────────────────────────────────────────────────
const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [apiStatus,    setApiStatus]    = useState({ loading: true, data: null, error: null });
  const [trending,     setTrending]     = useState([]);
  const [featured,     setFeatured]     = useState([]);
  const [popularCities, setPopularCities] = useState([]);
  const [loadingProps, setLoadingProps] = useState(true);

  // Search state
  const [searchCity, setSearchCity] = useState('');
  const [searchType, setSearchType] = useState('');

  // Load API health
  useEffect(() => {
    healthCheck()
      .then((data) => setApiStatus({ loading: false, data, error: null }))
      .catch((err) => setApiStatus({ loading: false, data: null, error: err.message }));
  }, []);

  // Load discovery data
  useEffect(() => {
    const load = async () => {
      try {
        const [t, f, c] = await Promise.all([
          fetchTrending(8).catch(() => ({ properties: [] })),
          fetchFeatured(8).catch(() => ({ properties: [] })),
          fetchPopularCities(8).catch(() => ({ cities: [] })),
        ]);
        setTrending(t.properties || []);
        setFeatured(f.properties || []);
        setPopularCities(c.cities || []);
      } catch {
        // silently skip
      } finally {
        setLoadingProps(false);
      }
    };
    load();
  }, []);

  const handleSearch = useCallback(async () => {
    const params = new URLSearchParams();
    if (searchCity.trim()) params.set('city', searchCity.trim());
    if (searchType.trim()) params.set('type', searchType.trim());

    // Track search for personalization
    if (isAuthenticated) {
      trackSearch({ city: searchCity.trim() || undefined, type: searchType.trim() || undefined });
    }
    navigate(`/properties?${params.toString()}`);
  }, [searchCity, searchType, navigate, isAuthenticated]);

  const showFeatured = featured.length > 0;
  const showTrending = trending.length > 0;

  return (
    <>
      <SEO
        canonical="/"
        structuredData={[organizationSchema, websiteSchema]}
        keywords="rental properties, apartments for rent, rent house India, find rental property, book apartment online, Bangalore apartments, Mumbai flats, Delhi rental"
      />
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-rose-50/80 to-white px-4 pb-16 pt-12 sm:px-6 lg:px-8 lg:pb-24 lg:pt-20">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center rounded-full bg-white px-4 py-1.5 text-xs font-medium text-primary shadow-sm ring-1 ring-rose-100">
            Book apartments · Pay advance rent online
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-secondary sm:text-5xl lg:text-6xl">
            Find your next home with{' '}
            <span className="text-primary">RentEase</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted">
            Browse verified rental properties, book instantly, and secure your apartment
            with hassle-free online payments.
          </p>

          {/* Search bar */}
          <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-gray-100 bg-white p-2 shadow-lg shadow-gray-200/50 sm:p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-2 rounded-xl bg-gray-50 px-4 py-3">
                <FiMapPin className="h-5 w-5 shrink-0 text-muted" />
                <input
                  id="hero-city-input"
                  type="text"
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="City — Bangalore, Mumbai…"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
                />
              </div>
              <div className="flex flex-1 items-center gap-2 rounded-xl bg-gray-50 px-4 py-3">
                <FiHome className="h-5 w-5 shrink-0 text-muted" />
                <select
                  id="hero-type-select"
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="w-full bg-transparent text-sm text-secondary outline-none"
                >
                  <option value="">All types</option>
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="villa">Villa</option>
                  <option value="studio">Studio</option>
                  <option value="pg">PG</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>
              <button
                id="hero-search-btn"
                onClick={handleSearch}
                className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark"
              >
                <FiSearch className="h-4 w-4" />
                Search
              </button>
            </div>
          </div>

          {/* API status pill */}
          <div className="mt-6 flex justify-center">
            {apiStatus.loading ? (
              <span className="flex items-center gap-2 text-sm text-muted">
                <Loader size="sm" /> Checking API…
              </span>
            ) : apiStatus.data ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700 ring-1 ring-emerald-100">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Backend: {apiStatus.data.message}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-1.5 text-sm font-medium text-red-700 ring-1 ring-red-100">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                Backend offline: {apiStatus.error}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ── Popular Cities ────────────────────────────────────────────────── */}
      {popularCities.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="mb-6 text-2xl font-bold text-secondary">Popular Cities</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {popularCities.map((c) => (
              <Link
                key={c.city}
                to={`/properties?city=${encodeURIComponent(c.city)}`}
                className="group flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-primary/30 hover:shadow-md"
                id={`city-${c.city.toLowerCase().replace(/\s/g, '-')}`}
              >
                <span className="text-3xl">{CITY_EMOJIS[c.city] || '🏙️'}</span>
                <p className="mt-2 text-center text-sm font-semibold text-secondary group-hover:text-primary">{c.city}</p>
                <p className="text-xs text-muted">{c.count} listing{c.count !== 1 ? 's' : ''}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Trending Properties ───────────────────────────────────────────── */}
      {(showTrending || loadingProps) && (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-bold text-secondary sm:text-3xl">
                <FiTrendingUp className="h-6 w-6 text-primary" /> Trending Properties
              </h2>
              <p className="mt-1 text-muted">Most viewed &amp; highly rated this week</p>
            </div>
            <Link to="/properties" className="hidden text-sm font-medium text-primary transition hover:text-primary-dark sm:block">
              View all →
            </Link>
          </div>

          {loadingProps ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl border border-gray-100 bg-white shadow-sm">
                  <div className="h-44 rounded-t-2xl bg-gray-100" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 rounded bg-gray-100 w-3/4" />
                    <div className="h-3 rounded bg-gray-100 w-1/2" />
                    <div className="h-5 rounded bg-gray-100 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {trending.map((p) => <PropertyMiniCard key={p._id} property={p} />)}
            </div>
          )}
        </section>
      )}

      {/* ── Featured Properties ───────────────────────────────────────────── */}
      {(showFeatured || loadingProps) && (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-bold text-secondary sm:text-3xl">
                <FiStar className="h-6 w-6 text-amber-500" /> Featured Properties
              </h2>
              <p className="mt-1 text-muted">Handpicked rentals with top ratings</p>
            </div>
            <Link to="/properties?sort=rating" className="hidden text-sm font-medium text-primary transition hover:text-primary-dark sm:block">
              View all →
            </Link>
          </div>
          {loadingProps ? null : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featured.slice(0, 4).map((p) => <PropertyMiniCard key={p._id} property={p} />)}
            </div>
          )}
        </section>
      )}

      {/* ── Why RentEase ─────────────────────────────────────────────────── */}
      <section className="border-t border-gray-100 bg-gray-50/50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-secondary sm:text-3xl">Why choose RentEase?</h2>
            <p className="mt-2 text-muted">Everything you need to find your perfect rental</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { emoji: '🔍', title: 'Verified listings', desc: 'Every property is reviewed for quality and accuracy before going live on our platform.' },
              { emoji: '🔒', title: 'Secure payments', desc: 'Pay advance rent safely with Razorpay-powered checkout. Your money is always protected.' },
              { emoji: '⚡', title: 'Instant booking', desc: 'Book your apartment in minutes with a simple, guided flow — no paperwork hassle.' },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <span className="text-3xl">{item.emoji}</span>
                <h3 className="mt-3 font-semibold text-secondary">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Platform Stats ────────────────────────────────────────────────── */}
      <section className="bg-primary px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-8 text-center text-white md:grid-cols-4">
            {[
              { value: '10,000+', label: 'Properties listed' },
              { value: '50,000+', label: 'Happy tenants' },
              { value: '8 Cities', label: 'Pan-India coverage' },
              { value: '4.8★',    label: 'Average rating' },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-3xl font-bold sm:text-4xl">{value}</p>
                <p className="mt-1 text-sm text-white/80">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section className="border-t border-gray-100 bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-secondary sm:text-3xl">What our tenants say</h2>
            <p className="mt-2 text-muted">Real experiences from real renters</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                name: 'Priya Sharma',
                city: 'Bangalore',
                rating: 5,
                text: 'Found my perfect 2 BHK in Koramangala within 3 days. The booking process was seamless and the owner was very responsive.',
                avatar: '👩‍💼',
              },
              {
                name: 'Rahul Mehta',
                city: 'Mumbai',
                rating: 5,
                text: 'RentEase made relocating to Mumbai so much easier. Transparent pricing, verified listings, and secure payments. Highly recommend!',
                avatar: '👨‍💻',
              },
              {
                name: 'Anjali Reddy',
                city: 'Hyderabad',
                rating: 5,
                text: 'Booked a studio near my office in minutes. The advance payment via Razorpay was smooth and I got instant confirmation.',
                avatar: '👩‍🎓',
              },
            ].map((t) => (
              <div key={t.name} className="rounded-2xl border border-gray-100 bg-gray-50/50 p-6">
                <div className="flex items-center gap-1 text-amber-400">
                  {'★'.repeat(t.rating)}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-secondary">"{t.text}"</p>
                <div className="mt-4 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-xl">
                    {t.avatar}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-secondary">{t.name}</p>
                    <p className="text-xs text-muted">{t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="border-t border-gray-100 bg-gradient-to-b from-rose-50/60 to-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-secondary sm:text-3xl">
            Ready to find your next home?
          </h2>
          <p className="mt-3 text-muted">
            Browse thousands of verified rental properties across India and book your perfect space today.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="/properties"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-primary-dark"
            >
              Browse Properties
            </a>
            <a
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-secondary shadow-sm transition hover:bg-gray-50"
            >
              Create free account
            </a>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
