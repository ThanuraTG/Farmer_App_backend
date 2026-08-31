const mongoose = require('mongoose');
const Province = require('../models/Province');
const District = require('../models/District');
const Division = require('../models/Division');
const connectDB = require('../config/db');
const logger = require('../utils/logger');

const SRI_LANKA_LOCATIONS = [
  {
    province: { en: 'Western', si: 'බස්නාහිර', ta: 'மேல்', code: 'WP' },
    districts: [
      { name: { en: 'Colombo', si: 'කොළඹ', ta: 'කොළඹ' }, code: 'CO', divisions: ['Colombo', 'Thimbirigasyaya', 'Kaduwela', 'Homagama', 'Kesbewa', 'Maharagama'] },
      { name: { en: 'Gampaha', si: 'ගම්පහ', ta: 'ගම්පහ' }, code: 'GQ', divisions: ['Gampaha', 'Negombo', 'Attanagalla', 'Ja-Ela', 'Kelaniya', 'Wattala'] },
      { name: { en: 'Kalutara', si: 'කළුතර', ta: 'කළුතර' }, code: 'KT', divisions: ['Kalutara', 'Beruwala', 'Panadura', 'Horana', 'Matugama'] }
    ]
  },
  {
    province: { en: 'Central', si: 'මධ්‍යම', ta: 'மத்திய', code: 'CP' },
    districts: [
      { name: { en: 'Kandy', si: 'මහනුවර', ta: 'கண்டி' }, code: 'KY', divisions: ['Kandy', 'Gampola', 'Peradeniya', 'Kundasale', 'Nawalapitiya'] },
      { name: { en: 'Matale', si: 'මාතලේ', ta: 'மாத்தளை' }, code: 'MT', divisions: ['Matale', 'Dambulla', 'Galewela', 'Rattota'] },
      { name: { en: 'Nuwara Eliya', si: 'නුවරඑළිය', ta: 'நுவரெலியා' }, code: 'NE', divisions: ['Nuwara Eliya', 'Walapane', 'Hanguranketha', 'Kotmale'] }
    ]
  },
  {
    province: { en: 'Southern', si: 'දකුණ', ta: 'தெற்கு', code: 'SP' },
    districts: [
      { name: { en: 'Galle', si: 'ගාල්ල', ta: 'ගාල්ල' }, code: 'GL', divisions: ['Galle', 'Hikkaduwa', 'Karandeniya', 'Elpitiya'] },
      { name: { en: 'Matara', si: 'මාතර', ta: 'මාතර' }, code: 'MH', divisions: ['Matara', 'Akuressa', 'Weligama', 'Devinuwara'] },
      { name: { en: 'Hambantota', si: 'හම්බන්තොට', ta: 'හම්බන්තොට' }, code: 'HB', divisions: ['Hambantota', 'Tangalle', 'Tissamaharama', 'Ambalantota'] }
    ]
  },
  {
    province: { en: 'Northern', si: 'උතුර', ta: 'வடக்கு', code: 'NP' },
    districts: [
      { name: { en: 'Jaffna', si: 'යාපනය', ta: 'யாழ்ப்பாணம்' }, code: 'JA', divisions: ['Jaffna', 'Nallur', 'Chavakachcheri', 'Point Pedro'] },
      { name: { en: 'Kilinochchi', si: 'කිලිනොච්චිය', ta: 'කිලිනොච්චිය' }, code: 'KL', divisions: ['Karachchi', 'Kandavalai', 'Pachchilaipalli'] },
      { name: { en: 'Mannar', si: 'මන්නාරම', ta: 'මන්නාරම' }, code: 'MN', divisions: ['Mannar', 'Nanaddan', 'Musali'] },
      { name: { en: 'Vavuniya', si: 'වවුනියාව', ta: 'වවුනියාව' }, code: 'VA', divisions: ['Vavuniya', 'Vengalacheddikulam'] },
      { name: { en: 'Mullaitivu', si: 'මුලතිව්', ta: 'මුලතිව්' }, code: 'MP', divisions: ['Maritimepattu', 'Puthukkudiyiruppu'] }
    ]
  },
  {
    province: { en: 'Eastern', si: 'නැගෙනහිර', ta: 'கிழக்கு', code: 'EP' },
    districts: [
      { name: { en: 'Batticaloa', si: 'මඩකලපුව', ta: 'මඩකලපුව' }, code: 'BC', divisions: ['Manmunai North', 'Eravur Pattu', 'Koralai Pattu'] },
      { name: { en: 'Ampara', si: 'අම්පාර', ta: 'අම්පාර' }, code: 'AP', divisions: ['Ampara', 'Kalmunai', 'Sammanthurai', 'Akkaraipattu'] },
      { name: { en: 'Trincomalee', si: 'ත්‍රිකුණාමලය', ta: 'ත්‍රිකුණාමලය' }, code: 'TR', divisions: ['Trincomalee Town', 'Kinniya', 'Muttur'] }
    ]
  },
  {
    province: { en: 'North Western', si: 'වයඹ', ta: 'வடமேற்கு', code: 'NWP' },
    districts: [
      { name: { en: 'Kurunegala', si: 'කුරුණෑගල', ta: 'කුරුණෑගල' }, code: 'KG', divisions: ['Kurunegala', 'Kuliyapitiya', 'Mawathagama', 'Nikaweratiya'] },
      { name: { en: 'Puttalam', si: 'පුත්තලම', ta: 'පුත්තලම' }, code: 'PR', divisions: ['Puttalam', 'Chilaw', 'Nattandiya', 'Anamaduwa'] }
    ]
  },
  {
    province: { en: 'North Central', si: 'උතුරු මැද', ta: 'வடமத்திய', code: 'NCP' },
    districts: [
      { name: { en: 'Anuradhapura', si: 'අනුරාධපුරය', ta: 'අනුරාධපුරය' }, code: 'AD', divisions: ['Nuwaragam Palatha', 'Kekirawa', 'Thambuttegama', 'Galenbindunuwewa'] },
      { name: { en: 'Polonnaruwa', si: 'පොළොන්නරුව', ta: 'පොළොන්නරුව' }, code: 'POL', divisions: ['Thamankaduwa', 'Hingurakgoda', 'Medirigiriya', 'Dimbulagala'] }
    ]
  },
  {
    province: { en: 'Uva', si: 'ඌව', ta: 'ஊவா', code: 'UP' },
    districts: [
      { name: { en: 'Badulla', si: 'බදුල්ල', ta: 'බදුල්ල' }, code: 'BD', divisions: ['Badulla', 'Bandarawela', 'Welimada', 'Hali-Ela'] },
      { name: { en: 'Moneragala', si: 'මොණරාගල', ta: 'මොණරාගල' }, code: 'MG', divisions: ['Moneragala', 'Wellawaya', 'Bibile', 'Kataragama'] }
    ]
  },
  {
    province: { en: 'Sabaragamuwa', si: 'සබරගමුව', ta: 'சබரகமுவ', code: 'SG' },
    districts: [
      { name: { en: 'Ratnapura', si: 'රත්නපුරය', ta: 'රත්නපුරය' }, code: 'RN', divisions: ['Ratnapura', 'Balangoda', 'Embilipitiya', 'Kuruwita'] },
      { name: { en: 'Kegalle', si: 'කෑගල්ල', ta: 'කෑගල්ල' }, code: 'KE', divisions: ['Kegalle', 'Mawanella', 'Rambukkana', 'Warakapola'] }
    ]
  }
];

const seedLocations = async () => {
  try {
    await connectDB();
    logger.info('Seeding Sri Lanka Location Hierarchy...');

    for (const item of SRI_LANKA_LOCATIONS) {
      let province = await Province.findOne({ code: item.province.code });
      if (!province) {
        province = await Province.create({
          name: item.province,
          code: item.province.code
        });
      }

      for (const d of item.districts) {
        let district = await District.findOne({ provinceId: province._id, 'name.en': d.name.en });
        if (!district) {
          district = await District.create({
            name: d.name,
            provinceId: province._id,
            code: d.code
          });
        }

        for (const divName of d.divisions) {
          let div = await Division.findOne({ districtId: district._id, 'name.en': divName });
          if (!div) {
            await Division.create({
              name: { en: divName, si: '', ta: '' },
              districtId: district._id
            });
          }
        }
      }
    }

    logger.info('Sri Lanka Location Hierarchy seeded successfully (9 Provinces, 25 Districts).');
    process.exit(0);
  } catch (err) {
    logger.error('Error seeding locations', err);
    process.exit(1);
  }
};

if (require.main === module) {
  seedLocations();
}

module.exports = seedLocations;
