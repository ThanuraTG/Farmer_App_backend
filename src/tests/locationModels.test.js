const test = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');
const mongoose = require('mongoose');

test('notification-related models register District and Province automatically', () => {
  delete mongoose.models.District;
  delete mongoose.models.Province;
  delete require.cache[require.resolve('../models/Notification')];
  delete require.cache[require.resolve('../models/District')];
  delete require.cache[require.resolve('../models/Province')];

  require('../models/Notification');

  assert.ok(mongoose.models.District);
  assert.ok(mongoose.models.Province);
});

test('getWeatherForCity converts axios timeouts into a 503 service error', async () => {
  const originalGet = axios.get;
  delete require.cache[require.resolve('../controllers/weatherController')];

  axios.get = async () => {
    const error = new Error('timeout of 10000ms exceeded');
    error.code = 'ECONNABORTED';
    error.isAxiosError = true;
    throw error;
  };

  const { getWeatherForCity } = require('../controllers/weatherController');

  await assert.rejects(
    () => getWeatherForCity('Colombo'),
    (error) => error.statusCode === 503
      && error.message === 'Weather service is temporarily unavailable. Please try again shortly.'
  );

  axios.get = originalGet;
});

test('getWeatherForCity preserves not-found responses for unknown cities', async () => {
  const originalGet = axios.get;
  delete require.cache[require.resolve('../controllers/weatherController')];

  axios.get = async () => ({ data: { results: [] } });

  const { getWeatherForCity } = require('../controllers/weatherController');

  await assert.rejects(
    () => getWeatherForCity('Unknown City'),
    (error) => error.statusCode === 404
      && error.message === "Weather location 'Unknown City' was not found."
  );

  axios.get = originalGet;
});
