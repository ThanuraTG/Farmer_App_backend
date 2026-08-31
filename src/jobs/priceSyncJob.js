const cron = require('node-cron');
const { syncHartiPrices } = require('../services/hartiService');
const { syncCbslPrices } = require('../services/cbslService');

let cronTask = null;

/**
 * Initializes recurring background sync job for HARTI and CBSL daily prices
 * Runs every 30 minutes by default
 */
function initPriceSyncJob() {
  console.log('⏰ Initializing Market Price Auto-Sync Cron Job (Every 30 minutes)...');

  // Schedule task every 30 minutes: "*/30 * * * *"
  cronTask = cron.schedule('*/30 * * * *', async () => {
    console.log('🔄 Cron Triggered: Checking latest market prices from HARTI & CBSL...');
    try {
      await syncHartiPrices();
      await syncCbslPrices();
      console.log('✅ Cron Market Price Sync step finished.');
    } catch (error) {
      console.error('❌ Error executing scheduled price sync job:', error);
    }
  });

  return cronTask;
}

/**
 * Triggers manual synchronization immediately
 */
async function runManualSync() {
  console.log('🚀 Manual Price Sync Triggered...');
  const hartiResult = await syncHartiPrices();
  const cbslResult = await syncCbslPrices();
  return {
    timestamp: new Date(),
    harti: hartiResult,
    cbsl: cbslResult
  };
}

module.exports = {
  initPriceSyncJob,
  runManualSync
};
