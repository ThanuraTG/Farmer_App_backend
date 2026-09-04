const mongoose = require('mongoose');
const Crop = require('../models/Crop');
const CropDetail = require('../models/CropDetail');
require('../config/env');
const connectDB = require('../config/db');
const { cropProfileData, vegetableWeatherRequirements } = require('./cropProfileData');

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

const CROP_DATASET_UPDATED_AT = new Date('2026-09-04T00:00:00.000Z');

const normalizeText = (value) => String(value || '')
  .replace(/[\u2013\u2014]/g, '-')
  .replace(/\s+/g, ' ')
  .trim();

const convertToDays = (value, unit) => {
  const amount = Number.parseFloat(value);
  if (!Number.isFinite(amount)) return null;

  const normalizedUnit = unit.toLowerCase();
  if (normalizedUnit.startsWith('day')) return amount;
  if (normalizedUnit.startsWith('week')) return amount * 7;
  if (normalizedUnit.startsWith('month')) return amount * 30;
  if (normalizedUnit.startsWith('year')) return amount * 365;
  return null;
};

const averageRange = (range) => {
  if (!range) return null;
  return Math.round((range.min + range.max) / 2);
};

const parseDurationToDays = (text) => {
  const normalized = normalizeText(text).toLowerCase();
  const rangeMatch = normalized.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*(days?|weeks?|months?|years?)/);
  if (rangeMatch) {
    const min = convertToDays(rangeMatch[1], rangeMatch[3]);
    const max = convertToDays(rangeMatch[2], rangeMatch[3]);
    if (min != null && max != null) {
      return { min: Math.round(min), max: Math.round(max) };
    }
  }

  const singleMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(days?|weeks?|months?|years?)/);
  if (singleMatch) {
    const value = convertToDays(singleMatch[1], singleMatch[2]);
    if (value != null) {
      const rounded = Math.round(value);
      return { min: rounded, max: rounded };
    }
  }

  return null;
};

const parseTemperatureRange = (text) => {
  const normalized = normalizeText(text);
  const rangeMatch = normalized.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*C/i);
  if (rangeMatch) {
    return {
      min: Number.parseFloat(rangeMatch[1]),
      max: Number.parseFloat(rangeMatch[2])
    };
  }

  const lessThanMatch = normalized.match(/<\s*(\d+(?:\.\d+)?)\s*C/i);
  if (lessThanMatch) {
    return {
      min: null,
      max: Number.parseFloat(lessThanMatch[1])
    };
  }

  const singleMatch = normalized.match(/(?:about|around|approximately|roughly|optimum|ideal|broadly)?\s*(\d+(?:\.\d+)?)\s*C/i);
  if (singleMatch) {
    const value = Number.parseFloat(singleMatch[1]);
    return { min: value, max: value };
  }

  return null;
};

const parseRainfallRange = (text) => {
  const normalized = normalizeText(text);
  const rangeMatch = normalized.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*mm/i);
  if (rangeMatch) {
    return {
      min: Number.parseFloat(rangeMatch[1]),
      max: Number.parseFloat(rangeMatch[2])
    };
  }

  const singleMatch = normalized.match(/(\d+(?:\.\d+)?)\s*mm/i);
  if (singleMatch) {
    const value = Number.parseFloat(singleMatch[1]);
    return { min: value, max: value };
  }

  return null;
};

