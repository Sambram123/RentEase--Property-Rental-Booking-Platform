import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { HiMenu, HiX } from 'react-icons/hi';
import { FiHome, FiLogOut, FiUser, FiHeart } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const navLinks = [
  { to: '/properties', label: 'Properties' },
];

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarErr, setAvatarErr] = useState(false);

  const linkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors ${
      isActive ? 'text-primary' : 'text-secondary hover:text-primary'
    }`;

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/');
    } catch {
      toast.error('Logout failed');
    }
    setMenuOpen(false);
  };

  // ── Avatar: initials fallback ─────────────────────────────────────────────
  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
            <FiHome className="h-5 w-5" />
          </span>
          <span className="text-xl font-bold tracking-tight text-secondary">
            Rent<span className="text-primary">Ease</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
          {isAuthenticated && (
            <>
              <NavLink to="/dashboard" className={linkClass}>
                Dashboard
              </NavLink>
              <NavLink to="/wishlist" className={linkClass}>
                <span className="flex items-center gap-1"><FiHeart className="h-3.5 w-3.5" /> Wishlist</span>
              </NavLink>
              <NavLink to="/my-payments" className={linkClass}>
                Payments
              </NavLink>
            </>
          )}
        </div>

        {/* Desktop auth controls */}
        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <>
              {/* Avatar + name */}
              <Link
                to="/dashboard"
                className="flex items-center gap-2 rounded-full px-3 py-1.5 transition hover:bg-gray-50"
              >
                {user?.avatar && !avatarErr ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    onError={() => setAvatarErr(true)}
                    className="h-8 w-8 rounded-full object-cover ring-2 ring-primary/20"
                  />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {initials}
                  </span>
                )}
                <span className="max-w-[100px] truncate text-sm font-medium text-secondary">
                  {user?.name?.split(' ')[0]}
                </span>
              </Link>

              {/* Logout */}
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-secondary transition hover:bg-gray-50"
              >
                <FiLogOut className="h-4 w-4" />
                Log out
              </button>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="rounded-lg p-2 text-secondary md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <HiX className="h-6 w-6" /> : <HiMenu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile menu */}
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

            {isAuthenticated ? (
              <>
                <NavLink
                  to="/dashboard"
                  className={linkClass}
                  onClick={() => setMenuOpen(false)}
                >
                  Dashboard
                </NavLink>
                <NavLink
                  to="/wishlist"
                  className={linkClass}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="flex items-center gap-1"><FiHeart className="h-3.5 w-3.5" /> Wishlist</span>
                </NavLink>
                <NavLink
                  to="/my-payments"
                  className={linkClass}
                  onClick={() => setMenuOpen(false)}
                >
                  Payments
                </NavLink>

                {/* User info */}
                <div className="flex items-center gap-2 py-1">
                  {user?.avatar && !avatarErr ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      onError={() => setAvatarErr(true)}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {initials}
                    </span>
                  )}
                  <div>
                    <p className="text-sm font-medium text-secondary">{user?.name}</p>
                    <p className="text-xs text-muted capitalize">{user?.role}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-sm font-medium text-secondary"
                >
                  <FiLogOut className="h-4 w-4" />
                  Log out
                </button>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
