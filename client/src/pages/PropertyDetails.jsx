import { useParams, Link } from 'react-router-dom';
import { FiMapPin, FiArrowLeft } from 'react-icons/fi';
import { FEATURED_PROPERTIES, formatPrice } from '../utils/constants';

const PropertyDetails = () => {
  const { id } = useParams();
  const property = FEATURED_PROPERTIES.find((p) => p.id === id);

  if (!property) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-secondary">Property not found</h1>
        <Link to="/properties" className="mt-4 inline-block text-primary">
          ← Back to properties
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        to="/properties"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-primary"
      >
        <FiArrowLeft /> Back to properties
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        <img
          src={property.image}
          alt={property.title}
          className="aspect-[4/3] w-full rounded-2xl object-cover shadow-md"
        />
        <div>
          <h1 className="text-3xl font-bold text-secondary">{property.title}</h1>
          <p className="mt-2 flex items-center gap-2 text-muted">
            <FiMapPin /> {property.location}
          </p>
          <p className="mt-6 text-3xl font-bold text-secondary">
            {formatPrice(property.pricePerMonth)}
            <span className="text-base font-normal text-muted"> / month</span>
          </p>
          <p className="mt-4 text-sm text-muted">
            {property.bedrooms} bedrooms · {property.bathrooms} bathrooms
          </p>
          <button
            type="button"
            className="mt-8 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white transition hover:bg-primary-dark sm:w-auto sm:px-8"
          >
            Book now
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;
