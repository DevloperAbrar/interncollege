const express = require('express');
const router = express.Router();
const { getAllDepartments } = require('../controllers/departmentController');

// Public — used by login page dropdowns and dept admin creation
router.get('/', getAllDepartments);

module.exports = router;