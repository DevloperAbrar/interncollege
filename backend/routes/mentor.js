const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { mentorOnly } = require('../middleware/roleCheck');
const { body } = require('express-validator');
const { checkValidationResult } = require('../utils/validateInput');
const { addStudents, getAvailableStudents, setDriveFolder, getDriveFolderStatus } = require('../controllers/mentorController');
const { upload, handleUploadError } = require('../middleware/upload');

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
  reviewMPR,
  updateSubmissionDetails   // ADD THIS
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

// Update submission (mentor editing student's submission during review)
router.put('/submissions/:id',
  upload.fields([
    { name: 'stipendProof', maxCount: 1 },
    { name: 'offerLetter', maxCount: 1 },
    { name: 'nocLetter', maxCount: 1 },
    { name: 'projectReport', maxCount: 1 },
    { name: 'document', maxCount: 1 },
    { name: 'finalPPT', maxCount: 1 },
    { name: 'finalReport', maxCount: 1 },
    { name: 'certificate', maxCount: 1 },
    { name: 'finalMPR', maxCount: 1 },
    { name: 'ppoOfferLetter', maxCount: 1 },
    { name: 'ppoOfferLetterProject', maxCount: 1 },
    { name: 'conferencePaymentProof', maxCount: 1 },
    { name: 'conferenceCertificate', maxCount: 1 },
    { name: 'finalProjectReport', maxCount: 1 },
    { name: 'publishedPaperCopy', maxCount: 1 }
  ]),
  handleUploadError,
  updateSubmissionDetails
);

module.exports = router;