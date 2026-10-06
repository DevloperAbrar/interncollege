const User = require('../models/User');
const Submission = require('../models/Submission');
const excelService = require('../services/excelService');
const emailService = require('../services/emailService');
const { successResponse, errorResponse, getPaginationData } = require('../utils/responseHelper');
const googleDriveService = require('../services/googleDriveService');

// ─── Resolve (or create) this mentor's own folder inside the centralized Drive ──
// ─── Resolve (or create) this mentor's own folder inside the centralized Drive ──
const resolveOwnDriveFolder = async (mentorId) => {
  const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!rootFolderId) {
    throw new Error('GOOGLE_DRIVE_FOLDER_ID is not set in environment.');
  }

  const mentor = await User.findById(mentorId).select('name internalUploadFolderId');

  // Fast path: skip the Drive search entirely if we already cached this
  if (mentor?.internalUploadFolderId) {
    return mentor.internalUploadFolderId;
  }

  // Slow path: only runs the first time for this mentor
  const sanitizedMentorName = (mentor?.name || 'Unknown_Mentor')
    .replace(/[^a-zA-Z0-9\s]/g, '_')
    .replace(/\s+/g, '_');
  const mentorFolderName = `${sanitizedMentorName}_${mentorId}`;

  let mentorFolder = await googleDriveService.findFolderByName(mentorFolderName, rootFolderId);
  if (!mentorFolder) {
    mentorFolder = await googleDriveService.createFolder(mentorFolderName, rootFolderId);
  }

  // Cache it for next time
  await User.findByIdAndUpdate(mentorId, { internalUploadFolderId: mentorFolder.id });

  return mentorFolder.id;
};
const setDriveFolder = async (req, res) => {
  try {
    const mentorId = req.user._id;
    const { folderLink } = req.body;

    if (!folderLink || !folderLink.trim()) {
      return errorResponse(res, 'Folder link is required', 400);
    }

    const folderId = googleDriveService.extractFolderId(folderLink.trim());
    if (!folderId) {
      return errorResponse(res, 'Could not read a valid folder link. Please paste the full Google Drive folder URL.', 400);
    }

    await User.findByIdAndUpdate(mentorId, {
      driveFolderId: folderId,
      driveFolderLink: folderLink.trim(),
      driveFolderStatus: 'connected'
    });

    successResponse(res, {
      folderId,
      status: 'connected'
    }, 'Google Drive folder connected successfully');

  } catch (error) {
    console.error('❌ Set drive folder error:', error);
    errorResponse(res, 'Failed to connect Drive folder', 500);
  }
};

const getDriveFolderStatus = async (req, res) => {
  try {
    const mentor = await User.findById(req.user._id).select('driveFolderId driveFolderStatus driveFolderLink');

    successResponse(res, {
      driveFolderId: mentor.driveFolderId,
      driveFolderLink: mentor.driveFolderLink,
      driveFolderStatus: mentor.driveFolderStatus
    }, 'Drive folder status retrieved');
  } catch (error) {
    console.error('❌ Get drive folder status error:', error);
    errorResponse(res, 'Failed to get drive folder status', 500);
  }
};


// mentorController.js

// Helper: pull the Drive fileId out of a stored webViewLink/URL
const extractDriveFileId = (url) => {
  if (!url) return null;
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
};

const updateSubmissionDetails = async (req, res) => {
  const fs = require('fs');

  // Remove any temp files multer left on disk (Drive service already deletes the ones it uploaded)
  const cleanupTempFiles = () => {
    Object.values(req.files || {}).flat().forEach((f) => {
      try {
        if (f?.path && fs.existsSync(f.path)) fs.unlinkSync(f.path);
      } catch (e) {
        console.warn('Could not remove temp file:', e.message);
      }
    });
  };

  try {
    console.log('📝 Starting submission update process...');

    const mentorId = req.user._id;
    const { id } = req.params;
    const { updateType } = req.body;

    let submissionId = id;
    let mprType = null;

    if (id.includes('_')) {
      [submissionId, mprType] = id.split('_');
    }

    const submission = await Submission.findById(submissionId);

    if (!submission) {
      cleanupTempFiles();
      return errorResponse(res, 'Submission not found', 404);
    }

    if (submission.mentor.toString() !== mentorId.toString()) {
      cleanupTempFiles();
      return errorResponse(res, 'Not authorized to update this submission', 403);
    }

    // ─── Registration file rules (same as student side) ──────────────────────
    // Documents: PDF only. Synopsis: PDF / PPT / PPTX. Max 2 MB each.
    if (updateType === 'registration' && req.files) {
      const REG_MAX_BYTES = 2 * 1024 * 1024;
      const path = require('path');

      for (const [fieldName, fileArr] of Object.entries(req.files)) {
        const file = Array.isArray(fileArr) ? fileArr[0] : fileArr;
        if (!file) continue;

        const ext = path.extname(file.originalname).toLowerCase();
        const allowedExts = fieldName === 'synopsisPPT' ? ['.pdf', '.ppt', '.pptx'] : ['.pdf'];

        if (!allowedExts.includes(ext)) {
          cleanupTempFiles();
          return errorResponse(
            res,
            fieldName === 'synopsisPPT'
              ? 'Internship synopsis must be a PDF, PPT or PPTX file.'
              : 'Only PDF files are allowed for this document.',
            400
          );
        }

        if (file.size > REG_MAX_BYTES) {
          cleanupTempFiles();
          return errorResponse(res, 'File size too large. Maximum is 2MB per file.', 400);
        }
      }
    }

    const student = await User.findById(submission.student);

    // ─── Upload new files to Drive ───────────────────────────────────────────
    let uploadedFiles = {};
    if (req.files && Object.keys(req.files).length > 0) {
      try {
        const mentorFolderId = await resolveOwnDriveFolder(mentorId);

        const studentData = {
          studentId: student.enrollmentNo || student._id.toString(),
          fullName: student.name,
          email: student.email
        };

        const uploadResults = await googleDriveService.uploadStudentDocuments(
          studentData,
          req.files,
          mentorFolderId,
          student.driveStudentFolderId,
          async (newFolderId) => {
            await User.findByIdAndUpdate(student._id, { driveStudentFolderId: newFolderId });
          }
        );

        if (uploadResults.uploadedFiles) {
          uploadResults.uploadedFiles.forEach((file) => {
            uploadedFiles[file.fieldName] = file.webViewLink;
          });
        }

        // If some files failed, stop here instead of silently saving without them
        if (uploadResults.errors && uploadResults.errors.length > 0) {
          cleanupTempFiles();
          const failed = uploadResults.errors.map((e) => e.fieldName).join(', ');
          return errorResponse(res, `Failed to upload: ${failed}. Please try again.`, 500);
        }
      } catch (uploadError) {
        console.error('File upload error:', uploadError);
        cleanupTempFiles();
        return errorResponse(res, 'Failed to upload document to Drive. Please try again.', 500);
      }
    }

    // ─── Update based on type ────────────────────────────────────────────────
    if (updateType === 'registration') {
      const COMPANY_TYPES = ['startup', 'mnc', 'government', 'psu', 'academic_institute', 'research', 'other'];
      const PROJECT_TYPES = ['software', 'hardware', 'software_hardware', 'experimental'];
      const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
      const MOBILE_REGEX = /^[6-9]\d{9}$/;

      // Only these fields can be edited by a mentor
      const TEXT_FIELDS = [
        'companyName', 'companyFullAddress', 'internshipTitle', 'internshipDomain',
        'internshipType', 'typeOfWork', 'mentorName', 'mentorRole',
        'hrName', 'projectTitle'
      ];
      const FILE_FIELDS = ['offerLetter', 'nocLetter', 'stipendProof', 'synopsisPPT', 'projectReport'];

      const body = req.body;
      const current = submission.registrationData?.toObject
        ? submission.registrationData.toObject()
        : { ...(submission.registrationData || {}) };
      const updates = {};

      // Plain text fields
      TEXT_FIELDS.forEach((field) => {
        if (body[field] !== undefined) {
          const value = String(body[field]).trim();
          if (!value) {
            throw Object.assign(new Error(`${field} cannot be empty`), { status: 400 });
          }
          updates[field] = value;
        }
      });

      // Company type + custom "Other" value
      if (body.companyType !== undefined) {
        if (!COMPANY_TYPES.includes(body.companyType)) {
          throw Object.assign(new Error('Invalid company type'), { status: 400 });
        }
        updates.companyType = body.companyType;
      }
      const finalCompanyType = updates.companyType || current.companyType;

      if (finalCompanyType === 'other') {
        const otherValue = body.companyTypeOther !== undefined
          ? String(body.companyTypeOther).trim()
          : (current.companyTypeOther || '').trim();
        if (!otherValue) {
          throw Object.assign(new Error('Please specify the company type'), { status: 400 });
        }
        if (otherValue.length > 50) {
          throw Object.assign(new Error('Company type must be 50 characters or less'), { status: 400 });
        }
        updates.companyTypeOther = otherValue;
      } else if (body.companyType !== undefined || body.companyTypeOther !== undefined) {
        // Not "Other" anymore, so the custom value must not stay behind
        updates.companyTypeOther = undefined;
      }

      // Project type
      if (body.projectType !== undefined) {
        if (!PROJECT_TYPES.includes(body.projectType)) {
          throw Object.assign(new Error('Invalid project type'), { status: 400 });
        }
        updates.projectType = body.projectType;
      }

      // Emails
      ['mentorEmail', 'hrEmail'].forEach((field) => {
        if (body[field] !== undefined) {
          const value = String(body[field]).trim().toLowerCase();
          if (!EMAIL_REGEX.test(value)) {
            throw Object.assign(new Error(`Enter a valid email for ${field}`), { status: 400 });
          }
          updates[field] = value;
        }
      });

      // Mobile numbers
      ['studentMobileNumber', 'mentorContactNumber'].forEach((field) => {
        if (body[field] !== undefined) {
          const value = String(body[field]).replace(/\s+/g, '');
          if (!MOBILE_REGEX.test(value)) {
            throw Object.assign(new Error(`${field} must be a valid 10 digit mobile number`), { status: 400 });
          }
          updates[field] = value;
        }
      });

      // Dates
      ['startDate', 'endDate'].forEach((field) => {
        if (body[field] !== undefined) {
          const d = new Date(body[field]);
          if (Number.isNaN(d.getTime())) {
            throw Object.assign(new Error(`Enter a valid ${field}`), { status: 400 });
          }
          updates[field] = d;
        }
      });
      const finalStart = updates.startDate || current.startDate;
      const finalEnd = updates.endDate || current.endDate;
      if (finalStart && finalEnd && new Date(finalEnd) <= new Date(finalStart)) {
        throw Object.assign(new Error('End date must be after start date'), { status: 400 });
      }

      // Stipend
      if (body.hasStipend !== undefined || body.stipendAmount !== undefined) {
        const hasStipend = body.hasStipend !== undefined
          ? (body.hasStipend === 'true' || body.hasStipend === true)
          : Boolean(current.hasStipend);

        if (hasStipend) {
          const amount = body.stipendAmount !== undefined ? Number(body.stipendAmount) : Number(current.stipendAmount);
          if (!amount || amount <= 0) {
            throw Object.assign(new Error('Enter a valid stipend amount'), { status: 400 });
          }
          updates.hasStipend = true;
          updates.stipendAmount = amount;
        } else {
          updates.hasStipend = false;
          updates.stipendAmount = 0;
          updates.stipendProof = undefined;
        }
      }

      // Newly uploaded documents
      FILE_FIELDS.forEach((field) => {
        if (uploadedFiles[field]) updates[field] = uploadedFiles[field];
      });

      // Apply field by field so untouched data is never overwritten
      Object.entries(updates).forEach(([key, value]) => {
        submission.set(`registrationData.${key}`, value);
      });

    } else if (updateType === 'mpr') {
      if (!mprType || !submission.mprSubmissions?.[mprType]) {
        return errorResponse(res, 'MPR submission not found', 404);
      }

      if (uploadedFiles.document) {
        submission.mprSubmissions[mprType].document = uploadedFiles.document;
      }

      const updatedMPRData = { ...req.body };
      delete updatedMPRData.updateType;
      Object.assign(submission.mprSubmissions[mprType], updatedMPRData);

    } else if (updateType === 'finalReport') {
      const updatedData = { ...req.body };
      delete updatedData.updateType;
      Object.assign(updatedData, uploadedFiles);

      submission.finalReport = {
        ...submission.finalReport,
        ...updatedData
      };
    }

    await submission.save();

    // Send notification
    try {
      const emailService = require('../services/emailService');
      await emailService.sendEmail(
        student.email,
        'Submission Updated by Mentor',
        `Your ${updateType} submission has been updated by your mentor.`
      );
    } catch (emailError) {
      console.error('Email notification error:', emailError);
    }

    successResponse(res, submission, 'Submission updated successfully');

  } catch (error) {
    console.error('❌ Update submission error:', error);
    cleanupTempFiles();
    if (error.status === 400) {
      return errorResponse(res, error.message, 400);
    }
    errorResponse(res, 'Failed to update submission: ' + error.message, 500);
  }
};

