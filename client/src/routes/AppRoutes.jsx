import { Suspense, lazy, memo } from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';

// ─── Eagerly loaded (critical path — above fold on first visit) ───────────────
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Properties from '../pages/Properties';
import PropertyDetails from '../pages/PropertyDetails';
import NotFound from '../pages/NotFound';
import ProtectedRoute from '../components/ProtectedRoute';
import AdminRoute from '../components/AdminRoute';

// ─── Lazily loaded (authenticated / heavy pages) ─────────────────────────────
const Dashboard            = lazy(() => import('../pages/Dashboard'));
const OwnerDashboard       = lazy(() => import('../pages/OwnerDashboard'));
const AdminDashboard       = lazy(() => import('../pages/AdminDashboard'));
const MyBookings           = lazy(() => import('../pages/MyBookings'));
const MyPayments           = lazy(() => import('../pages/MyPayments'));
const PaymentSuccess       = lazy(() => import('../pages/PaymentSuccess'));
const PaymentFailed        = lazy(() => import('../pages/PaymentFailed'));
const EditProperty         = lazy(() => import('../pages/EditProperty'));
const AddProperty          = lazy(() => import('../pages/AddProperty'));
const Wishlist             = lazy(() => import('../pages/Wishlist'));
const Notifications        = lazy(() => import('../pages/Notifications'));
const Messages             = lazy(() => import('../pages/Messages'));
const Profile              = lazy(() => import('../pages/Profile'));
const Settings             = lazy(() => import('../pages/Settings'));
const AvailabilityCalendar = lazy(() => import('../pages/AvailabilityCalendar'));

// ─── Suspense fallback ────────────────────────────────────────────────────────
const PageLoader = memo(() => (
  <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
    <span className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    <p className="text-sm text-muted animate-pulse">Loading…</p>
  </div>
));
PageLoader.displayName = 'PageLoader';

const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* ── Public routes ── */}
        <Route index element={<Home />} />
        <Route path="properties" element={<Properties />} />
        <Route path="properties/:id" element={<PropertyDetails />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />

        {/* ── Protected: any authenticated user ── */}
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <Dashboard />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="my-bookings"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <MyBookings />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="my-payments"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <MyPayments />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="payment/success"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <PaymentSuccess />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="payment/failed"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <PaymentFailed />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="wishlist"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <Wishlist />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="notifications"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <Notifications />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="messages"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <Messages />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <Profile />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="settings"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <Settings />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* ── Protected: owner / admin only ── */}
        <Route
          path="properties/add"
          element={
            <ProtectedRoute allowedRoles={['owner', 'admin']}>
              <Suspense fallback={<PageLoader />}>
                <AddProperty />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="properties/:id/edit"
          element={
            <ProtectedRoute allowedRoles={['owner', 'admin']}>
              <Suspense fallback={<PageLoader />}>
                <EditProperty />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="owner/dashboard"
          element={
            <ProtectedRoute allowedRoles={['owner', 'admin']}>
              <Suspense fallback={<PageLoader />}>
                <OwnerDashboard />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="availability/:propertyId"
          element={
            <ProtectedRoute allowedRoles={['owner', 'admin']}>
              <Suspense fallback={<PageLoader />}>
                <AvailabilityCalendar />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* ── Protected: admin only ── */}
        <Route
          path="admin/*"
          element={
            <AdminRoute>
              <Suspense fallback={<PageLoader />}>
                <AdminDashboard />
              </Suspense>
            </AdminRoute>
          }
        />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
