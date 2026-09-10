const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { body } = require('express-validator');

const {
   validateLogin,
   checkValidationResult
} = require('../utils/validateInput');

const {
  login,
  getProfile,
  verifyToken,
  logout,
  changePassword
} = require('../controllers/authController');

const googleLogin = require('./googleAuth'); // Add this

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', validateLogin, checkValidationResult, login);

// @desc    Google login for students
// @route   POST /api/auth/google-login
// @access  Public
router.post('/google-login', googleLogin); // Add this

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
router.get('/profile', auth, getProfile);

// @desc    Verify token
// @route   GET /api/auth/verify
// @access  Private
router.get('/verify', auth, verifyToken);

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', auth, logout);

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
router.put('/change-password', auth, [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
  checkValidationResult
], changePassword);

module.exports = router;