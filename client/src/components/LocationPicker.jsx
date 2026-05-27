import { useState, useCallback, useRef } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { FiMapPin, FiSearch } from 'react-icons/fi';
import toast from 'react-hot-toast';
import {
  MAPS_API_KEY, MAPS_LIBRARIES,
  DEFAULT_CENTER, DEFAULT_ZOOM, DETAIL_ZOOM,
  geocodeAddress, geoJsonToLatLng,
} from '../services/mapsService';

const MAP_CONTAINER_STYLE = { width: '100%', height: '340px' };

const MAP_OPTIONS = {
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  clickableIcons: false,
};

/**
 * Interactive map picker for selecting a property location.
 *
 * Props:
 *   coords      {{ lat, lng } | null}  current coords
 *   onChange    (coords: { lat, lng }) => void
 *   addressHint string — pre-filled search hint (city/address from form)
 */
const LocationPicker = ({ coords, onChange, addressHint = '' }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: MAPS_API_KEY,
    libraries: MAPS_LIBRARIES,
  });

  const mapRef = useRef(null);
  const [markerPos, setMarkerPos]   = useState(coords || null);
  const [searchText, setSearchText] = useState(addressHint);
  const [searching, setSearching]   = useState(false);

  const center  = markerPos || DEFAULT_CENTER;
  const mapZoom = markerPos ? DETAIL_ZOOM : DEFAULT_ZOOM;

  const onMapLoad = useCallback((map) => { mapRef.current = map; }, []);

  const handleMapClick = useCallback((e) => {
    const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    setMarkerPos(pos);
    onChange(pos);
  }, [onChange]);

  const handleMarkerDrag = useCallback((e) => {
    const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    setMarkerPos(pos);
    onChange(pos);
  }, [onChange]);

  const handleGeocode = async (e) => {
    e.preventDefault();
    if (!searchText.trim()) return;
    setSearching(true);
    try {
      const pos = await geocodeAddress(searchText.trim());
      setMarkerPos(pos);
      onChange(pos);
      mapRef.current?.panTo(pos);
      mapRef.current?.setZoom(DETAIL_ZOOM);
    } catch {
      toast.error('Address not found — try a more specific location');
    } finally {
      setSearching(false);
    }
  };

  if (!MAPS_API_KEY) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
        <span className="text-3xl">🗺️</span>
        <p className="mt-2 text-sm font-medium text-secondary">Map unavailable</p>
        <p className="mt-1 text-xs text-muted">Add your Google Maps API key to enable location picking</p>
        {coords && (
          <p className="mt-3 font-mono text-xs text-primary">
            Saved: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </p>
        )}
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-red-100 bg-red-50 p-6">
        <p className="text-sm text-red-500">Failed to load Google Maps — check your API key</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-[340px] items-center justify-center rounded-2xl bg-gray-100 animate-pulse">
        <span className="text-sm text-muted">Loading map…</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <form onSubmit={handleGeocode} className="flex gap-2">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search address or city to place marker…"
            className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <button
          type="submit"
          disabled={searching || !searchText.trim()}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 hover:bg-primary-dark"
        >
          {searching
            ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            : <FiSearch className="h-4 w-4" />}
          Find
        </button>
      </form>

      {/* Map */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
        <GoogleMap
          mapContainerStyle={MAP_CONTAINER_STYLE}
          center={center}
          zoom={mapZoom}
          options={MAP_OPTIONS}
          onLoad={onMapLoad}
          onClick={handleMapClick}
        >
          {markerPos && (
            <Marker
              position={markerPos}
              draggable
              onDragEnd={handleMarkerDrag}
              title="Property location — drag to adjust"
            />
          )}
        </GoogleMap>
      </div>

      {/* Instruction / coordinate display */}
      <div className="flex items-center justify-between text-xs text-muted">
        <span className="flex items-center gap-1">
          <FiMapPin className="h-3 w-3 text-primary" />
          {markerPos ? 'Drag the marker to fine-tune location' : 'Click on the map or search an address to place a marker'}
        </span>
        {markerPos && (
          <span className="font-mono">
            {markerPos.lat.toFixed(5)}, {markerPos.lng.toFixed(5)}
          </span>
        )}
      </div>
    </div>
  );
};

export default LocationPicker;
