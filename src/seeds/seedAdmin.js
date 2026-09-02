const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const connectDB = require('../config/db');
const env = require('../config/env');
const logger = require('../utils/logger');

const seedAdmin = async () => {
  try {
    await connectDB();

    const adminEmail = (process.env.SEED_ADMIN_EMAIL || 'admin@farmer.com').trim().toLowerCase();
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'admin123';
    const adminMobile = (process.env.ADMIN_MOBILE || '').trim();

    const existingAdmin = await User.findOne({
      $or: [
        { email: adminEmail },
        ...(adminMobile ? [{ phone_number: adminMobile }, { mobile: adminMobile }] : [])
      ]
    });
    if (existingAdmin) {
      if (process.env.RESET_ADMIN_PASSWORD === 'true') {
        existingAdmin.password_hash = await bcrypt.hash(adminPassword, 10);
        existingAdmin.role = 'admin';
        existingAdmin.accountStatus = 'active';
        await existingAdmin.save();
        logger.info(`Admin password reset successfully for ${existingAdmin.email}.`);
      } else {
        logger.info(`Admin user ${existingAdmin.email} already exists. Set RESET_ADMIN_PASSWORD=true to reset its password.`);
      }
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    const admin = await User.create({
      username: 'System Administrator',
      email: adminEmail,
      ...(adminMobile ? { phone_number: adminMobile, mobile: adminMobile } : {}),
      password_hash: passwordHash,
      role: 'admin'
    });

    logger.info(`Admin user created successfully: ${admin.email}`);
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
