const User = require('../models/User');
const Submission = require('../models/Submission');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const googleDriveService = require('../services/googleDriveService');
const fs = require('fs');

// ─── Safe email helper ────────────────────────────────────────────────────────
let emailSvc;
try { emailSvc = require('../services/emailService'); } catch { emailSvc = null; }
const sendEmail = async (to, mentorName, studentName, type) => {
  try {
    if (emailSvc && to) await emailSvc.sendSubmissionPending(to, mentorName, studentName, type);
  } catch (e) { console.error('Email error (non-critical):', e.message); }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const deleteLocalFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) console.error('Cleanup error:', err.message);
    });
  }
};

const cleanupFiles = (req) => {
  if (req.file) deleteLocalFile(req.file.path);
  if (req.files) Object.values(req.files).flat().forEach(f => deleteLocalFile(f.path));
};

// ─── Check if mentor has a connected Drive folder ────────────────────────
// ─── Resolve (or create) this mentor's folder inside the centralized Drive ──
const resolveMentorDriveFolder = async (mentorId) => {
  if (!mentorId) {
    return { enabled: false, reason: 'No mentor assigned yet. Please contact administrator.' };
  }

  const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!rootFolderId) {
    console.error('❌ GOOGLE_DRIVE_FOLDER_ID is not set in environment.');
    return { enabled: false, reason: 'Document storage is not configured. Please contact administrator.' };
  }

  const mentor = await User.findById(mentorId).select('name');
  if (!mentor) {
    return { enabled: false, reason: 'Assigned mentor not found.' };
  }

  try {
    const sanitizedMentorName = (mentor.name || 'Unknown_Mentor')
      .replace(/[^a-zA-Z0-9\s]/g, '_')
      .replace(/\s+/g, '_');
    const mentorFolderName = `${sanitizedMentorName}_${mentor._id}`;

    let mentorFolder = await googleDriveService.findFolderByName(mentorFolderName, rootFolderId);
    if (!mentorFolder) {
      mentorFolder = await googleDriveService.createFolder(mentorFolderName, rootFolderId);
      console.log(`📁 Created mentor folder in centralized Drive: ${mentorFolderName}`);
    }

    return { enabled: true, driveFolderId: mentorFolder.id };
  } catch (error) {
    console.error('❌ Failed to resolve mentor Drive folder:', error.message);
    return { enabled: false, reason: 'Document storage is temporarily unavailable. Please try again later.' };
  }
};

// ─── Upload all files in req.files / req.file to mentor's Drive folder ──
// Returns a map: { fieldName: driveViewLink }
const uploadFilesToDrive = async (req, student, driveFolderId) => {
  const filesToUpload = {};
  if (req.files) {
    Object.entries(req.files).forEach(([fieldName, fileArray]) => {
      if (fileArray?.[0]) filesToUpload[fieldName] = fileArray[0];
    });
  }
  if (req.file) filesToUpload[req.file.fieldname] = req.file;

  if (Object.keys(filesToUpload).length === 0) return {};

  const studentData = {
    studentId: student.enrollmentNo || student._id.toString(),
    fullName: student.name,
    email: student.email
  };

  const uploadResults = await googleDriveService.uploadStudentDocuments(
    studentData,
    filesToUpload,
    driveFolderId
  );

  // Map back fieldName -> viewable link
  const fieldUrls = {};
  (uploadResults.uploadedFiles || []).forEach(f => {
    fieldUrls[f.fieldName] = f.webViewLink || f.directViewUrl;
  });

  if (uploadResults.errors && uploadResults.errors.length > 0) {
    console.error('⚠️ Some files failed to upload to Drive:', uploadResults.errors);
  }

  return fieldUrls;
};

// ─── Semester → available choices ─────────────────────────────────────────────
const getSemesterChoicesForStudent = (semesterNumber, completedSubmissions, assignedSemester) => {
  const completedTypes = new Set(completedSubmissions.map(s => s.semesterType))
  const validTypes = ['any_internship', '6th_internship', '7th_internship', '8th_internship', '8th_project']

  // If mentor assigned a specific semester type, that's the only option — regardless of which one it is
  if (assignedSemester && validTypes.includes(assignedSemester) && !completedTypes.has(assignedSemester)) {
    return [assignedSemester]
  }

  // Fallback for students with no assignedSemester: only offer 8th-sem options once they reach semester 8
  const sem = parseInt(semesterNumber) || 0
  if (sem < 8) return []

  return ['8th_internship', '8th_project'].filter(s => !completedTypes.has(s))
}

