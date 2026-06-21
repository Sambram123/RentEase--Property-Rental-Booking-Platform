import { FiRefreshCw, FiX } from 'react-icons/fi';
import { usePWA } from '../hooks/usePWA';
import { useState } from 'react';

/**
 * UpdateBanner — shown when a new service worker version is available
 */
const UpdateBanner = () => {
  const { updateAvailable, applyUpdate } = usePWA();
  const [dismissed, setDismissed] = useState(false);

  if (!updateAvailable || dismissed) return null;

  return (
    <div className="fixed bottom-[5.5rem] left-0 right-0 z-[9997] mx-auto max-w-sm px-4 md:bottom-6">
      <div className="flex items-center gap-3 rounded-2xl bg-secondary px-4 py-3 shadow-xl">
        <FiRefreshCw className="h-5 w-5 shrink-0 text-primary" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">Update Available</p>
          <p className="text-xs text-gray-400">A new version of RentEase is ready</p>
        </div>
        <button
          type="button"
          onClick={applyUpdate}
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-dark"
        >
          Update
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="rounded p-0.5 text-gray-400 transition hover:text-white"
          aria-label="Dismiss update"
        >
          <FiX className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default UpdateBanner;
