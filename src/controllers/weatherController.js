const https = require('https');
const Division = require('../models/Division');
const WeatherRecord = require('../models/WeatherRecord');

// Helper to make HTTPS requests using native Node.js
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

// Map WMO weather code to condition string
const mapWeatherCodeToCondition = (code) => {
  if (code === 0) return 'Sunny';
  if (code >= 1 && code <= 3) return 'Cloudy';
  if (code === 45 || code === 48) return 'Cloudy';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || (code >= 95 && code <= 99)) return 'Rainy';
  return 'Cloudy'; // Fallback
};

// @desc    Get current weather for a division
// @route   GET /api/weather
// @access  Public (or Private)
const getWeatherForDivision = async (req, res) => {
  const { division_id } = req.query;

  if (!division_id) {
    return res.status(400).json({ message: 'Please provide division_id' });
  }

  try {
    const division = await Division.findById(division_id);
    if (!division) {
      return res.status(404).json({ message: 'Division not found' });
    }

    const { latitude, longitude } = division;

    // Check for cached record created within the last 4 hours for this division
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
    const cachedRecord = await WeatherRecord.findOne({
      division_id,
      fetched_at: { $gte: fourHoursAgo }
    }).sort({ fetched_at: -1 });

    if (cachedRecord) {
      console.log(`[WEATHER] Returning cached weather record for division: ${division.name}`);
      return res.json({
        source: 'cache',
        division: {
          name: division.name,
          province: division.province
        },
        weather: cachedRecord
      });
    }

    // Cache miss: Fetch from Open-Meteo API
    console.log(`[WEATHER] Cache miss. Fetching from Open-Meteo for division: ${division.name} (${latitude}, ${longitude})`);
    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,rain,weather_code&timezone=auto`;
    
    let weatherData;
    try {
      weatherData = await fetchUrl(apiUrl);
    } catch (apiError) {
      console.error('External Weather API error:', apiError.message);
      
      // Attempt to get last available weather record as fallback if API is down
      const fallbackRecord = await WeatherRecord.findOne({ division_id }).sort({ fetched_at: -1 });
      if (fallbackRecord) {
        return res.json({
          source: 'cache_fallback',
          division: { name: division.name, province: division.province },
          weather: fallbackRecord
        });
      }
      throw new Error('Weather service is currently unavailable');
    }

    if (!weatherData || !weatherData.current) {
      throw new Error('Invalid response layout from weather service');
    }

    const current = weatherData.current;
    const temp = current.temperature_2m;
    const humidity = current.relative_humidity_2m;
    const rain = current.rain || 0.0;
    const weatherCode = current.weather_code;
    const condition = mapWeatherCodeToCondition(weatherCode);

    // Save to cache
    const weatherRecord = await WeatherRecord.create({
      division_id,
      record_date: new Date(),
      temperature_c: temp,
      humidity_percent: humidity,
      rainfall_mm: rain,
      condition,
      fetched_at: new Date()
    });

    return res.json({
      source: 'api',
      division: {
        name: division.name,
        province: division.province
      },
      weather: weatherRecord
    });
  } catch (error) {
    console.error('Error fetching weather:', error);
    return res.status(500).json({ message: 'Error fetching weather data', error: error.message });
  }
};

module.exports = {
  getWeatherForDivision
};
