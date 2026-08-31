const { getAlternativeRecommendations } = require('../services/decisionSupport/recommendationService');
const { successResponse, errorResponse } = require('../utils/responseHandler');

const getAlternatives = async (req, res, next) => {
  try {
    let { districtId, plantingDate, landSize, excludeCropId, limit = 3 } = req.query;

    if (!districtId && req.user && req.user.district) {
      districtId = req.user.district.toString();
    }

    if (!districtId) {
      return errorResponse(res, 400, 'districtId is required (or user profile must have a valid district assigned)');
    }

    const recommendations = await getAlternativeRecommendations({
      districtId,
      plantingDate,
      landSize,
      excludeCropId,
      limit
    });

    return successResponse(res, 200, 'Alternative crop recommendations generated', recommendations);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAlternatives
};
