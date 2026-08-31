const Price = require('../models/Price');
const MarketPrice = require('../models/MarketPrice');
const Crop = require('../models/Crop');
const Market = require('../models/Market');
const { getLatestPrices, getPricesByCrop, getPricesByMarket, getPriceHistory } = require('../services/priceService');
const { runManualSync } = require('../jobs/priceSyncJob');
const { logAdminAction } = require('../services/adminLogService');

// @desc    Get latest prices across crops and markets
// @route   GET /api/prices/latest
// @access  Public
const getLatestPricesController = async (req, res) => {
  try {
    const result = await getLatestPrices(req.query);
    return res.json(result);
  } catch (error) {
    console.error('Error fetching latest market prices:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching latest prices', error: error.message });
  }
};

// @desc    Get prices by crop
// @route   GET /api/prices/crop/:crop
// @access  Public
const getPricesByCropController = async (req, res) => {
  const { crop } = req.params;
  try {
    const result = await getPricesByCrop(crop);
    return res.json(result);
  } catch (error) {
    console.error('Error fetching crop prices:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching crop prices', error: error.message });
  }
};

// @desc    Get prices by market
// @route   GET /api/prices/market/:market
// @access  Public
const getPricesByMarketController = async (req, res) => {
  const { market } = req.params;
  try {
    const result = await getPricesByMarket(market);
    return res.json(result);
  } catch (error) {
    console.error('Error fetching market prices:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching market prices', error: error.message });
  }
};

// @desc    Get historical price data for charts
// @route   GET /api/prices/history
// @access  Public
const getPriceHistoryController = async (req, res) => {
  const { crop, market } = req.query;
  try {
    const result = await getPriceHistory(crop, market);
    return res.json(result);
  } catch (error) {
    console.error('Error fetching price history:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching price history', error: error.message });
  }
};

// @desc    Get prices (with optional filters crop, market, date, location)
// @route   GET /api/prices
// @access  Public
const getPrices = async (req, res) => {
  const { crop, market, date, source, crop_id, location } = req.query;
  try {
    // If specific crop, market, or date query provided, query main Price collection
    if (crop || market || date || source) {
      const filter = {};
      if (source) filter.source = source;

      if (crop) {
        const cropObj = await Crop.findOne({
          $or: [
            { name: new RegExp(`^${crop}$`, 'i') },
            { slug: crop.toLowerCase() },
            { nameSi: crop }
          ]
        });
        if (cropObj) filter.crop = cropObj._id;
      }

      if (market) {
        const marketObj = await Market.findOne({
          $or: [
            { name: new RegExp(`^${market}$`, 'i') },
            { slug: market.toLowerCase() },
            { nameSi: market }
          ]
        });
        if (marketObj) filter.market = marketObj._id;
      }

      if (date) {
        const dateObj = new Date(date);
        if (!isNaN(dateObj.getTime())) {
          const start = new Date(dateObj);
          start.setUTCHours(0,0,0,0);
          const end = new Date(dateObj);
          end.setUTCHours(23,59,59,999);
          filter.date = { $gte: start, $lte: end };
        }
      }

      const priceRecords = await Price.find(filter)
        .populate('crop', 'name nameSi category unit')
        .populate('market', 'name nameSi district province')
        .sort({ date: -1 });

      const formatted = priceRecords.map(p => ({
        price_id: p._id.toString(),
        crop: p.crop ? p.crop.name : 'Unknown',
        cropSi: p.crop ? (p.crop.nameSi || p.crop.name) : 'Unknown',
        crop_id: { _id: p.crop ? p.crop._id : null, name: p.crop ? p.crop.name : 'Unknown', category: p.crop ? (p.crop.category || 'Vegetables') : 'Vegetables' },
        market: p.market ? p.market.name : 'Unknown',
        marketSi: p.market ? (p.market.nameSi || p.market.name) : 'Unknown',
        market_location: p.market ? p.market.name : 'Unknown',
        price_per_kg: p.price?.average || p.price?.min || 0,
        price: p.price?.average || 0,
        minPrice: p.price?.min || 0,
        maxPrice: p.price?.max || 0,
        price_date: p.date,
        unit: p.unit || 'kg',
        currency: p.currency || 'LKR',
        priceType: p.priceType || 'Wholesale',
        source: p.source,
        sourceDate: p.date ? p.date.toISOString().split('T')[0] : null
      }));

      return res.json({ success: true, count: formatted.length, data: formatted });
    }

    // Legacy MarketPrice fallback
    const legacyFilter = {};
    if (crop_id) legacyFilter.crop_id = crop_id;
    if (location) legacyFilter.market_location = { $regex: location, $options: 'i' };

    const legacyPrices = await MarketPrice.find(legacyFilter)
      .populate('crop_id', 'name category image_url')
      .populate('added_by_user_id', 'username email')
      .sort({ price_date: -1, createdAt: -1 });

    if (legacyPrices.length > 0) {
      return res.json(legacyPrices);
    }

    // Default to latest main price response if legacy is empty
    const result = await getLatestPrices();
    return res.json(result.data || []);
  } catch (error) {
    console.error('Error fetching price records:', error);
    return res.status(500).json({ message: 'Server error fetching price records', error: error.message });
  }
};

