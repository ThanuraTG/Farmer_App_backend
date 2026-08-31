const Crop = require('../../models/Crop');
const District = require('../../models/District');
const CultivationPlan = require('../../models/CultivationPlan');
const { getCurrentWeather } = require('../weather/weatherService');
const { getMarketPriceSummary } = require('../market/marketService');
const { getSupplyRiskAnalysis } = require('../supply/supplyAnalysisService');
const { getEstimatedProfitability } = require('../profitability/profitabilityService');
const { convertToAcres } = require('../../utils/unitConverter');
const { FACTOR_WEIGHTS } = require('../../constants/weights');
const { RECOMMENDATION_CATEGORIES } = require('../../constants/thresholds');

/**
 * Calculate Weather Suitability Sub-Score
 */
const calculateWeatherSuitability = (crop, weatherData, missingData) => {
  const climate = crop?.climate || {};
  const currentTemp = weatherData?.current?.temperature;
  const rainfall = weatherData?.current?.rainfall;

  const matchedConditions = [];
  const riskConditions = [];
  const reasons = [];

  if (currentTemp === undefined || currentTemp === null) {
    missingData.push('weather_temperature_data');
    return { score: 50, status: 'insufficient_data', matchedConditions, riskConditions, reasons: ['Current weather data unavailable for location.'] };
  }

  let tempScore = 70;
  const optMin = climate.temperatureOptimumMin || climate.temperatureMin;
  const optMax = climate.temperatureOptimumMax || climate.temperatureMax;

  if (optMin !== null && optMax !== null) {
    if (currentTemp >= optMin && currentTemp <= optMax) {
      tempScore = 95;
      matchedConditions.push(`Current temperature (${currentTemp}°C) is within optimum range (${optMin}-${optMax}°C).`);
    } else if ((climate.temperatureMin && currentTemp >= climate.temperatureMin) && (climate.temperatureMax && currentTemp <= climate.temperatureMax)) {
      tempScore = 75;
      matchedConditions.push(`Current temperature (${currentTemp}°C) is within tolerable growing limits.`);
    } else if (climate.temperatureMax && currentTemp > climate.temperatureMax) {
      tempScore = 40;
      riskConditions.push(`High temperature alert: ${currentTemp}°C exceeds max limit (${climate.temperatureMax}°C).`);
    } else if (climate.temperatureMin && currentTemp < climate.temperatureMin) {
      tempScore = 40;
      riskConditions.push(`Low temperature alert: ${currentTemp}°C is below min limit (${climate.temperatureMin}°C).`);
    }
  } else {
    missingData.push('crop_temperature_requirements');
    tempScore = 70;
    reasons.push('Crop temperature range metadata is missing; using neutral weather score.');
  }

  reasons.push(...matchedConditions, ...riskConditions);

  let status = 'good';
  if (tempScore >= 85) status = 'excellent';
  else if (tempScore >= 65) status = 'good';
  else status = 'unfavorable';

  return {
    score: tempScore,
    status,
    matchedConditions,
    riskConditions,
    reasons
  };
};

/**
 * Calculate Season Suitability Sub-Score
 */
const calculateSeasonSuitability = (crop, plantingDate, missingData) => {
  const pDate = new Date(plantingDate);
  const month = pDate.getMonth() + 1; // 1-12

  // Sri Lanka Seasons: Yala (May-Sep: months 5-9), Maha (Oct-Mar: months 10,11,12,1,2,3), Inter-monsoon (April: month 4)
  let currentSeason = 'Maha';
  if (month >= 5 && month <= 9) {
    currentSeason = 'Yala';
  } else if (month === 4) {
    currentSeason = 'Inter-monsoon';
  }

  const seasons = crop?.suitableSeasons || [];
  const reasons = [];

  if (seasons.length === 0) {
    missingData.push('crop_suitable_seasons_data');
    return { score: 70, status: 'insufficient_data', season: currentSeason, reasons: ['Crop suitable season metadata not specified.'] };
  }

  const isMatched = seasons.some(s => s.toLowerCase() === 'all year' || s.toLowerCase() === currentSeason.toLowerCase());

  if (isMatched) {
    reasons.push(`Planting date in ${pDate.toLocaleString('default', { month: 'long' })} aligns with ${currentSeason} season (${seasons.join(', ')}).`);
    return { score: 90, status: 'suitable', season: currentSeason, reasons };
  } else {
    reasons.push(`Planting in ${currentSeason} season deviates from crop's recommended seasons (${seasons.join(', ')}).`);
    return { score: 45, status: 'off_season', season: currentSeason, reasons };
  }
};

