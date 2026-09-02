require('../config/env');
const connectDB = require('../config/db');
const Division = require('../models/Division');

const locations = [
  ['Ampara', 'Eastern'],
  ['Batticaloa', 'Eastern'],
  ['Trincomalee', 'Eastern'],
  ['Anuradhapura', 'North Central'],
  ['Polonnaruwa', 'North Central'],
  ['Jaffna', 'Northern'],
  ['Kilinochchi', 'Northern'],
  ['Mannar', 'Northern'],
  ['Vavuniya', 'Northern'],
  ['Kurunegala', 'North Western'],
  ['Puttalam', 'North Western'],
  ['Kegalle', 'Sabaragamuwa'],
  ['Ratnapura', 'Sabaragamuwa'],
  ['Galle', 'Southern'],
  ['Hambantota', 'Southern'],
  ['Matara', 'Southern'],
  ['Badulla', 'Uva'],
  ['Monaragala', 'Uva'],
  ['Colombo', 'Western'],
  ['Gampaha', 'Western'],
  ['Kalutara', 'Western'],
  ['Kandy', 'Central'],
  ['Matale', 'Central'],
  ['Nuwara Eliya', 'Central'],
  ['Dambulla', 'Central'],
];

const seedLocations = async () => {
  await connectDB();

  for (const [city, province] of locations) {
    await Division.findOneAndUpdate(
      { 'name.en': city, province },
      { $set: { name: { en: city }, province } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  console.log(`Seeded ${locations.length} location records.`);
  process.exit(0);
};

seedLocations().catch((error) => {
  console.error('Location seeding failed:', error.message);
  process.exit(1);
});
