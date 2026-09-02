/**
 * Factor Weights for Decision Support Scoring
 * Used in recommendation engine calculations
 */

const FACTOR_WEIGHTS = {
  // Weather Suitability Weights
  weather: {
    temperature: 0.30,
    rainfall: 0.25,
    humidity: 0.20,
    sunlight: 0.15,
    wind: 0.10
  },

  // Market Analysis Weights
  market: {
    priceStability: 0.40,
    demandLevel: 0.35,
    supplyRisk: 0.25
  },

  // Profitability Weights
  profitability: {
    cropPrice: 0.45,
    cultivationCost: 0.35,
    yieldExpectation: 0.20
  },

  // Overall Score Weights
  overall: {
    weatherSuitability: 0.35,
    marketAnalysis: 0.35,
    profitability: 0.30
  },

  // Supply Risk Weights
  supplyRisk: {
    regionalSupply: 0.40,
    seasonalTrend: 0.30,
    farmerParticipation: 0.30
  }
};

module.exports = {
  FACTOR_WEIGHTS
};
