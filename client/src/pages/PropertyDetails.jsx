import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiMapPin, FiHome, FiDroplet, FiStar,
  FiCalendar, FiUser, FiCheckCircle, FiShare2,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import Loader from '../components/Loader';
import { fetchPropertyById } from '../services/propertyService';
import { createBooking } from '../services/bookingService';
import { createPaymentOrder, verifyPayment } from '../services/paymentService';
import PropertyMap from '../components/PropertyMap';
import { geoJsonToLatLng } from '../services/mapsService';
import { openRazorpayCheckout } from '../utils/razorpayCheckout';
import { formatPrice, FEATURED_PROPERTIES } from '../utils/constants';
import { useAuth } from '../context/AuthContext';

const AMENITY_ICONS = {
  wifi:         { icon: '📶', label: 'WiFi' },
  parking:      { icon: '🅿️', label: 'Parking' },
  furnished:    { icon: '🪑', label: 'Furnished' },
  ac:           { icon: '❄️', label: 'Air Conditioning' },
  gym:          { icon: '💪', label: 'Gym' },
  pool:         { icon: '🏊', label: 'Swimming Pool' },
  security:     { icon: '🔒', label: '24/7 Security' },
  lift:         { icon: '🛗', label: 'Lift / Elevator' },
  power_backup: { icon: '⚡', label: 'Power Backup' },
  garden:       { icon: '🌿', label: 'Garden' },
};

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80';

// ─── Date helpers ─────────────────────────────────────────────────────────────
const toISO = (d) => d.toISOString().split('T')[0];
const today = () => toISO(new Date());

const diffDays = (a, b) =>
  Math.ceil((new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24));

const calcTotal = (pricePerMonth, checkIn, checkOut) => {
  if (!checkIn || !checkOut || checkOut <= checkIn) return 0;
  const days = diffDays(checkIn, checkOut);
  return Math.round((pricePerMonth / 30) * days);
};

// ─── BookingPanel ─────────────────────────────────────────────────────────────
const ADVANCE_PERCENT = 0.3;
const MIN_ADVANCE = 100;
const calcAdvance = (total) => Math.max(Math.round(total * ADVANCE_PERCENT), MIN_ADVANCE);

