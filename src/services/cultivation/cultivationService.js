const CultivationPlan = require('../../models/CultivationPlan');
const Crop = require('../../models/Crop');
const District = require('../../models/District');
const { convertToAcres } = require('../../utils/unitConverter');

/**
 * Calculate estimated harvest date based on planting date and crop growing duration
 */
const calculateExpectedHarvestDate = (plantingDateStr, crop) => {
  const pDate = new Date(plantingDateStr);
  const daysToAdd = crop?.harvest?.expectedDays || crop?.growingDurationDays?.max || 90;

  const hDate = new Date(pDate);
  hDate.setDate(hDate.getDate() + daysToAdd);
  return hDate;
};

/**
 * Calculate expected yield in Kg based on land acreage and crop reference yield
 */
const calculateExpectedYieldKg = (normalizedLandSizeAcres, crop) => {
  const yieldPerAcre = crop?.harvest?.expectedYieldPerAcre || 1000;
  return Number((normalizedLandSizeAcres * yieldPerAcre).toFixed(2));
};

const createPlan = async (farmerId, planData) => {
  const { cropId, provinceId, districtId, divisionId, landSize, landUnit = 'acres', plantingDate, expectedHarvestDate, expectedYieldKg, estimatedCultivationCost, status } = planData;

  const crop = await Crop.findById(cropId);
  if (!crop) {
    const err = new Error('Selected crop not found');
    err.statusCode = 404;
    throw err;
  }

  const district = await District.findById(districtId);
  if (!district) {
    const err = new Error('Selected district not found');
    err.statusCode = 404;
    throw err;
  }

  const pDate = new Date(plantingDate);
  if (isNaN(pDate.getTime())) {
    const err = new Error('Invalid planting date');
    err.statusCode = 400;
    throw err;
  }

  const normalizedLandSizeAcres = convertToAcres(landSize, landUnit);
  if (normalizedLandSizeAcres <= 0) {
    const err = new Error('Land size must be a positive number');
    err.statusCode = 400;
    throw err;
  }

  const computedHarvestDate = expectedHarvestDate
    ? new Date(expectedHarvestDate)
    : calculateExpectedHarvestDate(plantingDate, crop);

  const computedYield = expectedYieldKg !== undefined && expectedYieldKg !== null
    ? Number(expectedYieldKg)
    : calculateExpectedYieldKg(normalizedLandSizeAcres, crop);

  const plan = await CultivationPlan.create({
    farmerId,
    cropId,
    provinceId: provinceId || district.provinceId,
    districtId,
    divisionId: divisionId || null,
    landSize: Number(landSize),
    landUnit: landUnit.toLowerCase(),
    normalizedLandSizeAcres,
    plantingDate: pDate,
    expectedHarvestDate: computedHarvestDate,
    expectedYieldKg: computedYield,
    estimatedCultivationCost: estimatedCultivationCost ? Number(estimatedCultivationCost) : (crop.referenceCostPerAcre ? crop.referenceCostPerAcre * normalizedLandSizeAcres : null),
    status: status || 'planned'
  });

  return plan.populate([
    { path: 'cropId', select: 'name category imageUrl harvest' },
    { path: 'districtId', select: 'name' }
  ]);
};

const getFarmerPlans = async (farmerId) => {
  return CultivationPlan.find({ farmerId })
    .sort({ plantingDate: -1 })
    .populate('cropId', 'name category imageUrl harvest')
    .populate('districtId', 'name')
    .populate('divisionId', 'name');
};

const getPlanById = async (planId, farmerId = null) => {
  const plan = await CultivationPlan.findById(planId)
    .populate('cropId')
    .populate('districtId')
    .populate('provinceId')
    .populate('divisionId');

  if (!plan) {
    const err = new Error('Cultivation plan not found');
    err.statusCode = 404;
    throw err;
  }

  if (farmerId && plan.farmerId.toString() !== farmerId.toString()) {
    const err = new Error('Access denied: You do not own this cultivation plan');
    err.statusCode = 403;
    throw err;
  }

  return plan;
};

const updatePlan = async (planId, farmerId, updateData) => {
  const plan = await getPlanById(planId, farmerId);

  if (updateData.landSize || updateData.landUnit) {
    const size = updateData.landSize || plan.landSize;
    const unit = updateData.landUnit || plan.landUnit;
    plan.landSize = Number(size);
    plan.landUnit = unit;
    plan.normalizedLandSizeAcres = convertToAcres(size, unit);
  }

  if (updateData.plantingDate) {
    plan.plantingDate = new Date(updateData.plantingDate);
  }

  if (updateData.expectedHarvestDate) {
    plan.expectedHarvestDate = new Date(updateData.expectedHarvestDate);
  }

  if (updateData.expectedYieldKg !== undefined) {
    plan.expectedYieldKg = Number(updateData.expectedYieldKg);
  }

  if (updateData.estimatedCultivationCost !== undefined) {
    plan.estimatedCultivationCost = updateData.estimatedCultivationCost !== null ? Number(updateData.estimatedCultivationCost) : null;
  }

  if (updateData.status) {
    plan.status = updateData.status;
  }

  await plan.save();
  return plan;
};

const deletePlan = async (planId, farmerId) => {
  const plan = await getPlanById(planId, farmerId);
  await CultivationPlan.deleteOne({ _id: plan._id });
  return { message: 'Cultivation plan deleted successfully' };
};

const getAdminPlans = async (filters) => {
  const { cropId, districtId, status, startDate, endDate, page = 1, limit = 20 } = filters;

  const query = {};
  if (cropId) query.cropId = cropId;
  if (districtId) query.districtId = districtId;
  if (status) query.status = status;

  if (startDate || endDate) {
    query.expectedHarvestDate = {};
    if (startDate) query.expectedHarvestDate.$gte = new Date(startDate);
    if (endDate) query.expectedHarvestDate.$lte = new Date(endDate);
  }

  const skip = (Number(page) - 1) * Number(limit);
  const totalItems = await CultivationPlan.countDocuments(query);
  const items = await CultivationPlan.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .populate('farmerId', 'fullName mobile')
    .populate('cropId', 'name category')
    .populate('districtId', 'name');

  return {
    items,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      totalItems,
      totalPages: Math.ceil(totalItems / Number(limit))
    }
  };
};

module.exports = {
  createPlan,
  getFarmerPlans,
  getPlanById,
  updatePlan,
  deletePlan,
  getAdminPlans,
  calculateExpectedHarvestDate,
  calculateExpectedYieldKg
};
