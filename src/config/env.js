const dotenv = require('dotenv');
dotenv.config();

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/farmer_aswanna_db',
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_jwt_secret_key_change_in_production_123!',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  WEATHER_API_KEY: process.env.WEATHER_API_KEY || '',
  WEATHER_API_BASE_URL: process.env.WEATHER_API_BASE_URL || 'https://api.open-meteo.com/v1',
  CLIENT_MOBILE_ORIGIN: process.env.CLIENT_MOBILE_ORIGIN || '*',
  ADMIN_WEB_ORIGIN: process.env.ADMIN_WEB_ORIGIN || 'http://localhost:3000'
};

module.exports = env;
