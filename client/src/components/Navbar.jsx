import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { HiMenu, HiX } from 'react-icons/hi';
import { FiHome, FiLogOut, FiUser, FiHeart, FiBell } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useNotifications, getNotifConfig } from '../context/NotificationContext';
import { markNotificationRead } from '../services/notificationService';

const navLinks = [
  { to: '/properties', label: 'Properties' },
];

const fmtTime = (d) => {
  const now = new Date();
  const date = new Date(d);
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
};

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { unreadCount, recentNotifications, decrementUnread } = useNotifications();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarErr, setAvatarErr] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

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

  const handleNotifClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await markNotificationRead(notif._id);
        decrementUnread();
      } catch { /* skip */ }
    }
    setBellOpen(false);
    navigate('/notifications');
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
              <NavLink to={['owner', 'admin'].includes(user?.role) ? '/owner/dashboard' : '/dashboard'} className={linkClass}>
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
              {/* ── Notification bell ─────────────────────────────────────── */}
              <div className="relative" ref={bellRef}>
                <button
                  type="button"
                  onClick={() => setBellOpen(!bellOpen)}
                  className="relative flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-gray-100"
                  aria-label="Notifications"
                  id="notification-bell"
                >
                  <FiBell className="h-5 w-5 text-secondary" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white shadow-sm">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown */}
                {bellOpen && (
                  <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                      <p className="text-sm font-semibold text-secondary">Notifications</p>
                      {unreadCount > 0 && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {unreadCount} new
                        </span>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                      {recentNotifications.length === 0 ? (
                        <div className="py-10 text-center">
                          <FiBell className="mx-auto h-8 w-8 text-gray-200" />
                          <p className="mt-2 text-sm text-muted">No new notifications</p>
                        </div>
                      ) : (
                        recentNotifications.slice(0, 5).map((notif) => {
                          const config = getNotifConfig(notif.type);
                          return (
                            <button
                              key={notif._id}
                              type="button"
                              onClick={() => handleNotifClick(notif)}
                              className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-gray-50 ${
                                !notif.isRead ? 'bg-primary/[0.02]' : ''
                              }`}
                            >
                              <span className="mt-0.5 text-lg">{config.emoji}</span>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-secondary line-clamp-1">
                                  {notif.title}
                                </p>
                                <p className="text-xs text-muted line-clamp-1">{notif.message}</p>
                              </div>
                              <span className="shrink-0 text-[10px] text-muted">
                                {fmtTime(notif.createdAt)}
                              </span>
                              {!notif.isRead && (
                                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>

                    <Link
                      to="/notifications"
                      onClick={() => setBellOpen(false)}
                      className="flex items-center justify-center border-t border-gray-100 py-3 text-sm font-medium text-primary transition hover:bg-gray-50"
                    >
                      View all notifications
                    </Link>
                  </div>
                )}
              </div>

              {/* Avatar + name */}
              <Link
                to={['owner', 'admin'].includes(user?.role) ? '/owner/dashboard' : '/dashboard'}
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
                  to={['owner', 'admin'].includes(user?.role) ? '/owner/dashboard' : '/dashboard'}
                  className={linkClass}
                  onClick={() => setMenuOpen(false)}
                >
                  Dashboard
                </NavLink>
                <NavLink
                  to="/notifications"
                  className={linkClass}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="flex items-center gap-1">
                    <FiBell className="h-3.5 w-3.5" />
                    Notifications
                    {unreadCount > 0 && (
                      <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                        {unreadCount}
                      </span>
                    )}
                  </span>
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
