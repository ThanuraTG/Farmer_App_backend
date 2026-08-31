require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Models
const User = require('./models/User');
const Division = require('./models/Division');
const Crop = require('./models/Crop');
const CropDetail = require('./models/CropDetail');
const MarketPrice = require('./models/MarketPrice');
const Market = require('./models/Market');
const Price = require('./models/Price');
const Source = require('./models/Source');
const WeatherRecord = require('./models/WeatherRecord');
const SavedCrop = require('./models/SavedCrop');
const Notification = require('./models/Notification');
const AdminLog = require('./models/AdminLog');
const { syncHartiPrices } = require('./services/hartiService');
const { syncCbslPrices } = require('./services/cbslService');

async function seed() {
  const dbUri = process.env.DATABASE_URL;
  if (!dbUri) {
    console.error('DATABASE_URL is not defined in the environmental variables.');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB database...');
    await mongoose.connect(dbUri);
    console.log('MongoDB Connected for seeding.');

    // 1. Clear existing data
    console.log('Clearing existing agricultural collections...');
    await Promise.all([
      AdminLog.deleteMany({}),
      Notification.deleteMany({}),
      SavedCrop.deleteMany({}),
      WeatherRecord.deleteMany({}),
      MarketPrice.deleteMany({}),
      Price.deleteMany({}),
      Source.deleteMany({}),
      Market.deleteMany({}),
      CropDetail.deleteMany({}),
      Crop.deleteMany({}),
      Division.deleteMany({}),
      User.deleteMany({})
    ]);
    console.log('All collections cleared.');

    // 2. Create Divisions (All 25 Sri Lankan Districts + Economic/Cultivation Centers)
    console.log('Creating Divisions (25 Sri Lankan Districts & Economic Centers)...');
    const sriLankaDivisionsData = [
      { name: 'Ampara', district: 'Ampara', province: 'Eastern', latitude: 7.2886, longitude: 81.6734 },
      { name: 'Anuradhapura', district: 'Anuradhapura', province: 'North Central', latitude: 8.3114, longitude: 80.4037 },
      { name: 'Badulla', district: 'Badulla', province: 'Uva', latitude: 6.9934, longitude: 81.0550 },
      { name: 'Batticaloa', district: 'Batticaloa', province: 'Eastern', latitude: 7.7310, longitude: 81.6747 },
      { name: 'Colombo', district: 'Colombo', province: 'Western', latitude: 6.9271, longitude: 79.8612 },
      { name: 'Dambulla', district: 'Matale', province: 'Central', latitude: 7.8608, longitude: 80.6517 },
      { name: 'Galle', district: 'Galle', province: 'Southern', latitude: 6.0535, longitude: 80.2210 },
      { name: 'Gampaha', district: 'Gampaha', province: 'Western', latitude: 7.0840, longitude: 79.9925 },
      { name: 'Hambantota', district: 'Hambantota', province: 'Southern', latitude: 6.1429, longitude: 81.1212 },
      { name: 'Jaffna', district: 'Jaffna', province: 'Northern', latitude: 9.6615, longitude: 80.0255 },
      { name: 'Kalutara', district: 'Kalutara', province: 'Western', latitude: 6.5854, longitude: 79.9607 },
      { name: 'Kandy', district: 'Kandy', province: 'Central', latitude: 7.2906, longitude: 80.6337 },
      { name: 'Kegalle', district: 'Kegalle', province: 'Sabaragamuwa', latitude: 7.2513, longitude: 80.3464 },
      { name: 'Keppetipola', district: 'Badulla', province: 'Uva', latitude: 6.8906, longitude: 80.9125 },
      { name: 'Kilinochchi', district: 'Kilinochchi', province: 'Northern', latitude: 9.3803, longitude: 80.3770 },
      { name: 'Kurunegala', district: 'Kurunegala', province: 'North Western', latitude: 7.4863, longitude: 80.3647 },
      { name: 'Mannar', district: 'Mannar', province: 'Northern', latitude: 8.9810, longitude: 79.9044 },
      { name: 'Matale', district: 'Matale', province: 'Central', latitude: 7.4675, longitude: 80.6234 },
      { name: 'Matara', district: 'Matara', province: 'Southern', latitude: 5.9549, longitude: 80.5550 },
      { name: 'Moneragala', district: 'Moneragala', province: 'Uva', latitude: 6.8724, longitude: 81.3507 },
      { name: 'Mullaitivu', district: 'Mullaitivu', province: 'Northern', latitude: 9.2671, longitude: 80.8142 },
      { name: 'Narahenpita', district: 'Colombo', province: 'Western', latitude: 6.9038, longitude: 79.8796 },
      { name: 'Nuwara Eliya', district: 'Nuwara Eliya', province: 'Central', latitude: 6.9497, longitude: 80.7891 },
      { name: 'Pettah', district: 'Colombo', province: 'Western', latitude: 6.9372, longitude: 79.8557 },
      { name: 'Polonnaruwa', district: 'Polonnaruwa', province: 'North Central', latitude: 7.9403, longitude: 81.0188 },
      { name: 'Puttalam', district: 'Puttalam', province: 'North Western', latitude: 8.0362, longitude: 79.8283 },
      { name: 'Ratnapura', district: 'Ratnapura', province: 'Sabaragamuwa', latitude: 6.6828, longitude: 80.3992 },
      { name: 'Trincomalee', district: 'Trincomalee', province: 'Eastern', latitude: 8.5874, longitude: 81.2152 },
      { name: 'Vavuniya', district: 'Vavuniya', province: 'Northern', latitude: 8.7542, longitude: 80.4982 }
    ];

    const createdDivisions = await Division.insertMany(sriLankaDivisionsData);
    const divDambulla = createdDivisions.find(d => d.name === 'Dambulla') || createdDivisions[0];
    const divPettah = createdDivisions.find(d => d.name === 'Pettah') || createdDivisions[1];
    const divKeppetipola = createdDivisions.find(d => d.name === 'Keppetipola') || createdDivisions[2];
    const divNarahenpita = createdDivisions.find(d => d.name === 'Narahenpita') || createdDivisions[3];

    console.log(`Created ${createdDivisions.length} divisions across Sri Lanka.`);

    // 3. Create Users with encrypted passwords
    console.log('Creating Users with hashed passwords...');
    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@farmer.com';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'admin123';
    const managerEmail = process.env.SEED_MANAGER_EMAIL || 'manager@farmer.com';
    const managerPassword = process.env.SEED_MANAGER_PASSWORD || 'manager123';
    const dataEntryEmail = process.env.SEED_DATA_ENTRY_EMAIL || 'dataentry@farmer.com';
    const dataEntryPassword = process.env.SEED_DATA_ENTRY_PASSWORD || 'dataentry123';
    const farmer1Email = process.env.SEED_FARMER1_EMAIL || 'siri@farmer.com';
    const farmer2Email = process.env.SEED_FARMER2_EMAIL || 'kamal@farmer.com';
    const farmerPassword = process.env.SEED_FARMER_PASSWORD || 'farmer123';

    const salt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash(adminPassword, salt);
    const managerPasswordHash = await bcrypt.hash(managerPassword, salt);
    const dataEntryPasswordHash = await bcrypt.hash(dataEntryPassword, salt);
    const farmerPasswordHash = await bcrypt.hash(farmerPassword, salt);

    const admin = await User.create({
      username: 'Thanura Admin',
      email: adminEmail,
      password_hash: adminPasswordHash,
      role: 'admin',
      phone_number: '+94712345678',
      division_id: divPettah._id
    });

    const manager = await User.create({
      username: 'Kusal Manager',
      email: managerEmail,
      password_hash: managerPasswordHash,
      role: 'manager',
      phone_number: '+94771234567',
      division_id: divKeppetipola._id
    });

    const dataEntry = await User.create({
      username: 'Nimal Data Entry',
      email: dataEntryEmail,
      password_hash: dataEntryPasswordHash,
      role: 'data_entry',
      phone_number: '+94721234567',
      division_id: divDambulla._id
    });

    const farmer1 = await User.create({
      username: 'Siriwardena Bandara',
      email: farmer1Email,
      password_hash: farmerPasswordHash,
      role: 'farmer',
      phone_number: '+94751234567',
      division_id: divDambulla._id
    });

    const farmer2 = await User.create({
      username: 'Kamal Perera',
      email: farmer2Email,
      password_hash: farmerPasswordHash,
      role: 'farmer',
      phone_number: '+94761234567',
      division_id: divKeppetipola._id
    });

    console.log('Created Users: Admin, Manager, Data Entry, and 2 Farmers.');

    // 4. Create Crops (71 items covering all 6 exact categories)
    console.log('Creating Crop guidelines for 71 crops...');
    const cropsData = [
      // 1. Paddy / Cereals (4 items)
      {
        name: 'Paddy (Rice)',
        nameSi: 'වී',
        category: 'Paddy / Cereals',
        slug: 'paddy-rice',
        season: 'Yala & Maha',
        description: 'The staple grain crop of Sri Lanka, cultivated extensively across dry and intermediate zones.',
        image_url: 'https://images.unsplash.com/photo-1536657235019-0307116c1740?w=400&q=80',
        detail: { scientific_name: 'Oryza sativa L.', soil_type: 'Clayey soils or heavy loams with high water retention', growing_tips: 'Maintain 2-5cm standing water in vegetative stage. Drain 2 weeks prior to harvest.', pest_management: 'Monitor for Stem Borer and Brown Planthopper.', harvest_duration_days: 115 }
      },
      {
        name: 'Maize',
        nameSi: 'බඩ ඉරිඟු',
        category: 'Paddy / Cereals',
        slug: 'maize',
        season: 'Maha & Yala',
        description: 'Key cereal crop grown for human consumption and animal feed industry.',
        image_url: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&q=80',
        detail: { scientific_name: 'Zea mays', soil_type: 'Well-drained fertile loamy soil with pH 5.8-7.0', growing_tips: 'Requires full sunlight and consistent moisture during tasseling and silking.', pest_management: 'Control Fall Armyworm (FAW) with neem spray or recommended bio-insecticides.', harvest_duration_days: 105 }
      },
      {
        name: 'Kurakkan (Finger Millet)',
        nameSi: 'කුරක්කන්',
        category: 'Paddy / Cereals',
        slug: 'kurakkan-finger-millet',
        season: 'Yala & Maha',
        description: 'Highly nutritious drought-resistant traditional cereal rich in calcium and fiber.',
        image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80',
        detail: { scientific_name: 'Eleusine coracana', soil_type: 'Free draining light soils, tolerant to poor fertility', growing_tips: 'Requires minimal water after seed germination.', pest_management: 'Low pest incidence; weed early within first 25 days.', harvest_duration_days: 95 }
      },
      {
        name: 'Sorghum',
        nameSi: 'සෝර්ගම්',
        category: 'Paddy / Cereals',
        slug: 'sorghum',
        season: 'Yala & Maha',
        description: 'Resilient cereal crop suitable for dry rainfed conditions.',
        image_url: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80',
        detail: { scientific_name: 'Sorghum bicolor', soil_type: 'Adaptable to wide range of soils including saline and clay soils', growing_tips: 'Ensure deep tillage before planting.', pest_management: 'Protect head grains from birds during seed hardening.', harvest_duration_days: 100 }
      },

      // 2. Field Crops / Other Food Crops (11 items)
      {
        name: 'Potato',
        nameSi: 'අර්තාපල්',
        category: 'Field Crops / Other Food Crops',
        slug: 'potato',
        season: 'Maha & Yala',
        description: 'High value tuber crop cultivated mainly in Nuwara Eliya and Badulla hill country.',
        image_url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80',
        detail: { scientific_name: 'Solanum tuberosum', soil_type: 'Friable, well-aerated sandy loam with high organic matter', growing_tips: 'Earthing up soil around stems encourages tuber expansion.', pest_management: 'Manage Late Blight with proper crop rotation and fungicides.', harvest_duration_days: 90 }
      },
      {
        name: 'Sweet Potato',
        nameSi: 'බතල',
        category: 'Field Crops / Other Food Crops',
        slug: 'sweet-potato',
        season: 'Yala & Maha',
        description: 'Root vegetable rich in starch, vitamins, and minerals.',
        image_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80',
        detail: { scientific_name: 'Ipomoea batatas', soil_type: 'Sandy loam to loamy soil', growing_tips: 'Plant vine cuttings on raised ridges for optimum root growth.', pest_management: 'Watch for Sweet Potato Weevil.', harvest_duration_days: 110 }
      },
      {
        name: 'Manioc / Cassava',
        nameSi: 'මඤ්ඤොක්කා',
        category: 'Field Crops / Other Food Crops',
        slug: 'manioc-cassava',
        season: 'Year-round',
        description: 'Hardy root crop providing essential energy and starch across all provinces.',
        image_url: 'https://images.unsplash.com/photo-1590165482129-1b8b27698780?w=400&q=80',
        detail: { scientific_name: 'Manihot esculenta', soil_type: 'Well-drained light sandy to medium loam soils', growing_tips: 'Plant stem cuttings vertically or inclined 45 degrees.', pest_management: 'Ensure clean stem cuttings free from cassava mosaic virus.', harvest_duration_days: 240 }
      },
      {
        name: 'Big Onion',
        nameSi: 'ලොකු ලූනු',
        category: 'Field Crops / Other Food Crops',
        slug: 'big-onion',
        season: 'Yala',
        description: 'Commercial bulb crop cultivated heavily in Dambulla, Anuradhapura, and Matale.',
        image_url: 'https://images.unsplash.com/photo-1620574387735-3624d75b2dbc?w=400&q=80',
        detail: { scientific_name: 'Allium cepa L.', soil_type: 'Fertile sandy loam with good organic content', growing_tips: 'Stop irrigation 10-14 days before harvest for proper field curing.', pest_management: 'Control Onion Thrips and Stemphylium leaf blight.', harvest_duration_days: 105 }
      },
      {
        name: 'Red Onion',
        nameSi: 'රතු ලූනු',
        category: 'Field Crops / Other Food Crops',
        slug: 'red-onion',
        season: 'Yala & Maha',
        description: 'Essential condiment bulb crop grown extensively in Jaffna and Puttalam.',
        image_url: 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=400&q=80',
        detail: { scientific_name: 'Allium cepa var. aggregatum', soil_type: 'Sandy loam or porous soils with neutral pH', growing_tips: 'Plant mother bulbs on raised beds with shallow depth.', pest_management: 'Prevent Leaf Twister disease with fungicidal sett treatment.', harvest_duration_days: 75 }
      },
      {
        name: 'Green Gram',
        nameSi: 'මුං ඇට',
        category: 'Field Crops / Other Food Crops',
        slug: 'green-gram',
        season: 'Yala & Maha',
        description: 'Short duration pulse crop rich in protein, ideal for rice-field crop rotation.',
        image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
        detail: { scientific_name: 'Vigna radiata', soil_type: 'Well-drained loam or sandy clay loam', growing_tips: 'Inoculate seed with Rhizobium for better nitrogen fixation.', pest_management: 'Monitor for Pod Borer and Aphids.', harvest_duration_days: 65 }
      },
      {
        name: 'Cowpea',
        nameSi: 'කව්පි',
        category: 'Field Crops / Other Food Crops',
        slug: 'cowpea',
        season: 'Yala & Maha',
        description: 'Nutritious pulse grown under rainfed dry zone conditions.',
        image_url: 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=400&q=80',
        detail: { scientific_name: 'Vigna unguiculata', soil_type: 'Adaptable to poor, sandy or clay soils', growing_tips: 'Provides excellent green manure and soil nitrogen enrichment.', pest_management: 'Control Maruca pod borer and bean fly.', harvest_duration_days: 70 }
      },
      {
        name: 'Black Gram',
        nameSi: 'උඳු',
        category: 'Field Crops / Other Food Crops',
        slug: 'black-gram',
        season: 'Maha',
        description: 'Pulse crop used in traditional foods, cultivated in Northern and North-Central regions.',
        image_url: 'https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=400&q=80',
        detail: { scientific_name: 'Vigna mungo', soil_type: 'Heavy clay or loamy soils', growing_tips: 'Sow in residual soil moisture after paddy harvest.', pest_management: 'Protect against Powdery Mildew and Yellow Mosaic Virus.', harvest_duration_days: 75 }
      },
      {
        name: 'Groundnut',
        nameSi: 'රටකජු',
        category: 'Field Crops / Other Food Crops',
        slug: 'groundnut',
        season: 'Yala & Maha',
        description: 'Oilseed and snack leguminous crop grown in sandy soils of Moneragala & Hambantota.',
        image_url: 'https://images.unsplash.com/photo-1567406807805-32204c3c3836?w=400&q=80',
        detail: { scientific_name: 'Arachis hypogaea', soil_type: 'Light sandy loam or friable loose soil for peg penetration', growing_tips: 'Ensure adequate Calcium (Gypsum application) during pegging stage.', pest_management: 'Prevent Leaf Spot (Tikka disease) and pod rot.', harvest_duration_days: 105 }
      },
      {
        name: 'Soybean',
        nameSi: 'සෝයා',
        category: 'Field Crops / Other Food Crops',
        slug: 'soybean',
        season: 'Yala',
        description: 'Protein and oil-dense legume cultivated under irrigation in Mahaweli areas.',
        image_url: 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?w=400&q=80',
        detail: { scientific_name: 'Glycine max', soil_type: 'Fertile loams with good drainage', growing_tips: 'Keep field weed-free during initial 30 days of growth.', pest_management: 'Monitor for pod sucking bugs and hairy caterpillars.', harvest_duration_days: 90 }
      },
      {
        name: 'Sesame',
        nameSi: 'තල',
        category: 'Field Crops / Other Food Crops',
        slug: 'sesame',
        season: 'Yala',
        description: 'Traditional oilseed crop highly resilient to extreme heat and drought.',
        image_url: 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400&q=80',
        detail: { scientific_name: 'Sesamum indicum', soil_type: 'Well-drained light to medium textured soils', growing_tips: 'Requires warm temperatures and light rain at sowing.', pest_management: 'Control Sesame Webworm and Gall Fly.', harvest_duration_days: 80 }
      },

      // 3. Vegetables (22 items)
      {
        name: 'Tomato',
        nameSi: 'තක්කාලි',
        category: 'Vegetables',
        slug: 'tomato',
        season: 'Yala & Maha',
        description: 'High-value fruit vegetable cultivated across dry, intermediate, and hill country zones.',
        image_url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&q=80',
        detail: { scientific_name: 'Solanum lycopersicum', soil_type: 'Rich, well-drained sandy loam or clay loam', growing_tips: 'Stake plants early and prune bottom side suckers.', pest_management: 'Control Fruit Borer and Whitefly; apply copper fungicide for Early Blight.', harvest_duration_days: 90 }
      },
      {
        name: 'Brinjal / Eggplant',
        nameSi: 'වම්බටු',
        category: 'Vegetables',
        slug: 'brinjal-eggplant',
        season: 'Year-round',
        description: 'Popular solanaceous vegetable with high domestic yield demand.',
        image_url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&q=80',
        detail: { scientific_name: 'Solanum melongena', soil_type: 'Silt loam or clay loam with high organic matter', growing_tips: 'Ensure deep irrigation during fruit formation.', pest_management: 'Control Shoot and Fruit Borer by clipping affected tips.', harvest_duration_days: 120 }
      },
      {
        name: 'Capsicum',
        nameSi: 'මාළු මිරිස්',
        category: 'Vegetables',
        slug: 'capsicum',
        season: 'Yala & Maha',
        description: 'Mild pepper cultivated widely in Nuwara Eliya, Matale, and Badulla.',
        image_url: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400&q=80',
        detail: { scientific_name: 'Capsicum annuum var. grossum', soil_type: 'Loamy soil rich in humus', growing_tips: 'Provide support staking for heavy fruit load.', pest_management: 'Manage Mites and Bacterial Wilt.', harvest_duration_days: 85 }
      },
      {
        name: 'Green Chilli',
        nameSi: 'අමු මිරිස්',
        category: 'Vegetables',
        slug: 'green-chilli',
        season: 'Yala & Maha',
        description: 'Essential condiment vegetable grown heavily in Dry Zone schemes.',
        image_url: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=400&q=80',
        detail: { scientific_name: 'Capsicum annuum L.', soil_type: 'Well-drained sandy loam with pH 6.0-7.0', growing_tips: 'Avoid waterlogging at stem bases.', pest_management: 'Control Chilli Leaf Curl Complex (Thrips and Whitefly).', harvest_duration_days: 100 }
      },
      {
        name: 'Pumpkin',
        nameSi: 'වට්ටක්කා',
        category: 'Vegetables',
        slug: 'pumpkin',
        season: 'Yala & Maha',
        description: 'Trailing vine vegetable producing large nutritious orange squashes.',
        image_url: 'https://images.unsplash.com/photo-1570586437263-ab629fccc818?w=400&q=80',
        detail: { scientific_name: 'Cucurbita moschata', soil_type: 'Organic-rich sandy loams', growing_tips: 'Plant in shallow basins with plenty of well-rotted manure.', pest_management: 'Protect young leaves from Pumpkin Beetle.', harvest_duration_days: 100 }
      },
      {
        name: 'Cucumber',
        nameSi: 'පිපිඤ්ඤා',
        category: 'Vegetables',
        slug: 'cucumber',
        season: 'Year-round',
        description: 'Fast growing succulent fruit vegetable for fresh consumption.',
        image_url: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=400&q=80',
        detail: { scientific_name: 'Cucumis sativus', soil_type: 'Well-drained light loams', growing_tips: 'Trellis vines for cleaner, uniform fruits.', pest_management: 'Prevent Downy Mildew with broad spectrum fungicides.', harvest_duration_days: 55 }
      },
      {
        name: 'Snake Gourd',
        nameSi: 'පතෝල',
        category: 'Vegetables',
        slug: 'snake-gourd',
        season: 'Yala & Maha',
        description: 'Long slender climbing gourd grown on overhead bamboo trellises.',
        image_url: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&q=80',
        detail: { scientific_name: 'Trichosanthes cucumerina', soil_type: 'Rich sandy loams with deep tilth', growing_tips: 'Tie small stone weights to young fruit tips to grow straight gourds.', pest_management: 'Control Fruit Fly with pheromone bait traps.', harvest_duration_days: 70 }
      },
      {
        name: 'Bitter Gourd',
        nameSi: 'කරවිල',
        category: 'Vegetables',
        slug: 'bitter-gourd',
        season: 'Yala & Maha',
        description: 'Medicinal and culinary gourd with distinct bitter taste.',
        image_url: 'https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=400&q=80',
        detail: { scientific_name: 'Momordica charantia', soil_type: 'Sandy loam enriched with compost', growing_tips: 'Provide sturdy pandal trellis structure.', pest_management: 'Fruit fly management is critical during fruit setting.', harvest_duration_days: 65 }
      },
      {
        name: 'Ridge Gourd',
        nameSi: 'වැටකොළු',
        category: 'Vegetables',
        slug: 'ridge-gourd',
        season: 'Yala & Maha',
        description: 'Ribbed cucurbit vegetable cultivated throughout Sri Lanka.',
        image_url: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&q=80',
        detail: { scientific_name: 'Luffa acutangula', soil_type: 'Silt loam or clay loam with high organic matter', growing_tips: 'Pinch main terminal shoot to promote lateral fruiting branches.', pest_management: 'Watch for Epilachna beetle damage.', harvest_duration_days: 60 }
      },
      {
        name: 'Ash Plantain / Ash Gourd',
        nameSi: 'පුහුල්',
        category: 'Vegetables',
        slug: 'ash-plantain-ash-gourd',
        season: 'Year-round',
        description: 'Large waxy white gourd widely used in traditional cooking and curries.',
        image_url: 'https://images.unsplash.com/photo-1570586437263-ab629fccc818?w=400&q=80',
        detail: { scientific_name: 'Benincasa hispida', soil_type: 'Sandy loams to well-drained clay loams', growing_tips: 'Requires ample space for wide vine spread.', pest_management: 'Low pest problems; protect young shoots from red beetles.', harvest_duration_days: 120 }
      },
      {
        name: 'Okra',
        nameSi: 'බණ්ඩක්කා',
        category: 'Vegetables',
        slug: 'okra',
        season: 'Year-round',
        description: 'Popular fibrous green pod vegetable grown across lowlands.',
        image_url: 'https://images.unsplash.com/photo-1628773822503-930a8585c391?w=400&q=80',
        detail: { scientific_name: 'Abelmoschus esculentus', soil_type: 'Adaptable to most soils with good drainage', growing_tips: 'Soak seeds in warm water overnight before sowing.', pest_management: 'Use YVMV (Yellow Vein Mosaic Virus) resistant varieties.', harvest_duration_days: 60 }
      },
      {
        name: 'Cabbage',
        nameSi: 'ගෝවා',
        category: 'Vegetables',
        slug: 'cabbage',
        season: 'Maha & Yala',
        description: 'Cool-season leafy head crop cultivated in Nuwara Eliya and Badulla.',
        image_url: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=400&q=80',
        detail: { scientific_name: 'Brassica oleracea var. capitata', soil_type: 'Heavy fertile clay loams rich in nitrogen and organic matter', growing_tips: 'Maintain consistent soil moisture to prevent head splitting.', pest_management: 'Control Diamondback Moth (DBM) with integrated pest management.', harvest_duration_days: 90 }
      },
      {
        name: 'Knol-khol',
        nameSi: 'නෝල්කෝල්',
        category: 'Vegetables',
        slug: 'knol-khol',
        season: 'Maha',
        description: 'Swollen stem turnip-like vegetable grown in hill country regions.',
        image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80',
        detail: { scientific_name: 'Brassica oleracea var. gongylodes', soil_type: 'Sandy loam to clay loam', growing_tips: 'Harvest when stem tubers reach 5-7cm diameter before becoming woody.', pest_management: 'Watch for Flea Beetles.', harvest_duration_days: 60 }
      },
      {
        name: 'Carrot',
        nameSi: 'කැරට්',
        category: 'Vegetables',
        slug: 'carrot',
        season: 'Maha & Yala',
        description: 'High value root crop grown in high altitude hill terraced fields.',
        image_url: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&q=80',
        detail: { scientific_name: 'Daucus carota', soil_type: 'Deep, stone-free loose sandy loam', growing_tips: 'Thin seedlings early to 5cm distance for straight taproots.', pest_management: 'Prevent Leaf Blight and Root-knot Nematodes.', harvest_duration_days: 90 }
      },
      {
        name: 'Beetroot',
        nameSi: 'බීට්',
        category: 'Vegetables',
        slug: 'beetroot',
        season: 'Year-round',
        description: 'Deep red tuberous root vegetable rich in antioxidants.',
        image_url: 'https://images.unsplash.com/photo-1593105544559-ecb03bf76f82?w=400&q=80',
        detail: { scientific_name: 'Beta vulgaris', soil_type: 'Friable fertile soil with good potassium levels', growing_tips: 'Soak cluster seedballs prior to planting.', pest_management: 'Control Cercospora Leaf Spot.', harvest_duration_days: 75 }
      },
      {
        name: 'Radish',
        nameSi: 'රාබු',
        category: 'Vegetables',
        slug: 'radish',
        season: 'Year-round',
        description: 'Fast maturing pungent root vegetable suitable for quick crop cycles.',
        image_url: 'https://images.unsplash.com/photo-1506806732259-39c2d0268443?w=400&q=80',
        detail: { scientific_name: 'Raphanus sativus', soil_type: 'Light sandy loams with uniform moisture', growing_tips: 'Harvest promptly to avoid pithiness and over-pungency.', pest_management: 'Low pest risk; watch for root grubs.', harvest_duration_days: 45 }
      },
      {
        name: 'Leeks',
        nameSi: 'ලීක්ස්',
        category: 'Vegetables',
        slug: 'leeks',
        season: 'Maha & Yala',
        description: 'Up-country premium allium crop with long white blanched stems.',
        image_url: 'https://images.unsplash.com/photo-1587049352847-4a222e784d38?w=400&q=80',
        detail: { scientific_name: 'Allium ampeloprasum var. porrum', soil_type: 'Deep fertile soil with organic manure', growing_tips: 'Mound soil around stalks progressively to blanch stems white.', pest_management: 'Control Thrips and Rust fungus.', harvest_duration_days: 110 }
      },
      {
        name: 'Beans',
        nameSi: 'බෝංචි',
        category: 'Vegetables',
        slug: 'beans',
        season: 'Year-round',
        description: 'Bush and pole snap beans grown extensively across Central and Uva provinces.',
        image_url: 'https://images.unsplash.com/photo-1567375698348-5d9d5ae99de0?w=400&q=80',
        detail: { scientific_name: 'Phaseolus vulgaris', soil_type: 'Well-drained loam with pH 6.0-6.8', growing_tips: 'Provide vertical stakes or wire trellises for climbing pole varieties.', pest_management: 'Control Bean Fly and Rust disease.', harvest_duration_days: 70 }
      },
      {
        name: 'Winged Bean',
        nameSi: 'දඹල',
        category: 'Vegetables',
        slug: 'winged-bean',
        season: 'Maha',
        description: 'Four-angled tropical legume where pods, leaves, and tubers are all edible.',
        image_url: 'https://images.unsplash.com/photo-1567375698348-5d9d5ae99de0?w=400&q=80',
        detail: { scientific_name: 'Psophocarpus tetragonolobus', soil_type: 'Adaptable to sandy and clay soils', growing_tips: 'Requires long trellis frames for high pod yields.', pest_management: 'Resilient crop with minimal pest vulnerability.', harvest_duration_days: 80 }
      },
      {
        name: 'Snake Bean',
        nameSi: 'මෑ',
        category: 'Vegetables',
        slug: 'snake-bean',
        season: 'Year-round',
        description: 'Long yard-long bean pod cultivated in dry and intermediate lowlands.',
        image_url: 'https://images.unsplash.com/photo-1567375698348-5d9d5ae99de0?w=400&q=80',
        detail: { scientific_name: 'Vigna unguiculata subsp. sesquipedalis', soil_type: 'Warm well-drained loams', growing_tips: 'Pick tender pods frequently to prolong fruiting phase.', pest_management: 'Manage Aphids and Pod Borers.', harvest_duration_days: 60 }
      },
      {
        name: 'Lettuce',
        nameSi: 'සලාද කොළ',
        category: 'Vegetables',
        slug: 'lettuce',
        season: 'Year-round',
        description: 'Leafy salad vegetable grown in cool climates and under protected structures.',
        image_url: 'https://images.unsplash.com/photo-1556782506-6086f68c34f3?w=400&q=80',
        detail: { scientific_name: 'Lactuca sativa', soil_type: 'High organic matter sandy loams or hydroponic substrate', growing_tips: 'Irrigate lightly and frequently; harvest early morning.', pest_management: 'Protect from Snails, Slugs, and Aphids.', harvest_duration_days: 45 }
      },
      {
        name: 'Drumstick / Moringa',
        nameSi: 'මුරුංගා',
        category: 'Vegetables',
        slug: 'drumstick-moringa',
        season: 'Year-round',
        description: 'Perennial tree vegetable producing tender pods and nutrient-packed leaves.',
        image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80',
        detail: { scientific_name: 'Moringa oleifera', soil_type: 'Dry sandy loams; highly drought resistant', growing_tips: 'Prune branches back annually to promote compact bushy growth.', pest_management: 'Control Hairy Caterpillars.', harvest_duration_days: 180 }
      },

      // 4. Fruits (17 items)
      {
        name: 'Banana',
        nameSi: 'කෙසෙල්',
        category: 'Fruits',
        slug: 'banana',
        season: 'Year-round',
        description: 'Primary fruit crop of Sri Lanka including Ambul, Kolikuttu, and Seeni varieties.',
        image_url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&q=80',
        detail: { scientific_name: 'Musa acuminata', soil_type: 'Deep fertile well-drained loams rich in organic material', growing_tips: 'Desucker regularly leaving only 1 main plant and 1 follower sucker.', pest_management: 'Control Banana Weevil and Panama Fusarium Wilt.', harvest_duration_days: 300 }
      },
      {
        name: 'Mango',
        nameSi: 'අඹ',
        category: 'Fruits',
        slug: 'mango',
        season: 'Yala',
        description: 'Perennial fruit tree producing sweet varieties like Karthakolomban and TomEJC.',
        image_url: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&q=80',
        detail: { scientific_name: 'Mangifera indica', soil_type: 'Deep alluvial loams with deep water table', growing_tips: 'Induce off-season flowering with Paclobutrazol under expert advice.', pest_management: 'Control Fruit Fly with protein bait spray and bag fruits.', harvest_duration_days: 120 }
      },
      {
        name: 'Papaya',
        nameSi: 'ගස්ලබු',
        category: 'Fruits',
        slug: 'papaya',
        season: 'Year-round',
        description: 'Fast growing tropical fruit crop yielding sweet melon-like fruits.',
        image_url: 'https://images.unsplash.com/photo-1517260739337-6799d239ce83?w=400&q=80',
        detail: { scientific_name: 'Carica papaya', soil_type: 'Well-drained light loams; highly sensitive to waterlogging', growing_tips: 'Plant hermaphrodite seedlings (Red Lady variety).', pest_management: 'Manage Papaya Mealybug with biological predators.', harvest_duration_days: 240 }
      },
      {
        name: 'Pineapple',
        nameSi: 'අන්නාසි',
        category: 'Fruits',
        slug: 'pineapple',
        season: 'Year-round',
        description: 'Major commercial fruit crop grown in Gampaha and Kurunegala districts.',
        image_url: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=400&q=80',
        detail: { scientific_name: 'Ananas comosus', soil_type: 'Well-drained gravelly or sandy clay loam with pH 4.5-5.5', growing_tips: 'Hormone flower induction (Ethephon) allows synchronized harvesting.', pest_management: 'Control Mealybug Wilt.', harvest_duration_days: 400 }
      },
      {
        name: 'Watermelon',
        nameSi: 'කොමඩු',
        category: 'Fruits',
        slug: 'watermelon',
        season: 'Yala',
        description: 'Refreshing juicy fruit grown in dry zone river basins and paddy fields.',
        image_url: 'https://images.unsplash.com/photo-1587049352847-4a222e784d38?w=400&q=80',
        detail: { scientific_name: 'Citrullus lanatus', soil_type: 'Deep sandy loam near water sources', growing_tips: 'Place straw under developing fruits to avoid soil rot.', pest_management: 'Protect against Fruit Fly and Powdery Mildew.', harvest_duration_days: 80 }
      },
      {
        name: 'Passion Fruit',
        nameSi: 'පැෂන් ෆෘට්',
        category: 'Fruits',
        slug: 'passion-fruit',
        season: 'Year-round',
        description: 'Vigorous climbing fruit vine producing tangy aromatic juice fruits.',
        image_url: 'https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=400&q=80',
        detail: { scientific_name: 'Passiflora edulis', soil_type: 'Rich well-drained loams', growing_tips: 'Construct durable overhead wire trellises for vine spreading.', pest_management: 'Control Passionfruit Woodiness Virus.', harvest_duration_days: 180 }
      },
      {
        name: 'Guava',
        nameSi: 'පේර',
        category: 'Fruits',
        slug: 'guava',
        season: 'Year-round',
        description: 'Hardy fruit tree producing Vitamin-C rich crispy white/pink guava.',
        image_url: 'https://images.unsplash.com/photo-1536511135882-f584e037b3f9?w=400&q=80',
        detail: { scientific_name: 'Psidium guajava', soil_type: 'Adaptable to wide range of soils', growing_tips: 'Prune branches after each harvest to trigger new fruiting shoots.', pest_management: 'Bag young fruit to prevent Fruit Fly stings.', harvest_duration_days: 150 }
      },
      {
        name: 'Avocado',
        nameSi: 'අලිගැටපේර',
        category: 'Fruits',
        slug: 'avocado',
        season: 'Yala',
        description: 'Nutritious buttery fruit grown in Mid-Country wet and intermediate zones.',
        image_url: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400&q=80',
        detail: { scientific_name: 'Persea americana', soil_type: 'Deep loose well-drained soils', growing_tips: 'Avoid soil compaction and water stagnation.', pest_management: 'Control Phytophthora Root Rot with clean drainage.', harvest_duration_days: 200 }
      },
      {
        name: 'Rambutan',
        nameSi: 'රඹුටන්',
        category: 'Fruits',
        slug: 'rambutan',
        season: 'Yala',
        description: 'Exotic hairy juicy sweet fruit cultivated in Malwana and Gampaha region.',
        image_url: 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=400&q=80',
        detail: { scientific_name: 'Nephelium lappaceum', soil_type: 'Deep sandy clay loams rich in organic matter', growing_tips: 'Propagate by budding or grafting for true-to-type sweetness.', pest_management: 'Protect ripening clusters from birds and bats.', harvest_duration_days: 120 }
      },
      {
        name: 'Wood Apple',
        nameSi: 'දිවුල්',
        category: 'Fruits',
        slug: 'wood-apple',
        season: 'Yala',
        description: 'Traditional hard-shelled dry zone fruit used for juices and jams.',
        image_url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&q=80',
        detail: { scientific_name: 'Limonia acidissima', soil_type: 'Dry zone arid soils', growing_tips: 'Requires minimal maintenance once established.', pest_management: 'Highly resistant natural fruit tree.', harvest_duration_days: 210 }
      },
      {
        name: 'Jackfruit',
        nameSi: 'කොස්',
        category: 'Fruits',
        slug: 'jackfruit',
        season: 'Yala & Maha',
        description: 'Massive multipurpose fruit tree producing edible tender jack, ripe jack, and seeds.',
        image_url: 'https://images.unsplash.com/photo-1590165482129-1b8b27698780?w=400&q=80',
        detail: { scientific_name: 'Artocarpus heterophyllus', soil_type: 'Deep moist loamy soil', growing_tips: 'Plant Fatherland / Fatherjack grafted varieties for early fruiting.', pest_management: 'Watch for Spittle Bugs on young shoots.', harvest_duration_days: 180 }
      },
      {
        name: 'Soursop',
        nameSi: 'කටු අනෝදා',
        category: 'Fruits',
        slug: 'soursop',
        season: 'Year-round',
        description: 'Medicinal custard-apple family fruit with dark green spiky skin.',
        image_url: 'https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=400&q=80',
        detail: { scientific_name: 'Annona muricata', soil_type: 'Well-drained tropical soils', growing_tips: 'Hand pollination increases fruit symmetry and set count.', pest_management: 'Control Mealybugs.', harvest_duration_days: 150 }
      },
      {
        name: 'Orange',
        nameSi: 'දොඩම්',
        category: 'Fruits',
        slug: 'orange',
        season: 'Yala',
        description: 'Citrus fruit grown in Bibile and Moneragala green orange belts.',
        image_url: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=400&q=80',
        detail: { scientific_name: 'Citrus sinensis', soil_type: 'Deep well-drained sandy loam', growing_tips: 'Use certified virus-free grafted rootstocks.', pest_management: 'Control Citrus Leaf Miner and Leafhopper.', harvest_duration_days: 210 }
      },
      {
        name: 'Lime',
        nameSi: 'දෙහි',
        category: 'Fruits',
        slug: 'lime',
        season: 'Year-round',
        description: 'Essential acid citrus fruit cultivated in dry zone homesteads.',
        image_url: 'https://images.unsplash.com/photo-1536511135882-f584e037b3f9?w=400&q=80',
        detail: { scientific_name: 'Citrus aurantiifolia', soil_type: 'Light sandy loams with good drainage', growing_tips: 'Prune dead wood and water sprouts annually.', pest_management: 'Control Citrus Canker Fungal infection.', harvest_duration_days: 150 }
      },
      {
        name: 'Lemon',
        nameSi: 'නාරං/ලෙමන්',
        category: 'Fruits',
        slug: 'lemon',
        season: 'Year-round',
        description: 'Aromatic citrus species cultivated for culinary flavorings.',
        image_url: 'https://images.unsplash.com/photo-1534531141161-e41d133a8979?w=400&q=80',
        detail: { scientific_name: 'Citrus limon', soil_type: 'Sandy loam to well-drained clay loam', growing_tips: 'Apply micronutrient sprays (Zinc, Iron) twice yearly.', pest_management: 'Protect from Aphids and Citrus Mites.', harvest_duration_days: 140 }
      },
      {
        name: 'Pomegranate',
        nameSi: 'දෙළුම්',
        category: 'Fruits',
        slug: 'pomegranate',
        season: 'Yala',
        description: 'Drought-tolerant fruit tree producing arils rich in antioxidants.',
        image_url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&q=80',
        detail: { scientific_name: 'Punica granatum', soil_type: 'Well-drained light loams; tolerates mild salinity', growing_tips: 'Prune to maintain 3-4 main trunks.', pest_management: 'Control Fruit Borer (Deudorix isocrates).', harvest_duration_days: 160 }
      },
      {
        name: 'Star Fruit',
        nameSi: 'කාමරංගා',
        category: 'Fruits',
        slug: 'star-fruit',
        season: 'Year-round',
        description: 'Tropical star-shaped juicy fruit tree (Averrhoa carambola).',
        image_url: 'https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=400&q=80',
        detail: { scientific_name: 'Averrhoa carambola', soil_type: 'Moist loamy soil', growing_tips: 'Requires shelter from strong winds.', pest_management: 'Protect ripening fruits from Fruit Fly damage.', harvest_duration_days: 120 }
      },

      // 5. Plantation / Export Crops (10 items)
      {
        name: 'Tea',
        nameSi: 'තේ',
        category: 'Plantation / Export Crops',
        slug: 'tea',
        season: 'Year-round',
        description: 'Iconic Ceylon Tea plantation crop grown in High, Mid, and Low country elevations.',
        image_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&q=80',
        detail: { scientific_name: 'Camellia sinensis', soil_type: 'Deep acidic soil (pH 4.5 - 5.5) with rich organic layer', growing_tips: 'Pluck two leaves and a bud every 7-10 days.', pest_management: 'Control Tea Tortrix and Shot-hole Borer.', harvest_duration_days: 7 }
      },
      {
        name: 'Rubber',
        nameSi: 'රබර්',
        category: 'Plantation / Export Crops',
        slug: 'rubber',
        season: 'Year-round',
        description: 'Commercial latex plantation tree cultivated in Western and Sabaragamuwa provinces.',
        image_url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&q=80',
        detail: { scientific_name: 'Hevea brasiliensis', soil_type: 'Deep, well-drained acidic soils', growing_tips: 'Tap latex early morning every two days.', pest_management: 'Control White Root Disease and Corynespora leaf spot.', harvest_duration_days: 2 }
      },
      {
        name: 'Coconut',
        nameSi: 'පොල්',
        category: 'Plantation / Export Crops',
        slug: 'coconut',
        season: 'Year-round',
        description: 'The Tree of Life, grown across the Coconut Triangle (Kurunegala, Puttalam, Gampaha).',
        image_url: 'https://images.unsplash.com/photo-1543791187-df796fa11835?w=400&q=80',
        detail: { scientific_name: 'Cocos nucifera', soil_type: 'Deep sandy loams or alluvial loams', growing_tips: 'Apply fertilizer in a 2m radius ring around palm base.', pest_management: 'Control Rhinoceros Beetle and Red Palm Weevil.', harvest_duration_days: 60 }
      },
      {
        name: 'Cinnamon',
        nameSi: 'කුරුඳු',
        category: 'Plantation / Export Crops',
        slug: 'cinnamon',
        season: 'Year-round',
        description: 'True Pure Ceylon Cinnamon (Cinnamomum zeylanicum) exported globally.',
        image_url: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=400&q=80',
        detail: { scientific_name: 'Cinnamomum verum', soil_type: 'Silver sand soils of Southern coast and red-yellow podzolic soils', growing_tips: 'Harvest shoots when bark turns brown; peel inner bark cleanly.', pest_management: 'Control Rough Bark Disease and Gall Mite.', harvest_duration_days: 180 }
      },
      {
        name: 'Pepper',
        nameSi: 'ගම්මිරිස්',
        category: 'Plantation / Export Crops',
        slug: 'pepper',
        season: 'Year-round',
        description: 'King of Spices climbing vine producing high-piperine black and white pepper.',
        image_url: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=400&q=80',
        detail: { scientific_name: 'Piper nigrum', soil_type: 'Well-drained rich friable soils', growing_tips: 'Train vines on living support trees like Gliricidia.', pest_management: 'Control Quick Wilt (Phytophthora) and Pepper Flea Beetle.', harvest_duration_days: 210 }
      },
      {
        name: 'Cardamom',
        nameSi: 'එනසාල්',
        category: 'Plantation / Export Crops',
        slug: 'cardamom',
        season: 'Maha',
        description: 'Queen of Spices grown under evergreen forest canopy in Central Highlands.',
        image_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80',
        detail: { scientific_name: 'Elettaria cardamomum', soil_type: 'Rich forest humus soil with high moisture content', growing_tips: 'Requires 50-60% overhead shade.', pest_management: 'Manage Cardamom Thrips and Stem Borer.', harvest_duration_days: 30 }
      },
      {
        name: 'Clove',
        nameSi: 'කරාබුනැටි',
        category: 'Plantation / Export Crops',
        slug: 'clove',
        season: 'Year-round',
        description: 'Aromatic unopened flower buds of Syzygium aromaticum tree.',
        image_url: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=400&q=80',
        detail: { scientific_name: 'Syzygium aromaticum', soil_type: 'Rich loams in wet and mid-country zones', growing_tips: 'Harvest flower clusters when buds turn pinkish before opening.', pest_management: 'Control Clove Stem Borer.', harvest_duration_days: 300 }
      },
      {
        name: 'Nutmeg',
        nameSi: 'සාදික්කා',
        category: 'Plantation / Export Crops',
        slug: 'nutmeg',
        season: 'Year-round',
        description: 'Tree yield providing both Nutmeg seed kernel and Mace aril spice.',
        image_url: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=400&q=80',
        detail: { scientific_name: 'Myristica fragrans', soil_type: 'Deep friable volcanic or alluvial soils', growing_tips: 'Ensure 1 male tree per 10 female trees for pollination.', pest_management: 'Low pest problems; protect from root rot.', harvest_duration_days: 180 }
      },
      {
        name: 'Coffee',
        nameSi: 'කෝපි',
        category: 'Plantation / Export Crops',
        slug: 'coffee',
        season: 'Year-round',
        description: 'Arabica and Robusta coffee species grown under shade in mid-elevations.',
        image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80',
        detail: { scientific_name: 'Coffea arabica / Coffea canephora', soil_type: 'Deep friable loams rich in humus', growing_tips: 'Prune vertical shoots to maintain bush height at 1.5 meters.', pest_management: 'Control Coffee Berry Borer and Coffee Rust fungus.', harvest_duration_days: 210 }
      },
      {
        name: 'Cocoa',
        nameSi: 'කොකෝවා',
        category: 'Plantation / Export Crops',
        slug: 'cocoa',
        season: 'Year-round',
        description: 'Chocolate raw bean crop cultivated under coconut or forest shade trees.',
        image_url: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400&q=80',
        detail: { scientific_name: 'Theobroma cacao', soil_type: 'Deep well-drained loams with neutral pH', growing_tips: 'Ferment fresh beans in wooden boxes 5-7 days after harvest.', pest_management: 'Control Pod Borer and Vascular Streak Dieback.', harvest_duration_days: 160 }
      },

      // 6. Spices / Medicinal Crops (7 items)
      {
        name: 'Turmeric',
        nameSi: 'කහ',
        category: 'Spices / Medicinal Crops',
        slug: 'turmeric',
        season: 'Maha',
        description: 'Golden yellow rhizome crop cultivated for medicinal, dye, and spice value.',
        image_url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&q=80',
        detail: { scientific_name: 'Curcuma longa', soil_type: 'Friable sandy loam enriched with compost', growing_tips: 'Mulch heavily with green leaves right after planting seed rhizomes.', pest_management: 'Control Rhizome Rot and Shoot Borer.', harvest_duration_days: 240 }
      },
      {
        name: 'Ginger',
        nameSi: 'ඉඟුරු',
        category: 'Spices / Medicinal Crops',
        slug: 'ginger',
        season: 'Maha & Yala',
        description: 'Pungent rhizome crop widely used in medicine and culinary recipes.',
        image_url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&q=80',
        detail: { scientific_name: 'Zingiber officinale', soil_type: 'Rich well-drained loamy soil', growing_tips: 'Plant disease-free seed rhizomes in raised beds.', pest_management: 'Prevent Soft Rot (Pythium) by ensuring good drainage.', harvest_duration_days: 210 }
      },
      {
        name: 'Coriander',
        nameSi: 'කොත්තමල්ලි',
        category: 'Spices / Medicinal Crops',
        slug: 'coriander',
        season: 'Yala',
        description: 'Aromatic seed and leafy herb essential for curry powders and teas.',
        image_url: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=400&q=80',
        detail: { scientific_name: 'Coriandrum sativum', soil_type: 'Light friable loams', growing_tips: 'Sow seeds directly into fine tilth beds.', pest_management: 'Watch for Powdery Mildew during flowering.', harvest_duration_days: 80 }
      },
      {
        name: 'Fenugreek',
        nameSi: 'උළුහාල්',
        category: 'Spices / Medicinal Crops',
        slug: 'fenugreek',
        season: 'Yala',
        description: 'Traditional medicinal spice seed used in curries and ayurvedic care.',
        image_url: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=400&q=80',
        detail: { scientific_name: 'Trigonella foenum-graecum', soil_type: 'Well-drained loamy soils', growing_tips: 'Broadcasting seeds thinly on prepared flat beds.', pest_management: 'Low pest incidence.', harvest_duration_days: 90 }
      },
      {
        name: 'Fennel',
        nameSi: 'මහදුරු',
        category: 'Spices / Medicinal Crops',
        slug: 'fennel',
        season: 'Yala',
        description: 'Sweet licorice-flavored aromatic spice seed crop.',
        image_url: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=400&q=80',
        detail: { scientific_name: 'Foeniculum vulgare', soil_type: 'Mildly alkaline well-drained loams', growing_tips: 'Harvest seed heads when umbels turn brownish-grey.', pest_management: 'Protect from Aphids during flower head development.', harvest_duration_days: 100 }
      },
      {
        name: 'Lemongrass',
        nameSi: 'සේර',
        category: 'Spices / Medicinal Crops',
        slug: 'lemongrass',
        season: 'Year-round',
        description: 'Aromatic perennial grass distilled for essential oil and soup flavorings.',
        image_url: 'https://images.unsplash.com/photo-1515586000433-45406d8e6662?w=400&q=80',
        detail: { scientific_name: 'Cymbopogon citratus', soil_type: 'Sandy loam to gravelly soil', growing_tips: 'Divide root clumps to propagate new slips.', pest_management: 'Hardy crop with minimal pests.', harvest_duration_days: 90 }
      },
      {
        name: 'Aloe Vera',
        nameSi: 'කෝමාරිකා',
        category: 'Spices / Medicinal Crops',
        slug: 'aloe-vera',
        season: 'Year-round',
        description: 'Succulent medicinal plant harvested for clear soothing gel and skin care.',
        image_url: 'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?w=400&q=80',
        detail: { scientific_name: 'Aloe barbadensis Miller', soil_type: 'Porous sandy soil with excellent drainage', growing_tips: 'Avoid overwatering to prevent root rot.', pest_management: 'Protect from Mealybugs.', harvest_duration_days: 180 }
      }
    ];

    const createdCrops = [];
    for (const cropItem of cropsData) {
      const { name, nameSi, category, slug, description, season, image_url, detail } = cropItem;
      const cropObj = await Crop.create({ name, nameSi, category, slug, description, season, image_url });
      await CropDetail.create({
        crop_id: cropObj._id,
        ...detail
      });
      createdCrops.push(cropObj);
    }
    console.log(`Created ${createdCrops.length} crops and crop details.`);

    // 5. Create Market Prices
    console.log('Creating Market Prices entries (June & July 2026 logs)...');
    
    // Map crops for quick reference
    const cropPaddy = createdCrops.find(c => c.name.startsWith('Paddy'));
    const cropOnion = createdCrops.find(c => c.name.startsWith('Red Onion'));
    const cropCarrot = createdCrops.find(c => c.name.startsWith('Carrot'));
    const cropTomato = createdCrops.find(c => c.name.startsWith('Tomato'));
    const cropChilli = createdCrops.find(c => c.name.startsWith('Green Chilli'));
    const cropPotato = createdCrops.find(c => c.name.startsWith('Potato'));

    // Peliyagoda logs
    await MarketPrice.create({ crop_id: cropTomato._id, price_per_kg: 190, market_location: 'Peliyagoda Economic Center', price_date: new Date('2026-06-30'), added_by_user_id: admin._id });
    await MarketPrice.create({ crop_id: cropCarrot._id, price_per_kg: 300, market_location: 'Peliyagoda Economic Center', price_date: new Date('2026-06-29'), added_by_user_id: admin._id });
    await MarketPrice.create({ crop_id: cropPotato._id, price_per_kg: 270, market_location: 'Peliyagoda Economic Center', price_date: new Date('2026-06-30'), added_by_user_id: admin._id });

    // Dambulla logs
    await MarketPrice.create({ crop_id: cropPaddy._id, price_per_kg: 220, market_location: 'Dambulla Economic Center', price_date: new Date('2026-06-25'), added_by_user_id: dataEntry._id });
    await MarketPrice.create({ crop_id: cropOnion._id, price_per_kg: 310, market_location: 'Dambulla Economic Center', price_date: new Date('2026-06-28'), added_by_user_id: dataEntry._id });
    await MarketPrice.create({ crop_id: cropCarrot._id, price_per_kg: 240, market_location: 'Dambulla Economic Center', price_date: new Date('2026-06-29'), added_by_user_id: dataEntry._id });
    await MarketPrice.create({ crop_id: cropTomato._id, price_per_kg: 120, market_location: 'Dambulla Economic Center', price_date: new Date('2026-06-29'), added_by_user_id: dataEntry._id });
    await MarketPrice.create({ crop_id: cropChilli._id, price_per_kg: 520, market_location: 'Dambulla Economic Center', price_date: new Date('2026-06-30'), added_by_user_id: dataEntry._id });
    await MarketPrice.create({ crop_id: cropPotato._id, price_per_kg: 230, market_location: 'Dambulla Economic Center', price_date: new Date('2026-06-30'), added_by_user_id: dataEntry._id });

    // Nuwara Eliya logs
    await MarketPrice.create({ crop_id: cropTomato._id, price_per_kg: 145, market_location: 'Nuwara Eliya Economic Center', price_date: new Date('2026-06-30'), added_by_user_id: manager._id });
    await MarketPrice.create({ crop_id: cropCarrot._id, price_per_kg: 220, market_location: 'Nuwara Eliya Economic Center', price_date: new Date('2026-06-29'), added_by_user_id: manager._id });

    // Keppetipola logs
    await MarketPrice.create({ crop_id: cropTomato._id, price_per_kg: 150, market_location: 'Keppetipola Economic Center', price_date: new Date('2026-06-30'), added_by_user_id: manager._id });
    await MarketPrice.create({ crop_id: cropCarrot._id, price_per_kg: 230, market_location: 'Keppetipola Economic Center', price_date: new Date('2026-06-29'), added_by_user_id: manager._id });
    await MarketPrice.create({ crop_id: cropPotato._id, price_per_kg: 210, market_location: 'Keppetipola Economic Center', price_date: new Date('2026-06-30'), added_by_user_id: manager._id });

    // Narahenpita logs
    await MarketPrice.create({ crop_id: cropCarrot._id, price_per_kg: 340, market_location: 'Narahenpita Economic Center', price_date: new Date('2026-06-30'), added_by_user_id: admin._id });
    await MarketPrice.create({ crop_id: cropTomato._id, price_per_kg: 195, market_location: 'Narahenpita Economic Center', price_date: new Date('2026-06-30'), added_by_user_id: admin._id });

    // Meegoda logs
    await MarketPrice.create({ crop_id: cropTomato._id, price_per_kg: 185, market_location: 'Meegoda Economic Center', price_date: new Date('2026-06-30'), added_by_user_id: admin._id });
    await MarketPrice.create({ crop_id: cropCarrot._id, price_per_kg: 290, market_location: 'Meegoda Economic Center', price_date: new Date('2026-06-29'), added_by_user_id: admin._id });

    // Ratmalana logs
    await MarketPrice.create({ crop_id: cropTomato._id, price_per_kg: 195, market_location: 'Ratmalana Economic Center', price_date: new Date('2026-06-30'), added_by_user_id: admin._id });
    await MarketPrice.create({ crop_id: cropCarrot._id, price_per_kg: 310, market_location: 'Ratmalana Economic Center', price_date: new Date('2026-06-29'), added_by_user_id: admin._id });

    console.log('Created Market Price records.');

    // 6. Create Weather Records (to pre-cache database values)
    console.log('Creating Weather Records...');
    await WeatherRecord.create({
      division_id: divDambulla._id,
      record_date: new Date(),
      temperature_c: 30.5,
      humidity_percent: 68,
      rainfall_mm: 1.2,
      condition: 'Sunny'
    });

    await WeatherRecord.create({
      division_id: divKeppetipola._id,
      record_date: new Date(),
      temperature_c: 21.0,
      humidity_percent: 85,
      rainfall_mm: 12.5,
      condition: 'Rainy'
    });

    await WeatherRecord.create({
      division_id: divPettah._id,
      record_date: new Date(),
      temperature_c: 28.2,
      humidity_percent: 74,
      rainfall_mm: 5.4,
      condition: 'Cloudy'
    });
    console.log('Created Weather Records.');

    // 7. Create Saved Crops (Farmer planned crops)
    console.log('Creating Saved Crops bookmarks...');
    await SavedCrop.create({ user_id: farmer1._id, crop_id: cropPaddy._id, saved_at: new Date() });
    await SavedCrop.create({ user_id: farmer1._id, crop_id: cropOnion._id, saved_at: new Date() });
    await SavedCrop.create({ user_id: farmer2._id, crop_id: cropCarrot._id, saved_at: new Date() });
    await SavedCrop.create({ user_id: farmer2._id, crop_id: cropPotato._id, saved_at: new Date() });
    console.log('Created Saved Crop bookmarks.');

    // 8. Create Notifications
    console.log('Creating system notifications...');
    await Notification.create({
      user_id: farmer1._id,
      type: 'price_alert',
      title: 'Green Chilli prices surged by 25% at Dambulla Economic Center!',
      is_read: false
    });

    await Notification.create({
      user_id: farmer2._id,
      type: 'weather_alert',
      title: 'Heavy rainfall warning (above 15mm) forecasted for Keppetipola division.',
      is_read: false
    });

    await Notification.create({
      user_id: farmer1._id,
      type: 'system',
      title: 'Welcome to Digital Agriculture! Explore crop guidance and live prices.',
      is_read: true
    });
    console.log('Created Notifications.');

    // 9. Write Admin Logs
    console.log('Creating Admin logs...');
    await AdminLog.create({ admin_id: admin._id, action_type: 'create', target_entity: 'Division', target_id: divPettah._id.toString() });
    await AdminLog.create({ admin_id: admin._id, action_type: 'create', target_entity: 'Crop', target_id: cropPaddy._id.toString() });
    await AdminLog.create({ admin_id: manager._id, action_type: 'update', target_entity: 'CropDetail', target_id: cropCarrot._id.toString() });
    console.log('Created Admin Logs.');

    // 10. Create Markets & Data Sources
    console.log('Creating Markets & Data Sources...');
    const marketsData = [
      { name: 'Peliyagoda', nameSi: 'පෑලියගොඩ', district: 'Gampaha', province: 'Western', slug: 'peliyagoda' },
      { name: 'Dambulla', nameSi: 'දඹුල්ල', district: 'Matale', province: 'Central', slug: 'dambulla' },
      { name: 'Nuwara Eliya', nameSi: 'නුවරඑළිය', district: 'Nuwara Eliya', province: 'Central', slug: 'nuwara-eliya' },
      { name: 'Keppetipola', nameSi: 'කැප්පෙටිපොළ', district: 'Badulla', province: 'Uva', slug: 'keppetipola' },
      { name: 'Narahenpita', nameSi: 'නාරාහේන්පිට', district: 'Colombo', province: 'Western', slug: 'narahenpita' },
      { name: 'Meegoda', nameSi: 'මීගොඩ', district: 'Colombo', province: 'Western', slug: 'meegoda' },
      { name: 'Ratmalana', nameSi: 'රත්මලාන', district: 'Colombo', province: 'Western', slug: 'ratmalana' }
    ];
    await Market.insertMany(marketsData);
    console.log(`Created ${marketsData.length} Economic Markets.`);

    await Source.create([
      { name: 'HARTI', type: 'official', website: 'http://www.harti.gov.lk', status: 'active', lastSync: new Date() },
      { name: 'CBSL', type: 'official', website: 'https://www.cbsl.gov.lk', status: 'active', lastSync: new Date() }
    ]);
    console.log('Created Data Sources (HARTI & CBSL).');

    // 11. Initial HARTI & CBSL Market Price Sync
    console.log('Triggering initial HARTI & CBSL price scraper sync...');
    await syncHartiPrices();
    await syncCbslPrices();
    console.log('HARTI & CBSL Price Sync Completed.');

    console.log('========================================================');
    console.log(' Seeding finished successfully!');
    console.log(' Sample logins:');
    console.log(`   - Admin:      ${adminEmail}      / password: ${adminPassword}`);
    console.log(`   - Manager:    ${managerEmail}    / password: ${managerPassword}`);
    console.log(`   - Data Entry: ${dataEntryEmail}  / password: ${dataEntryPassword}`);
    console.log(`   - Farmer 1:   ${farmer1Email}       / password: ${farmerPassword}`);
    console.log(`   - Farmer 2:   ${farmer2Email}      / password: ${farmerPassword}`);
    console.log('========================================================');
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
