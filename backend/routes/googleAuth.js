const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { successResponse, errorResponse } = require('../utils/responseHelper');

const googleLogin = async (req, res) => {
  try {
    const { email, name, auth0Sub, accessToken, picture } = req.body;
    if (!email || !auth0Sub) return errorResponse(res, 'Invalid Google login data', 400);

    const processedEmail = email.toLowerCase();
    let user = await User.findOne({ email: processedEmail });

    // NEW - only allow pre-registered emails
    if (!user) {
      return errorResponse(
        res,
        'You are not registered for InternTrack. Only MITS-DU students added by the department are allowed. Please contact your mentor or department coordinator.',
        403
      );
    } else {
      // For existing users (mentor, dept_admin, student) — update name/photo from Google
      if (name && (!user.name || user.name === user.email.split('@')[0])) {
        user.name = name;
      }
      if (picture) user.profilePhoto = picture;
      if (!user.auth0Sub) user.auth0Sub = auth0Sub;
      await user.save();
    }

    if (!user.isActive) return errorResponse(res, 'Account is deactivated. Contact administrator.', 401);

    const token = generateToken(user._id);

    let userResponse = user.toJSON();
    if (user.role === 'student') {  // ← remove the assignedMentor condition too
      const populated = await User.findById(user._id)
        .populate('assignedMentor', 'name email branch')
        .populate('branch', 'name')   // ← add this
        .select('-password');
      userResponse = populated.toJSON();
    }
    if (user.role === 'dept_admin') {
      const populated = await User.findById(user._id)
        .populate('department', 'name programs')
        .select('-password');
      userResponse = populated.toJSON();
    }
    if (user.role === 'mentor') {
      const populated = await User.findById(user._id)
        .populate('department', 'name')
        .populate('branch', 'name')
        .select('-password');
      userResponse = populated.toJSON();
    }

    successResponse(res, { user: userResponse, token, tokenExpiry: '7d' }, 'Google login successful');
  } catch (error) {
    console.error('Google login error:', error);
    errorResponse(res, 'Google login failed: ' + error.message, 500);
  }
};

module.exports = googleLogin;