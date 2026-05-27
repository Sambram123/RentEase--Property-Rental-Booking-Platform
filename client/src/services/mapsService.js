// ─── Google Maps API key ──────────────────────────────────────────────────────
export const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Libraries loaded once for the whole app
export const MAPS_LIBRARIES = ['places'];

// Default center — India
export const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 };
export const DEFAULT_ZOOM   = 5;
export const DETAIL_ZOOM    = 15;

/**
 * Geocode an address string → { lat, lng } using the browser Geocoder.
 * Requires Maps JS API to already be loaded.
 */
export const geocodeAddress = (address) =>
  new Promise((resolve, reject) => {
    if (!window.google?.maps) {
      reject(new Error('Google Maps not loaded'));
      return;
    }
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const { lat, lng } = results[0].geometry.location;
        resolve({ lat: lat(), lng: lng() });
      } else {
        reject(new Error(`Geocoding failed: ${status}`));
      }
    });
  });

/**
 * Reverse-geocode a { lat, lng } → formatted address string.
 */
export const reverseGeocode = (latLng) =>
  new Promise((resolve, reject) => {
    if (!window.google?.maps) {
      reject(new Error('Google Maps not loaded'));
      return;
    }
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: latLng }, (results, status) => {
      if (status === 'OK' && results[0]) {
        resolve(results[0].formatted_address);
      } else {
        reject(new Error(`Reverse geocode failed: ${status}`));
      }
    });
  });

/**
 * Convert GeoJSON coordinates [lng, lat] → { lat, lng } for Google Maps.
 */
export const geoJsonToLatLng = (coordinates) => {
  if (!Array.isArray(coordinates) || coordinates.length < 2) return null;
  const [lng, lat] = coordinates;
  if (lat === 0 && lng === 0) return null;
  return { lat, lng };
};

/**
 * Convert { lat, lng } → GeoJSON coordinates array [lng, lat].
 */
export const latLngToGeoJson = ({ lat, lng }) => [lng, lat];
