import { useCallback } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import {
  MAPS_API_KEY, MAPS_LIBRARIES, DETAIL_ZOOM,
  DEFAULT_CENTER, DEFAULT_ZOOM,
} from '../services/mapsService';

const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' };

const MAP_OPTIONS = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  clickableIcons: false,
};

/**
 * Read-only map that shows a single property marker.
 *
 * Props:
 *   lat        {number}  — property latitude
 *   lng        {number}  — property longitude
 *   title      {string}  — marker title tooltip
 *   zoom       {number}  — optional zoom override
 *   className  {string}  — container class (default h-72)
 */
const PropertyMap = ({ lat, lng, title = 'Property', zoom, className = 'h-72 w-full' }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: MAPS_API_KEY,
    libraries: MAPS_LIBRARIES,
  });

  const hasCoords = lat != null && lng != null && !(lat === 0 && lng === 0);
  const center    = hasCoords ? { lat, lng } : DEFAULT_CENTER;
  const mapZoom   = zoom ?? (hasCoords ? DETAIL_ZOOM : DEFAULT_ZOOM);

  const onLoad = useCallback(() => {}, []);

  if (!MAPS_API_KEY) {
    return (
      <div className={`${className} flex items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50`}>
        <div className="text-center px-4">
          <span className="text-3xl">🗺️</span>
          <p className="mt-2 text-sm font-medium text-secondary">Map unavailable</p>
          <p className="mt-1 text-xs text-muted">Add VITE_GOOGLE_MAPS_API_KEY to client/.env</p>
        </div>
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
      <div className={`${className} flex items-center justify-center rounded-2xl bg-gray-100 animate-pulse`}>
        <span className="text-sm text-muted">Loading map…</span>
      </div>
    );
  }

  return (
    <div className={`${className} overflow-hidden rounded-2xl`}>
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={center}
        zoom={mapZoom}
        options={MAP_OPTIONS}
        onLoad={onLoad}
      >
        {hasCoords && <Marker position={{ lat, lng }} title={title} />}
      </GoogleMap>
    </div>
  );
};

export default PropertyMap;
