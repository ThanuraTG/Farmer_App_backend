const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const dbUri = process.env.DATABASE_URL;
    if (!dbUri) {
      throw new Error('DATABASE_URL is not defined in the environmental variables.');
    }

    const conn = await mongoose.connect(dbUri);
    console.log(`========================================================`);
    console.log(` MongoDB Connected: ${conn.connection.host}`);
    console.log(`========================================================`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
