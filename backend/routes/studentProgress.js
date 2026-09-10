const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Submission = require('../models/Submission');
const { successResponse, errorResponse } = require('../utils/responseHelper');

// Parses a branch code like "io" out of a college email such as
// "23io10mo34@mitsgwl.ac.in" -> "io" (mirrors the mentor Add Students logic)
const extractBranchCode = (email) => {
  if (!email) return '';
  const localPart = email.split('@')[0];
  const match = localPart.match(/^\d+([a-zA-Z]+)\d/);
  return match ? match[1].toLowerCase() : '';
};

// GET /api/student-progress
// Returns [{ student, submissions, lastLogin }] filtered by role, branchCode, search
router.get('/', auth, async (req, res) => {
  try {
    const { role } = req.user;
    const { branchCode, search } = req.query;

    let studentQuery = { role: 'student' };

    if (role === 'mentor') {
      // Only this mentor's students
      studentQuery.assignedMentor = req.user._id;

    } else if (role === 'dept_admin') {
      // Students whose mentor belongs to this department
      const mentorsInDept = await User.find(
        { role: 'mentor', department: req.user.department },
        '_id'
      );
      studentQuery.assignedMentor = { $in: mentorsInDept.map(m => m._id) };

    } else if (role !== 'admin') {
      return errorResponse(res, 'Access denied', 403);
    }

    let students = await User.find(studentQuery)
      .populate('assignedMentor', 'name email')
      .populate('branch', 'name')
      .select('-password')
      .sort({ createdAt: -1 });

    // ─── Branch code filter (parsed from email, e.g. "io", "eo") ───────────
    if (branchCode && branchCode.trim()) {
      const code = branchCode.trim().toLowerCase();
      students = students.filter(s => extractBranchCode(s.email) === code);
    }

    // ─── Text search across name / email / enrollment no ──────────────────
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      students = students.filter(s =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.enrollmentNo && s.enrollmentNo.toLowerCase().includes(q))
      );
    }

    const rows = await Promise.all(
      students.map(async (student) => {
        const submissions = await Submission.find({ student: student._id })
          .select('semesterType currentStep status registrationData registrationReview mprSubmissions finalReportReview createdAt completedAt')
          .sort({ createdAt: 1 });

        return {
          student: student.toJSON(),
          submissions,
          lastLogin: student.updatedAt || null,
        };
      })
    );

    successResponse(res, rows, 'Student progress retrieved');
  } catch (error) {
    console.error('student-progress route error:', error);
    errorResponse(res, 'Failed to get student progress', 500);
  }
});

module.exports = router;