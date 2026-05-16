import { Link } from 'react-router-dom';
import { FiMapPin, FiStar } from 'react-icons/fi';
import { formatPrice } from '../utils/constants';

const PropertyCard = ({ property }) => {
  const { id, title, location, pricePerMonth, bedrooms, bathrooms, image, rating } =
    property;

  return (
    <Link
      to={`/properties/${id}`}
      className="group block overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {rating && (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-xs font-medium shadow-sm">
            <FiStar className="h-3 w-3 fill-primary text-primary" />
            {rating}
          </span>
        )}
      </div>
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
            {formatPrice(pricePerMonth)}
            <span className="text-xs font-normal text-muted">/mo</span>
          </p>
        </div>
      </div>
    </Link>
  );
};

export default PropertyCard;
