import { Link } from 'react-router-dom';
import { FiCalendar, FiHome } from 'react-icons/fi';

const Dashboard = () => {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-secondary">Dashboard</h1>
      <p className="mt-1 text-muted">Manage your bookings and saved properties</p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <FiCalendar className="h-8 w-8 text-primary" />
          <h2 className="mt-4 font-semibold text-secondary">My bookings</h2>
          <p className="mt-2 text-sm text-muted">No bookings yet. Start exploring properties.</p>
          <Link
            to="/properties"
            className="mt-4 inline-block text-sm font-medium text-primary hover:text-primary-dark"
          >
            Browse properties →
          </Link>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <FiHome className="h-8 w-8 text-primary" />
          <h2 className="mt-4 font-semibold text-secondary">Listed properties</h2>
          <p className="mt-2 text-sm text-muted">List your property to start earning rent.</p>
          <span className="mt-4 inline-block text-sm font-medium text-muted">Coming soon</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
