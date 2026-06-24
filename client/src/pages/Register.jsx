import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';

const ROLES = [
  { value: 'tenant', label: '🏡 Tenant — looking for a rental' },
  { value: 'owner',  label: '🏢 Owner — listing my property' },
];

const Register = () => {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', role: 'tenant',
  });
  const [showPassword, setShowPass]     = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [loading, setLoading]           = useState(false);
  const [googleLoading, setGoogleL]     = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  // ── Form validation ────────────────────────────────────────────────────────
  const validate = () => {
    if (!form.name.trim())                          return 'Full name is required';
    if (!/^\S+@\S+\.\S+$/.test(form.email))        return 'Please enter a valid email';
    if (form.password.length < 6)                  return 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword)    return 'Passwords do not match';
    return null;
  };

  // ── Email/password registration ────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validate();
    if (error) { toast.error(error); return; }

    setLoading(true);
    try {
      await register(form.name.trim(), form.email.trim(), form.password, form.role);
      toast.success('Account created! Welcome to RentEase 🎉');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Google sign-in ─────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    setGoogleL(true);
    try {
      await loginWithGoogle();
      toast.success('Signed in with Google! 🎉');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        toast.error(err.message || 'Google sign-in failed');
      }
    } finally {
      setGoogleL(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-12">
      <SEO title="Create Account" description="Create your free RentEase account to book rental properties, list your property, or manage bookings." canonical="/register" noIndex />
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <span className="text-2xl">✨</span>
        </div>
        <h1 className="text-2xl font-bold text-secondary">Create an account</h1>
        <p className="mt-2 text-sm text-muted">Join RentEase to book your next home</p>
      </div>

      {/* Google button */}
      <button
        type="button"
        onClick={handleGoogle}
        disabled={googleLoading}
        className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium text-secondary shadow-sm transition hover:bg-gray-50 disabled:opacity-60"
      >
        {googleLoading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-secondary" />
        ) : (
          <FcGoogle className="h-5 w-5" />
        )}
        Continue with Google
      </button>

      {/* Divider */}
      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-muted">or register with email</span>
        <span className="h-px flex-1 bg-gray-200" />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label htmlFor="reg-name" className="mb-1.5 block text-sm font-medium text-secondary">
            Full name
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            <FiUser className="h-4 w-4 shrink-0 text-muted" />
            <input
              id="reg-name"
              name="name"
              type="text"
              required
              autoComplete="name"
              placeholder="John Doe"
              value={form.name}
              onChange={handleChange}
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="reg-email" className="mb-1.5 block text-sm font-medium text-secondary">
            Email address
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            <FiMail className="h-4 w-4 shrink-0 text-muted" />
            <input
              id="reg-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label htmlFor="reg-password" className="mb-1.5 block text-sm font-medium text-secondary">
            Password
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            <FiLock className="h-4 w-4 shrink-0 text-muted" />
            <input
              id="reg-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              placeholder="At least 6 characters"
              value={form.password}
              onChange={handleChange}
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
            />
            <button
              type="button"
              onClick={() => setShowPass((p) => !p)}
              className="text-muted transition hover:text-secondary"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Confirm password */}
        <div>
          <label htmlFor="reg-confirm" className="mb-1.5 block text-sm font-medium text-secondary">
            Confirm password
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            <FiLock className="h-4 w-4 shrink-0 text-muted" />
            <input
              id="reg-confirm"
              name="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              required
              autoComplete="new-password"
              placeholder="Repeat your password"
              value={form.confirmPassword}
              onChange={handleChange}
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((p) => !p)}
              className="text-muted transition hover:text-secondary"
              aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirm ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Role selector */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-secondary">
            I am a…
          </label>
          <div className="grid grid-cols-2 gap-3">
            {ROLES.map((r) => (
              <label
                key={r.value}
                className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition ${
                  form.role === r.value
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-gray-200 text-secondary hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={r.value}
                  checked={form.role === r.value}
                  onChange={handleChange}
                  className="sr-only"
                />
                {r.label}
              </label>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark disabled:opacity-60"
        >
          {loading && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-primary hover:text-primary-dark">
          Sign in
        </Link>
      </p>
    </div>
  );
};

export default Register;
