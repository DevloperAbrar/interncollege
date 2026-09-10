const path = require('path');
const fs = require('fs');
const { getFileUrl } = require('../middleware/upload');
const { successResponse, errorResponse } = require('../utils/responseHelper');

// ─── Helper: delete a local file safely ──────────────────────────────────────
const deleteLocalFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) console.error('Error deleting file:', err);
    });
  }
};

// @desc    Upload single file to server
// @route   POST /api/upload/single
// @access  Private
const uploadSingleFile = async (req, res) => {
  try {
    if (!req.file) return errorResponse(res, 'No file uploaded', 400);

    const { documentType } = req.body;
    const fileUrl = getFileUrl(req.file.path);

    successResponse(res, {
      fileName: req.file.originalname,
      storedName: req.file.filename,
      fileUrl,          // e.g. /uploads/general/file-123.pdf
      documentType,
      size: req.file.size,
      uploadedAt: new Date()
    }, 'File uploaded successfully');

  } catch (error) {
    console.error('Upload single file error:', error);
    deleteLocalFile(req.file?.path);
    errorResponse(res, 'Failed to upload file', 500);
  }
};

// @desc    Upload multiple files to server
// @route   POST /api/upload/multiple
// @access  Private
const uploadMultipleFiles = async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return errorResponse(res, 'No files uploaded', 400);
    }

    const uploadedFiles = [];
    Object.entries(req.files).forEach(([fieldName, fileArray]) => {
      fileArray.forEach(file => {
        uploadedFiles.push({
          fieldName,
          fileName: file.originalname,
          storedName: file.filename,
          fileUrl: getFileUrl(file.path),
          size: file.size
        });
      });
    });

    successResponse(res, {
      uploadedFiles,
      uploadedAt: new Date()
    }, 'Files uploaded successfully');

  } catch (error) {
    console.error('Upload multiple files error:', error);
    // Clean up any files that were saved
    if (req.files) {
      Object.values(req.files).flat().forEach(f => deleteLocalFile(f.path));
    }
    errorResponse(res, 'Failed to upload files', 500);
  }
};

// @desc    Get file info (checks if file exists on server)
// @route   GET /api/upload/file-info/:fileName
// @access  Private
const getFileInfo = async (req, res) => {
  try {
    const { fileName } = req.params;
    if (!fileName) return errorResponse(res, 'File name is required', 400);

    // Search across all upload subfolders
    const subFolders = ['registration', 'mpr', 'final-report', 'bulk', 'general'];
    let found = null;

    for (const sub of subFolders) {
      const filePath = path.join(__dirname, '..', 'uploads', sub, fileName);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        found = {
          fileName,
          fileUrl: `/uploads/${sub}/${fileName}`,
          size: stats.size,
          createdAt: stats.birthtime
        };
        break;
      }
    }

    if (!found) return errorResponse(res, 'File not found', 404);

    successResponse(res, found, 'File info retrieved');
  } catch (error) {
    console.error('Get file info error:', error);
    errorResponse(res, 'Failed to get file information', 500);
  }
};

// @desc    Delete a file from server
// @route   DELETE /api/upload/file/:subFolder/:fileName
// @access  Private (Admin only)
const deleteFile = async (req, res) => {
  try {
    const { subFolder, fileName } = req.params;
    if (!fileName) return errorResponse(res, 'File name is required', 400);

    const sub = subFolder || 'general';
    const filePath = path.join(__dirname, '..', 'uploads', sub, fileName);

    if (!fs.existsSync(filePath)) return errorResponse(res, 'File not found', 404);

    fs.unlinkSync(filePath);
    successResponse(res, null, 'File deleted successfully');
  } catch (error) {
    console.error('Delete file error:', error);
    errorResponse(res, 'Failed to delete file', 500);
  }
};

// @desc    Test storage (replaces old testDriveConnection)
// @route   GET /api/upload/test-storage
// @access  Private (Admin only)
const testDriveConnection = async (req, res) => {
  try {
    const uploadsPath = path.join(__dirname, '..', 'uploads');
    const subFolders = ['registration', 'mpr', 'final-report', 'bulk', 'general'];

    const folderInfo = subFolders.map(sub => {
      const subPath = path.join(uploadsPath, sub);
      const exists = fs.existsSync(subPath);
      const files = exists ? fs.readdirSync(subPath).length : 0;
      return { folder: sub, exists, fileCount: files };
    });

    successResponse(res, {
      storageType: 'local-filesystem',
      uploadsPath,
      folders: folderInfo,
      testedAt: new Date()
    }, 'Local storage check successful');
  } catch (error) {
    console.error('Test storage error:', error);
    errorResponse(res, 'Storage check failed: ' + error.message, 500);
  }
};

// @desc    Create student folder (no-op for local storage, kept for compatibility)
// @route   POST /api/upload/create-folder
// @access  Private (Admin only)
const createStudentFolder = async (req, res) => {
  try {
    const { studentName, enrollmentNo } = req.body;
    if (!studentName || !enrollmentNo) {
      return errorResponse(res, 'Student name and enrollment number are required', 400);
    }
    // For local storage, files are organized by type not by student
    successResponse(res, {
      message: 'Local storage does not require folder creation',
      storageType: 'local-filesystem'
    }, 'OK');
  } catch (error) {
    errorResponse(res, 'Failed', 500);
  }
};

module.exports = {
  uploadSingleFile,
  uploadMultipleFiles,
  testDriveConnection,
  getFileInfo,
  deleteFile,
  createStudentFolder
};