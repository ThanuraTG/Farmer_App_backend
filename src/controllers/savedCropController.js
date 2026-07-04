const SavedCrop = require('../models/SavedCrop');
const Crop = require('../models/Crop');

// @desc    Get user's saved/bookmarked crops
// @route   GET /api/users/:id/saved-crops
// @access  Private
const getUserSavedCrops = async (req, res) => {
  const userId = req.params.id;

  try {
    const savedCrops = await SavedCrop.find({ user_id: userId })
      .populate('crop_id')
      .sort({ saved_at: -1 });

    return res.json(savedCrops);
  } catch (error) {
    console.error('Error fetching saved crops:', error);
    return res.status(500).json({ message: 'Server error fetching saved crops', error: error.message });
  }
};

// @desc    Bookmark/Save a crop
// @route   POST /api/saved-crops
// @access  Private
const saveCrop = async (req, res) => {
  const { crop_id } = req.body;

  if (!crop_id) {
    return res.status(400).json({ message: 'Please provide crop_id' });
  }

  try {
    // Check if crop exists
    const crop = await Crop.findById(crop_id);
    if (!crop) {
      return res.status(404).json({ message: 'Crop not found' });
    }

    // Check if already saved
    const alreadySaved = await SavedCrop.findOne({
      user_id: req.user.user_id || req.user._id,
      crop_id
    });

    if (alreadySaved) {
      return res.status(400).json({ message: 'Crop is already bookmarked by this user' });
    }

    const saved = await SavedCrop.create({
      user_id: req.user.user_id || req.user._id,
      crop_id,
      saved_at: new Date()
    });

    const populated = await SavedCrop.findById(saved._id).populate('crop_id');

    return res.status(201).json(populated);
  } catch (error) {
    console.error('Error bookmarking crop:', error);
    return res.status(500).json({ message: 'Server error bookmarking crop', error: error.message });
  }
};

// @desc    Remove a saved/bookmarked crop
// @route   DELETE /api/saved-crops/:id
// @access  Private
const unsaveCrop = async (req, res) => {
  const { id } = req.params;

  try {
    const savedCrop = await SavedCrop.findById(id);

    if (!savedCrop) {
      return res.status(404).json({ message: 'Bookmarked crop not found' });
    }

    // Verify ownership
    if (savedCrop.user_id.toString() !== (req.user.user_id || req.user._id).toString()) {
      return res.status(403).json({ message: 'Unauthorized to remove this bookmark' });
    }

    await SavedCrop.findByIdAndDelete(id);

    return res.json({ message: 'Crop removed from saved list successfully' });
  } catch (error) {
    console.error('Error removing bookmarked crop:', error);
    return res.status(500).json({ message: 'Server error removing bookmark', error: error.message });
  }
};

module.exports = {
  getUserSavedCrops,
  saveCrop,
  unsaveCrop
};
