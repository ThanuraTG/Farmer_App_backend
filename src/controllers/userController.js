const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/responseHandler');

/**
 * @desc    Get all users with filters and pagination
 * @route   GET /api/users
 * @access  Private (Admin/Manager)
 */
const getUsers = async (req, res, next) => {
  try {
    const { search, district, status, role, page = 1, limit = 20 } = req.query;

    const query = {};
    if (role) {
      query.role = role;
    }
    if (district) query.district = district;
    if (status) query.accountStatus = status;

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { phone_number: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const totalItems = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-passwordHash -password_hash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return successResponse(res, 200, 'Users list retrieved successfully', {
      items: users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalItems,
        totalPages: Math.ceil(totalItems / Number(limit))
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create a new user
 * @route   POST /api/users
 * @access  Private (Admin/Manager)
 */
const createUser = async (req, res, next) => {
  try {
    const {
      fullName,
      mobile,
      email,
      password,
      confirmPassword,
      province,
      district,
      division,
      preferredLanguage,
      role
    } = req.body;

    if (!fullName || !mobile || !password) {
      return errorResponse(res, 400, 'Full Name, Mobile Number, and Password are required fields');
    }

    if (password.length < 6) {
      return errorResponse(res, 400, 'Password must be at least 6 characters long');
    }

    if (confirmPassword && password !== confirmPassword) {
      return errorResponse(res, 400, 'Password and Confirm Password do not match');
    }

    const validRoles = ['farmer', 'admin', 'data_entry', 'manager'];
    const userRole = role && validRoles.includes(role) ? role : 'farmer';

    const trimmedMobile = mobile.trim();
    const trimmedName = fullName.trim();
    const trimmedEmail = email && email.trim() ? email.trim().toLowerCase() : null;

    // Check if mobile or username or email already exists
    const existingCheck = [
      { mobile: trimmedMobile },
      { phone_number: trimmedMobile },
      { username: trimmedName }
    ];
    if (trimmedEmail) {
      existingCheck.push({ email: trimmedEmail });
    }

    const existingUser = await User.findOne({ $or: existingCheck });
    if (existingUser) {
      return errorResponse(res, 400, 'A user with this mobile number, username, or email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      username: trimmedName,
      fullName: trimmedName,
      mobile: trimmedMobile,
      phone_number: trimmedMobile,
      email: trimmedEmail,
      password_hash: passwordHash,
      role: userRole,
      province: province || '',
      district: district || '',
      division: division || '',
      preferredLanguage: preferredLanguage || 'en',
      accountStatus: 'active'
    });

    const userJSON = user.toJSON();
    delete userJSON.password_hash;

    return successResponse(res, 201, 'User created successfully', userJSON);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get a specific user by ID
 * @route   GET /api/users/:id
 * @access  Private (Admin/Manager/User viewing own profile)
 */
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined' || !mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 400, 'Invalid or missing user ID');
    }

    const user = await User.findById(id).select('-passwordHash -password_hash');

    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    return successResponse(res, 200, 'User details retrieved successfully', user);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update user information
 * @route   PUT /api/users/:id
 * @access  Private (Admin/Manager/User updating own profile)
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined' || !mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 400, 'Invalid or missing user ID');
    }

    const {
      fullName,
      mobile,
      email,
      password,
      province,
      district,
      division,
      preferredLanguage,
      role,
      accountStatus
    } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    if (fullName) {
      user.fullName = fullName.trim();
      user.username = fullName.trim();
    }

    if (mobile) {
      const trimmedMobile = mobile.trim();
      const existingMobile = await User.findOne({
        _id: { $ne: id },
        $or: [{ mobile: trimmedMobile }, { phone_number: trimmedMobile }]
      });
      if (existingMobile) {
        return errorResponse(res, 400, 'Another user with this mobile number already exists');
      }
      user.mobile = trimmedMobile;
      user.phone_number = trimmedMobile;
    }

    if (email !== undefined) {
      const trimmedEmail = email && email.trim() ? email.trim().toLowerCase() : null;
      if (trimmedEmail) {
        const existingEmail = await User.findOne({
          _id: { $ne: id },
          email: trimmedEmail
        });
        if (existingEmail) {
          return errorResponse(res, 400, 'Another user with this email address already exists');
        }
      }
      user.email = trimmedEmail;
    }

    if (password && password.trim()) {
      if (password.length < 6) {
        return errorResponse(res, 400, 'Password must be at least 6 characters long');
      }
      const salt = await bcrypt.genSalt(10);
      user.password_hash = await bcrypt.hash(password, salt);
    }

    const validRoles = ['farmer', 'admin', 'data_entry', 'manager'];
    if (role && validRoles.includes(role)) {
      user.role = role;
    }

    if (accountStatus && ['active', 'inactive', 'suspended'].includes(accountStatus)) {
      user.accountStatus = accountStatus;
    }

    if (province !== undefined) user.province = province || '';
    if (district !== undefined) user.district = district || '';
    if (division !== undefined) user.division = division || '';
    if (preferredLanguage !== undefined) user.preferredLanguage = preferredLanguage || 'en';

    await user.save();

    const userJSON = user.toJSON();
    delete userJSON.password_hash;

    return successResponse(res, 200, 'User updated successfully', userJSON);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update user account status (active/inactive/suspended)
 * @route   PUT /api/users/:id/status
 * @access  Private (Admin)
 */
const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined' || !mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 400, 'Invalid or missing user ID');
    }

    const { status } = req.body;
    if (!status || !['active', 'inactive', 'suspended'].includes(status)) {
      return errorResponse(res, 400, 'Invalid or missing status. Use: active, inactive, or suspended');
    }

    const user = await User.findByIdAndUpdate(
      id,
      { accountStatus: status },
      { new: true, runValidators: true }
    ).select('-passwordHash -password_hash');

    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    return successResponse(res, 200, 'User status updated successfully', user);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUsers,
  createUser,
  getUserById,
  updateUser,
  updateUserStatus
};