// ─── GET /api/student/dashboard ──────────────────────────────────────────────
const getDashboard = async (req, res) => {
  try {
    const studentId = req.user._id;
    const student = await User.findById(studentId)
      .populate('assignedMentor', 'name email')
      .populate('branch', 'name')
      .select('-password')

    const allSubmissions = await Submission.find({ student: studentId })
      .populate('mentor', 'name email')
      .sort({ createdAt: -1 });

    const submission = allSubmissions.find(s => s.currentStep !== 'completed');
    const completedSubmissions = allSubmissions.filter(s => s.currentStep === 'completed');

    const availableSemesters = getSemesterChoicesForStudent(
      student?.semester,
      completedSubmissions,
      student?.assignedSemester
    )

    // ─── uploads enabled flag based on mentor's drive connection ───────
    // ─── uploads enabled flag: mentor assigned + centralized Drive configured ──
    const uploadsEnabled = !!student?.assignedMentor && !!process.env.GOOGLE_DRIVE_FOLDER_ID;
    const uploadsClosedReason = !uploadsEnabled
      ? (student?.assignedMentor
          ? 'Document storage is not configured. Please contact administrator.'
          : 'No mentor assigned yet.')
      : null;

    successResponse(res, {
      student,
      submission,
      hasSubmission: !!submission,
      semesterType: submission?.semesterType || null,
      currentStep: submission?.currentStep || null,
      submissionStatus: submission?.status || null,
      allSubmissions,
      completedSubmissions,
      availableSemesters,
      canRegisterNew: !submission && availableSemesters.length > 0,
      totalCompleted: completedSubmissions.length,
      uploadsEnabled,
      uploadsClosedReason
    }, 'Dashboard data retrieved successfully');
  } catch (error) {
    console.error('Get student dashboard error:', error);
    errorResponse(res, 'Failed to get dashboard data', 500);
  }
};

// ─── POST /api/student/submit/registration ────────────────────────────────────
const submitRegistration = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { semesterType, ...bodyData } = req.body;

    const activeSubmission = await Submission.findOne({
      student: studentId,
      currentStep: { $ne: 'completed' }
    });

    if (activeSubmission) {
      if (activeSubmission.registrationReview?.status !== 'rejected' &&
        activeSubmission.currentStep !== 'registration_rejected') {
        cleanupFiles(req);
        return errorResponse(res, 'You have an active submission in progress. Please complete it first.', 400);
      }
      await Submission.findByIdAndDelete(activeSubmission._id);
    }

    const canRegister = await Submission.canRegisterForSemester(studentId, semesterType);
    if (!canRegister) {
      cleanupFiles(req);
      return errorResponse(res, 'You cannot register for this semester type yet.', 400);
    }

    const student = await User.findById(studentId).populate('assignedMentor');
    if (!student.assignedMentor) {
      cleanupFiles(req);
      return errorResponse(res, 'No mentor assigned. Please contact administrator.', 400);
    }

    // ─── gate on mentor's Drive connection ──────────────────────────────
    const uploadCheck = await resolveMentorDriveFolder(student.assignedMentor._id);
    if (!uploadCheck.enabled) {
      cleanupFiles(req);
      return errorResponse(res, uploadCheck.reason, 403);
    }

    // ─── upload files to mentor's Drive folder ─
    let fileUrls = {};
    try {
      fileUrls = await uploadFilesToDrive(req, student, uploadCheck.driveFolderId);
    } catch (driveError) {
      console.error('❌ Drive upload failed:', driveError.message);
      cleanupFiles(req);
      return errorResponse(res, 'Failed to upload documents to Drive. Please try again or contact your mentor.', 500);
    }

    // ── Build clean registration data ─────────────────────────────────────────
    const cleanedData = {};

    if (semesterType === '8th_project') {
      if (bodyData.projectTitle) cleanedData.projectTitle = bodyData.projectTitle;
      if (bodyData.projectType) cleanedData.projectType = bodyData.projectType;
      if (fileUrls.projectReport) cleanedData.projectReport = fileUrls.projectReport;
    } else {
      const internshipFields = [
        'companyName', 'companyType', 'internshipType', 'internshipTitle',
        'startDate', 'endDate', 'studentMobileNumber', 'mentorName', 'mentorRole',
        'mentorContactNumber', 'mentorEmail', 'hrName', 'hrEmail',
        'companyFullAddress', 'typeOfWork', 'internshipDomain'
      ];
      internshipFields.forEach(field => {
        if (bodyData[field] !== undefined) cleanedData[field] = bodyData[field];
      });

      if (fileUrls.offerLetter) cleanedData.offerLetter = fileUrls.offerLetter;
      if (fileUrls.noc || fileUrls.nocLetter) cleanedData.nocLetter = fileUrls.noc || fileUrls.nocLetter;

      cleanedData.hasStipend =
        bodyData.hasStipend === 'true' || bodyData.hasStipend === true ||
        (bodyData.stipendAmount && Number(bodyData.stipendAmount) > 0);

      if (cleanedData.hasStipend) {
        const amount = bodyData.stipendAmount || bodyData.stipendPerMonth;
        if (amount) cleanedData.stipendAmount = Number(amount);
        if (fileUrls.stipendProof) cleanedData.stipendProof = fileUrls.stipendProof;
      }
    }

    let branchName = student.branch
    if (!branchName && student.assignedMentor?.branch) {
      const mentorWithBranch = await User.findById(student.assignedMentor._id)
        .populate('branch', 'name')
      branchName = mentorWithBranch?.branch?.name || ''
    }

    const submission = new Submission({
      student: studentId,
      mentor: student.assignedMentor._id,
      semesterType,
      currentStep: 'registration_pending',
      studentName: student.name,
      enrollmentNo: student.enrollmentNo || '',
      email: student.email,
      branch: branchName || '',
      registrationData: cleanedData,
      registrationReview: { status: 'pending' }
    });

    await submission.save();
    await sendEmail(student.assignedMentor.email, student.assignedMentor.name, student.name, `${semesterType} Registration`);
    successResponse(res, submission, 'Registration submitted successfully');

  } catch (error) {
    console.error('Submit registration error:', error);
    cleanupFiles(req);
    errorResponse(res, 'Failed to submit registration form. Please try again.', 500);
  }
};

