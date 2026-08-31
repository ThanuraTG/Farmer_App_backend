const MarketPrice = require('../../models/MarketPrice');
const Crop = require('../../models/Crop');
const EconomicCentre = require('../../models/EconomicCentre');
const { MARKET_TREND_THRESHOLDS } = require('../../constants/thresholds');

/**
 * Get latest price for crop and optional economic centre
 */
const getLatestMarketPrice = async (cropId, economicCentreId = null) => {
  const query = { cropId };
  if (economicCentreId) {
    query.economicCentreId = economicCentreId;
  }

  const latest = await MarketPrice.findOne(query)
    .sort({ date: -1 })
    .populate('cropId', 'name category unit')
    .populate('economicCentreId', 'name districtName');

  return latest;
};

/**
 * Get price history with optional date filters
 */
const getMarketPriceHistory = async (filter) => {
  const { cropId, economicCentreId, days = 30, startDate, endDate } = filter;

  const query = {};
  if (cropId) query.cropId = cropId;
  if (economicCentreId) query.economicCentreId = economicCentreId;

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  } else if (days) {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - Number(days));
    query.date = { $gte: fromDate };
  }

  const history = await MarketPrice.find(query)
    .sort({ date: 1 })
    .populate('cropId', 'name')
    .populate('economicCentreId', 'name');

  return history;
};

/**
 * Calculate Historical Market Price Trend Analysis (Explainable Rule-Based Logic)
 */
const getMarketPriceSummary = async (cropId, economicCentreId = null) => {
  const latest = await getLatestMarketPrice(cropId, economicCentreId);

  if (!latest) {
    return {
      hasData: false,
      trend: 'insufficient_data',
      latestPrice: null,
      average7: null,
      average30: null,
      minPrice: null,
      maxPrice: null,
      percentageChange: 0,
      explanation: 'No historical market price records found for the selected crop.'
    };
  }

  const latestPrice = latest.averagePrice;
  const now = new Date(latest.date);

  // 7-day range
  const date7DaysAgo = new Date(now);
  date7DaysAgo.setDate(date7DaysAgo.getDate() - 7);

  // 30-day range
  const date30DaysAgo = new Date(now);
  date30DaysAgo.setDate(date30DaysAgo.getDate() - 30);

  const query30 = {
    cropId,
    date: { $gte: date30DaysAgo, $lte: now }
  };
  if (economicCentreId) query30.economicCentreId = economicCentreId;

  const records30 = await MarketPrice.find(query30).sort({ date: 1 });

  if (records30.length === 0) {
    return {
      hasData: true,
      trend: 'stable',
      latestPrice,
      average7: latestPrice,
      average30: latestPrice,
      minPrice: latest.minPrice,
      maxPrice: latest.maxPrice,
      percentageChange: 0,
      explanation: 'Historical Market Price Trend Analysis based on latest single record.'
    };
  }

  const prices30 = records30.map(r => r.averagePrice);
  const minPrice = Math.min(...records30.map(r => r.minPrice));
  const maxPrice = Math.max(...records30.map(r => r.maxPrice));
  const sum30 = prices30.reduce((a, b) => a + b, 0);
  const average30 = Number((sum30 / prices30.length).toFixed(2));

  const records7 = records30.filter(r => new Date(r.date) >= date7DaysAgo);
  const prices7 = records7.map(r => r.averagePrice);
  const average7 = prices7.length > 0
    ? Number((prices7.reduce((a, b) => a + b, 0) / prices7.length).toFixed(2))
    : average30;

  // Percentage change relative to 30-day average
  const percentageChange = average30 > 0
    ? Number((((latestPrice - average30) / average30) * 100).toFixed(2))
    : 0;

  let trend = 'stable';
  let explanation = `Historical Market Price Trend Analysis: Average price of Rs. ${latestPrice}/kg is stable compared to the 30-day benchmark (Rs. ${average30}/kg).`;

  if (percentageChange > MARKET_TREND_THRESHOLDS.INCREASING_MIN) {
    trend = 'increasing';
    explanation = `Historical Market Price Trend Analysis: Average price of Rs. ${latestPrice}/kg is ${percentageChange}% higher than the 30-day average of Rs. ${average30}/kg, indicating an increasing trend.`;
  } else if (percentageChange < MARKET_TREND_THRESHOLDS.DECREASING_MAX) {
    trend = 'decreasing';
    explanation = `Historical Market Price Trend Analysis: Average price of Rs. ${latestPrice}/kg is ${Math.abs(percentageChange)}% lower than the 30-day average of Rs. ${average30}/kg, indicating a decreasing trend.`;
  }

  return {
    hasData: true,
    latestPrice,
    average7,
    average30,
    minPrice,
    maxPrice,
    percentageChange,
    trend,
    explanation,
    recordsAnalyzed: records30.length
  };
};

