const Feedback = require('../models/Feedback');
const { successResponse, errorResponse } = require('../utils/responseHandler');

const submitFeedback = async (req, res, next) => {
  try {
    const { category, message, rating, farmerName, mobile } = req.body;

    if (!message) {
      return errorResponse(res, 400, 'Feedback message is required');
    }

    const feedbackData = {
      category: category || 'general',
      message,
      rating: rating ? Number(rating) : undefined,
      farmerName: farmerName || (req.user ? req.user.fullName : undefined),
      mobile: mobile || (req.user ? req.user.mobile : undefined),
      farmerId: req.user ? req.user._id : undefined
    };

    const feedback = await Feedback.create(feedbackData);
    return successResponse(res, 201, 'Feedback submitted successfully', feedback);
  } catch (err) {
    next(err);
  }
};

const getFarmerFeedbacks = async (req, res, next) => {
  try {
    const query = req.user ? { farmerId: req.user._id } : {};
    const feedbacks = await Feedback.find(query).sort({ createdAt: -1 }).limit(50);
    return successResponse(res, 200, 'Feedback list retrieved', feedbacks);
  } catch (err) {
    next(err);
  }
};

const adminGetFeedbacks = async (req, res, next) => {
  try {
    const { status, category, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;

    const skip = (Number(page) - 1) * Number(limit);
    const totalItems = await Feedback.countDocuments(query);
    const items = await Feedback.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('farmerId', 'fullName mobile district');

    return successResponse(res, 200, 'Admin feedback list retrieved', {
      items,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalItems,
        totalPages: Math.ceil(totalItems / Number(limit))
      }
    });
  } catch (err) {
    next(err);
  }
};

const adminUpdateFeedbackStatus = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return errorResponse(res, 404, 'Feedback record not found');
    }

    if (status) feedback.status = status;
    if (adminNotes !== undefined) feedback.adminNotes = adminNotes;

    await feedback.save();
    return successResponse(res, 200, 'Feedback status updated', feedback);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  submitFeedback,
  getFarmerFeedbacks,
  adminGetFeedbacks,
  adminUpdateFeedbackStatus
};