// @desc    Get mentor dashboard
// @route   GET /api/mentor/dashboard
// @access  Private (Mentor only)
const getDashboard = async (req, res) => {
  try {
    const mentorId = req.user._id;

    // Get assigned students count
    const totalAssignedStudents = await User.countDocuments({
      role: 'student',
      assignedMentor: mentorId
    });

    // Get submissions statistics
    const totalSubmissions = await Submission.countDocuments({ mentor: mentorId });
    const pendingSubmissions = await Submission.countDocuments({
      mentor: mentorId,
      status: 'pending'
    });
    const approvedSubmissions = await Submission.countDocuments({
      mentor: mentorId,
      status: 'approved'
    });

    // Get recent submissions
    const recentSubmissions = await Submission.find({ mentor: mentorId })
      .populate('student', 'name enrollmentNo email branch')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get students with pending monthly submissions
    const studentsWithPendingMonthly = await Submission.find({
      mentor: mentorId,
      type: 'internship',
      status: 'approved'
    })
      .populate('student', 'name enrollmentNo')
      .lean();

    // Calculate pending monthly submissions
    const pendingMonthlyCount = studentsWithPendingMonthly.reduce((count, submission) => {
      const currentDate = new Date();
      const startDate = new Date(submission.startDate);
      const monthsPassed = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24 * 30));
      const submissionsReceived = submission.monthlySubmissions.length;

      if (monthsPassed > submissionsReceived && monthsPassed <= submission.duration) {
        return count + 1;
      }
      return count;
    }, 0);

    // Get placement statistics
    const placedStudents = await Submission.aggregate([
      { $match: { mentor: mentorId, type: 'internship', status: 'approved' } },
      { $unwind: '$monthlySubmissions' },
      { $match: { 'monthlySubmissions.placementStatus': 'yes' } },
      { $group: { _id: '$student', count: { $sum: 1 } } }
    ]);

    const dashboardStats = {
      overview: {
        totalAssignedStudents,
        totalSubmissions,
        pendingSubmissions,
        approvedSubmissions,
        placedStudents: placedStudents.length,
        pendingMonthlySubmissions: pendingMonthlyCount
      },
      recentSubmissions: recentSubmissions.map(sub => ({
        id: sub._id,
        studentName: sub.student?.name,
        enrollmentNo: sub.student?.enrollmentNo,
        type: sub.type,
        status: sub.status,
        submittedAt: sub.createdAt
      }))
    };

    successResponse(res, dashboardStats, 'Dashboard statistics retrieved successfully');
  } catch (error) {
    console.error('Get mentor dashboard error:', error);
    errorResponse(res, 'Failed to get dashboard statistics', 500);
  }
};

// @desc    Get assigned students
// @route   GET /api/mentor/students
// @access  Private (Mentor only)
const getAssignedStudents = async (req, res) => {
  try {
    const mentorId = req.user._id;
    const { page = 1, limit = 10, search = '', status = '' } = req.query;

    let query = {
      role: 'student',
      assignedMentor: mentorId
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { enrollmentNo: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      query.isActive = status === 'active';
    }

    const pagination = getPaginationData(page, limit, await User.countDocuments(query));

    const students = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.itemsPerPage);

    // Get submission status for each student
    const studentsWithSubmissionStatus = await Promise.all(
      students.map(async (student) => {
        const submission = await Submission.findOne({ student: student._id })
          .select('type status createdAt reviewedAt');

        let submissionStatus = null;
        if (submission) {
          submissionStatus = {
            id: submission._id,
            type: submission.type,
            status: submission.status,
            submittedAt: submission.createdAt,
            reviewedAt: submission.reviewedAt
          };

          // Add monthly submission info for internships
          if (submission.type === 'internship' && submission.status === 'approved') {
            const monthlyCount = submission.monthlySubmissions?.length || 0;
            submissionStatus.monthlySubmissions = {
              completed: monthlyCount,
              required: submission.duration || 0
            };
          }
        }

        return {
          ...student.toJSON(),
          submissionStatus
        };
      })
    );

    successResponse(res, {
      students: studentsWithSubmissionStatus,
      pagination
    }, 'Assigned students retrieved successfully');

  } catch (error) {
    console.error('Get assigned students error:', error);
    errorResponse(res, 'Failed to get assigned students', 500);
  }
};

