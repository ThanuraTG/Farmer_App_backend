const Market = require('../models/Market');

// @desc    Get all markets
// @route   GET /api/markets
// @access  Public
const getMarkets = async (req, res) => {
  try {
    const markets = await Market.find({ isActive: true }).sort({ name: 1 });
    return res.json({
      success: true,
      count: markets.length,
      data: markets
    });
  } catch (error) {
    console.error('Error fetching markets:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching markets', error: error.message });
  }
};

// @desc    Create a new market
// @route   POST /api/markets
// @access  Private (Admin/Staff)
const createMarket = async (req, res) => {
  const { name, nameSi, district, province } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: 'Market name is required' });
  }

  try {
    const slug = name.trim().toLowerCase().replace(/\s+/g, '-');
    const existing = await Market.findOne({ slug });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Market already exists' });
    }

    const market = await Market.create({
      name: name.trim(),
      nameSi: nameSi ? nameSi.trim() : name.trim(),
      district: district ? district.trim() : '',
      province: province ? province.trim() : '',
      slug,
      isActive: true
    });

    return res.status(201).json({ success: true, data: market });
  } catch (error) {
    console.error('Error creating market:', error);
    return res.status(500).json({ success: false, message: 'Server error creating market', error: error.message });
  }
};

module.exports = {
  getMarkets,
  createMarket
};
