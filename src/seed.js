require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Models
const User = require('./models/User');
const Division = require('./models/Division');
const Crop = require('./models/Crop');
const CropDetail = require('./models/CropDetail');
const MarketPrice = require('./models/MarketPrice');
const WeatherRecord = require('./models/WeatherRecord');
const SavedCrop = require('./models/SavedCrop');
const Notification = require('./models/Notification');
const AdminLog = require('./models/AdminLog');

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
      CropDetail.deleteMany({}),
      Crop.deleteMany({}),
      Division.deleteMany({}),
      User.deleteMany({})
    ]);
    console.log('All collections cleared.');

    // 2. Create Divisions (All 25 Sri Lankan Districts + Economic/Cultivation Centers)
    console.log('Creating Divisions (25 Sri Lankan Districts & Economic Centers)...');
    const sriLankaDivisionsData = [
      { name: 'Ampara', province: 'Eastern', latitude: 7.2886, longitude: 81.6734 },
      { name: 'Anuradhapura', province: 'North Central', latitude: 8.3114, longitude: 80.4037 },
      { name: 'Badulla', province: 'Uva', latitude: 6.9934, longitude: 81.0550 },
      { name: 'Batticaloa', province: 'Eastern', latitude: 7.7310, longitude: 81.6747 },
      { name: 'Colombo', province: 'Western', latitude: 6.9271, longitude: 79.8612 },
      { name: 'Dambulla', province: 'Central', latitude: 7.8608, longitude: 80.6517 },
      { name: 'Galle', province: 'Southern', latitude: 6.0535, longitude: 80.2210 },
      { name: 'Gampaha', province: 'Western', latitude: 7.0840, longitude: 79.9925 },
      { name: 'Hambantota', province: 'Southern', latitude: 6.1429, longitude: 81.1212 },
      { name: 'Jaffna', province: 'Northern', latitude: 9.6615, longitude: 80.0255 },
      { name: 'Kalutara', province: 'Western', latitude: 6.5854, longitude: 79.9607 },
      { name: 'Kandy', province: 'Central', latitude: 7.2906, longitude: 80.6337 },
      { name: 'Kegalle', province: 'Sabaragamuwa', latitude: 7.2513, longitude: 80.3464 },
      { name: 'Keppetipola', province: 'Uva', latitude: 6.8906, longitude: 80.9125 },
      { name: 'Kilinochchi', province: 'Northern', latitude: 9.3803, longitude: 80.3770 },
      { name: 'Kurunegala', province: 'North Western', latitude: 7.4863, longitude: 80.3647 },
      { name: 'Mannar', province: 'Northern', latitude: 8.9810, longitude: 79.9044 },
      { name: 'Matale', province: 'Central', latitude: 7.4675, longitude: 80.6234 },
      { name: 'Matara', province: 'Southern', latitude: 5.9549, longitude: 80.5550 },
      { name: 'Moneragala', province: 'Uva', latitude: 6.8724, longitude: 81.3507 },
      { name: 'Mullaitivu', province: 'Northern', latitude: 9.2671, longitude: 80.8142 },
      { name: 'Narahenpita', province: 'Western', latitude: 6.9038, longitude: 79.8796 },
      { name: 'Nuwara Eliya', province: 'Central', latitude: 6.9497, longitude: 80.7891 },
      { name: 'Pettah', province: 'Western', latitude: 6.9372, longitude: 79.8557 },
      { name: 'Polonnaruwa', province: 'North Central', latitude: 7.9403, longitude: 81.0188 },
      { name: 'Puttalam', province: 'North Western', latitude: 8.0362, longitude: 79.8283 },
      { name: 'Ratnapura', province: 'Sabaragamuwa', latitude: 6.6828, longitude: 80.3992 },
      { name: 'Trincomalee', province: 'Eastern', latitude: 8.5874, longitude: 81.2152 },
      { name: 'Vavuniya', province: 'Northern', latitude: 8.7542, longitude: 80.4982 }
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

    // 4. Create Crops (17 items representing all user categories)
    console.log('Creating Crop guidelines...');
    const cropsData = [
      {
        name: 'Paddy (Rice)',
        category: 'Food Crops',
        description: 'The staple crop of Sri Lanka, cultivated in both Yala and Maha seasons.',
        season: 'Yala & Maha',
        image_url: 'https://images.unsplash.com/photo-1536657235019-0307116c1740?w=400&q=80',
        detail: {
          growing_tips: 'Requires standing water during initial vegetative growth. Drain fields 2 weeks before harvest.',
          soil_type: 'Clayey soils or heavy loams with high water retention.',
          pest_management: 'Monitor for Stem Borer and Brown Planthopper. Maintain clean bunds.',
          harvest_duration_days: 120
        }
      },
      {
        name: 'Maize (Maize/ඉරිඟු)',
        category: 'Food Crops',
        description: 'Major food and animal feed crop grown in Dry Zones.',
        season: 'Maha',
        image_url: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&q=80',
        detail: {
          growing_tips: 'Ensure proper spacing and adequate nitrogen supply. Hand-pollinate if wind is poor.',
          soil_type: 'Well-drained fertile loams with neutral pH.',
          pest_management: 'Monitor for Fall Armyworm. Apply biological controls early.',
          harvest_duration_days: 110
        }
      },
      {
        name: 'Red Onion',
        category: 'Vegetables',
        description: 'Cultivated extensively in Jaffna and Kalpitiya areas.',
        season: 'Yala',
        image_url: 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=400&q=80',
        detail: {
          growing_tips: 'Sow bulb sets 2cm deep. Irrigate once in 3-4 days depending on weather.',
          soil_type: 'Well-drained sandy loam or alluvial soils rich in organic matter.',
          pest_management: 'Manage Onion Thrips with biological controls or neem extract. Prevent Leaf Twister.',
          harvest_duration_days: 75
        }
      },
      {
        name: 'Carrot',
        category: 'Vegetables',
        description: 'Up-country vegetable grown in Nuwara Eliya and Welimada.',
        season: 'Maha',
        image_url: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&q=80',
        detail: {
          growing_tips: 'Thoroughly till soil to 30cm depth. Keep beds moist until seedlings emerge.',
          soil_type: 'Deep, loose sandy loams. Heavy clay causes split roots.',
          pest_management: 'Avoid root knot nematodes by crop rotation with marigolds.',
          harvest_duration_days: 90
        }
      },
      {
        name: 'Tomato',
        category: 'Vegetables',
        description: 'High-value vegetable crop grown across dry and intermediate zones.',
        season: 'Yala & Maha',
        image_url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&q=80',
        detail: {
          growing_tips: 'Stake plants early. Prune side branches. Water at the base to avoid leaf dampness.',
          soil_type: 'Rich, well-drained sandy loam or clay loam.',
          pest_management: 'Control Fruit Borer and Whitefly. Apply copper fungicides for Early Blight.',
          harvest_duration_days: 105
        }
      },
      {
        name: 'Green Chilli',
        category: 'Vegetables',
        description: 'Highly consumed spice vegetable, popular in dry zones.',
        season: 'Yala',
        image_url: 'https://images.unsplash.com/photo-1588252396162-89584346f04f?w=400&q=80',
        detail: {
          growing_tips: 'Transplant 4-week-old healthy seedlings. Mulch beds to conserve soil moisture.',
          soil_type: 'Sandy loam soils with neutral pH.',
          pest_management: 'Strict monitoring for Chilli Leaf Curl Complex (Thrips/Mites). Use sticky traps.',
          harvest_duration_days: 85
        }
      },
      {
        name: 'Potato',
        category: 'Vegetables',
        description: 'Important tuber crop, cultivated mostly in Badulla district.',
        season: 'Maha',
        image_url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80',
        detail: {
          growing_tips: 'Use certified seed tubers. Earthing-up is critical at 4 and 8 weeks.',
          soil_type: 'Acidic, well-aerated sandy loam.',
          pest_management: 'Protect against Late Blight. Rotate with grains to prevent Bacterial Wilt.',
          harvest_duration_days: 110
        }
      },
      {
        name: 'Black Pepper',
        category: 'Spice Crops',
        description: 'King of spices, grown in wet and intermediate mid-country.',
        season: 'Year-round',
        image_url: 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?w=400&q=80',
        detail: {
          growing_tips: 'Train vines on support trees (e.g., Gliricidia). Provide partial shade.',
          soil_type: 'Clay loams with high humus and good drainage.',
          pest_management: 'Control pepper lace wing bug and root rot (Quick wilt).',
          harvest_duration_days: 270
        }
      },
      {
        name: 'Cinnamon (කුරුඳු)',
        category: 'Spice Crops',
        description: 'True Cinnamon, native to Sri Lanka, famous worldwide for its flavor and aroma.',
        season: 'Year-round',
        image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80',
        detail: {
          growing_tips: 'Prune shoots periodically to encourage multiple thin stems. Peel bark when shoots mature.',
          soil_type: 'Sandy, lateritic gravel or loam soils.',
          pest_management: 'Monitor for Cinnamon gall mite and pink disease. Keep plantation clean.',
          harvest_duration_days: 365
        }
      },
      {
        name: 'Coconut',
        category: 'Export & Commercial',
        description: 'Grown heavily in the Coconut Triangle (Kurunegala, Chilaw, Gampaha).',
        season: 'Year-round',
        image_url: 'https://images.unsplash.com/photo-1543884958-c116127e7ccb?w=400&q=80',
        detail: {
          growing_tips: 'Maintain 8m spacing. Apply cover crops to suppress weeds and lock moisture.',
          soil_type: 'Sandy, gravelly or alluvial soils with decent water table access.',
          pest_management: 'Use pheromone traps for Red Palm Weevil and Black Beetle.',
          harvest_duration_days: 365
        }
      },
      {
        name: 'Tea (තේ)',
        category: 'Export & Commercial',
        description: 'Famous Ceylon Tea, cultivated in central highlands and low country wet zones.',
        season: 'Year-round',
        image_url: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=400&q=80',
        detail: {
          growing_tips: 'Prune every 3-5 years to maintain pluckable height. Pluck two leaves and a bud every 7-10 days.',
          soil_type: 'Deep, acidic well-drained soils with high organic matter.',
          pest_management: 'Control Blister Blight with fungicides. Manage Tea Tortrix caterpillars.',
          harvest_duration_days: 365
        }
      },
      {
        name: 'Cabbage',
        category: 'Vegetables',
        description: 'Popular leafy vegetable cultivated in mountainous and cold areas.',
        season: 'Maha',
        image_url: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&q=80',
        detail: {
          growing_tips: 'Add compost liberally. Thin seedlings. Ensure constant moisture during heading.',
          soil_type: 'Rich, moist sandy loams high in nitrogen.',
          pest_management: 'Pest traps for Diamondback Moth caterpillars. Avoid waterlogging to prevent Clubroot.',
          harvest_duration_days: 85
        }
      },
      {
        name: 'Keeri Samba Rice',
        category: 'Food Crops',
        description: 'Premium short-grain rice, highly valued in local markets.',
        season: 'Maha',
        image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80',
        detail: {
          growing_tips: 'Pre-germinate seeds. Maintain uniform puddle conditions. Harvest when 85% of panicles turn golden.',
          soil_type: 'Heavy clay soils with high organic matter.',
          pest_management: 'Manage Rice Blast disease. Ensure proper silica levels in fertilizers.',
          harvest_duration_days: 135
        }
      },
      {
        name: 'Mukunuwenna (මුකුණුවැන්න)',
        category: 'Vegetables',
        description: 'Popular local leafy green vegetable consumed daily.',
        season: 'Year-round',
        image_url: 'https://images.unsplash.com/photo-1563201416-3b692095ce80?w=400&q=80',
        detail: {
          growing_tips: 'Propagated easily by stem cuttings. Requires regular watering and nitrogen-rich soil.',
          soil_type: 'Moist, fertile garden loam.',
          pest_management: 'Protect from caterpillars and leaf miners using natural sprays.',
          harvest_duration_days: 30
        }
      },
      {
        name: 'Gotukola (ගොටුකොළ)',
        category: 'Vegetables',
        description: 'A traditional medicinal herb and popular leaf vegetable.',
        season: 'Year-round',
        image_url: 'https://images.unsplash.com/photo-1515023115689-589c33041d3c?w=400&q=80',
        detail: {
          growing_tips: 'Grows best in damp, shaded areas. Mulch with compost frequently.',
          soil_type: 'Sandy loam or swampy organic soils.',
          pest_management: 'Watch for snails and slugs. Use handpicking or organic barriers.',
          harvest_duration_days: 45
        }
      },
      {
        name: 'Mango (අඹ)',
        category: 'Fruits',
        description: 'Delicious tropical fruit. Varieties like Karthacolomban and Vellaicolomban are popular.',
        season: 'Yala',
        image_url: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&q=80',
        detail: {
          growing_tips: 'Prune canopy to let light in. Irrigate during flowering but reduce before fruit ripening.',
          soil_type: 'Deep, well-drained alluvial soil.',
          pest_management: 'Control Mango fruit fly with pheromone traps. Prevent anthracnose.',
          harvest_duration_days: 120
        }
      },
      {
        name: 'Banana (කෙසෙල්)',
        category: 'Fruits',
        description: 'High demand fruit grown extensively. Varieties include Ambul, Seeni, and Kolikuttu.',
        season: 'Year-round',
        image_url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&q=80',
        detail: {
          growing_tips: 'Keep only one main follower sucker per plant. Support heavy fruit bunches with bamboo poles.',
          soil_type: 'Well-drained rich alluvial loam.',
          pest_management: 'Control Banana weevil and Panama wilt disease.',
          harvest_duration_days: 300
        }
      }
    ];

    const createdCrops = [];
    for (const cropItem of cropsData) {
      const { name, category, description, season, image_url, detail } = cropItem;
      const cropObj = await Crop.create({ name, category, description, season, image_url });
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

    // Pettah logs (Colombo center, usually slightly higher retail/distribution)
    await MarketPrice.create({ crop_id: cropPaddy._id, price_per_kg: 240, market_location: 'Pettah Economic Center', price_date: new Date('2026-06-25'), added_by_user_id: admin._id });
    await MarketPrice.create({ crop_id: cropOnion._id, price_per_kg: 380, market_location: 'Pettah Economic Center', price_date: new Date('2026-06-28'), added_by_user_id: admin._id });
    await MarketPrice.create({ crop_id: cropCarrot._id, price_per_kg: 320, market_location: 'Pettah Economic Center', price_date: new Date('2026-06-29'), added_by_user_id: admin._id });
    await MarketPrice.create({ crop_id: cropTomato._id, price_per_kg: 180, market_location: 'Pettah Economic Center', price_date: new Date('2026-06-29'), added_by_user_id: admin._id });
    await MarketPrice.create({ crop_id: cropChilli._id, price_per_kg: 650, market_location: 'Pettah Economic Center', price_date: new Date('2026-06-30'), added_by_user_id: admin._id }); // High Price
    await MarketPrice.create({ crop_id: cropPotato._id, price_per_kg: 290, market_location: 'Pettah Economic Center', price_date: new Date('2026-06-30'), added_by_user_id: admin._id });

    // Dambulla logs (Central center, farm-gate pricing source, usually lower)
    await MarketPrice.create({ crop_id: cropPaddy._id, price_per_kg: 220, market_location: 'Dambulla Economic Center', price_date: new Date('2026-06-25'), added_by_user_id: dataEntry._id });
    await MarketPrice.create({ crop_id: cropOnion._id, price_per_kg: 310, market_location: 'Dambulla Economic Center', price_date: new Date('2026-06-28'), added_by_user_id: dataEntry._id });
    await MarketPrice.create({ crop_id: cropCarrot._id, price_per_kg: 240, market_location: 'Dambulla Economic Center', price_date: new Date('2026-06-29'), added_by_user_id: dataEntry._id });
    await MarketPrice.create({ crop_id: cropTomato._id, price_per_kg: 120, market_location: 'Dambulla Economic Center', price_date: new Date('2026-06-29'), added_by_user_id: dataEntry._id });
    await MarketPrice.create({ crop_id: cropChilli._id, price_per_kg: 520, market_location: 'Dambulla Economic Center', price_date: new Date('2026-06-30'), added_by_user_id: dataEntry._id });
    await MarketPrice.create({ crop_id: cropPotato._id, price_per_kg: 230, market_location: 'Dambulla Economic Center', price_date: new Date('2026-06-30'), added_by_user_id: dataEntry._id });

    // Keppetipola logs (Badulla/Uva center)
    await MarketPrice.create({ crop_id: cropCarrot._id, price_per_kg: 230, market_location: 'Keppetipola Economic Center', price_date: new Date('2026-06-29'), added_by_user_id: manager._id });
    await MarketPrice.create({ crop_id: cropPotato._id, price_per_kg: 210, market_location: 'Keppetipola Economic Center', price_date: new Date('2026-06-30'), added_by_user_id: manager._id });

    // Narahenpita logs (Colombo city retail hub)
    await MarketPrice.create({ crop_id: cropCarrot._id, price_per_kg: 340, market_location: 'Narahenpita Economic Center', price_date: new Date('2026-06-30'), added_by_user_id: admin._id });
    await MarketPrice.create({ crop_id: cropTomato._id, price_per_kg: 195, market_location: 'Narahenpita Economic Center', price_date: new Date('2026-06-30'), added_by_user_id: admin._id });

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
