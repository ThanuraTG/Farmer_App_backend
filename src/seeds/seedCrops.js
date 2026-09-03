const mongoose = require('mongoose');
const Crop = require('../models/Crop');
require('../config/env');
const connectDB = require('../config/db');

const cropGroups = [
  {
    category: 'Paddy / Cereals',
    crops: [
      ['Paddy (Rice)', 'වී'], ['Maize', 'බඩ ඉරිඟු'], ['Kurakkan (Finger Millet)', 'කුරක්කන්'], ['Sorghum', 'සෝර්ගම්']
    ]
  },
  {
    category: 'Field Crops / Other Food Crops',
    crops: [
      ['Potato', 'අර්තාපල්'], ['Sweet Potato', 'බතල'], ['Manioc / Cassava', 'මඤ්ඤොක්කා'], ['Big Onion', 'ලොකු ලූනු'], ['Red Onion', 'රතු ලූනු'],
      ['Green Gram', 'මුං ඇට'], ['Cowpea', 'කව්පි'], ['Black Gram', 'උඳු'], ['Groundnut', 'රටකජු'], ['Soybean', 'සෝයා'], ['Sesame', 'තල']
    ]
  },
  {
    category: 'Vegetables',
    crops: [
      ['Tomato', 'තක්කාලි'], ['Brinjal / Eggplant', 'වම්බටු'], ['Capsicum', 'මාළු මිරිස්'], ['Green Chilli', 'අමු මිරිස්'], ['Pumpkin', 'වට්ටක්කා'],
      ['Cucumber', 'පිපිඤ්ඤා'], ['Snake Gourd', 'පතෝල'], ['Bitter Gourd', 'කරවිල'], ['Ridge Gourd', 'වැටකොළු'], ['Ash Plantain / Ash Gourd', 'පුහුල්'],
      ['Okra', 'බණ්ඩක්කා'], ['Cabbage', 'ගෝවා'], ['Knol-khol', 'නෝල්කෝල්'], ['Carrot', 'කැරට්'], ['Beetroot', 'බීට්'], ['Radish', 'රාබු'],
      ['Leeks', 'ලීක්ස්'], ['Beans', 'බෝංචි'], ['Winged Bean', 'දඹල'], ['Snake Bean', 'මෑ'], ['Lettuce', 'සලාද කොළ'], ['Drumstick / Moringa', 'මුරුංගා']
    ]
  },
  {
    category: 'Fruits',
    crops: [
      ['Banana', 'කෙසෙල්'], ['Mango', 'අඹ'], ['Papaya', 'ගස්ලබු'], ['Pineapple', 'අන්නාසි'], ['Watermelon', 'කොමඩු'], ['Passion Fruit', 'පැෂන් ෆෘට්'],
      ['Guava', 'පේර'], ['Avocado', 'අලිගැටපේර'], ['Rambutan', 'රඹුටන්'], ['Wood Apple', 'දිවුල්'], ['Jackfruit', 'කොස්'], ['Soursop', 'කටු අනෝදා'],
      ['Orange', 'දොඩම්'], ['Lime', 'දෙහි'], ['Lemon', 'නාරං/ලෙමන්'], ['Pomegranate', 'දෙළුම්'], ['Star Fruit', 'කාමරංගා']
    ]
  },
  {
    category: 'Plantation / Export Crops',
    crops: [
      ['Tea', 'තේ'], ['Rubber', 'රබර්'], ['Coconut', 'පොල්'], ['Cinnamon', 'කුරුඳු'], ['Pepper', 'ගම්මිරිස්'], ['Cardamom', 'එනසාල්'],
      ['Clove', 'කරාබුනැටි'], ['Nutmeg', 'සාදික්කා'], ['Coffee', 'කෝපි'], ['Cocoa', 'කොකෝවා']
    ]
  },
  {
    category: 'Spices / Medicinal Crops',
    crops: [
      ['Turmeric', 'කහ'], ['Ginger', 'ඉඟුරු'], ['Coriander', 'කොත්තමල්ලි'], ['Fenugreek', 'උළුහාල්'], ['Fennel', 'මහදුරු'],
      ['Lemongrass', 'සේර'], ['Aloe Vera', 'කෝමාරිකා']
    ]
  }
];

const slugifyCropName = (value) => String(value || '')
  .toLowerCase()
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const getCropImagePath = (englishName) => `/media/crops/${slugifyCropName(englishName)}.png`;

const crops = cropGroups.flatMap(({ category, crops: entries }) => entries.map(([english, sinhala]) => ({
  name: { en: english, si: sinhala, ta: '' },
  category,
  imageUrl: getCropImagePath(english),
  status: 'active',
  description: { en: `${english} cultivation crop`, si: sinhala, ta: '' }
}))).map((crop, index) => ({
  ...crop,
  cropCode: `CO-${String(index + 1).padStart(3, '0')}`
}));

const seedCrops = async () => {
  await connectDB();
  const operations = crops.map(crop => ({
    updateOne: {
      filter: { 'name.en': crop.name.en },
      update: { $set: crop },
      upsert: true
    }
  }));
  const result = await Crop.bulkWrite(operations);
  console.log(`Crop seed complete: ${crops.length} crops processed (${result.upsertedCount} inserted, ${result.modifiedCount} updated).`);
  await mongoose.disconnect();
};

if (require.main === module) {
  seedCrops().catch(async error => {
    console.error('Crop seed failed:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  });
}

module.exports = { crops, seedCrops, cropGroups, slugifyCropName, getCropImagePath };
