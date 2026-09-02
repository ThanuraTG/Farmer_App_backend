const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const { errorHandler } = require('./middleware/error.middleware');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const cropRoutes = require('./routes/cropRoutes');
const divisionRoutes = require('./routes/divisionRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const savedCropRoutes = require('./routes/savedCropRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const marketPriceRoutes = require('./routes/marketPriceRoutes');
const adminMarketPriceRoutes = require('./routes/adminMarketPriceRoutes');
const adminRoutes = require('./routes/adminRoutes');

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
app.use('/api/users', userRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/divisions', divisionRoutes);
app.use('/api/areas', divisionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/saved-crops', savedCropRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/market-prices', marketPriceRoutes);
app.use('/api/admin/market-prices', adminMarketPriceRoutes);
app.use('/api/admin', adminRoutes);

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
