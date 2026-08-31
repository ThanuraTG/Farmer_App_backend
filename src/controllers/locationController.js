const Province = require('../models/Province');
const District = require('../models/District');
const Division = require('../models/Division');
const { successResponse, errorResponse } = require('../utils/responseHandler');

// Public Location APIs
const getProvinces = async (req, res, next) => {
  try {
    const provinces = await Province.find().sort({ 'name.en': 1 });
    return successResponse(res, 200, 'Provinces retrieved', provinces);
  } catch (err) {
    next(err);
  }
};

const getDistricts = async (req, res, next) => {
  try {
    const { provinceId } = req.query;
    const query = {};
    if (provinceId) query.provinceId = provinceId;

    const districts = await District.find(query).sort({ 'name.en': 1 }).populate('provinceId', 'name code');
    return successResponse(res, 200, 'Districts retrieved', districts);
  } catch (err) {
    next(err);
  }
};

const getDivisions = async (req, res, next) => {
  try {
    const { districtId } = req.query;
    const query = {};
    if (districtId) query.districtId = districtId;

    const divisions = await Division.find(query).sort({ 'name.en': 1 }).populate('districtId', 'name');
    return successResponse(res, 200, 'Divisions retrieved', divisions);
  } catch (err) {
    next(err);
  }
};

// Admin Location CRUD
const createProvince = async (req, res, next) => {
  try {
    const province = await Province.create(req.body);
    return successResponse(res, 201, 'Province created', province);
  } catch (err) {
    next(err);
  }
};

const createDistrict = async (req, res, next) => {
  try {
    const district = await District.create(req.body);
    return successResponse(res, 201, 'District created', district);
  } catch (err) {
    next(err);
  }
};

const createDivision = async (req, res, next) => {
  try {
    const division = await Division.create(req.body);
    return successResponse(res, 201, 'Division created', division);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProvinces,
  getDistricts,
  getDivisions,
  createProvince,
  createDistrict,
  createDivision
};
