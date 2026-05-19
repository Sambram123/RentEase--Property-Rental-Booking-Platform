import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

/**
 * ProtectedRoute
 *
 * Wraps any route that requires authentication.
 *   - Shows <Loader /> while Firebase resolves the auth state
 *   - Redirects to /login (preserving the original URL) if unauthenticated
 *   - Optionally enforces a required role: allowedRoles={['admin']}
 *
 * Usage:
 *   <ProtectedRoute>
 *     <Dashboard />
 *   </ProtectedRoute>
 *
 *   <ProtectedRoute allowedRoles={['owner', 'admin']}>
 *     <CreateListing />
 *   </ProtectedRoute>
 */
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Still waiting for Firebase / localStorage hydration
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader />
      </div>
    );
  }

  // Not logged in → redirect to /login, save current path for after login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but wrong role
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
