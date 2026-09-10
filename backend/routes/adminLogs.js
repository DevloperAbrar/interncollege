const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { adminOnly } = require('../middleware/roleCheck');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/responseHelper');

router.use(auth);
router.use(adminOnly);

// GET /api/admin/logs
// Returns all users (students, mentors, dept_admins) with last activity time
router.get('/', async (req, res) => {
  try {
    const { search = '', role = '' } = req.query;

    const query = {
      role: { $in: ['student', 'mentor', 'dept_admin'] }
    };

    if (role && ['student', 'mentor', 'dept_admin'].includes(role)) {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { enrollmentNo: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .populate('branch', 'name')
      .populate('department', 'name')
      .populate('assignedMentor', 'name')
      .select('-password')
      .sort({ updatedAt: -1 });

    const logs = users.map(u => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      enrollmentNo: u.enrollmentNo || null,
      branch: u.branch?.name || (typeof u.branch === 'string' ? u.branch : null),
      department: u.department?.name || null,
      assignedMentor: u.assignedMentor?.name || null,
      profilePhoto: u.profilePhoto || null,
      createdAt: u.createdAt,
      lastActivity: u.updatedAt,   // updatedAt = proxy for last login/activity
    }));

    successResponse(res, logs, 'Logs retrieved successfully');
  } catch (error) {
    console.error('Logs route error:', error);
    errorResponse(res, 'Failed to get logs', 500);
  }
});

module.exports = router;