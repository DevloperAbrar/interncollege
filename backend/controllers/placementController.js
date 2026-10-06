const mongoose = require('mongoose');
const fs = require('fs');
const User = require('../models/User');
const Submission = require('../models/Submission');
const googleDriveService = require('../services/googleDriveService');
const { successResponse, errorResponse } = require('../utils/responseHelper');

// Email is best-effort: a mail failure must never block or fail the request
let emailSvc;
try { emailSvc = require('../services/emailService'); } catch { emailSvc = null; }

const FILL_STEPS = ['placement_pending', 'placement_rejected'];
const PLACEMENT_STEPS = ['placement_pending', 'placement_submitted', 'placement_rejected'];

const PLACEMENT_TYPES = ['off_campus', 'close_campus'];
const NEXT_PLANS = ['higher_study', 'job_preparation', 'not_applicable'];
const EXAMS = ['none', 'gate', 'cat', 'gre', 'other'];

const MPR_SEMESTERS = ['7th_internship', '8th_internship', '8th_project'];
const MPR_KEYS = ['mpr1', 'mpr2', 'mpr3', 'midSem1'];

// ─── Local temp file helpers ─────────────────────────────────────────────────
const deleteLocalFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) console.error('Cleanup error:', err.message);
    });
  }
};

const cleanupFiles = (req) => {
  if (req.file) deleteLocalFile(req.file.path);
  if (req.files) Object.values(req.files).flat().forEach((f) => deleteLocalFile(f.path));
};

// ─── Drive helpers (same folder logic as the other student uploads) ─────────
const resolveMentorDriveFolder = async (mentorId) => {
  if (!mentorId) {
    return { enabled: false, reason: 'No mentor assigned yet. Please contact administrator.' };
  }

  const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!rootFolderId) {
    console.error('GOOGLE_DRIVE_FOLDER_ID is not set in environment.');
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
    }
    return { enabled: true, driveFolderId: mentorFolder.id };
  } catch (error) {
    console.error('Failed to resolve mentor Drive folder:', error.message);
    return { enabled: false, reason: 'Document storage is temporarily unavailable. Please try again later.' };
  }
};

const uploadOfferProofToDrive = async (file, student, driveFolderId) => {
  const studentData = {
    studentId: student.enrollmentNo || student._id.toString(),
    fullName: student.name,
    email: student.email
  };
  const result = await googleDriveService.uploadStudentDocuments(
    studentData,
    { offerProofDocument: file },
    driveFolderId
  );
  const uploaded = (result.uploadedFiles || []).find((f) => f.fieldName === 'offerProofDocument');
  return uploaded ? (uploaded.webViewLink || uploaded.directViewUrl || '') : '';
};

// ─── Flow migration ──────────────────────────────────────────────────────────
// New order for 7th / 8th internship and start-up: MPRs -> Placement record -> Final report.
// Students who already have all 4 documents approved and have NOT submitted a final report yet
// are moved to the placement step the next time they open the portal.
const movePlacementFirst = async (studentId) => {
  if (!studentId) return;
  try {
    const subs = await Submission.find({
      student: studentId,
      semesterType: { $in: MPR_SEMESTERS },
      currentStep: { $in: ['mpr_submissions', 'registration_approved', 'final_report_pending'] },
      'placementDetails.status': { $exists: false }
    });

    for (const s of subs) {
      const allApproved = MPR_KEYS.every((k) => s.mprSubmissions?.[k]?.status === 'approved');
      const finalReportSent = !!s.finalReport?.submittedAt;
      if (allApproved && !finalReportSent) {
        s.currentStep = 'placement_pending';
        s.status = 'approved';
        await s.save();
        console.log(`Moved submission ${s._id} to placement_pending (placement before final report)`);
      }
    }
  } catch (error) {
    console.error('movePlacementFirst error (non-critical):', error.message);
  }
};

// Submissions that were marked "completed" before the placement step existed have no
// placement data. When the student next opens the portal, the latest such submission is
// moved back to "placement_pending" so the form appears. Set to false to disable.
const REOPEN_LEGACY_COMPLETED = true;

const reopenLegacyCompleted = async (studentId) => {
  await movePlacementFirst(studentId);

  if (!REOPEN_LEGACY_COMPLETED || !studentId) return;
  try {
    // Never reopen while the student already has something in progress
    const active = await Submission.exists({ student: studentId, currentStep: { $ne: 'completed' } });
    if (active) return;

    const legacy = await Submission.findOne({
      student: studentId,
      currentStep: 'completed',
      'placementDetails.status': { $exists: false }
    }).sort({ createdAt: -1 });

    if (!legacy) return;

    legacy.currentStep = 'placement_pending';
    legacy.status = 'approved';
    legacy.completedAt = undefined;
    await legacy.save();
    console.log(`Reopened legacy completed submission ${legacy._id} for placement details`);
  } catch (error) {
    console.error('Reopen legacy completed submission error (non-critical):', error.message);
  }
};