const getPendingSubmissions = async (req, res) => {
  try {
    const mentorId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    // Get all submissions for this mentor
    const allSubmissions = await Submission.find({ mentor: mentorId })
      .populate('student', 'name email enrollmentNo branch')
      .sort({ createdAt: -1 });

    // Process submissions to create review items
    const pendingItems = [];

    allSubmissions.forEach(submission => {
      const baseData = {
        student: submission.student,
        studentName: submission.studentName || submission.student?.name,
        enrollmentNo: submission.enrollmentNo || submission.student?.enrollmentNo,
        branch: submission.branch || submission.student?.branch,
        semesterType: submission.semesterType,
        createdAt: submission.createdAt,
        updatedAt: submission.updatedAt
      };

      // Registration Review - Only if actually pending
      if (submission.registrationReview?.status === 'pending') {
        pendingItems.push({
          _id: submission._id,
          ...baseData,
          reviewType: 'registration',
          currentReviewStatus: 'pending',
          type: 'Registration Review',
          submittedDate: submission.createdAt,
          registrationDetails: submission.registrationData
        });
      }

      // MPR Reviews (only for 7th and 8th internships)
      // Only add MPR items if registration is approved first
      if (['7th_internship', '8th_internship', '8th_project'].includes(submission.semesterType) &&
        submission.registrationReview?.status === 'approved' &&
        submission.mprSubmissions) {

        // NEW
        const mprTypes = ['mpr1', 'mpr2', 'mpr3', 'midSem1'];

        mprTypes.forEach(mprType => {
          const mprData = submission.mprSubmissions[mprType];
          // Only add if MPR has been actually submitted (has document) and is pending
          if (mprData &&
            mprData.document &&
            mprData.submittedAt && // Ensure it was actually submitted
            mprData.status === 'pending') {

            pendingItems.push({
              _id: `${submission._id}_${mprType}`,
              ...baseData,
              reviewType: 'mpr',
              mprType: mprType,
              currentReviewStatus: 'pending',
              type: `${mprType.toUpperCase()} Review`,
              submittedDate: mprData.submittedAt,
              originalSubmissionId: submission._id,
              registrationDetails: submission.registrationData,
              mprDetails: {
                type: mprType,
                document: mprData.document,
                submittedAt: mprData.submittedAt,
                status: mprData.status
              }
            });
          }
        });
      }

      // Final Report Review - Only if actually submitted and meets requirements
      if (submission.finalReportReview?.status === 'pending' &&
        submission.finalReport &&
        submission.finalReport.submittedAt && // Must have been actually submitted
        isEligibleForFinalReportReview(submission)) {

        pendingItems.push({
          _id: submission._id,
          ...baseData,
          reviewType: 'finalReport',
          currentReviewStatus: 'pending',
          type: 'Final Report Review',
          submittedDate: submission.finalReport.submittedAt,
          registrationDetails: submission.registrationData,
          finalReportDetails: submission.finalReport
        });
      }
    });

    // Sort by submission date (newest first)
    pendingItems.sort((a, b) => new Date(b.submittedDate) - new Date(a.submittedDate));

    // Calculate pagination
    const totalItems = pendingItems.length;
    const skip = (page - 1) * limit;
    const paginatedItems = pendingItems.slice(skip, skip + parseInt(limit));

    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalItems / limit),
      itemsPerPage: parseInt(limit),
      totalItems: totalItems,
      hasNextPage: skip + parseInt(limit) < totalItems,
      hasPrevPage: page > 1
    };

    console.log(`📋 Found ${totalItems} pending reviews for mentor, returning ${paginatedItems.length} items`);

    successResponse(res, {
      submissions: paginatedItems,
      pagination
    }, 'Pending submissions retrieved successfully');
  } catch (error) {
    console.error('❌ Get pending submissions error:', error);
    errorResponse(res, 'Failed to get pending submissions', 500);
  }
};

const isEligibleForFinalReportReview = (submission) => {
  if (submission.registrationReview?.status !== 'approved') return false;

  switch (submission.semesterType) {
    case '6th_internship':
    case 'any_internship':
      // Direct to final report after registration approval
      return submission.currentStep === 'final_report_pending';

    case '8th_project':
    case '7th_internship':
    case '8th_internship': {
      // Require all 4 MPRs approved first
      if (!submission.mprSubmissions) return false;
      const mprTypes = ['mpr1', 'mpr2', 'mpr3', 'midSem1'];
      const submitted = mprTypes.filter(t =>
        submission.mprSubmissions[t]?.document &&
        submission.mprSubmissions[t]?.submittedAt
      );
      if (submitted.length === 0) return false;
      const approved = submitted.filter(t =>
        submission.mprSubmissions[t].status === 'approved'
      );
      return submitted.length === approved.length &&
        submission.currentStep === 'final_report_pending';
    }

    default:
      return false;
  }
};
// Add this function to your mentorController.js

// @desc    Handle MPR approval/rejection
// @route   This should be called when reviewing MPR submissions
const handleMPRReview = async (mprSubmissionId, action, feedback, mentorId) => {
  try {
    // Find the MPR submission record
    const mprSubmission = await Submission.findById(mprSubmissionId);
    if (!mprSubmission) {
      throw new Error('MPR submission not found');
    }

    // Check if this is an MPR submission by looking at semesterType or registrationData
    const isMPRSubmission = mprSubmission.semesterType?.includes('mpr') ||
      mprSubmission.registrationData?.mprType;

    if (!isMPRSubmission) {
      throw new Error('Not an MPR submission');
    }

    // Update the MPR submission record
    mprSubmission.registrationReview.status = action; // 'approved' or 'rejected'
    mprSubmission.registrationReview.reviewedBy = mentorId;
    mprSubmission.registrationReview.reviewedAt = new Date();
    mprSubmission.registrationReview.feedback = feedback;
    mprSubmission.currentStep = action === 'approved' ? 'registration_approved' : 'registration_rejected';

    await mprSubmission.save();

    // Find and update the parent submission's MPR status
    const originalSubmissionId = mprSubmission.registrationData?.originalSubmissionId;
    if (originalSubmissionId) {
      const parentSubmission = await Submission.findById(originalSubmissionId);
      if (parentSubmission) {
        const mprType = mprSubmission.registrationData.mprType;

        if (parentSubmission.mprSubmissions && parentSubmission.mprSubmissions[mprType]) {
          parentSubmission.mprSubmissions[mprType].status = action;
          parentSubmission.mprSubmissions[mprType].reviewedAt = new Date();
          parentSubmission.mprSubmissions[mprType].feedback = feedback;

          await parentSubmission.save();
        }
      }
    }

    console.log(`✅ MPR ${mprSubmission.registrationData?.mprType} ${action} successfully`);
    return mprSubmission;
  } catch (error) {
    console.error('❌ Handle MPR review error:', error);
    throw error;
  }
};

