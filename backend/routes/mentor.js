const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { mentorOnly } = require('../middleware/roleCheck');
const { body } = require('express-validator');
const { checkValidationResult } = require('../utils/validateInput');
const { addStudents, getAvailableStudents, setDriveFolder, getDriveFolderStatus } = require('../controllers/mentorController');


const {
  getDashboard,
  getAssignedStudents,
  getPendingSubmissions,
  reviewSubmission,
  getSubmissionDetails,
  getMonthlySubmissions,
  exportAssignedStudents,
  getSubmissionHistory,
  sendMonthlyReminder,
  reviewMPR  // NEW: Add this import
} = require('../controllers/mentorController');

// Apply auth and mentor role check to all routes
router.use(auth);
router.use(mentorOnly);

// Dashboard
router.get('/dashboard', getDashboard);

// Student management
router.get('/students', getAssignedStudents);

// Submission review
router.get('/submissions/pending', getPendingSubmissions);
router.get('/submissions/history', getSubmissionHistory);
router.get('/submissions/:id', getSubmissionDetails);
router.get('/available-students', getAvailableStudents);
router.post('/add-students', addStudents);
router.post('/drive-folder', setDriveFolder);
router.get('/drive-folder', getDriveFolderStatus);

// Regular submission review
router.put('/submissions/:id/review', [
  body('action')
    .isIn(['approve', 'reject'])
    .withMessage('Action must be approve or reject'),
  body('feedback')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Feedback must not exceed 1000 characters'),
  checkValidationResult
], reviewSubmission);

// NEW: MPR-specific review route
router.put('/mpr/:mprId/review', [
  body('action')
    .isIn(['approve', 'reject'])
    .withMessage('Action must be approve or reject'),
  body('feedback')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Feedback must not exceed 1000 characters'),
  checkValidationResult
], reviewMPR);

// Alternative route pattern for compatibility (if needed)
router.post('/review-submission', [
  body('submissionId')
    .notEmpty()
    .withMessage('Submission ID is required'),
  body('action')
    .isIn(['approve', 'reject'])
    .withMessage('Action must be approve or reject'),
  body('feedback')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Feedback must not exceed 1000 characters'),
  checkValidationResult
], reviewSubmission);

// Monthly submissions monitoring
router.get('/monthly-submissions', getMonthlySubmissions);

// Reminder system
router.post('/send-monthly-reminder', [
  body('studentIds')
    .isArray()
    .withMessage('Student IDs must be an array'),
  checkValidationResult
], sendMonthlyReminder);

// Export functionality
router.get('/export/students', exportAssignedStudents);

module.exports = router;