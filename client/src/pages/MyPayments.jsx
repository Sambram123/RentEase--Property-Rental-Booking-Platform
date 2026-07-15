import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowLeft, FiCreditCard, FiCalendar, FiMapPin,
  FiCheckCircle, FiClock, FiXCircle,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import Loader from '../components/Loader';
import { fetchMyPayments } from '../services/paymentService';
import { formatPrice } from '../utils/constants';
import { getFirstImageUrl } from '../utils/imageUtils';

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&q=60';

const STATUS_CONFIG = {
  success: { label: 'Success', icon: FiCheckCircle, cls: 'bg-green-50 text-green-600' },
  pending: { label: 'Pending', icon: FiClock,        cls: 'bg-amber-50 text-amber-600' },
  failed:  { label: 'Failed',  icon: FiXCircle,     cls: 'bg-red-50 text-red-500'   },
};

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : '—';

const PaymentCard = ({ payment }) => {
  const prop    = payment.property || {};
  const booking = payment.booking  || {};
  const cfg     = STATUS_CONFIG[payment.paymentStatus] || STATUS_CONFIG.pending;
  const Icon    = cfg.icon;
  const image   = getFirstImageUrl(prop.images, PLACEHOLDER);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex flex-col sm:flex-row">
        <div className="h-40 shrink-0 sm:h-auto sm:w-44">
          <img
            src={image}
            alt={prop.title}
            className="h-full w-full object-cover"
            onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
          />
        </div>
        <div className="flex flex-1 flex-col justify-between p-5">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-secondary">{prop.title || 'Property'}</h3>
                {prop.city && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                    <FiMapPin className="h-3 w-3" /> {prop.city}
                  </p>
                )}
              </div>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.cls}`}>
                <Icon className="h-3 w-3" /> {cfg.label}
              </span>
            </div>
            {booking.checkInDate && (
              <p className="mt-2 flex items-center gap-1 text-xs text-muted">
                <FiCalendar className="h-3 w-3" />
                {new Date(booking.checkInDate).toLocaleDateString('en-IN')} →{' '}
                {new Date(booking.checkOutDate).toLocaleDateString('en-IN')}
              </p>
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-lg font-bold text-primary">{formatPrice(payment.amount)}</p>
              <p className="text-xs text-muted">{fmtDate(payment.transactionDate || payment.createdAt)}</p>
            </div>
            <div className="text-right text-xs text-muted">
              {payment.razorpayPaymentId && (
                <p className="max-w-[180px] truncate font-mono" title={payment.razorpayPaymentId}>
                  Ref: {payment.razorpayPaymentId}
                </p>
              )}
              {booking._id && (
                <p className="mt-0.5 truncate font-mono" title={booking._id}>
                  Booking: …{String(booking._id).slice(-6)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MyPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const result = await fetchMyPayments();
        setPayments(result.payments);
      } catch (err) {
        toast.error(err.message || 'Failed to load payments');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-4">
        <Link
          to="/dashboard"
          className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-primary"
        >
          <FiArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
        <span className="text-muted">/</span>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-secondary">
          <FiCreditCard className="h-6 w-6 text-primary" /> My payments
        </h1>
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader size="lg" />
        </div>
      ) : payments.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
          <FiCreditCard className="h-12 w-12 text-gray-200" />
          <h2 className="text-lg font-semibold text-secondary">No payments yet</h2>
          <p className="max-w-xs text-sm text-muted">
            Complete a booking and pay the advance to see your transaction history here.
          </p>
          <Link
            to="/properties"
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            Browse properties
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((p) => (
            <PaymentCard key={p._id} payment={p} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyPayments;
