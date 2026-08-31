/**
 * Crop Mapping Utility to map diverse names across HARTI & CBSL sources into canonical crop identifiers.
 */

const cropMap = {
  // Tomato
  'tomato': 'tomato',
  'tomatoes': 'tomato',
  'තක්කාලි': 'tomato',
  'thakkali': 'tomato',
  'தக்காளி': 'tomato',

  // Potato
  'potato': 'potato',
  'potatoes': 'potato',
  'අර්තාපල්': 'potato',
  'arthapal': 'potato',
  'உருளைக்கிழங்கு': 'potato',

  // Red Onion
  'red onion': 'red-onion',
  'red onions': 'red-onion',
  'onion': 'red-onion',
  'onions': 'red-onion',
  'රතු ළූණු': 'red-onion',
  'ළූණු': 'red-onion',
  'சிவப்பு வெங்காயம்': 'red-onion',

  // Carrot
  'carrot': 'carrot',
  'carrots': 'carrot',
  'කැරට්': 'carrot',
  'கேரட்': 'carrot',

  // Green Chilli
  'green chilli': 'green-chilli',
  'green chillies': 'green-chilli',
  'chilli': 'green-chilli',
  'chillies': 'green-chilli',
  'අමු මිරිස්': 'green-chilli',
  'මිරිස්': 'green-chilli',
  'பச்சை மிளகாய்': 'green-chilli',

  // Paddy (Rice)
  'paddy': 'paddy-rice',
  'paddy (rice)': 'paddy-rice',
  'rice': 'paddy-rice',
  'වී': 'paddy-rice',
  'සහල්': 'paddy-rice',
  'நெல்': 'paddy-rice',

  // Maize
  'maize': 'maize',
  'corn': 'maize',
  'ඉරිඟු': 'maize',
  'சோளம்': 'maize',

  // Cabbage
  'cabbage': 'cabbage',
  'ගෝවා': 'cabbage',
  'முட்டைக்கோஸ்': 'cabbage',

  // Black Pepper
  'black pepper': 'black-pepper',
  'pepper': 'black-pepper',
  'ගම්මිරිස්': 'black-pepper',
  'கருப்பு மிளகு': 'black-pepper',

  // Cinnamon
  'cinnamon': 'cinnamon',
  'කුරුඳු': 'cinnamon',
  'இலவங்கப்பட்டை': 'cinnamon',

  // Coconut
  'coconut': 'coconut',
  'coconuts': 'coconut',
  'පොල්': 'coconut',
  'தேங்காய்': 'coconut',

  // Tea
  'tea': 'tea',
  'තේ': 'tea',
  'தேயிலை': 'tea',

  // Mukunuwenna
  'mukunuwenna': 'mukunuwenna',
  'මුකුණුවැන්න': 'mukunuwenna',

  // Gotukola
  'gotukola': 'gotukola',
  'ගොටුකොළ': 'gotukola',

  // Mango
  'mango': 'mango',
  'mangoes': 'mango',
  'අඹ': 'mango',
  'மாம்பழம்': 'mango',

  // Banana
  'banana': 'banana',
  'bananas': 'banana',
  'කෙසෙල්': 'banana',
  'வாழைப்பழம்': 'banana',

  // Keeri Samba Rice
  'keeri samba': 'keeri-samba-rice',
  'keeri samba rice': 'keeri-samba-rice',
  'කීරි සම්බා': 'keeri-samba-rice',

  // Kurakkan
  'kurakkan': 'kurakkan-finger-millet',
  'kurakkan (finger millet)': 'kurakkan-finger-millet',
  'කුරක්කන්': 'kurakkan-finger-millet',

  // Sorghum
  'sorghum': 'sorghum',
  'සෝර්ගම්': 'sorghum',

  // Sweet Potato
  'sweet potato': 'sweet-potato',
  'බතල': 'sweet-potato',

  // Manioc
  'manioc': 'manioc-cassava',
  'manioc / cassava': 'manioc-cassava',
  'cassava': 'manioc-cassava',
  'මඤ්ඤොක්කා': 'manioc-cassava',

  // Big Onion
  'big onion': 'big-onion',
  'ලොකු ලූනු': 'big-onion',

  // Green Gram
  'green gram': 'green-gram',
  'මුං ඇට': 'green-gram',

  // Cowpea
  'cowpea': 'cowpea',
  'කව්පි': 'cowpea',

  // Black Gram
  'black gram': 'black-gram',
  'උඳු': 'black-gram',

  // Groundnut
  'groundnut': 'groundnut',
  'රටකජු': 'groundnut',

  // Soybean
  'soybean': 'soybean',
  'සෝයා': 'soybean',

  // Sesame
  'sesame': 'sesame',
  'තල': 'sesame',

  // Brinjal
  'brinjal': 'brinjal-eggplant',
  'brinjal / eggplant': 'brinjal-eggplant',
  'eggplant': 'brinjal-eggplant',
  'වම්බටු': 'brinjal-eggplant',

  // Capsicum
  'capsicum': 'capsicum',
  'මාළු මිරිස්': 'capsicum',

  // Pumpkin
  'pumpkin': 'pumpkin',
  'වට්ටක්කා': 'pumpkin',

  // Cucumber
  'cucumber': 'cucumber',
  'පිපිඤ්ඤා': 'cucumber',

  // Snake Gourd
  'snake gourd': 'snake-gourd',
  'පතෝල': 'snake-gourd',

  // Bitter Gourd
  'bitter gourd': 'bitter-gourd',
  'කරවිල': 'bitter-gourd',

  // Ridge Gourd
  'ridge gourd': 'ridge-gourd',
  'වැටකොළු': 'ridge-gourd',

  // Ash Plantain
  'ash plantain': 'ash-plantain-ash-gourd',
  'ash plantain / ash gourd': 'ash-plantain-ash-gourd',
  'ash gourd': 'ash-plantain-ash-gourd',
  'පුහුල්': 'ash-plantain-ash-gourd',

  // Okra
  'okra': 'okra',
  'බණ්ඩක්කා': 'okra',

  // Knol-khol
  'knol-khol': 'knol-khol',
  'නෝල්කෝල්': 'knol-khol',

  // Beetroot
  'beetroot': 'beetroot',
  'බීට්': 'beetroot',

  // Radish
  'radish': 'radish',
  'රාබු': 'radish',

  // Leeks
  'leeks': 'leeks',
  'ලීක්ස්': 'leeks',

  // Beans
  'beans': 'beans',
  'බෝංචි': 'beans',

  // Winged Bean
  'winged bean': 'winged-bean',
  'දඹල': 'winged-bean',

  // Snake Bean
  'snake bean': 'snake-bean',
  'මෑ': 'snake-bean',

  // Lettuce
  'lettuce': 'lettuce',
  'සලාද කොළ': 'lettuce',

  // Drumstick
  'drumstick': 'drumstick-moringa',
  'drumstick / moringa': 'drumstick-moringa',
  'moringa': 'drumstick-moringa',
  'මුරුංගා': 'drumstick-moringa',

  // Papaya
  'papaya': 'papaya',
  'ගස්ලබු': 'papaya',

  // Pineapple
  'pineapple': 'pineapple',
  'අන්නාසි': 'pineapple',

  // Watermelon
  'watermelon': 'watermelon',
  'කොමඩු': 'watermelon',

  // Passion Fruit
  'passion fruit': 'passion-fruit',
  'පැෂන් ෆෘට්': 'passion-fruit',

  // Guava
  'guava': 'guava',
  'පේර': 'guava',

  // Avocado
  'avocado': 'avocado',
  'අලිගැටපේර': 'avocado',

  // Rambutan
  'rambutan': 'rambutan',
  'රඹුටන්': 'rambutan',

  // Wood Apple
  'wood apple': 'wood-apple',
  'දිවුල්': 'wood-apple',

  // Jackfruit
  'jackfruit': 'jackfruit',
  'කොස්': 'jackfruit',

  // Soursop
  'soursop': 'soursop',
  'කටු අනෝදා': 'soursop',

  // Orange
  'orange': 'orange',
  'දොඩම්': 'orange',

  // Lime
  'lime': 'lime',
  'දෙහි': 'lime',

  // Lemon
  'lemon': 'lemon',
  'නාරං/ලෙමන්': 'lemon',

  // Pomegranate
  'pomegranate': 'pomegranate',
  'දෙළුම්': 'pomegranate',

  // Star Fruit
  'star fruit': 'star-fruit',
  'කාමරංගා': 'star-fruit',

  // Rubber
  'rubber': 'rubber',
  'රබර්': 'rubber',

  // Cardamom
  'cardamom': 'cardamom',
  'එනසාල්': 'cardamom',

  // Clove
  'clove': 'clove',
  'කරාබුනැටි': 'clove',

  // Nutmeg
  'nutmeg': 'nutmeg',
  'සාදික්කා': 'nutmeg',

  // Coffee
  'coffee': 'coffee',
  'කෝපි': 'coffee',

  // Cocoa
  'cocoa': 'cocoa',
  'කොකෝවා': 'cocoa',

  // Turmeric
  'turmeric': 'turmeric',
  'කහ': 'turmeric',

  // Ginger
  'ginger': 'ginger',
  'ඉඟුරු': 'ginger',

  // Coriander
  'coriander': 'coriander',
  'කොත්තමල්ලි': 'coriander',

  // Fenugreek
  'fenugreek': 'fenugreek',
  'උළුහාල්': 'fenugreek',

  // Fennel
  'fennel': 'fennel',
  'මහදුරු': 'fennel',

  // Lemongrass
  'lemongrass': 'lemongrass',
  'සේර': 'lemongrass',

  // Aloe Vera
  'aloe vera': 'aloe-vera',
  'කෝමාරිකා': 'aloe-vera'
};

/**
 * Normalizes input raw crop string into a standard canonical key
 * @param {string} rawName 
 * @returns {string} canonical key or trimmed lowercased name
 */
function normalizeCropName(rawName) {
  if (!rawName || typeof rawName !== 'string') return 'unknown';
  const clean = rawName.trim().toLowerCase();
  return cropMap[clean] || clean.replace(/\s+/g, '-');
}

module.exports = {
  cropMap,
  normalizeCropName
};