// ─── POST /api/student/submit/mpr ─────────────────────────────────────────────
const submitMPR = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { mprType } = req.body;

    if (!mprType) return errorResponse(res, 'MPR type is required', 400);

    const validMPRTypes = ['mpr1', 'mpr2', 'mpr3', 'midSem1'];
    if (!validMPRTypes.includes(mprType)) {
      return errorResponse(res, 'Invalid MPR type. Valid: mpr1, mpr2, mpr3, midSem1', 400);
    }

    const submission = await Submission.findOne({
      student: studentId,
      semesterType: { $in: ['7th_internship', '8th_internship', '8th_project'] },
      status: 'approved'
    }).populate('student', 'name email enrollmentNo branch');

    if (!submission) return errorResponse(res, 'No approved internship found or registration not approved yet', 400);

    if (submission.mprSubmissions?.[mprType]?.status === 'approved') {
      return errorResponse(res, `${mprType.toUpperCase()} already submitted and approved`, 400);
    }

    // ─── gate on mentor's Drive connection ──────────────────────────────
    const uploadCheck = await resolveMentorDriveFolder(submission.mentor);
    if (!uploadCheck.enabled) {
      cleanupFiles(req);
      return errorResponse(res, uploadCheck.reason, 403);
    }

    const uploadedFile =
      req.file ||
      req.files?.document?.[0] ||
      req.files?.file?.[0] ||
      (req.files ? Object.values(req.files).flat()[0] : null);

    if (!uploadedFile) return errorResponse(res, 'Document file is required', 400);

    // ─── upload to mentor's Drive folder ─────────────────────────────
    let documentUrl;
    try {
      const studentInfo = {
        _id: submission.student._id,
        name: submission.student.name || submission.studentName,
        email: submission.student.email || submission.email,
        enrollmentNo: submission.student.enrollmentNo || submission.enrollmentNo
      };
      const fileUrls = await uploadFilesToDrive(req, studentInfo, uploadCheck.driveFolderId);
      documentUrl = fileUrls[uploadedFile.fieldname] || Object.values(fileUrls)[0];
      if (!documentUrl) throw new Error('Upload succeeded but no link was returned');
    } catch (driveError) {
      console.error('❌ Drive upload failed (MPR):', driveError.message);
      cleanupFiles(req);
      return errorResponse(res, 'Failed to upload document to Drive. Please try again or contact your mentor.', 500);
    }

    console.log(`📎 MPR file saved to Drive: ${documentUrl}`);

    if (!submission.mprSubmissions) submission.mprSubmissions = {};
    submission.mprSubmissions[mprType] = {
      document: documentUrl,
      submittedAt: new Date(),
      status: 'pending'
    };

    if (submission.currentStep === 'registration_approved') submission.currentStep = 'mpr_submissions';
    submission.hasPendingMPRReviews = true;
    await submission.save();

    const mentor = await User.findById(submission.mentor);
    await sendEmail(
      mentor?.email, mentor?.name,
      submission.student?.name || submission.studentName,
      `${mprType.toUpperCase()} - ${submission.semesterType}`
    );

    successResponse(res, {
      mprType, status: 'pending', submittedAt: new Date(), document: documentUrl
    }, `${mprType.toUpperCase()} submitted successfully`);

  } catch (error) {
    console.error('Submit MPR error:', error);
    cleanupFiles(req);
    errorResponse(res, 'Failed to submit MPR document: ' + error.message, 500);
  }
};

