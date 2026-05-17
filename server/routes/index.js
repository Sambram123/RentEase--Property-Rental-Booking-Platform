import authRoutes from './authRoutes.js';
import propertyRoutes from './propertyRoutes.js';
import bookingRoutes from './bookingRoutes.js';
import testRoutes from './testRoutes.js';

const registerRoutes = (app) => {
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'RentEase API running',
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/properties', propertyRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/test', testRoutes);
};

export default registerRoutes;