// Updated reviewSubmission function in mentorController.js
// Updated reviewSubmission function in mentorController.js
// ─── GET /api/student/progress ────────────────────────────────────────────────
const reviewSubmission = async (req, res) => {
  try {
    console.log('🔍 Starting review process...');
    console.log('Submission ID:', req.params.id);
    console.log('Review data:', req.body);

    const mentorId = req.user._id;
    const { id } = req.params;
    const { action, feedback, marks } = req.body; // Added marks

    // Validate action
    if (!['approve', 'reject'].includes(action)) {
      return errorResponse(res, 'Invalid action. Must be approve or reject', 400);
    }

    // Parse the ID for MPR submissions
    let submissionId = id;
    let mprType = null;

    if (id.includes('_')) {
      [submissionId, mprType] = id.split('_');
      console.log('MPR review detected:', { submissionId, mprType });
    }

    const submission = await Submission.findById(submissionId)
      .populate('student', 'name email enrollmentNo');

    if (!submission) {
      return errorResponse(res, 'Submission not found', 404);
    }

    if (submission.mentor.toString() !== mentorId.toString()) {
      return errorResponse(res, 'Not authorized to review this submission', 403);
    }

    // Remember what is being reviewed BEFORE currentStep changes below
    const reviewLabel = mprType
      ? `${mprType.toUpperCase()} MPR`
      : ['final_report_pending', 'final_report_rejected'].includes(submission.currentStep)
        ? 'Final Report'
        : 'Registration';

    const reviewData = {
      reviewedBy: mentorId,
      reviewedAt: new Date(),
      feedback: feedback || '',
      status: action === 'approve' ? 'approved' : 'rejected'
    };

    // Add marks if provided and approved
    if (action === 'approve' && marks) {
      reviewData.marks = marks;
    }

    // Handle different review types
    if (mprType) {
      // ✅ MPR Review
      if (!submission.mprSubmissions || !submission.mprSubmissions[mprType]) {
        return errorResponse(res, 'MPR submission not found', 404);
      }

      submission.mprSubmissions[mprType] = {
        ...submission.mprSubmissions[mprType],
        ...reviewData
      };

      // ✅ CRITICAL FIX: Check if all 5 MPRs are approved
      const allMPRTypes = ['mpr1', 'mpr2', 'mpr3', 'midSem1'];
      const approvedMPRs = allMPRTypes.filter(
        type => submission.mprSubmissions[type]?.status === 'approved'
      );

      console.log(`📊 MPR Progress: ${approvedMPRs.length}/5 approved`);

      // ✅ If all 5 MPRs are approved, student can submit final report
      if (approvedMPRs.length === 4) {
        console.log('🎉 All 4 MPRs approved! Student can now fill placement record details');
        submission.hasPendingMPRReviews = false;
        // Placement record details come BEFORE the final report
        if (!submission.finalReport?.submittedAt) {
          submission.currentStep = submission.placementDetails?.status === 'approved'
            ? 'final_report_pending'
            : 'placement_pending';
        }
      }
      

      console.log(`✅ ${mprType.toUpperCase()} reviewed: ${action}`);

    } else {
      // Determine review type based on current step
      const currentStep = submission.currentStep;

      if (currentStep === 'registration_pending' || currentStep === 'registration_rejected') {
        // Registration review
        submission.registrationReview = reviewData;

        if (action === 'approve') {
          submission.status = 'approved';

          // Set next step based on semester type
          if (['7th_internship', '8th_internship', '8th_project'].includes(submission.semesterType)) {
            submission.currentStep = 'mpr_submissions';
          } else {
            submission.currentStep = 'registration_approved';
          }
        } else {
          submission.currentStep = 'registration_rejected';
          submission.status = 'rejected';
        }

        console.log('✅ Registration reviewed:', action);

      } else if (currentStep === 'final_report_pending' || currentStep === 'final_report_rejected') {
        // Final report review
        submission.finalReportReview = reviewData;

        if (action === 'approve') {
          // MPR flow: placement record was already approved, so the submission is complete.
          // Internships without MPRs: the student fills the placement record next.
          if (submission.placementDetails?.status === 'approved') {
            submission.currentStep = 'completed';
            submission.status = 'completed';
            submission.completedAt = new Date();
          } else {
            submission.currentStep = 'placement_pending';
            submission.status = 'approved';
          }
        } else {
          submission.currentStep = 'final_report_rejected';
        }

        console.log('✅ Final report reviewed:', action);
      } else {
        return errorResponse(res, 'Invalid submission state for review', 400);
      }
    }

    await submission.save();

    // Send email notification
    try {
      await emailService.sendEmail(
        submission.student.email,
        `Submission ${action === 'approve' ? 'Approved' : 'Rejected'}`,
        `Your ${reviewLabel} has been ${action}d by your mentor.\n\nFeedback: ${feedback || 'No feedback provided'}`
      );
    } catch (emailError) {
      console.error('Email notification error:', emailError);
    }

    console.log('✅ Review completed successfully');
    successResponse(res, submission, `Submission ${action}d successfully`);

  } catch (error) {
    console.error('❌ Review submission error:', error);
    errorResponse(res, 'Failed to review submission: ' + error.message, 500);
  }
};

const getProgress = async (req, res) => {
  try {
    const studentId = req.user._id;
    const allSubmissions = await Submission.find({ student: studentId })
      .populate('mentor', 'name email')
      .populate('registrationReview.reviewedBy', 'name')
      .populate('finalReportReview.reviewedBy', 'name')
      .sort({ createdAt: -1 });

    const activeSubmission = allSubmissions.find(s => s.currentStep !== 'completed');

    if (!activeSubmission) {
      return successResponse(res, {
        hasSubmission: false,
        message: 'No active submission found',
        completedSubmissions: allSubmissions.filter(s => s.currentStep === 'completed')
      }, 'Progress retrieved successfully');
    }

    const responseData = {
      hasSubmission: true,
      submission: {
        _id: activeSubmission._id,
        semesterType: activeSubmission.semesterType,
        currentStep: activeSubmission.currentStep,
        status: activeSubmission.status,
        studentName: activeSubmission.studentName,
        enrollmentNo: activeSubmission.enrollmentNo,
        registrationData: activeSubmission.registrationData,
        createdAt: activeSubmission.createdAt,
        updatedAt: activeSubmission.updatedAt,
        registrationReview: activeSubmission.registrationReview,
        mprSubmissions: activeSubmission.mprSubmissions || {},
        finalReport: activeSubmission.finalReport,
        finalReportReview: activeSubmission.finalReportReview,
        placementDetails: activeSubmission.placementDetails || null
      },
      mentor: activeSubmission.mentor
    };
    if (['7th_internship', '8th_internship', '8th_project'].includes(activeSubmission.semesterType)) {
      responseData.submission.allMPRApproved = activeSubmission.areAllMPRSubmissionsApproved();
      responseData.submission.canSubmitFinalReport = activeSubmission.isReadyForFinalReport();
    }

    successResponse(res, responseData, 'Progress retrieved successfully');
  } catch (error) {
    console.error('Get progress error:', error);
    errorResponse(res, 'Failed to get progress', 500);
  }
};


// @desc    Approve MPR submission
// @route   PUT /api/mentor/approve-mpr/:id
// @access  Private (Mentor only)
const approveMPR = async (req, res) => {
  try {
    const { id } = req.params;
    const { mprType, feedback } = req.body; // mpr1, mpr2, mpr3, midSem1, midSem2
    const mentorId = req.user._id;

    const submission = await Submission.findById(id).populate('student', 'name email');

    if (!submission) {
      return errorResponse(res, 'Submission not found', 404);
    }

    // Verify mentor is assigned to this submission
    if (submission.mentor.toString() !== mentorId.toString()) {
      return errorResponse(res, 'Not authorized to review this submission', 403);
    }

    // Check if MPR exists
    if (!submission.mprSubmissions[mprType]) {
      return errorResponse(res, `${mprType} not found or not submitted`, 404);
    }

    // Update MPR status
    submission.mprSubmissions[mprType].status = 'approved';
    submission.mprSubmissions[mprType].feedback = feedback || '';

    // Check if all MPRs are now approved
    const allMPRApproved = submission.areAllMPRSubmissionsApproved();

    // If all MPRs are approved, the student fills the placement record details next.
    // The final report unlocks only after the mentor approves those.
    if (allMPRApproved && !submission.finalReport?.submittedAt) {
      submission.currentStep = submission.placementDetails?.status === 'approved'
        ? 'final_report_pending'
        : 'placement_pending';
    }

    await submission.save();

    // Send email notification
    try {
      const emailSubject = allMPRApproved ?
        `All MPRs Approved - Ready for Final Report` :
        `${mprType.toUpperCase()} Approved`;

      await emailService.sendMPRApproved(
        submission.student.email,
        submission.student.name,
        mprType,
        allMPRApproved
      );
    } catch (emailError) {
      console.error('Email notification error:', emailError);
    }

    console.log(`✅ ${mprType} approved for ${submission.student.name}${allMPRApproved ? ' - All MPRs completed' : ''}`);
    successResponse(res, {
      mprType,
      status: 'approved',
      allMPRApproved,
      currentStep: submission.currentStep
    }, `${mprType.toUpperCase()} approved successfully`);
  } catch (error) {
    console.error('❌ Approve MPR error:', error);
    errorResponse(res, 'Failed to approve MPR', 500);
  }
};

