const mongoose = require('mongoose');

const marksBreakdownSchema = new mongoose.Schema({
  objectiveProblemIdentification: { type: Number, min: 0, max: 5, default: 0 },
  proposedMethodology: { type: Number, min: 0, max: 5, default: 0 },
  relevanceRealWorld: { type: Number, min: 0, max: 5, default: 0 },
  synopsisPresentation: { type: Number, min: 0, max: 5, default: 0 },
  totalRegistrationMarks: { type: Number, min: 0, max: 20, default: 0 }
}, { _id: false });

const midSemMarksSchema = new mongoose.Schema({
  dailyDiary: { type: Number, min: 0, max: 10, default: 0 },
  expectedAchievedOutcomes: { type: Number, min: 0, max: 20, default: 0 },
  briefReport: { type: Number, min: 0, max: 30, default: 0 },
  presentationViva: { type: Number, min: 0, max: 50, default: 0 },
  total: { type: Number, min: 0, max: 100, default: 0 }
}, { _id: false });

const finalReportMarksSchema = new mongoose.Schema({
  dailyDiary: { type: Number, min: 0, max: 20, default: 0 },
  projectOutcomes: { type: Number, min: 0, max: 30, default: 0 },
  objectiveLiteratureReview: { type: Number, min: 0, max: 20, default: 0 },
  methodologyArea: { type: Number, min: 0, max: 20, default: 0 },
  workDescription: { type: Number, min: 0, max: 20, default: 0 },
  dataResultDiscussion: { type: Number, min: 0, max: 20, default: 0 },
  overallFormatPlagiarism: { type: Number, min: 0, max: 20, default: 0 },
  totalReportMarks: { type: Number, min: 0, max: 100, default: 0 },
  defineObjective: { type: Number, min: 0, max: 20, default: 0 },
  contentPresentation: { type: Number, min: 0, max: 20, default: 0 },
  presentationSkill: { type: Number, min: 0, max: 20, default: 0 },
  socialIndustrialRelevance: { type: Number, min: 0, max: 20, default: 0 },
  questionAnswer: { type: Number, min: 0, max: 20, default: 0 },
  totalPresentationMarks: { type: Number, min: 0, max: 100, default: 0 },
  grandTotal: { type: Number, min: 0, max: 250, default: 0 }
}, { _id: false });

const mprEntrySchema = {
  document: String,
  submittedAt: Date,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  feedback: String,
  reviewedAt: Date,
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  marks: { type: Number, min: 0, max: 10, default: 0 }
};

const submissionSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  semesterType: {
    type: String,
    enum: ['6th_internship', '7th_internship', '8th_internship', '8th_project', 'any_internship'],
    required: true
  },

  isSubsequentSubmission: { type: Boolean, default: false },
  previousSubmission: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission' },

  currentStep: {
    type: String,
    enum: ['registration_pending', 'registration_rejected', 'registration_approved', 'mpr_submissions', 'final_report_pending', 'final_report_rejected', 'completed'],
    default: 'registration_pending'
  },

  status: { type: String, enum: ['pending', 'approved', 'rejected', 'completed'], default: 'pending' },

  studentName: { type: String, required: true },
  email: { type: String, required: true },
  enrollmentNo: { type: String, default: '' },
  branch: { type: String, default: '' },

  registrationData: {
    companyName: String,
    companyType: { type: String, enum: ['startup', 'mnc', 'government', 'psu', 'academic_institute', 'research', 'other'] },
    internshipType: String,
    internshipTitle: String,
    startDate: Date,
    endDate: Date,
    duration: Number,
    studentMobileNumber: String,
    mentorRole: String,
    mentorContactNumber: String,
    companyFullAddress: String,
    typeOfWork: String,
    internshipDomain: String,
    hasStipend: { type: Boolean, default: false },
    stipendAmount: Number,
    stipendProof: String,
    mentorName: String,
    mentorEmail: String,
    hrName: String,
    hrEmail: String,
    offerLetter: String,
    nocLetter: String,
    projectTitle: String,
    projectType: { type: String, enum: ['software', 'hardware', 'software_hardware', 'experimental'] },
    projectReport: String
  },

  // ─── MPR: 3 monthly reports + 1 mid-semester (for 7th & 8th internship) ───
  mprSubmissions: {
    mpr1: mprEntrySchema,
    mpr2: mprEntrySchema,
    mpr3: mprEntrySchema,
    // Only 1 mid-semester evaluation
    midSem1: {
      document: String,
      submittedAt: Date,
      status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
      feedback: String,
      reviewedAt: Date,
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      marks: midSemMarksSchema
    }
  },

  finalReport: {
    finalPPT: String,
    finalReport: String,
    certificate: String,
    finalMPR: String,
    hasPPO: Boolean,
    ppoAmount: Number,
    ppoOfferLetter: String,
    conferenceLink: String,
    researchPaperStatus: { type: String, enum: ['published', 'accepted'] },
    hasPlacement: Boolean,
    placementFrom: { type: String, enum: ['college', 'off_campus'] },
    ppoOfferLetterProject: String,
    conferencePaymentProof: String,
    conferenceCertificate: String,
    finalProjectReport: String,
    publishedPaperCopy: String,
    submittedAt: Date,
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    feedback: String
  },

  registrationReview: {
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    feedback: String,
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    marks: marksBreakdownSchema
  },

  finalReportReview: {
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    feedback: String,
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    marks: finalReportMarksSchema
  },

  hasPendingMPRReviews: { type: Boolean, default: false },
  completedAt: Date
}, { timestamps: true });

