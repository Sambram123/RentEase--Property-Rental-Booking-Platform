import PropertyCard from '../components/PropertyCard';
import { FEATURED_PROPERTIES } from '../utils/constants';

const Properties = () => {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary">All properties</h1>
        <p className="mt-1 text-muted">Browse available rentals across India</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {FEATURED_PROPERTIES.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
    </div>
  );
};

export default Properties;
