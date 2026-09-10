// routes/analytics.js
const express = require('express');
const router = express.Router();
const { getAnalytics } = require('../controllers/analyticsController');

// Public route - or add auth middleware if you want to protect it
// If you want to protect: const { protect } = require('../middleware/auth');
// router.get('/', protect, getAnalytics);

router.get('/', getAnalytics);

module.exports = router;