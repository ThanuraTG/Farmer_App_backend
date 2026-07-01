const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please provide all required fields (name, email, password)' });
  }

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Default first user as ADMIN (for ease of testing), subsequent as USER unless specified
    const count = await User.countDocuments({});
    const assignedRole = count === 0 ? 'ADMIN' : (role || 'USER');

    // Create user
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: assignedRole
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'supersecretkeyhere',
      { expiresIn: '30d' }
    );

    return res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  try {
    // Find user
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      // Generate token
      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET || 'supersecretkeyhere',
        { expiresIn: '30d' }
      );

      return res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token
      });
    } else {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  if (req.user) {
    return res.json(req.user);
  } else {
    return res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Get all users
// @route   GET /api/auth/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-passwordHash').sort({ createdAt: -1 });
    return res.json(users);
  } catch (error) {
    console.error('Fetch users error:', error);
    return res.status(500).json({ message: 'Server error during fetching users', error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  getAllUsers
};
