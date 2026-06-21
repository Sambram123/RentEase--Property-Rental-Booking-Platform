import { NavLink, useLocation } from 'react-router-dom';
import { FiHome, FiSearch, FiHeart, FiMessageSquare, FiUser } from 'react-icons/fi';
import { MdDashboard } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useNotifications } from '../context/NotificationContext';

/**
 * MobileBottomNav — bottom navigation bar visible on mobile/tablet screens
 * Hidden on desktop (md and above)
 */
const MobileBottomNav = () => {
  const { isAuthenticated, user } = useAuth();
  const { unreadChatCount } = useChat();
  const { unreadCount } = useNotifications();
  const location = useLocation();

  const dashboardPath = ['owner', 'admin'].includes(user?.role)
    ? '/owner/dashboard'
    : '/dashboard';

  // Don't show on login/register pages
  const hiddenPaths = ['/login', '/register'];
  if (hiddenPaths.includes(location.pathname)) return null;

  const navItem = (to, label, Icon, badge = 0) => (
    <NavLink
      to={to}
      key={to}
      className={({ isActive }) =>
        `flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
          isActive ? 'text-primary' : 'text-muted'
        }`
      }
    >
      <div className="relative">
        <Icon className="h-5 w-5" />
        {badge > 0 && (
          <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      <span>{label}</span>
    </NavLink>
  );

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-100 bg-white/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Mobile navigation"
    >
      <div className="flex h-16 items-stretch">
        {navItem('/', 'Home', FiHome)}
        {navItem('/properties', 'Search', FiSearch)}

        {isAuthenticated ? (
          <>
            {navItem('/wishlist', 'Wishlist', FiHeart)}
            {navItem('/messages', 'Messages', FiMessageSquare, unreadChatCount)}
            {navItem(dashboardPath, 'Dashboard', MdDashboard, unreadCount)}
          </>
        ) : (
          <>
            {navItem('/wishlist', 'Wishlist', FiHeart)}
            {navItem('/login', 'Account', FiUser)}
          </>
        )}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
