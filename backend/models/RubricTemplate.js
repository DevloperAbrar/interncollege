const mongoose = require('mongoose');

const rubricFieldSchema = new mongoose.Schema({
  key: { type: String, required: true },
  label: { type: String, required: true, trim: true, maxlength: 120 },
  max: { type: Number, required: true, min: 0.5, max: 1000 }
}, { _id: false });

const stageSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: true },
  fields: { type: [rubricFieldSchema], default: [] }
}, { _id: false });

const rubricTemplateSchema = new mongoose.Schema({
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
    unique: true
  },
  version: { type: Number, default: 1 },
  stages: {
    registration: stageSchema,
    mpr: stageSchema,
    midSem: stageSchema,
    finalReport: stageSchema
  },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('RubricTemplate', rubricTemplateSchema);