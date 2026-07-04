const MarketPrice = require('../models/MarketPrice');
const Crop = require('../models/Crop');
const { logAdminAction } = require('../services/adminLogService');

// @desc    Get market prices (with optional filters)
// @route   GET /api/prices
// @access  Public
const getPrices = async (req, res) => {
  const { crop_id, location } = req.query;
  const filter = {};

  if (crop_id) filter.crop_id = crop_id;
  if (location) {
    // Partial case-insensitive match for market location
    filter.market_location = { $regex: location, $options: 'i' };
  }

  try {
    const prices = await MarketPrice.find(filter)
      .populate('crop_id', 'name category image_url')
      .populate('added_by_user_id', 'username email')
      .sort({ price_date: -1, createdAt: -1 });
    
    return res.json(prices);
  } catch (error) {
    console.error('Error fetching price records:', error);
    return res.status(500).json({ message: 'Server error fetching price records', error: error.message });
  }
};

// @desc    Create a new price record
// @route   POST /api/prices
// @access  Private (Staff/Admin)
const createPrice = async (req, res) => {
  const { crop_id, price_per_kg, market_location, price_date } = req.body;

  if (!crop_id || price_per_kg === undefined || !market_location || !price_date) {
    return res.status(400).json({ message: 'Please provide crop_id, price_per_kg, market_location, and price_date' });
  }

  try {
    // Verify crop exists
    const crop = await Crop.findById(crop_id);
    if (!crop) {
      return res.status(400).json({ message: 'Invalid crop ID' });
    }

    const priceRecord = await MarketPrice.create({
      crop_id,
      price_per_kg: parseFloat(price_per_kg),
      market_location,
      price_date: new Date(price_date),
      added_by_user_id: req.user.user_id || req.user._id
    });

    const populated = await MarketPrice.findById(priceRecord._id)
      .populate('crop_id', 'name category')
      .populate('added_by_user_id', 'username email');

    // Log admin action
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

    // Log admin action
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

    // Log admin action
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
  createPrice,
  updatePrice,
  deletePrice
};
