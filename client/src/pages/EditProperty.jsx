import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  FiHome, FiMapPin, FiDollarSign, FiList,
  FiImage, FiCheck, FiArrowLeft,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import Loader from '../components/Loader';
import LocationPicker from '../components/LocationPicker';
import { fetchPropertyById, updateProperty } from '../services/propertyService';
import { geoJsonToLatLng } from '../services/mapsService';

const PROPERTY_TYPES = [
  { value: 'apartment', label: '🏢 Apartment' },
  { value: 'house',     label: '🏡 House' },
  { value: 'villa',     label: '🏖️ Villa' },
  { value: 'studio',    label: '🛏️ Studio' },
  { value: 'pg',        label: '🏠 PG' },
  { value: 'commercial',label: '🏪 Commercial' },
];

const AMENITIES_LIST = [
  { value: 'wifi',         label: '📶 WiFi' },
  { value: 'parking',      label: '🅿️ Parking' },
  { value: 'furnished',    label: '🪑 Furnished' },
  { value: 'ac',           label: '❄️ AC' },
  { value: 'gym',          label: '💪 Gym' },
  { value: 'pool',         label: '🏊 Pool' },
  { value: 'security',     label: '🔒 Security' },
  { value: 'lift',         label: '🛗 Lift' },
  { value: 'power_backup', label: '⚡ Power Backup' },
  { value: 'garden',       label: '🌿 Garden' },
];

const SectionTitle = ({ icon: Icon, title }) => (
  <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
    <Icon className="h-5 w-5 text-primary" />
    <h2 className="font-semibold text-secondary">{title}</h2>
  </div>
);

const Field = ({ label, id, error, children }) => (
  <div>
    <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-secondary">
      {label}
    </label>
    {children}
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
);

const inputCls =
  'w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20';

