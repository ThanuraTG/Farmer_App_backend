const Area = require('../models/Area');
const PriceRecord = require('../models/PriceRecord');
const DemandRecord = require('../models/DemandRecord');

// @desc    Get all areas
// @route   GET /api/areas
// @access  Private
const getAreas = async (req, res) => {
  try {
    const areas = await Area.find({}).sort({
      province: 'asc',
      district: 'asc',
      city: 'asc'
    });
    return res.json(areas);
  } catch (error) {
    console.error('Error fetching areas:', error);
    return res.status(500).json({ message: 'Server error fetching areas', error: error.message });
  }
};

// @desc    Create a new area
// @route   POST /api/areas
// @access  Private/Admin
const createArea = async (req, res) => {
  const { province, district, city } = req.body;

  if (!province || !district || !city) {
    return res.status(400).json({ message: 'Please provide province, district, and city' });
  }

  try {
    // Check if area already exists (case-insensitive)
    const areaExists = await Area.findOne({
      province: { $regex: new RegExp(`^${province}$`, 'i') },
      district: { $regex: new RegExp(`^${district}$`, 'i') },
      city: { $regex: new RegExp(`^${city}$`, 'i') }
    });

    if (areaExists) {
      return res.status(400).json({ message: 'This area (province, district, city combination) already exists' });
    }

    const area = await Area.create({ province, district, city });

    return res.status(201).json(area);
  } catch (error) {
    console.error('Error creating area:', error);
    return res.status(500).json({ message: 'Server error creating area', error: error.message });
  }
};

// @desc    Update an area
// @route   PUT /api/areas/:id
// @access  Private/Admin
const updateArea = async (req, res) => {
  const { id } = req.params;
  const { province, district, city } = req.body;

  try {
    const area = await Area.findById(id);

    if (!area) {
      return res.status(404).json({ message: 'Area not found' });
    }

    if (province) area.province = province;
    if (district) area.district = district;
    if (city) area.city = city;

    const updatedArea = await area.save();

    return res.json(updatedArea);
  } catch (error) {
    console.error('Error updating area:', error);
    return res.status(500).json({ message: 'Server error updating area', error: error.message });
  }
};

// @desc    Delete an area (Cascading delete)
// @route   DELETE /api/areas/:id
// @access  Private/Admin
const deleteArea = async (req, res) => {
  const { id } = req.params;

  try {
    const area = await Area.findById(id);

    if (!area) {
      return res.status(404).json({ message: 'Area not found' });
    }

    // Cascade delete related records
    await Promise.all([
      PriceRecord.deleteMany({ areaId: id }),
      DemandRecord.deleteMany({ areaId: id }),
      Area.findByIdAndDelete(id)
    ]);

    return res.json({ message: 'Area and related price/demand records deleted successfully' });
  } catch (error) {
    console.error('Error deleting area:', error);
    return res.status(500).json({ message: 'Server error deleting area', error: error.message });
  }
};

module.exports = {
  getAreas,
  createArea,
  updateArea,
  deleteArea
};
