const env = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');
const logger = require('./utils/logger');
const { initPriceSyncJob } = require('./jobs/priceSyncJob');

// Connect to MongoDB Database
connectDB();

// Initialize Price Sync Cron Job (HARTI + CBSL Scraper)
try {
  initPriceSyncJob();
} catch (e) {
  logger.warn('Price sync cron job initialization skipped', e.message);
}

// Start HTTP Server
const PORT = env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(`========================================================`);
  logger.info(` Farmer Aswanna Single Shared Backend API running on port ${PORT}`);
  logger.info(` Health check URL: http://localhost:${PORT}/api/health`);
  logger.info(`========================================================`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use by another process.`);
    process.exit(1);
  } else {
    logger.error('Server error:', err);
  }
});