// ─── Pre-save middleware ────────────────────────────────────────────────────
submissionSchema.pre('save', function (next) {
  if (this.registrationData?.startDate && this.registrationData?.endDate) {
    const start = new Date(this.registrationData.startDate);
    const end = new Date(this.registrationData.endDate);
    this.registrationData.duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24 * 30));
  }

  if (this.currentStep === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }

  if (this.registrationReview?.marks) {
    const m = this.registrationReview.marks;
    m.totalRegistrationMarks =
      (m.objectiveProblemIdentification || 0) +
      (m.proposedMethodology || 0) +
      (m.relevanceRealWorld || 0) +
      (m.synopsisPresentation || 0);
  }

  if (this.mprSubmissions?.midSem1?.marks) {
    const m = this.mprSubmissions.midSem1.marks;
    m.total = (m.dailyDiary || 0) + (m.expectedAchievedOutcomes || 0) + (m.briefReport || 0) + (m.presentationViva || 0);
  }

  if (this.finalReportReview?.marks) {
    const m = this.finalReportReview.marks;
    m.totalReportMarks =
      (m.objectiveLiteratureReview || 0) + (m.methodologyArea || 0) + (m.workDescription || 0) +
      (m.dataResultDiscussion || 0) + (m.overallFormatPlagiarism || 0);
    m.totalPresentationMarks =
      (m.defineObjective || 0) + (m.contentPresentation || 0) + (m.presentationSkill || 0) +
      (m.socialIndustrialRelevance || 0) + (m.questionAnswer || 0);
    m.grandTotal =
      (m.dailyDiary || 0) + (m.projectOutcomes || 0) + m.totalReportMarks + m.totalPresentationMarks;
  }

  next();
});

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * All 4 documents (mpr1, mpr2, mpr3, midSem1) must be approved
 * for 7th/8th internship to proceed to final report.
 */
submissionSchema.methods.areAllMPRSubmissionsApproved = function () {
  if (!['7th_internship', '8th_internship', '8th_project'].includes(this.semesterType)) return true;
  const s = this.mprSubmissions || {};
  return (
    s.mpr1?.status === 'approved' &&
    s.mpr2?.status === 'approved' &&
    s.mpr3?.status === 'approved' &&
    s.midSem1?.status === 'approved'
  );
};

submissionSchema.methods.isReadyForFinalReport = function () {
  if (this.registrationReview?.status !== 'approved') return false;
  if (['6th_internship', 'any_internship'].includes(this.semesterType)) return true;
  if (['7th_internship', '8th_internship', '8th_project'].includes(this.semesterType)) return this.areAllMPRSubmissionsApproved();
  return false;
};

submissionSchema.statics.getRequiredFieldsBySemester = function (semesterType) {
  const baseInternshipFields = ['companyName', 'companyType', 'internshipType', 'internshipTitle', 'startDate', 'endDate'];
  switch (semesterType) {
    case '6th_internship':
    case 'any_internship':
      return {
        registration: [...baseInternshipFields, 'studentMobileNumber', 'mentorName', 'mentorEmail', 'hrName', 'hrEmail', 'offerLetter', 'nocLetter'],
        finalReport: ['finalPPT', 'finalReport', 'certificate']
      };
    case '7th_internship':
    case '8th_internship':
      return {
        registration: [...baseInternshipFields, 'studentMobileNumber', 'mentorName', 'mentorEmail', 'hrName', 'hrEmail', 'offerLetter', 'nocLetter'],
        // 3 MPRs + 1 midSem
        mprSubmissions: ['mpr1', 'mpr2', 'mpr3', 'midSem1'],
        finalReport: ['finalMPR', 'finalReport', 'certificate']
      };
    case '8th_project':
      return {
        registration: ['projectTitle', 'projectType', 'projectReport'],
        mprSubmissions: ['mpr1', 'mpr2', 'mpr3', 'midSem1'],   // ← ADD THIS LINE
        finalReport: ['conferenceLink', 'researchPaperStatus', 'conferenceCertificate', 'finalProjectReport', 'publishedPaperCopy']
      };
    default:
      return {};
  }
};

submissionSchema.statics.getNextAvailableSemester = function (currentSemesterType) {
  // No progression anymore — only 8th sem submissions are allowed, and they're terminal
  return [];
};

submissionSchema.statics.canRegisterForSemester = async function (studentId, semesterType) {
  const validTypes = ['any_internship', '6th_internship', '7th_internship', '8th_internship', '8th_project'];
  if (!validTypes.includes(semesterType)) return false;
  const completedSubmissions = await this.find({ student: studentId, currentStep: 'completed' });
  return !completedSubmissions.some(s => s.semesterType === semesterType);
};
// Indexes
submissionSchema.index({ student: 1, semesterType: 1 });
submissionSchema.index({ student: 1, currentStep: 1 });
submissionSchema.index({ mentor: 1, status: 1 });
submissionSchema.index({ status: 1, createdAt: -1 });
submissionSchema.index({ currentStep: 1 });

module.exports = mongoose.model('Submission', submissionSchema);