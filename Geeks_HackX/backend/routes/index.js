/**
 * Central route loader — add new route modules here.
 * All routes are prefixed with /api/v1/
 */
const authRoutes         = require('./authRoutes');
const issueRoutes        = require('./issueRoutes');
const adminRoutes        = require('./adminRoutes');
const notificationRoutes = require('./notificationRoutes');
const userRoutes         = require('./userRoutes');
const geocodeRoutes      = require('./geocodeRoutes');

const loadRoutes = (app) => {
  app.use('/api/v1/auth',          authRoutes);
  app.use('/api/v1/issues',        issueRoutes);
  app.use('/api/v1/admin',         adminRoutes);
  app.use('/api/v1/notifications', notificationRoutes);
  app.use('/api/v1/users',         userRoutes);
  app.use('/api/v1/geocode',       geocodeRoutes);
};

module.exports = loadRoutes;
