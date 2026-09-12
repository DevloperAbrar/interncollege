const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const analyticsRoutes = require('./routes/analytics');
const deptAdminRoutes = require('./routes/deptAdmin');
const departmentRoutes = require('./routes/department');
const path = require('path');
const fs = require('fs');
const studentProgressRoutes = require('./routes/studentProgress');
const adminLogsRoutes = require('./routes/adminLogs')

// Load environment variables
dotenv.config();

// ─── Ensure uploads directory and subfolders exist ───────────────────────────
const uploadsDir = path.join(__dirname, 'uploads');
const subFolders = ['registration', 'mpr', 'final-report', 'bulk', 'general'];
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory');
} else {
  console.log('📁 Uploads directory exists');
}
subFolders.forEach(sub => {
  const subPath = path.join(uploadsDir, sub);
  if (!fs.existsSync(subPath)) fs.mkdirSync(subPath, { recursive: true });
});

// Import routes
const authRoutes = require('./routes/auth');
console.log('✅ Auth routes loaded');
const adminRoutes = require('./routes/admin');
console.log('✅ Admin routes loaded');
const mentorRoutes = require('./routes/mentor');
console.log('✅ Mentor routes loaded');
const studentRoutes = require('./routes/student');
console.log('✅ Student routes loaded');
const uploadRoutes = require('./routes/upload');
console.log('✅ Upload routes loaded');

const app = express();

// Connect to MongoDB
connectDB();

// ══════════════════════════════════════════════════════════════
// ✅ ADD THIS — force Google Drive to initialize and log at boot,
// instead of waiting silently for the first real upload attempt.
// ══════════════════════════════════════════════════════════════
const googleDriveService = require('./services/googleDriveService');

console.log('🚀 Testing Google Drive connection at startup...');
googleDriveService.testConnection()
  .then((result) => {
    console.log('✅✅✅ Google Drive READY:', result.user.emailAddress);
  })
  .catch((err) => {
    console.error('💥💥💥 GOOGLE DRIVE FAILED AT BOOT 💥💥💥');
    console.error('Error message:', err.message);
    console.error('This is why uploads are failing. Fix this before anything else.');
  });
// ══════════════════════════════════════════════════════════════
// END of added block
// ══════════════════════════════════════════════════════════════

// ─── Security ────────────────────────────────────────────────────────────────
// Relax helmet's CSP so that PDF embeds work in the browser
app.use(helmet({
  contentSecurityPolicy: false, // allow PDF inline preview
  crossOriginResourcePolicy: { policy: 'cross-origin' } // allow files to be loaded cross-origin
}));

// ...everything else below is UNCHANGED, don't touch it

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, // increased to 500 to accommodate file requests
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// ─── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'https://www.ipm.mitsgwalior.in',
  'http://localhost:5000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── STATIC FILES: serve the uploads folder ──────────────────────────────────
// Files are accessible at:  http://localhost:5000/uploads/mpr/filename.pdf
// Auth is NOT enforced here so the browser can embed/open PDFs directly.
// If you want auth on file access, use the /api/files/:path route below instead.
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.pdf')) {
      // Allow PDFs to be displayed inline in the browser
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
    }
  }
}));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
console.log('✅ Auth routes registered');

app.use('/api/analytics', analyticsRoutes);
console.log('✅ Analytics routes registered');

app.use('/api/admin', adminRoutes);
console.log('✅ Admin routes registered');

app.use('/api/mentor', mentorRoutes);
console.log('✅ Mentor routes registered');

app.use('/api/student', studentRoutes);
console.log('✅ Student routes registered');

app.use('/api/upload', uploadRoutes);
console.log('✅ Upload routes registered');


app.use('/api/dept-admin', deptAdminRoutes);
app.use('/api/departments', departmentRoutes);
// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'InternTrack Backend Server is running',
    timestamp: new Date().toISOString()
  });
});

// ─── Error handling ───────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => e.message)
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

app.use('/api/student-progress', studentProgressRoutes);
app.use('/api/admin/logs', adminLogsRoutes)
// 404
app.use('/*path', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 InternTrack Backend Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`📂 Files served at: http://localhost:${PORT}/uploads/`);
});