// @desc    Reject MPR submission
// @route   PUT /api/mentor/reject-mpr/:id
// @access  Private (Mentor only)
const rejectMPR = async (req, res) => {
  try {
    const { id } = req.params;
    const { mprType, feedback } = req.body;
    const mentorId = req.user._id;

    const submission = await Submission.findById(id).populate('student', 'name email');

    if (!submission) {
      return errorResponse(res, 'Submission not found', 404);
    }

    if (submission.mentor.toString() !== mentorId.toString()) {
      return errorResponse(res, 'Not authorized to review this submission', 403);
    }

    if (!submission.mprSubmissions[mprType]) {
      return errorResponse(res, `${mprType} not found`, 404);
    }

    // Update MPR status
    submission.mprSubmissions[mprType].status = 'rejected';
    submission.mprSubmissions[mprType].feedback = feedback || 'Please resubmit with corrections';

    await submission.save();

    // Send email notification
    try {
      await emailService.sendMPRRejected(
        submission.student.email,
        submission.student.name,
        mprType,
        feedback
      );
    } catch (emailError) {
      console.error('Email notification error:', emailError);
    }

    console.log(`❌ ${mprType} rejected for ${submission.student.name}`);
    successResponse(res, {
      mprType,
      status: 'rejected',
      feedback
    }, `${mprType.toUpperCase()} rejected`);
  } catch (error) {
    console.error('❌ Reject MPR error:', error);
    errorResponse(res, 'Failed to reject MPR', 500);
  }
};

// @desc    Approve registration
// @route   PUT /api/mentor/approve-registration/:id
// @access  Private (Mentor only)
const approveRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;
    const mentorId = req.user._id;

    const submission = await Submission.findById(id).populate('student', 'name email');

    if (!submission) {
      return errorResponse(res, 'Submission not found', 404);
    }

    // Verify mentor is assigned to this submission
    if (submission.mentor.toString() !== mentorId.toString()) {
      return errorResponse(res, 'Not authorized to review this submission', 403);
    }

    // Update registration review
    submission.registrationReview.status = 'approved';
    submission.registrationReview.reviewedBy = mentorId;
    submission.registrationReview.reviewedAt = new Date();
    submission.registrationReview.feedback = feedback || '';

    // Update overall status
    submission.status = 'approved';

    // Set next step based on semester type
    if (submission.semesterType === '7th_internship' || submission.semesterType === '8th_internship') {
      // These require MPR submissions before final report
      submission.currentStep = 'mpr_submissions';
    } else if (submission.semesterType === '6th_internship' ||
      submission.semesterType === 'any_internship') {
      submission.currentStep = 'registration_approved';
    } else if (submission.semesterType === '8th_project') {
      submission.currentStep = 'mpr_submissions';        // ✅ needs MPRs first
    } else {
      submission.currentStep = 'registration_approved';
    }

    await submission.save();

    // Send email notification to student
    try {
      await emailService.sendRegistrationApproved(
        submission.student.email,
        submission.student.name,
        submission.semesterType
      );
    } catch (emailError) {
      console.error('Email notification error:', emailError);
    }

    console.log(`✅ Registration approved for ${submission.student.name}, next step: ${submission.currentStep}`);
    successResponse(res, submission, 'Registration approved successfully');
  } catch (error) {
    console.error('❌ Approve registration error:', error);
    errorResponse(res, 'Failed to approve registration', 500);
  }
};



// @desc    Approve final report
// @route   PUT /api/mentor/approve-final-report/:id
// @access  Private (Mentor only)
const approveFinalReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;
    const mentorId = req.user._id;

    const submission = await Submission.findById(id).populate('student', 'name email');

    if (!submission) {
      return errorResponse(res, 'Submission not found', 404);
    }

    if (submission.mentor.toString() !== mentorId.toString()) {
      return errorResponse(res, 'Not authorized to review this submission', 403);
    }

    // Update final report review
    submission.finalReportReview.status = 'approved';
    submission.finalReportReview.reviewedBy = mentorId;
    submission.finalReportReview.reviewedAt = new Date();
    submission.finalReportReview.feedback = feedback || '';

    // Update final report status
    submission.finalReport.status = 'approved';

    // MPR flow: placement record was already approved, so the submission is complete.
    // Internships without MPRs: the student fills the placement record next.
    if (submission.placementDetails?.status === 'approved') {
      submission.currentStep = 'completed';
      submission.status = 'completed';
      submission.completedAt = new Date();
    } else {
      submission.currentStep = 'placement_pending';
      submission.status = 'approved';
    }

    await submission.save();

    // Notify the student
    try {
      await emailService.sendSubmissionApproved(
        submission.student.email,
        submission.student.name,
        'Final Report',
        feedback || ''
      );
    } catch (emailError) {
      console.error('Email notification error:', emailError);
    }

    const isCompleted = submission.currentStep === 'completed';
    console.log(`✅ Final report approved for ${submission.student.name}, next step: ${submission.currentStep}`);
    successResponse(
      res,
      submission,
      isCompleted
        ? 'Final report approved. Submission marked as completed.'
        : 'Final report approved. Student must now submit placement record details.'
    );
  } catch (error) {
    console.error('❌ Approve final report error:', error);
    errorResponse(res, 'Failed to approve final report', 500);
  }
};

// @desc    Get mentor's assigned submissions
// @route   GET /api/mentor/submissions
// @access  Private (Mentor only)
const getAssignedSubmissions = async (req, res) => {
  try {
    const mentorId = req.user._id;
    const { status, semesterType, currentStep } = req.query;

    // Build query
    let query = { mentor: mentorId };

    if (status) query.status = status;
    if (semesterType) query.semesterType = semesterType;
    if (currentStep) query.currentStep = currentStep;

    const submissions = await Submission.find(query)
      .populate('student', 'name email enrollmentNo branch')
      .sort({ createdAt: -1 });

    // Process submissions to create proper review items
    const reviewItems = [];

    submissions.forEach(submission => {
      const baseSubmission = {
        ...submission.toObject(),
        student: submission.student,
        studentName: submission.studentName || submission.student?.name,
        enrollmentNo: submission.enrollmentNo || submission.student?.enrollmentNo,
        semesterType: submission.semesterType
      };

      // 1. Registration Review (if pending)
      if (submission.registrationReview?.status === 'pending') {
        reviewItems.push({
          ...baseSubmission,
          reviewType: 'registration',
          currentReviewStatus: 'pending',
          displayType: `Registration - ${submission.semesterType}`,
          submittedDate: submission.createdAt
        });
      }

      // 2. MPR Reviews (only for 7th and 8th sem internships)
      // Only show if registration is approved and MPR is actually submitted
      if (['7th_internship', '8th_internship', '8th_project'].includes(submission.semesterType) &&
        submission.registrationReview?.status === 'approved' &&
        submission.mprSubmissions) {

        const mprTypes = ['mpr1', 'mpr2', 'mpr3', 'midSem1', 'midSem2'];

        mprTypes.forEach(mprType => {
          const mprData = submission.mprSubmissions[mprType];
          // Only add if MPR is actually submitted and pending
          if (mprData &&
            mprData.document &&
            mprData.submittedAt &&
            mprData.status === 'pending') {
            reviewItems.push({
              ...baseSubmission,
              _id: `${submission._id}_${mprType}`, // Composite ID
              reviewType: 'mpr',
              mprType: mprType,
              currentReviewStatus: 'pending',
              displayType: `${mprType.toUpperCase()} Review`,
              submittedDate: mprData.submittedAt,
              originalSubmissionId: submission._id,
              mprDetails: {
                type: mprType,
                document: mprData.document,
                submittedAt: mprData.submittedAt,
                status: mprData.status
              }
            });
          }
        });
      }

      // 3. Final Report Review - Only if actually submitted and eligible
      if (submission.finalReportReview?.status === 'pending' &&
        submission.finalReport &&
        submission.finalReport.submittedAt && // Must be actually submitted
        isEligibleForFinalReportReview(submission)) {

        reviewItems.push({
          ...baseSubmission,
          reviewType: 'finalReport',
          currentReviewStatus: 'pending',
          displayType: `Final Report - ${submission.semesterType}`,
          submittedDate: submission.finalReport.submittedAt,
          finalReportDetails: submission.finalReport
        });
      }
    });

    // Add computed fields for internship submissions
    const enrichedItems = reviewItems.map(item => {
      if (['7th_internship', '8th_internship'].includes(item.semesterType)) {
        const originalSubmission = submissions.find(s => s._id.toString() === (item.originalSubmissionId || item._id));
        if (originalSubmission) {
          const mprSubmissions = originalSubmission.mprSubmissions || {};
          const mprProgress = {
            total: 5,
            submitted: Object.values(mprSubmissions).filter(mpr => mpr.document && mpr.submittedAt).length,
            approved: Object.values(mprSubmissions).filter(mpr => mpr.status === 'approved').length,
            pending: Object.values(mprSubmissions).filter(mpr => mpr.status === 'pending').length,
            rejected: Object.values(mprSubmissions).filter(mpr => mpr.status === 'rejected').length
          };
          item.mprProgress = mprProgress;
        }
      }
      return item;
    });

    console.log(`📋 Found ${enrichedItems.length} review items for mentor ${mentorId}`);
    successResponse(res, enrichedItems, 'Submissions retrieved successfully');
  } catch (error) {
    console.error('❌ Get assigned submissions error:', error);
    errorResponse(res, 'Failed to get submissions', 500);
  }
};

