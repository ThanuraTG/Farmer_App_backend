const Area = require('../models/Area');
const Product = require('../models/Product');
const PriceRecord = require('../models/PriceRecord');
const DemandRecord = require('../models/DemandRecord');

// Helper to determine if an item is high price
const isHighPrice = (originalPrice, areaPrice) => {
  return areaPrice > originalPrice * 1.2; // 20% higher than original price
};

// Helper to determine if an item is low stock
const isLowStock = (demandQty, stockQty) => {
  return stockQty < demandQty; // Stock is lower than demand
};

// Helper to determine if an item is over-production
const isOverProduction = (demandQty, productionQty) => {
  return productionQty > demandQty * 1.2; // Production is 20% higher than demand
};

// @desc    Get dashboard summary statistics
// @route   GET /api/reports/summary
// @access  Private
const getSummary = async (req, res) => {
  try {
    const [
      totalAreas,
      totalProducts,
      priceRecords,
      demandRecords
    ] = await Promise.all([
      Area.countDocuments({}),
      Product.countDocuments({}),
      PriceRecord.find({}),
      DemandRecord.find({})
    ]);

    // Calculate dynamic alerts
    let highPriceCount = 0;
    priceRecords.forEach(record => {
      if (isHighPrice(record.originalPrice, record.areaPrice)) {
        highPriceCount++;
      }
    });

    let lowStockCount = 0;
    let overProductionCount = 0;
    demandRecords.forEach(record => {
      if (isLowStock(record.demandQty, record.stockQty)) {
        lowStockCount++;
      }
      if (isOverProduction(record.demandQty, record.productionQty)) {
        overProductionCount++;
      }
    });

    return res.json({
      areasCount: totalAreas,
      productsCount: totalProducts,
      priceRecordsCount: priceRecords.length,
      demandRecordsCount: demandRecords.length,
      highPriceCount,
      lowStockCount,
      overProductionCount
    });
  } catch (error) {
    console.error('Error fetching summary reports:', error);
    return res.status(500).json({ message: 'Server error generating summary reports', error: error.message });
  }
};

// @desc    Get price comparisons
// @route   GET /api/reports/price-comparison
// @access  Private
const getPriceComparison = async (req, res) => {
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

    const report = prices
      .filter(record => record.product && record.area) // Safe filter for un-orphaned rows
      .map(record => {
        const diff = record.areaPrice - record.originalPrice;
        const pctDiff = record.originalPrice > 0 ? (diff / record.originalPrice) * 100 : 0;
        const status = isHighPrice(record.originalPrice, record.areaPrice) ? 'HIGH' : 'NORMAL';

        return {
          id: record.id,
          productId: record.productId,
          productName: record.product.name,
          category: record.product.category,
          unit: record.product.unit,
          areaId: record.areaId,
          areaName: `${record.area.city}, ${record.area.district} (${record.area.province})`,
          originalPrice: record.originalPrice,
          areaPrice: record.areaPrice,
          priceDifference: diff,
          percentageDifference: pctDiff,
          month: record.month,
          year: record.year,
          status
        };
      });

    return res.json(report);
  } catch (error) {
    console.error('Error generating price comparison report:', error);
    return res.status(500).json({ message: 'Server error generating price comparison report', error: error.message });
  }
};

// @desc    Get demand analysis
// @route   GET /api/reports/demand-analysis
// @access  Private
const getDemandAnalysis = async (req, res) => {
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

    const report = demands
      .filter(record => record.product && record.area) // Safe filter
      .map(record => {
        const stockStatus = isLowStock(record.demandQty, record.stockQty) ? 'LOW STOCK' : 'SUFFICIENT';
        
        let productionStatus = 'BALANCED';
        if (isOverProduction(record.demandQty, record.productionQty)) {
          productionStatus = 'OVER PRODUCTION';
        } else if (record.productionQty < record.demandQty * 0.8) {
          productionStatus = 'SHORTAGE';
        }

        return {
          id: record.id,
          productId: record.productId,
          productName: record.product.name,
          category: record.product.category,
          unit: record.product.unit,
          areaId: record.areaId,
          areaName: `${record.area.city}, ${record.area.district} (${record.area.province})`,
          demandQty: record.demandQty,
          stockQty: record.stockQty,
          productionQty: record.productionQty,
          month: record.month,
          year: record.year,
          stockStatus,
          productionStatus
        };
      });

    return res.json(report);
  } catch (error) {
    console.error('Error generating demand analysis report:', error);
    return res.status(500).json({ message: 'Server error generating demand analysis report', error: error.message });
  }
};