const parsePhRange = (text) => {
  const normalized = normalizeText(text);
  const match = normalized.match(/pH[^\d]*(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/i);
  if (!match) return null;

  return {
    min: Number.parseFloat(match[1]),
    max: Number.parseFloat(match[2])
  };
};

const extractSoilTypes = (text) => {
  const normalized = normalizeText(text);
  const primarySegment = normalized.split(';')[0].replace(/\s*pH.*$/i, '').trim();
  return primarySegment ? [primarySegment] : [];
};

const extractDrainage = (text) => {
  const normalized = normalizeText(text).toLowerCase();
  if (normalized.includes('well-drained')) return 'well-drained';
  if (normalized.includes('water retention')) return 'good water retention';
  if (normalized.includes('waterlogging')) return 'avoid waterlogging';
  return '';
};

const extractSuitableRegions = (text) => {
  const normalized = normalizeText(text).toLowerCase();
  const regions = new Set();

  if (/(wet zone|wet\/intermediate|wet, intermediate|wet and intermediate|very wet)/.test(normalized)) {
    regions.add('Wet Zone');
  }
  if (/(intermediate zone|intermediate zones|\bintermediate\b)/.test(normalized)) {
    regions.add('Intermediate Zone');
  }
  if (/(dry zone|dry zones|dry\/intermediate|dry and intermediate|semi-dry|hot dry|warm dry|dry areas|\bdry\b)/.test(normalized)) {
    regions.add('Dry Zone');
  }
  if (normalized.includes('up-country')) regions.add('Up-country');
  if (normalized.includes('low country')) regions.add('Low country');
  if (normalized.includes('uplands')) regions.add('Uplands');
  if (normalized.includes('mid elevations')) regions.add('Mid elevations');
  if (normalized.includes('high elevations')) regions.add('High elevations');

  return Array.from(regions);
};

const describeHarvestMethod = (text) => {
  const normalized = normalizeText(text).toLowerCase();
  if (/(repeated|pickings|picked|plucking|every|rounds|flushes|progressive|several|multiple)/.test(normalized)) {
    return 'Repeated or periodic harvest';
  }
  if (/(single|once|one main)/.test(normalized)) {
    return 'Single harvest';
  }
  if (normalized.includes('seasonal')) {
    return 'Seasonal harvest';
  }
  return '';
};

const extractHarvestFrequency = (text) => {
  const normalized = normalizeText(text);
  const everyMatch = normalized.match(/every\s+[^;,.]+/i);
  if (everyMatch) return everyMatch[0];

  const annualMatch = normalized.match(/\b\d+(?:-\d+)?\s+(?:main\s+)?harvests?\/year\b/i);
  if (annualMatch) return annualMatch[0];

  if (/single|once|one main/i.test(normalized)) return 'Single harvest';
  if (/seasonal/i.test(normalized)) return 'Seasonal harvest';
  if (/repeated|pickings|rounds|flushes|plucking|progressive/i.test(normalized)) return 'Repeated harvests';

  return normalized;
};

const extractExpectedHarvests = (text) => {
  const normalized = normalizeText(text);
  if (/single|once|one main/i.test(normalized)) return '1';

  const harvestCountMatch = normalized.match(/\b(\d+(?:-\d+)?)\s+(?:main\s+)?harvests?(?:\/year)?\b/i);
  if (harvestCountMatch) return harvestCountMatch[1];
  if (/several|multiple/i.test(normalized)) return 'Several';

  return '';
};

const flattenedCropEntries = cropGroups.flatMap(({ category, crops: entries }) =>
  entries.map(([english, sinhala]) => ({
    english,
    sinhala,
    category
  }))
);

const buildCropRecord = ({ english, sinhala, category, cropCode }) => {
  const profile = cropProfileData[english] || {};
  const vegetableWeather = vegetableWeatherRequirements[english];
  const growingRange = parseDurationToDays(profile.growingPeriod);
  const temperatureRange = parseTemperatureRange(profile.suitableClimate);
  const rainfallRange = parseRainfallRange(profile.suitableClimate);
  const phRange = parsePhRange(profile.suitableSoil);
  const expectedDays = averageRange(growingRange) || 90;

  return {
    cropCode,
    name: { en: english, si: sinhala, ta: '' },
    category,
    imageUrl: getCropImagePath(english),
    status: 'active',
    scientificName: '',
    description: { en: profile.description || `${english} cultivation crop`, si: '', ta: '' },
    growingDurationDays: {
      min: growingRange?.min || 60,
      max: growingRange?.max || 120
    },
    suitableSeasons: [],
    soil: {
      types: extractSoilTypes(profile.suitableSoil),
      phMin: phRange?.min ?? 5.5,
      phMax: phRange?.max ?? 7.5,
      drainage: extractDrainage(profile.suitableSoil)
    },
    climate: {
      temperatureMin: vegetableWeather?.minTemperature ?? temperatureRange?.min ?? null,
      temperatureMax: vegetableWeather?.maxTemperature ?? temperatureRange?.max ?? null,
      temperatureOptimumMin: vegetableWeather ? parseTemperatureRange(vegetableWeather.optimumTemperature)?.min : temperatureRange?.min ?? null,
      temperatureOptimumMax: vegetableWeather ? parseTemperatureRange(vegetableWeather.optimumTemperature)?.max : temperatureRange?.max ?? null,
      rainfallMin: rainfallRange?.min ?? null,
      rainfallMax: rainfallRange?.max ?? null,
      humidityMin: null,
      humidityMax: null
    },
    harvest: {
      expectedDays,
      indicators: '',
      method: describeHarvestMethod(profile.harvestingPeriod),
      expectedYieldPerAcre: 1000
    }
  };
};

const buildCropDetailPayload = (cropDocument) => {
  const englishName = cropDocument?.name?.en || '';
  const profile = cropProfileData[englishName] || {};
  const vegetableWeather = vegetableWeatherRequirements[englishName];
  const expectedDays = cropDocument?.harvest?.expectedDays || averageRange(parseDurationToDays(profile.growingPeriod)) || 90;
  const temperatureRange = parseTemperatureRange(profile.suitableClimate);
  const rainfallRange = parseRainfallRange(profile.suitableClimate);
  const phRange = parsePhRange(profile.suitableSoil);

  return {
    crop_id: cropDocument._id,
    growing_tips: [profile.suitableClimate, profile.suitableSoil].filter(Boolean).join(' | '),
    soil_type: profile.suitableSoil || '',
    pest_management: '',
    harvest_duration_days: expectedDays,
    scientific_name: cropDocument.scientificName || '',
    suitable_regions: extractSuitableRegions(profile.suitableClimate),
    recommended_planting_period: '',
    recommended_months: [],
    suitable_seasons: cropDocument.suitableSeasons || [],
    best_cultivation_period: '',
    off_season_period: '',
    region_recommendations: profile.suitableClimate || '',
    germination_period: '',
    growth_period: profile.growingPeriod || '',
    first_harvest_period: profile.growingPeriod || '',
    harvesting_duration: profile.harvestingPeriod || '',
    avg_days_to_maturity: expectedDays,
    land_preparation: {
      soil_prep: '',
      soil_type: profile.suitableSoil || '',
      soil_ph: phRange ? `pH ${phRange.min}-${phRange.max}` : '',
      land_prep_reqs: ''
    },
    planting_info: {
      seed_requirement: '',
      planting_method: '',
      plant_spacing: '',
      row_spacing: '',
      planting_depth: ''
    },
    water_requirement: {
      irrigation_requirement: profile.suitableClimate || '',
      watering_frequency: '',
      critical_periods: ''
    },
    fertilizer_info: {
      basal_fertilizer: '',
      stages: [],
      organic_fertilizer: '',
      key_nutrients: ''
    },
    pest_info: [],
    disease_info: [],
    weather_tolerance: {
      min_temp: vegetableWeather?.minTemperature ?? temperatureRange?.min ?? 15,
      max_temp: vegetableWeather?.maxTemperature ?? temperatureRange?.max ?? 35,
      optimal_temp: vegetableWeather?.optimumTemperature || profile.suitableClimate || '',
      rainfall_tolerance: vegetableWeather?.rainfall || (rainfallRange ? `${rainfallRange.min}-${rainfallRange.max} mm` : ''),
      max_rainfall_mm: vegetableWeather ? parseRainfallRange(vegetableWeather.rainfall)?.max ?? 150 : rainfallRange?.max ?? 150,
      optimal_humidity: vegetableWeather?.humidity || '',
      sunlight_requirement: vegetableWeather?.sunlight || ''
    },
    yield_info: {
      yield_per_acre: '',
      yield_per_hectare: '',
      yield_range: '',
      factors: []
    },
    harvesting_info: {
      when_to_harvest: profile.harvestingPeriod || '',
      maturity_indicators: '',
      harvesting_method: describeHarvestMethod(profile.harvestingPeriod),
      frequency: extractHarvestFrequency(profile.harvestingPeriod),
      precautions: '',
      expected_harvests: extractExpectedHarvests(profile.harvestingPeriod)
    },
    post_harvest_info: {
      cleaning_sorting: '',
      grading: '',
      packaging: '',
      storage: '',
      transportation: '',
      shelf_life: ''
    },
    financial_baseline: {
      seeds_cost: 0,
      fertilizer_cost: 0,
      labour_cost: 0,
      irrigation_cost: 0,
      pest_control_cost: 0,
      other_cost: 0,
      avg_yield_kg: 0
    },
    source_info: {
      source_name: 'Farmer Aswanna crop profile dataset',
      source_url: '',
      last_updated: CROP_DATASET_UPDATED_AT
    }
  };
};

const crops = flattenedCropEntries.map((entry, index) => buildCropRecord({
  ...entry,
  cropCode: `CO-${String(index + 1).padStart(3, '0')}`
}));

const seedCrops = async () => {
  await connectDB();
  const operations = crops.map(crop => ({
    updateOne: {
      filter: {
        $or: [
          { cropCode: crop.cropCode },
          { 'name.en': crop.name.en }
        ]
      },
      update: { $set: crop },
      upsert: true
    }
  }));
  const cropResult = await Crop.bulkWrite(operations);

  const persistedCrops = await Crop.find({ 'name.en': { $in: crops.map(crop => crop.name.en) } })
    .select('_id name scientificName suitableSeasons harvest')
    .lean();

  const detailOperations = persistedCrops.map(cropDocument => ({
    updateOne: {
      filter: { crop_id: cropDocument._id },
      update: { $set: buildCropDetailPayload(cropDocument) },
      upsert: true
    }
  }));

  const detailResult = detailOperations.length
    ? await CropDetail.bulkWrite(detailOperations)
    : { upsertedCount: 0, modifiedCount: 0 };

  console.log(`Crop seed complete: ${crops.length} crops processed (${cropResult.upsertedCount} inserted, ${cropResult.modifiedCount} updated).`);
  console.log(`Crop detail seed complete: ${detailOperations.length} details processed (${detailResult.upsertedCount} inserted, ${detailResult.modifiedCount} updated).`);
  await mongoose.disconnect();
};

if (require.main === module) {
  seedCrops().catch(async error => {
    console.error('Crop seed failed:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  });
}

module.exports = {
  crops,
  seedCrops,
  cropGroups,
  cropProfileData,
  vegetableWeatherRequirements,
  slugifyCropName,
  getCropImagePath,
  buildCropDetailPayload,
  parseDurationToDays
};
