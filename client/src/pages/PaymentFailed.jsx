import { Link, useLocation } from 'react-router-dom';
import { FiXCircle, FiRefreshCw, FiCalendar } from 'react-icons/fi';
import { formatPrice } from '../utils/constants';

const PaymentFailed = () => {
  const location = useLocation();
  const state = location.state || {};

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:py-16">
      <div className="rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <FiXCircle className="h-9 w-9 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-secondary">Payment failed</h1>
        <p className="mt-2 text-sm text-muted">
          {state.message || 'Your payment could not be completed. No amount was charged.'}
        </p>

        {(state.amount || state.propertyTitle) && (
          <div className="mt-8 space-y-3 rounded-xl border border-gray-100 bg-gray-50/60 p-5 text-left text-sm">
            {state.propertyTitle && (
              <div className="flex justify-between">
                <span className="text-muted">Property</span>
                <span className="font-medium text-secondary">{state.propertyTitle}</span>
              </div>
            )}
            {state.amount != null && (
              <div className="flex justify-between">
                <span className="text-muted">Attempted amount</span>
                <span className="font-semibold text-secondary">{formatPrice(state.amount)}</span>
              </div>
            )}
            {state.bookingId && (
              <div className="flex justify-between gap-4">
                <span className="text-muted">Booking</span>
                <span className="truncate font-mono text-xs text-secondary">{state.bookingId}</span>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {state.retryPath && (
            <Link
              to={state.retryPath}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              <FiRefreshCw className="h-4 w-4" /> Try again
            </Link>
          )}
          <Link
            to="/my-bookings"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-secondary hover:bg-gray-50"
          >
            <FiCalendar className="h-4 w-4" /> My bookings
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailed;
