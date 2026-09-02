/**
 * Thresholds for Decision Support and Risk Analysis
 * Define boundary values for classifications and alerts
 */

const RECOMMENDATION_CATEGORIES = {
  HIGHLY_RECOMMENDED: 'highly_recommended',
  RECOMMENDED: 'recommended',
  MODERATELY_SUITABLE: 'moderately_suitable',
  NOT_RECOMMENDED: 'not_recommended'
};

// Score thresholds for recommendation categories (0-100)
const RECOMMENDATION_SCORE_THRESHOLDS = {
  HIGHLY_RECOMMENDED: 75,
  RECOMMENDED: 60,
  MODERATELY_SUITABLE: 45,
  NOT_RECOMMENDED: 0
};

// Supply Risk Thresholds
const SUPPLY_RISK_THRESHOLDS = {
  LOW: { min: 0, max: 30, label: 'Low Risk' },
  MODERATE: { min: 30, max: 60, label: 'Moderate Risk' },
  HIGH: { min: 60, max: 100, label: 'High Risk' }
};

// Market Trend Thresholds
const MARKET_TREND_THRESHOLDS = {
  SIGNIFICANT_INCREASE: 15, // % increase
  MODERATE_INCREASE: 5,
  STABLE: 5, // ±5%
  MODERATE_DECREASE: -5,
  SIGNIFICANT_DECREASE: -15
};

// Weather Alert Thresholds
const WEATHER_ALERT_THRESHOLDS = {
  extremeRain: 100, // mm
  drought: { consecutiveDays: 7, threshold: 0.1 }, // mm/day
  extremeTemp: { min: 5, max: 40 }, // Celsius
  extremeWind: 40 // km/h
};

// Cultivation Plan Timings
const CULTIVATION_TIMINGS = {
  plantingAdvanceWarning: 14, // days before planting
  irrigationReminder: 3, // days before irrigation
  harvestReadyWarning: 7 // days before expected harvest
};

module.exports = {
  RECOMMENDATION_CATEGORIES,
  RECOMMENDATION_SCORE_THRESHOLDS,
  SUPPLY_RISK_THRESHOLDS,
  MARKET_TREND_THRESHOLDS,
  WEATHER_ALERT_THRESHOLDS,
  CULTIVATION_TIMINGS
};
