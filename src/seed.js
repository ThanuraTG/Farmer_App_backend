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

    // 2. Create Divisions (Sri Lankan Economic/Cultivation Centers)
    console.log('Creating Divisions (Economic/Cultivation Centers)...');
    const divDambulla = await Division.create({
      name: 'Dambulla',
      province: 'Central',
      latitude: 7.8608,
      longitude: 80.6517
    });

    const divPettah = await Division.create({
      name: 'Pettah',
      province: 'Western',
      latitude: 6.9372,
      longitude: 79.8557
    });

    const divKeppetipola = await Division.create({
      name: 'Keppetipola',
      province: 'Uva',
      latitude: 6.8906,
      longitude: 80.9125
    });

    const divNarahenpita = await Division.create({
      name: 'Narahenpita',
      province: 'Western',
      latitude: 6.9038,
      longitude: 79.8796
    });

    console.log(`Created ${[divDambulla, divPettah, divKeppetipola, divNarahenpita].length} divisions.`);

    // 3. Create Users with encrypted passwords
    console.log('Creating Users with hashed passwords...');
    const salt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash('admin123', salt);
    const managerPasswordHash = await bcrypt.hash('manager123', salt);
    const dataEntryPasswordHash = await bcrypt.hash('dataentry123', salt);
    const farmerPasswordHash = await bcrypt.hash('farmer123', salt);

    const admin = await User.create({
      username: 'Thanura Admin',
      email: 'admin@farmer.com',
      password_hash: adminPasswordHash,
      role: 'admin',
      phone_number: '+94712345678',
      division_id: divPettah._id
    });

    const manager = await User.create({
      username: 'Kusal Manager',
      email: 'manager@farmer.com',
      password_hash: managerPasswordHash,
      role: 'manager',
      phone_number: '+94771234567',
      division_id: divKeppetipola._id
    });

    const dataEntry = await User.create({
      username: 'Nimal Data Entry',
      email: 'dataentry@farmer.com',
      password_hash: dataEntryPasswordHash,
      role: 'data_entry',
      phone_number: '+94721234567',
      division_id: divDambulla._id
    });

    const farmer1 = await User.create({
      username: 'Siriwardena Bandara',
      email: 'siri@farmer.com',
      password_hash: farmerPasswordHash,
      role: 'farmer',
      phone_number: '+94751234567',
      division_id: divDambulla._id
    });

    const farmer2 = await User.create({
      username: 'Kamal Perera',
      email: 'kamal@farmer.com',
      password_hash: farmerPasswordHash,
      role: 'farmer',
      phone_number: '+94761234567',
      division_id: divKeppetipola._id
    });

    console.log('Created Users: Admin, Manager, Data Entry, and 2 Farmers.');

    // 4. Create Crops (10 items)
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
        name: 'Red Onion',
        category: 'Food Crops',
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
        category: 'Food Crops',
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
        category: 'Food Crops',
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
        category: 'Food Crops',
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
        category: 'Food Crops',
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
        category: 'Export & Commercial',
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
        name: 'Cabbage',
        category: 'Food Crops',
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
    console.log('   - Admin:      admin@farmer.com      / password: admin123');
    console.log('   - Manager:    manager@farmer.com    / password: manager123');
    console.log('   - Data Entry: dataentry@farmer.com  / password: dataentry123');
    console.log('   - Farmer 1:   siri@farmer.com       / password: farmer123');
    console.log('   - Farmer 2:   kamal@farmer.com      / password: farmer123');
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