const BookingPanel = ({ property, isAuthenticated, navigate, propertyId, user }) => {
  const [checkIn,  setCheckIn]  = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [paying,   setPaying]   = useState(false);

  const price       = property.price ?? property.pricePerMonth ?? 0;
  const nights      = checkIn && checkOut ? diffDays(checkIn, checkOut) : 0;
  const totalAmount = useMemo(
    () => calcTotal(price, checkIn, checkOut),
    [price, checkIn, checkOut]
  );

  const isValidRange = checkIn && checkOut && checkOut > checkIn;
  const advanceAmount = isValidRange ? calcAdvance(totalAmount) : 0;

  const processPayment = async (booking) => {
    setPaying(true);
    try {
      const orderData = await createPaymentOrder(booking._id);

      const response = await openRazorpayCheckout({
        orderId: orderData.orderId,
        amount: orderData.amount,
        keyId: orderData.keyId,
        user,
        propertyTitle: property.title,
      });

      const verified = await verifyPayment({
        bookingId: booking._id,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      });

      toast.success('Payment successful! Booking confirmed.');
      navigate('/payment/success', {
        state: {
          bookingId: booking._id,
          booking: verified.booking,
          paymentId: response.razorpay_payment_id,
          orderId: response.razorpay_order_id,
          amount: orderData.amount,
          property: { title: property.title },
        },
      });
    } catch (err) {
      if (err.code === 'PAYMENT_CANCELLED') {
        toast.error('Payment cancelled');
        navigate('/my-bookings');
        return;
      }
      toast.error(err.message || 'Payment failed');
      navigate('/payment/failed', {
        state: {
          message: err.message,
          bookingId: booking._id,
          amount: advanceAmount,
          propertyTitle: property.title,
          retryPath: `/properties/${propertyId}`,
        },
      });
    } finally {
      setPaying(false);
    }
  };

  const handleBook = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to book this property');
      navigate('/login', { state: { from: { pathname: `/properties/${propertyId}` } } });
      return;
    }
    if (!checkIn || !checkOut) {
      toast.error('Please select check-in and check-out dates');
      return;
    }
    if (checkOut <= checkIn) {
      toast.error('Check-out must be after check-in');
      return;
    }

    setLoading(true);
    try {
      const booking = await createBooking({ propertyId, checkInDate: checkIn, checkOutDate: checkOut });
      toast.success('Booking created — opening payment…');
      await processPayment(booking);
    } catch (err) {
      toast.error(err.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">
      {/* Price header */}
      <div className="mb-5">
        <p className="text-3xl font-bold text-secondary">
          {formatPrice(price)}
        </p>
        <p className="text-sm text-muted">per month</p>
      </div>

      {/* Date pickers */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">
            Check-in
          </label>
          <input
            type="date"
            min={today()}
            value={checkIn}
            onChange={(e) => {
              setCheckIn(e.target.value);
              if (checkOut && e.target.value >= checkOut) setCheckOut('');
            }}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">
            Check-out
          </label>
          <input
            type="date"
            min={checkIn || today()}
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            disabled={!checkIn}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
          />
        </div>
      </div>

      {/* Summary */}
      {isValidRange && (
        <div className="mb-4 space-y-2 rounded-xl border border-gray-100 bg-gray-50/60 p-4 text-sm">
          <div className="flex justify-between text-muted">
            <span>
              {formatPrice(price)} × {nights} night{nights !== 1 ? 's' : ''}
            </span>
            <span className="font-medium text-secondary">{formatPrice(totalAmount)}</span>
          </div>
          <div className="flex justify-between font-semibold text-secondary">
            <span>Total</span>
            <span className="text-primary">{formatPrice(totalAmount)}</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>Advance due now (30%)</span>
            <span className="font-medium text-secondary">{formatPrice(advanceAmount)}</span>
          </div>
        </div>
      )}

      {/* Key details */}
      <ul className="mb-5 space-y-1.5 text-sm">
        {[
          ['Type',      property.type ? property.type.charAt(0).toUpperCase() + property.type.slice(1) : '—'],
          ['Bedrooms',  property.bedrooms],
          ['Bathrooms', property.bathrooms],
          ['City',      property.city || property.address?.city],
        ].map(([label, val]) => (
          <li key={label} className="flex justify-between border-b border-gray-50 py-1.5">
            <span className="text-muted">{label}</span>
            <span className="font-medium capitalize text-secondary">{val}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        type="button"
        onClick={handleBook}
        disabled={loading || paying || !property.availability || !isValidRange}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        {(loading || paying) ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        ) : (
          <FiCalendar className="h-4 w-4" />
        )}
        {loading
          ? 'Creating booking…'
          : paying
            ? 'Processing payment…'
            : property.availability
              ? 'Book & pay advance'
              : 'Not available'}
      </button>

      {!isAuthenticated && (
        <p className="mt-3 text-center text-xs text-muted">
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>{' '}
          to book this property
        </p>
      )}

      <p className="mt-3 text-center text-xs text-muted">
        Pay a 30% advance via Razorpay to confirm your booking instantly.
      </p>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [property,  setProperty]  = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchPropertyById(id);
        setProperty(data);
      } catch {
        const mock = FEATURED_PROPERTIES.find((p) => p.id === id);
        if (mock) {
          setProperty({
            ...mock,
            _id:         mock.id,
            price:       mock.pricePerMonth,
            images:      [mock.image],
            description: 'A beautiful property available for rent.',
            type:        'apartment',
            address:     { city: mock.location, state: '', country: 'India' },
            amenities:   ['wifi', 'parking'],
            availability: true,
          });
        } else {
          setError('Property not found');
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <span className="text-5xl">🏚️</span>
        <h1 className="mt-4 text-2xl font-bold text-secondary">Property not found</h1>
        <p className="mt-2 text-sm text-muted">
          The listing may have been removed or the link is incorrect.
        </p>
        <Link
          to="/properties"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          <FiArrowLeft /> Browse properties
        </Link>
      </div>
    );
  }

  const images    = property.images?.length ? property.images : [PLACEHOLDER_IMAGE];
  const address   = property.address || {};
  const cityLabel = property.city || address.city || '';
  const fullAddr  = [address.street, address.city, address.state, address.country]
    .filter(Boolean).join(', ');

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        to="/properties"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-primary"
      >
        <FiArrowLeft /> Back to properties
      </Link>

      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">

        {/* ── Left column ─────────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* Gallery */}
          <div>
            <div className="relative aspect-[16/9] overflow-hidden rounded-2xl shadow-md">
              <img
                src={images[activeImg]}
                alt={property.title}
                className="h-full w-full object-cover"
                onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE; }}
              />
              {!property.availability && (
                <span className="absolute left-4 top-4 rounded-full bg-gray-800/80 px-3 py-1 text-xs font-semibold text-white">
                  Currently unavailable
                </span>
              )}
              <button
                type="button"
                onClick={handleShare}
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow transition hover:bg-white"
              >
                <FiShare2 className="h-4 w-4 text-secondary" />
              </button>
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImg(idx)}
                    className={`h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                      activeImg === idx ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover"
                      onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE; }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title & basics */}
          <div>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="mb-2 inline-block rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold capitalize text-primary">
                  {property.type}
                </span>
                <h1 className="text-2xl font-bold text-secondary sm:text-3xl">
                  {property.title}
                </h1>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
                  <FiMapPin className="h-4 w-4 shrink-0 text-primary" />
                  {fullAddr || cityLabel}
                </p>
              </div>
              {property.rating > 0 && (
                <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5">
                  <FiStar className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-secondary">
                    {Number(property.rating).toFixed(1)}
                  </span>
                  <span className="text-xs text-muted">({property.reviewsCount || 0} reviews)</span>
                </div>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-4">
              <span className="flex items-center gap-1.5 text-sm text-secondary">
                <FiHome className="h-4 w-4 text-primary" />
                {property.bedrooms} Bedroom{property.bedrooms !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1.5 text-sm text-secondary">
                <FiDroplet className="h-4 w-4 text-primary" />
                {property.bathrooms} Bathroom{property.bathrooms !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1.5 text-sm text-secondary">
                <FiCheckCircle className="h-4 w-4 text-green-500" />
                {property.availability ? 'Available now' : 'Not available'}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-3 font-semibold text-secondary">About this property</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted">
              {property.description}
            </p>
          </div>

          {/* Amenities */}
          {property.amenities?.length > 0 && (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-semibold text-secondary">Amenities</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {property.amenities.map((a) => {
                  const meta = AMENITY_ICONS[a];
                  return (
                    <div key={a} className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3 text-sm font-medium text-secondary">
                      <span>{meta?.icon || '✅'}</span>
                      {meta?.label || a}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Owner info */}
          {property.owner && (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-semibold text-secondary">Listed by</h2>
              <div className="flex items-center gap-3">
                {property.owner.avatar ? (
                  <img src={property.owner.avatar} alt={property.owner.name}
                    className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <FiUser className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-secondary">{property.owner.name}</p>
                  <p className="text-sm text-muted">{property.owner.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Location map */}
          {(() => {
            const coords = geoJsonToLatLng(property.location?.coordinates);
            return (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 font-semibold text-secondary">
                  <FiMapPin className="h-4 w-4 text-primary" /> Location
                </h2>
                <PropertyMap
                  lat={coords?.lat}
                  lng={coords?.lng}
                  title={property.title}
                  className="h-64 w-full"
                />
                {(fullAddr || cityLabel) && (
                  <p className="mt-3 flex items-center gap-1.5 text-sm text-muted">
                    <FiMapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                    {fullAddr || cityLabel}
                  </p>
                )}
              </div>
            );
          })()}
        </div>

        {/* ── Right column — Booking panel ────────────────────────────── */}
        <div className="h-fit lg:sticky lg:top-24">
          <BookingPanel
            property={property}
            isAuthenticated={isAuthenticated}
            navigate={navigate}
            propertyId={property._id || id}
            user={user}
          />
        </div>

      </div>
    </div>
  );
};

export default PropertyDetails;
