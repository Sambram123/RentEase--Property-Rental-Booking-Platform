import { Link } from 'react-router-dom';
import { FiHome, FiMail, FiPhone } from 'react-icons/fi';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="hidden border-t border-gray-100 bg-gray-50 md:block">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
                <FiHome className="h-5 w-5" />
              </span>
              <span className="text-xl font-bold text-secondary">
                Rent<span className="text-primary">Ease</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              Find your perfect rental home. Browse apartments, book instantly, and pay
              advance rent online with secure payments.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-secondary">Explore</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted">
              <li>
                <Link to="/properties" className="transition hover:text-primary">
                  All Properties
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="transition hover:text-primary">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-secondary">Contact</h3>
            <ul className="mt-4 space-y-3 text-sm text-muted">
              <li className="flex items-center gap-2">
                <FiMail className="h-4 w-4 text-primary" />
                support@rentease.com
              </li>
              <li className="flex items-center gap-2">
                <FiPhone className="h-4 w-4 text-primary" />
                +91 98765 43210
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-8 sm:flex-row">
          <p className="text-sm text-muted">&copy; {year} RentEase. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-muted">
            <span className="cursor-pointer transition hover:text-primary">Privacy</span>
            <span className="cursor-pointer transition hover:text-primary">Terms</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
