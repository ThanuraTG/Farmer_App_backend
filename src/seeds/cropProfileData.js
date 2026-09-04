const cropProfileData = {
  'Paddy (Rice)': {
    description: 'Staple cereal crop cultivated under irrigated and rain-fed systems',
    suitableClimate: 'Warm tropical; about 20-35 C; Wet, Intermediate and Dry zones',
    suitableSoil: 'Clay, clay-loam or loam; good water retention; pH 5.5-7.0',
    growingPeriod: '75-135 days commonly; varieties also extend to 4-4.5 months',
    harvestingPeriod: 'Mainly single harvest, about 1-2 week field harvest window'
  },
  Maize: {
    description: 'Cereal crop grown for grain, feed and fresh cobs',
    suitableClimate: 'Warm; 18-27 C preferred; Dry and Intermediate zones',
    suitableSoil: 'Deep fertile well-drained loam; pH 5.5-7.0',
    growingPeriod: '90-120 days',
    harvestingPeriod: 'Single grain harvest around maturity; green cobs may be harvested earlier'
  },
  'Kurakkan (Finger Millet)': {
    description: 'Drought-tolerant small-grain cereal',
    suitableClimate: 'Warm semi-dry; 20-30 C',
    suitableSoil: 'Well-drained loam/sandy loam; pH 5.0-7.5',
    growingPeriod: '90-120 days',
    harvestingPeriod: 'Single harvest over about 1-2 weeks'
  },
  Sorghum: {
    description: 'Drought-tolerant cereal and fodder crop',
    suitableClimate: 'Warm dry climate; 25-32 C',
    suitableSoil: 'Well-drained loam/clay-loam; pH 5.5-8.0',
    growingPeriod: '100-130 days',
    harvestingPeriod: 'Single harvest at physiological maturity'
  },
  Potato: {
    description: 'Cool-season tuber crop',
    suitableClimate: 'Cool Up-country; tuber initiation best when soil is <24 C',
    suitableSoil: 'Organic-rich, well-drained loam; pH 5.5-6.6',
    growingPeriod: '90-120 days',
    harvestingPeriod: 'Single harvest at maturity'
  },
  'Sweet Potato': {
    description: 'Starchy root crop tolerant of moderately dry conditions',
    suitableClimate: 'Warm; 21-30 C',
    suitableSoil: 'Loose sandy-loam; pH 5.5-6.5',
    growingPeriod: '90-150 days',
    harvestingPeriod: 'Usually single harvest; can be harvested progressively'
  },
  'Manioc / Cassava': {
    description: 'Drought-tolerant perennial root crop normally grown as an annual',
    suitableClimate: 'Warm tropical; 25-30 C',
    suitableSoil: 'Well-drained sandy-loam/loam; pH 5.0-7.0',
    growingPeriod: '8-12 months',
    harvestingPeriod: 'Flexible from about 8-18 months, depending on variety and use'
  },
  'Big Onion': {
    description: 'Bulb vegetable/field condiment crop',
    suitableClimate: 'Cool-dry during bulb development; about 15-25 C',
    suitableSoil: 'Friable well-drained loam; pH 6.0-7.0',
    growingPeriod: '100-140 days',
    harvestingPeriod: 'Single harvest when tops fall and bulbs mature'
  },
  'Red Onion': {
    description: 'Short-duration bulb crop',
    suitableClimate: 'Warm-dry; 20-30 C',
    suitableSoil: 'Sandy-loam/loam; pH 5.8-6.8',
    growingPeriod: '70-100 days',
    harvestingPeriod: 'Single harvest'
  },
  'Green Gram': {
    description: 'Short-duration pulse crop',
    suitableClimate: 'Warm dry/intermediate; 25-35 C',
    suitableSoil: 'Well-drained loam; pH 6.0-7.5',
    growingPeriod: '60-75 days',
    harvestingPeriod: '2-3 pod pickings within about 1-2 weeks'
  },
  Cowpea: {
    description: 'Drought-tolerant pulse crop',
    suitableClimate: 'Warm; 20-35 C',
    suitableSoil: 'Sandy-loam/loam; pH 5.5-7.0',
    growingPeriod: '60-90 days',
    harvestingPeriod: 'Green pods picked repeatedly; dry grain usually 1-2 harvests'
  },
  'Black Gram': {
    description: 'Short-season pulse cultivated mainly in dry areas',
    suitableClimate: 'Warm; 25-35 C',
    suitableSoil: 'Well-drained loam; pH 6.0-7.5',
    growingPeriod: '70-90 days',
    harvestingPeriod: 'About 2-3 pickings as pods mature'
  },
  Groundnut: {
    description: 'Oilseed and food legume crop',
    suitableClimate: 'Warm and relatively dry; 25-30 C',
    suitableSoil: 'Loose sandy-loam; pH 5.8-6.5',
    growingPeriod: '100-130 days',
    harvestingPeriod: 'Single uprooting/harvest'
  },
  Soybean: {
    description: 'Protein-rich oilseed legume',
    suitableClimate: 'Warm; 20-30 C',
    suitableSoil: 'Fertile well-drained loam; pH 6.0-7.5',
    growingPeriod: '90-120 days',
    harvestingPeriod: 'Single harvest'
  },
  Sesame: {
    description: 'Drought-tolerant oilseed crop',
    suitableClimate: 'Hot dry; 25-35 C',
    suitableSoil: 'Well-drained sandy-loam; pH 5.5-8.0',
    growingPeriod: '80-110 days',
    harvestingPeriod: 'Single harvest before capsules shatter'
  },
  Tomato: {
    description: 'Popular fruit vegetable and cash crop',
    suitableClimate: 'Warm-mild; about 20-30 C; most zones except very wet high elevations',
    suitableSoil: 'Fertile well-drained loam; pH 5.5-7.0',
    growingPeriod: '90-120 days from sowing / first fruits about 60-80 days after transplanting',
    harvestingPeriod: 'Repeated picking for 4-8 weeks'
  },
  'Brinjal / Eggplant': {
    description: 'Warm-season fruit vegetable',
    suitableClimate: 'Warm; approximately 22-30 C; up to about 1300 m',
    suitableSoil: 'Well-drained fertile soil; DOA gives pH 5.5-5.8',
    growingPeriod: 'First harvest about 75-100 days',
    harvestingPeriod: 'Repeated harvesting for 3-5 months'
  },
  Capsicum: {
    description: 'Sweet/mild pepper vegetable',
    suitableClimate: 'Most agro-ecological zones; can grow up to about 1500 m',
    suitableSoil: 'Deep fertile loam; pH 5.5-6.8',
    growingPeriod: '75-100 days after transplanting',
    harvestingPeriod: 'Repeated harvest for 2-4 months'
  },
  'Green Chilli': {
    description: 'Major condiment and vegetable crop',
    suitableClimate: 'Warm; 20-30 C; Dry and Intermediate zones especially suitable',
    suitableSoil: 'Fertile well-drained loam; pH 5.5-6.8',
    growingPeriod: 'First harvest 75-90 days after transplanting',
    harvestingPeriod: 'Repeated picking for 4-6 months'
  },
  Pumpkin: {
    description: 'Vine crop grown for mature fruit',
    suitableClimate: 'Warm Dry/Intermediate zones; mainly below about 500 m',
    suitableSoil: 'Humus-rich well-drained soil; pH 5.5-7.5',
    growingPeriod: '90-120 days',
    harvestingPeriod: 'Several fruits harvested over 4-8 weeks'
  },
  Cucumber: {
    description: 'Fast-growing salad/cooking cucurbit',
    suitableClimate: 'Warm; optimum around 30 C',
    suitableSoil: 'Well-drained organic-rich soil; pH 5.5-7.5',
    growingPeriod: 'First harvest 40-55 days',
    harvestingPeriod: 'Every 2-3 days for about 3-5 weeks'
  },
  'Snake Gourd': {
    description: 'Climbing cucurbit grown for immature fruits',
    suitableClimate: 'Warm humid; 24-30 C',
    suitableSoil: 'Fertile well-drained loam; pH 5.5-7.0',
    growingPeriod: '60-75 days to first harvest',
    harvestingPeriod: 'Repeated harvest for 2-3 months'
  },
  'Bitter Gourd': {
    description: 'Medicinal/nutritious vine vegetable',
    suitableClimate: 'Warm; suitable up to about 1200 m',
    suitableSoil: 'Well-drained compost-rich soil; pH 5.5-7.5',
    growingPeriod: 'First harvest 50-60 days',
    harvestingPeriod: 'Every 2-3 days for 2-3 months'
  },
  'Ridge Gourd': {
    description: 'Climbing vegetable grown for immature fruit',
    suitableClimate: 'Warm humid; 24-30 C',
    suitableSoil: 'Fertile well-drained loam; pH 6.0-7.0',
    growingPeriod: '60-75 days',
    harvestingPeriod: 'Repeated picking for 2-3 months'
  },
  'Ash Plantain / Ash Gourd': {
    description: 'Large cucurbit grown for mature waxy fruit',
    suitableClimate: 'Warm tropical; 24-30 C',
    suitableSoil: 'Fertile sandy-loam/loam; pH 5.5-7.0',
    growingPeriod: '90-120 days',
    harvestingPeriod: 'Mature fruits harvested over about 4-8 weeks'
  },
  Okra: {
    description: 'Warm-season pod vegetable',
    suitableClimate: 'Nearly all zones except Up-country Wet Zone',
    suitableSoil: 'Well-drained near-neutral soil; about pH 6.0-7.5',
    growingPeriod: 'First harvest about 50 days',
    harvestingPeriod: 'DOA recommends harvesting about every 2 days, continuing roughly to 100 days after planting'
  },
  Cabbage: {
    description: 'Cool-season leafy vegetable',
    suitableClimate: 'Cool Up-country; approximately 15-20 C',
    suitableSoil: 'Fertile well-drained loam; pH 6.0-6.8',
    growingPeriod: '80-120 days',
    harvestingPeriod: 'Heads harvested once over roughly 1-2 weeks'
  },
  'Knol-khol': {
    description: 'Swollen-stem brassica vegetable',
    suitableClimate: 'Cool Up-country; Maha suitable at lower elevations',
    suitableSoil: 'Organic-rich well-drained soil; around pH 5.5-6.5',
    growingPeriod: '60-90 days from sowing',
    harvestingPeriod: 'Usually single harvest over 1-2 weeks'
  },
  Carrot: {
    description: 'Cool-season root vegetable',
    suitableClimate: 'Cool; about 15-20 C',
    suitableSoil: 'Deep loose sandy-loam; pH 6.0-7.0',
    growingPeriod: '90-120 days',
    harvestingPeriod: 'Single/root harvest'
  },
  Beetroot: {
    description: 'Cool-season root vegetable',
    suitableClimate: 'Mild-cool; 15-25 C',
    suitableSoil: 'Loose fertile loam; pH 6.0-7.5',
    growingPeriod: '60-90 days',
    harvestingPeriod: 'Single harvest'
  },
  Radish: {
    description: 'Very short-duration root vegetable',
    suitableClimate: 'Cool-mild; 15-25 C',
    suitableSoil: 'Loose sandy-loam; pH 5.8-7.0',
    growingPeriod: '30-60 days',
    harvestingPeriod: 'Single harvest'
  },
  Leeks: {
    description: 'Cool-climate leafy/allium crop',
    suitableClimate: 'Up-country cool climate; about 12-24 C',
    suitableSoil: 'Fertile moist well-drained loam; pH 6.0-7.0',
    growingPeriod: '120-150 days',
    harvestingPeriod: 'Harvested progressively over 2-4 weeks'
  },
  Beans: {
    description: 'French/common bean grown for green pods',
    suitableClimate: 'Mild-cool; 18-24 C',
    suitableSoil: 'Well-drained fertile loam; pH 5.5-6.5',
    growingPeriod: 'First harvest 45-60 days',
    harvestingPeriod: 'Repeated pod picking for 4-8 weeks'
  },
  'Winged Bean': {
    description: 'Tropical climbing legume with edible pods',
    suitableClimate: 'Warm humid; 22-30 C',
    suitableSoil: 'Fertile well-drained soil; pH 5.5-7.5',
    growingPeriod: 'First harvest 75-90 days',
    harvestingPeriod: 'Repeated harvest for 3-6 months'
  },
  'Snake Bean': {
    description: 'Long-podded climbing legume',
    suitableClimate: 'Warm; 20-30 C',
    suitableSoil: 'Well-drained loam; pH 5.5-7.0',
    growingPeriod: 'First harvest 45-60 days',
    harvestingPeriod: 'Repeated picking for 2-3 months'
  },
  Lettuce: {
    description: 'Short-duration leafy salad crop',
    suitableClimate: 'Cool-mild; 15-22 C',
    suitableSoil: 'Loose fertile soil; pH 6.0-7.0',
    growingPeriod: '30-60 days',
    harvestingPeriod: 'Whole head once or leaf harvesting for 2-4 weeks'
  },
  'Drumstick / Moringa': {
    description: 'Perennial tree vegetable grown for leaves and pods',
    suitableClimate: 'Hot dry/intermediate; 25-35 C',
    suitableSoil: 'Well-drained sandy-loam; pH 5.0-9.0',
    growingPeriod: 'Leaves from 3-6 months; pods around 6-12 months',
    harvestingPeriod: 'Repeated harvest; productive for 10+ years'
  },
  Banana: {
    description: 'Perennial herbaceous fruit crop',
    suitableClimate: 'Warm humid; 24-30 C',
    suitableSoil: 'Deep fertile well-drained loam; pH 5.5-7.0',
    growingPeriod: 'First bunch 9-15 months',
    harvestingPeriod: 'Main plant once; ratoon bunches approximately every 8-12 months'
  },
  Mango: {
    description: 'Long-lived tropical fruit tree',
    suitableClimate: 'Tropical/subtropical; optimum 27-30 C',
    suitableSoil: 'Deep rich well-drained soil; pH 5.5-7.5',
    growingPeriod: 'Grafted plants about 3-4 years',
    harvestingPeriod: 'Seasonal harvest 2-4 months/year; tree productive for decades'
  },
  Papaya: {
    description: 'Fast-bearing tropical fruit crop',
    suitableClimate: 'Warm; 22-32 C',
    suitableSoil: 'Deep well-drained soil; pH 5.5-7.0',
    growingPeriod: '7-10 months',
    harvestingPeriod: 'Fruits harvested every 1-2 weeks, commercially about 2-3 years'
  },
  Pineapple: {
    description: 'Tropical bromeliad fruit crop',
    suitableClimate: '24-32 C; 1500-3000 mm rainfall',
    suitableSoil: 'Well-drained sandy-loam; pH 5.0-6.0',
    growingPeriod: 'Around 15-20 months to fruit depending on planting material/flower induction',
    harvestingPeriod: 'One main fruit/plant; ratoon crop may follow'
  },
  Watermelon: {
    description: 'Short-duration vine fruit',
    suitableClimate: 'Warm dry; 22-30 C',
    suitableSoil: 'Sandy-loam; pH 6.0-7.5',
    growingPeriod: '70-100 days',
    harvestingPeriod: '2-4 pickings over about 2-3 weeks'
  },
  'Passion Fruit': {
    description: 'Perennial climbing fruit vine',
    suitableClimate: 'Mild tropical; approximately 18-28 C',
    suitableSoil: 'Well-drained fertile loam; pH 5.5-6.5',
    growingPeriod: '8-12 months',
    harvestingPeriod: 'Several harvest rounds/seasons; productive about 2-4 years'
  },
  Guava: {
    description: 'Hardy tropical fruit tree',
    suitableClimate: 'Warm; 23-30 C',
    suitableSoil: 'Well-drained soil; pH 5.0-7.0',
    growingPeriod: 'Vegetatively propagated plants 2-3 years',
    harvestingPeriod: 'Usually 2 main crops/year; productive 15-20+ years'
  },
  Avocado: {
    description: 'Perennial subtropical/tropical fruit tree',
    suitableClimate: 'Mild tropical; about 18-25 C depending on cultivar',
    suitableSoil: 'Deep well-drained loam; pH 5.0-7.0',
    growingPeriod: 'Grafted trees 3-4 years',
    harvestingPeriod: 'Seasonal harvest 2-4 months/year'
  },
  Rambutan: {
    description: 'Humid-tropical fruit tree',
    suitableClimate: 'Warm humid; 22-30 C; high rainfall',
    suitableSoil: 'Deep organic-rich soil; pH 5.0-6.5',
    growingPeriod: 'Grafted trees 3-5 years',
    harvestingPeriod: 'Main seasonal harvest roughly 1-2 months/year'
  },
  'Wood Apple': {
    description: 'Hardy dry/intermediate-zone fruit tree',
    suitableClimate: 'Tropical warm; 20-35 C',
    suitableSoil: 'Well-drained loam; tolerates pH about 5-8',
    growingPeriod: 'Improved/grafted trees about 4-6 years; seedlings longer',
    harvestingPeriod: 'Seasonal harvest; tree remains productive for decades'
  },
  Jackfruit: {
    description: 'Large perennial multipurpose fruit tree',
    suitableClimate: 'Warm humid; 22-35 C',
    suitableSoil: 'Deep well-drained fertile soil; pH 5.0-7.5',
    growingPeriod: 'Grafted about 3-4 years; seedlings around 5-7 years',
    harvestingPeriod: 'Seasonal fruits over 3-5 months/year'
  },
  Soursop: {
    description: 'Tropical Annona fruit tree',
    suitableClimate: 'Warm humid; 21-30 C',
    suitableSoil: 'Well-drained sandy-loam; pH 5.0-6.5',
    growingPeriod: 'Around 2-4 years',
    harvestingPeriod: 'Multiple fruits during crop seasons; often more than one flush/year'
  },
  Orange: {
    description: 'Citrus fruit tree',
    suitableClimate: 'Warm subtropical/tropical; 20-30 C',
    suitableSoil: 'Well-drained loam; pH 5.5-7.5',
    growingPeriod: 'Budded trees 3-4 years',
    harvestingPeriod: 'Seasonal harvest 2-4 months/year'
  },
  Lime: {
    description: 'Acid citrus fruit tree',
    suitableClimate: 'Warm; 20-30 C',
    suitableSoil: 'Well-drained loam; pH 5.5-7.5',
    growingPeriod: '2-3 years',
    harvestingPeriod: 'Several flowering/harvest flushes each year'
  },
  Lemon: {
    description: 'Acid citrus fruit crop',
    suitableClimate: 'Mild-warm; 18-30 C',
    suitableSoil: 'Well-drained loam; pH 5.5-6.5',
    growingPeriod: '2-3 years',
    harvestingPeriod: 'Several harvest periods/year'
  },
  Pomegranate: {
    description: 'Drought-tolerant fruit shrub/tree',
    suitableClimate: 'Warm dry; 20-35 C',
    suitableSoil: 'Well-drained loam; pH 5.5-7.5',
    growingPeriod: '2-3 years',
    harvestingPeriod: 'Main seasonal crop over 1-3 months'
  },
  'Star Fruit': {
    description: 'Tropical evergreen fruit tree',
    suitableClimate: 'Warm humid; 22-30 C',
    suitableSoil: 'Organic-rich well-drained soil; pH 5.5-6.5',
    growingPeriod: 'Grafted plants 2-3 years',
    harvestingPeriod: 'Can produce several crops per year'
  },
  Tea: {
    description: 'Perennial leaf crop used for manufactured tea',
    suitableClimate: 'Cool/mild humid; broadly 18-25 C; good distributed rainfall',
    suitableSoil: 'Deep acidic well-drained soil; roughly pH 4.5-5.5',
    growingPeriod: 'Commercial plucking usually begins about 18-24 months after field establishment',
    harvestingPeriod: 'Plucking every ~7-14 days depending on growth; productive for decades'
  },
  Rubber: {
    description: 'Latex-producing plantation tree',
    suitableClimate: 'Warm humid; ideal annual rainfall about 2000-3000 mm',
    suitableSoil: 'Deep well-drained soil; Sri Lankan rubber soils optimum pH 4.0-6.0',
    growingPeriod: 'Tapping commonly starts around 5-7 years',
    harvestingPeriod: 'Regular tapping throughout productive period; conventional economic lifespan about 30 years'
  },
  Coconut: {
    description: 'Long-lived palm producing nuts throughout the year',
    suitableClimate: 'Tropical; around 27 C; adequate well-distributed rainfall',
    suitableSoil: 'Deep well-drained sandy/loamy/lateritic soil; about pH 5-8',
    growingPeriod: 'Improved palms typically begin bearing around 4-6 years',
    harvestingPeriod: 'Nuts harvested roughly every 45-60 days; productive for many decades'
  },
  Cinnamon: {
    description: 'Bark spice crop native to Sri Lanka',
    suitableClimate: 'Warm humid Wet/Intermediate low country; roughly 25-30 C',
    suitableSoil: 'Well-drained sandy-loam/lateritic soil; acidic, about pH 4.5-6.5',
    growingPeriod: 'First commercial cutting about 2.5-3 years',
    harvestingPeriod: 'Shoots generally harvested/peeled every 6-8 months'
  },
  Pepper: {
    description: 'Perennial climbing spice, king of spices',
    suitableClimate: 'Wet and Intermediate zones; Dry zone possible with irrigation',
    suitableSoil: 'Organic-rich well-drained loam; about pH 5.5-6.5',
    growingPeriod: 'DEA states local selections start yielding about 2.5 years',
    harvestingPeriod: 'Usually 1-2 main harvests/year; productive for many years'
  },
  Cardamom: {
    description: 'Shade-loving perennial spice crop',
    suitableClimate: 'Cool humid shaded environment; about 18-25 C',
    suitableSoil: 'Organic-rich forest loam; pH 5.0-6.5',
    growingPeriod: '2-3 years',
    harvestingPeriod: 'Capsules picked repeatedly at about 3-5 week intervals in the bearing season'
  },
  Clove: {
    description: 'Aromatic flower-bud spice tree',
    suitableClimate: 'Warm humid; 20-30 C',
    suitableSoil: 'Deep fertile well-drained loam; pH 5.5-6.5',
    growingPeriod: '5-7 years to initial bearing',
    harvestingPeriod: 'Usually one main annual harvest over 1-2 months'
  },
  Nutmeg: {
    description: 'Perennial spice tree producing nutmeg and mace',
    suitableClimate: 'Warm humid; 20-30 C',
    suitableSoil: 'Deep fertile well-drained soil; pH 5.5-7.0',
    growingPeriod: 'Grafted about 4-5 years; seedlings about 7-9 years',
    harvestingPeriod: 'Fruits harvested in several rounds/seasons each year'
  },
  Coffee: {
    description: 'Perennial beverage crop',
    suitableClimate: 'Arabica: cooler uplands; Robusta: warmer low/mid elevations',
    suitableSoil: 'Deep well-drained organic soil; pH 5.0-6.5',
    growingPeriod: 'First bearing about 2-3 years',
    harvestingPeriod: 'Main berry harvest usually 2-3 months/year'
  },
  Cocoa: {
    description: 'Shade-tolerant perennial tree grown for cocoa beans',
    suitableClimate: 'Warm humid; about 21-32 C',
    suitableSoil: 'Deep organic well-drained soil; pH 5.0-7.5',
    growingPeriod: '2-3 years to early bearing',
    harvestingPeriod: 'Pods collected every 2-4 weeks during main/mid-crop seasons'
  },
  Turmeric: {
    description: 'Rhizomatous spice and medicinal crop',
    suitableClimate: 'Warm humid; 20-30 C',
    suitableSoil: 'Loose fertile well-drained loam; pH 5.0-7.5',
    growingPeriod: '7-9 months',
    harvestingPeriod: 'Single mature rhizome harvest'
  },
  Ginger: {
    description: 'Rhizomatous spice/medicinal crop',
    suitableClimate: 'Warm humid; 20-30 C; partial shade beneficial',
    suitableSoil: 'Organic-rich well-drained loam; pH 5.5-6.5',
    growingPeriod: 'Green ginger about 5-6 months; mature ginger 8-9 months',
    harvestingPeriod: 'Usually single rhizome harvest'
  },
  Coriander: {
    description: 'Annual herb grown for leaves and seeds',
    suitableClimate: 'Cool-dry; 15-25 C',
    suitableSoil: 'Well-drained loam; pH 6.0-7.5',
    growingPeriod: 'Leaves 30-45 days; seed 90-120 days',
    harvestingPeriod: 'Leaves cut 1-3 times; seed crop harvested once'
  },
  Fenugreek: {
    description: 'Annual spice/leaf legume',
    suitableClimate: 'Cool-dry; 10-25 C',
    suitableSoil: 'Well-drained loam; pH 6.0-7.0',
    growingPeriod: 'Leaves 25-40 days; seeds 90-120 days',
    harvestingPeriod: 'Leaf crop 1-2 cuts; seed once'
  },
  Fennel: {
    description: 'Aromatic herb grown mainly for seed',
    suitableClimate: 'Mild dry; 15-25 C',
    suitableSoil: 'Well-drained fertile loam; pH 6.0-8.0',
    growingPeriod: '120-160 days',
    harvestingPeriod: 'Mature umbels harvested in 2-3 rounds'
  },
  Lemongrass: {
    description: 'Aromatic perennial grass used for leaves/oil',
    suitableClimate: 'Warm humid; 20-30 C',
    suitableSoil: 'Well-drained sandy-loam/loam; pH 5.0-8.0',
    growingPeriod: 'First cutting 4-6 months',
    harvestingPeriod: 'Further cuts every 2-3 months, usually productive about 3-5 years'
  },
  'Aloe Vera': {
    description: 'Succulent medicinal crop grown for leaf gel',
    suitableClimate: 'Hot dry/semi-dry; about 20-35 C; dislikes waterlogging',
    suitableSoil: 'Very well-drained sandy-loam; pH 6.0-8.5',
    growingPeriod: 'First commercial leaf harvest around 8-12 months',
    harvestingPeriod: 'Mature leaves harvested every 3-4 months; productive about 3-5 years'
  }
};

