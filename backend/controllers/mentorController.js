const User = require('../models/User');
const Submission = require('../models/Submission');
const excelService = require('../services/excelService');
const emailService = require('../services/emailService');
const { successResponse, errorResponse, getPaginationData } = require('../utils/responseHelper');
const googleDriveService = require('../services/googleDriveService');

// ─── Resolve (or create) this mentor's own folder inside the centralized Drive ──
const resolveOwnDriveFolder = async (mentorId) => {
  const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!rootFolderId) {
    throw new Error('GOOGLE_DRIVE_FOLDER_ID is not set in environment.');
  }

  const mentor = await User.findById(mentorId).select('name');
  const sanitizedMentorName = (mentor?.name || 'Unknown_Mentor')
    .replace(/[^a-zA-Z0-9\s]/g, '_')
    .replace(/\s+/g, '_');
  const mentorFolderName = `${sanitizedMentorName}_${mentorId}`;

  let mentorFolder = await googleDriveService.findFolderByName(mentorFolderName, rootFolderId);
  if (!mentorFolder) {
    mentorFolder = await googleDriveService.createFolder(mentorFolderName, rootFolderId);
  }
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


const updateSubmissionDetails = async (req, res) => {
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
      return errorResponse(res, 'Submission not found', 404);
    }

    if (submission.mentor.toString() !== mentorId.toString()) {
      return errorResponse(res, 'Not authorized to update this submission', 403);
    }

    const student = await User.findById(submission.student);

    // Handle file uploads
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
          mentorFolderId
        );

        if (uploadResults.uploadedFiles) {
          uploadResults.uploadedFiles.forEach(file => {
            uploadedFiles[file.fieldName] = file.webViewLink;
          });
        }
      } catch (uploadError) {
        console.error('File upload error:', uploadError);
      }
    }
    // Update based on type
    if (updateType === 'registration') {
      const updatedData = { ...req.body };
      delete updatedData.updateType;
      Object.assign(updatedData, uploadedFiles);

      submission.registrationData = {
        ...submission.registrationData,
        ...updatedData
      };

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
    errorResponse(res, 'Failed to update submission: ' + error.message, 500);
  }
};