const fireAndForget = (promiseFactory, label) => {
  if (!emailSvc) return;
  try {
    Promise.resolve(promiseFactory(emailSvc)).catch((e) =>
      console.error(`Email error (${label}, non-critical):`, e.message)
    );
  } catch (e) {
    console.error(`Email error (${label}, non-critical):`, e.message);
  }
};

const toBool = (value) => {
  if (value === true || value === 'true' || value === 'yes' || value === 'Yes') return true;
  if (value === false || value === 'false' || value === 'no' || value === 'No') return false;
  return null;
};

const text = (value) => (value === undefined || value === null ? '' : String(value).trim());

// Multipart bodies send arrays as JSON text (or a single string), so normalise it
const parseExams = (raw) => {
  if (Array.isArray(raw)) return raw.map((e) => text(e));
  if (typeof raw === 'string' && raw.trim() !== '') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map((e) => text(e));
      return [text(parsed)];
    } catch {
      return [text(raw)];
    }
  }
  return [];
};

// ─── Validate + normalise the student's payload ──────────────────────────────
// Returns { errors: { field: message }, value: {...cleaned} }
// hasDocument: true when a PDF was uploaded now OR one is already stored (resubmission)
const validatePlacementPayload = (body = {}, { hasDocument = false } = {}) => {
  const errors = {};
  const value = {};

  // 1. Have you placed in any company?
  const hasPlacement = toBool(body.hasPlacement);
  if (hasPlacement === null) {
    errors.hasPlacement = 'Please tell us whether you are placed in any company';
  }
  value.hasPlacement = hasPlacement === true;

  if (hasPlacement === true) {
    // 2. Off campus / close campus
    const placementType = text(body.placementType);
    if (!PLACEMENT_TYPES.includes(placementType)) {
      errors.placementType = 'Select off campus or close campus';
    } else {
      value.placementType = placementType;
    }

    // 3. Company name
    const companyName = text(body.companyName);
    if (companyName.length < 2) {
      errors.companyName = 'Enter the full name of the company';
    } else if (companyName.length > 150) {
      errors.companyName = 'Company name must not exceed 150 characters';
    } else {
      value.companyName = companyName;
    }

    // 4. Package (LPA)
    const rawPackage = text(body.packageLPA);
    const packageLPA = Number(rawPackage);
    if (rawPackage === '' || Number.isNaN(packageLPA) || packageLPA <= 0 || packageLPA > 1000) {
      errors.packageLPA = 'Enter the yearly package in lakhs (greater than 0)';
    } else {
      value.packageLPA = Math.round(packageLPA * 100) / 100;
    }

    // 5. Offer letter / proof: PDF upload (max 2 MB) is required
    if (!hasDocument) {
      errors.offerProofDocument = 'Upload the offer letter or proof as a PDF (max 2 MB)';
    }
    value.offerProof = '';
  } else {
    // Not placed: company fields are not stored, package is always 0
    value.packageLPA = 0;
    value.companyName = '';
    value.offerProof = '';
    value.offerProofDocument = '';
  }

  // 6. Higher study or job preparation
  const nextPlan = text(body.nextPlan);
  if (!NEXT_PLANS.includes(nextPlan)) {
    errors.nextPlan = 'Select higher study, job preparation or not applicable';
  } else {
    value.nextPlan = nextPlan;
  }

  // 7. Cleared GATE / CAT / GRE / other exam
  let exams = [...new Set(parseExams(body.clearedExams))];
  if (exams.length === 0 || exams.some((e) => !EXAMS.includes(e))) {
    errors.clearedExams = 'Select the exam(s) you have cleared, or "None"';
  } else {
    if (exams.includes('none')) exams = ['none'];
    value.clearedExams = exams;
  }

  const hasExam = Array.isArray(value.clearedExams) && !value.clearedExams.includes('none');

  if (hasExam && value.clearedExams.includes('other')) {
    const other = text(body.clearedExamOther);
    if (other.length < 2) {
      errors.clearedExamOther = 'Enter the name of the other exam';
    } else if (other.length > 100) {
      errors.clearedExamOther = 'Exam name must not exceed 100 characters';
    } else {
      value.clearedExamOther = other;
    }
  } else {
    value.clearedExamOther = '';
  }

  // 8. Score card details (raw text)
  if (hasExam) {
    const scoreCardDetails = text(body.scoreCardDetails);
    if (scoreCardDetails.length < 3) {
      errors.scoreCardDetails = 'Enter your score card details (exam, year, score or rank)';
    } else if (scoreCardDetails.length > 500) {
      errors.scoreCardDetails = 'Score card details must not exceed 500 characters';
    } else {
      value.scoreCardDetails = scoreCardDetails;
    }
  } else {
    value.scoreCardDetails = '';
  }

  return { errors, value };
};

