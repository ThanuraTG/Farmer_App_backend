const weatherService = require('../services/weather/weatherService');
const WeatherRecord = require('../models/WeatherRecord');
const WeatherCache = require('../models/WeatherCache');
const District = require('../models/District');
const { successResponse, errorResponse } = require('../utils/responseHandler');

const getWeather = async (req, res, next) => {
  try {
    let { districtId, district } = req.query;

    if (!districtId && district) {
      const foundDistrict = await District.findOne({ name: { $regex: new RegExp(`^${district}$`, 'i') } });
      if (foundDistrict) districtId = foundDistrict._id;
    }

    if (!districtId) {
      // Default to Colombo or first district if none specified
      const defaultDistrict = await District.findOne({ name: 'Colombo' }) || await District.findOne({});
      if (defaultDistrict) districtId = defaultDistrict._id;
    }

    if (!districtId) {
      return errorResponse(res, 400, 'districtId or district query parameter is required');
    }

    const [current, forecast] = await Promise.all([
      weatherService.getCurrentWeather(districtId).catch(() => null),
      weatherService.getWeatherForecast(districtId).catch(() => null)
    ]);

    return successResponse(res, 200, 'Weather information retrieved', {
      current,
      forecast
    });
  } catch (err) {
    next(err);
  }
};

const getCurrentWeather = async (req, res, next) => {
  try {
    const { districtId } = req.query;
    if (!districtId) {
      return errorResponse(res, 400, 'districtId query parameter is required');
    }

    const weather = await weatherService.getCurrentWeather(districtId);
    return successResponse(res, 200, 'Current weather data retrieved', weather);
  } catch (err) {
    next(err);
  }
};

const getWeatherForecast = async (req, res, next) => {
  try {
    const { districtId } = req.query;
    if (!districtId) {
      return errorResponse(res, 400, 'districtId query parameter is required');
    }

    const forecast = await weatherService.getWeatherForecast(districtId);
    return successResponse(res, 200, 'Weather forecast data retrieved', forecast);
  } catch (err) {
    next(err);
  }
};

const adminGetWeatherData = async (req, res, next) => {
  try {
    const { districtId, page = 1, limit = 20 } = req.query;
    const query = {};
    if (districtId) query.districtId = districtId;

    const skip = (Number(page) - 1) * Number(limit);
    const totalItems = await WeatherRecord.countDocuments(query);
    let items = await WeatherRecord.find(query)
      .populate('districtId', 'name nameSinhala')
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Fallback to WeatherCache if WeatherRecord has no entries
    if (items.length === 0) {
      const caches = await WeatherCache.find(query)
        .populate('districtId', 'name nameSinhala')
        .sort({ updatedAt: -1 });

      items = caches.map(c => ({
        _id: c._id,
        districtId: c.districtId,
        date: c.fetchedAt || c.updatedAt,
        temperatureC: c.currentData?.temperature2m || 28,
        humidityPercent: c.currentData?.relativeHumidity2m || 75,
        rainfallMm: c.currentData?.rain || 0,
        condition: c.currentData?.weatherDescription || 'Fair',
        source: 'Open-Meteo API Cache'
      }));
    }

    return successResponse(res, 200, 'Admin weather data list retrieved', {
      items,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalItems: totalItems || items.length,
        totalPages: Math.ceil((totalItems || items.length) / Number(limit))
      }
    });
  } catch (err) {
    next(err);
  }
};

const adminUpdateWeatherData = async (req, res, next) => {
  try {
    const { temperatureC, humidityPercent, rainfallMm, condition } = req.body;
    let record = await WeatherRecord.findById(req.params.id);

    if (record) {
      if (temperatureC !== undefined) record.temperatureC = temperatureC;
      if (humidityPercent !== undefined) record.humidityPercent = humidityPercent;
      if (rainfallMm !== undefined) record.rainfallMm = rainfallMm;
      if (condition !== undefined) record.condition = condition;
      await record.save();
      return successResponse(res, 200, 'Weather record updated successfully', record);
    }

    let cache = await WeatherCache.findById(req.params.id);
    if (cache) {
      if (temperatureC !== undefined) cache.currentData.temperature2m = temperatureC;
      if (humidityPercent !== undefined) cache.currentData.relativeHumidity2m = humidityPercent;
      if (condition !== undefined) cache.currentData.weatherDescription = condition;
      await cache.save();
      return successResponse(res, 200, 'Weather cache record updated successfully', cache);
    }

    return errorResponse(res, 404, 'Weather data record not found');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getWeather,
  getCurrentWeather,
  getWeatherForecast,
  adminGetWeatherData,
  adminUpdateWeatherData
};
