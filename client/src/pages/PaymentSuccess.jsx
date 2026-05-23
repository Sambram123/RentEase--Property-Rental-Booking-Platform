import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiCheckCircle, FiCalendar, FiHome, FiCreditCard } from 'react-icons/fi';
import Loader from '../components/Loader';
import { fetchBookingById } from '../services/bookingService';
import { formatPrice } from '../utils/constants';

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};

  const [booking, setBooking] = useState(state.booking || null);
  const [loading, setLoading] = useState(!state.booking && !!state.bookingId);

  useEffect(() => {
    if (!state.bookingId || state.booking) return;
    const load = async () => {
      try {
        const data = await fetchBookingById(state.bookingId);
        setBooking(data);
      } catch {
        // keep minimal state from navigation
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [state.bookingId, state.booking]);

  if (!state.paymentId && !state.bookingId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-muted">No payment details found.</p>
        <Link to="/my-bookings" className="mt-4 inline-block text-primary hover:underline">
          Go to my bookings
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  const property = booking?.property || state.property || {};
  const amount = state.amount ?? booking?.advancePaid;

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:py-16">
      <div className="rounded-2xl border border-green-100 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
          <FiCheckCircle className="h-9 w-9 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-secondary">Payment successful</h1>
        <p className="mt-2 text-sm text-muted">
          Your advance payment has been received and your booking is confirmed.
        </p>

        <div className="mt-8 space-y-3 rounded-xl border border-gray-100 bg-gray-50/60 p-5 text-left text-sm">
          {amount != null && (
            <div className="flex justify-between">
              <span className="text-muted">Amount paid</span>
              <span className="font-semibold text-secondary">{formatPrice(amount)}</span>
            </div>
          )}
          {state.paymentId && (
            <div className="flex justify-between gap-4">
              <span className="shrink-0 text-muted">Payment reference</span>
              <span className="truncate font-mono text-xs text-secondary">{state.paymentId}</span>
            </div>
          )}
          {state.orderId && (
            <div className="flex justify-between gap-4">
              <span className="shrink-0 text-muted">Order ID</span>
              <span className="truncate font-mono text-xs text-secondary">{state.orderId}</span>
            </div>
          )}
          {property.title && (
            <div className="flex justify-between">
              <span className="text-muted">Property</span>
              <span className="font-medium text-secondary">{property.title}</span>
            </div>
          )}
          {booking?.checkInDate && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-muted">
                <FiCalendar className="h-3.5 w-3.5" /> Stay
              </span>
              <span className="font-medium text-secondary">
                {fmtDate(booking.checkInDate)} → {fmtDate(booking.checkOutDate)}
              </span>
            </div>
          )}
          <div className="flex justify-between border-t border-gray-100 pt-3">
            <span className="text-muted">Status</span>
            <span className="font-medium text-green-600">Paid</span>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/my-bookings"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            <FiCalendar className="h-4 w-4" /> My bookings
          </Link>
          <Link
            to="/my-payments"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-secondary hover:bg-gray-50"
          >
            <FiCreditCard className="h-4 w-4" /> Payment history
          </Link>
          <button
            type="button"
            onClick={() => navigate('/properties')}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-secondary hover:bg-gray-50"
          >
            <FiHome className="h-4 w-4" /> Browse more
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
