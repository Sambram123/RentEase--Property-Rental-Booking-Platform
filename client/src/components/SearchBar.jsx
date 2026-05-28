import { useEffect, useState } from 'react';
import { FiSearch, FiMapPin, FiX } from 'react-icons/fi';

const SearchBar = ({
  value = '',
  locationValue = '',
  onSearchChange,
  onLocationChange,
  onSubmit,
  debounceMs = 400,
}) => {
  const [search, setSearch] = useState(value);
  const [location, setLocation] = useState(locationValue);

  useEffect(() => { setSearch(value); }, [value]);
  useEffect(() => { setLocation(locationValue); }, [locationValue]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange?.(search);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [search, debounceMs, onSearchChange]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onLocationChange?.(location);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [location, debounceMs, onLocationChange]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
      className="grid gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:grid-cols-[1fr_1fr_auto]"
    >
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title, description, city..."
          className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-8 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:bg-gray-100"
          >
            <FiX className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="relative">
        <FiMapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="City / State / Country"
          className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-8 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        {location && (
          <button
            type="button"
            onClick={() => setLocation('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:bg-gray-100"
          >
            <FiX className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <button
        type="submit"
        className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
      >
        Search
      </button>
    </form>
  );
};

export default SearchBar;
