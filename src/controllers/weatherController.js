const axios = require('axios');
const mongoose = require('mongoose');
const Division = require('../models/Division');

const monitoredLocations = [
  'Colombo', 'Kandy', 'Galle', 'Jaffna', 'Trincomalee',
  'Anuradhapura', 'Negombo', 'Nuwara Eliya', 'Batticaloa', 'Matara'
];

const weatherDescriptions = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Heavy drizzle',
  61: 'Light rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  80: 'Rain showers',
  81: 'Moderate rain showers',
  82: 'Heavy rain showers',
  95: 'Thunderstorm'
};

const weatherIcons = {
  clear: 'https://cdn.weatherapi.com/weather/64x64/day/113.png',
  cloudy: 'https://cdn.weatherapi.com/weather/64x64/day/116.png',
  rain: 'https://cdn.weatherapi.com/weather/64x64/day/296.png',
  storm: 'https://cdn.weatherapi.com/weather/64x64/day/389.png'
};

const getCondition = (weatherCode = 0) => {
  const text = weatherDescriptions[weatherCode] || 'Unknown conditions';
  const icon = weatherCode >= 95
    ? weatherIcons.storm
    : weatherCode >= 51
      ? weatherIcons.rain
      : weatherCode >= 1
        ? weatherIcons.cloudy
        : weatherIcons.clear;

  return { text, icon };
};

const getFarmerAdvice = (rainProbability, precipitation, windSpeed) => {
  if (rainProbability >= 70 || precipitation >= 10) {
    return 'Heavy rain is expected. Avoid fertilizer application and ensure drainage channels are clear.';
  }
  if (windSpeed >= 35) {
    return 'Strong winds are expected. Avoid pesticide spraying and support young plants where needed.';
  }
  if (rainProbability <= 20 && precipitation < 1) {
    return 'Dry weather is expected. Check soil moisture and plan irrigation for water-sensitive crops.';
  }
  return 'Conditions are suitable for routine field work. Monitor the daily forecast before planting or harvesting.';
};

const normalizeWeatherServiceError = (error) => {
  if (error?.statusCode) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const serviceError = new Error('Weather service is temporarily unavailable. Please try again shortly.');
    serviceError.statusCode = 503;
    serviceError.cause = error;
    return serviceError;
  }

  return error;
};

const getWeatherForCity = async (city) => {
  try {
    const locationResponse = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
      params: { name: city, count: 1, language: 'en', format: 'json' },
      timeout: 10000
    });
    const location = locationResponse.data?.results?.[0];

    if (!location) {
      const error = new Error(`Weather location '${city}' was not found.`);
      error.statusCode = 404;
      throw error;
    }

    const forecastResponse = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude: location.latitude,
        longitude: location.longitude,
        timezone: 'auto',
        forecast_days: 7,
        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,sunrise,sunset'
      },
      timeout: 10000
    });

    const forecast = forecastResponse.data;
    const current = forecast.current || {};
    const daily = forecast.daily || {};
    const condition = getCondition(current.weather_code);
    const chanceOfRain = daily.precipitation_probability_max?.[0] ?? 0;
    const precipitation = current.precipitation ?? 0;

    return {
      location: {
        name: location.name,
        region: location.admin1 || 'Sri Lanka',
        country: location.country || 'Sri Lanka',
        lat: location.latitude,
        lon: location.longitude,
        localTime: current.time || new Date().toISOString()
      },
      current: {
        temp_c: Math.round(current.temperature_2m ?? 0),
        temperatureC: Math.round(current.temperature_2m ?? 0),
        feelslike_c: Math.round(current.apparent_temperature ?? 0),
        feelsLikeC: Math.round(current.apparent_temperature ?? 0),
        humidity: current.relative_humidity_2m ?? 0,
        chance_of_rain: chanceOfRain,
        precip_mm: precipitation,
        cloud: current.cloud_cover ?? 0,
        wind_kph: Math.round(current.wind_speed_10m ?? 0),
        wind_dir: current.wind_direction_10m ?? 0,
        gust_kph: Math.round(current.wind_gusts_10m ?? 0),
        uv: current.uv_index ?? 0,
        condition,
        icon: condition.icon
      },
      temp_c: Math.round(current.temperature_2m ?? 0),
      feelslike_c: Math.round(current.apparent_temperature ?? 0),
      humidity: current.relative_humidity_2m ?? 0,
      chance_of_rain: chanceOfRain,
      precip_mm: precipitation,
      wind_kph: Math.round(current.wind_speed_10m ?? 0),
      condition,
      sun: {
        sunrise: daily.sunrise?.[0] || '',
        sunset: daily.sunset?.[0] || ''
      },
      forecast: (daily.time || []).map((date, index) => {
        const dayCondition = getCondition(daily.weather_code?.[index]);
        return {
          date,
          dayName: new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long' }),
          icon: dayCondition.icon,
          condition: dayCondition.text,
          maxTempC: Math.round(daily.temperature_2m_max?.[index] ?? 0),
          minTempC: Math.round(daily.temperature_2m_min?.[index] ?? 0),
          chanceOfRain: daily.precipitation_probability_max?.[index] ?? 0,
          totalPrecipitationMm: daily.precipitation_sum?.[index] ?? 0
        };
      }),
      agricultural_recommendation: getFarmerAdvice(
        chanceOfRain,
        precipitation,
        current.wind_speed_10m ?? 0
      )
    };
  } catch (error) {
    throw normalizeWeatherServiceError(error);
  }
};

const getWeather = async (req, res, next) => {
  try {
    let city = String(req.query.city || '').trim();
    const divisionId = String(req.query.division_id || '').trim();
    if (!city && divisionId) {
      if (mongoose.Types.ObjectId.isValid(divisionId)) {
        const division = await Division.findById(divisionId).select('name').lean();
        const name = division?.name;
        city = typeof name === 'object'
          ? String(name.en || name.si || name.ta || '')
          : String(name || '');
      } else {
        city = divisionId;
      }
    }
    if (!city) {
      return res.status(400).json({ success: false, message: 'city or a valid division_id query parameter is required.', errors: [] });
    }
    return res.status(200).json(await getWeatherForCity(city));
  } catch (error) {
    next(normalizeWeatherServiceError(error));
  }
};

const getAllWeather = async (_req, res, next) => {
  try {
    const results = await Promise.allSettled(monitoredLocations.map(getWeatherForCity));
    const weatherRecords = results
      .filter((result) => result.status === 'fulfilled')
      .map((result) => result.value);

    if (weatherRecords.length === 0) {
      const error = new Error('Weather service is temporarily unavailable. Please try again shortly.');
      error.statusCode = 503;
      throw error;
    }
    return res.status(200).json(weatherRecords);
  } catch (error) {
    next(error);
  }
};

module.exports = { getWeather, getAllWeather, getWeatherForCity };
