const getEstimatedProfitability = async ({ crop, estimatedYieldKg, estimatedCost, latestMarketPrice }) => {
  const sellingPrice = latestMarketPrice?.averagePrice || null;

  if (!sellingPrice || sellingPrice <= 0) {
    return {
      hasData: false,
      isEstimate: true,
      score: 50,
      estimatedRevenue: null,
      estimatedCost: estimatedCost || null,
      estimatedProfit: null,
      roi: null,
      reasons: ['No recent market price data available to calculate estimated revenue and profit.'],
      explanation: 'Financial profitability calculation incomplete due to missing market price data.'
    };
  }

  const revenue = Number((estimatedYieldKg * sellingPrice).toFixed(2));

  let cost = estimatedCost;
  if (!cost && crop?.referenceCostPerAcre && crop?.harvest?.expectedYieldPerAcre) {
    const estimatedAcres = estimatedYieldKg / crop.harvest.expectedYieldPerAcre;
    cost = Number((estimatedAcres * crop.referenceCostPerAcre).toFixed(2));
  }

  if (!cost || cost <= 0) {
    return {
      hasData: false,
      isEstimate: true,
      score: 50,
      estimatedRevenue: revenue,
      estimatedCost: null,
      estimatedProfit: null,
      roi: null,
      reasons: ['Cultivation cost is not specified or available for profitability assessment.'],
      explanation: 'Estimated revenue calculated, but net profit and ROI require cultivation cost data.'
    };
  }

  const profit = Number((revenue - cost).toFixed(2));
  const roi = Number(((profit / cost) * 100).toFixed(2));

  let score = 50;
  if (roi >= 50) score = 90;
  else if (roi >= 25) score = 75;
  else if (roi >= 0) score = 60;
  else score = 30; // Negative ROI

  return {
    hasData: true,
    isEstimate: true,
    score,
    sellingPrice,
    estimatedRevenue: revenue,
    estimatedCost: cost,
    estimatedProfit: profit,
    roi,
    reasons: [`Estimated revenue of Rs. ${revenue} against estimated cost of Rs. ${cost} yields an ROI of ${roi}%.`],
    explanation: `Estimated Profitability Analysis: Projected revenue Rs. ${revenue} (Rs. ${sellingPrice}/kg) minus cost Rs. ${cost} gives an estimated net profit of Rs. ${profit} (${roi}% ROI).`
  };
};

module.exports = {
  getEstimatedProfitability
};