// @desc    Trigger manual sync for HARTI & CBSL scrapers
// @route   POST /api/prices/sync
// @access  Public / Admin
const syncPricesController = async (req, res) => {
  try {
    const result = await runManualSync();
    return res.json({
      success: true,
      message: 'HARTI and CBSL prices synchronization completed successfully.',
      result
    });
  } catch (error) {
    console.error('Error triggering manual sync:', error);
    return res.status(500).json({ success: false, message: 'Server error triggering price sync', error: error.message });
  }
};

// @desc    Create a manual price record
// @route   POST /api/prices
// @access  Private (Staff/Admin)
const createPrice = async (req, res) => {
  const { crop_id, price_per_kg, market_location, price_date } = req.body;

  if (!crop_id || price_per_kg === undefined || !market_location || !price_date) {
    return res.status(400).json({ message: 'Please provide crop_id, price_per_kg, market_location, and price_date' });
  }

  try {
    const crop = await Crop.findById(crop_id);
    if (!crop) {
      return res.status(400).json({ message: 'Invalid crop ID' });
    }

    const priceRecord = await MarketPrice.create({
      crop_id,
      price_per_kg: parseFloat(price_per_kg),
      market_location,
      price_date: new Date(price_date),
      added_by_user_id: req.user ? (req.user.user_id || req.user._id) : null
    });

    const populated = await MarketPrice.findById(priceRecord._id)
      .populate('crop_id', 'name category')
      .populate('added_by_user_id', 'username email');

    if (req.user) {
      await logAdminAction(req.user.user_id || req.user._id, 'create', 'MarketPrice', priceRecord.price_id);
    }

    return res.status(201).json(populated);
  } catch (error) {
    console.error('Error creating price record:', error);
    return res.status(500).json({ message: 'Server error creating price record', error: error.message });
  }
};

// @desc    Update a price record
// @route   PUT /api/prices/:id
// @access  Private (Staff/Admin)
const updatePrice = async (req, res) => {
  const { id } = req.params;
  const { price_per_kg, market_location, price_date } = req.body;

  try {
    const record = await MarketPrice.findById(id);
    if (!record) {
      return res.status(404).json({ message: 'Price record not found' });
    }

    if (price_per_kg !== undefined) record.price_per_kg = parseFloat(price_per_kg);
    if (market_location) record.market_location = market_location;
    if (price_date) record.price_date = new Date(price_date);

    const updatedRecord = await record.save();
    const populated = await MarketPrice.findById(updatedRecord._id)
      .populate('crop_id', 'name category')
      .populate('added_by_user_id', 'username');

    if (req.user) {
      await logAdminAction(req.user.user_id || req.user._id, 'update', 'MarketPrice', updatedRecord.price_id);
    }

    return res.json(populated);
  } catch (error) {
    console.error('Error updating price record:', error);
    return res.status(500).json({ message: 'Server error updating price record', error: error.message });
  }
};

// @desc    Delete a price record
// @route   DELETE /api/prices/:id
// @access  Private (Staff/Admin)
const deletePrice = async (req, res) => {
  const { id } = req.params;

  try {
    const record = await MarketPrice.findById(id);
    if (!record) {
      return res.status(404).json({ message: 'Price record not found' });
    }

    await MarketPrice.findByIdAndDelete(id);

    if (req.user) {
      await logAdminAction(req.user.user_id || req.user._id, 'delete', 'MarketPrice', id);
    }

    return res.json({ message: 'Price record deleted successfully' });
  } catch (error) {
    console.error('Error deleting price record:', error);
    return res.status(500).json({ message: 'Server error deleting price record', error: error.message });
  }
};

module.exports = {
  getPrices,
  getLatestPricesController,
  getPricesByCropController,
  getPricesByMarketController,
  getPriceHistoryController,
  syncPricesController,
  createPrice,
  updatePrice,
  deletePrice
};
