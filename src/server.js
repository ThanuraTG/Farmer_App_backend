require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const areaRoutes = require('./routes/areaRoutes');
const productRoutes = require('./routes/productRoutes');
const priceRoutes = require('./routes/priceRoutes');
const demandRoutes = require('./routes/demandRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();

// Connect to MongoDB
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
  res.json({ status: 'OK', message: 'Area Price & Demand Analysis API is running.' });
});

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/areas', areaRoutes);
app.use('/api/products', productRoutes);
app.use('/api/prices', priceRoutes);
app.use('/api/demand', demandRoutes);
app.use('/api/reports', reportRoutes);

// Global Error Handler
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
  console.log(` Server is running on port ${PORT}`);
  console.log(` Health check URL: http://localhost:${PORT}/api/health`);
  console.log(`========================================================`);
});
