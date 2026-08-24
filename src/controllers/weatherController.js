const https = require('https');
const Division = require('../models/Division');
const WeatherRecord = require('../models/WeatherRecord');

// Helper to make HTTPS requests using Node native https module
const fetchUrl = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'FarmerApp/1.0' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Invalid JSON response from weather API'));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
};

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Helper to generate dynamic agricultural recommendations
const getAgriculturalRecommendation = (condition, temp, humidity, rain) => {
  const cond = (condition || '').toLowerCase();
  if (cond.includes('rain') || cond.includes('drizzle') || rain > 5.0) {
    return 'Heavy rain alert: Avoid chemical sprays and hold fertilizer application. Ensure field drainage channels are clear.';
  }
  if (temp > 32) {
    return 'High temperature warning: Monitor soil moisture and irrigate early in the morning or late evening to prevent heat stress.';
  }
  if (humidity > 80) {
    return 'High humidity detected: High risk of fungal diseases. Inspect crops for early leaf blight and ensure proper crop spacing.';
  }
  if (cond.includes('sunny') || cond.includes('clear')) {
    return 'Optimal sun exposure: Ideal conditions for harvesting, crop drying, and field preparation. Maintain regular watering schedule.';
  }
  return 'Favorable weather conditions: Suitable for routine field maintenance, crop monitoring, and scheduled fertilization.';
};

// Normalize WeatherAPI.com payload into clean standardized structure
const normalizeWeatherApiResponse = (data, divisionName = '', divisionId = '') => {
  const loc = data.location || {};
  const curr = data.current || {};
  const forecast0 = data.forecast?.forecastday?.[0] || {};
  const chanceOfRain = forecast0.day?.daily_chance_of_rain ?? (curr.precip_mm > 0 ? 80 : 20);

  const forecastDays = (data.forecast?.forecastday || []).map((fd) => {
    const d = new Date(fd.date);
    const dayName = daysOfWeek[d.getDay()];
    return {
      date: fd.date,
      dayName: dayName,
      icon: fd.day?.condition?.icon ? (fd.day.condition.icon.startsWith('http') ? fd.day.condition.icon : `https:${fd.day.condition.icon}`) : '',
      condition: fd.day?.condition?.text || 'Partly cloudy',
      maxTempC: Math.round(fd.day?.maxtemp_c ?? 30),
      minTempC: Math.round(fd.day?.mintemp_c ?? 24),
      chanceOfRain: fd.day?.daily_chance_of_rain ?? 0,
      totalPrecipitationMm: fd.day?.totalprecip_mm ?? 0
    };
  });

  const astro = forecast0.astro || {};
  const tempC = curr.temp_c ?? 28.0;
  const humidity = curr.humidity ?? 75;
  const rainMm = curr.precip_mm ?? 0.0;
  const conditionText = curr.condition?.text || 'Sunny';
  const conditionIcon = curr.condition?.icon ? (curr.condition.icon.startsWith('http') ? curr.condition.icon : `https:${curr.condition.icon}`) : '';
  const conditionCode = curr.condition?.code || 1000;
  const feelsLike = curr.feelslike_c ?? tempC;
  const windKph = curr.wind_kph ?? 12.0;
  const windDir = curr.wind_dir || 'N';
  const gustKph = curr.gust_kph ?? Math.round(windKph * 1.3 * 10) / 10;
  const cloudPercent = curr.cloud ?? 20;
  const uvIndex = curr.uv ?? 5.0;

  const agriculturalRecommendation = getAgriculturalRecommendation(conditionText, tempC, humidity, rainMm);

  const conditionObj = {
    text: conditionText,
    icon: conditionIcon,
    code: conditionCode
  };

  return {
    location: {
      name: loc.name || divisionName || 'Sri Lanka',
      region: loc.region || 'Sri Lanka',
      country: loc.country || 'Sri Lanka',
      lat: loc.lat || 6.9271,
      lon: loc.lon || 79.8612,
      localTime: loc.localtime || new Date().toISOString()
    },
    // The exact 11 fields requested in user image:
    temp_c: tempC,
    condition: conditionObj,
    humidity: humidity,
    chance_of_rain: chanceOfRain,
    wind_kph: windKph,
    feelslike_c: feelsLike,
    precip_mm: rainMm,
    cloud: cloudPercent,
    wind_dir: windDir,
    gust_kph: gustKph,
    uv: uvIndex,

    current: {
      temp_c: tempC,
      feelslike_c: feelsLike,
      condition: conditionObj,
      humidity: humidity,
      chance_of_rain: chanceOfRain,
      wind_kph: windKph,
      precip_mm: rainMm,
      cloud: cloudPercent,
      wind_dir: windDir,
      gust_kph: gustKph,
      uv: uvIndex,
      temperatureC: tempC,
      feelsLikeC: feelsLike,
      windKph: windKph,
      windDirection: windDir,
      pressureMb: curr.pressure_mb ?? 1012,
      visibilityKm: curr.vis_km ?? 10,
      precipitationMm: rainMm
    },
    forecast: forecastDays,
    sun: {
      sunrise: astro.sunrise || '06:05 AM',
      sunset: astro.sunset || '06:20 PM'
    },
    // Backwards-compatible normalized fields for Flutter Mobile & existing Web widgets:
    id: divisionId || loc.name,
    division_id: divisionId,
    temperature_celsius: tempC,
    humidity_percentage: humidity,
    weather_condition: conditionText,
    rainfall_mm: rainMm,
    wind_speed_kmh: windKph,
    precipitation_probability: chanceOfRain,
    forecast_date: new Date().toISOString(),
    agricultural_recommendation: agriculturalRecommendation,
    division: {
      id: divisionId,
      division_id: divisionId,
      name: loc.name || divisionName,
      province: loc.region || 'Sri Lanka',
      latitude: loc.lat,
      longitude: loc.lon
    }
  };
};

