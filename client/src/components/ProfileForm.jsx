import { useState, useRef } from 'react';
import { FiCamera, FiTrash2, FiLoader } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { uploadAvatar, removeAvatar } from '../services/userService';

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
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    bio: profile?.bio || '',
    city: profile?.city || '',
    state: profile?.state || '',
  });
  const [errors, setErrors] = useState({});
  const [avatar, setAvatar] = useState(profile?.avatar || '');
  const [avatarLoading, setAvatarLoading] = useState(false);

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

  const handleAvatarSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      toast.error('Only JPEG, PNG, WebP, and GIF images are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB');
      return;
    }

    setAvatarLoading(true);
    try {
      const result = await uploadAvatar(file);
      setAvatar(result.user.avatar);
      toast.success('Avatar uploaded successfully');
      if (onSave) onSave(form, result.user, false);
    } catch (err) {
      toast.error(err.message || 'Failed to upload avatar');
    } finally {
      setAvatarLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarLoading(true);
    try {
      const result = await removeAvatar();
      setAvatar('');
      toast.success('Avatar removed');
      if (onSave) onSave(form, result.user, false);
    } catch (err) {
      toast.error(err.message || 'Failed to remove avatar');
    } finally {
      setAvatarLoading(false);
    }
  };

  const initials = form.name
    ? form.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar section */}
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <div className="relative">
          {avatar ? (
            <img src={avatar} alt="Avatar" className="h-24 w-24 rounded-full object-cover ring-4 ring-primary/10" />
          ) : (
            <span className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary ring-4 ring-primary/10">
              {initials}
            </span>
          )}
          {avatarLoading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
              <FiLoader className="h-6 w-6 animate-spin text-white" />
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={avatarLoading}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-dark disabled:opacity-50"
          >
            <FiCamera className="h-4 w-4" /> Upload
          </button>
          {avatar && (
            <button
              type="button"
              onClick={handleRemoveAvatar}
              disabled={avatarLoading}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-secondary transition hover:bg-gray-50 disabled:opacity-50"
            >
              <FiTrash2 className="h-4 w-4" /> Remove
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
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
