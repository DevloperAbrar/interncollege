const mongoose = require('mongoose');

const programSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  totalSemesters: { type: Number, required: true, min: 1, max: 12 }
}, { _id: true });

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  programs: [programSchema],
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Department', departmentSchema);