// FINAL FIX: getSubmissionDetails function with CORRECT stipend field mapping
// The issue is the field names in RegistrationForm.jsx vs what's saved in DB

// ─── Review helpers ──────────────────────────────────────────────────────────
const MPR_TYPES = ['mpr1', 'mpr2', 'mpr3', 'midSem1'];

// Max marks per field (must match the marks forms in ReviewSubmissions.jsx)
const MARK_LIMITS = {
  registration: {
    objectiveProblemIdentification: 5,
    proposedMethodology: 5,
    relevanceRealWorld: 5,
    synopsisPresentation: 5
  },
  midSem1: {
    dailyDiary: 10,
    expectedAchievedOutcomes: 20,
    briefReport: 30,
    presentationViva: 40
  },
  finalReport: {
    dailyDiary: 20,
    projectOutcomes: 30,
    objectiveLiteratureReview: 20,
    methodologyArea: 20,
    workDescription: 20,
    dataResultDiscussion: 20,
    overallFormatPlagiarism: 20,
    defineObjective: 20,
    contentPresentation: 20,
    presentationSkill: 20,
    socialIndustrialRelevance: 20,
    questionAnswer: 20
  }
};
const SIMPLE_MPR_MAX = 10;

const resolveReviewerName = async (reviewer) => {
  if (!reviewer) return '';
  if (reviewer.name) return reviewer.name;
  const user = await User.findById(reviewer._id || reviewer).select('name');
  return user?.name || '';
};

const cleanMarks = (limits, input) => {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Marks are required'), { status: 400 });
  }
  const cleaned = {};
  Object.entries(limits).forEach(([field, max]) => {
    const raw = input[field];
    const value = raw === undefined || raw === '' || raw === null ? 0 : Number(raw);
    if (Number.isNaN(value) || value < 0 || value > max) {
      throw Object.assign(new Error(`${field} must be between 0 and ${max}`), { status: 400 });
    }
    cleaned[field] = value;
  });
  return cleaned;
};

const buildRegistrationDetails = (plain) => {
  const data = plain.registrationData || {};
  const amount = data.stipendAmount;
  const hasStipend = data.hasStipend || (amount && Number(amount) > 0);
  return {
    ...data,
    stipend: hasStipend && amount && Number(amount) > 0 ? `₹${amount}` : 'No Stipend'
  };
};

// @desc    Get submission / review details
// @route   GET /api/mentor/submissions/:id
// ids: "<submissionId>"  or  "<submissionId>_<registration|finalReport|mpr1|mpr2|mpr3|midSem1>"
// @access  Private (Mentor only)
const getSubmissionDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const mentorId = req.user._id;

    const [submissionId, suffix] = id.split('_');
    const isMpr = MPR_TYPES.includes(suffix);
    const isRegistration = suffix === 'registration';
    const isFinalReport = suffix === 'finalReport';

    if (suffix && !isMpr && !isRegistration && !isFinalReport) {
      return errorResponse(res, 'Invalid submission reference', 400);
    }

    if (!require('mongoose').Types.ObjectId.isValid(submissionId)) {
      return errorResponse(res, 'Submission not found', 404);
    }

    const submission = await Submission.findById(submissionId)
      .populate('student', 'name email enrollmentNo branch phone')
      .populate('mentor', 'name email')
      .populate('registrationReview.reviewedBy', 'name')
      .populate('finalReportReview.reviewedBy', 'name');

    if (!submission) {
      return errorResponse(res, 'Submission not found', 404);
    }

    if (submission.mentor._id.toString() !== mentorId.toString()) {
      return errorResponse(res, 'Not authorized to view this submission', 403);
    }

    const plain = submission.toObject();

    // ─── MPR / Mid-sem review ────────────────────────────────────────────────
    if (isMpr) {
      const mprData = plain.mprSubmissions?.[suffix];
      if (!mprData) {
        return errorResponse(res, `${suffix.toUpperCase()} submission not found`, 404);
      }

      const reviewerName = await resolveReviewerName(mprData.reviewedBy);

      return successResponse(res, {
        _id: id,
        originalSubmissionId: plain._id,
        student: plain.student,
        mentor: plain.mentor,
        studentName: plain.studentName || plain.student?.name,
        enrollmentNo: plain.enrollmentNo || plain.student?.enrollmentNo,
        branch: plain.branch || plain.student?.branch,
        email: plain.email || plain.student?.email,
        phone: plain.student?.phone,
        semesterType: plain.semesterType,
        createdAt: mprData.submittedAt,
        updatedAt: mprData.reviewedAt || mprData.submittedAt,
        reviewType: 'mpr',
        currentReviewStatus: mprData.status,

        registrationData: plain.registrationData,
        registrationDetails: buildRegistrationDetails(plain),

        mprDetails: {
          type: suffix,
          document: mprData.document,
          submittedAt: mprData.submittedAt,
          status: mprData.status,
          feedback: mprData.feedback,
          reviewedAt: mprData.reviewedAt,
          reviewedBy: mprData.reviewedBy,
          marks: mprData.marks
        },

        mprType: suffix,
        feedback: mprData.feedback,
        reviewedAt: mprData.reviewedAt,
        reviewedBy: reviewerName ? { name: reviewerName } : null,

        reviewInfo: {
          status: mprData.status,
          feedback: mprData.feedback || '',
          reviewedAt: mprData.reviewedAt,
          reviewedByName: reviewerName,
          marks: mprData.marks ?? null
        }
      }, 'MPR submission details retrieved successfully');
    }

    // ─── Registration / Final report review ─────────────────────────────────
    let reviewType = 'registration';
    let currentReviewStatus = 'completed';

    if (isRegistration) {
      reviewType = 'registration';
      currentReviewStatus = plain.registrationReview?.status || 'pending';
    } else if (isFinalReport) {
      reviewType = 'finalReport';
      currentReviewStatus = plain.finalReportReview?.status || 'pending';
    } else if (plain.registrationReview?.status === 'pending') {
      reviewType = 'registration';
      currentReviewStatus = 'pending';
    } else if (plain.finalReportReview?.status === 'pending') {
      reviewType = 'finalReport';
      currentReviewStatus = 'pending';
    }

    const review = reviewType === 'registration' ? plain.registrationReview : plain.finalReportReview;
    const reviewerName = await resolveReviewerName(review?.reviewedBy);

    const submissionData = {
      ...plain,
      // History items keep their composite id so reload / edit / marks update hit the right review
      _id: isRegistration || isFinalReport ? id : plain._id,
      originalSubmissionId: plain._id,
      reviewType,
      currentReviewStatus,

      registrationData: plain.registrationData,
      registrationDetails: {
        ...buildRegistrationDetails(plain),
        reviewStatus: plain.registrationReview?.status,
        reviewFeedback: plain.registrationReview?.feedback,
        reviewedAt: plain.registrationReview?.reviewedAt,
        reviewedBy: plain.registrationReview?.reviewedBy,
        marks: plain.registrationReview?.marks
      },

      finalReportDetails: plain.finalReport ? {
        ...plain.finalReport,
        reviewStatus: plain.finalReportReview?.status,
        reviewFeedback: plain.finalReportReview?.feedback,
        reviewedAt: plain.finalReportReview?.reviewedAt,
        reviewedBy: plain.finalReportReview?.reviewedBy,
        marks: plain.finalReportReview?.marks
      } : null,

      feedback: review?.feedback,
      reviewedAt: review?.reviewedAt,
      reviewedBy: review?.reviewedBy,

      reviewInfo: {
        status: review?.status,
        feedback: review?.feedback || '',
        reviewedAt: review?.reviewedAt,
        reviewedByName: reviewerName,
        marks: review?.marks || null
      }
    };

    if (['7th_internship', '8th_internship'].includes(submission.semesterType)) {
      submissionData.allMPRApproved = submission.areAllMPRSubmissionsApproved?.() || false;
      submissionData.canApproveFinalReport = submission.isReadyForFinalReport?.() || false;
      submissionData.mprStatus = plain.mprSubmissions || {};
    }

    successResponse(res, submissionData, 'Submission details retrieved successfully');
  } catch (error) {
    console.error('❌ Get submission details error:', error);
    errorResponse(res, 'Failed to get submission details: ' + error.message, 500);
  }
};

