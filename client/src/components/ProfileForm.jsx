import { useState } from 'react';
import { FiRefreshCw, FiRotateCcw, FiLoader } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { updateAvatar, resetAvatar } from '../services/userService';
import { AVATAR_STYLES, getDiceBearUrl, getUserAvatar } from '../utils/avatar';

const Field = ({ label, id, error, children }) => (
  <div>
    <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-secondary">{label}</label>
    {children}
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
);

const inputClass = (error) =>
  `w-full rounded-xl border px-4 py-2.5 text-sm text-secondary outline-none transition focus:ring-2 focus:ring-primary/20 ${
    error ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-primary'
  }`;

const ProfileForm = ({ profile, onSave, saving = false }) => {
  const [form, setForm] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    bio: profile?.bio || '',
    city: profile?.city || '',
    state: profile?.state || '',
  });
  const [errors, setErrors] = useState({});
  const [avatar, setAvatar] = useState(getUserAvatar(profile));
  const [selectedStyle, setSelectedStyle] = useState(profile?.avatarStyle || 'avataaars');
  const [avatarLoading, setAvatarLoading] = useState(false);

  const previewSeed = profile?.avatarSeed || profile?.email || profile?._id || 'preview';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Valid email is required';
    if (form.bio.length > 500) e.bio = 'Bio cannot exceed 500 characters';
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
    await onSave(form);
  };

  const handleStyleSelect = async (style) => {
    setSelectedStyle(style);
    setAvatarLoading(true);
    try {
      const result = await updateAvatar({ style });
      setAvatar(result.user.avatar);
      toast.success('Avatar style updated');
      if (onSave) onSave(form, result.user, false);
    } catch (err) {
      toast.error(err.message || 'Failed to update avatar');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleRegenerate = async () => {
    setAvatarLoading(true);
    try {
      const result = await updateAvatar({ style: selectedStyle, regenerate: true });
      setAvatar(result.user.avatar);
      toast.success('New avatar generated');
      if (onSave) onSave(form, result.user, false);
    } catch (err) {
      toast.error(err.message || 'Failed to regenerate avatar');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleReset = async () => {
    setAvatarLoading(true);
    try {
      const result = await resetAvatar();
      setAvatar(result.user.avatar);
      setSelectedStyle(result.user.avatarStyle || 'avataaars');
      toast.success('Avatar reset to default');
      if (onSave) onSave(form, result.user, false);
    } catch (err) {
      toast.error(err.message || 'Failed to reset avatar');
    } finally {
      setAvatarLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar section */}
      <div>
        <p className="mb-3 text-sm font-medium text-secondary">Avatar</p>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="relative shrink-0">
            <img
              src={avatar}
              alt="Avatar"
              className="h-24 w-24 rounded-full object-cover ring-4 ring-primary/10"
            />
            {avatarLoading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                <FiLoader className="h-6 w-6 animate-spin text-white" />
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={avatarLoading}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-dark disabled:opacity-50"
            >
              <FiRefreshCw className="h-4 w-4" /> Regenerate
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={avatarLoading}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-secondary transition hover:bg-gray-50 disabled:opacity-50"
            >
              <FiRotateCcw className="h-4 w-4" /> Reset
            </button>
          </div>
        </div>

        <p className="mt-4 mb-2 text-xs font-medium uppercase tracking-wide text-muted">Choose a style</p>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
          {AVATAR_STYLES.map((style) => (
            <button
              key={style}
              type="button"
              onClick={() => handleStyleSelect(style)}
              disabled={avatarLoading}
              className={`overflow-hidden rounded-xl border-2 p-1 transition disabled:opacity-50 ${
                selectedStyle === style ? 'border-primary ring-2 ring-primary/20' : 'border-gray-100 hover:border-gray-200'
              }`}
              title={style}
            >
              <img
                src={getDiceBearUrl(previewSeed, style)}
                alt={style}
                className="h-10 w-10 rounded-lg object-cover"
              />
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" id="name" error={errors.name}>
          <input id="name" name="name" value={form.name} onChange={handleChange} className={inputClass(errors.name)} />
        </Field>
        <Field label="Email" id="email" error={errors.email}>
          <input id="email" name="email" type="email" value={form.email} onChange={handleChange} className={inputClass(errors.email)} />
        </Field>
        <Field label="Phone" id="phone" error={errors.phone}>
          <input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" className={inputClass(errors.phone)} />
        </Field>
        <Field label="City" id="city" error={errors.city}>
          <input id="city" name="city" value={form.city} onChange={handleChange} className={inputClass(errors.city)} />
        </Field>
        <Field label="State" id="state" error={errors.state}>
          <input id="state" name="state" value={form.state} onChange={handleChange} className={inputClass(errors.state)} />
        </Field>
      </div>

      <Field label="Bio" id="bio" error={errors.bio}>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          value={form.bio}
          onChange={handleChange}
          placeholder="Tell us a little about yourself…"
          className={inputClass(errors.bio)}
        />
        <p className="mt-1 text-right text-xs text-muted">{form.bio.length}/500</p>
      </Field>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark disabled:opacity-50"
        >
          {saving && <FiLoader className="h-4 w-4 animate-spin" />}
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
};

export default ProfileForm;
