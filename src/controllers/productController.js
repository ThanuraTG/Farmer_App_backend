const Product = require('../models/Product');
const PriceRecord = require('../models/PriceRecord');
const DemandRecord = require('../models/DemandRecord');

// @desc    Get all products
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res) => {
  try {
    const products = await Product.find({}).sort({ name: 'asc' });
    return res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ message: 'Server error fetching products', error: error.message });
  }
};

// @desc    Create a new product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  const { name, category, unit } = req.body;

  if (!name || !category || !unit) {
    return res.status(400).json({ message: 'Please provide product name, category, and unit' });
  }

  try {
    // Check if product exists (case-insensitive)
    const productExists = await Product.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (productExists) {
      return res.status(400).json({ message: 'Product with this name already exists' });
    }

    const product = await Product.create({ name, category, unit });

    return res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    return res.status(500).json({ message: 'Server error creating product', error: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, category, unit } = req.body;

  try {
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (name) product.name = name;
    if (category) product.category = category;
    if (unit) product.unit = unit;

    const updatedProduct = await product.save();

    return res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({ message: 'Server error updating product', error: error.message });
  }
};

// @desc    Delete a product (Cascading delete)
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Cascade delete related records
    await Promise.all([
      PriceRecord.deleteMany({ productId: id }),
      DemandRecord.deleteMany({ productId: id }),
      Product.findByIdAndDelete(id)
    ]);

    return res.json({ message: 'Product and related price/demand records deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(500).json({ message: 'Server error deleting product', error: error.message });
  }
};

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct
};
