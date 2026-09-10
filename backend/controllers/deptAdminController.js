const User = require('../models/User');
const Branch = require('../models/Branch');
const Department = require('../models/Department');
const { successResponse, errorResponse } = require('../utils/responseHelper');

// ─── BRANCH MANAGEMENT ───────────────────────────────────────────────────────

// GET /api/dept-admin/branches
const getBranches = async (req, res) => {
  try {
    const branches = await Branch.find({
      department: req.user.department,
      isActive: true
    }).sort({ name: 1 });
    successResponse(res, branches, 'Branches retrieved');
  } catch (error) {
    errorResponse(res, 'Failed to get branches', 500);
  }
};

// POST /api/dept-admin/branches
const createBranch = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return errorResponse(res, 'Branch name is required', 400);

    const existing = await Branch.findOne({
      name: name.trim(),
      department: req.user.department
    });
    if (existing) return errorResponse(res, 'Branch with this name already exists in your department', 400);

    const branch = await Branch.create({
      name: name.trim(),
      department: req.user.department,
      createdBy: req.user._id
    });
    successResponse(res, branch, 'Branch created successfully');
  } catch (error) {
    console.error('Create branch error:', error);
    errorResponse(res, 'Failed to create branch', 500);
  }
};

// DELETE /api/dept-admin/branches/:id
const deleteBranch = async (req, res) => {
  try {
    const branch = await Branch.findOneAndDelete({
      _id: req.params.id,
      department: req.user.department
    });
    if (!branch) return errorResponse(res, 'Branch not found', 404);
    successResponse(res, null, 'Branch deleted successfully');
  } catch (error) {
    errorResponse(res, 'Failed to delete branch', 500);
  }
};

// PUT /api/dept-admin/branches/:id
const updateBranch = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return errorResponse(res, 'Branch name is required', 400);

    const trimmedName = name.trim();

    // Prevent duplicate names in the same department (excluding this branch itself)
    const existing = await Branch.findOne({
      name: trimmedName,
      department: req.user.department,
      _id: { $ne: req.params.id }
    });
    if (existing) return errorResponse(res, 'Branch with this name already exists in your department', 400);

    const branch = await Branch.findOneAndUpdate(
      { _id: req.params.id, department: req.user.department },
      { name: trimmedName },
      { new: true, runValidators: true }
    );

    if (!branch) return errorResponse(res, 'Branch not found', 404);

    successResponse(res, branch, 'Branch updated successfully');
  } catch (error) {
    console.error('Update branch error:', error);
    errorResponse(res, 'Failed to update branch', 500);
  }
};

// ─── MENTOR MANAGEMENT ───────────────────────────────────────────────────────

// GET /api/dept-admin/mentors
const getMentors = async (req, res) => {
  try {
    const mentors = await User.find({
      role: 'mentor',
      department: req.user.department
    })
      .populate('branch', 'name')
      .select('-password')
      .sort({ createdAt: -1 });
    successResponse(res, mentors, 'Mentors retrieved');
  } catch (error) {
    errorResponse(res, 'Failed to get mentors', 500);
  }
};

