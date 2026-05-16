import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch, FiMapPin, FiCalendar, FiUsers } from 'react-icons/fi';
import PropertyCard from '../components/PropertyCard';
import Loader from '../components/Loader';
import { healthCheck } from '../services/api';
import { FEATURED_PROPERTIES } from '../utils/constants';

const Home = () => {
  const [apiStatus, setApiStatus] = useState({ loading: true, data: null, error: null });

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await healthCheck();
        setApiStatus({ loading: false, data, error: null });
      } catch (err) {
        setApiStatus({ loading: false, data: null, error: err.message });
      }
    };
    fetchStatus();
  }, []);

  return (
    <>
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

          <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-gray-100 bg-white p-2 shadow-lg shadow-gray-200/50 sm:p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-2 rounded-xl bg-gray-50 px-4 py-3">
                <FiMapPin className="h-5 w-5 shrink-0 text-muted" />
                <input
                  type="text"
                  placeholder="Where do you want to live?"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
                />
              </div>
              <div className="flex flex-1 items-center gap-2 rounded-xl bg-gray-50 px-4 py-3">
                <FiCalendar className="h-5 w-5 shrink-0 text-muted" />
                <input
                  type="text"
                  placeholder="Move-in date"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
                  onFocus={(e) => (e.target.type = 'date')}
                  onBlur={(e) => !e.target.value && (e.target.type = 'text')}
                />
              </div>
              <div className="flex flex-1 items-center gap-2 rounded-xl bg-gray-50 px-4 py-3">
                <FiUsers className="h-5 w-5 shrink-0 text-muted" />
                <select className="w-full bg-transparent text-sm text-secondary outline-none">
                  <option>1 Guest</option>
                  <option>2 Guests</option>
                  <option>3+ Guests</option>
                </select>
              </div>
              <Link
                to="/properties"
                className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark"
              >
                <FiSearch className="h-4 w-4" />
                Search
              </Link>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            {apiStatus.loading ? (
              <span className="flex items-center gap-2 text-sm text-muted">
                <Loader size="sm" /> Checking API connection...
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

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-secondary sm:text-3xl">
              Featured properties
            </h2>
            <p className="mt-1 text-muted">Handpicked rentals in top locations</p>
          </div>
          <Link
            to="/properties"
            className="hidden text-sm font-medium text-primary transition hover:text-primary-dark sm:block"
          >
            View all →
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURED_PROPERTIES.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
        <Link
          to="/properties"
          className="mt-8 block text-center text-sm font-medium text-primary sm:hidden"
        >
          View all properties →
        </Link>
      </section>

      <section className="border-t border-gray-100 bg-gray-50/50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3">
          {[
            {
              title: 'Verified listings',
              desc: 'Every property is reviewed for quality and accuracy before going live.',
            },
            {
              title: 'Secure payments',
              desc: 'Pay advance rent safely with Razorpay-powered checkout.',
            },
            {
              title: 'Easy booking',
              desc: 'Book your apartment in minutes with a simple, guided flow.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
            >
              <h3 className="font-semibold text-secondary">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default Home;
