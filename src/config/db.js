const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async () => {
  try {
    const dbUri = env.DATABASE_URL || env.MONGODB_URI;
    if (!dbUri) {
      throw new Error('Set DATABASE_URL or MONGODB_URI before starting the backend.');
    }

    const conn = await mongoose.connect(dbUri, {
      dbName: process.env.DB_NAME || 'Farmar_db'
    });
    console.log(`========================================================`);
    console.log(` MongoDB Connected (${conn.connection.name}): ${conn.connection.host}`);
    console.log(`========================================================`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
