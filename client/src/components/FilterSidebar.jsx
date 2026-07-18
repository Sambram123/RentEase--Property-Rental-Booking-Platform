import { FiSettings, FiX } from 'react-icons/fi';

const PROPERTY_TYPES = [
  { value: '', label: 'All types' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'villa', label: 'Villa' },
  { value: 'studio', label: 'Studio' },
  { value: 'pg', label: 'PG' },
  { value: 'commercial', label: 'Commercial' },
];

const AMENITIES = [
  'wifi', 'parking', 'furnished', 'ac', 'gym',
  'pool', 'security', 'lift', 'power_backup', 'garden',
];

export const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest first' },
  { value: 'price_asc',  label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'rating',     label: 'Highest rated' },
];

const clsInput =
  'w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';

const FilterSidebar = ({
  filters,
  setFilters,
  onApply,
  onReset,
  open,
  onClose,
  sort,
  onSortChange,
}) => {
  const toggleAmenity = (item) => {
    setFilters((prev) => {
      const list = prev.amenities || [];
      return {
        ...prev,
        amenities: list.includes(item)
          ? list.filter((a) => a !== item)
          : [...list, item],
      };
    });
  };

  const shell = 'rounded-2xl border border-gray-100 bg-white p-4 shadow-sm';
  const content = (
    <div className={shell}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold text-secondary">
          <FiSettings className="h-4 w-4 text-primary" /> Refine Search
        </h3>
        <button type="button" onClick={onClose} className="md:hidden rounded p-1 hover:bg-gray-100">
          <FiX className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4">

        {/* Sort — moved from toolbar */}
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Sort by</label>
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
            className={clsInput}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Type</label>
          <select
            value={filters.type}
            onChange={(e) => setFilters((p) => ({ ...p, type: e.target.value }))}
            className={clsInput}
          >
            {PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Min price</label>
            <input
              type="number"
              min="0"
              value={filters.minPrice}
              onChange={(e) => setFilters((p) => ({ ...p, minPrice: e.target.value }))}
              className={clsInput}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Max price</label>
            <input
              type="number"
              min="0"
              value={filters.maxPrice}
              onChange={(e) => setFilters((p) => ({ ...p, maxPrice: e.target.value }))}
              className={clsInput}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Bedrooms</label>
            <input
              type="number"
              min="0"
              value={filters.bedrooms}
              onChange={(e) => setFilters((p) => ({ ...p, bedrooms: e.target.value }))}
              className={clsInput}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Bathrooms</label>
            <input
              type="number"
              min="0"
              value={filters.bathrooms}
              onChange={(e) => setFilters((p) => ({ ...p, bathrooms: e.target.value }))}
              className={clsInput}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Availability</label>
          <select
            value={filters.availability}
            onChange={(e) => setFilters((p) => ({ ...p, availability: e.target.value }))}
            className={clsInput}
          >
            <option value="true">Available only</option>
            <option value="false">Unavailable only</option>
            <option value="all">All</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium text-muted">Amenities</label>
          <div className="flex flex-wrap gap-2">
            {AMENITIES.map((a) => {
              const active = filters.amenities.includes(a);
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAmenity(a)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    active
                      ? 'bg-primary text-white'
                      : 'border border-gray-200 bg-white text-secondary hover:bg-gray-50'
                  }`}
                >
                  {a}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <button type="button" onClick={onApply} className="flex-1 rounded-xl bg-primary py-2 text-sm font-semibold text-white">
          Apply
        </button>
        <button type="button" onClick={onReset} className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-secondary">
          Reset
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden md:block">{content}</div>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/30 p-4 md:hidden" onClick={onClose}>
          <div className="mx-auto mt-8 max-w-md" onClick={(e) => e.stopPropagation()}>
            {content}
          </div>
        </div>
      )}
    </>
  );
};

export default FilterSidebar;
