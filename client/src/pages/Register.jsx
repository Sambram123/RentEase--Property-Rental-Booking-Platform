import { Link } from 'react-router-dom';
import { FiMail, FiLock, FiUser } from 'react-icons/fi';

const Register = () => {
  const handleSubmit = async (e) => {
    e.preventDefault();
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-secondary">Create an account</h1>
        <p className="mt-2 text-sm text-muted">Join RentEase to book your next home</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-secondary">Full name</label>
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 focus-within:ring-2 focus-within:ring-primary/20">
            <FiUser className="h-4 w-4 text-muted" />
            <input
              type="text"
              required
              placeholder="John Doe"
              className="w-full text-sm outline-none"
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-secondary">Email</label>
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 focus-within:ring-2 focus-within:ring-primary/20">
            <FiMail className="h-4 w-4 text-muted" />
            <input
              type="email"
              required
              placeholder="you@example.com"
              className="w-full text-sm outline-none"
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-secondary">Password</label>
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 focus-within:ring-2 focus-within:ring-primary/20">
            <FiLock className="h-4 w-4 text-muted" />
            <input
              type="password"
              required
              placeholder="••••••••"
              className="w-full text-sm outline-none"
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white transition hover:bg-primary-dark"
        >
          Create account
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
