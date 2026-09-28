const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables FIRST (before anything reads process.env)
dotenv.config();

const connectDB = require('./config/database');
const analyticsRoutes = require('./routes/analytics');
const deptAdminRoutes = require('./routes/deptAdmin');
const departmentRoutes = require('./routes/department');
const studentProgressRoutes = require('./routes/studentProgress');
const adminLogsRoutes = require('./routes/adminLogs');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const mentorRoutes = require('./routes/mentor');
const studentRoutes = require('./routes/student');
const uploadRoutes = require('./routes/upload');
const googleDriveService = require('./services/googleDriveService');

// ─── Ensure uploads directory and subfolders exist ───────────────────────────
// NOTE: On Render the disk is ephemeral – files here are lost on every
// deploy/restart. Keep using Google Drive for anything that must persist.
const uploadsDir = path.join(__dirname, 'uploads');
const subFolders = ['registration', 'mpr', 'final-report', 'bulk', 'general'];
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory');
}
subFolders.forEach((sub) => {
  const subPath = path.join(uploadsDir, sub);
  if (!fs.existsSync(subPath)) fs.mkdirSync(subPath, { recursive: true });
});

const app = express();

// ─── Render / reverse proxy ──────────────────────────────────────────────────
// Render sits behind a proxy. Without this, express-rate-limit sees every user
// as the same IP and req.ip is wrong.
app.set('trust proxy', 1);

// ─── Database ────────────────────────────────────────────────────────────────
connectDB();

// ─── Google Drive check at boot ──────────────────────────────────────────────
console.log('🚀 Testing Google Drive connection at startup...');
googleDriveService
  .testConnection()
  .then((result) => {
    console.log('✅ Google Drive READY:', result.user.emailAddress);
  })
  .catch((err) => {
    console.error('💥 GOOGLE DRIVE FAILED AT BOOT:', err.message);
    console.error('Uploads will fail until this is fixed.');
  });

// ─── CORS (must be FIRST so every response – even errors/429 – has headers) ──
const normalizeOrigin = (o) => String(o).trim().replace(/\/+$/, '');

const allowedOrigins = new Set(
  [
    'http://localhost:5173',
    'http://localhost:5000',
    'https://www.ipm.mitsgwalior.in',
    'https://interncollegewebsite.onrender.com',
    // FRONTEND_URL / CORS_ORIGINS may hold one URL or several comma-separated URLs
    ...(process.env.FRONTEND_URL || '').split(','),
    ...(process.env.CORS_ORIGINS || '').split(',')
  ]
    .map(normalizeOrigin)
    .filter(Boolean)
);

console.log('🌐 Allowed CORS origins:', [...allowedOrigins]);

const corsOptions = {
  origin: (origin, callback) => {
    // Requests with no Origin header (curl, health checks, server-to-server)
    if (!origin) return callback(null, true);

    if (allowedOrigins.has(normalizeOrigin(origin))) {
      return callback(null, true);
    }

    console.warn(`🚫 CORS blocked origin: ${origin}`);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400
};

// app.use(cors()) also answers OPTIONS preflight requests automatically.
app.use(cors(corsOptions));

// ─── Security ────────────────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: false, // allow PDF inline preview
    crossOriginResourcePolicy: { policy: 'cross-origin' } // allow files to load cross-origin
  })
);

// ─── Rate limiting ───────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP, please try again later.' }
});
app.use(limiter);

// ─── Body parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Static files: uploads folder ────────────────────────────────────────────
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.pdf')) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline');
      }
    }
  })
);

// ─── Health checks ───────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'InternTrack Backend is running' });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'InternTrack Backend Server is running',
    timestamp: new Date().toISOString()
  });
});

// ─── API routes ──────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/logs', adminLogsRoutes);
app.use('/api/mentor', mentorRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/student-progress', studentProgressRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/dept-admin', deptAdminRoutes);
app.use('/api/departments', departmentRoutes);
console.log('✅ All routes registered');

// ─── 404 (after all routes) ──────────────────────────────────────────────────
app.use('/*path', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Error handling (must be LAST) ───────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: Object.values(err.errors).map((e) => e.message)
    });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid ID format' });
  }
  if (err.code === 11000) {
    return res.status(400).json({ success: false, message: 'Duplicate entry found' });
  }
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 InternTrack Backend Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});