const EditProperty = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm]         = useState(null);
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [coords, setCoords]     = useState(null);
  const [fetchError, setFetchError] = useState('');

  // Load existing property data
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const property = await fetchPropertyById(id);
        setForm({
          title:        property.title       || '',
          description:  property.description || '',
          type:         property.type        || 'apartment',
          price:        property.price       || '',
          street:       property.address?.street  || '',
          city:         property.address?.city    || '',
          state:        property.address?.state   || '',
          country:      property.address?.country || 'India',
          zipCode:      property.address?.zipCode || '',
          bedrooms:     property.bedrooms  ?? '',
          bathrooms:    property.bathrooms ?? '',
          amenities:    property.amenities || [],
          imageUrls:    (property.images || []).join(', '),
          availability: property.availability !== false,
        });
        // Pre-populate coords from existing GeoJSON
        const existing = geoJsonToLatLng(property.location?.coordinates);
        if (existing) setCoords(existing);
      } catch {
        setFetchError('Failed to load property. You may not have permission to edit it.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const toggleAmenity = (val) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(val)
        ? prev.amenities.filter((a) => a !== val)
        : [...prev.amenities, val],
    }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim())            e.title       = 'Title is required';
    if (!form.description.trim())      e.description = 'Description is required';
    if (!form.price || form.price <= 0) e.price      = 'Valid price is required';
    if (!form.city.trim())             e.city        = 'City is required';
    if (!form.state.trim())            e.state       = 'State is required';
    if (form.bedrooms === '')          e.bedrooms    = 'Bedrooms is required';
    if (form.bathrooms === '')         e.bathrooms   = 'Bathrooms is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      toast.error('Please fix the highlighted errors');
      return;
    }

    const images = form.imageUrls
      ? form.imageUrls.split(',').map((u) => u.trim()).filter(Boolean)
      : [];

    const payload = {
      title:       form.title.trim(),
      description: form.description.trim(),
      type:        form.type,
      price:       Number(form.price),
      address: {
        street:  form.street.trim(),
        city:    form.city.trim(),
        state:   form.state.trim(),
        country: form.country.trim(),
        zipCode: form.zipCode.trim(),
      },
      bedrooms:     Number(form.bedrooms),
      bathrooms:    Number(form.bathrooms),
      amenities:    form.amenities,
      images,
      availability: form.availability,
      ...(coords && {
        location: { type: 'Point', coordinates: [coords.lng, coords.lat] },
      }),
    };

    setSaving(true);
    try {
      await updateProperty(id, payload);
      toast.success('Property updated successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Failed to update property');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <span className="text-4xl">🚫</span>
        <p className="mt-4 font-medium text-secondary">{fetchError}</p>
        <Link
          to="/dashboard"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  const addressHint = [form.street, form.city, form.state, form.country].filter(Boolean).join(', ');

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-4">
        <Link
          to="/dashboard"
          className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-primary"
        >
          <FiArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
        <span className="text-muted">/</span>
        <h1 className="text-2xl font-bold text-secondary">Edit property</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* Basic Information */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <SectionTitle icon={FiHome} title="Basic information" />
          <div className="space-y-5">
            <Field label="Property title *" id="title" error={errors.title}>
              <input id="title" name="title" type="text" maxLength={150}
                value={form.title} onChange={handleChange} className={inputCls} />
            </Field>
            <Field label="Description *" id="description" error={errors.description}>
              <textarea id="description" name="description" rows={4} maxLength={2000}
                value={form.description} onChange={handleChange} className={`${inputCls} resize-none`} />
              <p className="mt-1 text-right text-xs text-muted">{form.description.length}/2000</p>
            </Field>
            <div>
              <label className="mb-2 block text-sm font-medium text-secondary">Property type *</label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {PROPERTY_TYPES.map((t) => (
                  <label
                    key={t.value}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition ${
                      form.type === t.value
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 text-secondary hover:bg-gray-50'
                    }`}
                  >
                    <input type="radio" name="type" value={t.value}
                      checked={form.type === t.value} onChange={handleChange} className="sr-only" />
                    {t.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Pricing & Rooms */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <SectionTitle icon={FiDollarSign} title="Pricing & rooms" />
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Price / month (₹) *" id="price" error={errors.price}>
              <input id="price" name="price" type="number" min="0"
                value={form.price} onChange={handleChange} className={inputCls} />
            </Field>
            <Field label="Bedrooms *" id="bedrooms" error={errors.bedrooms}>
              <input id="bedrooms" name="bedrooms" type="number" min="0"
                value={form.bedrooms} onChange={handleChange} className={inputCls} />
            </Field>
            <Field label="Bathrooms *" id="bathrooms" error={errors.bathrooms}>
              <input id="bathrooms" name="bathrooms" type="number" min="0"
                value={form.bathrooms} onChange={handleChange} className={inputCls} />
            </Field>
          </div>
          <label className="mt-5 flex cursor-pointer items-center gap-3">
            <div className="relative">
              <input type="checkbox" name="availability" checked={form.availability}
                onChange={handleChange} className="sr-only" />
              <div className={`h-6 w-11 rounded-full transition ${form.availability ? 'bg-primary' : 'bg-gray-300'}`} />
              <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${form.availability ? 'left-[22px]' : 'left-0.5'}`} />
            </div>
            <span className="text-sm font-medium text-secondary">Available for rent</span>
          </label>
        </section>

        {/* Address */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <SectionTitle icon={FiMapPin} title="Address" />
          <div className="space-y-4">
            <Field label="Street / area" id="street">
              <input id="street" name="street" type="text"
                value={form.street} onChange={handleChange} className={inputCls} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="City *" id="city" error={errors.city}>
                <input id="city" name="city" type="text"
                  value={form.city} onChange={handleChange} className={inputCls} />
              </Field>
              <Field label="State *" id="state" error={errors.state}>
                <input id="state" name="state" type="text"
                  value={form.state} onChange={handleChange} className={inputCls} />
              </Field>
              <Field label="Country" id="country">
                <input id="country" name="country" type="text"
                  value={form.country} onChange={handleChange} className={inputCls} />
              </Field>
              <Field label="ZIP / Pin code" id="zipCode">
                <input id="zipCode" name="zipCode" type="text"
                  value={form.zipCode} onChange={handleChange} className={inputCls} />
              </Field>
            </div>
          </div>
        </section>

        {/* Location picker */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <SectionTitle icon={FiMapPin} title="Pin location on map" />
          <p className="mb-4 text-xs text-muted">
            Update the property marker by clicking the map, dragging, or searching an address.
          </p>
          <LocationPicker coords={coords} onChange={setCoords} addressHint={addressHint} />
          {coords && (
            <p className="mt-2 text-xs text-green-600">
              ✓ Location: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
            </p>
          )}
        </section>

        {/* Amenities */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <SectionTitle icon={FiList} title="Amenities" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {AMENITIES_LIST.map((a) => {
              const active = form.amenities.includes(a.value);
              return (
                <button
                  key={a.value} type="button" onClick={() => toggleAmenity(a.value)}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition ${
                    active ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-secondary hover:bg-gray-50'
                  }`}
                >
                  {active && <FiCheck className="h-4 w-4 shrink-0" />}
                  {a.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Images */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <SectionTitle icon={FiImage} title="Images" />
          <Field label="Image URLs (comma-separated)" id="imageUrls">
            <textarea id="imageUrls" name="imageUrls" rows={3}
              placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg"
              value={form.imageUrls} onChange={handleChange}
              className={`${inputCls} resize-none`} />
          </Field>
        </section>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            type="submit" disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark disabled:opacity-60"
          >
            {saving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <button
            type="button" onClick={() => navigate(-1)}
            className="rounded-xl border border-gray-200 px-6 py-3 text-sm font-medium text-secondary transition hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>

      </form>
    </div>
  );
};

export default EditProperty;