// ═════════════════════════════════════════════════════════════════════════════
// STUDENT
// ═════════════════════════════════════════════════════════════════════════════

// @desc    Get placement form state for the logged-in student
// @route   GET /api/student/placement-details
// @access  Private (Student only)
const getMyPlacementDetails = async (req, res) => {
  try {
    await reopenLegacyCompleted(req.user._id);

    const submission = await Submission.findOne({
      student: req.user._id,
      currentStep: { $in: PLACEMENT_STEPS }
    })
      .sort({ createdAt: -1 })
      .populate('mentor', 'name email');

    if (!submission) {
      return successResponse(res, {
        eligible: false,
        reason: 'Placement record details open after your mentor approves all your MPR documents and the Mid Sem evaluation (or your final report for internships without MPRs).'
      }, 'Placement details are not open yet');
    }

    successResponse(res, {
      eligible: true,
      submissionId: submission._id,
      semesterType: submission.semesterType,
      currentStep: submission.currentStep,
      canEdit: FILL_STEPS.includes(submission.currentStep),
      placementDetails: submission.placementDetails || null,
      mentor: submission.mentor
    }, 'Placement details retrieved successfully');
  } catch (error) {
    console.error('Get placement details error:', error);
    errorResponse(res, 'Failed to load placement details', 500);
  }
};