// ─── POST /api/student/submit/final-report ────────────────────────────────────
const submitFinalReport = async (req, res) => {
  try {
    const studentId = req.user._id;

    const submission = await Submission.findOne({
      student: studentId,
      currentStep: { $ne: 'completed' }
    }).sort({ createdAt: -1 });

    if (!submission) return errorResponse(res, 'No active submission found', 404);

    const { semesterType, currentStep } = submission;
    let canSubmit = false;
    let reason = '';

    if (['6th_internship', 'any_internship'].includes(semesterType)) {
      canSubmit = ['registration_approved', 'final_report_pending', 'final_report_rejected'].includes(currentStep);
      if (!canSubmit) reason = 'Registration must be approved first';
    } else if (['7th_internship', '8th_internship', '8th_project'].includes(semesterType)) {
      const mprSubs = submission.mprSubmissions || {};
      const required = ['mpr1', 'mpr2', 'mpr3', 'midSem1'];
      const approved = required.filter(t => mprSubs[t]?.status === 'approved');
      const allApproved = approved.length === 4;
      canSubmit =
        ['final_report_pending', 'final_report_rejected'].includes(currentStep) ||
        (allApproved && ['mpr_submissions', 'registration_approved'].includes(currentStep));
      if (!canSubmit) reason = allApproved
        ? 'Registration must be approved first'
        : `All 4 documents must be approved first. Currently: ${approved.length}/4`;
    }

    if (!canSubmit) return errorResponse(res, reason || 'Cannot submit final report at this stage', 400);

    // ─── gate on mentor's Drive connection ──────────────────────────────
    const uploadCheck = await resolveMentorDriveFolder(submission.mentor);
    if (!uploadCheck.enabled) {
      cleanupFiles(req);
      return errorResponse(res, uploadCheck.reason, 403);
    }

    const student = await User.findById(studentId);

    // ─── upload files to mentor's Drive folder ───────────────────────────
    let fileUrls = {};
    try {
      fileUrls = await uploadFilesToDrive(req, student, uploadCheck.driveFolderId);
    } catch (driveError) {
      console.error('❌ Drive upload failed (final report):', driveError.message);
      cleanupFiles(req);
      return errorResponse(res, 'Failed to upload documents to Drive. Please try again or contact your mentor.', 500);
    }

    const finalReportData = { ...req.body, ...fileUrls };
    delete finalReportData.semesterType;

    submission.finalReport = { ...submission.finalReport, ...finalReportData, submittedAt: new Date() };
    submission.finalReportReview = { status: 'pending', reviewedBy: null, reviewedAt: null, feedback: '' };
    submission.currentStep = 'final_report_pending';
    await submission.save();

    const mentor = await User.findById(submission.mentor);
    await sendEmail(mentor?.email, mentor?.name, student?.name, `Final Report - ${semesterType}`);

    successResponse(res, submission, 'Final report submitted successfully');

  } catch (error) {
    console.error('Submit final report error:', error);
    cleanupFiles(req);
    errorResponse(res, 'Failed to submit final report. Please try again.', 500);
  }
};

// ─── GET /api/student/progress ────────────────────────────────────────────────
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
        finalReportReview: activeSubmission.finalReportReview
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

