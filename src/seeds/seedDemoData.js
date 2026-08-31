const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Crop = require('../models/Crop');
const District = require('../models/District');
const EconomicCentre = require('../models/EconomicCentre');
const MarketPrice = require('../models/MarketPrice');
const SupplyBaseline = require('../models/SupplyBaseline');
const CultivationPlan = require('../models/CultivationPlan');
const User = require('../models/User');
const logger = require('../utils/logger');

const DEMO_CROPS = [
  {
    name: { en: 'Carrot', si: 'කැරට්', ta: 'கேரட்' },
    scientificName: 'Daucus carota',
    category: 'Vegetables',
    description: { en: 'Root vegetable rich in beta-carotene.', si: 'විටමින් A බහුල අල බෝගයකි.', ta: 'கேரட் சத்துள்ள கிழங்கு பயிர்.' },
    imageUrl: 'https://images.unsplash.com/photo-1598170845058-12ef4a4575c1',
    growingDurationDays: { min: 75, max: 105 },
    suitableSeasons: ['Yala', 'Maha'],
    soil: { types: ['Sandy loam', 'Loam'], phMin: 6.0, phMax: 7.0 },
    climate: { temperatureOptimumMin: 15, temperatureOptimumMax: 24, temperatureMin: 10, temperatureMax: 28 },
    harvest: { expectedDays: 90, expectedYieldPerAcre: 8000 },
    referenceCostPerAcre: 150000,
    status: 'active'
  },
  {
    name: { en: 'Tomato', si: 'තක්කාලි', ta: 'தக்காளி' },
    scientificName: 'Solanum lycopersicum',
    category: 'Vegetables',
    description: { en: 'High demand solanaceous crop.', si: 'වැඩි ඉල්ලුමක් ඇති එළවළු බෝගයකි.', ta: 'அதிக தேவைகொண்ட பயிர்.' },
    imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea',
    growingDurationDays: { min: 90, max: 120 },
    suitableSeasons: ['Yala', 'Maha'],
    soil: { types: ['Loam', 'Clay loam'], phMin: 6.0, phMax: 6.8 },
    climate: { temperatureOptimumMin: 20, temperatureOptimumMax: 28, temperatureMin: 15, temperatureMax: 34 },
    harvest: { expectedDays: 105, expectedYieldPerAcre: 10000 },
    referenceCostPerAcre: 180000,
    status: 'active'
  },
  {
    name: { en: 'Big Onion', si: 'ලොකු ළූණු', ta: 'பெரிய வெங்காயம்' },
    scientificName: 'Allium cepa',
    category: 'Field Crops',
    description: { en: 'Essential bulb crop mainly cultivated in Dambulla/Anuradhapura.', si: 'දඹුල්ල සහ අනුරාධපුර ප්‍රදේශවල බහුලව වගා කෙරේ.', ta: 'முக்கியமான பயிர்.' },
    imageUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8ce',
    growingDurationDays: { min: 100, max: 130 },
    suitableSeasons: ['Yala'],
    soil: { types: ['Sandy loam', 'Well-drained soil'], phMin: 6.0, phMax: 7.2 },
    climate: { temperatureOptimumMin: 20, temperatureOptimumMax: 30, temperatureMin: 15, temperatureMax: 35 },
    harvest: { expectedDays: 110, expectedYieldPerAcre: 7500 },
    referenceCostPerAcre: 200000,
    status: 'active'
  }
];

const seedDemo = async () => {
  try {
    await connectDB();
    logger.info('Seeding Demo Research Data...');

    // Seed Crops
    const cropMap = {};
    for (const cData of DEMO_CROPS) {
      let crop = await Crop.findOne({ 'name.en': cData.name.en });
      if (!crop) {
        crop = await Crop.create(cData);
      }
      cropMap[cData.name.en] = crop;
    }

    // Fetch districts
    const mataleDist = await District.findOne({ 'name.en': 'Matale' });
    const nuwaraEliyaDist = await District.findOne({ 'name.en': 'Nuwara Eliya' });
    const colomboDist = await District.findOne({ 'name.en': 'Colombo' });

    // Seed Economic Centres
    let dambullaCentre = await EconomicCentre.findOne({ name: 'Dambulla Dedicated Economic Centre' });
    if (!dambullaCentre) {
      dambullaCentre = await EconomicCentre.create({
        name: 'Dambulla Dedicated Economic Centre',
        districtId: mataleDist?._id || null,
        districtName: 'Matale',
        address: 'Dambulla',
        active: true
      });
    }

    let meegodaCentre = await EconomicCentre.findOne({ name: 'Meegoda Economic Centre' });
    if (!meegodaCentre) {
      meegodaCentre = await EconomicCentre.create({
        name: 'Meegoda Economic Centre',
        districtId: colomboDist?._id || null,
        districtName: 'Colombo',
        address: 'Meegoda',
        active: true
      });
    }

    // Seed Market Prices for Carrot
    const carrot = cropMap['Carrot'];
    if (carrot && dambullaCentre) {
      const today = new Date();
      for (let i = 0; i < 35; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const baseAvg = 180 + Math.sin(i) * 15;

        await MarketPrice.findOneAndUpdate(
          { cropId: carrot._id, economicCentreId: dambullaCentre._id, date: d },
          {
            cropId: carrot._id,
            economicCentreId: dambullaCentre._id,
            date: d,
            minPrice: Math.round(baseAvg - 15),
            maxPrice: Math.round(baseAvg + 15),
            averagePrice: Math.round(baseAvg),
            unit: 'kg',
            source: 'HARTI'
          },
          { upsert: true }
        );
      }
    }

    // Seed Supply Baseline for Carrot (Month 8 / August & Month 9 / September)
    if (carrot) {
      for (let m = 1; m <= 12; m++) {
        await SupplyBaseline.findOneAndUpdate(
          { cropId: carrot._id, month: m },
          {
            cropId: carrot._id,
            month: m,
            referenceSupplyKg: 50000,
            source: 'DOA Production Plan Benchmark',
            active: true
          },
          { upsert: true }
        );
      }
    }

    logger.info('Demo Research Data seeded successfully.');
    process.exit(0);
  } catch (err) {
    logger.error('Error seeding demo data', err);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDemo();
}

module.exports = seedDemo;
