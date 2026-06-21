import { useState, useEffect } from 'react';
import { FiDownload, FiX, FiHome } from 'react-icons/fi';
import { usePWA } from '../hooks/usePWA';

/**
 * InstallPrompt — floating card to encourage PWA installation
 */
const InstallPrompt = () => {
  const { canInstall, isInstalled, triggerInstall } = usePWA();
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [visible, setVisible] = useState(false);

  // Delay appearance for 3s after page load
  useEffect(() => {
    if (!canInstall || dismissed || isInstalled) return;

    const stored = localStorage.getItem('pwa-prompt-dismissed');
    if (stored) {
      const dismissedAt = parseInt(stored, 10);
      // Don't re-show for 7 days after dismissal
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) {
        setDismissed(true);
        return;
      }
    }

    const t = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(t);
  }, [canInstall, dismissed, isInstalled]);

  const handleInstall = async () => {
    setInstalling(true);
    const accepted = await triggerInstall();
    setInstalling(false);
    if (accepted) {
      setVisible(false);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  if (!visible || !canInstall) return null;

  return (
    <div
      className="fixed bottom-[5.5rem] left-4 right-4 z-[9998] md:bottom-6 md:left-auto md:right-6 md:w-80"
      role="dialog"
      aria-label="Install RentEase app"
    >
      <div className="overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-gray-100">
        {/* Header */}
        <div className="flex items-start gap-3 bg-gradient-to-r from-primary to-primary-dark p-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20">
            <FiHome className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-white">Install RentEase</p>
            <p className="mt-0.5 text-sm text-white/80">Get the full app experience</p>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-full p-1 text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Dismiss install prompt"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          <ul className="mb-4 space-y-1.5 text-sm text-muted">
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span> Works offline
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span> Faster loading
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span> Home screen access
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span> Push notifications
            </li>
          </ul>

          <button
            type="button"
            onClick={handleInstall}
            disabled={installing}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
          >
            <FiDownload className="h-4 w-4" />
            {installing ? 'Installing…' : 'Install App'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
