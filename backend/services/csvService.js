const XLSX = require('xlsx');
const User = require('../models/User');
const BulkUpload = require('../models/BulkUpload');
const emailService = require('./emailService');
const mongoose = require('mongoose');

class CSVService {
  constructor() {
    // Only enrollmentNo and email are required now
    this.requiredColumns = ['enrollmentNo', 'email'];
  }

  parseFile(filePath, fileType) {
    try {
      const workbook = XLSX.readFile(filePath, { type: 'file' });
      const sheetName = workbook.SheetNames[0];
      const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
      console.log('✅ File parsed successfully:', {
        rows: data.length,
        columns: data.length > 0 ? Object.keys(data[0]) : []
      });
      return data;
    } catch (error) {
      console.error('❌ Error parsing file:', error);
      throw new Error('Failed to parse the uploaded file');
    }
  }

  validateData(data) {
    console.log('🔍 Validating data structure...');
    const errors = [];

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('File is empty or invalid');
    }

    const firstRow = data[0];
    const availableColumns = Object.keys(firstRow).map(k => k.trim());
    console.log('📋 Available columns:', availableColumns);
    console.log('📋 Required columns:', this.requiredColumns);

    const missingColumns = this.requiredColumns.filter(col => !availableColumns.includes(col));
    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
    }

    data.forEach((row, index) => {
      const rowErrors = this.validateRow(row, index + 1);
      if (rowErrors.length > 0) {
        errors.push({ row: index + 1, data: row, errors: rowErrors });
      }
    });

    console.log('✅ Data validation completed:', {
      totalRows: data.length,
      validationErrors: errors.length
    });

    return errors;
  }

  validateRow(row, rowNumber) {
    const errors = [];

    // Trim all string fields
    Object.keys(row).forEach(key => {
      if (typeof row[key] === 'string') row[key] = row[key].trim();
    });

    if (!row.enrollmentNo || row.enrollmentNo.toString().trim() === '') {
      errors.push('Enrollment number is required');
    }

    if (!row.email || !this.isValidEmail(row.email.toString().trim())) {
      errors.push('Valid email is required');
    }

    return errors;
  }

  isValidEmail(email) {
    return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
  }

  // Parse branch code from college email
  // e.g. "23io10mo34@mitsgwl.ac.in" → "io"
  parseBranchCodeFromEmail(email) {
    try {
      const prefix = email.split('@')[0]; // "23io10mo34"
      const match = prefix.match(/^\d{2}([a-zA-Z]+)/);
      return match ? match[1].toLowerCase() : '';
    } catch {
      return '';
    }
  }

  async processBulkUpload(filePath, fileName, uploadedBy) {
    console.log('🚀 Starting bulk upload process:', {
      filePath,
      fileName,
      uploadedBy: uploadedBy.toString()
    });

    let adminObjectId;
    try {
      if (mongoose.Types.ObjectId.isValid(uploadedBy)) {
        adminObjectId = new mongoose.Types.ObjectId(uploadedBy);
      } else {
        throw new Error('Invalid admin ID provided');
      }
    } catch (error) {
      throw new Error('Invalid admin user ID');
    }

    const bulkUpload = new BulkUpload({
      uploadedBy: adminObjectId,
      fileName,
      totalRecords: 0,
      status: 'processing'
    });

    try {
      const fileType = fileName.endsWith('.csv') ? 'csv' : 'excel';
      const rawData = this.parseFile(filePath, fileType);

      bulkUpload.totalRecords = rawData.length;
      await bulkUpload.save();

      const validationErrors = this.validateData(rawData);
      const results = {
        successCount: 0,
        failureCount: 0,
        errors: validationErrors,
        processedStudents: [],
        emailFailures: []
      };

      console.log('🔄 Processing student rows...');

      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        const hasValidationError = validationErrors.some(e => e.row === i + 1);
        if (hasValidationError) {
          results.failureCount++;
          continue;
        }

        try {
          const result = await this.processStudentRow(row, i + 1);
          if (result.success) {
            results.successCount++;
            results.processedStudents.push(result.student);
          } else {
            results.failureCount++;
            results.errors.push({ row: i + 1, data: row, error: result.error });
          }
        } catch (error) {
          results.failureCount++;
          results.errors.push({ row: i + 1, data: row, error: error.message });
        }
      }

      bulkUpload.successCount = results.successCount;
      bulkUpload.failureCount = results.failureCount;
      bulkUpload.errors = results.errors;
      bulkUpload.status = 'completed';
      bulkUpload.processedAt = new Date();
      await bulkUpload.save();

      console.log('✅ Bulk upload completed:', {
        successCount: results.successCount,
        failureCount: results.failureCount
      });

      // Notify admin on completion
      try {
        const admin = await User.findById(adminObjectId);
        if (admin && admin.email) {
          await emailService.sendBulkUploadComplete(
            admin.email,
            admin.name,
            results.successCount,
            results.failureCount,
            rawData.length,
            []
          );
        }
      } catch (emailError) {
        console.error('❌ Failed to send completion email:', emailError);
      }

      return results;

    } catch (error) {
      console.error('❌ Bulk upload process failed:', error);
      bulkUpload.status = 'failed';
      bulkUpload.errors = [{ error: error.message }];
      bulkUpload.processedAt = new Date();
      await bulkUpload.save();
      throw error;
    }
  }

  async processStudentRow(row, rowNumber) {
    try {
      const enrollmentNo = (row.enrollmentNo || '').toString().trim();
      const email = (row.email || '').toString().trim().toLowerCase();

      console.log(`🔄 Processing row ${rowNumber}:`, { enrollmentNo, email });

      // Parse branch code from email
      const branchCode = this.parseBranchCodeFromEmail(email);
      console.log(`🔍 Parsed branch code: "${branchCode}" from email: ${email}`);

      // Check for duplicate student
      const existingStudent = await User.findOne({
        $or: [
          { email },
          { enrollmentNo }
        ]
      });

      if (existingStudent) {
        return {
          success: false,
          error: `Student already exists with email "${email}" or enrollment "${enrollmentNo}"`
        };
      }

      // Use email prefix as name placeholder — will be updated when student logs in via Google
      const namePlaceholder = email.split('@')[0];

      const student = new User({
        name: namePlaceholder,
        email,
        enrollmentNo,
        branchCode,       // auto-parsed from email
        role: 'student',
        isActive: true
        // No password — student logs in via Google OAuth
        // No assignedMentor — mentor will add student from dashboard
      });

      await student.save();
      console.log(`✅ Student saved: ${enrollmentNo} | branchCode: ${branchCode}`);

      return {
        success: true,
        student: {
          email: student.email,
          enrollmentNo: student.enrollmentNo,
          branchCode: student.branchCode
        }
      };

    } catch (error) {
      console.error(`❌ Error processing row ${rowNumber}:`, error);
      if (error.code === 11000) {
        return { success: false, error: 'Duplicate enrollment number or email' };
      }
      return { success: false, error: error.message };
    }
  }

  async getBulkUploadHistory(adminId, page = 1, limit = 10) {
    try {
      console.log('📋 Getting bulk upload history:', {
        adminId: adminId.toString(),
        page,
        limit
      });

      let adminObjectId;
      if (mongoose.Types.ObjectId.isValid(adminId)) {
        adminObjectId = new mongoose.Types.ObjectId(adminId);
      } else {
        throw new Error('Invalid admin ID');
      }

      const skip = (page - 1) * limit;

      const uploads = await BulkUpload.find({ uploadedBy: adminObjectId })
        .populate('uploadedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await BulkUpload.countDocuments({ uploadedBy: adminObjectId });

      console.log('✅ Bulk upload history retrieved:', {
        uploadsFound: uploads.length,
        totalRecords: total
      });

      return {
        uploads,
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('❌ Error getting bulk upload history:', error);
      throw new Error('Failed to get bulk upload history');
    }
  }
    // ─── Add a single student manually (mirrors one CSV row) ──────────────────
    async processSingleStudent(data, uploadedBy) {
      console.log('🚀 Processing single student add:', { uploadedBy: uploadedBy.toString(), data });
  
      let adminObjectId;
      try {
        if (mongoose.Types.ObjectId.isValid(uploadedBy)) {
          adminObjectId = new mongoose.Types.ObjectId(uploadedBy);
        } else {
          throw new Error('Invalid admin ID provided');
        }
      } catch (error) {
        throw new Error('Invalid admin user ID');
      }
  
      // Same shape as a CSV row, so validateRow/processStudentRow behave identically
      const row = {
        enrollmentNo: (data.enrollmentNo || '').toString().trim(),
        email: (data.email || '').toString().trim()
      };
  
      const rowErrors = this.validateRow(row, 1);
  
      const bulkUpload = new BulkUpload({
        uploadedBy: adminObjectId,
        fileName: 'Manual Entry',
        totalRecords: 1,
        status: 'processing'
      });
  
      if (rowErrors.length > 0) {
        bulkUpload.successCount = 0;
        bulkUpload.failureCount = 1;
        bulkUpload.errors = [{ row: 1, data: row, error: rowErrors.join(', ') }];
        bulkUpload.status = 'completed';
        bulkUpload.processedAt = new Date();
        await bulkUpload.save();
        return { success: false, error: rowErrors.join(', ') };
      }
  
      const result = await this.processStudentRow(row, 1);
  
      bulkUpload.successCount = result.success ? 1 : 0;
      bulkUpload.failureCount = result.success ? 0 : 1;
      bulkUpload.errors = result.success ? [] : [{ row: 1, data: row, error: result.error }];
      bulkUpload.status = 'completed';
      bulkUpload.processedAt = new Date();
      await bulkUpload.save();
  
      return result;
    }

  // Generate CSV template — only enrollmentNo + email
  generateTemplate() {
    const headers = ['enrollmentNo', 'email'];

    const sampleRows = [
      ['EN2024001', '23io10mo34@mitsgwl.ac.in'],
      ['EN2024002', '23cs20ab56@mitsgwl.ac.in'],
      ['EN2024003', '22me05xy89@mitsgwl.ac.in'],
      ['EN2024004', '24ec15pq12@mitsgwl.ac.in']
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);

    ws['!cols'] = [
      { wch: 15 }, // enrollmentNo
      { wch: 32 }  // email
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');

    return XLSX.write(wb, { type: 'buffer', bookType: 'csv' });
  }
}

module.exports = new CSVService();