// @desc    Get current weather & 7-day forecast from WeatherAPI.com
// @route   GET /api/weather
// @access  Public
const getWeatherForDivision = async (req, res) => {
  const { division_id, city } = req.query;

  let queryLocation = 'Colombo, Sri Lanka';
  let targetDivision = null;

  if (city && city.trim() !== '') {
    queryLocation = city.trim().toLowerCase().includes('sri lanka') 
      ? city.trim() 
      : `${city.trim()}, Sri Lanka`;
  } else if (division_id) {
    try {
      targetDivision = await Division.findById(division_id);
      if (targetDivision) {
        queryLocation = `${targetDivision.name}, Sri Lanka`;
      }
    } catch (e) {
      console.warn('Invalid division_id format, defaulting to query location');
    }
  }

  const apiKey = process.env.WEATHER_API_KEY || 'ba460b06cc9a4acc86f75927262408';

  if (!apiKey) {
    return res.status(500).json({ message: 'Weather service is currently unavailable. Please check server configuration.' });
  }

  const apiUrl = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(queryLocation)}&days=7&aqi=no&alerts=yes`;

  try {
    console.log(`[WEATHER] Querying WeatherAPI.com for: ${queryLocation}`);
    const weatherData = await fetchUrl(apiUrl);

    if (weatherData.error) {
      console.error('WeatherAPI error response:', weatherData.error.message);
      return res.status(400).json({ message: 'Unable to load weather information. Please check the city name and try again.' });
    }

    const normalizedData = normalizeWeatherApiResponse(
      weatherData, 
      targetDivision?.name || city || 'Colombo', 
      targetDivision?._id?.toString() || division_id || ''
    );

    // Save record to DB cache asynchronously for historical fallback
    if (targetDivision) {
      WeatherRecord.create({
        division_id: targetDivision._id,
        record_date: new Date(),
        temperature_c: normalizedData.current.temperatureC,
        humidity_percent: normalizedData.current.humidity,
        rainfall_mm: normalizedData.current.precipitationMm,
        condition: normalizedData.current.condition,
        fetched_at: new Date()
      }).catch(err => console.error('Error auto-caching weather record:', err.message));
    }

    return res.json(normalizedData);
  } catch (error) {
    console.error('External WeatherAPI Fetch Error:', error.message);

    // Attempt fallback from DB cache if API fails
    if (targetDivision) {
      const fallbackRecord = await WeatherRecord.findOne({ division_id: targetDivision._id }).sort({ fetched_at: -1 });
      if (fallbackRecord) {
        return res.json({
          location: { name: targetDivision.name, region: targetDivision.province, country: 'Sri Lanka' },
          current: {
            temperatureC: fallbackRecord.temperature_c,
            humidity: fallbackRecord.humidity_percent,
            condition: fallbackRecord.condition,
            precipitationMm: fallbackRecord.rainfall_mm
          },
          temperature_celsius: fallbackRecord.temperature_c,
          humidity_percentage: fallbackRecord.humidity_percent,
          weather_condition: fallbackRecord.condition,
          rainfall_mm: fallbackRecord.rainfall_mm,
          agricultural_recommendation: getAgriculturalRecommendation(fallbackRecord.condition, fallbackRecord.temperature_c, fallbackRecord.humidity_percent, fallbackRecord.rainfall_mm)
        });
      }
    }

    return res.status(500).json({ message: 'Weather service is currently unavailable. Please try again later.' });
  }
};

// @desc    Get current weather telemetry for all divisions in Sri Lanka
// @route   GET /api/weather/all
// @access  Public
const getAllWeather = async (req, res) => {
  try {
    const divisions = await Division.find({});
    const apiKey = process.env.WEATHER_API_KEY || 'ba460b06cc9a4acc86f75927262408';

    const weatherResults = await Promise.all(
      divisions.map(async (division) => {
        const queryLocation = `${division.name}, Sri Lanka`;
        const apiUrl = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(queryLocation)}&days=7&aqi=no&alerts=yes`;
        
        try {
          const weatherData = await fetchUrl(apiUrl);
          if (weatherData && !weatherData.error) {
            return normalizeWeatherApiResponse(weatherData, division.name, division._id.toString());
          }
        } catch (e) {
          console.error(`Error fetching WeatherAPI for division ${division.name}:`, e.message);
        }

        // Fallback to DB cached record if available
        const cachedRecord = await WeatherRecord.findOne({ division_id: division._id }).sort({ fetched_at: -1 });
        if (cachedRecord) {
          return {
            location: { name: division.name, region: division.province, country: 'Sri Lanka' },
            current: {
              temperatureC: cachedRecord.temperature_c,
              humidity: cachedRecord.humidity_percent,
              condition: cachedRecord.condition,
              precipitationMm: cachedRecord.rainfall_mm
            },
            temperature_celsius: cachedRecord.temperature_c,
            humidity_percentage: cachedRecord.humidity_percent,
            weather_condition: cachedRecord.condition,
            rainfall_mm: cachedRecord.rainfall_mm,
            agricultural_recommendation: getAgriculturalRecommendation(cachedRecord.condition, cachedRecord.temperature_c, cachedRecord.humidity_percent, cachedRecord.rainfall_mm),
            division: { id: division._id, name: division.name, province: division.province }
          };
        }

        return {
          location: { name: division.name, region: division.province, country: 'Sri Lanka' },
          current: { temperatureC: 28, humidity: 75, condition: 'Sunny', precipitationMm: 0 },
          temperature_celsius: 28,
          humidity_percentage: 75,
          weather_condition: 'Sunny',
          rainfall_mm: 0,
          agricultural_recommendation: 'Ideal conditions for crop growth.',
          division: { id: division._id, name: division.name, province: division.province }
        };
      })
    );

    return res.json(weatherResults);
  } catch (error) {
    console.error('Error fetching all weather data:', error);
    return res.status(500).json({ message: 'Error fetching weather data', error: error.message });
  }
};

module.exports = {
  getWeatherForDivision,
  getAllWeather
};
