const { generateDecisionSupport } = require('../services/decisionSupport/decisionSupportEngine');
const { successResponse, errorResponse } = require('../utils/responseHandler');

const getDecisionSupport = async (req, res, next) => {
  try {
    const { cropId } = req.params;
    let { districtId, plantingDate, landSize, landUnit, cultivationPlanId } = req.query;

    // Use farmer's district if omitted in query
    if (!districtId && req.user && req.user.district) {
      districtId = req.user.district.toString();
    }

    if (!districtId) {
      return errorResponse(res, 400, 'districtId is required (or user profile must have a valid district assigned)');
    }

    const assessment = await generateDecisionSupport({
      cropId,
      districtId,
      plantingDate,
      landSize,
      landUnit,
      cultivationPlanId
    });

    return successResponse(res, 200, 'Decision-support evaluation completed', assessment);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDecisionSupport
};
