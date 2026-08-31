const cbslScraper = require('../scrapers/cbslScraper');
const Price = require('../models/Price');
const Source = require('../models/Source');
const { findCrop, findMarket } = require('./hartiService');

/**
 * Synchronizes CBSL Daily Market Prices
 */
async function syncCbslPrices() {
  console.log('🔄 Starting CBSL Price Synchronization...');

  try {
    const report = await cbslScraper.getLatestReport();
    if (!report) {
      console.warn('⚠️ No report retrieved from CBSL scraper.');
      return { success: false, message: 'No report retrieved' };
    }

    const parsedPrices = await cbslScraper.parse(report);
    let syncedCount = 0;

    for (const item of parsedPrices) {
      const crop = await findCrop(item.crop);
      const market = await findMarket(item.market);

      if (!crop || !market) continue;

      const dateObj = new Date(item.date);
      dateObj.setUTCHours(0, 0, 0, 0);

      await Price.findOneAndUpdate(
        {
          crop: crop._id,
          market: market._id,
          source: 'CBSL',
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
      { name: 'CBSL' },
      {
        type: 'official',
        website: 'https://www.cbsl.gov.lk',
        lastSync: new Date(),
        status: 'active',
        $inc: { recordCount: syncedCount }
      },
      { upsert: true, new: true }
    );

    console.log(`✅ CBSL Price Synchronization Complete. ${syncedCount} prices upserted.`);
    return { success: true, count: syncedCount, updatedAt: new Date() };
  } catch (error) {
    console.error('❌ Error during CBSL price sync:', error);
    await Source.findOneAndUpdate(
      { name: 'CBSL' },
      { status: 'error' }
    ).catch(() => {});
    return { success: false, error: error.message };
  }
}

module.exports = {
  syncCbslPrices
};
