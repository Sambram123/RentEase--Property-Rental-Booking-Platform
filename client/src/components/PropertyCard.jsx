import { memo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiMapPin, FiStar } from 'react-icons/fi';
import { formatPrice } from '../utils/constants';

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80';

const PropertyCard = memo(({ property }) => {
  // Support both legacy mock shape (id, location, pricePerMonth, image)
  // and real API shape (_id, city, price, images[])
  const id       = property._id  || property.id;
  const title    = property.title;
  const location = property.city || property.address?.city || property.location || '';
  const price    = property.price ?? property.pricePerMonth ?? 0;
  const bedrooms  = property.bedrooms  ?? 0;
  const bathrooms = property.bathrooms ?? 0;
  const rating    = property.rating;
  const image     =
    (Array.isArray(property.images) && property.images[0]) ||
    property.image ||
    PLACEHOLDER_IMAGE;

  const handleImgError = useCallback((e) => {
    e.currentTarget.src = PLACEHOLDER_IMAGE;
  }, []);

  return (
    <Link
      to={`/properties/${id}`}
      className="group block overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          loading="lazy"
          decoding="async"
          onError={handleImgError}
        />
        {rating > 0 && (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-xs font-medium shadow-sm">
            <FiStar className="h-3 w-3 fill-primary text-primary" />
            {Number(rating).toFixed(1)}
            {property.reviewsCount > 0 && (
              <span className="text-muted">({property.reviewsCount})</span>
            )}
          </span>
        )}
        {/* Availability badge */}
        {property.availability === false && (
          <span className="absolute left-3 top-3 rounded-full bg-gray-800/80 px-2 py-1 text-xs font-medium text-white">
            Unavailable
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="line-clamp-1 font-semibold text-secondary group-hover:text-primary">
          {title}
        </h3>
        <p className="mt-1 flex items-center gap-1 text-sm text-muted">
          <FiMapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="line-clamp-1">{location}</span>
        </p>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm text-muted">
            {bedrooms} bed · {bathrooms} bath
          </p>
          <p className="font-semibold text-secondary">
            {formatPrice(price)}
            <span className="text-xs font-normal text-muted">/mo</span>
          </p>
        </div>
      </div>
    </Link>
  );
});

PropertyCard.displayName = 'PropertyCard';

export default PropertyCard;
