require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Models
const User = require('./models/User');
const Area = require('./models/Area');
const Product = require('./models/Product');
const PriceRecord = require('./models/PriceRecord');
const DemandRecord = require('./models/DemandRecord');

async function seed() {
  const dbUri = process.env.DATABASE_URL;
  if (!dbUri) {
    console.error('DATABASE_URL is not defined in the environmental variables.');
    process.exit(1);
  }

  try {
    await mongoose.connect(dbUri);
    console.log('MongoDB Connected for seeding...');

    // 1. Clear existing data
    console.log('Clearing existing data...');
    await Promise.all([
      DemandRecord.deleteMany({}),
      PriceRecord.deleteMany({}),
      Product.deleteMany({}),
      Area.deleteMany({}),
      User.deleteMany({})
    ]);

    // 2. Create Users
    console.log('Creating users...');
    const salt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash('admin123', salt);
    const userPasswordHash = await bcrypt.hash('user123', salt);

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@farmer.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN'
    });

    const user = await User.create({
      name: 'Regular User',
      email: 'user@farmer.com',
      passwordHash: userPasswordHash,
      role: 'USER'
    });

    console.log(`Created users: Admin (${admin.email}), User (${user.email})`);

    // 3. Create Areas
    console.log('Creating areas...');
    const area1 = await Area.create({ province: 'Western', district: 'Colombo', city: 'Colombo' });
    const area2 = await Area.create({ province: 'Southern', district: 'Galle', city: 'Galle' });
    const area3 = await Area.create({ province: 'Central', district: 'Kandy', city: 'Kandy' });

    console.log('Created areas.');

    // 4. Create Products
    console.log('Creating products...');
    const p1 = await Product.create({ name: 'Keeri Samba Rice', category: 'Rice', unit: 'kg' });
    const p2 = await Product.create({ name: 'Red Onion', category: 'Vegetables', unit: 'kg' });
    const p3 = await Product.create({ name: 'Potato', category: 'Vegetables', unit: 'kg' });
    const p4 = await Product.create({ name: 'Tomato', category: 'Vegetables', unit: 'kg' });
    const p5 = await Product.create({ name: 'Carrot', category: 'Vegetables', unit: 'kg' });

    console.log('Created products.');

    // 5. Create Price Records (2026, Months: April (4), May (5), June (6))
    console.log('Creating price records...');
    
    // Rice prices
    await PriceRecord.create({ productId: p1._id, areaId: area1._id, originalPrice: 220, areaPrice: 240, month: 4, year: 2026 });
    await PriceRecord.create({ productId: p1._id, areaId: area1._id, originalPrice: 220, areaPrice: 280, month: 5, year: 2026 }); // High Price
    await PriceRecord.create({ productId: p1._id, areaId: area2._id, originalPrice: 220, areaPrice: 230, month: 5, year: 2026 });

    // Onion prices
    await PriceRecord.create({ productId: p2._id, areaId: area1._id, originalPrice: 320, areaPrice: 420, month: 5, year: 2026 }); // High Price
    await PriceRecord.create({ productId: p2._id, areaId: area2._id, originalPrice: 320, areaPrice: 340, month: 5, year: 2026 });
    await PriceRecord.create({ productId: p2._id, areaId: area3._id, originalPrice: 320, areaPrice: 330, month: 5, year: 2026 });

    // Potato prices
    await PriceRecord.create({ productId: p3._id, areaId: area1._id, originalPrice: 180, areaPrice: 190, month: 6, year: 2026 });
    await PriceRecord.create({ productId: p3._id, areaId: area3._id, originalPrice: 180, areaPrice: 230, month: 6, year: 2026 }); // High Price

    // Tomato prices
    await PriceRecord.create({ productId: p4._id, areaId: area2._id, originalPrice: 150, areaPrice: 160, month: 5, year: 2026 });

    console.log('Created price records.');

    // 6. Create Demand Records (2026, Months: April (4), May (5), June (6))
    console.log('Creating demand records...');
    
    // Rice demand
    await DemandRecord.create({ productId: p1._id, areaId: area1._id, demandQty: 10000, stockQty: 4000, productionQty: 13000, month: 5, year: 2026 }); // Low Stock, Overproduction
    await DemandRecord.create({ productId: p1._id, areaId: area2._id, demandQty: 5000, stockQty: 6000, productionQty: 5500, month: 5, year: 2026 });

    // Onion demand
    await DemandRecord.create({ productId: p2._id, areaId: area1._id, demandQty: 3000, stockQty: 1500, productionQty: 1200, month: 5, year: 2026 }); // Low Stock, Shortage
    await DemandRecord.create({ productId: p2._id, areaId: area2._id, demandQty: 2500, stockQty: 3000, productionQty: 3500, month: 5, year: 2026 }); // Overproduction

    // Potato demand
    await DemandRecord.create({ productId: p3._id, areaId: area3._id, demandQty: 4000, stockQty: 4500, productionQty: 4200, month: 6, year: 2026 });
    await DemandRecord.create({ productId: p3._id, areaId: area1._id, demandQty: 8000, stockQty: 3000, productionQty: 2500, month: 6, year: 2026 }); // Low Stock

    // Tomato demand
    await DemandRecord.create({ productId: p4._id, areaId: area2._id, demandQty: 2000, stockQty: 2200, productionQty: 3000, month: 5, year: 2026 }); // Overproduction

    console.log('Created demand records.');
    console.log('Seeding finished successfully.');
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seed();