/**
 * Import Market Prices from CSV content
 */
const importMarketPricesCSV = async (csvRows, userId) => {
  let rowsReceived = csvRows.length;
  let rowsImported = 0;
  let rowsFailed = 0;
  const errors = [];

  for (let index = 0; index < csvRows.length; index++) {
    const row = csvRows[index];
    const rowNum = index + 1;

    try {
      const { cropName, centreName, date, minPrice, maxPrice, averagePrice, unit = 'kg', source = 'import' } = row;

      if (!cropName || !centreName || !date || minPrice === undefined || maxPrice === undefined) {
        rowsFailed++;
        errors.push({ row: rowNum, error: 'Missing required columns (cropName, centreName, date, minPrice, maxPrice)' });
        continue;
      }

      const numMin = Number(minPrice);
      const numMax = Number(maxPrice);
      const numAvg = averagePrice !== undefined ? Number(averagePrice) : Number(((numMin + numMax) / 2).toFixed(2));

      if (isNaN(numMin) || isNaN(numMax) || numMin < 0 || numMax < numMin) {
        rowsFailed++;
        errors.push({ row: rowNum, error: 'Invalid price values: minPrice and maxPrice must be valid non-negative numbers where maxPrice >= minPrice' });
        continue;
      }

      // Resolve crop
      let crop = await Crop.findOne({ 'name.en': new RegExp(`^${cropName.trim()}$`, 'i') });
      if (!crop) {
        rowsFailed++;
        errors.push({ row: rowNum, error: `Crop not found with name '${cropName}'` });
        continue;
      }

      // Resolve economic centre
      let centre = await EconomicCentre.findOne({ name: new RegExp(`^${centreName.trim()}$`, 'i') });
      if (!centre) {
        rowsFailed++;
        errors.push({ row: rowNum, error: `Economic Centre not found with name '${centreName}'` });
        continue;
      }

      const recordDate = new Date(date);
      if (isNaN(recordDate.getTime())) {
        rowsFailed++;
        errors.push({ row: rowNum, error: `Invalid date format '${date}'` });
        continue;
      }

      // Upsert daily market record
      await MarketPrice.findOneAndUpdate(
        { cropId: crop._id, economicCentreId: centre._id, date: recordDate },
        {
          cropId: crop._id,
          economicCentreId: centre._id,
          date: recordDate,
          minPrice: numMin,
          maxPrice: numMax,
          averagePrice: numAvg,
          unit,
          source,
          createdBy: userId
        },
        { upsert: true, new: true }
      );

      rowsImported++;
    } catch (err) {
      rowsFailed++;
      errors.push({ row: rowNum, error: err.message });
    }
  }

  return {
    rowsReceived,
    rowsImported,
    rowsFailed,
    errorsSummary: errors
  };
};

module.exports = {
  getLatestMarketPrice,
  getMarketPriceHistory,
  getMarketPriceSummary,
  importMarketPricesCSV
};
