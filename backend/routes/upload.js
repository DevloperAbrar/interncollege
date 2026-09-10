const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { adminOnly, allRoles } = require('../middleware/roleCheck');
const { upload, handleUploadError } = require('../middleware/upload');
const {
  uploadSingleFile,
  uploadMultipleFiles,
  testDriveConnection,
  getFileInfo,
  deleteFile,
  createStudentFolder
} = require('../controllers/uploadController');

// Apply auth to all routes
router.use(auth);

// Single file upload (all authenticated users)
router.post('/single',
  allRoles,
  upload.single('file'),
  handleUploadError,
  uploadSingleFile
);

// Multiple files upload (all authenticated users)
router.post('/multiple',
  allRoles,
  upload.fields([
    { name: 'offerLetter', maxCount: 1 },
    { name: 'noc', maxCount: 1 },
    { name: 'projectPPT', maxCount: 1 },
    { name: 'submissionPPT', maxCount: 1 }
  ]),
  handleUploadError,
  uploadMultipleFiles
);

// File information (all authenticated users)
router.get('/file-info/:fileId', allRoles, getFileInfo);

// Admin only routes
router.get('/test-drive', adminOnly, testDriveConnection);
router.delete('/file/:fileId', adminOnly, deleteFile);
router.post('/create-folder', adminOnly, [
  require('express-validator').body('studentName')
    .notEmpty()
    .withMessage('Student name is required'),
  require('express-validator').body('enrollmentNo')
    .notEmpty()
    .withMessage('Enrollment number is required'),
  require('../utils/validateInput').checkValidationResult
], createStudentFolder);

module.exports = router;