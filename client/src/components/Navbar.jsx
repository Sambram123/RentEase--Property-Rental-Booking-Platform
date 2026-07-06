import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { HiMenu, HiX } from 'react-icons/hi';
import { FiHome, FiLogOut, FiUser, FiHeart, FiBell, FiShield, FiSettings, FiChevronDown, FiMessageSquare } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getUserAvatar } from '../utils/avatar';
import { useNotifications, getNotifConfig } from '../context/NotificationContext';
import { markNotificationRead } from '../services/notificationService';
import { useChat } from '../context/ChatContext';
import { formatTimeAgo } from '../utils/constants';

const navLinks = [
  { to: '/properties', label: 'Properties' },
];

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { unreadCount, recentNotifications, decrementUnread } = useNotifications();
  const { unreadChatCount } = useChat();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const bellRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns on outside click OR Escape key
  useEffect(() => {
    const handleClick = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setBellOpen(false);
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
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

  const avatarUrl = user ? getUserAvatar(user) : '';

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
              <NavLink to="/messages" className={linkClass}>
                <span className="flex items-center gap-1">
                  <FiMessageSquare className="h-3.5 w-3.5" />
                  Messages
                  {unreadChatCount > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">
                      {unreadChatCount > 99 ? '99+' : unreadChatCount}
                    </span>
                  )}
                </span>
              </NavLink>
              <NavLink to="/my-payments" className={linkClass}>
                Payments
              </NavLink>
              {user?.role === 'admin' && (
                <NavLink to="/admin" className={linkClass}>
                  <span className="flex items-center gap-1"><FiShield className="h-3.5 w-3.5" /> Admin</span>
                </NavLink>
              )}
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
                  aria-expanded={bellOpen}
                  aria-haspopup="true"
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
                                {formatTimeAgo(notif.createdAt)}
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

              {/* Profile menu */}
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 rounded-full px-3 py-1.5 transition hover:bg-gray-50"
                  aria-label="Profile menu"
                  aria-expanded={profileOpen}
                  aria-haspopup="true"
                >
                  <img
                    src={avatarUrl}
                    alt={user.name}
                    className="h-8 w-8 rounded-full object-cover ring-2 ring-primary/20"
                  />
                  <span className="max-w-[100px] truncate text-sm font-medium text-secondary">
                    {user?.name?.split(' ')[0]}
                  </span>
                  <FiChevronDown className={`h-3.5 w-3.5 text-muted transition ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-12 z-50 w-52 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
                    <div className="border-b border-gray-100 px-4 py-3">
                      <p className="truncate text-sm font-semibold text-secondary">{user?.name}</p>
                      <p className="truncate text-xs text-muted">{user?.email}</p>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-secondary transition hover:bg-gray-50"
                    >
                      <FiUser className="h-4 w-4" /> My Profile
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-secondary transition hover:bg-gray-50"
                    >
                      <FiSettings className="h-4 w-4" /> Settings
                    </Link>
                    <Link
                      to={['owner', 'admin'].includes(user?.role) ? '/owner/dashboard' : '/dashboard'}
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-secondary transition hover:bg-gray-50"
                    >
                      <FiHome className="h-4 w-4" /> Dashboard
                    </Link>
                  </div>
                )}
              </div>

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
                  to="/messages"
                  className={linkClass}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="flex items-center gap-1">
                    <FiMessageSquare className="h-3.5 w-3.5" />
                    Messages
                    {unreadChatCount > 0 && (
                      <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                        {unreadChatCount}
                      </span>
                    )}
                  </span>
                </NavLink>
                <NavLink
                  to="/my-payments"
                  className={linkClass}
                  onClick={() => setMenuOpen(false)}
                >
                  Payments
                </NavLink>
                {user?.role === 'admin' && (
                  <NavLink
                    to="/admin"
                    className={linkClass}
                    onClick={() => setMenuOpen(false)}
                  >
                    <span className="flex items-center gap-1"><FiShield className="h-3.5 w-3.5" /> Admin</span>
                  </NavLink>
                )}

                <NavLink to="/profile" className={linkClass} onClick={() => setMenuOpen(false)}>
                  <span className="flex items-center gap-1"><FiUser className="h-3.5 w-3.5" /> Profile</span>
                </NavLink>
                <NavLink to="/settings" className={linkClass} onClick={() => setMenuOpen(false)}>
                  <span className="flex items-center gap-1"><FiSettings className="h-3.5 w-3.5" /> Settings</span>
                </NavLink>

                {/* User info */}
                <div className="flex items-center gap-2 py-1">
                  <img
                    src={avatarUrl}
                    alt={user.name}
                    className="h-8 w-8 rounded-full object-cover"
                  />
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
