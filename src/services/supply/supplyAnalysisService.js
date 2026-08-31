const CultivationPlan = require('../../models/CultivationPlan');
const SupplyBaseline = require('../../models/SupplyBaseline');
const { SUPPLY_RISK_THRESHOLDS } = require('../../constants/thresholds');

/**
 * Aggregate participating farmers' cultivation plans for indicative supply
 */
const getIndicativeSupply = async (cropId, districtId = null, harvestDate = new Date()) => {
  const targetDate = new Date(harvestDate);
  const targetMonth = targetDate.getMonth() + 1; // 1-12
  const targetYear = targetDate.getFullYear();

  const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
  const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59);

  const query = {
    cropId,
    status: { $in: ['planned', 'active', 'harvesting'] },
    expectedHarvestDate: { $gte: startOfMonth, $lte: endOfMonth }
  };

  if (districtId) {
    query.districtId = districtId;
  }

  const plans = await CultivationPlan.find(query);

  const planCount = plans.length;
  const totalArea = Number(plans.reduce((acc, p) => acc + (p.normalizedLandSizeAcres || 0), 0).toFixed(2));
  const estimatedExpectedSupplyKg = Number(plans.reduce((acc, p) => acc + (p.expectedYieldKg || 0), 0).toFixed(2));

  return {
    cropId,
    districtId,
    targetMonth,
    targetYear,
    period: `${targetYear}-${String(targetMonth).padStart(2, '0')}`,
    planCount,
    totalArea,
    estimatedExpectedSupplyKg
  };
};

/**
 * Evaluate Indicative Supply Risk against reference baselines
 */
const getSupplyRiskAnalysis = async (cropId, districtId = null, harvestDate = new Date()) => {
  const supplyAggregate = await getIndicativeSupply(cropId, districtId, harvestDate);
  const { estimatedExpectedSupplyKg, targetMonth, planCount, totalArea, period } = supplyAggregate;

  // Search baseline for crop and specific district or nationwide fallback
  let baseline = null;
  if (districtId) {
    baseline = await SupplyBaseline.findOne({ cropId, districtId, month: targetMonth, active: true });
  }
  if (!baseline) {
    baseline = await SupplyBaseline.findOne({ cropId, districtId: null, month: targetMonth, active: true });
  }

  if (!baseline || !baseline.referenceSupplyKg || baseline.referenceSupplyKg <= 0) {
    return {
      hasBaseline: false,
      risk: 'insufficient_data',
      score: 50, // Neutral score for missing baseline data
      supplyRatio: null,
      planCount,
      totalArea,
      estimatedExpectedSupplyKg,
      referenceSupplyKg: null,
      period,
      reasons: ['No registered baseline supply benchmark exists for this crop and target harvest month.'],
      explanation: 'Indicative supply risk analysis is marked as insufficient_data due to missing reference baseline data.'
    };
  }

  const referenceSupplyKg = baseline.referenceSupplyKg;
  const supplyRatio = Number((estimatedExpectedSupplyKg / referenceSupplyKg).toFixed(2));

  let risk = 'medium';
  let score = 60;
  let explanation = '';

  if (supplyRatio < SUPPLY_RISK_THRESHOLDS.LOW_MAX) {
    risk = 'low';
    score = 90; // Low supply risk is favorable for farmers (no oversupply expected)
    explanation = `Indicative supply risk is LOW (Supply Ratio ${supplyRatio}). System expected supply of ${estimatedExpectedSupplyKg} kg is below reference capacity of ${referenceSupplyKg} kg.`;
  } else if (supplyRatio <= SUPPLY_RISK_THRESHOLDS.MEDIUM_MAX) {
    risk = 'medium';
    score = 65;
    explanation = `Indicative supply risk is MEDIUM (Supply Ratio ${supplyRatio}). System expected supply of ${estimatedExpectedSupplyKg} kg is within balanced reference limits (${referenceSupplyKg} kg).`;
  } else {
    risk = 'high';
    score = 30; // High supply risk (market glut expected)
    explanation = `Indicative supply risk is HIGH (Supply Ratio ${supplyRatio}). System expected supply of ${estimatedExpectedSupplyKg} kg exceeds reference capacity of ${referenceSupplyKg} kg, raising risk of market glut.`;
  }

  return {
    hasBaseline: true,
    risk,
    score,
    supplyRatio,
    planCount,
    totalArea,
    estimatedExpectedSupplyKg,
    referenceSupplyKg,
    period,
    reasons: [explanation],
    explanation
  };
};

module.exports = {
  getIndicativeSupply,
  getSupplyRiskAnalysis
};