// @desc    Get mentor dashboard
// @route   GET /api/mentor/dashboard
// @access  Private (Mentor only)reviewSubmission
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
        console.log('🎉 All 4 MPRs approved! Student can now submit final report');
        submission.hasPendingMPRReviews = false;
        // ✅ CRITICAL: update currentStep so frontend unlocks final report
        submission.currentStep = 'registration_approved';
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
          submission.currentStep = 'completed';
          submission.status = 'completed';
          submission.completedAt = new Date();
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
      const reviewType = mprType ? `${mprType.toUpperCase()} MPR` :
        submission.currentStep.includes('final') ? 'Final Report' : 'Registration';

      await emailService.sendEmail(
        submission.student.email,
        `Submission ${action === 'approve' ? 'Approved' : 'Rejected'}`,
        `Your ${reviewType} has been ${action}d by your mentor.\n\nFeedback: ${feedback || 'No feedback provided'}`
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

    // If all MPRs are approved, move to final report phase
    if (allMPRApproved) {
      submission.currentStep = 'final_report_pending';
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

    // Mark as completed
    submission.currentStep = 'completed';
    submission.status = 'completed';

    await submission.save();

    // Send completion email
    try {
      await emailService.sendSubmissionCompleted(
        submission.student.email,
        submission.student.name,
        submission.semesterType
      );
    } catch (emailError) {
      console.error('Email notification error:', emailError);
    }

    console.log(`✅ Final report approved and submission completed for ${submission.student.name}`);
    successResponse(res, submission, 'Final report approved and submission completed');
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

const getSubmissionDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const mentorId = req.user._id;

    console.log(`🔍 Getting submission details for: ${id}`);

    // Check if this is an MPR review request
    if (id.includes('_')) {
      const [originalSubmissionId, mprType] = id.split('_');

      const submission = await Submission.findById(originalSubmissionId)
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

      const mprData = submission.mprSubmissions?.[mprType];
      if (!mprData) {
        return errorResponse(res, `${mprType.toUpperCase()} submission not found`, 404);
      }

      // Send COMPLETE registration data with MPR
      const mprSubmissionDetails = {
        _id: id,
        student: submission.student,
        mentor: submission.mentor,
        studentName: submission.studentName || submission.student?.name,
        enrollmentNo: submission.enrollmentNo || submission.student?.enrollmentNo,
        branch: submission.branch || submission.student?.branch,
        email: submission.email || submission.student?.email,
        phone: submission.student?.phone,
        semesterType: submission.semesterType,
        createdAt: mprData.submittedAt,
        updatedAt: mprData.submittedAt,
        reviewType: 'mpr',
        currentReviewStatus: mprData.status,

        // COMPLETE registration data - send EVERYTHING
        registrationData: submission.registrationData, // Send the entire object
        registrationDetails: {
          ...submission.registrationData, // Spread all fields
          // Computed/formatted fields
          duration: submission.registrationData?.duration,
          stipend: (() => {
            const amount = submission.registrationData?.stipendAmount;
            const hasStipend = submission.registrationData?.hasStipend || (amount && Number(amount) > 0);
            return hasStipend && amount && Number(amount) > 0 ? `₹${amount}` : 'No Stipend';
          })()
        },

        mprDetails: {
          type: mprType,
          document: mprData.document,
          submittedAt: mprData.submittedAt,
          status: mprData.status,
          feedback: mprData.feedback,
          reviewedAt: mprData.reviewedAt,
          reviewedBy: mprData.reviewedBy,
          marks: mprData.marks
        },

        mprType: mprType,
        feedback: mprData.feedback,
        reviewedAt: mprData.reviewedAt,
        reviewedBy: mprData.reviewedBy ? { name: 'Mentor' } : null
      };

      console.log(`✅ MPR details retrieved for ${mprType}`);
      return successResponse(res, mprSubmissionDetails, 'MPR submission details retrieved successfully');
    }

    // Handle regular submission details (Registration or Final Report)
    const submission = await Submission.findById(id)
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

    // Determine current review type and status
    let currentReviewStatus = 'completed';
    let reviewType = 'registration';

    if (submission.registrationReview.status === 'pending') {
      currentReviewStatus = 'pending';
      reviewType = 'registration';
    } else if (submission.finalReportReview.status === 'pending') {
      currentReviewStatus = 'pending';
      reviewType = 'finalReport';
    }

    const submissionData = {
      ...submission.toObject(),
      reviewType,
      currentReviewStatus,

      // Send COMPLETE registration data - ALL fields
      registrationData: submission.registrationData, // Entire object
      registrationDetails: {
        ...submission.registrationData, // Spread all fields
        // Add computed fields
        duration: submission.registrationData?.duration,
        stipend: (() => {
          const amount = submission.registrationData?.stipendAmount;
          const hasStipend = submission.registrationData?.hasStipend || (amount && Number(amount) > 0);
          return hasStipend && amount && Number(amount) > 0 ? `₹${amount}` : 'No Stipend';
        })(),
        reviewStatus: submission.registrationReview?.status,
        reviewFeedback: submission.registrationReview?.feedback,
        reviewedAt: submission.registrationReview?.reviewedAt,
        reviewedBy: submission.registrationReview?.reviewedBy,
        marks: submission.registrationReview?.marks
      },

      // Send COMPLETE final report data - ALL fields
      finalReportDetails: submission.finalReport ? {
        ...submission.finalReport, // Spread all fields from finalReport
        reviewStatus: submission.finalReportReview?.status,
        reviewFeedback: submission.finalReportReview?.feedback,
        reviewedAt: submission.finalReportReview?.reviewedAt,
        reviewedBy: submission.finalReportReview?.reviewedBy,
        marks: submission.finalReportReview?.marks
      } : null,

      feedback: reviewType === 'registration' ?
        submission.registrationReview.feedback :
        submission.finalReportReview.feedback,
      reviewedAt: reviewType === 'registration' ?
        submission.registrationReview.reviewedAt :
        submission.finalReportReview.reviewedAt,
      reviewedBy: reviewType === 'registration' ?
        submission.registrationReview.reviewedBy :
        submission.finalReportReview.reviewedBy
    };

    // Add MPR status for 7th/8th internships
    if (['7th_internship', '8th_internship'].includes(submission.semesterType)) {
      submissionData.allMPRApproved = submission.areAllMPRSubmissionsApproved?.() || false;
      submissionData.canApproveFinalReport = submission.isReadyForFinalReport?.() || false;
      submissionData.mprStatus = submission.mprSubmissions || {};
    }

    console.log(`✅ Submission details retrieved for ${reviewType} review`);
    successResponse(res, submissionData, 'Submission details retrieved successfully');
  } catch (error) {
    console.error('❌ Get submission details error:', error);
    errorResponse(res, 'Failed to get submission details: ' + error.message, 500);
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
      // When actively searching by name/email/enrollment, show matches
      // REGARDLESS of assignment status — so a mentor/dept-admin can see
      // "this student is already assigned to X" instead of it just
      // disappearing or (worse) letting them add it again.
      andConditions.push({
        $or: [
          { name:         { $regex: search, $options: 'i' } },
          { email:        { $regex: search, $options: 'i' } },
          { enrollmentNo: { $regex: search, $options: 'i' } }
        ]
      });
    } else {
      // Default browsing view (no search term typed): only show
      // students who don't have a mentor yet.
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
      .populate('assignedMentor', 'name email') // so the frontend can show "Already assigned to <name>"
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
  reviewMPR,
  addStudents ,
  getAvailableStudents ,
  sendMonthlyReminder,
  setDriveFolder,
  getDriveFolderStatus
};