// ─── PUT /api/student/submission/:id ─────────────────────────────────────────
const updateSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user._id;
    const { updateType } = req.body;

    const submission = await Submission.findOne({ _id: id, student: studentId });
    if (!submission) return errorResponse(res, 'Submission not found', 404);

    if (updateType === 'registration' && submission.currentStep !== 'registration_rejected') {
      return errorResponse(res, 'Registration cannot be updated at this stage', 400);
    }
    if (updateType === 'finalReport' && submission.currentStep !== 'final_report_rejected') {
      return errorResponse(res, 'Final report cannot be updated at this stage', 400);
    }

    // ─── gate on mentor's Drive connection ──────────────────────────────
    const uploadCheck = await resolveMentorDriveFolder(submission.mentor);
    if (!uploadCheck.enabled) {
      cleanupFiles(req);
      return errorResponse(res, uploadCheck.reason, 403);
    }

    const student = await User.findById(studentId);

    // ─── upload files to mentor's Drive folder ───────────────────────────
    let fileUrls = {};
    try {
      fileUrls = await uploadFilesToDrive(req, student, uploadCheck.driveFolderId);
    } catch (driveError) {
      console.error('❌ Drive upload failed (update submission):', driveError.message);
      cleanupFiles(req);
      return errorResponse(res, 'Failed to upload documents to Drive. Please try again or contact your mentor.', 500);
    }

    if (updateType === 'registration') {
      const updatedData = { ...req.body, ...fileUrls };
      delete updatedData.updateType;
      submission.registrationData = { ...submission.registrationData, ...updatedData };
      submission.currentStep = 'registration_pending';
      submission.registrationReview.status = 'pending';
      submission.registrationReview.feedback = '';
      submission.registrationReview.reviewedAt = undefined;
    } else if (updateType === 'finalReport') {
      const updatedData = { ...req.body, ...fileUrls };
      delete updatedData.updateType;
      submission.finalReport = {
        ...submission.finalReport, ...updatedData,
        submittedAt: new Date(), status: 'pending'
      };
      submission.currentStep = 'final_report_pending';
      submission.finalReportReview.status = 'pending';
      submission.finalReportReview.feedback = '';
      submission.finalReportReview.reviewedAt = undefined;
    }

    await submission.save();

    const mentor = await User.findById(submission.mentor);
    await sendEmail(mentor?.email, mentor?.name, student?.name, `${updateType} Update - ${submission.semesterType}`);

    successResponse(res, submission, 'Submission updated successfully');
  } catch (error) {
    console.error('Update submission error:', error);
    cleanupFiles(req);
    errorResponse(res, 'Failed to update submission', 500);
  }
};

// ─── Approval helper (used by mentorController) ───────────────────────────────
const handleRegistrationApproval = async (submissionId, mentorId) => {
  const submission = await Submission.findById(submissionId);
  if (!submission) throw new Error('Submission not found');
  submission.registrationReview.status = 'approved';
  submission.registrationReview.reviewedBy = mentorId;
  submission.registrationReview.reviewedAt = new Date();
  submission.status = 'approved';
  submission.currentStep = ['7th_internship', '8th_internship', '8th_project'].includes(submission.semesterType)
    ? 'mpr_submissions' : 'registration_approved';
  await submission.save();
  return submission;
};

// ─── GET /api/student/history ─────────────────────────────────────────────────
const getSubmissionHistory = async (req, res) => {
  try {
    const studentId = req.user._id;
    const submissions = await Submission.find({ student: studentId })
      .sort({ createdAt: -1 }).populate('mentor', 'name email');
    const completedSubmissions = submissions.filter(s => s.currentStep === 'completed');
    const activeSubmission = submissions.find(s => s.currentStep !== 'completed');
    const student = await User.findById(studentId);
    const availableSemesters = getSemesterChoicesForStudent(
      student?.semester,
      completedSubmissions,
      student?.assignedSemester
    )

    successResponse(res, {
      submissions, completedSubmissions, activeSubmission,
      availableSemesters,
      canRegisterNew: !activeSubmission && availableSemesters.length > 0,
      totalCompleted: completedSubmissions.length
    }, 'Submission history retrieved successfully');
  } catch (error) {
    console.error('Get submission history error:', error);
    errorResponse(res, 'Failed to get submission history', 500);
  }
};

module.exports = {
  getDashboard, submitRegistration, submitMPR, submitFinalReport,
  getProgress, handleRegistrationApproval, updateSubmission, getSubmissionHistory
};