// @desc    Edit marks / feedback of an already reviewed (approved / rejected) item
// @route   PUT /api/mentor/submissions/:id/result
// id must be "<submissionId>_<registration|finalReport|mpr1|mpr2|mpr3|midSem1>"
// @access  Private (Mentor only)
const updateReviewResult = async (req, res) => {
  try {
    const mentorId = req.user._id;
    const { id } = req.params;
    const { marks, feedback } = req.body;

    const [submissionId, suffix] = id.split('_');
    const isMpr = MPR_TYPES.includes(suffix);

    if (
      !require('mongoose').Types.ObjectId.isValid(submissionId) ||
      !(isMpr || suffix === 'registration' || suffix === 'finalReport')
    ) {
      return errorResponse(res, 'Invalid review reference', 400);
    }

    const submission = await Submission.findById(submissionId).populate('student', 'name email');
    if (!submission) {
      return errorResponse(res, 'Submission not found', 404);
    }

    if (submission.mentor.toString() !== mentorId.toString()) {
      return errorResponse(res, 'Not authorized to update this review', 403);
    }

    let review;
    if (suffix === 'registration') review = submission.registrationReview;
    else if (suffix === 'finalReport') review = submission.finalReportReview;
    else review = submission.mprSubmissions?.[suffix];

    if (!review || !['approved', 'rejected'].includes(review.status)) {
      return errorResponse(res, 'Only approved or rejected reviews can be edited here', 400);
    }

    // Feedback
    if (feedback !== undefined) {
      const text = String(feedback).trim();
      if (text.length > 1000) {
        return errorResponse(res, 'Feedback must not exceed 1000 characters', 400);
      }
      if (review.status === 'rejected' && !text) {
        return errorResponse(res, 'Feedback is required for a rejected review', 400);
      }
      review.feedback = text;
    }

    // Marks (approved reviews only)
    if (marks !== undefined && marks !== null) {
      if (review.status !== 'approved') {
        return errorResponse(res, 'Marks can only be edited for approved reviews', 400);
      }

      if (suffix === 'registration') {
        submission.registrationReview.marks = cleanMarks(MARK_LIMITS.registration, marks);
      } else if (suffix === 'finalReport') {
        submission.finalReportReview.marks = cleanMarks(MARK_LIMITS.finalReport, marks);
      } else if (suffix === 'midSem1') {
        submission.mprSubmissions.midSem1.marks = cleanMarks(MARK_LIMITS.midSem1, marks);
      } else {
        const value = Number(marks);
        if (Number.isNaN(value) || value < 0 || value > SIMPLE_MPR_MAX) {
          return errorResponse(res, `Marks must be between 0 and ${SIMPLE_MPR_MAX}`, 400);
        }
        submission.mprSubmissions[suffix].marks = value;
      }
    }

    // Totals are recalculated by the Submission pre-save hook
    await submission.save();

    try {
      const label = suffix === 'registration' ? 'Registration'
        : suffix === 'finalReport' ? 'Final Report'
          : suffix.toUpperCase();
      await emailService.sendEmail(
        submission.student.email,
        'Review Updated by Mentor',
        `Your mentor has updated the marks / feedback for your ${label} review.`
      );
    } catch (emailError) {
      console.error('Email notification error:', emailError);
    }

    successResponse(res, { id }, 'Review updated successfully');
  } catch (error) {
    console.error('❌ Update review result error:', error);
    if (error.status === 400) {
      return errorResponse(res, error.message, 400);
    }
    errorResponse(res, 'Failed to update review: ' + error.message, 500);
  }
};


// @desc    Get monthly submissions for monitoring
// @route   GET /api/mentor/monthly-submissions
// @access  Private (Mentor only)
const getMonthlySubmissions = async (req, res) => {
  try {
    const mentorId = req.user._id;
    const { studentId, month } = req.query;

    let query = {
      mentor: mentorId,
      type: 'internship',
      status: 'approved'
    };

    if (studentId) {
      query.student = studentId;
    }

    const submissions = await Submission.find(query)
      .populate('student', 'name enrollmentNo email branch')
      .lean();

    // Process monthly data
    const monthlyData = [];

    submissions.forEach(submission => {
      if (submission.monthlySubmissions && submission.monthlySubmissions.length > 0) {
        submission.monthlySubmissions.forEach(monthly => {
          if (!month || monthly.month === parseInt(month)) {
            monthlyData.push({
              submissionId: submission._id,
              student: submission.student,
              companyName: submission.companyName,
              month: monthly.month,
              placementStatus: monthly.placementStatus,
              packageAmount: monthly.packageAmount,
              submissionPPT: monthly.submissionPPT,
              submittedAt: monthly.submittedAt
            });
          }
        });
      }
    });

    // Sort by submission date (newest first)
    monthlyData.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    successResponse(res, monthlyData, 'Monthly submissions retrieved successfully');

  } catch (error) {
    console.error('Get monthly submissions error:', error);
    errorResponse(res, 'Failed to get monthly submissions', 500);
  }
};

// @desc    Get all submissions (approved, rejected) for history
// @route   GET /api/mentor/submissions/history
// @access  Private (Mentor only)
const getSubmissionHistory = async (req, res) => {
  try {
    const mentorId = req.user._id;
    const { page = 1, limit = 10, type = '', status = '' } = req.query;

    // Get all submissions for this mentor
    const allSubmissions = await Submission.find({ mentor: mentorId })
      .populate('student', 'name email enrollmentNo branch')
      .populate('registrationReview.reviewedBy', 'name')
      .populate('finalReportReview.reviewedBy', 'name')
      .sort({ updatedAt: -1 });

    const historyItems = [];

    allSubmissions.forEach(submission => {
      const baseData = {
        student: submission.student,
        studentName: submission.studentName || submission.student?.name,
        enrollmentNo: submission.enrollmentNo || submission.student?.enrollmentNo,
        branch: submission.branch || submission.student?.branch,
        semesterType: submission.semesterType,
        createdAt: submission.createdAt
      };

      // Registration History
      if (submission.registrationReview?.status && ['approved', 'rejected'].includes(submission.registrationReview.status)) {
        historyItems.push({
          _id: `${submission._id}_registration`,
          ...baseData,
          reviewType: 'registration',
          type: 'Registration Review',
          status: submission.registrationReview.status,
          reviewedAt: submission.registrationReview.reviewedAt,
          reviewedBy: submission.registrationReview.reviewedBy,
          feedback: submission.registrationReview.feedback
        });
      }

      // MPR History (only for 7th and 8th internships)
      if (['7th_internship', '8th_internship', '8th_project'].includes(submission.semesterType) && submission.mprSubmissions) {
        const mprTypes = ['mpr1', 'mpr2', 'mpr3', 'midSem1'];  // 4 docs, not 5

        mprTypes.forEach(mprType => {
          const mprData = submission.mprSubmissions[mprType];
          if (mprData && mprData.status && ['approved', 'rejected'].includes(mprData.status)) {
            historyItems.push({
              _id: `${submission._id}_${mprType}`,
              ...baseData,
              reviewType: 'mpr',
              mprType: mprType,
              type: `${mprType.toUpperCase()} Review`,
              status: mprData.status,
              reviewedAt: mprData.reviewedAt,
              reviewedBy: { name: 'Mentor' }, // You might want to store actual reviewer
              feedback: mprData.feedback
            });
          }
        });
      }

      // Final Report History
      if (submission.finalReportReview?.status && ['approved', 'rejected'].includes(submission.finalReportReview.status)) {
        historyItems.push({
          _id: `${submission._id}_finalReport`,
          ...baseData,
          reviewType: 'finalReport',
          type: 'Final Report Review',
          status: submission.finalReportReview.status,
          reviewedAt: submission.finalReportReview.reviewedAt,
          reviewedBy: submission.finalReportReview.reviewedBy,
          feedback: submission.finalReportReview.feedback
        });
      }
    });

    // Filter if type or status specified
    let filteredItems = historyItems;
    if (type) {
      filteredItems = filteredItems.filter(item => item.reviewType === type);
    }
    if (status) {
      filteredItems = filteredItems.filter(item => item.status === status);
    }

    // Sort by review date (newest first)
    filteredItems.sort((a, b) => new Date(b.reviewedAt) - new Date(a.reviewedAt));

    // Calculate pagination
    const totalItems = filteredItems.length;
    const skip = (page - 1) * limit;
    const paginatedItems = filteredItems.slice(skip, skip + parseInt(limit));

    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalItems / limit),
      itemsPerPage: parseInt(limit),
      totalItems: totalItems,
      hasNextPage: skip + parseInt(limit) < totalItems,
      hasPrevPage: page > 1
    };

    console.log(`📋 Found ${totalItems} history items for mentor, returning ${paginatedItems.length} items`);

    successResponse(res, {
      submissions: paginatedItems,
      pagination
    }, 'Submission history retrieved successfully');
  } catch (error) {
    console.error('❌ Get submission history error:', error);
    errorResponse(res, 'Failed to get submission history', 500);
  }
};



