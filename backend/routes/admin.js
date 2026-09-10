const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { adminOnly } = require('../middleware/roleCheck');
const { upload, handleUploadError } = require('../middleware/upload');
const {
  getDashboardStats,
  createDeptAdmin,
  getAllDeptAdmins,
  deleteDeptAdmin,
  bulkUploadStudents,
  addSingleStudent,
  getBulkUploadHistory,
  getAllStudents,
  getAllSubmissions,
  exportAllStudentData,
  exportSubmissions,
  exportPlacementStats,
  updateStudent,
  deleteStudent,
  deleteAllStudents,
  deleteSelectedStudents,
  deleteStudentsByType
} = require('../controllers/adminController');

const {
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getAllDepartments
} = require('../controllers/departmentController');

router.use(auth);
router.use(adminOnly);

// Dashboard
router.get('/dashboard', getDashboardStats);

// Department management
router.get('/departments', getAllDepartments);
router.post('/departments', createDepartment);
router.put('/departments/:id', updateDepartment);
router.delete('/departments/:id', deleteDepartment);

// Dept admin management (replaces mentor management)
router.get('/dept-admins', getAllDeptAdmins);
router.post('/dept-admins', createDeptAdmin);
router.delete('/dept-admins/:id', deleteDeptAdmin);

// Student management
router.get('/students', getAllStudents);
router.put('/students/:id', updateStudent);
router.delete('/students/bulk/all', deleteAllStudents);
router.delete('/students/bulk/selected', deleteSelectedStudents);
router.delete('/students/bulk/type/:type', deleteStudentsByType);
router.delete('/students/:id', deleteStudent);

// Bulk upload
router.post('/bulk-upload', upload.single('csvFile'), handleUploadError, bulkUploadStudents);
router.post('/students/add-single', addSingleStudent); 
router.get('/bulk-upload/history', getBulkUploadHistory);

// CSV template — only enrollmentNo + email now
router.get('/download-template', async (req, res) => {
  try {
    const headers = ['enrollmentNo', 'email'];
    const samples = [
      'EN2024001,john@mitsgwl.ac.in',
      'EN2024002,jane@mitsgwl.ac.in',
      'EN2024003,raj23cs001@mitsgwl.ac.in'
    ];
    const csvContent = [headers.join(','), ...samples].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="students_template.csv"');
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate template' });
  }
});

// Submissions
router.get('/submissions', getAllSubmissions);

// Exports
router.get('/export/students', exportAllStudentData);
router.get('/export/submissions', exportSubmissions);
router.get('/export/placements', exportPlacementStats);

router.post('/patch-student-branches', async (req, res) => {
  const User = require('../models/User');
  const students = await User.find({
    role: 'student',
    $or: [{ branch: null }, { branch: { $exists: false } }]
  }).populate({
    path: 'assignedMentor',
    populate: { path: 'branch', select: 'name _id' }
  });

  let patched = 0;
  for (const student of students) {
    const mentorBranch = student.assignedMentor?.branch;
    if (mentorBranch?._id) {
      student.branch = mentorBranch._id;  // ← save ObjectId, not name string
      if (!student.enrollmentNo) {
        student.enrollmentNo = student.email.split('@')[0].toUpperCase();
      }
      await student.save();
      patched++;
      console.log(`Patched: ${student.email} → branch: ${mentorBranch.name}`);
    }
  }
  res.json({ success: true, patched });
});

module.exports = router;