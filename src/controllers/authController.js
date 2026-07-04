const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Division = require('../models/Division');

// Helper to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user.user_id || user._id, role: user.role },
    process.env.JWT_SECRET || 'supersecretkeyhere',
    { expiresIn: '30d' }
  );
};

// @desc    Register a new user (farmer, etc.)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { username, email, password, role, phone_number, division_id } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Please provide all required fields (username, email, password)' });
  }

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Verify division exists if provided
    if (division_id) {
      const division = await Division.findById(division_id);
      if (!division) {
        return res.status(400).json({ message: 'Invalid division_id provided' });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      username,
      email,
      password_hash: passwordHash,
      role: role || 'farmer',
      phone_number,
      division_id: division_id || null
    });

    const populatedUser = await User.findById(user._id).populate('division_id', 'name province');

    // Generate JWT token
    const token = generateToken(user);

    return res.status(201).json({
      user_id: populatedUser.user_id,
      username: populatedUser.username,
      email: populatedUser.email,
      role: populatedUser.role,
      phone_number: populatedUser.phone_number,
      division: populatedUser.division_id,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

// @desc    Authenticate farmer & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  try {
    // Find user
    const user = await User.findOne({ email }).populate('division_id', 'name province');

    if (user && (await bcrypt.compare(password, user.password_hash))) {
      // Generate token
      const token = generateToken(user);

      return res.json({
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
        phone_number: user.phone_number,
        division: user.division_id,
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

// @desc    Authenticate admin & get token (checks roles: admin, manager, data_entry)
// @route   POST /api/auth/admin-login
// @access  Public
const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  try {
    // Find user
    const user = await User.findOne({ email }).populate('division_id', 'name province');

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if role is admin/manager/data_entry
    const allowedRoles = ['admin', 'manager', 'data_entry'];
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ message: 'Access denied. Administrative/staff privileges required' });
    }

    if (await bcrypt.compare(password, user.password_hash)) {
      const token = generateToken(user);

      return res.json({
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
        phone_number: user.phone_number,
        division: user.division_id,
        token
      });
    } else {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ message: 'Server error during admin login', error: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.user_id || req.user.id)
      .select('-password_hash')
      .populate('division_id', 'name province latitude longitude');
    
    if (user) {
      return res.json(user);
    } else {
      return res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all users (for management dashboard)
// @route   GET /api/auth/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select('-password_hash')
      .populate('division_id', 'name province')
      .sort({ createdAt: -1 });
    return res.json(users);
  } catch (error) {
    console.error('Fetch users error:', error);
    return res.status(500).json({ message: 'Server error during fetching users', error: error.message });
  }
};

// @desc    Update a user's details or role
// @route   PUT /api/auth/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const { username, email, role, phone_number, division_id } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (username) user.username = username;
    if (email) user.email = email;
    if (role) user.role = role;
    if (phone_number !== undefined) user.phone_number = phone_number;
    if (division_id !== undefined) user.division_id = division_id || null;

    const updatedUser = await user.save();
    const populated = await User.findById(updatedUser._id).populate('division_id', 'name province');

    return res.json({
      user_id: populated.user_id,
      username: populated.username,
      email: populated.email,
      role: populated.role,
      phone_number: populated.phone_number,
      division: populated.division_id
    });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({ message: 'Server error updating user', error: error.message });
  }
};

// @desc    Delete a user
// @route   DELETE /api/auth/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    await User.deleteOne({ _id: req.params.id });
    return res.json({ message: 'User removed successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ message: 'Server error deleting user', error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  loginAdmin,
  getMe,
  getAllUsers,
  updateUser,
  deleteUser
};
