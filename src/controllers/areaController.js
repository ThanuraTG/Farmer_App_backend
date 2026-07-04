const Division = require('../models/Division');
const MarketPrice = require('../models/MarketPrice');
const WeatherRecord = require('../models/WeatherRecord');
const User = require('../models/User');
const { logAdminAction } = require('../services/adminLogService');

// @desc    Get all divisions (areas)
// @route   GET /api/areas
// @access  Public
const getAreas = async (req, res) => {
  try {
    const divisions = await Division.find({}).sort({ province: 'asc', name: 'asc' });
    return res.json(divisions);
  } catch (error) {
    console.error('Error fetching divisions:', error);
    return res.status(500).json({ message: 'Server error fetching divisions', error: error.message });
  }
};

// @desc    Create a new division (area)
// @route   POST /api/areas
// @access  Private/Admin
const createArea = async (req, res) => {
  const { name, province, latitude, longitude } = req.body;

  if (!name || !province || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ message: 'Please provide name, province, latitude, and longitude' });
  }

  try {
    // Check if division already exists
    const divisionExists = await Division.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      province: { $regex: new RegExp(`^${province}$`, 'i') }
    });

    if (divisionExists) {
      return res.status(400).json({ message: 'This division already exists' });
    }

    const division = await Division.create({
      name,
      province,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude)
    });

    // Log admin action
    if (req.user) {
      await logAdminAction(req.user.user_id || req.user._id, 'create', 'Division', division.division_id);
    }

    return res.status(201).json(division);
  } catch (error) {
    console.error('Error creating division:', error);
    return res.status(500).json({ message: 'Server error creating division', error: error.message });
  }
};

// @desc    Update a division (area)
// @route   PUT /api/areas/:id
// @access  Private/Admin
const updateArea = async (req, res) => {
  const { id } = req.params;
  const { name, province, latitude, longitude } = req.body;

  try {
    const division = await Division.findById(id);

    if (!division) {
      return res.status(404).json({ message: 'Division not found' });
    }

    if (name) division.name = name;
    if (province) division.province = province;
    if (latitude !== undefined) division.latitude = parseFloat(latitude);
    if (longitude !== undefined) division.longitude = parseFloat(longitude);

    const updatedDivision = await division.save();

    // Log admin action
    if (req.user) {
      await logAdminAction(req.user.user_id || req.user._id, 'update', 'Division', updatedDivision.division_id);
    }

    return res.json(updatedDivision);
  } catch (error) {
    console.error('Error updating division:', error);
    return res.status(500).json({ message: 'Server error updating division', error: error.message });
  }
};

// @desc    Delete a division (area)
// @route   DELETE /api/areas/:id
// @access  Private/Admin
const deleteArea = async (req, res) => {
  const { id } = req.params;

  try {
    const division = await Division.findById(id);

    if (!division) {
      return res.status(404).json({ message: 'Division not found' });
    }

    // Cascade delete related records
    await Promise.all([
      MarketPrice.deleteMany({ market_location: division.name }), // delete prices at this center if applicable
      WeatherRecord.deleteMany({ division_id: id }),
      User.updateMany({ division_id: id }, { $set: { division_id: null } }), // disassociate users
      Division.findByIdAndDelete(id)
    ]);

    // Log admin action
    if (req.user) {
      await logAdminAction(req.user.user_id || req.user._id, 'delete', 'Division', id);
    }

    return res.json({ message: 'Division and related records deleted successfully' });
  } catch (error) {
    console.error('Error deleting division:', error);
    return res.status(500).json({ message: 'Server error deleting division', error: error.message });
  }
};

module.exports = {
  getAreas,
  createArea,
  updateArea,
  deleteArea
};
