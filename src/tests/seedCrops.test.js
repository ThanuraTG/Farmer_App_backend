const test = require('node:test');
const assert = require('node:assert/strict');

const {
  crops,
  cropProfileData,
  vegetableWeatherRequirements,
  slugifyCropName,
  getCropImagePath,
  buildCropDetailPayload,
  parseDurationToDays
} = require('../seeds/seedCrops');
const { evaluateWeeklyWeatherSuitability, resolveWeatherCity } = require('../controllers/cropController');
const { buildAudienceConditions } = require('../services/notifications/notificationService');

test('slugifyCropName creates stable file-safe crop slugs', () => {
  assert.equal(slugifyCropName('Paddy (Rice)'), 'paddy-rice');
  assert.equal(slugifyCropName('Manioc / Cassava'), 'manioc-cassava');
  assert.equal(slugifyCropName('Drumstick / Moringa'), 'drumstick-moringa');
});

test('all seeded crops point at the generated local crop image library', () => {
  assert.ok(crops.length > 0);

  for (const crop of crops) {
    assert.equal(crop.imageUrl, getCropImagePath(crop.name.en));
    assert.match(crop.imageUrl, /^\/media\/crops\/[a-z0-9-]+\.png$/);
  }
});

test('every seeded crop has a matching agronomy profile and descriptive summary', () => {
  assert.equal(Object.keys(cropProfileData).length, crops.length);

  for (const crop of crops) {
    const profile = cropProfileData[crop.name.en];
    assert.ok(profile, `Missing crop profile for ${crop.name.en}`);
    assert.equal(crop.description.en, profile.description);
    assert.ok(profile.suitableClimate.length > 0);
    assert.ok(profile.suitableSoil.length > 0);
    assert.ok(profile.growingPeriod.length > 0);
    assert.ok(profile.harvestingPeriod.length > 0);
  }
});

test('duration parsing converts short and perennial crop timelines into days', () => {
  assert.deepEqual(parseDurationToDays('75-135 days commonly'), { min: 75, max: 135 });
  assert.deepEqual(parseDurationToDays('7-9 months'), { min: 210, max: 270 });
  assert.deepEqual(parseDurationToDays('2-3 years'), { min: 730, max: 1095 });
});

test('detail payload preserves raw soil, climate, and harvest guidance for a crop', () => {
  const paddy = crops.find(crop => crop.name.en === 'Paddy (Rice)');
  const detail = buildCropDetailPayload({
    _id: 'crop-id-1',
    name: paddy.name,
    scientificName: '',
    suitableSeasons: paddy.suitableSeasons,
    harvest: paddy.harvest
  });

  assert.equal(detail.soil_type, cropProfileData['Paddy (Rice)'].suitableSoil);
  assert.equal(detail.first_harvest_period, cropProfileData['Paddy (Rice)'].growingPeriod);
  assert.equal(detail.harvesting_info.when_to_harvest, cropProfileData['Paddy (Rice)'].harvestingPeriod);
  assert.match(detail.weather_tolerance.optimal_temp, /20-35 C/);
});

test('vegetable weather data is available for every vegetable crop and is included in details', () => {
  const vegetableCrops = crops.filter(crop => crop.category === 'Vegetables');
  assert.equal(vegetableCrops.length, 22);
  assert.equal(Object.keys(vegetableWeatherRequirements).length, vegetableCrops.length);

  const tomato = crops.find(crop => crop.name.en === 'Tomato');
  const detail = buildCropDetailPayload({
    _id: 'tomato-id', name: tomato.name, scientificName: '', suitableSeasons: [], harvest: tomato.harvest
  });
  assert.deepEqual(detail.weather_tolerance, {
    min_temp: 7,
    max_temp: 35,
    optimal_temp: '21-24 C',
    rainfall_tolerance: '600-1300 mm/year',
    max_rainfall_mm: 1300,
    optimal_humidity: '50-70% RH',
    sunlight_requirement: '6-8 h/day, full sun'
  });
});

test('weekly weather suitability gives an explainable crop recommendation', () => {
  const weather = {
    location: { name: 'Kandy' },
    current: { temp_c: 23, humidity: 65, precip_mm: 0 },
    forecast: Array.from({ length: 7 }, (_, index) => ({
      date: `2026-09-0${index + 1}`,
      minTempC: 20,
      maxTempC: 28,
      chanceOfRain: 30,
      totalPrecipitationMm: 2
    }))
  };
  const result = evaluateWeeklyWeatherSuitability({
    cropName: 'Tomato',
    weather,
    tolerance: { min_temp: 7, max_temp: 35, optimal_temp: '21-24 C', optimal_humidity: '50-70% RH' }
  });

  assert.equal(result.evaluation.overallStatus, 'Suitable');
  assert.equal(result.evaluation.recommendationText, 'Your area is suitable for Tomato cultivation this week.');
  assert.equal(result.location, 'Kandy');
});

test('legacy text division values are used as weather cities', async () => {
  assert.equal(await resolveWeatherCity('', 'Badulla'), 'Badulla');
});

test('notification queries do not cast legacy district names as ObjectIds', () => {
  const conditions = buildAudienceConditions({ _id: '507f1f77bcf86cd799439011', district: 'Badulla' });
  assert.equal(conditions.some((condition) => Object.hasOwn(condition, 'targetDistrict')), false);
  assert.equal(conditions.length, 3);
});
