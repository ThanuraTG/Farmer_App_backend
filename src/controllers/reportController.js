const Division = require('../models/Division');
const Crop = require('../models/Crop');
const MarketPrice = require('../models/MarketPrice');
const SavedCrop = require('../models/SavedCrop');
const Notification = require('../models/Notification');

// @desc    Get dashboard summary statistics
// @route   GET /api/reports/summary
// @access  Private
const getSummary = async (req, res) => {
  try {
    const [
      totalDivisions,
      totalCrops,
      totalPrices,
      totalSaved,
      unreadNotifs
    ] = await Promise.all([
      Division.countDocuments({}),
      Crop.countDocuments({}),
      MarketPrice.countDocuments({}),
      SavedCrop.countDocuments({}),
      Notification.countDocuments({ is_read: false })
    ]);

    // Calculate high price counts (> 250 Rs/kg)
    const highPriceCount = await MarketPrice.countDocuments({ price_per_kg: { $gt: 250 } });

    return res.json({
      areasCount: totalDivisions,
      productsCount: totalCrops,
      priceRecordsCount: totalPrices,
      demandRecordsCount: totalSaved,
      highPriceCount: highPriceCount,
      lowStockCount: unreadNotifs, // Maps alerts to low stock metric
      overProductionCount: Math.max(0, totalSaved - 3) // Dynamic simulation
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

  if (productId) filter.crop_id = productId;
  
  // If filtering by area (division), we match the market_location with the division name
  if (areaId) {
    try {
      const division = await Division.findById(areaId);
      if (division) {
        filter.market_location = { $regex: division.name, $options: 'i' };
      }
    } catch (e) {
      // Ignore invalid ObjectIds
    }
  }

  try {
    const prices = await MarketPrice.find(filter)
      .populate('crop_id')
      .sort({ price_date: -1 });

    const report = prices
      .filter(record => record.crop_id)
      .map(record => {
        const cropDate = new Date(record.price_date);
        const originalPrice = Math.round(record.price_per_kg * 0.8); // 80% is wholesale/farmgate
        const diff = record.price_per_kg - originalPrice;
        const pctDiff = originalPrice > 0 ? (diff / originalPrice) * 100 : 0;
        const status = record.price_per_kg > 250 ? 'HIGH' : 'NORMAL';

        return {
          id: record.price_id || record._id.toString(),
          productId: record.crop_id._id.toString(),
          productName: record.crop_id.name,
          category: record.crop_id.category,
          unit: 'kg',
          areaId: areaId || record.market_location,
          areaName: record.market_location,
          originalPrice: originalPrice,
          areaPrice: record.price_per_kg,
          priceDifference: diff,
          percentageDifference: pctDiff,
          month: cropDate.getMonth() + 1,
          year: cropDate.getFullYear(),
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
  const { areaId, productId } = req.query;

  try {
    // We aggregate demand-analysis using saved crops to show planned crop counts per division
    const savedCrops = await SavedCrop.find({})
      .populate('crop_id')
      .populate({
        path: 'user_id',
        populate: { path: 'division_id' }
      });

    // Grouping by Crop + Division
    const grouped = {};

    savedCrops.forEach(item => {
      if (!item.crop_id) return;
      const crop = item.crop_id;
      const user = item.user_id;
      const division = user && user.division_id ? user.division_id : { _id: 'unknown', name: 'General Market', district: 'Sri Lanka', province: 'Sri Lanka' };

      const key = `${crop._id}_${division._id}`;

      if (!grouped[key]) {
        grouped[key] = {
          crop,
          division,
          count: 0
        };
      }
      grouped[key].count++;
    });

    const report = Object.values(grouped)
      .filter(g => {
        // Filter by crop/area if queried
        if (productId && g.crop._id.toString() !== productId) return false;
        if (areaId && g.division._id.toString() !== areaId) return false;
        return true;
      })
      .map((g, idx) => {
        // Target cultivation limit of farmers planting this crop in this division
        const targetLimit = 5; 
        const stockQty = g.count; // actual farmers planting it
        const productionQty = Math.round(g.count * 1.5); // estimated output scale
        const stockStatus = stockQty < targetLimit ? 'LOW STOCK' : 'SUFFICIENT';
        const productionStatus = productionQty > targetLimit * 1.2 ? 'OVER PRODUCTION' : 'BALANCED';

        return {
          id: `demand_${idx}`,
          productId: g.crop._id.toString(),
          productName: g.crop.name,
          category: g.crop.category,
          unit: 'Farmers',
          areaId: g.division._id.toString(),
          areaName: `${g.division.name} (${g.division.province})`,
          demandQty: targetLimit,
          stockQty: stockQty,
          productionQty: productionQty,
          month: 6,
          year: 2026,
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
  const { type, areaId, productId } = req.query;

  try {
    let csvContent = '';
    let filename = 'report.csv';

    if (type === 'price') {
      filename = `price_comparison_report_${Date.now()}.csv`;
      const filter = {};
      if (productId) filter.crop_id = productId;

      const prices = await MarketPrice.find(filter)
        .populate('crop_id');

      csvContent += 'Crop Name,Category,Unit,Market Location,Farmgate Price (Est),Market Price,Difference,Month,Year,Status\n';
      
      prices
        .filter(record => record.crop_id)
        .forEach(record => {
          const cropDate = new Date(record.price_date);
          const originalPrice = Math.round(record.price_per_kg * 0.8);
          const diff = record.price_per_kg - originalPrice;
          const status = record.price_per_kg > 250 ? 'HIGH' : 'NORMAL';
          
          const pName = `"${record.crop_id.name.replace(/"/g, '""')}"`;
          const category = `"${record.crop_id.category.replace(/"/g, '""')}"`;
          const location = `"${record.market_location.replace(/"/g, '""')}"`;

          csvContent += `${pName},${category},kg,${location},${originalPrice},${record.price_per_kg},${diff},${cropDate.getMonth() + 1},${cropDate.getFullYear()},${status}\n`;
        });
    } else {
      filename = `planned_crops_report_${Date.now()}.csv`;
      
      const savedCrops = await SavedCrop.find({})
        .populate('crop_id')
        .populate({
          path: 'user_id',
          populate: { path: 'division_id' }
        });

      const grouped = {};
      savedCrops.forEach(item => {
        if (!item.crop_id) return;
        const crop = item.crop_id;
        const user = item.user_id;
        const division = user && user.division_id ? user.division_id : { name: 'General Market', province: 'Sri Lanka' };
        const key = `${crop._id}_${division._id}`;

        if (!grouped[key]) {
          grouped[key] = { crop, division, count: 0 };
        }
        grouped[key].count++;
      });

      csvContent += 'Crop Name,Category,Division,Province,Target Limit (Farmers),Farmers Planting,Est Scale,Stock Status,Production Status\n';

      Object.values(grouped).forEach(g => {
        const targetLimit = 5;
        const stockQty = g.count;
        const productionQty = Math.round(g.count * 1.5);
        const stockStatus = stockQty < targetLimit ? 'UNDER PLANTED' : 'SUFFICIENT';
        const productionStatus = productionQty > targetLimit * 1.2 ? 'RISK OVERPRODUCTION' : 'BALANCED';

        const pName = `"${g.crop.name.replace(/"/g, '""')}"`;
        const category = `"${g.crop.category.replace(/"/g, '""')}"`;
        const divName = `"${g.division.name.replace(/"/g, '""')}"`;
        const province = `"${g.division.province.replace(/"/g, '""')}"`;

        csvContent += `${pName},${category},${divName},${province},${targetLimit},${stockQty},${productionQty},${stockStatus},${productionStatus}\n`;
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
