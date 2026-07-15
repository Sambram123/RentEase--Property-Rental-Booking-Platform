import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiHome, FiMapPin, FiDollarSign, FiList,
  FiImage, FiCheck,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { createProperty } from '../services/propertyService';
import LocationPicker from '../components/LocationPicker';
import ImageUploader from '../components/ImageUploader';

// ─── Config ───────────────────────────────────────────────────────────────────
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

const INITIAL_FORM = {
  title: '',
  description: '',
  type: 'apartment',
  price: '',
  street: '',
  city: '',
  state: '',
  country: 'India',
  zipCode: '',
  bedrooms: '',
  bathrooms: '',
  amenities: [],
  availability: true,
  cancellationPolicy: 'moderate',
};

// ─── Section header ──────────────────────────────────────────────────────────
const SectionTitle = ({ icon: Icon, title }) => (
  <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
    <Icon className="h-5 w-5 text-primary" />
    <h2 className="font-semibold text-secondary">{title}</h2>
  </div>
);

// ─── Input wrapper ────────────────────────────────────────────────────────────
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

// ─── Component ────────────────────────────────────────────────────────────────
const AddProperty = () => {
  const navigate = useNavigate();
  const [form, setForm]       = useState(INITIAL_FORM);
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [coords, setCoords]   = useState(null);

  // Image state — managed by ImageUploader
  const [newFiles, setNewFiles] = useState([]); // File[]

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

  // ── Client-side validation ────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.title.trim())          e.title       = 'Title is required';
    if (!form.description.trim())    e.description = 'Description is required';
    if (!form.price || form.price <= 0) e.price    = 'Valid price is required';
    if (!form.city.trim())           e.city        = 'City is required';
    if (!form.state.trim())          e.state       = 'State is required';
    if (form.bedrooms === '')        e.bedrooms    = 'Bedrooms is required';
    if (form.bathrooms === '')       e.bathrooms   = 'Bathrooms is required';
    if (newFiles.length === 0)       e.images      = 'At least one property image is required';
    return e;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      toast.error('Please fix the highlighted errors');
      return;
    }

    // Build multipart FormData
    const formData = new FormData();
    formData.append('title',              form.title.trim());
    formData.append('description',        form.description.trim());
    formData.append('type',               form.type);
    formData.append('price',              Number(form.price));
    formData.append('bedrooms',           Number(form.bedrooms));
    formData.append('bathrooms',          Number(form.bathrooms));
    formData.append('availability',       form.availability);
    formData.append('cancellationPolicy', form.cancellationPolicy);
    formData.append('address', JSON.stringify({
      street:  form.street.trim(),
      city:    form.city.trim(),
      state:   form.state.trim(),
      country: form.country.trim(),
      zipCode: form.zipCode.trim(),
    }));
    formData.append('amenities', JSON.stringify(form.amenities));
    if (coords) {
      formData.append('location', JSON.stringify({
        type: 'Point',
        coordinates: [coords.lng, coords.lat],
      }));
    }
    // Append image files
    newFiles.forEach((file) => formData.append('images', file));

    setLoading(true);
    try {
      await createProperty(formData);
      toast.success('Property listed successfully! 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Failed to create property');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary">List a property</h1>
        <p className="mt-1 text-sm text-muted">
          Fill in the details below to add your property to RentEase.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* ── Basic Information ──────────────────────────────────────────── */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <SectionTitle icon={FiHome} title="Basic information" />
          <div className="space-y-5">

            <Field label="Property title *" id="title" error={errors.title}>
              <input
                id="title"
                name="title"
                type="text"
                placeholder="e.g. Spacious 2BHK near Metro"
                value={form.title}
                onChange={handleChange}
                className={inputCls}
                maxLength={150}
              />
            </Field>

            <Field label="Description *" id="description" error={errors.description}>
              <textarea
                id="description"
                name="description"
                rows={4}
                placeholder="Describe the property, nearby landmarks, highlights…"
                value={form.description}
                onChange={handleChange}
                className={`${inputCls} resize-none`}
                maxLength={2000}
              />
              <p className="mt-1 text-right text-xs text-muted">
                {form.description.length}/2000
              </p>
            </Field>

            {/* Type */}
            <div>
              <label className="mb-2 block text-sm font-medium text-secondary">
                Property type *
              </label>
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
                    <input
                      type="radio"
                      name="type"
                      value={t.value}
                      checked={form.type === t.value}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    {t.label}
                  </label>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* ── Pricing & Rooms ────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <SectionTitle icon={FiDollarSign} title="Pricing & rooms" />
          <div className="grid gap-5 sm:grid-cols-3">

            <Field label="Price / month (₹) *" id="price" error={errors.price}>
              <input
                id="price"
                name="price"
                type="number"
                min="0"
                placeholder="e.g. 25000"
                value={form.price}
                onChange={handleChange}
                className={inputCls}
              />
            </Field>

            <Field label="Bedrooms *" id="bedrooms" error={errors.bedrooms}>
              <input
                id="bedrooms"
                name="bedrooms"
                type="number"
                min="0"
                placeholder="2"
                value={form.bedrooms}
                onChange={handleChange}
                className={inputCls}
              />
            </Field>

            <Field label="Bathrooms *" id="bathrooms" error={errors.bathrooms}>
              <input
                id="bathrooms"
                name="bathrooms"
                type="number"
                min="0"
                placeholder="1"
                value={form.bathrooms}
                onChange={handleChange}
                className={inputCls}
              />
            </Field>

          </div>

          {/* Availability toggle */}
          <label className="mt-5 flex cursor-pointer items-center gap-3">
            <div className="relative">
              <input
                type="checkbox"
                name="availability"
                checked={form.availability}
                onChange={handleChange}
                className="sr-only"
              />
              <div
                className={`h-6 w-11 rounded-full transition ${
                  form.availability ? 'bg-primary' : 'bg-gray-300'
                }`}
              />
              <div
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                  form.availability ? 'left-[22px]' : 'left-0.5'
                }`}
              />
            </div>
            <span className="text-sm font-medium text-secondary">
              Available for rent
            </span>
          </label>

          {/* Cancellation Policy */}
          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium text-secondary">
              Cancellation policy
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'flexible', label: '🟢 Flexible', desc: 'Full refund ≥7 days' },
                { value: 'moderate', label: '🟡 Moderate', desc: 'Partial refund ≥14 days' },
                { value: 'strict',   label: '🔴 Strict',   desc: '50% refund ≥30 days' },
              ].map((p) => (
                <label
                  key={p.value}
                  className={`cursor-pointer rounded-xl border p-3 text-center transition ${
                    form.cancellationPolicy === p.value
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="cancellationPolicy"
                    value={p.value}
                    checked={form.cancellationPolicy === p.value}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <p className="text-sm font-semibold text-secondary">{p.label}</p>
                  <p className="mt-0.5 text-xs text-muted">{p.desc}</p>
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* ── Address ───────────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <SectionTitle icon={FiMapPin} title="Address" />
          <div className="space-y-4">

            <Field label="Street / area" id="street">
              <input
                id="street"
                name="street"
                type="text"
                placeholder="e.g. 12, Park Street"
                value={form.street}
                onChange={handleChange}
                className={inputCls}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="City *" id="city" error={errors.city}>
                <input
                  id="city"
                  name="city"
                  type="text"
                  placeholder="Bangalore"
                  value={form.city}
                  onChange={handleChange}
                  className={inputCls}
                />
              </Field>

              <Field label="State *" id="state" error={errors.state}>
                <input
                  id="state"
                  name="state"
                  type="text"
                  placeholder="Karnataka"
                  value={form.state}
                  onChange={handleChange}
                  className={inputCls}
                />
              </Field>

              <Field label="Country" id="country">
                <input
                  id="country"
                  name="country"
                  type="text"
                  placeholder="India"
                  value={form.country}
                  onChange={handleChange}
                  className={inputCls}
                />
              </Field>

              <Field label="ZIP / Pin code" id="zipCode">
                <input
                  id="zipCode"
                  name="zipCode"
                  type="text"
                  placeholder="560001"
                  value={form.zipCode}
                  onChange={handleChange}
                  className={inputCls}
                />
              </Field>
            </div>

          </div>
        </section>

        {/* ── Amenities ─────────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <SectionTitle icon={FiList} title="Amenities" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {AMENITIES_LIST.map((a) => {
              const active = form.amenities.includes(a.value);
              return (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => toggleAmenity(a.value)}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition ${
                    active
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-200 text-secondary hover:bg-gray-50'
                  }`}
                >
                  {active && <FiCheck className="h-4 w-4 shrink-0" />}
                  {a.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Location picker ───────────────────────────────────────────── */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <SectionTitle icon={FiMapPin} title="Pin location on map (optional)" />
          <p className="mb-4 text-xs text-muted">
            Click on the map or search an address to mark the exact property location. This enables map views on the listing.
          </p>
          <LocationPicker
            coords={coords}
            onChange={setCoords}
            addressHint={[form.street, form.city, form.state, form.country].filter(Boolean).join(', ')}
          />
          {coords && (
            <p className="mt-2 text-xs text-green-600">
              ✓ Location pinned: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
            </p>
          )}
        </section>

        {/* ── Images ────────────────────────────────────────────────────── */}
        <section className={`rounded-2xl border bg-white p-6 shadow-sm ${errors.images ? 'border-red-200' : 'border-gray-100'}`}>
          <SectionTitle icon={FiImage} title="Property photos *" />
          <p className="mb-4 text-xs text-muted">
            Upload high-quality photos of your property. The first image will be used as the cover photo.
          </p>
          <ImageUploader
            newFiles={newFiles}
            onNewFilesChange={(files) => {
              setNewFiles(files);
              setErrors((prev) => ({ ...prev, images: '' }));
            }}
            error={errors.images}
          />
        </section>

        {/* ── Submit ────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            id="list-property-btn"
            className="flex items-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark disabled:opacity-60"
          >
            {loading && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            {loading ? 'Uploading & listing…' : 'List property'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-xl border border-gray-200 px-6 py-3 text-sm font-medium text-secondary transition hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>

      </form>
    </div>
  );
};

export default AddProperty;
