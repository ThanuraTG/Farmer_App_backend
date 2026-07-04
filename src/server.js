require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const areaRoutes = require('./routes/areaRoutes');
const cropRoutes = require('./routes/cropRoutes');
const priceRoutes = require('./routes/priceRoutes');
const savedCropRoutes = require('./routes/savedCropRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Controller for custom mapping
const { getUserSavedCrops } = require('./controllers/savedCropController');
const { protect } = require('./middleware/authMiddleware');

const app = express();

// Connect to MongoDB Atlas
connectDB();

// Configure Middleware
app.use(cors({
  origin: '*', // Allow all origins during development
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Sri Lankan Digital Agriculture Platform API is running.' });
});

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/areas', areaRoutes); // Maps to Divisions CRUD in schema
app.use('/api/crops', cropRoutes); // Maps to Crop & CropDetail CRUD in schema
app.use('/api/prices', priceRoutes); // Maps to MarketPrice CRUD in schema
app.use('/api/saved-crops', savedCropRoutes); // Maps to SavedCrop bookmarks
app.get('/api/users/:id/saved-crops', protect, getUserSavedCrops); // Custom mapping for user saved crops
app.use('/api/weather', weatherRoutes); // Weather data with Open-Meteo caching
app.use('/api/notifications', notificationRoutes); // Farming notification alerts
app.use('/api/reports', reportRoutes); // Analytics and charts endpoint
app.use('/api/admin', adminRoutes); // Admin Panel specific stats and logs

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    message: err.message || 'An unexpected error occurred on the server',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Run Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`========================================================`);
  console.log(` Sri Lankan Digital Agriculture API is running on port ${PORT}`);
  console.log(` Health check URL: http://localhost:${PORT}/api/health`);
  console.log(`========================================================`);
});