// @desc    Submit (or resubmit after rejection) placement record details + offer letter PDF
// @route   POST /api/student/placement-details   (multipart/form-data)
// @access  Private (Student only)
const submitPlacementDetails = async (req, res) => {
  try {
    await reopenLegacyCompleted(req.user._id);

    const submission = await Submission.findOne({
      student: req.user._id,
      currentStep: { $in: FILL_STEPS }
    })
      .sort({ createdAt: -1 })
      .populate('mentor', 'name email')
      .populate('student', 'name email enrollmentNo');

    if (!submission) {
      cleanupFiles(req);
      return errorResponse(
        res,
        'Placement record details are not open for you yet. They unlock after your mentor approves your earlier documents, and cannot be changed once submitted for review.',
        400
      );
    }

    const newFile = req.files?.offerProofDocument?.[0] || null;
    const storedDocument = submission.placementDetails?.offerProofDocument || '';

    const { errors, value } = validatePlacementPayload(req.body, {
      hasDocument: !!newFile || !!storedDocument
    });
    if (Object.keys(errors).length > 0) {
      cleanupFiles(req);
      return errorResponse(res, 'Please correct the highlighted fields', 400, errors);
    }

    // ─── Offer letter / proof PDF -> mentor's Drive folder ───────────────────
    if (value.hasPlacement) {
      if (newFile) {
        const mentorId = submission.mentor?._id || submission.mentor;
        const uploadCheck = await resolveMentorDriveFolder(mentorId);
        if (!uploadCheck.enabled) {
          cleanupFiles(req);
          return errorResponse(res, uploadCheck.reason, 403);
        }

        try {
          value.offerProofDocument = await uploadOfferProofToDrive(
            newFile,
            submission.student,
            uploadCheck.driveFolderId
          );
        } catch (driveError) {
          console.error('Drive upload failed (placement offer letter):', driveError.message);
          cleanupFiles(req);
          return errorResponse(res, 'Failed to upload the document to Drive. Please try again or contact your mentor.', 500);
        }

        if (!value.offerProofDocument) {
          cleanupFiles(req);
          return errorResponse(res, 'Failed to save the uploaded document. Please try again.', 500);
        }
      } else {
        // Resubmission without a new file: keep the PDF uploaded earlier
        value.offerProofDocument = storedDocument;
      }
    }

    cleanupFiles(req);

    // Replace the whole object so stale fields from a rejected attempt never survive
    submission.placementDetails = {
      ...value,
      submittedAt: new Date(),
      status: 'pending',
      feedback: ''
    };
    submission.currentStep = 'placement_submitted';

    await submission.save();

    fireAndForget(
      (svc) => svc.sendSubmissionPending(
        submission.mentor?.email,
        submission.mentor?.name,
        submission.student?.name || submission.studentName,
        'Placement Record Details'
      ),
      'placement submitted'
    );

    successResponse(res, {
      currentStep: submission.currentStep,
      placementDetails: submission.placementDetails
    }, 'Placement record details submitted for mentor verification');
  } catch (error) {
    console.error('Submit placement details error:', error);
    cleanupFiles(req);
    errorResponse(res, 'Failed to submit placement details. Please try again.', 500);
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// MENTOR
// ═════════════════════════════════════════════════════════════════════════════

// @desc    List placement details of this mentor's students
// @route   GET /api/mentor/placement-details?status=pending|approved|rejected|all
// @access  Private (Mentor only)
const listPlacementDetails = async (req, res) => {
  try {
    const mentorId = req.user._id;
    const status = ['pending', 'approved', 'rejected', 'all'].includes(req.query.status)
      ? req.query.status
      : 'pending';

    const submissions = await Submission.find({
      mentor: mentorId,
      'placementDetails.status': { $exists: true }
    })
      .populate('student', 'name email enrollmentNo phone')
      .populate('placementDetails.reviewedBy', 'name')
      .sort({ updatedAt: -1 })
      .lean();

    const counts = { pending: 0, approved: 0, rejected: 0 };
    submissions.forEach((s) => {
      const st = s.placementDetails?.status;
      if (counts[st] !== undefined) counts[st] += 1;
    });

    const items = submissions
      .filter((s) => status === 'all' || s.placementDetails?.status === status)
      .map((s) => ({
        _id: s._id,
        studentName: s.studentName || s.student?.name || '',
        enrollmentNo: s.enrollmentNo || s.student?.enrollmentNo || '',
        email: s.email || s.student?.email || '',
        phone: s.registrationData?.studentMobileNumber || s.student?.phone || '',
        branch: s.branch || '',
        semesterType: s.semesterType,
        organization: s.registrationData?.companyName || s.registrationData?.projectTitle || '',
        currentStep: s.currentStep,
        placementDetails: s.placementDetails
      }));

    successResponse(res, { items, counts }, 'Placement details retrieved successfully');
  } catch (error) {
    console.error('List placement details error:', error);
    errorResponse(res, 'Failed to load placement details', 500);
  }
};

// @desc    Approve or reject a student's placement record details
// @route   PUT /api/mentor/placement-details/:id/review
// @access  Private (Mentor only)
const reviewPlacementDetails = async (req, res) => {
  try {
    const mentorId = req.user._id;
    const { id } = req.params;
    const { action } = req.body;
    const feedback = text(req.body.feedback);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 'Submission not found', 404);
    }
    if (!['approve', 'reject'].includes(action)) {
      return errorResponse(res, 'Invalid action. Must be approve or reject', 400);
    }
    if (feedback.length > 1000) {
      return errorResponse(res, 'Feedback must not exceed 1000 characters', 400);
    }
    if (action === 'reject' && !feedback) {
      return errorResponse(res, 'Feedback is required when rejecting placement details', 400);
    }

    const submission = await Submission.findById(id).populate('student', 'name email');
    if (!submission) {
      return errorResponse(res, 'Submission not found', 404);
    }
    if (submission.mentor.toString() !== mentorId.toString()) {
      return errorResponse(res, 'Not authorized to review this submission', 403);
    }
    if (submission.currentStep !== 'placement_submitted' || submission.placementDetails?.status !== 'pending') {
      return errorResponse(res, 'These placement details are not waiting for review', 400);
    }

    submission.placementDetails.feedback = feedback;
    submission.placementDetails.reviewedBy = mentorId;
    submission.placementDetails.reviewedAt = new Date();

    let completed = false;

    if (action === 'approve') {
      submission.placementDetails.status = 'approved';

      // MPR flow: placement is approved BEFORE the final report, so the final report unlocks now.
      // Internships without MPRs (and older records) already have an approved final report,
      // so approving the placement record completes them.
      const finalReportDone =
        submission.finalReport?.status === 'approved' ||
        submission.finalReportReview?.status === 'approved';

      if (finalReportDone) {
        submission.currentStep = 'completed';
        submission.status = 'completed';
        submission.completedAt = new Date();
        completed = true;
      } else {
        submission.currentStep = 'final_report_pending';
        submission.status = 'approved';
      }
    } else {
      submission.placementDetails.status = 'rejected';
      submission.currentStep = 'placement_rejected';
    }

    await submission.save();

    fireAndForget(
      (svc) => action === 'approve'
        ? svc.sendSubmissionApproved(submission.student.email, submission.student.name, 'Placement Record Details', feedback)
        : svc.sendSubmissionRejected(submission.student.email, submission.student.name, 'Placement Record Details', feedback),
      'placement review'
    );

    successResponse(
      res,
      { id: submission._id, currentStep: submission.currentStep },
      action === 'approve'
        ? (completed
          ? 'Placement record approved. Submission marked as completed.'
          : 'Placement record approved. The student can now submit the final report.')
        : 'Placement record rejected. The student can correct and resubmit.'
    );
  } catch (error) {
    console.error('Review placement details error:', error);
    errorResponse(res, 'Failed to review placement details: ' + error.message, 500);
  }
};

module.exports = {
  reopenLegacyCompleted,
  getMyPlacementDetails,
  submitPlacementDetails,
  listPlacementDetails,
  reviewPlacementDetails
};