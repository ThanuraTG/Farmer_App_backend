const MarketPrice = require('../../models/MarketPrice');
const Crop = require('../../models/Crop');

const objectIdPattern = /^[a-f\d]{24}$/i;

const escapeRegExp = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildQuery = ({ cropId, centreId, marketLocation, startDate, endDate } = {}) => {
  const query = {};
  if (cropId) query.$or = [{ cropId }, { crop_id: cropId }];
  if (centreId) {
    if (objectIdPattern.test(String(centreId))) {
      query.economicCentreId = centreId;
    } else {
      query.market_location = { $regex: escapeRegExp(String(centreId).trim()), $options: 'i' };
    }
  }
  if (marketLocation) {
    query.market_location = { $regex: escapeRegExp(String(marketLocation).trim()), $options: 'i' };
  }
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }
  return query;
};

const getLatestMarketPrice = async (cropId, centreId, marketLocation) => MarketPrice.findOne(buildQuery({ cropId, centreId, marketLocation }))
  .sort({ date: -1 })
  .populate('cropId', 'name category')
  .populate('economicCentreId', 'name districtName');

const getMarketPriceHistory = async (params) => {
  const { page = 1, limit = 100 } = params;
  const query = buildQuery(params);
  const pageNumber = Math.max(Number(page), 1);
  const pageSize = Math.min(Math.max(Number(limit) || 100, 1), 100);
  const totalItems = await MarketPrice.countDocuments(query);
  const items = await MarketPrice.find(query)
    .sort({ date: -1 })
    .skip((pageNumber - 1) * pageSize)
    .limit(pageSize)
    .populate('cropId', 'name category')
    .populate('economicCentreId', 'name districtName');

  return {
    items,
    pagination: {
      page: pageNumber,
      limit: pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize)
    }
  };
};

const getMarketPriceSummary = async (cropId, centreId, marketLocation) => {
  const records = await MarketPrice.find(buildQuery({ cropId, centreId, marketLocation }))
    .sort({ date: -1 })
    .limit(30);

  if (records.length === 0) return { hasData: false };

  const prices = records.map((record) => Number(record.averagePrice || record.price_per_kg || 0));
  const latestPrice = prices[0];
  const average = (values) => values.length
    ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2))
    : 0;
  const average7 = average(prices.slice(0, 7));
  const average30 = average(prices);
  const percentageChange = average7 ? Number((((latestPrice - average7) / average7) * 100).toFixed(1)) : 0;
  const trend = percentageChange > 3 ? 'increasing' : percentageChange < -3 ? 'decreasing' : 'stable';

  return {
    hasData: true,
    latestPrice,
    average7,
    average30,
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
    percentageChange,
    trend,
    explanation: trend === 'increasing'
      ? 'Recent prices are above the 7-day average. Compare centre prices before deciding whether to sell now.'
      : trend === 'decreasing'
        ? 'Recent prices are below the 7-day average. Perishable crops may be safer to sell sooner.'
        : 'Recent prices are close to the 7-day average, indicating stable market conditions.'
  };
};

const importMarketPricesCSV = async (rows, userId) => {
  const result = {
    rowsReceived: rows.length,
    rowsImported: 0,
    rowsFailed: 0,
    errorsSummary: []
  };

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    try {
      const cropName = String(row.cropName || '').trim();
      const marketLocation = String(row.centreName || '').trim();
      const date = new Date(row.date);
      const minPrice = Number(row.minPrice);
      const maxPrice = Number(row.maxPrice);
      const averagePrice = row.averagePrice === undefined || row.averagePrice === ''
        ? Number(((minPrice + maxPrice) / 2).toFixed(2))
        : Number(row.averagePrice);

      if (!cropName || !marketLocation || Number.isNaN(date.getTime()) || Number.isNaN(minPrice) || Number.isNaN(maxPrice) || minPrice < 0 || maxPrice < minPrice) {
        throw new Error('cropName, centreName, date, minPrice and maxPrice must contain valid values');
      }

      const crop = await Crop.findOne({ 'name.en': new RegExp(`^${cropName}$`, 'i') });
      if (!crop) throw new Error(`Crop '${cropName}' does not exist`);

      await MarketPrice.findOneAndUpdate(
        {
          $and: [
            { $or: [{ cropId: crop._id }, { crop_id: crop._id }] },
            { market_location: marketLocation },
            { date }
          ]
        },
        {
          cropId: crop._id,
          crop_id: crop._id,
          market_location: marketLocation,
          date,
          price_date: date,
          minPrice,
          maxPrice,
          averagePrice,
          price_per_kg: averagePrice,
          unit: row.unit || 'kg',
          source: 'CSV import',
          createdBy: userId,
          added_by_user_id: userId
        },
        { upsert: true, new: true, runValidators: true }
      );
      result.rowsImported += 1;
    } catch (error) {
      result.rowsFailed += 1;
      result.errorsSummary.push({ row: index + 2, error: error.message });
    }
  }

  return result;
};

module.exports = {
  getLatestMarketPrice,
  getMarketPriceHistory,
  getMarketPriceSummary,
  importMarketPricesCSV
};
