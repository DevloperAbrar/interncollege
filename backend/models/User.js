const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'], trim: true },
  email: {
    type: String, required: [true, 'Email is required'], unique: true,
    lowercase: true, trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: { type: String, minlength: [6, 'Password must be at least 6 characters long'] },
  role: {
    type: String,
    enum: ['admin', 'dept_admin', 'mentor', 'student'],
    required: [true, 'Role is required']
  },
  isActive: { type: Boolean, default: true },
  auth0Sub: { type: String, sparse: true, unique: true },
  profilePhoto: { type: String, default: '' },
  assignedSemester: {
    type: String,
    enum: ['any_internship', '6th_internship', '7th_internship', '8th_internship', '8th_project', null],
    default: null
  },
  // ─── dept_admin specific ────────────────────────────────────────────────
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  program: { type: String, default: '' }, // which program within the dept

  // ─── mentor specific ────────────────────────────────────────────────────
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null },
  maxStudents: { type: Number, default: 20 },
  currentStudentCount: { type: Number, default: 0 },
  branchCode: { type: String, default: '' }, // parsed from email e.g. "io" from 23io10...@mitsgwl.ac.in

  // Mentor's externally-connected Drive folder (pasted link, for viewing/organizing)
  driveFolderId: { type: String, default: null },
  driveFolderStatus: {
    type: String,
    enum: ['not_connected', 'connected', 'access_revoked'],
    default: 'not_connected'
  },
  driveFolderLink: { type: String, default: '' }, // raw link mentor pasted, for display

  // Mentor's auto-created internal upload folder (inside GOOGLE_DRIVE_FOLDER_ID)
  // Cached here so we don't call findFolderByName/createFolder on every save.
  internalUploadFolderId: { type: String, default: null },

  // ─── student specific ───────────────────────────────────────────────────
  enrollmentNo: { type: String, unique: true, sparse: true },
  assignedMentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  semester: { type: Number, min: 1, max: 12, default: null },

  // Student's own subfolder inside the mentor's internal upload folder.
  // Cached so uploadStudentDocuments doesn't re-search for it every edit.
  driveStudentFolderId: { type: String, default: null },

}, { timestamps: true });

// Hash password before saving (only if set)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) { next(error); }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

userSchema.statics.findStudentsByMentor = function (mentorId) {
  return this.find({ assignedMentor: mentorId, role: 'student' });
};

module.exports = mongoose.model('User', userSchema);