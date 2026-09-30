const mongoose = require('mongoose');
const Submission = require('../models/Submission');
const { successResponse, errorResponse } = require('../utils/responseHelper');

// Email is best-effort: a mail failure must never block or fail the request
let emailSvc;
try { emailSvc = require('../services/emailService'); } catch { emailSvc = null; }

const FILL_STEPS = ['placement_pending', 'placement_rejected'];
const PLACEMENT_STEPS = ['placement_pending', 'placement_submitted', 'placement_rejected'];

const PLACEMENT_TYPES = ['off_campus', 'close_campus'];
const NEXT_PLANS = ['higher_study', 'job_preparation', 'not_applicable'];
const EXAMS = ['none', 'gate', 'cat', 'gre', 'other'];

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

// ─── Validate + normalise the student's payload ──────────────────────────────
// Returns { errors: { field: message }, value: {...cleaned} }
const validatePlacementPayload = (body = {}) => {
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

    // 5. Offer letter / proof (raw text, no upload)
    const offerProof = text(body.offerProof);
    if (offerProof.length < 3) {
      errors.offerProof = 'Enter the offer letter reference or proof details';
    } else if (offerProof.length > 500) {
      errors.offerProof = 'Offer letter / proof details must not exceed 500 characters';
    } else {
      value.offerProof = offerProof;
    }
  } else {
    // Not placed: company fields are not stored, package is always 0
    value.packageLPA = 0;
    value.companyName = '';
    value.offerProof = '';
  }

  // 6. Higher study or job preparation
  const nextPlan = text(body.nextPlan);
  if (!NEXT_PLANS.includes(nextPlan)) {
    errors.nextPlan = 'Select higher study, job preparation or not applicable';
  } else {
    value.nextPlan = nextPlan;
  }

  // 7. Cleared GATE / CAT / GRE / other exam
  let exams = Array.isArray(body.clearedExams) ? body.clearedExams.map((e) => text(e)) : [];
  exams = [...new Set(exams)];
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

  // 8. Score card details (raw text, no upload)
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
    const submission = await Submission.findOne({
      student: req.user._id,
      currentStep: { $in: PLACEMENT_STEPS }
    })
      .sort({ createdAt: -1 })
      .populate('mentor', 'name email');

    if (!submission) {
      return successResponse(res, {
        eligible: false,
        reason: 'Placement details open after your final report is approved by your mentor.'
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

// @desc    Submit (or resubmit after rejection) placement details
// @route   POST /api/student/placement-details
// @access  Private (Student only)
const submitPlacementDetails = async (req, res) => {
  try {
    const submission = await Submission.findOne({
      student: req.user._id,
      currentStep: { $in: FILL_STEPS }
    })
      .sort({ createdAt: -1 })
      .populate('mentor', 'name email')
      .populate('student', 'name email');

    if (!submission) {
      return errorResponse(
        res,
        'Placement details are not open for you. They unlock after your final report is approved, and cannot be changed once submitted for review.',
        400
      );
    }

    const { errors, value } = validatePlacementPayload(req.body);
    if (Object.keys(errors).length > 0) {
      return errorResponse(res, 'Please correct the highlighted fields', 400, errors);
    }

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
        'Placement Details'
      ),
      'placement submitted'
    );

    successResponse(res, {
      currentStep: submission.currentStep,
      placementDetails: submission.placementDetails
    }, 'Placement details submitted for mentor verification');
  } catch (error) {
    console.error('Submit placement details error:', error);
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

// @desc    Approve or reject a student's placement details
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

    if (action === 'approve') {
      submission.placementDetails.status = 'approved';
      // Internship / project is complete only after this verification
      submission.currentStep = 'completed';
      submission.status = 'completed';
      submission.completedAt = new Date();
    } else {
      submission.placementDetails.status = 'rejected';
      submission.currentStep = 'placement_rejected';
    }

    await submission.save();

    fireAndForget(
      (svc) => action === 'approve'
        ? svc.sendSubmissionApproved(submission.student.email, submission.student.name, 'Placement Details', feedback)
        : svc.sendSubmissionRejected(submission.student.email, submission.student.name, 'Placement Details', feedback),
      'placement review'
    );

    successResponse(
      res,
      { id: submission._id, currentStep: submission.currentStep },
      action === 'approve'
        ? 'Placement details approved. Submission marked as completed.'
        : 'Placement details rejected. The student can correct and resubmit.'
    );
  } catch (error) {
    console.error('Review placement details error:', error);
    errorResponse(res, 'Failed to review placement details: ' + error.message, 500);
  }
};

module.exports = {
  getMyPlacementDetails,
  submitPlacementDetails,
  listPlacementDetails,
  reviewPlacementDetails
};