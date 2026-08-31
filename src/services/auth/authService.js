const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const env = require('../../config/env');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
  });
};

const registerFarmer = async (userData) => {
  const { fullName, mobile, password, preferredLanguage, province, district, division, farmSize } = userData;

  const existingUser = await User.findOne({
    $or: [{ phone_number: mobile.trim() }, { username: fullName.trim() }]
  });

  if (existingUser) {
    const err = new Error('A user with this mobile number or username already exists');
    err.statusCode = 400;
    throw err;
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await User.create({
    username: fullName.trim(),
    email: `${mobile.trim()}@farmer.local`,
    phone_number: mobile.trim(),
    password_hash: passwordHash,
    role: 'farmer'
  });

  const token = generateToken(user._id, user.role);

  return {
    user: user.toJSON(),
    token
  };
};

const loginUser = async (identifier, password) => {
  if (!identifier || !password) {
    const err = new Error('Mobile number/email and password are required');
    err.statusCode = 400;
    throw err;
  }

  const trimmed = identifier.trim();

  const user = await User.findOne({
    $or: [
      { phone_number: trimmed },
      { email: trimmed.toLowerCase() },
      { username: trimmed }
    ]
  });

  if (!user) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }

  const token = generateToken(user._id, user.role);

  return {
    user: user.toJSON(),
    token
  };
};

const getUserProfile = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  return user.toJSON();
};

module.exports = {
  registerFarmer,
  loginUser,
  getUserProfile,
  generateToken
};

