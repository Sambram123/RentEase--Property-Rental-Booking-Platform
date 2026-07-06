import { Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiHome, FiSearch } from 'react-icons/fi';
import SEO from '../components/SEO';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      <SEO title="404 — Page Not Found" description="The page you are looking for does not exist." noIndex />

      {/* Illustration */}
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-primary/10">
        <span className="text-5xl" role="img" aria-label="House">🏚️</span>
      </div>

      {/* Heading */}
      <p className="text-7xl font-bold text-primary">404</p>
      <h1 className="mt-4 text-2xl font-bold text-secondary">Page not found</h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
        Looks like this listing has been removed or the link is no longer valid.
        Let's get you back on track.
      </p>

      {/* Actions */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-secondary shadow-sm transition hover:bg-gray-50"
        >
          <FiArrowLeft className="h-4 w-4" />
          Go back
        </button>
        <Link
          to="/"
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark"
        >
          <FiHome className="h-4 w-4" />
          Home
        </Link>
        <Link
          to="/properties"
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-secondary shadow-sm transition hover:bg-gray-50"
        >
          <FiSearch className="h-4 w-4" />
          Browse properties
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