// @desc    Export assigned students data
// @route   GET /api/mentor/export/students
// @access  Private (Mentor only)
const exportAssignedStudents = async (req, res) => {
  try {
    const mentorId = req.user._id;
    const exportData = await excelService.exportMentorStudentData(mentorId);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${exportData.filename}"`);

    res.send(exportData.buffer);

  } catch (error) {
    console.error('Export assigned students error:', error);
    errorResponse(res, 'Failed to export student data', 500);
  }
};


// @desc    Send reminder for pending monthly submissions
// @route   POST /api/mentor/send-monthly-reminder
// @access  Private (Mentor only)
const sendMonthlyReminder = async (req, res) => {
  try {
    const mentorId = req.user._id;
    const { studentIds } = req.body; // Array of student IDs

    if (!studentIds || !Array.isArray(studentIds)) {
      return errorResponse(res, 'Student IDs array is required', 400);
    }

    // Get approved internship submissions for specified students
    const submissions = await Submission.find({
      mentor: mentorId,
      student: { $in: studentIds },
      type: 'internship',
      status: 'approved'
    }).populate('student', 'name email');

    let remindersSent = 0;
    const errors = [];

    for (const submission of submissions) {
      try {
        // Calculate which month is due
        const currentDate = new Date();
        const startDate = new Date(submission.startDate);
        const monthsPassed = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24 * 30)) + 1;
        const submissionsReceived = submission.monthlySubmissions.length;

        if (monthsPassed > submissionsReceived && monthsPassed <= submission.duration) {
          await emailService.sendMonthlySubmissionReminder(
            submission.student.email,
            submission.student.name,
            monthsPassed
          );
          remindersSent++;
        }
      } catch (emailError) {
        errors.push({
          studentName: submission.student.name,
          error: emailError.message
        });
      }
    }

    successResponse(res, {
      remindersSent,
      errors
    }, `Monthly reminders sent successfully to ${remindersSent} students`);

  } catch (error) {
    console.error('Send monthly reminder error:', error);
    errorResponse(res, 'Failed to send monthly reminders', 500);
  }
};

const reviewMPR = async (req, res) => {
  try {
    const { mprId } = req.params;
    const { action, feedback } = req.body;
    const mentorId = req.user.id;

    // Validate action
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be approve or reject'
      });
    }

    // Find the MPR
    const mpr = await MPR.findById(mprId)
      .populate('student', 'name email rollNumber')
      .populate('submissions');

    if (!mpr) {
      return res.status(404).json({
        success: false,
        message: 'Monthly Progress Report not found'
      });
    }

    // Verify mentor is assigned to this student
    const student = await User.findById(mpr.student._id);
    if (!student || student.mentor.toString() !== mentorId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to review this MPR'
      });
    }

    // Check if MPR is in pending status
    if (mpr.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `MPR is already ${mpr.status}`
      });
    }

    // Update MPR status
    mpr.status = action === 'approve' ? 'approved' : 'rejected';
    mpr.mentorFeedback = feedback || '';
    mpr.reviewedAt = new Date();

    await mpr.save();

    // Create notification for student
    await Notification.create({
      user: mpr.student._id,
      type: 'mpr_reviewed',
      title: `MPR ${action === 'approve' ? 'Approved' : 'Rejected'}`,
      message: `Your Monthly Progress Report for ${mpr.month}/${mpr.year} has been ${action}d by your mentor${feedback ? ' with feedback' : ''}.`,
      relatedId: mpr._id,
      relatedModel: 'MPR'
    });

    // If rejected, also update all submissions in this MPR to rejected
    if (action === 'reject') {
      await Submission.updateMany(
        { _id: { $in: mpr.submissions } },
        {
          status: 'rejected',
          mentorFeedback: feedback || 'Rejected as part of MPR review'
        }
      );
    }

    res.json({
      success: true,
      message: `MPR ${action}d successfully`,
      data: {
        mpr: {
          id: mpr._id,
          student: mpr.student,
          month: mpr.month,
          year: mpr.year,
          status: mpr.status,
          mentorFeedback: mpr.mentorFeedback,
          reviewedAt: mpr.reviewedAt
        }
      }
    });

  } catch (error) {
    console.error('Error reviewing MPR:', error);
    res.status(500).json({
      success: false,
      message: 'Error reviewing MPR',
      error: error.message
    });
  }
};

 
const getAvailableStudents = async (req, res) => {
  try {
    const { branchCode = '', search = '' } = req.query;

    const query = { role: 'student' };
    const andConditions = [];

    if (search) {
      andConditions.push({
        $or: [
          { name:         { $regex: search, $options: 'i' } },
          { email:        { $regex: search, $options: 'i' } },
          { enrollmentNo: { $regex: search, $options: 'i' } }
        ]
      });
    } else {
      andConditions.push({
        $or: [
          { assignedMentor: null },
          { assignedMentor: { $exists: false } }
        ]
      });
    }

    if (branchCode) {
      andConditions.push({ branchCode: branchCode.toLowerCase() });
    }

    if (andConditions.length) query.$and = andConditions;

    const students = await User.find(query)
      .select('-password')
      .populate('assignedMentor', 'name email')
      .sort({ enrollmentNo: 1 });

    successResponse(res, students, 'Available students retrieved');
  } catch (error) {
    console.error('getAvailableStudents error:', error);
    errorResponse(res, 'Failed to get available students', 500);
  }
};


const addStudents = async (req, res) => {
  try {
    const mentorId = req.user._id;
    const { studentIds } = req.body;
 
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return errorResponse(res, 'studentIds array is required', 400);
    }
 
    // Normalise — support both [{studentId, semester}] and ['id1','id2']
    const entries = studentIds.map(item =>
      typeof item === 'string'
        ? { studentId: item, semester: null }
        : { studentId: item.studentId, semester: item.semester || null }
    );
 
    const ids = entries.map(e => e.studentId);
 
    const mentor = await User.findById(mentorId).populate('branch', 'name');
    const currentCount = await User.countDocuments({
      role: 'student',
      assignedMentor: mentorId
    });
 
    if (currentCount + ids.length > mentor.maxStudents) {
      return errorResponse(
        res,
        `Cannot add ${ids.length} students. Capacity: ${mentor.maxStudents - currentCount} remaining`,
        400
      );
    }
 
    // Update each student individually so we can set semester per-student
    for (const { studentId, semester } of entries) {
      const updateFields = {
        assignedMentor: mentorId,
        branch: mentor.branch?._id || mentor.branch || null,
      };
      if (semester) updateFields.assignedSemester = semester;
 
      await User.findOneAndUpdate(
        {
          _id: studentId,
          role: 'student',
          // Safety check: only update if truly unassigned (prevents double-assign race)
          $or: [
            { assignedMentor: null },
            { assignedMentor: { $exists: false } }
          ]
        },
        { $set: updateFields }
      );
    }
 
    // Recount how many were actually updated (some may have been assigned concurrently)
    const newCount = await User.countDocuments({
      role: 'student',
      assignedMentor: mentorId
    });
    const actuallyAdded = newCount - currentCount;
 
    // Sync mentor's currentStudentCount to actual DB count (keeps it accurate)
    await User.findByIdAndUpdate(mentorId, {
      $set: { currentStudentCount: newCount }
    });
 
    successResponse(
      res,
      { added: actuallyAdded },
      `${actuallyAdded} students added successfully`
    );
  } catch (error) {
    console.error('addStudents error:', error);
    errorResponse(res, 'Failed to add students', 500);
  }
};


module.exports = {
  getDashboard,
  getAssignedStudents,
  getPendingSubmissions,
  reviewSubmission,
  approveRegistration,
  approveMPR,
  rejectMPR,
  approveFinalReport,
  getAssignedSubmissions,
  getSubmissionDetails,
  getMonthlySubmissions,
  exportAssignedStudents,
  handleMPRReview,
  isEligibleForFinalReportReview,
  getSubmissionHistory,
  updateSubmissionDetails,
  updateReviewResult,
  reviewMPR,
  addStudents ,
  getAvailableStudents ,
  sendMonthlyReminder,
  setDriveFolder,
  getDriveFolderStatus
};