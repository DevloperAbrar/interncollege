const User = require('../models/User');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');
const { successResponse, errorResponse } = require('../utils/responseHelper');

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔐 Login attempt for email:', email);

    if (!email || !password) {
      return errorResponse(res, 'Email and password are required', 400);
    }

    // Special handling for admin user
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (email.toLowerCase() === adminEmail?.toLowerCase()) {
      console.log('👑 Admin login attempt detected');
      
      if (!adminEmail || !adminPassword) {
        console.log('❌ Admin credentials not configured in environment');
        return errorResponse(res, 'Admin credentials not configured', 500);
      }
      
      if (password === adminPassword) {
        console.log('✅ Admin password validated');
        
        // Generate token with special admin ID
        const token = generateToken('admin_id');
        console.log('🔑 Token generated for admin');
        
        // Create admin user response
        const adminUser = {
          _id: 'admin_id',
          name: 'System Administrator',
          email: adminEmail,
          role: 'admin',
          isActive: true
        };
        
        console.log('✅ Admin login successful');
        
        return successResponse(res, {
          user: adminUser,
          token,
          tokenExpiry: '7d'
        }, 'Admin login successful');
      } else {
        console.log('❌ Invalid admin password');
        return errorResponse(res, 'Invalid email or password', 401);
      }
    }

    // Find regular user by email
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      console.log('❌ User not found with email:', email);
      return errorResponse(res, 'Invalid email or password', 401);
    }

    console.log('👤 User found:', user.email, 'Role:', user.role);

    // Check if account is active
    if (!user.isActive) {
      console.log('❌ Account deactivated for:', email);
      return errorResponse(res, 'Account is deactivated. Please contact administrator.', 401);
    }

    // Validate password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      console.log('❌ Invalid password for:', email);
      return errorResponse(res, 'Invalid email or password', 401);
    }

    console.log('✅ Password validated for:', email);

    // Generate token using actual user ID
    const token = generateToken(user._id);
    console.log('🔑 Token generated for user ID:', user._id);

    // Prepare user response (without password)
    let userResponse = user.toJSON();

    // Populate mentor info for students
    if (user.role === 'student' && user.assignedMentor) {
      const populatedUser = await User.findById(user._id)
        .populate('assignedMentor', 'name email')
        .select('-password');
      userResponse = populatedUser.toJSON();
    }

    console.log('✅ Login successful for:', email, 'Role:', user.role);

    successResponse(res, {
      user: userResponse,
      token,
      tokenExpiry: '7d'
    }, 'Login successful');

  } catch (error) {
    console.error('❌ Login error:', error);
    errorResponse(res, 'Login failed', 500);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    console.log('👤 Getting profile for user ID:', req.user?._id);
    
    if (!req.user) {
      return errorResponse(res, 'User not authenticated', 401);
    }

    // Special handling for admin user
    if (req.user._id === 'admin_id') {
      console.log('✅ Admin profile retrieved');
      return successResponse(res, { user: req.user }, 'Admin profile retrieved successfully');
    }

    let user;
    
    // Get user from database with populated fields if needed
    if (req.user.role === 'student' && req.user.assignedMentor) {
      user = await User.findById(req.user._id)
        .populate('assignedMentor', 'name email')
        .select('-password');
    } else {
      user = await User.findById(req.user._id).select('-password');
    }

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    console.log('✅ Profile retrieved for:', user.email);
    successResponse(res, { user: user.toJSON() }, 'Profile retrieved successfully');
    
  } catch (error) {
    console.error('❌ Get profile error:', error);
    errorResponse(res, 'Failed to get profile', 500);
  }
};

// @desc    Verify token
// @route   GET /api/auth/verify
// @access  Private
const verifyToken = async (req, res) => {
  try {
    console.log('🔍 Verifying token for user ID:', req.user?._id);
    
    if (!req.user) {
      return errorResponse(res, 'Invalid token', 401);
    }

    // Special handling for admin user
    if (req.user._id === 'admin_id') {
      console.log('✅ Admin token verified');
      return successResponse(res, { 
        user: req.user,
        isValid: true 
      }, 'Admin token is valid');
    }

    // Get fresh user data from database
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      console.log('❌ User not found in database:', req.user._id);
      return errorResponse(res, 'User not found', 404);
    }

    if (!user.isActive) {
      console.log('❌ User account deactivated:', req.user._id);
      return errorResponse(res, 'Account is deactivated', 401);
    }

    console.log('✅ Token verified for:', user.email, 'Role:', user.role);

    successResponse(res, { 
      user: user.toJSON(),
      isValid: true 
    }, 'Token is valid');
    
  } catch (error) {
    console.error('❌ Token verification error:', error);
    errorResponse(res, 'Token verification failed', 500);
  }
};

// @desc    Logout user (client-side token removal)
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    console.log('👋 Logout for user:', req.user?._id);
    // Since we're using JWT tokens, logout is handled on client-side
    // This endpoint is just for consistency and potential future server-side logout logic
    successResponse(res, null, 'Logout successful');
  } catch (error) {
    console.error('Logout error:', error);
    errorResponse(res, 'Logout failed', 500);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!req.user) {
      return errorResponse(res, 'User not authenticated', 401);
    }

    if (!currentPassword || !newPassword) {
      return errorResponse(res, 'Current password and new password are required', 400);
    }

    // Admin users cannot change password through this endpoint
    if (req.user._id === 'admin_id') {
      return errorResponse(res, 'Admin password cannot be changed through this endpoint', 400);
    }

    // Find user with password field
    const user = await User.findById(req.user._id).select('+password');
    
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }
    
    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    
    if (!isCurrentPasswordValid) {
      return errorResponse(res, 'Current password is incorrect', 400);
    }

    // Update password
    user.password = newPassword;
    await user.save();

    console.log('✅ Password changed for user:', user.email);
    successResponse(res, null, 'Password changed successfully');
    
  } catch (error) {
    console.error('Change password error:', error);
    errorResponse(res, 'Failed to change password', 500);
  }
}; 

module.exports = {
  login,
  getProfile,
  verifyToken,
  logout,
  changePassword
};