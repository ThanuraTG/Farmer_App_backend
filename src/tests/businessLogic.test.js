const test = require('node:test');
const assert = require('node:assert');

const { convertToAcres } = require('../utils/unitConverter');
const { calculateExpectedHarvestDate, calculateExpectedYieldKg } = require('../services/cultivation/cultivationService');
const { getMarketPriceSummary } = require('../services/market/marketService');
const { FACTOR_WEIGHTS } = require('../constants/weights');
const { MARKET_TREND_THRESHOLDS, SUPPLY_RISK_THRESHOLDS } = require('../constants/thresholds');

test('Unit Test 1: Unit Converter (Acres, Hectares, Perches)', () => {
  assert.strictEqual(convertToAcres(1, 'acres'), 1);
  assert.strictEqual(convertToAcres(1, 'hectares'), 2.471);
  assert.strictEqual(convertToAcres(160, 'perches'), 1);
  assert.strictEqual(convertToAcres(-5, 'acres'), 0);
});

test('Unit Test 2: Expected Harvest Date & Yield Calculation', () => {
  const crop = {
    harvest: { expectedDays: 90, expectedYieldPerAcre: 5000 }
  };
  const plantingDate = '2026-05-01';

  const expectedHarvest = calculateExpectedHarvestDate(plantingDate, crop);
  const expectedHarvestStr = expectedHarvest.toISOString().split('T')[0];

  assert.strictEqual(expectedHarvestStr, '2026-07-30');

  const acres = 2.5;
  const yieldKg = calculateExpectedYieldKg(acres, crop);
  assert.strictEqual(yieldKg, 12500);
});

test('Unit Test 3: Market Trend Classification Thresholds', () => {
  const latestPrice = 200;

  // Case 1: Increasing (> +5%)
  const avg30Increasing = 180;
  const change1 = ((latestPrice - avg30Increasing) / avg30Increasing) * 100;
  assert.ok(change1 > MARKET_TREND_THRESHOLDS.INCREASING_MIN, 'Change > 5% should be increasing');

  // Case 2: Stable (-5% to +5%)
  const avg30Stable = 195;
  const change2 = ((latestPrice - avg30Stable) / avg30Stable) * 100;
  assert.ok(change2 >= MARKET_TREND_THRESHOLDS.DECREASING_MAX && change2 <= MARKET_TREND_THRESHOLDS.INCREASING_MIN, 'Change within +-5% should be stable');

  // Case 3: Decreasing (< -5%)
  const avg30Decreasing = 220;
  const change3 = ((latestPrice - avg30Decreasing) / avg30Decreasing) * 100;
  assert.ok(change3 < MARKET_TREND_THRESHOLDS.DECREASING_MAX, 'Change < -5% should be decreasing');
});

test('Unit Test 4: Supply Risk Ratio Classification', () => {
  const referenceSupplyKg = 100000;

  // Case 1: Low risk (< 0.8)
  const lowRatio = 70000 / referenceSupplyKg;
  assert.ok(lowRatio < SUPPLY_RISK_THRESHOLDS.LOW_MAX, 'Ratio < 0.8 is Low supply risk');

  // Case 2: Medium risk (0.8 - 1.2)
  const medRatio = 95000 / referenceSupplyKg;
  assert.ok(medRatio >= SUPPLY_RISK_THRESHOLDS.LOW_MAX && medRatio <= SUPPLY_RISK_THRESHOLDS.MEDIUM_MAX, 'Ratio 0.8-1.2 is Medium supply risk');

  // Case 3: High risk (> 1.2)
  const highRatio = 140000 / referenceSupplyKg;
  assert.ok(highRatio > SUPPLY_RISK_THRESHOLDS.MEDIUM_MAX, 'Ratio > 1.2 is High supply risk');
});

test('Unit Test 5: Decision Support Factor Weights Sum to 100', () => {
  const sumWeights = Object.values(FACTOR_WEIGHTS).reduce((a, b) => a + b, 0);
  assert.strictEqual(sumWeights, 100, 'Factor weights must total 100');
});

test('Unit Test 6: Weight Renormalization Strategy for Missing Data', () => {
  // Suppose market price and profitability are missing
  const factors = [
    { key: 'weather', weight: 25, score: 80, isMissing: false },
    { key: 'market', weight: 20, score: 50, isMissing: true },
    { key: 'supply', weight: 20, score: 90, isMissing: false },
    { key: 'season', weight: 15, score: 90, isMissing: false },
    { key: 'location', weight: 10, score: 75, isMissing: false },
    { key: 'profitability', weight: 10, score: 50, isMissing: true }
  ];

  const active = factors.filter(f => !f.isMissing);
  const totalActiveWeight = active.reduce((acc, f) => acc + f.weight, 0); // 25 + 20 + 15 + 10 = 70

  assert.strictEqual(totalActiveWeight, 70);

  const overallScore = Math.round(
    active.reduce((acc, f) => acc + (f.score * (f.weight / totalActiveWeight)), 0)
  );

  // Expected: (80*25 + 90*20 + 90*15 + 75*10) / 70 = (2000 + 1800 + 1350 + 750) / 70 = 5900 / 70 = 84.28 -> 84
  assert.strictEqual(overallScore, 84);
});
