import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiTrash2, FiMapPin } from 'react-icons/fi';
import toast from 'react-hot-toast';
import StarRating from '../components/StarRating';
import LazyImage from '../components/LazyImage';
import { PropertyGridSkeleton } from '../components/SkeletonLoaders';
import { fetchWishlist, removeFromWishlist } from '../services/wishlistService';
import { formatPrice } from '../utils/constants';

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80';

const Wishlist = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchWishlist();
        setProperties(data.properties);
      } catch (err) {
        toast.error(err.message || 'Failed to load wishlist');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleRemove = async (id) => {
    setRemovingId(id);
    try {
      await removeFromWishlist(id);
      setProperties((prev) => prev.filter((p) => p._id !== id));
      toast.success('Removed from wishlist');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 h-8 w-40 animate-pulse rounded-lg bg-gray-200" />
        <PropertyGridSkeleton count={6} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <FiHeart className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-secondary">Saved Properties</h1>
          <p className="text-sm text-muted">
            {properties.length} {properties.length === 1 ? 'property' : 'properties'} saved
          </p>
        </div>
      </div>

      {/* Grid or empty state */}
      {properties.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-12 text-center">
          <span className="text-5xl">💛</span>
          <h2 className="mt-4 text-lg font-semibold text-secondary">No saved properties yet</h2>
          <p className="mt-2 text-sm text-muted">
            Save your favorite listings and they will show up here.
          </p>
          <Link
            to="/properties"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
          >
            Browse properties
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => {
            const image =
              (Array.isArray(property.images) && property.images[0]) || PLACEHOLDER;
            const location =
              property.city || property.address?.city || '';

            return (
              <div
                key={property._id}
                className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                {/* Image */}
                <Link to={`/properties/${property._id}`} className="relative block aspect-[4/3] overflow-hidden">
                  <LazyImage
                    src={image}
                    alt={property.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    placeholderClassName="aspect-[4/3]"
                    fallback={<img src={PLACEHOLDER} alt={property.title} className="h-full w-full object-cover" />}
                  />
                  {property.rating > 0 && (
                    <div className="absolute right-3 top-3">
                      <StarRating value={property.rating} size="sm" showLabel />
                    </div>
                  )}
                </Link>

                {/* Info */}
                <div className="p-4">
                  <Link to={`/properties/${property._id}`}>
                    <h3 className="line-clamp-1 font-semibold text-secondary group-hover:text-primary">
                      {property.title}
                    </h3>
                  </Link>
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted">
                    <FiMapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="line-clamp-1">{location}</span>
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-sm text-muted">
                      {property.bedrooms ?? 0} bed · {property.bathrooms ?? 0} bath
                    </p>
                    <p className="font-semibold text-secondary">
                      {formatPrice(property.price ?? 0)}
                      <span className="text-xs font-normal text-muted">/mo</span>
                    </p>
                  </div>
                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => handleRemove(property._id)}
                    disabled={removingId === property._id}
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-100 py-2 text-xs font-medium text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    {removingId === property._id ? (
                      <span className="h-3 w-3 animate-spin rounded-full border border-red-300 border-t-red-500" />
                    ) : (
                      <FiTrash2 className="h-3.5 w-3.5" />
                    )}
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
