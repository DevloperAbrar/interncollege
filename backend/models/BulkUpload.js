const mongoose = require('mongoose');

const bulkUploadSchema = new mongoose.Schema({
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  totalRecords: {
    type: Number,
    required: true
  },
  successCount: {
    type: Number,
    default: 0
  },
  failureCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'processing'
  },
  errors: [{
    row: Number,
    data: mongoose.Schema.Types.Mixed,
    error: String
  }],
  processedAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('BulkUpload', bulkUploadSchema);