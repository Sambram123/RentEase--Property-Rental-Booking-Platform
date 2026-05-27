import { useState, useCallback } from 'react';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api';
import { Link } from 'react-router-dom';
import {
  MAPS_API_KEY, MAPS_LIBRARIES, DEFAULT_CENTER, DEFAULT_ZOOM,
  geoJsonToLatLng,
} from '../services/mapsService';
import { formatPrice } from '../utils/constants';

const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' };
const MAP_OPTIONS = {
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  clickableIcons: false,
};

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=300&q=60';

/**
 * Full-width map that plots all properties that have coordinates.
 * Clicking a marker opens an InfoWindow preview linking to the listing.
 *
 * Props:
 *   properties  {array}  full property list
 *   className   {string} container class (default h-[520px])
 */
const PropertiesMapView = ({ properties = [], className = 'h-[520px] w-full' }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: MAPS_API_KEY,
    libraries: MAPS_LIBRARIES,
  });

  const [activeId, setActiveId] = useState(null);

  const onMapLoad = useCallback(() => {}, []);

  // Only properties that have real coordinates
  const mapped = properties.filter((p) => {
    const c = geoJsonToLatLng(p.location?.coordinates);
    return c !== null;
  });

  if (!MAPS_API_KEY) {
    return (
      <div className={`${className} flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50`}>
        <span className="text-4xl">🗺️</span>
        <p className="mt-3 font-medium text-secondary">Map unavailable</p>
        <p className="mt-1 text-sm text-muted">Add VITE_GOOGLE_MAPS_API_KEY to enable property map</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={`${className} flex items-center justify-center rounded-2xl border border-red-100 bg-red-50`}>
        <p className="text-sm text-red-500">Failed to load Google Maps</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`${className} animate-pulse rounded-2xl bg-gray-100 flex items-center justify-center`}>
        <span className="text-sm text-muted">Loading map…</span>
      </div>
    );
  }

  const activeProperty = mapped.find((p) => (p._id || p.id) === activeId);

  return (
    <div className={`${className} overflow-hidden rounded-2xl border border-gray-200 shadow-sm`}>
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        options={MAP_OPTIONS}
        onLoad={onMapLoad}
        onClick={() => setActiveId(null)}
      >
        {mapped.map((p) => {
          const coords = geoJsonToLatLng(p.location.coordinates);
          const id = p._id || p.id;
          return (
            <Marker
              key={id}
              position={coords}
              title={p.title}
              onClick={() => setActiveId(id)}
            />
          );
        })}

        {activeProperty && (() => {
          const coords = geoJsonToLatLng(activeProperty.location.coordinates);
          const img = (Array.isArray(activeProperty.images) && activeProperty.images[0]) || PLACEHOLDER;
          const id  = activeProperty._id || activeProperty.id;
          return (
            <InfoWindow
              position={coords}
              onCloseClick={() => setActiveId(null)}
            >
              <div className="max-w-[220px]">
                <img
                  src={img}
                  alt={activeProperty.title}
                  className="h-28 w-full rounded-lg object-cover"
                  onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
                />
                <div className="mt-2">
                  <p className="line-clamp-1 font-semibold text-secondary text-sm">
                    {activeProperty.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted capitalize">
                    {activeProperty.city || activeProperty.address?.city || ''} · {activeProperty.type}
                  </p>
                  <p className="mt-1 font-bold text-primary text-sm">
                    {formatPrice(activeProperty.price)}<span className="text-xs font-normal text-muted">/mo</span>
                  </p>
                  <Link
                    to={`/properties/${id}`}
                    className="mt-2 block rounded-lg bg-primary px-3 py-1.5 text-center text-xs font-semibold text-white hover:bg-primary-dark"
                  >
                    View listing →
                  </Link>
                </div>
              </div>
            </InfoWindow>
          );
        })()}
      </GoogleMap>

      {mapped.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80">
          <div className="text-center">
            <span className="text-3xl">📍</span>
            <p className="mt-2 text-sm font-medium text-secondary">No pinned locations yet</p>
            <p className="text-xs text-muted">Properties need coordinates to appear on the map</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertiesMapView;
