const MARKET_TREND_THRESHOLDS = {
  INCREASING_MIN: 5,  // > +5%
  DECREASING_MAX: -5  // < -5%
};

const SUPPLY_RISK_THRESHOLDS = {
  LOW_MAX: 0.8,
  MEDIUM_MAX: 1.2
};

const RECOMMENDATION_CATEGORIES = {
  HIGHLY_RECOMMENDED: {
    minScore: 80,
    maxScore: 100,
    label: 'highly_recommended'
  },
  RECOMMENDED_WITH_CAUTION: {
    minScore: 60,
    maxScore: 79,
    label: 'recommended_with_caution'
  },
  HIGH_RISK: {
    minScore: 40,
    maxScore: 59,
    label: 'high_risk'
  },
  NOT_RECOMMENDED: {
    minScore: 0,
    maxScore: 39,
    label: 'not_recommended'
  }
};

module.exports = {
  MARKET_TREND_THRESHOLDS,
  SUPPLY_RISK_THRESHOLDS,
  RECOMMENDATION_CATEGORIES
};
