const Crop = require('../../models/Crop');
const { generateDecisionSupport } = require('./decisionSupportEngine');

const getAlternativeRecommendations = async ({ districtId, plantingDate = new Date(), landSize = 1, excludeCropId = null, limit = 3 }) => {
  const query = { status: 'active' };
  if (excludeCropId) {
    query._id = { $ne: excludeCropId };
  }

  const activeCrops = await Crop.find(query).limit(10); // Evaluate top candidate active crops

  const recommendations = [];

  for (const crop of activeCrops) {
    try {
      const assessment = await generateDecisionSupport({
        cropId: crop._id,
        districtId,
        plantingDate,
        landSize
      });

      recommendations.push({
        crop: {
          id: crop._id,
          name: crop.name,
          category: crop.category,
          imageUrl: crop.imageUrl
        },
        score: assessment.overall.score,
        status: assessment.overall.status,
        marketRisk: assessment.market.trend === 'decreasing' ? 'high' : 'low',
        supplyRisk: assessment.supply.risk,
        weatherSuitability: assessment.weather.status,
        shortReasons: [
          ...assessment.weather.reasons.slice(0, 1),
          ...assessment.market.reasons.slice(0, 1),
          ...assessment.supply.reasons.slice(0, 1)
        ]
      });
    } catch (err) {
      // Skip crop if evaluation fails
    }
  }

  // Sort descending by score
  recommendations.sort((a, b) => b.score - a.score);

  return recommendations.slice(0, Number(limit));
};

module.exports = {
  getAlternativeRecommendations
};