// GET /api/dept-admin/mentors/:id/students
const getMentorStudents = async (req, res) => {
  try {
    const mentor = await User.findOne({
      _id: req.params.id,
      role: 'mentor',
      department: req.user.department
    });
    if (!mentor) return errorResponse(res, 'Mentor not found', 404);

    const students = await User.find({
      role: 'student',
      assignedMentor: mentor._id
    })
      .populate('branch', 'name')
      .select('name email enrollmentNo branch')
      .sort({ name: 1 });

    successResponse(res, students, 'Mentor students retrieved');
  } catch (error) {
    console.error('Get mentor students error:', error);
    errorResponse(res, 'Failed to get mentor students', 500);
  }
};
// POST /api/dept-admin/mentors — only email + branch
// POST /api/dept-admin/mentors — email + branch + max students
const createMentor = async (req, res) => {
  try {
    const { email, branchId, maxStudents } = req.body;
    if (!email || !branchId) return errorResponse(res, 'Email and branch are required', 400);

    let maxStudentsValue = 20; // sensible default
    if (maxStudents !== undefined && maxStudents !== '') {
      const parsed = Number(maxStudents);
      if (isNaN(parsed) || parsed < 1) return errorResponse(res, 'Max students must be a valid positive number', 400);
      maxStudentsValue = parsed;
    }

    const processedEmail = email.toLowerCase().trim();

    // Validate branch belongs to this dept
    const branch = await Branch.findOne({ _id: branchId, department: req.user.department });
    if (!branch) return errorResponse(res, 'Invalid branch selected', 400);

    // Check if user exists
    const existing = await User.findOne({ email: processedEmail });
    if (existing) {
      if (existing.role !== 'mentor') {
        return errorResponse(res, 'A user with this email already exists with a different role', 400);
      }
      return errorResponse(res, 'A mentor with this email already exists', 400);
    }

    const nameFallback = processedEmail.split('@')[0];

    const mentor = await User.create({
      name: nameFallback,
      email: processedEmail,
      role: 'mentor',
      department: req.user.department,
      branch: branchId,
      maxStudents: maxStudentsValue,
      currentStudentCount: 0,
      isActive: true
    });

    const populatedMentor = await User.findById(mentor._id)
      .populate('branch', 'name')
      .populate('department', 'name')
      .select('-password');

    successResponse(res, populatedMentor, 'Mentor created successfully');
  } catch (error) {
    console.error('Create mentor error:', error);
    if (error.code === 11000) return errorResponse(res, 'A user with this email already exists', 400);
    errorResponse(res, 'Failed to create mentor', 500);
  }
};

// PUT /api/dept-admin/mentors/:id
const updateMentor = async (req, res) => {
  try {
    const { branchId, maxStudents } = req.body;

    const mentor = await User.findOne({ _id: req.params.id, role: 'mentor', department: req.user.department });
    if (!mentor) return errorResponse(res, 'Mentor not found', 404);

    if (branchId) {
      const branch = await Branch.findOne({ _id: branchId, department: req.user.department });
      if (!branch) return errorResponse(res, 'Invalid branch selected', 400);
      mentor.branch = branchId;
    }

    if (maxStudents !== undefined && maxStudents !== '') {
      const max = Number(maxStudents);
      if (isNaN(max) || max < 0) return errorResponse(res, 'Max students must be a valid number', 400);
      if (max < (mentor.currentStudentCount || 0)) {
        return errorResponse(res, `Cannot set max below current student count (${mentor.currentStudentCount})`, 400);
      }
      mentor.maxStudents = max;
    }

    await mentor.save();

    const populatedMentor = await User.findById(mentor._id)
      .populate('branch', 'name')
      .select('-password');

    successResponse(res, populatedMentor, 'Mentor updated successfully');
  } catch (error) {
    console.error('Update mentor error:', error);
    errorResponse(res, 'Failed to update mentor', 500);
  }
};

// DELETE /api/dept-admin/mentors/:id
const deleteMentor = async (req, res) => {
  try {
    const mentor = await User.findOne({ _id: req.params.id, role: 'mentor', department: req.user.department });
    if (!mentor) return errorResponse(res, 'Mentor not found', 404);

    // Unassign students
    await User.updateMany({ assignedMentor: mentor._id }, { $unset: { assignedMentor: 1 } });
    await User.findByIdAndDelete(mentor._id);
    successResponse(res, null, 'Mentor deleted successfully');
  } catch (error) {
    errorResponse(res, 'Failed to delete mentor', 500);
  }
};

// ─── DEPT ADMIN DASHBOARD ────────────────────────────────────────────────────

const getDashboard = async (req, res) => {
  try {
    const deptId = req.user.department;
    const totalBranches = await Branch.countDocuments({ department: deptId });
    const totalMentors = await User.countDocuments({ role: 'mentor', department: deptId });

    // Students whose mentor is in this dept
    const mentorsInDept = await User.find({ role: 'mentor', department: deptId }, '_id');
    const mentorIds = mentorsInDept.map(m => m._id);
    const totalStudents = await User.countDocuments({ role: 'student', assignedMentor: { $in: mentorIds } });

    const dept = await Department.findById(deptId);

    successResponse(res, {
      department: dept,
      stats: { totalBranches, totalMentors, totalStudents }
    }, 'Dashboard retrieved');
  } catch (error) {
    errorResponse(res, 'Failed to get dashboard', 500);
  }
};

module.exports = { getBranches, createBranch, deleteBranch, getMentors, getMentorStudents, createMentor, updateMentor, deleteMentor, getDashboard, updateBranch };