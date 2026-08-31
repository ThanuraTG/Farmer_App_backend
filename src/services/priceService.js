const Price = require('../models/Price');
const Crop = require('../models/Crop');
const Market = require('../models/Market');
const Source = require('../models/Source');
const { normalizeCropName } = require('../utils/cropMapper');

/**
 * Service to handle market price aggregation and query filters
 */

async function getLatestPrices(filters = {}) {
  const query = {};

  if (filters.source) query.source = filters.source;
  if (filters.priceType) query.priceType = filters.priceType;

  // Fetch prices populated with Crop and Market details
  const prices = await Price.find(query)
    .populate('crop', 'name nameSi category unit slug')
    .populate('market', 'name nameSi district province slug')
    .sort({ date: -1, createdAt: -1 });

  // Map to deduplicate latest price per crop+market combination
  const latestMap = new Map();
  let latestSyncTime = new Date(0);

  for (const item of prices) {
    if (!item.crop || !item.market) continue;
    const key = `${item.crop._id.toString()}_${item.market._id.toString()}_${item.source}`;

    if (!latestMap.has(key)) {
      latestMap.set(key, item);
    }
    if (item.updatedAt && item.updatedAt > latestSyncTime) {
      latestSyncTime = item.updatedAt;
    }
  }

  const formattedData = Array.from(latestMap.values()).map(item => ({
    price_id: item.price_id || item._id.toString(),
    crop: item.crop.name,
    cropSi: item.crop.nameSi || item.crop.name,
    crop_id: { _id: item.crop._id, name: item.crop.name, category: item.crop.category || 'Vegetables' },
    market: item.market.name,
    marketSi: item.market.nameSi || item.market.name,
    market_location: item.market ? item.market.name : 'Unknown',
    price_per_kg: item.price?.average || item.price?.min || 0,
    price: item.price?.average || item.price?.min || 0,
    minPrice: item.price?.min || item.price?.average || 0,
    maxPrice: item.price?.max || item.price?.average || 0,
    price_date: item.date || item.createdAt,
    unit: item.unit || 'kg',
    currency: item.currency || 'LKR',
    priceType: item.priceType || 'Wholesale',
    source: item.source,
    sourceDate: item.date ? item.date.toISOString().split('T')[0] : null,
    lastSynced: item.updatedAt ? item.updatedAt.toISOString() : item.createdAt.toISOString()
  }));

  return {
    success: true,
    updatedAt: latestSyncTime > new Date(0) ? latestSyncTime.toISOString() : new Date().toISOString(),
    count: formattedData.length,
    data: formattedData
  };
}

async function getPricesByCrop(cropParam) {
  const normKey = normalizeCropName(cropParam);
  const crop = await Crop.findOne({
    $or: [
      { slug: normKey },
      { name: new RegExp(`^${cropParam}$`, 'i') },
      { nameSi: cropParam }
    ]
  });

  if (!crop) {
    return { success: false, message: `Crop '${cropParam}' not found`, data: [] };
  }

  const prices = await Price.find({ crop: crop._id })
    .populate('crop', 'name nameSi unit')
    .populate('market', 'name nameSi district')
    .sort({ date: -1 });

  const marketMap = new Map();
  for (const item of prices) {
    if (!item.market) continue;
    const mId = item.market._id.toString();
    if (!marketMap.has(mId)) {
      marketMap.set(mId, item);
    }
  }

  const data = Array.from(marketMap.values()).map(item => ({
    crop: item.crop.name,
    cropSi: item.crop.nameSi || item.crop.name,
    market: item.market.name,
    marketSi: item.market.nameSi || item.market.name,
    price: item.price?.average || 0,
    minPrice: item.price?.min || 0,
    maxPrice: item.price?.max || 0,
    unit: item.unit || 'kg',
    currency: item.currency || 'LKR',
    source: item.source,
    sourceDate: item.date ? item.date.toISOString().split('T')[0] : null
  }));

  return {
    success: true,
    crop: crop.name,
    cropSi: crop.nameSi || crop.name,
    count: data.length,
    data
  };
}

async function getPricesByMarket(marketParam) {
  const slug = marketParam.trim().toLowerCase().replace(/\s+/g, '-');
  const market = await Market.findOne({
    $or: [
      { slug: slug },
      { name: new RegExp(`^${marketParam}$`, 'i') },
      { nameSi: marketParam }
    ]
  });

  if (!market) {
    return { success: false, message: `Market '${marketParam}' not found`, data: [] };
  }

  const prices = await Price.find({ market: market._id })
    .populate('crop', 'name nameSi unit')
    .populate('market', 'name nameSi district')
    .sort({ date: -1 });

  const cropMapLocal = new Map();
  for (const item of prices) {
    if (!item.crop) continue;
    const cId = item.crop._id.toString();
    if (!cropMapLocal.has(cId)) {
      cropMapLocal.set(cId, item);
    }
  }

  const data = Array.from(cropMapLocal.values()).map(item => ({
    crop: item.crop.name,
    cropSi: item.crop.nameSi || item.crop.name,
    market: item.market.name,
    marketSi: item.market.nameSi || item.market.name,
    price: item.price?.average || 0,
    minPrice: item.price?.min || 0,
    maxPrice: item.price?.max || 0,
    unit: item.unit || 'kg',
    currency: item.currency || 'LKR',
    source: item.source,
    sourceDate: item.date ? item.date.toISOString().split('T')[0] : null
  }));

  return {
    success: true,
    market: market.name,
    marketSi: market.nameSi || market.name,
    count: data.length,
    data
  };
}

async function getPriceHistory(cropParam, marketParam) {
  let cropObj = null;
  let marketObj = null;

  if (cropParam) {
    const normKey = normalizeCropName(cropParam);
    cropObj = await Crop.findOne({
      $or: [
        { slug: normKey },
        { name: new RegExp(`^${cropParam}$`, 'i') },
        { nameSi: cropParam }
      ]
    });
  }

  if (marketParam) {
    const slug = marketParam.trim().toLowerCase().replace(/\s+/g, '-');
    marketObj = await Market.findOne({
      $or: [
        { slug: slug },
        { name: new RegExp(`^${marketParam}$`, 'i') },
        { nameSi: marketParam }
      ]
    });
  }

  const query = {};
  if (cropObj) query.crop = cropObj._id;
  if (marketObj) query.market = marketObj._id;

  const records = await Price.find(query)
    .populate('crop', 'name nameSi')
    .populate('market', 'name nameSi')
    .sort({ date: 1 })
    .limit(30);

  const formattedHistory = records.map(r => ({
    date: r.date ? r.date.toISOString().split('T')[0] : null,
    price: r.price?.average || 0,
    minPrice: r.price?.min || 0,
    maxPrice: r.price?.max || 0,
    source: r.source
  }));

  return {
    crop: cropObj ? cropObj.name : cropParam || 'All Crops',
    market: marketObj ? marketObj.name : marketParam || 'All Markets',
    data: formattedHistory
  };
}

module.exports = {
  getLatestPrices,
  getPricesByCrop,
  getPricesByMarket,
  getPriceHistory
};
