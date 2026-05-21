import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Properties from '../pages/Properties';
import PropertyDetails from '../pages/PropertyDetails';
import AddProperty from '../pages/AddProperty';
import Dashboard from '../pages/Dashboard';
import NotFound from '../pages/NotFound';
import ProtectedRoute from '../components/ProtectedRoute';

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
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* ── Protected: owner / admin only ── */}
        <Route
          path="properties/add"
          element={
            <ProtectedRoute allowedRoles={['owner', 'admin']}>
              <AddProperty />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
