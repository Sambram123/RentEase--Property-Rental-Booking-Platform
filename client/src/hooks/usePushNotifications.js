import { useState, useEffect, useCallback } from 'react';

/**
 * usePushNotifications — manages browser push notification permission
 */
export const usePushNotifications = () => {
  const [permission, setPermission] = useState(
    'Notification' in window ? Notification.permission : 'unsupported'
  );
  const [isSupported] = useState('Notification' in window && 'serviceWorker' in navigator);

  useEffect(() => {
    if (!isSupported) return;
    setPermission(Notification.permission);
  }, [isSupported]);

  // Request browser notification permission
  const requestPermission = useCallback(async () => {
    if (!isSupported) return 'unsupported';
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch {
      return 'denied';
    }
  }, [isSupported]);

  // Send a local notification (for testing / immediate feedback)
  const sendLocalNotification = useCallback((title, options = {}) => {
    if (permission !== 'granted') return null;
    const notification = new Notification(title, {
      icon: '/icons/icon-192x192.svg',
      badge: '/icons/icon-72x72.svg',
      ...options,
    });
    return notification;
  }, [permission]);

  // Show notification via service worker (supports actions)
  const showSWNotification = useCallback(async (title, options = {}) => {
    if (permission !== 'granted') return;
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.showNotification(title, {
          icon: '/icons/icon-192x192.svg',
          badge: '/icons/icon-72x72.svg',
          vibrate: [100, 50, 100],
          ...options,
        });
      }
    } catch (err) {
      console.warn('[Push] SW notification failed:', err);
    }
  }, [permission]);

  return {
    permission,
    isSupported,
    isGranted: permission === 'granted',
    isDenied: permission === 'denied',
    requestPermission,
    sendLocalNotification,
    showSWNotification,
  };
};

export default usePushNotifications;
