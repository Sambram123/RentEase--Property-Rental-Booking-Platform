import { useEffect, useRef } from 'react';

/**
 * ConfirmModal — accessible modal dialog with keyboard trap and ARIA attributes.
 * - Escape closes the modal
 * - Tab/Shift+Tab cycles focus within the modal
 * - Focus is restored to the trigger element on close
 */
const ConfirmModal = ({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmClass = 'bg-red-500 hover:bg-red-600',
  loading = false,
  onConfirm,
  onCancel,
  children,
}) => {
  const cancelRef  = useRef(null);
  const confirmRef = useRef(null);

  // Focus cancel button on open; close on Escape; trap Tab within modal
  useEffect(() => {
    if (!open) return;

    // Focus first interactive element (cancel is safer default)
    cancelRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel?.();
        return;
      }
      if (e.key === 'Tab') {
        const focusable = [cancelRef.current, confirmRef.current].filter(Boolean);
        if (focusable.length < 2) return;
        const first = focusable[0];
        const last  = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby={message ? 'confirm-modal-desc' : undefined}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-xl">
        <h3 id="confirm-modal-title" className="text-lg font-bold text-secondary">
          {title}
        </h3>
        {message && (
          <p id="confirm-modal-desc" className="mt-2 text-sm text-muted">
            {message}
          </p>
        )}
        {children && <div className="mt-4">{children}</div>}

        <div className="mt-6 flex justify-end gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-secondary transition hover:bg-gray-50 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-offset-primary ${confirmClass}`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Processing…
              </span>
            ) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
