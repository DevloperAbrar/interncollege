const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ─── Create a subfolder path and ensure it exists ────────────────────────────
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  return dirPath;
};

// ─── Disk storage: saves to uploads/<category>/<filename> ───────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine subfolder from route or field name
    let subFolder = 'general';

    const url = req.originalUrl || '';
    if (url.includes('/registration')) subFolder = 'registration';
    else if (url.includes('/mpr')) subFolder = 'mpr';
    else if (url.includes('/final-report')) subFolder = 'final-report';
    else if (url.includes('/bulk-upload') || url.includes('/bulk')) subFolder = 'bulk';

    const uploadPath = ensureDir(path.join(__dirname, '..', 'uploads', subFolder));
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Format: fieldname-timestamp-random.ext
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = file.fieldname.replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${safeName}-${uniqueSuffix}${ext}`);
  }
});

// ─── File filter ─────────────────────────────────────────────────────────────
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed: PDF, PPT, PPTX, XLS, XLSX, CSV'), false);
  }
};

// ─── Multer instance ──────────────────────────────────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
    files: 10
  }
});

// ─── Error handler middleware ─────────────────────────────────────────────────
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const messages = {
      LIMIT_FILE_SIZE: 'File size too large. Maximum is 10MB.',
      LIMIT_FILE_COUNT: 'Too many files. Maximum 10 files allowed.',
      LIMIT_UNEXPECTED_FILE: 'Unexpected file field name.'
    };
    return res.status(400).json({
      success: false,
      message: messages[err.code] || err.message
    });
  }
  if (err && err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next(err);
};

// ─── Helper: build public URL from a saved file path ─────────────────────────
// e.g. uploads/mpr/document-123.pdf  →  /uploads/mpr/document-123.pdf
const getFileUrl = (filePath) => {
  if (!filePath) return null;
  // Normalize backslashes (Windows) and strip leading path up to 'uploads'
  const normalized = filePath.replace(/\\/g, '/');
  const idx = normalized.indexOf('uploads/');
  if (idx !== -1) return '/' + normalized.slice(idx);
  return '/' + normalized;
};

module.exports = { upload, handleUploadError, getFileUrl };