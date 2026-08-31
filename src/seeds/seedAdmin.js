const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const connectDB = require('../config/db');
const env = require('../config/env');
const logger = require('../utils/logger');

const seedAdmin = async () => {
  try {
    await connectDB();

    const adminMobile = process.env.ADMIN_MOBILE || '0770000000';
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPassword123!';

    const existingAdmin = await User.findOne({
      $or: [{ phone_number: adminMobile }, { email: `${adminMobile}@admin.local` }]
    });
    if (existingAdmin) {
      logger.info(`Admin user with mobile ${adminMobile} already exists.`);
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    const admin = await User.create({
      username: 'System Administrator',
      email: `${adminMobile}@admin.local`,
      phone_number: adminMobile,
      password_hash: passwordHash,
      role: 'admin'
    });

    logger.info(`Admin user created successfully: ${admin.phone_number}`);
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding admin user', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedAdmin();
}

module.exports = seedAdmin;
