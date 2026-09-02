const authService = require('../services/auth/authService');
const { successResponse, errorResponse } = require('../utils/responseHandler');

const register = async (req, res, next) => {
  try {
    const { fullName, mobile, password, preferredLanguage, province, district, division, divisionId } = req.body;

    if (!fullName || !mobile || !password) {
      return errorResponse(res, 400, 'fullName, mobile, and password are required fields');
    }

    if (password.length < 6) {
      return errorResponse(res, 400, 'Password must be at least 6 characters long');
    }

    const result = await authService.registerFarmer({
      fullName,
      mobile,
      password,
      preferredLanguage,
      province,
      district,
      division,
      divisionId
    });

    return successResponse(res, 201, 'Farmer registered successfully', {
      user: result.user,
      token: result.token,
      user_id: result.user._id || result.user.id,
      username: result.user.fullName,
      role: result.user.role
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { mobile, email, username, password } = req.body;
    const identifier = mobile || email || username;

    if (!identifier || !password) {
      return errorResponse(res, 400, 'Username or mobile number and password are required fields');
    }

    const result = await authService.loginUser(identifier, password);

    // Format response so both standard format and legacy clients work seamlessly
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result,
      token: result.token,
      user: result.user,
      user_id: result.user._id || result.user.id,
      username: result.user.fullName,
      email: result.user.mobile,
      role: result.user.role
    });
  } catch (error) {
    next(error);
  }
};

const adminLogin = async (req, res, next) => {
  try {
    const { email, mobile, username, password } = req.body;
    const identifier = email || mobile || username;

    if (!identifier || !password) {
      return errorResponse(res, 400, 'Email/Mobile and password are required fields');
    }

    const result = await authService.loginUser(identifier, password);

    if (result.user.role === 'farmer') {
      return errorResponse(res, 403, 'Access denied. Farmer accounts can only access the mobile app.');
    }

    return res.status(200).json({
      success: true,
      message: 'Admin login successful',
      data: result,
      token: result.token,
      user: result.user,
      role: result.user.role
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const userProfile = await authService.getUserProfile(req.user._id);
    return successResponse(res, 200, 'User profile retrieved', userProfile);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  adminLogin,
  getMe
};
