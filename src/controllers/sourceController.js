const Source = require('../models/Source');

// @desc    Get data sources status
// @route   GET /api/sources
// @access  Public
const getSources = async (req, res) => {
  try {
    const sources = await Source.find({}).sort({ name: 1 });
    return res.json({
      success: true,
      data: sources
    });
  } catch (error) {
    console.error('Error fetching sources:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching sources', error: error.message });
  }
};

module.exports = {
  getSources
};
