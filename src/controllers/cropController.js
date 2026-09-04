const Crop = require('../models/Crop');
const mongoose = require('mongoose');
const CropDetail = require('../models/CropDetail');
const MarketPrice = require('../models/MarketPrice');
const Division = require('../models/Division');
const { getWeatherForCity } = require('./weatherController');
const { successResponse, errorResponse } = require('../utils/responseHandler');

// Public/Farmer Crop List with Search, Category, Status, Pagination
const getCrops = async (req, res, next) => {
  try {
    const { search, category, status = 'active', page = 1, limit = 100 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;

    if (search) {
      query.$or = [
        { 'name.en': { $regex: search, $options: 'i' } },
        { 'name.si': { $regex: search, $options: 'i' } },
        { 'name.ta': { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    const pageSize = Math.min(Math.max(Number(limit) || 100, 1), 100);
    const pageNumber = Math.max(Number(page) || 1, 1);
    const skip = (pageNumber - 1) * pageSize;
    const totalItems = await Crop.countDocuments(query);
    const crops = await Crop.find(query)
      .sort({ 'name.en': 1 })
      .skip(skip)
      .limit(pageSize);

    return successResponse(res, 200, 'Crops retrieved', {
      items: crops,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize)
      }
    });
  } catch (err) {
    next(err);
  }
};

const getCropById = async (req, res, next) => {
  try {
    const crop = await Crop.findById(req.params.id);
    if (!crop) {
      return errorResponse(res, 404, 'Crop not found');
    }
    return successResponse(res, 200, 'Crop details retrieved', crop);
  } catch (err) {
    next(err);
  }
};

// Supplies the crop profile used by the farmer app's View Insights screen.
const getDecisionSupport = async (req, res, next) => {
  try {
    const crop = await Crop.findById(req.params.id).lean();
    if (!crop) return errorResponse(res, 404, 'Crop not found');

    const weatherCity = await _resolveWeatherCity(req.query.city, req.query.division_id);
    const [detailRecord, latestPrice, weatherResult] = await Promise.all([
      CropDetail.findOne({ crop_id: crop._id }).lean(),
      MarketPrice.findOne({ $or: [{ cropId: crop._id }, { crop_id: crop._id }] })
        .sort({ date: -1, price_date: -1 })
        .lean(),
      weatherCity ? getWeatherForCity(weatherCity).catch(() => null) : Promise.resolve(null)
    ]);

    const detail = detailRecord || {};
    const currentPrice = Number(latestPrice?.averagePrice || latestPrice?.price_per_kg || 0);
    const minPrice = Number(latestPrice?.minPrice || currentPrice);
    const maxPrice = Number(latestPrice?.maxPrice || currentPrice);
    const costs = detail.financial_baseline || {};
    const costPerAcre = ['seeds_cost', 'fertilizer_cost', 'labour_cost', 'irrigation_cost', 'pest_control_cost', 'other_cost']
      .reduce((total, key) => total + Number(costs[key] || 0), 0);
    const estimatedRevenue = Number(costs.avg_yield_kg || 0) * currentPrice;
    const weatherTolerance = detail.weather_tolerance || {
      min_temp: crop.climate?.temperatureMin,
      max_temp: crop.climate?.temperatureMax,
      optimal_temp: _formatCropClimate(crop.climate),
      rainfall_tolerance: _formatCropRainfall(crop.climate),
      optimal_humidity: _formatCropHumidity(crop.climate),
      sunlight_requirement: ''
    };
    const weatherSuitability = weatherResult
      ? evaluateWeeklyWeatherSuitability({ cropName: _localizedText(crop.name), weather: weatherResult, tolerance: weatherTolerance })
      : null;

    return successResponse(res, 200, 'Crop insights retrieved', {
      crop,
      detail: {
        description: _localizedText(crop.description),
        suitable_soil: detail.soil_type || detail.land_preparation?.soil_type || _formatCropSoil(crop.soil),
        scientific_name: detail.scientific_name || crop.scientificName || '',
        suitable_regions: detail.suitable_regions || [],
        recommended_planting_period: detail.recommended_planting_period || '',
        recommended_months: detail.recommended_months || [],
        suitable_seasons: detail.suitable_seasons || crop.suitableSeasons || [],
        suitable_climate: detail.weather_tolerance?.optimal_temp || _formatCropClimate(crop.climate),
        weather_tolerance: weatherTolerance,
        germination_period: detail.germination_period || '',
        growth_period: detail.growth_period || _daysLabel(crop.growingDurationDays),
        first_harvest_period: detail.first_harvest_period || _daysLabel(crop.harvest?.expectedDays),
        harvesting_duration: detail.harvesting_duration || '',
        avg_days_to_maturity: detail.avg_days_to_maturity || crop.harvest?.expectedDays || crop.growingDurationDays || 0,
        land_preparation: detail.land_preparation || {},
        planting_info: detail.planting_info || {},
        water_requirement: detail.water_requirement || {},
        fertilizer_info: detail.fertilizer_info || {},
        pests: detail.pest_info || [],
        diseases: detail.disease_info || [],
        yield_info: detail.yield_info || {},
        harvesting_info: detail.harvesting_info || {},
        post_harvest_info: detail.post_harvest_info || {},
        data_source: detail.source_info?.source_name || 'Department of Agriculture, Sri Lanka',
        last_updated: detail.source_info?.last_updated || detail.updatedAt || ''
      },
      weatherSuitability,
      weatherDecision: weatherSuitability
        ? {
          isSuitable: weatherSuitability.evaluation.overallStatus !== 'Not Suitable',
          status: weatherSuitability.evaluation.overallStatus,
          message: weatherSuitability.evaluation.recommendationText,
          factors: weatherSuitability.evaluation.factors
        }
        : {
          isSuitable: null,
          status: 'Select an area',
          message: 'Select an area to compare the next seven days with this crop\'s weather requirements.',
          factors: {}
        },
      marketDecision: {
        currentPrice,
        minPrice,
        maxPrice,
        marketName: latestPrice?.market_location || 'Market data not available',
        priceTrend: 'Stable',
        supplyLevel: 'Normal',
        demandLevel: 'Normal',
        date: latestPrice?.date || latestPrice?.price_date || ''
      },
      financialEstimate: {
        costPerAcre,
        costBreakdown: costs,
        estimatedRevenue,
        estimatedProfit: estimatedRevenue - costPerAcre
      },
      overallRecommendation: {
        status: 'Review forecast',
        color: 'yellow',
        reason: 'Review weather and market prices before planting or selling.',
        summaryScores: {}
      }
    });
  } catch (err) {
    next(err);
  }
};

const _daysLabel = (days) => Number(days) > 0 ? `${Number(days)} days` : '';

const _resolveWeatherCity = async (city, divisionId) => {
  const requestedCity = String(city || '').trim();
  if (requestedCity) return requestedCity;

  const requestedDivisionId = String(divisionId || '').trim();
  // Legacy mobile profiles use division_id to carry a city name (for example,
  // "Badulla") when no Division document has been assigned yet.
  if (!mongoose.Types.ObjectId.isValid(requestedDivisionId)) return requestedDivisionId;

  const division = await Division.findById(requestedDivisionId).select('name').lean();
  const name = division?.name;
  return typeof name === 'object'
    ? String(name.en || name.si || name.ta || '').trim()
    : String(name || '').trim();
};

const _localizedText = (value) => {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return '';
  return value.en || value.si || value.ta || '';
};

const _formatCropSoil = (soil = {}) => {
  const types = Array.isArray(soil.types) ? soil.types.filter(Boolean) : [];
  const phRange = soil.phMin != null && soil.phMax != null
    ? `pH ${soil.phMin}-${soil.phMax}`
    : '';
  const drainage = soil.drainage ? `${soil.drainage} drainage` : '';
  return [...types, phRange, drainage].filter(Boolean).join(', ');
};

const _formatCropClimate = (climate = {}) => {
  const min = climate.temperatureOptimumMin ?? climate.temperatureMin;
  const max = climate.temperatureOptimumMax ?? climate.temperatureMax;
  if (min != null && max != null) return `${min}-${max} C`;
  if (min != null) return `Above ${min} C`;
  if (max != null) return `Up to ${max} C`;
  return '';
};

const _formatCropRainfall = (climate = {}) => {
  const min = climate.rainfallMin;
  const max = climate.rainfallMax;
  if (min != null && max != null) return `${min}-${max} mm/year`;
  if (max != null) return `Up to ${max} mm/year`;
  return '';
};

const _formatCropHumidity = (climate = {}) => {
  const min = climate.humidityMin;
  const max = climate.humidityMax;
  if (min != null && max != null) return `${min}-${max}% RH`;
  return '';
};

const _parseRange = (value) => {
  const match = String(value || '').match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
  return match ? { min: Number(match[1]), max: Number(match[2]) } : null;
};

const evaluateWeeklyWeatherSuitability = ({ cropName, weather, tolerance }) => {
  const forecast = Array.isArray(weather?.forecast) ? weather.forecast : [];
  const minTemp = Number(tolerance?.min_temp);
  const maxTemp = Number(tolerance?.max_temp);
  const optimumRange = _parseRange(tolerance?.optimal_temp);
  const humidityRange = _parseRange(tolerance?.optimal_humidity);
  const hasTemperatureLimits = Number.isFinite(minTemp) && Number.isFinite(maxTemp);

  const outOfRangeDays = forecast.filter((day) => hasTemperatureLimits && (
    Number(day.minTempC) < minTemp || Number(day.maxTempC) > maxTemp
  ));
  const outsideOptimumDays = forecast.filter((day) => optimumRange && (
    Number(day.maxTempC) < optimumRange.min || Number(day.minTempC) > optimumRange.max
  ));
  const rainyDays = forecast.filter((day) => Number(day.chanceOfRain) >= 70 || Number(day.totalPrecipitationMm) >= 20);
  const weeklyRainfallMm = forecast.reduce((total, day) => total + Number(day.totalPrecipitationMm || 0), 0);
  const currentHumidity = Number(weather?.current?.humidity);
  const humidityOutsideRange = humidityRange && Number.isFinite(currentHumidity) && (
    currentHumidity < humidityRange.min || currentHumidity > humidityRange.max
  );

  let overallStatus = 'Suitable';
  if (!hasTemperatureLimits || forecast.length === 0) {
    overallStatus = 'Weather unavailable';
  } else if (outOfRangeDays.length >= 3) {
    overallStatus = 'Not Suitable';
  } else if (outOfRangeDays.length > 0 || outsideOptimumDays.length >= 3 || rainyDays.length >= 4 || humidityOutsideRange) {
    overallStatus = 'Moderately Suitable';
  }

  const areaName = weather?.location?.name || 'Your area';
  const verdict = overallStatus === 'Suitable'
    ? `Your area is suitable for ${cropName} cultivation this week.`
    : overallStatus === 'Moderately Suitable'
      ? `Your area is moderately suitable for ${cropName} cultivation this week.`
      : overallStatus === 'Not Suitable'
        ? `Your area is not suitable for ${cropName} cultivation this week.`
        : `Weather data is unavailable for ${areaName}.`;

  const factors = {
    temperature: outOfRangeDays.length
      ? `${outOfRangeDays.length} of ${forecast.length} days are outside the ${minTemp}-${maxTemp} C crop limit.`
      : `All forecast days remain within the ${minTemp}-${maxTemp} C crop limit.`,
    humidity: humidityRange
      ? `${currentHumidity}% current humidity; crop target is ${humidityRange.min}-${humidityRange.max}% RH.`
      : 'No crop humidity threshold is recorded.',
    rain: `${rainyDays.length} high-rain-risk days; forecast rainfall is ${weeklyRainfallMm.toFixed(1)} mm.`
  };

  return {
    location: areaName,
    current: weather.current,
    forecast: forecast.map((day) => ({
      date: day.date,
      minTempC: day.minTempC,
      maxTempC: day.maxTempC,
      chanceOfRain: day.chanceOfRain,
      totalPrecipitationMm: day.totalPrecipitationMm
    })),
    evaluation: {
      overallStatus,
      recommendationText: verdict,
      factors,
      weeklyRainfallMm: Number(weeklyRainfallMm.toFixed(1)),
      outOfRangeDays: outOfRangeDays.length
    }
  };
};

// Admin CRUD
const adminGetCrops = async (req, res, next) => {
  try {
    const { search, category, status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { 'name.en': { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const totalItems = await Crop.countDocuments(query);
    const crops = await Crop.find(query)
      .sort({ cropCode: 1 })
      .skip(skip)
      .limit(Number(limit));

    return successResponse(res, 200, 'Admin crop list retrieved', {
      items: crops,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalItems,
        totalPages: Math.ceil(totalItems / Number(limit))
      }
    });
  } catch (err) {
    next(err);
  }
};

const createCrop = async (req, res, next) => {
  try {
    const latestCrop = await Crop.findOne({ cropCode: /^CO-\d+$/ })
      .sort({ cropCode: -1 })
      .select('cropCode')
      .lean();
    const latestNumber = latestCrop ? Number(latestCrop.cropCode.replace('CO-', '')) : 0;
    const cropCode = `CO-${String(latestNumber + 1).padStart(3, '0')}`;
    const crop = await Crop.create({ ...req.body, cropCode });
    return successResponse(res, 201, 'Crop created successfully', crop);
  } catch (err) {
    next(err);
  }
};

const updateCrop = async (req, res, next) => {
  try {
    const crop = await Crop.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!crop) {
      return errorResponse(res, 404, 'Crop not found');
    }
    return successResponse(res, 200, 'Crop updated successfully', crop);
  } catch (err) {
    next(err);
  }
};

const deleteCrop = async (req, res, next) => {
  try {
    // Prefer soft delete / deactivation for historical integrity
    const crop = await Crop.findByIdAndUpdate(req.params.id, { status: 'inactive' }, { new: true });
    if (!crop) {
      return errorResponse(res, 404, 'Crop not found');
    }
    return successResponse(res, 200, 'Crop deactivated (soft deleted) successfully', crop);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCrops,
  getCropById,
  getDecisionSupport,
  adminGetCrops,
  createCrop,
  updateCrop,
  deleteCrop,
  evaluateWeeklyWeatherSuitability,
  resolveWeatherCity: _resolveWeatherCity
};
