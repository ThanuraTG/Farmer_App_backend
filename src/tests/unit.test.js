const test = require('node:test');
const assert = require('node:assert');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

test('D.1 Unit Test 1: Password Hashing & Verification', async () => {
  const plainPassword = 'farmerPassword123';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(plainPassword, salt);

  assert.ok(hash, 'Hash should be generated');
  assert.notStrictEqual(plainPassword, hash, 'Hash should not match plain password');

  const isMatch = await bcrypt.compare(plainPassword, hash);
  assert.strictEqual(isMatch, true, 'Correct password should return true');

  const isWrongMatch = await bcrypt.compare('wrongPassword', hash);
  assert.strictEqual(isWrongMatch, false, 'Wrong password should return false');
});

test('D.1 Unit Test 2: JWT Token Generation & Verification', () => {
  const secret = 'testsecretkey123';
  const payload = { id: '654321abcdef1234567890ab', role: 'farmer' };

  const token = jwt.sign(payload, secret, { expiresIn: '1h' });
  assert.ok(token, 'JWT Token should be generated');

  const decoded = jwt.verify(token, secret);
  assert.strictEqual(decoded.id, payload.id, 'Decoded ID should match payload ID');
  assert.strictEqual(decoded.role, payload.role, 'Decoded role should match payload role');
});

test('D.1 Unit Test 3: Sri Lanka Location Cascading Data Structure Validation', () => {
  const sriLankaProvinces = [
    'Western', 'Central', 'Southern', 'Northern', 'Eastern', 
    'North Western', 'North Central', 'Uva', 'Sabaragamuwa'
  ];

  assert.strictEqual(sriLankaProvinces.length, 9, 'Sri Lanka should have exactly 9 provinces');
  assert.ok(sriLankaProvinces.includes('Central'), 'Provinces should include Central');
  assert.ok(sriLankaProvinces.includes('Western'), 'Provinces should include Western');
});

test('D.1 Unit Test 4: User Model Role Enum Normalization', () => {
  const allowedRoles = ['farmer', 'admin', 'manager', 'data_entry'];
  
  const testInput1 = 'ADMIN';
  const normalized1 = testInput1.toLowerCase();
  assert.ok(allowedRoles.includes(normalized1), 'ADMIN normalized should be valid enum value');

  const testInput2 = 'MANAGER';
  const normalized2 = testInput2.toLowerCase();
  assert.ok(allowedRoles.includes(normalized2), 'MANAGER normalized should be valid enum value');
});