// Exact environmental thresholds supplied for the vegetable catalogue.
const vegetableWeatherRequirements = {
  Tomato: { minTemperature: 7, maxTemperature: 35, optimumTemperature: '21-24 C', rainfall: '600-1300 mm/year', humidity: '50-70% RH', sunlight: '6-8 h/day, full sun' },
  'Brinjal / Eggplant': { minTemperature: 9, maxTemperature: 40, optimumTemperature: '20-30 C', rainfall: '1200-1600 mm/year', humidity: '60-80% RH', sunlight: '6-8 h/day' },
  Capsicum: { minTemperature: 8, maxTemperature: 35, optimumTemperature: '21-25 C', rainfall: '600-1250 mm/year', humidity: '60-75% RH', sunlight: '6-8 h/day' },
  'Green Chilli': { minTemperature: 8, maxTemperature: 35, optimumTemperature: '21-27 C', rainfall: '600-1000 mm/year', humidity: '50-70% RH', sunlight: '6-8 h/day' },
  Pumpkin: { minTemperature: 9, maxTemperature: 38, optimumTemperature: '20-30 C', rainfall: '600-1000 mm/year', humidity: '60-75% RH', sunlight: '6-8 h/day' },
  Cucumber: { minTemperature: 6, maxTemperature: 38, optimumTemperature: '25-30 C', rainfall: '1000-1200 mm/year', humidity: '60-80% RH', sunlight: '6-8 h/day' },
  'Snake Gourd': { minTemperature: 14, maxTemperature: 38, optimumTemperature: '22-35 C', rainfall: '2000-2500 mm/year', humidity: '65-85% RH', sunlight: '6-8 h/day' },
  'Bitter Gourd': { minTemperature: 15, maxTemperature: 38, optimumTemperature: '22-30 C', rainfall: '2000-2500 mm/year', humidity: '60-80% RH', sunlight: '6-8 h/day' },
  'Ridge Gourd': { minTemperature: 15, maxTemperature: 38, optimumTemperature: '20-32 C', rainfall: '1200-2000 mm/year', humidity: '60-80% RH', sunlight: '6-8 h/day' },
  'Ash Plantain / Ash Gourd': { minTemperature: 12, maxTemperature: 37, optimumTemperature: '24-30 C', rainfall: '400-800 mm/year preferred', humidity: '60-80% RH', sunlight: '6-8 h/day' },
  Okra: { minTemperature: 12, maxTemperature: 35, optimumTemperature: '20-30 C', rainfall: '600-1200 mm/year', humidity: '50-70% RH', sunlight: '6-8 h/day' },
  Cabbage: { minTemperature: 7, maxTemperature: 32, optimumTemperature: '15-24 C', rainfall: '500-1000 mm/year', humidity: '60-80% RH', sunlight: '5-7 h/day' },
  'Knol-khol': { minTemperature: 5, maxTemperature: 25, optimumTemperature: '12-18 C', rainfall: '900-1300 mm/year', humidity: '60-80% RH', sunlight: '5-7 h/day' },
  Carrot: { minTemperature: 3, maxTemperature: 30, optimumTemperature: '15-24 C', rainfall: '600-1200 mm/year', humidity: '60-75% RH', sunlight: '6-8 h/day' },
  Beetroot: { minTemperature: 4, maxTemperature: 35, optimumTemperature: '15-25 C', rainfall: '600-800 mm/year', humidity: '60-75% RH', sunlight: '6-8 h/day' },
  Radish: { minTemperature: 3, maxTemperature: 30, optimumTemperature: '12-25 C', rainfall: '800-1000 mm/year', humidity: '60-75% RH', sunlight: '5-7 h/day' },
  Leeks: { minTemperature: 6, maxTemperature: 27, optimumTemperature: '18-24 C', rainfall: '750-1000 mm/year', humidity: '60-80% RH', sunlight: '6-8 h/day' },
  Beans: { minTemperature: 7, maxTemperature: 32, optimumTemperature: '16-25 C', rainfall: '500-2000 mm/year', humidity: '60-70% RH', sunlight: '6-8 h/day' },
  'Winged Bean': { minTemperature: 18, maxTemperature: 32, optimumTemperature: '24-27 C', rainfall: '700-2500 mm/year', humidity: '70-85% RH', sunlight: '6-8 h/day' },
  'Snake Bean': { minTemperature: 14, maxTemperature: 38, optimumTemperature: '20-30 C', rainfall: '1500-2000 mm/year', humidity: '60-80% RH', sunlight: '6-8 h/day' },
  Lettuce: { minTemperature: 5, maxTemperature: 30, optimumTemperature: '12-20 C', rainfall: '1100-1400 mm/year', humidity: '60-80% RH', sunlight: '5-7 h/day' },
  'Drumstick / Moringa': { minTemperature: 7, maxTemperature: 48, optimumTemperature: '25-35 C', rainfall: '250-1500 mm/year', humidity: '40-70% RH', sunlight: '6-8 h/day, full sun' }
};

module.exports = { cropProfileData, vegetableWeatherRequirements };