/**
 * Calculate Location Suitability Sub-Score
 */
const calculateLocationSuitability = (crop, district, missingData) => {
  const recDistricts = crop?.recommendedDistricts || [];
  const reasons = [];

  if (recDistricts.length === 0) {
    reasons.push(`Crop is generally suitable across Sri Lankan agro-climatic zones including ${district.name.en}.`);
    return { score: 75, status: 'suitable', reasons };
  }

  const isRecommended = recDistricts.some(d => d._id?.toString() === district._id.toString() || d.toString() === district._id.toString());

  if (isRecommended) {
    reasons.push(`${district.name.en} is explicitly listed as a recommended cultivation district for ${crop.name.en}.`);
    return { score: 95, status: 'highly_suitable', reasons };
  } else {
    reasons.push(`${district.name.en} is not among the primary recommended districts for ${crop.name.en}.`);
    return { score: 55, status: 'moderate', reasons };
  }
};

/**
 * Main Rule-Based Decision Support Calculation Engine
 */
const generateDecisionSupport = async ({ cropId, districtId, plantingDate = new Date(), landSize = 1, landUnit = 'acres', cultivationPlanId = null }) => {
  const missingData = [];
  const risks = [];

  // Fetch crop
  const crop = await Crop.findById(cropId).populate('recommendedDistricts', 'name');
  if (!crop) {
    const err = new Error('Crop not found');
    err.statusCode = 404;
    throw err;
  }

  // Fetch district
  const district = await District.findById(districtId);
  if (!district) {
    const err = new Error('District not found');
    err.statusCode = 404;
    throw err;
  }

  const pDate = new Date(plantingDate);
  const normalizedAcres = convertToAcres(landSize, landUnit);
  const estimatedYieldKg = Number((normalizedAcres * (crop.harvest?.expectedYieldPerAcre || 1000)).toFixed(2));

  // 1. Weather Analysis
  let weatherData = null;
  try {
    weatherData = await getCurrentWeather(districtId);
  } catch (err) {
    missingData.push('external_weather_api');
  }
  const weatherRes = calculateWeatherSuitability(crop, weatherData, missingData);

  // 2. Market Trend Analysis
  const marketSummary = await getMarketPriceSummary(cropId);
  let marketScore = 70;
  if (!marketSummary.hasData) {
    missingData.push('historical_market_price_data');
    marketScore = 50;
  } else if (marketSummary.trend === 'increasing') {
    marketScore = 90;
  } else if (marketSummary.trend === 'stable') {
    marketScore = 70;
  } else if (marketSummary.trend === 'decreasing') {
    marketScore = 45;
    risks.push(`Market price trend is currently decreasing (${marketSummary.percentageChange}% over 30 days).`);
  }

  const marketRes = {
    score: marketScore,
    trend: marketSummary.trend,
    latestPrice: marketSummary.latestPrice,
    average30: marketSummary.average30,
    reasons: [marketSummary.explanation]
  };

  // 3. Supply Risk Analysis
  const expectedHarvestDate = new Date(pDate);
  expectedHarvestDate.setDate(expectedHarvestDate.getDate() + (crop.harvest?.expectedDays || 90));

  const supplyRes = await getSupplyRiskAnalysis(cropId, districtId, expectedHarvestDate);
  if (!supplyRes.hasBaseline) {
    missingData.push('supply_baseline_reference_data');
  }
  if (supplyRes.risk === 'high') {
    risks.push(`High indicative supply risk: Expected system harvest of ${supplyRes.estimatedExpectedSupplyKg} kg may result in market oversupply.`);
  }

  // 4. Season Suitability Analysis
  const seasonRes = calculateSeasonSuitability(crop, pDate, missingData);

  // 5. Location Suitability Analysis
  const locationRes = calculateLocationSuitability(crop, district, missingData);

  // 6. Profitability Estimation Analysis
  const latestPriceObj = marketSummary.hasData ? { averagePrice: marketSummary.latestPrice } : null;
  const profitabilityRes = await getEstimatedProfitability({
    crop,
    estimatedYieldKg,
    estimatedCost: null,
    latestMarketPrice: latestPriceObj
  });

  if (!profitabilityRes.hasData) {
    missingData.push('profitability_cost_or_price_data');
  }

  // 7. Weighted Scoring Calculation with Weight Renormalization
  const factors = [
    { key: 'weather', weight: FACTOR_WEIGHTS.weather, score: weatherRes.score, isMissing: weatherRes.status === 'insufficient_data' },
    { key: 'market', weight: FACTOR_WEIGHTS.market, score: marketRes.score, isMissing: !marketSummary.hasData },
    { key: 'supply', weight: FACTOR_WEIGHTS.supply, score: supplyRes.score, isMissing: !supplyRes.hasBaseline },
    { key: 'season', weight: FACTOR_WEIGHTS.season, score: seasonRes.score, isMissing: seasonRes.status === 'insufficient_data' },
    { key: 'location', weight: FACTOR_WEIGHTS.location, score: locationRes.score, isMissing: false },
    { key: 'profitability', weight: FACTOR_WEIGHTS.profitability, score: profitabilityRes.score, isMissing: !profitabilityRes.hasData }
  ];

  const activeFactors = factors.filter(f => !f.isMissing);
  const totalActiveWeight = activeFactors.reduce((acc, f) => acc + f.weight, 0);

  let overallScore = 0;
  if (totalActiveWeight > 0) {
    overallScore = activeFactors.reduce((acc, f) => {
      const normalizedWeight = f.weight / totalActiveWeight;
      return acc + (f.score * normalizedWeight);
    }, 0);
  }
  overallScore = Math.round(overallScore);

  let recommendationLabel = RECOMMENDATION_CATEGORIES.NOT_RECOMMENDED.label;
  if (overallScore >= RECOMMENDATION_CATEGORIES.HIGHLY_RECOMMENDED.minScore) {
    recommendationLabel = RECOMMENDATION_CATEGORIES.HIGHLY_RECOMMENDED.label;
  } else if (overallScore >= RECOMMENDATION_CATEGORIES.RECOMMENDED_WITH_CAUTION.minScore) {
    recommendationLabel = RECOMMENDATION_CATEGORIES.RECOMMENDED_WITH_CAUTION.label;
  } else if (overallScore >= RECOMMENDATION_CATEGORIES.HIGH_RISK.minScore) {
    recommendationLabel = RECOMMENDATION_CATEGORIES.HIGH_RISK.label;
  }

  return {
    crop: {
      id: crop._id,
      name: crop.name,
      category: crop.category,
      imageUrl: crop.imageUrl
    },
    overall: {
      score: overallScore,
      status: recommendationLabel
    },
    weather: weatherRes,
    market: marketRes,
    supply: supplyRes,
    season: seasonRes,
    location: locationRes,
    profitability: profitabilityRes,
    risks,
    missingData,
    disclaimer: 'This decision-support result is an explainable indicative assessment based on available weather, historical market, cultivation-plan, and crop-reference data.',
    generatedAt: new Date()
  };
};

module.exports = {
  generateDecisionSupport
};