// @desc    Export reports as CSV
// @route   GET /api/reports/export-csv
// @access  Private
const exportCSV = async (req, res) => {
  const { type, areaId, productId, month, year } = req.query;
  const filter = {};

  if (areaId) filter.areaId = areaId;
  if (productId) filter.productId = productId;
  if (month) filter.month = parseInt(month, 10);
  if (year) filter.year = parseInt(year, 10);

  try {
    let csvContent = '';
    let filename = 'report.csv';

    if (type === 'price') {
      filename = `price_comparison_report_${Date.now()}.csv`;
      const prices = await PriceRecord.find(filter)
        .populate('product')
        .populate('area');

      // Headers
      csvContent += 'Product Name,Category,Unit,Area (City),District,Province,Original Price,Area Price,Difference,Pct Difference (%),Month,Year,Status\n';
      
      prices
        .filter(record => record.product && record.area)
        .forEach(record => {
          const diff = record.areaPrice - record.originalPrice;
          const pctDiff = record.originalPrice > 0 ? ((diff / record.originalPrice) * 100).toFixed(2) : '0.00';
          const status = isHighPrice(record.originalPrice, record.areaPrice) ? 'HIGH' : 'NORMAL';
          
          // Escape commas
          const pName = `"${record.product.name.replace(/"/g, '""')}"`;
          const category = `"${record.product.category.replace(/"/g, '""')}"`;
          const city = `"${record.area.city.replace(/"/g, '""')}"`;
          const district = `"${record.area.district.replace(/"/g, '""')}"`;
          const province = `"${record.area.province.replace(/"/g, '""')}"`;

          csvContent += `${pName},${category},${record.product.unit},${city},${district},${province},${record.originalPrice},${record.areaPrice},${diff.toFixed(2)},${pctDiff},${record.month},${record.year},${status}\n`;
        });
    } else {
      filename = `demand_analysis_report_${Date.now()}.csv`;
      const demands = await DemandRecord.find(filter)
        .populate('product')
        .populate('area');

      // Headers
      csvContent += 'Product Name,Category,Unit,Area (City),District,Province,Demand Qty,Stock Qty,Production Qty,Month,Year,Stock Status,Production Status\n';

      demands
        .filter(record => record.product && record.area)
        .forEach(record => {
          const stockStatus = isLowStock(record.demandQty, record.stockQty) ? 'LOW STOCK' : 'SUFFICIENT';
          
          let productionStatus = 'BALANCED';
          if (isOverProduction(record.demandQty, record.productionQty)) {
            productionStatus = 'OVER PRODUCTION';
          } else if (record.productionQty < record.demandQty * 0.8) {
            productionStatus = 'SHORTAGE';
          }

          const pName = `"${record.product.name.replace(/"/g, '""')}"`;
          const category = `"${record.product.category.replace(/"/g, '""')}"`;
          const city = `"${record.area.city.replace(/"/g, '""')}"`;
          const district = `"${record.area.district.replace(/"/g, '""')}"`;
          const province = `"${record.area.province.replace(/"/g, '""')}"`;

          csvContent += `${pName},${category},${record.product.unit},${city},${district},${province},${record.demandQty},${record.stockQty},${record.productionQty},${record.month},${record.year},${stockStatus},${productionStatus}\n`;
        });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    return res.status(500).json({ message: 'Server error exporting CSV', error: error.message });
  }
};

module.exports = {
  getSummary,
  getPriceComparison,
  getDemandAnalysis,
  exportCSV
};
