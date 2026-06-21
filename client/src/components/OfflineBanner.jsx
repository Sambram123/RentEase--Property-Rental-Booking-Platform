import { useEffect, useState } from 'react';
import { FiWifiOff, FiWifi, FiX } from 'react-icons/fi';
import { usePWA } from '../hooks/usePWA';

/**
 * OfflineBanner — sticky banner shown when user goes offline / comes back online
 */
const OfflineBanner = () => {
  const { isOnline } = usePWA();
  const [showOnlineMsg, setShowOnlineMsg] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [prevOnline, setPrevOnline] = useState(isOnline);

  useEffect(() => {
    // Went offline
    if (prevOnline && !isOnline) {
      setDismissed(false);
      setShowOnlineMsg(false);
    }
    // Came back online
    if (!prevOnline && isOnline) {
      setShowOnlineMsg(true);
      setDismissed(false);
      const t = setTimeout(() => setShowOnlineMsg(false), 4000);
      return () => clearTimeout(t);
    }
    setPrevOnline(isOnline);
  }, [isOnline, prevOnline]);

  if (isOnline && !showOnlineMsg) return null;
  if (dismissed) return null;

  return (
    <div
      className={`fixed left-0 right-0 top-0 z-[9999] flex items-center justify-between px-4 py-3 text-sm font-medium shadow-lg transition-all duration-300 ${
        isOnline
          ? 'bg-green-500 text-white'
          : 'bg-amber-500 text-white'
      }`}
      role="alert"
    >
      <div className="flex items-center gap-2">
        {isOnline ? (
          <FiWifi className="h-4 w-4 shrink-0" />
        ) : (
          <FiWifiOff className="h-4 w-4 shrink-0 animate-pulse" />
        )}
        <span>
          {isOnline
            ? '✓ You\'re back online'
            : 'No internet connection — some features may be unavailable'}
        </span>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="ml-2 rounded p-0.5 opacity-80 transition hover:opacity-100"
        aria-label="Dismiss"
      >
        <FiX className="h-4 w-4" />
      </button>
    </div>
  );
};

export default OfflineBanner;
