const test = require('node:test');
const assert = require('node:assert/strict');

const { crops, slugifyCropName, getCropImagePath } = require('../seeds/seedCrops');

test('slugifyCropName creates stable file-safe crop slugs', () => {
  assert.equal(slugifyCropName('Paddy (Rice)'), 'paddy-rice');
  assert.equal(slugifyCropName('Manioc / Cassava'), 'manioc-cassava');
  assert.equal(slugifyCropName('Drumstick / Moringa'), 'drumstick-moringa');
});

test('all seeded crops point at the generated local crop image library', () => {
  assert.ok(crops.length > 0);

  for (const crop of crops) {
    assert.equal(crop.imageUrl, getCropImagePath(crop.name.en));
    assert.match(crop.imageUrl, /^\/media\/crops\/[a-z0-9-]+\.png$/);
  }
});
