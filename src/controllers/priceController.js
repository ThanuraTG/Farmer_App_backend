const PriceRecord = require('../models/PriceRecord');
const Product = require('../models/Product');
const Area = require('../models/Area');

// @desc    Get price records (with filters)
// @route   GET /api/prices
// @access  Private
const getPrices = async (req, res) => {
  const { areaId, productId, month, year } = req.query;
  const filter = {};

  if (areaId) filter.areaId = areaId;
  if (productId) filter.productId = productId;
  if (month) filter.month = parseInt(month, 10);
  if (year) filter.year = parseInt(year, 10);

  try {
    const prices = await PriceRecord.find(filter)
      .populate('product')
      .populate('area')
      .sort({ year: -1, month: -1 });
    
    return res.json(prices);
  } catch (error) {
    console.error('Error fetching price records:', error);
    return res.status(500).json({ message: 'Server error fetching price records', error: error.message });
  }
};

// @desc    Create a new price record
// @route   POST /api/prices
// @access  Private
const createPrice = async (req, res) => {
  const { productId, areaId, originalPrice, areaPrice, month, year } = req.body;

  if (!productId || !areaId || originalPrice === undefined || areaPrice === undefined || !month || !year) {
    return res.status(400).json({ message: 'Please provide all fields: productId, areaId, originalPrice, areaPrice, month, and year' });
  }

  const parsedMonth = parseInt(month, 10);
  const parsedYear = parseInt(year, 10);
  const origPrice = parseFloat(originalPrice);
  const arPrice = parseFloat(areaPrice);

  if (parsedMonth < 1 || parsedMonth > 12) {
    return res.status(400).json({ message: 'Month must be between 1 and 12' });
  }

  try {
    // Check unique constraint
    const recordExists = await PriceRecord.findOne({
      productId,
      areaId,
      month: parsedMonth,
      year: parsedYear
    });

    if (recordExists) {
      return res.status(400).json({ message: 'A price record already exists for this product in this area, month, and year. Please update that record instead.' });
    }

    // Verify product and area exist
    const [product, area] = await Promise.all([
      Product.findById(productId),
      Area.findById(areaId)
    ]);

    if (!product || !area) {
      return res.status(400).json({ message: 'Invalid product ID or area ID' });
    }

    let priceRecord = await PriceRecord.create({
      productId,
      areaId,
      originalPrice: origPrice,
      areaPrice: arPrice,
      month: parsedMonth,
      year: parsedYear
    });

    // Populate and return
    priceRecord = await priceRecord.populate(['product', 'area']);

    return res.status(201).json(priceRecord);
  } catch (error) {
    console.error('Error creating price record:', error);
    return res.status(500).json({ message: 'Server error creating price record', error: error.message });
  }
};

// @desc    Update a price record
// @route   PUT /api/prices/:id
// @access  Private
const updatePrice = async (req, res) => {
  const { id } = req.params;
  const { originalPrice, areaPrice, month, year } = req.body;

  try {
    const record = await PriceRecord.findById(id);

    if (!record) {
      return res.status(404).json({ message: 'Price record not found' });
    }

    if (originalPrice !== undefined) record.originalPrice = parseFloat(originalPrice);
    if (areaPrice !== undefined) record.areaPrice = parseFloat(areaPrice);
    if (month !== undefined) {
      const parsedMonth = parseInt(month, 10);
      if (parsedMonth < 1 || parsedMonth > 12) {
        return res.status(400).json({ message: 'Month must be between 1 and 12' });
      }
      record.month = parsedMonth;
    }
    if (year !== undefined) record.year = parseInt(year, 10);

    let updatedRecord = await record.save();
    updatedRecord = await updatedRecord.populate(['product', 'area']);

    return res.json(updatedRecord);
  } catch (error) {
    console.error('Error updating price record:', error);
    return res.status(500).json({ message: 'Server error updating price record', error: error.message });
  }
};

// @desc    Delete a price record
// @route   DELETE /api/prices/:id
// @access  Private
const deletePrice = async (req, res) => {
  const { id } = req.params;

  try {
    const record = await PriceRecord.findById(id);

    if (!record) {
      return res.status(404).json({ message: 'Price record not found' });
    }

    await PriceRecord.findByIdAndDelete(id);

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
