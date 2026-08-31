const marketService = require('../services/market/marketService');
const MarketPrice = require('../models/MarketPrice');
const { successResponse, errorResponse } = require('../utils/responseHandler');

const getLatest = async (req, res, next) => {
  try {
    const { cropId, centreId } = req.query;
    if (!cropId) {
      return errorResponse(res, 400, 'cropId query parameter is required');
    }

    const latest = await marketService.getLatestMarketPrice(cropId, centreId);
    return successResponse(res, 200, 'Latest market price retrieved', latest);
  } catch (err) {
    next(err);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const history = await marketService.getMarketPriceHistory(req.query);
    return successResponse(res, 200, 'Market price history retrieved', history);
  } catch (err) {
    next(err);
  }
};

const getSummary = async (req, res, next) => {
  try {
    const { cropId, centreId } = req.query;
    if (!cropId) {
      return errorResponse(res, 400, 'cropId query parameter is required');
    }

    const summary = await marketService.getMarketPriceSummary(cropId, centreId);
    return successResponse(res, 200, 'Market price trend summary retrieved', summary);
  } catch (err) {
    next(err);
  }
};

// Admin Market CRUD
const adminGetMarketPrices = async (req, res, next) => {
  try {
    const { cropId, centreId, startDate, endDate, page = 1, limit = 20 } = req.query;

    const query = {};
    if (cropId) query.cropId = cropId;
    if (centreId) query.economicCentreId = centreId;

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const totalItems = await MarketPrice.countDocuments(query);
    const items = await MarketPrice.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('cropId', 'name category')
      .populate('economicCentreId', 'name districtName');

    return successResponse(res, 200, 'Admin market prices retrieved', {
      items,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalItems,
        totalPages: Math.ceil(totalItems / Number(limit))
      }
    });
  } catch (err) {
    next(err);
  }
};

const adminCreateMarketPrice = async (req, res, next) => {
  try {
    const { cropId, economicCentreId, date, minPrice, maxPrice, averagePrice, unit, source, notes } = req.body;

    const numMin = Number(minPrice);
    const numMax = Number(maxPrice);
    const numAvg = averagePrice !== undefined ? Number(averagePrice) : Number(((numMin + numMax) / 2).toFixed(2));

    if (numMin < 0 || numMax < numMin) {
      return errorResponse(res, 400, 'Invalid price range: minPrice must be >= 0 and maxPrice must be >= minPrice');
    }

    const recordDate = new Date(date);

    const price = await MarketPrice.findOneAndUpdate(
      { cropId, economicCentreId, date: recordDate },
      {
        cropId,
        economicCentreId,
        date: recordDate,
        minPrice: numMin,
        maxPrice: numMax,
        averagePrice: numAvg,
        unit: unit || 'kg',
        source: source || 'admin',
        notes: notes || '',
        createdBy: req.user._id
      },
      { upsert: true, new: true, runValidators: true }
    );

    return successResponse(res, 201, 'Market price recorded successfully', price);
  } catch (err) {
    next(err);
  }
};

const adminUpdateMarketPrice = async (req, res, next) => {
  try {
    const price = await MarketPrice.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!price) {
      return errorResponse(res, 404, 'Market price record not found');
    }
    return successResponse(res, 200, 'Market price record updated', price);
  } catch (err) {
    next(err);
  }
};

const adminDeleteMarketPrice = async (req, res, next) => {
  try {
    const price = await MarketPrice.findByIdAndDelete(req.params.id);
    if (!price) {
      return errorResponse(res, 404, 'Market price record not found');
    }
    return successResponse(res, 200, 'Market price record deleted');
  } catch (err) {
    next(err);
  }
};

// CSV Import Handler
const adminImportMarketPrices = async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(res, 400, 'CSV file upload is required');
    }

    const csvString = req.file.buffer.toString('utf8');
    const lines = csvString.split(/\r?\n/).filter(line => line.trim().length > 0);

    if (lines.length <= 1) {
      return errorResponse(res, 400, 'Uploaded CSV file is empty or missing headers');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      if (values.length === headers.length) {
        const rowObj = {};
        headers.forEach((header, idx) => {
          rowObj[header] = values[idx];
        });
        rows.push(rowObj);
      }
    }

    const result = await marketService.importMarketPricesCSV(rows, req.user._id);
    return successResponse(res, 200, 'CSV market prices import processed', result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getLatest,
  getHistory,
  getSummary,
  adminGetMarketPrices,
  adminCreateMarketPrice,
  adminUpdateMarketPrice,
  adminDeleteMarketPrice,
  adminImportMarketPrices
};
