const hartiScraper = require('../scrapers/hartiScraper');
const Crop = require('../models/Crop');
const Market = require('../models/Market');
const Price = require('../models/Price');
const Source = require('../models/Source');
const { normalizeCropName } = require('../utils/cropMapper');

/**
 * Finds or creates a Crop record by name/alias
 */
async function findCrop(rawCropName) {
  if (!rawCropName) return null;
  const normalizedKey = normalizeCropName(rawCropName);

  // Search by exact name, slug, or regex
  let crop = await Crop.findOne({
    $or: [
      { name: new RegExp(`^${rawCropName.trim()}$`, 'i') },
      { slug: normalizedKey },
      { nameSi: rawCropName.trim() }
    ]
  });

  if (!crop) {
    // Search by partial match
    crop = await Crop.findOne({ name: new RegExp(rawCropName.trim(), 'i') });
  }

  if (!crop) {
    // Auto-create crop entry if not existing
    crop = await Crop.create({
      name: rawCropName.trim(),
      category: 'Vegetables',
      slug: normalizedKey,
      unit: 'kg',
      isActive: true
    });
  }

  return crop;
}

/**
 * Finds or creates a Market record by name
 */
async function findMarket(rawMarketName) {
  if (!rawMarketName) return null;
  const cleanName = rawMarketName.trim();
  const slug = cleanName.toLowerCase().replace(/\s+/g, '-');

  let market = await Market.findOne({
    $or: [
      { name: new RegExp(`^${cleanName}$`, 'i') },
      { slug: slug },
      { nameSi: cleanName }
    ]
  });

  if (!market) {
    market = await Market.create({
      name: cleanName,
      district: cleanName,
      province: 'Central',
      slug: slug,
      isActive: true
    });
  }

  return market;
}

/**
 * Synchronizes HARTI Daily Market Prices
 */
async function syncHartiPrices() {
  console.log('🔄 Starting HARTI Price Synchronization...');

  try {
    const document = await hartiScraper.getLatestReport();
    if (!document) {
      console.warn('⚠️ No document retrieved from HARTI scraper.');
      return { success: false, message: 'No document retrieved' };
    }

    const parsedPrices = await hartiScraper.parse(document);
    let syncedCount = 0;

    for (const item of parsedPrices) {
      const crop = await findCrop(item.crop);
      const market = await findMarket(item.market);

      if (!crop || !market) continue;

      const dateObj = new Date(item.date);
      // Strip time portion to align daily price date
      dateObj.setUTCHours(0, 0, 0, 0);

      await Price.findOneAndUpdate(
        {
          crop: crop._id,
          market: market._id,
          source: 'HARTI',
          date: dateObj
        },
        {
          price: item.price,
          unit: item.unit || 'kg',
          currency: item.currency || 'LKR',
          priceType: item.priceType || 'Wholesale'
        },
        {
          upsert: true,
          new: true
        }
      );
      syncedCount++;
    }

    // Update Source tracker record
    await Source.findOneAndUpdate(
      { name: 'HARTI' },
      {
        type: 'official',
        website: 'http://www.harti.gov.lk',
        lastSync: new Date(),
        status: 'active',
        $inc: { recordCount: syncedCount }
      },
      { upsert: true, new: true }
    );

    console.log(`✅ HARTI Price Synchronization Complete. ${syncedCount} prices upserted.`);
    return { success: true, count: syncedCount, updatedAt: new Date() };
  } catch (error) {
    console.error('❌ Error during HARTI price sync:', error);
    await Source.findOneAndUpdate(
      { name: 'HARTI' },
      { status: 'error' }
    ).catch(() => {});
    return { success: false, error: error.message };
  }
}

module.exports = {
  syncHartiPrices,
  findCrop,
  findMarket
};
