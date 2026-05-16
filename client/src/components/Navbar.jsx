import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { HiMenu, HiX } from 'react-icons/hi';
import { FiHome } from 'react-icons/fi';

const navLinks = [
  { to: '/properties', label: 'Properties' },
  { to: '/dashboard', label: 'Dashboard' },
];

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const linkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors ${
      isActive ? 'text-primary' : 'text-secondary hover:text-primary'
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
            <FiHome className="h-5 w-5" />
          </span>
          <span className="text-xl font-bold tracking-tight text-secondary">
            Rent<span className="text-primary">Ease</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/login"
            className="rounded-full px-4 py-2 text-sm font-medium text-secondary transition hover:bg-gray-50"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary-dark"
          >
            Sign up
          </Link>
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-secondary md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <HiX className="h-6 w-6" /> : <HiMenu className="h-6 w-6" />}
        </button>
      </nav>

      {menuOpen && (
        <div className="border-t border-gray-100 px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={linkClass}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
            <Link
              to="/login"
              className="rounded-full px-4 py-2 text-sm font-medium text-secondary"
              onClick={() => setMenuOpen(false)}
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-primary px-4 py-2 text-center text-sm font-medium text-white"
              onClick={() => setMenuOpen(false)}
            >
              Sign up
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
