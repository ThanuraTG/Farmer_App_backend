const DemandRecord = require('../models/DemandRecord');
const Product = require('../models/Product');
const Area = require('../models/Area');

// @desc    Get demand & stock records (with filters)
// @route   GET /api/demand
// @access  Private
const getDemands = async (req, res) => {
  const { areaId, productId, month, year } = req.query;
  const filter = {};

  if (areaId) filter.areaId = areaId;
  if (productId) filter.productId = productId;
  if (month) filter.month = parseInt(month, 10);
  if (year) filter.year = parseInt(year, 10);

  try {
    const demands = await DemandRecord.find(filter)
      .populate('product')
      .populate('area')
      .sort({ year: -1, month: -1 });

    return res.json(demands);
  } catch (error) {
    console.error('Error fetching demand records:', error);
    return res.status(500).json({ message: 'Server error fetching demand records', error: error.message });
  }
};

// @desc    Create a new demand & stock record
// @route   POST /api/demand
// @access  Private
const createDemand = async (req, res) => {
  const { productId, areaId, demandQty, stockQty, productionQty, month, year } = req.body;

  if (
    !productId ||
    !areaId ||
    demandQty === undefined ||
    stockQty === undefined ||
    productionQty === undefined ||
    !month ||
    !year
  ) {
    return res.status(400).json({
      message: 'Please provide all fields: productId, areaId, demandQty, stockQty, productionQty, month, and year'
    });
  }

  const parsedMonth = parseInt(month, 10);
  const parsedYear = parseInt(year, 10);
  const dQty = parseFloat(demandQty);
  const sQty = parseFloat(stockQty);
  const pQty = parseFloat(productionQty);

  if (parsedMonth < 1 || parsedMonth > 12) {
    return res.status(400).json({ message: 'Month must be between 1 and 12' });
  }

  try {
    // Check if the record already exists
    const recordExists = await DemandRecord.findOne({
      productId,
      areaId,
      month: parsedMonth,
      year: parsedYear
    });

    if (recordExists) {
      return res.status(400).json({
        message: 'A demand record already exists for this product in this area, month, and year. Please update that record instead.'
      });
    }

    // Verify product and area exist
    const [product, area] = await Promise.all([
      Product.findById(productId),
      Area.findById(areaId)
    ]);

    if (!product || !area) {
      return res.status(400).json({ message: 'Invalid product ID or area ID' });
    }

    let demandRecord = await DemandRecord.create({
      productId,
      areaId,
      demandQty: dQty,
      stockQty: sQty,
      productionQty: pQty,
      month: parsedMonth,
      year: parsedYear
    });

    demandRecord = await demandRecord.populate(['product', 'area']);

    return res.status(201).json(demandRecord);
  } catch (error) {
    console.error('Error creating demand record:', error);
    return res.status(500).json({ message: 'Server error creating demand record', error: error.message });
  }
};

// @desc    Update a demand & stock record
// @route   PUT /api/demand/:id
// @access  Private
const updateDemand = async (req, res) => {
  const { id } = req.params;
  const { demandQty, stockQty, productionQty, month, year } = req.body;

  try {
    const record = await DemandRecord.findById(id);

    if (!record) {
      return res.status(404).json({ message: 'Demand record not found' });
    }

    if (demandQty !== undefined) record.demandQty = parseFloat(demandQty);
    if (stockQty !== undefined) record.stockQty = parseFloat(stockQty);
    if (productionQty !== undefined) record.productionQty = parseFloat(productionQty);
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
    console.error('Error updating demand record:', error);
    return res.status(500).json({ message: 'Server error updating demand record', error: error.message });
  }
};

// @desc    Delete a demand & stock record
// @route   DELETE /api/demand/:id
// @access  Private
const deleteDemand = async (req, res) => {
  const { id } = req.params;

  try {
    const record = await DemandRecord.findById(id);

    if (!record) {
      return res.status(404).json({ message: 'Demand record not found' });
    }

    await DemandRecord.findByIdAndDelete(id);

    return res.json({ message: 'Demand record deleted successfully' });
  } catch (error) {
    console.error('Error deleting demand record:', error);
    return res.status(500).json({ message: 'Server error deleting demand record', error: error.message });
  }
};

module.exports = {
  getDemands,
  createDemand,
  updateDemand,
  deleteDemand
};
