// routes/student.js - ADD THIS NEW ROUTE
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { studentOnly } = require('../middleware/roleCheck');
const { upload, handleUploadError } = require('../middleware/upload');
const { 
  validateRegistrationSubmission,
  validateMPRSubmission,
  validateFinalReportSubmission,
  checkValidationResult 
} = require('../utils/validateInput');
const {
  getDashboard,
  submitRegistration,
  submitMPR,
  submitFinalReport,
  getProgress,
  updateSubmission,
  getSubmissionHistory // NEW import
} = require('../controllers/studentController');

// Apply auth and student role check to all routes
router.use(auth);
router.use(studentOnly);

// Dashboard
router.get('/dashboard', getDashboard);

// Progress tracking
router.get('/progress', getProgress);

// NEW ROUTE: Get submission history
router.get('/history', getSubmissionHistory);

// Registration submission (handles all semester types)
router.post('/submit/registration',
  upload.fields([
    { name: 'stipendProof', maxCount: 1 },
    { name: 'offerLetter', maxCount: 1 },
    { name: 'nocLetter', maxCount: 1 },
    { name: 'projectReport', maxCount: 1 }
  ]),
  handleUploadError,
  validateRegistrationSubmission,
  checkValidationResult,
  submitRegistration
);

// MPR submissions (for 7th and 8th sem internships only)
router.post('/submit/mpr',
  upload.fields([
    { name: 'document', maxCount: 1 }
  ]),
  handleUploadError,
  validateMPRSubmission,
  checkValidationResult,
  submitMPR
);

// Final report submission
router.post('/submit/final-report',
  upload.fields([
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
  validateFinalReportSubmission,
  checkValidationResult,
  submitFinalReport
);

// Update submission (for rejected ones)
router.put('/submission/:id',
  upload.fields([
    { name: 'stipendProof', maxCount: 1 },
    { name: 'offerLetter', maxCount: 1 },
    { name: 'nocLetter', maxCount: 1 },
    { name: 'projectReport', maxCount: 1 },
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
  updateSubmission
);

module.exports = router;