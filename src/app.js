const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const { errorHandler } = require('./middleware/error.middleware');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const locationRoutes = require('./routes/locationRoutes');
const cropRoutes = require('./routes/cropRoutes');
const economicCentreRoutes = require('./routes/economicCentreRoutes');
const marketPriceRoutes = require('./routes/marketPriceRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const cultivationPlanRoutes = require('./routes/cultivationPlanRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const advisoryRoutes = require('./routes/advisoryRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const contentRoutes = require('./routes/contentRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Legacy routes for backward compatibility
const areaRoutes = require('./routes/areaRoutes');
const priceRoutes = require('./routes/priceRoutes');
const marketRoutes = require('./routes/marketRoutes');
const sourceRoutes = require('./routes/sourceRoutes');
const savedCropRoutes = require('./routes/savedCropRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();

// Security Headers
app.use(helmet());

// CORS Configuration
const allowedOrigins = [
  env.ADMIN_WEB_ORIGIN,
  env.CLIENT_MOBILE_ORIGIN
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive fallback for research dev environment
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 auth requests per windowMs
  message: { success: false, message: 'Too many authentication attempts. Please try again later.', errors: [] }
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Farmer Aswanna Single Shared Backend REST API is running',
    timestamp: new Date()
  });
});

// Primary REST API Routes (Architecture Diagram Compliant)
app.use('/api/auth', authRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/economic-centres', economicCentreRoutes);
app.use('/api/market-prices', marketPriceRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/cultivation-plans', cultivationPlanRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/recommendation', recommendationRoutes); // Diagram singular route alias
app.use('/api/notifications', notificationRoutes);
app.use('/api/advisories', advisoryRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/admin', adminRoutes);

// Legacy API Mappings (Preserved for existing endpoints)
app.use('/api/areas', areaRoutes);
app.use('/api/prices', priceRoutes);
app.use('/api/markets', marketRoutes);
app.use('/api/sources', sourceRoutes);
app.use('/api/saved-crops', savedCropRoutes);
app.use('/api/reports', reportRoutes);

// 404 Route Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route ${req.originalUrl} not found`,
    errors: [`Endpoint ${req.method} ${req.originalUrl} does not exist`]
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
