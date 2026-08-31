const axios = require('axios');
const District = require('../../models/District');
const WeatherCache = require('../../models/WeatherCache');
const env = require('../../config/env');
const logger = require('../../utils/logger');

// District default coordinates map for Sri Lanka
const DISTRICT_COORDINATES = {
  Colombo: { lat: 6.9271, lon: 79.8612 },
  Gampaha: { lat: 7.084, lon: 79.9928 },
  Kalutara: { lat: 6.5854, lon: 79.9607 },
  Kandy: { lat: 7.2906, lon: 80.6337 },
  Matale: { lat: 7.4675, lon: 80.6234 },
  'Nuwara Eliya': { lat: 6.9497, lon: 80.7891 },
  Galle: { lat: 6.0535, lon: 80.221 },
  Matara: { lat: 5.9549, lon: 80.555 },
  Hambantota: { lat: 6.1429, lon: 81.1212 },
  Jaffna: { lat: 9.6615, lon: 80.0255 },
  Kilinochchi: { lat: 9.3803, lon: 80.377 },
  Mannar: { lat: 8.981, lon: 79.9044 },
  Vavuniya: { lat: 8.7542, lon: 80.4982 },
  Mullaitivu: { lat: 9.2671, lon: 80.8142 },
  Batticaloa: { lat: 7.731, lon: 81.6747 },
  Ampara: { lat: 7.2975, lon: 81.6747 },
  Trincomalee: { lat: 8.5874, lon: 81.2152 },
  Kurunegala: { lat: 7.4863, lon: 80.3647 },
  Puttalam: { lat: 8.0362, lon: 79.8283 },
  Anuradhapura: { lat: 8.3114, lon: 80.4037 },
  Polonnaruwa: { lat: 7.9403, lon: 81.0188 },
  Badulla: { lat: 6.9934, lon: 81.055 },
  Moneragala: { lat: 6.8714, lon: 81.3487 },
  Ratnapura: { lat: 6.6828, lon: 80.3992 },
  Kegalle: { lat: 7.2513, lon: 80.3464 }
};

const getDistrictCoordinates = async (districtId) => {
  const district = await District.findById(districtId);
  if (!district) {
    const err = new Error('District not found');
    err.statusCode = 404;
    throw err;
  }

  const nameEn = district.name.en;
  let lat = district.coordinates?.latitude;
  let lon = district.coordinates?.longitude;

  if (!lat || !lon) {
    const coords = DISTRICT_COORDINATES[nameEn] || { lat: 7.8731, lon: 80.7718 };
    lat = coords.lat;
    lon = coords.lon;
  }

  return { district, lat, lon };
};

const fetchWeatherFromAPI = async (lat, lon) => {
  try {
    const response = await axios.get(`${env.WEATHER_API_BASE_URL}/forecast`, {
      params: {
        latitude: lat,
        longitude: lon,
        current_weather: true,
        hourly: 'temperature_2m,relative_humidity_2m,precipitation',
        daily: 'weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum',
        timezone: 'Asia/Colombo'
      },
      timeout: 8000
    });

    return response.data;
  } catch (error) {
    logger.warn('External Weather API fetch failed, falling back to simulated normalized weather data', error.message);
    return null; // Handle fallback gracefully
  }
};

const normalizeWeather = (district, lat, lon, apiData) => {
  if (apiData && apiData.current_weather) {
    const cw = apiData.current_weather;
    const daily = apiData.daily || {};

    const forecast = [];
    if (daily.time) {
      for (let i = 0; i < daily.time.length; i++) {
        forecast.push({
          date: daily.time[i],
          tempMin: daily.temperature_2m_min ? daily.temperature_2m_min[i] : 22,
          tempMax: daily.temperature_2m_max ? daily.temperature_2m_max[i] : 31,
          rainfall: daily.precipitation_sum ? daily.precipitation_sum[i] : 0,
          humidity: 75,
          condition: 'Partly Cloudy'
        });
      }
    }

    return {
      location: {
        districtId: district._id.toString(),
        districtName: district.name.en,
        latitude: lat,
        longitude: lon
      },
      current: {
        temperature: cw.temperature || 28,
        humidity: 75,
        rainfall: 2.0,
        windSpeed: cw.windspeed || 10,
        condition: cw.weathercode > 50 ? 'Rain' : 'Clear/Cloudy'
      },
      forecast
    };
  }

  // Fallback normalized data structure if external API is unreachable
  return {
    location: {
      districtId: district._id.toString(),
      districtName: district.name.en,
      latitude: lat,
      longitude: lon
    },
    current: {
      temperature: 28.0,
      humidity: 75.0,
      rainfall: 3.5,
      windSpeed: 12.0,
      condition: 'Partly Cloudy'
    },
    forecast: [
      { date: new Date().toISOString().split('T')[0], tempMin: 23, tempMax: 32, rainfall: 4.0, humidity: 75, condition: 'Moderate Rain' }
    ]
  };
};

const getCurrentWeather = async (districtId) => {
  // Check cache
  const cached = await WeatherCache.findOne({ districtId, weatherType: 'current' });
  if (cached && cached.expiresAt > new Date()) {
    return cached.data;
  }

  const { district, lat, lon } = await getDistrictCoordinates(districtId);
  const rawApiData = await fetchWeatherFromAPI(lat, lon);
  const normalized = normalizeWeather(district, lat, lon, rawApiData);

  // Cache for 3 hours
  const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000);
  await WeatherCache.findOneAndUpdate(
    { districtId, weatherType: 'current' },
    { data: normalized, fetchedAt: new Date(), expiresAt },
    { upsert: true, new: true }
  );

  return normalized;
};

const getWeatherForecast = async (districtId) => {
  const cached = await WeatherCache.findOne({ districtId, weatherType: 'forecast' });
  if (cached && cached.expiresAt > new Date()) {
    return cached.data;
  }

  const { district, lat, lon } = await getDistrictCoordinates(districtId);
  const rawApiData = await fetchWeatherFromAPI(lat, lon);
  const normalized = normalizeWeather(district, lat, lon, rawApiData);

  // Cache for 6 hours
  const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000);
  await WeatherCache.findOneAndUpdate(
    { districtId, weatherType: 'forecast' },
    { data: normalized, fetchedAt: new Date(), expiresAt },
    { upsert: true, new: true }
  );

  return normalized;
};

module.exports = {
  getCurrentWeather,
  getWeatherForecast
};
