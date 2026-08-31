require('dotenv').config();
const mongoose = require('mongoose');
const { getLatestPrices, getPricesByCrop, getPricesByMarket, getPriceHistory } = require('../src/services/priceService');
const Market = require('../src/models/Market');
const Source = require('../src/models/Source');

async function testAPI() {
  await mongoose.connect(process.env.DATABASE_URL);
  console.log('--- Testing GET /api/prices/latest ---');
  const latest = await getLatestPrices();
  console.log('Latest prices sample:', JSON.stringify(latest.data.slice(0, 3), null, 2));

  console.log('\n--- Testing GET /api/prices/crop/tomato ---');
  const tomatoPrices = await getPricesByCrop('tomato');
  console.log('Tomato prices sample:', JSON.stringify(tomatoPrices.data.slice(0, 2), null, 2));

  console.log('\n--- Testing GET /api/prices/market/dambulla ---');
  const dambullaPrices = await getPricesByMarket('dambulla');
  console.log('Dambulla prices sample:', JSON.stringify(dambullaPrices.data.slice(0, 2), null, 2));

  console.log('\n--- Testing GET /api/prices/history?crop=tomato&market=dambulla ---');
  const history = await getPriceHistory('tomato', 'dambulla');
  console.log('History chart sample:', JSON.stringify(history, null, 2));

  console.log('\n--- Testing GET /api/markets ---');
  const markets = await Market.find({ isActive: true });
  console.log('Markets sample:', markets.map(m => m.name));

  console.log('\n--- Testing GET /api/sources ---');
  const sources = await Source.find({});
  console.log('Sources sample:', sources.map(s => ({ name: s.name, status: s.status, lastSync: s.lastSync })));

  await mongoose.disconnect();
}

testAPI().catch(err => console.error(err));
