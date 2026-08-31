const ContentGuideline = require('../models/ContentGuideline');
const Advisory = require('../models/Advisory');
const { successResponse, errorResponse } = require('../utils/responseHandler');

const getContentGuidelines = async (req, res, next) => {
  try {
    const { category, cropId } = req.query;
    const query = { published: true };
    if (category) query.category = category;
    if (cropId) query.targetCrops = cropId;

    let guidelines = await ContentGuideline.find(query)
      .populate('targetCrops', 'name nameSinhala nameTamil category')
      .sort({ createdAt: -1 });

    // Fallback to Advisories if guidelines collection is currently empty
    if (guidelines.length === 0) {
      const advisories = await Advisory.find({ active: true })
        .populate('cropId', 'name nameSinhala nameTamil')
        .sort({ createdAt: -1 });

      guidelines = advisories.map(a => ({
        _id: a._id,
        title: a.title,
        category: a.category || 'crop_care',
        targetCrops: a.cropId ? [a.cropId] : [],
        summary: a.summary || a.message,
        content: a.message || a.summary,
        published: a.active,
        createdAt: a.createdAt
      }));
    }

    return successResponse(res, 200, 'Content guidelines retrieved', guidelines);
  } catch (err) {
    next(err);
  }
};

const getContentGuidelineById = async (req, res, next) => {
  try {
    let guideline = await ContentGuideline.findById(req.params.id)
      .populate('targetCrops', 'name nameSinhala nameTamil category');

    if (!guideline) {
      const advisory = await Advisory.findById(req.params.id).populate('cropId', 'name nameSinhala nameTamil');
      if (advisory) {
        guideline = {
          _id: advisory._id,
          title: advisory.title,
          category: advisory.category || 'crop_care',
          targetCrops: advisory.cropId ? [advisory.cropId] : [],
          summary: advisory.summary || advisory.message,
          content: advisory.message || advisory.summary,
          published: advisory.active,
          createdAt: advisory.createdAt
        };
      }
    }

    if (!guideline) {
      return errorResponse(res, 404, 'Content guideline not found');
    }

    return successResponse(res, 200, 'Content guideline details retrieved', guideline);
  } catch (err) {
    next(err);
  }
};

const adminGetContentGuidelines = async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const totalItems = await ContentGuideline.countDocuments(query);
    const items = await ContentGuideline.find(query)
      .populate('targetCrops', 'name nameSinhala')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return successResponse(res, 200, 'Admin content guidelines list retrieved', {
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

const adminCreateContentGuideline = async (req, res, next) => {
  try {
    const { title, category, targetCrops, summary, content, published } = req.body;
    if (!title || !content) {
      return errorResponse(res, 400, 'Title and content body are required');
    }

    const guideline = await ContentGuideline.create({
      title,
      category: category || 'general_guideline',
      targetCrops: Array.isArray(targetCrops) ? targetCrops : [],
      summary,
      content,
      published: published !== undefined ? published : true,
      createdBy: req.user ? req.user._id : undefined
    });

    return successResponse(res, 201, 'Content guideline created successfully', guideline);
  } catch (err) {
    next(err);
  }
};

const adminUpdateContentGuideline = async (req, res, next) => {
  try {
    const { title, category, targetCrops, summary, content, published } = req.body;
    const guideline = await ContentGuideline.findById(req.params.id);

    if (!guideline) {
      return errorResponse(res, 404, 'Content guideline not found');
    }

    if (title) guideline.title = title;
    if (category) guideline.category = category;
    if (targetCrops !== undefined) guideline.targetCrops = targetCrops;
    if (summary !== undefined) guideline.summary = summary;
    if (content) guideline.content = content;
    if (published !== undefined) guideline.published = published;

    await guideline.save();
    return successResponse(res, 200, 'Content guideline updated successfully', guideline);
  } catch (err) {
    next(err);
  }
};

const adminDeleteContentGuideline = async (req, res, next) => {
  try {
    const guideline = await ContentGuideline.findByIdAndDelete(req.params.id);
    if (!guideline) {
      return errorResponse(res, 404, 'Content guideline not found');
    }

    return successResponse(res, 200, 'Content guideline deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getContentGuidelines,
  getContentGuidelineById,
  adminGetContentGuidelines,
  adminCreateContentGuideline,
  adminUpdateContentGuideline,
  adminDeleteContentGuideline
};
