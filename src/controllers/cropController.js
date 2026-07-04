const Crop = require('../models/Crop');
const CropDetail = require('../models/CropDetail');
const MarketPrice = require('../models/MarketPrice');
const SavedCrop = require('../models/SavedCrop');
const { logAdminAction } = require('../services/adminLogService');

// @desc    Get all crops
// @route   GET /api/crops
// @access  Public
const getCrops = async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = {};

    if (category) {
      query.category = category;
    }
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const crops = await Crop.find(query).sort({ name: 'asc' });
    return res.json(crops);
  } catch (error) {
    console.error('Error fetching crops:', error);
    return res.status(500).json({ message: 'Server error fetching crops', error: error.message });
  }
};

// @desc    Get a single crop by ID
// @route   GET /api/crops/:id
// @access  Public
const getCropById = async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id);
    if (!crop) {
      return res.status(404).json({ message: 'Crop not found' });
    }
    return res.json(crop);
  } catch (error) {
    console.error('Error fetching crop by ID:', error);
    return res.status(500).json({ message: 'Server error fetching crop details', error: error.message });
  }
};

// @desc    Create a new crop
// @route   POST /api/crops
// @access  Private/Admin
const createCrop = async (req, res) => {
  const { name, category, description, season, image_url, detail } = req.body;

  if (!name || !category) {
    return res.status(400).json({ message: 'Please provide crop name and category' });
  }

  try {
    // Check if crop already exists
    const cropExists = await Crop.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (cropExists) {
      return res.status(400).json({ message: 'Crop with this name already exists' });
    }

    const crop = await Crop.create({
      name,
      category,
      description,
      season,
      image_url
    });

    // Create associated details if provided, otherwise create empty default
    const detailsContent = detail || {};
    await CropDetail.create({
      crop_id: crop._id,
      growing_tips: detailsContent.growing_tips || '',
      soil_type: detailsContent.soil_type || '',
      pest_management: detailsContent.pest_management || '',
      harvest_duration_days: parseInt(detailsContent.harvest_duration_days) || 90
    });

    // Log admin action
    if (req.user) {
      await logAdminAction(req.user.user_id || req.user._id, 'create', 'Crop', crop.crop_id);
    }

    return res.status(201).json(crop);
  } catch (error) {
    console.error('Error creating crop:', error);
    return res.status(500).json({ message: 'Server error creating crop', error: error.message });
  }
};

// @desc    Update a crop
// @route   PUT /api/crops/:id
// @access  Private/Admin
const updateCrop = async (req, res) => {
  const { id } = req.params;
  const { name, category, description, season, image_url } = req.body;

  try {
    const crop = await Crop.findById(id);

    if (!crop) {
      return res.status(404).json({ message: 'Crop not found' });
    }

    if (name) crop.name = name;
    if (category) crop.category = category;
    if (description !== undefined) crop.description = description;
    if (season !== undefined) crop.season = season;
    if (image_url !== undefined) crop.image_url = image_url;

    const updatedCrop = await crop.save();

    // Log admin action
    if (req.user) {
      await logAdminAction(req.user.user_id || req.user._id, 'update', 'Crop', updatedCrop.crop_id);
    }

    return res.json(updatedCrop);
  } catch (error) {
    console.error('Error updating crop:', error);
    return res.status(500).json({ message: 'Server error updating crop', error: error.message });
  }
};

// @desc    Delete a crop (Cascading delete)
// @route   DELETE /api/crops/:id
// @access  Private/Admin
const deleteCrop = async (req, res) => {
  const { id } = req.params;

  try {
    const crop = await Crop.findById(id);

    if (!crop) {
      return res.status(404).json({ message: 'Crop not found' });
    }

    // Cascade delete related records
    await Promise.all([
      CropDetail.deleteOne({ crop_id: id }),
      MarketPrice.deleteMany({ crop_id: id }),
      SavedCrop.deleteMany({ crop_id: id }),
      Crop.findByIdAndDelete(id)
    ]);

    // Log admin action
    if (req.user) {
      await logAdminAction(req.user.user_id || req.user._id, 'delete', 'Crop', id);
    }

    return res.json({ message: 'Crop and related details/prices deleted successfully' });
  } catch (error) {
    console.error('Error deleting crop:', error);
    return res.status(500).json({ message: 'Server error deleting crop', error: error.message });
  }
};

// @desc    Get crop details
// @route   GET /api/crops/:id/details
// @access  Public
const getCropDetails = async (req, res) => {
  try {
    let details = await CropDetail.findOne({ crop_id: req.params.id });
    
    // Fallback: If no details entry exists yet, create one reactively
    if (!details) {
      details = await CropDetail.create({
        crop_id: req.params.id,
        growing_tips: '',
        soil_type: '',
        pest_management: '',
        harvest_duration_days: 90
      });
    }

    return res.json(details);
  } catch (error) {
    console.error('Error fetching crop details:', error);
    return res.status(500).json({ message: 'Server error fetching crop details', error: error.message });
  }
};

// @desc    Update crop details
// @route   PUT /api/crops/:id/details
// @access  Private/Admin
const updateCropDetails = async (req, res) => {
  const { growing_tips, soil_type, pest_management, harvest_duration_days } = req.body;

  try {
    let details = await CropDetail.findOne({ crop_id: req.params.id });

    if (!details) {
      // Create if it doesn't exist
      details = new CropDetail({
        crop_id: req.params.id
      });
    }

    if (growing_tips !== undefined) details.growing_tips = growing_tips;
    if (soil_type !== undefined) details.soil_type = soil_type;
    if (pest_management !== undefined) details.pest_management = pest_management;
    if (harvest_duration_days !== undefined) details.harvest_duration_days = parseInt(harvest_duration_days);

    const updatedDetails = await details.save();

    // Log admin action
    if (req.user) {
      await logAdminAction(req.user.user_id || req.user._id, 'update', 'CropDetail', updatedDetails.detail_id);
    }

    return res.json(updatedDetails);
  } catch (error) {
    console.error('Error updating crop details:', error);
    return res.status(500).json({ message: 'Server error updating crop details', error: error.message });
  }
};

module.exports = {
  getCrops,
  getCropById,
  createCrop,
  updateCrop,
  deleteCrop,
  getCropDetails,
  updateCropDetails
};
