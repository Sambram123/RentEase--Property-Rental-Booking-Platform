import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';

const Login = () => {
  const { login, loginWithGoogle } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from?.pathname || '/dashboard';

  const [form, setForm]             = useState({ email: '', password: '' });
  const [showPassword, setShowPass] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [googleLoading, setGoogleL] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  // ── Email/password login ───────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back! 🎉');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.message || 'Login failed. Please try again.');
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
      navigate(from, { replace: true });
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
      <SEO title="Sign In" description="Sign in to your RentEase account to manage bookings, properties, and messages." canonical="/login" noIndex />
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <span className="text-2xl">🏠</span>
        </div>
        <h1 className="text-2xl font-bold text-secondary">Welcome back</h1>
        <p className="mt-2 text-sm text-muted">Sign in to manage your bookings</p>
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
        <span className="text-xs text-muted">or continue with email</span>
        <span className="h-px flex-1 bg-gray-200" />
      </div>

      {/* Email/password form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-secondary">
            Email address
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            <FiMail className="h-4 w-4 shrink-0 text-muted" />
            <input
              id="login-email"
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
          <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-secondary">
            Password
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            <FiLock className="h-4 w-4 shrink-0 text-muted" />
            <input
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              placeholder="••••••••"
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

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark disabled:opacity-60"
        >
          {loading && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="font-medium text-primary hover:text-primary-dark">
          Sign up free
        </Link>
      </p>
    </div>
  );
};

export default Login;
