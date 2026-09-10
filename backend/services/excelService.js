const XLSX = require('xlsx');
const User = require('../models/User');
const Submission = require('../models/Submission');
const moment = require('moment');

class ExcelService {

  // ─── ADDED: Base URL for absolute file links in Excel ─────────────────────
  constructor() {
    this.BASE_URL = process.env.BACKEND_URL || 'http://localhost:5000';
  }

  // ─── ADDED: Converts /uploads/x/y.pdf → http://localhost:5000/uploads/x/y.pdf
  toAbsoluteUrl(relPath) {
    if (!relPath) return '';
    if (relPath.startsWith('http')) return relPath;
    return `${this.BASE_URL}${relPath.startsWith('/') ? '' : '/'}${relPath}`;
  }

  // ─── ADDED: Scans every field in a row and makes /uploads/... paths absolute
  makeUrlsAbsolute(baseData) {
    Object.keys(baseData).forEach(key => {
      const k = key.toLowerCase();
      if (
        k.includes('url') ||
        k.includes('document') ||
        k.includes('letter') ||
        k.includes('certificate') ||
        k.includes('ppt') ||
        k.includes('proof') ||
        k.includes('report') ||
        k.includes('offer')
      ) {
        if (typeof baseData[key] === 'string' && baseData[key].startsWith('/uploads')) {
          baseData[key] = this.toAbsoluteUrl(baseData[key]);
        }
      }
    });
    return baseData;
  }

  // Helper method to safely get document URL
  getDocumentURL(obj, path) {
    const keys = path.split('.');
    let current = obj;
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return '';
      }
    }
    return current || '';
  }

  getMarksValue(submission, ...paths) {
    for (const path of paths) {
      const value = this.getDocumentURL(submission, path);
      if (value !== '' && value !== null && value !== undefined && !isNaN(value)) {
        return Number(value);
      }
    }
    return 0;
  }


  getRegistrationMarks(submission) {
    const marks = submission.registrationReview?.marks || {};

    return {
      objectiveProblemIdentification: this.getMarksValue(
        submission,
        'registrationReview.marks.objectiveProblemIdentification'
      ) || 0,
      proposedMethodology: this.getMarksValue(
        submission,
        'registrationReview.marks.proposedMethodology'
      ) || 0,
      relevanceRealWorld: this.getMarksValue(
        submission,
        'registrationReview.marks.relevanceRealWorld'
      ) || 0,
      synopsisPresentation: this.getMarksValue(
        submission,
        'registrationReview.marks.synopsisPresentation'
      ) || 0,
      total: this.getMarksValue(
        submission,
        'registrationReview.marks.totalRegistrationMarks'
      ) || 0
    };
  }

  getMPRMarks(submission, mprType) {
    if (!submission.mprSubmissions || !submission.mprSubmissions[mprType]) {
      return 0;
    }

    const mprData = submission.mprSubmissions[mprType];

    // Check if it's a simple marks field (number) or detailed breakdown (object)
    if (typeof mprData.marks === 'number') {
      return mprData.marks || 0;
    }

    // For midSem, return the total
    if (mprData.marks && typeof mprData.marks === 'object') {
      return mprData.marks.total || 0;
    }

    return 0;
  }
  getMidSemMarks(submission, mprType) {
    if (!submission.mprSubmissions || !submission.mprSubmissions[mprType]) {
      return {
        dailyDiary: 0,
        expectedAchievedOutcomes: 0,
        briefReport: 0,
        presentationViva: 0,
        total: 0
      };
    }
    const marks = submission.mprSubmissions[mprType].marks || {};

    return {
      dailyDiary: marks.dailyDiary || 0,
      expectedAchievedOutcomes: marks.expectedAchievedOutcomes || 0,
      briefReport: marks.briefReport || 0,
      presentationViva: marks.presentationViva || 0,
      total: marks.total || 0
    };
  }

  getFinalReportMarks(submission) {
    const marks = submission.finalReportReview?.marks || {};

    return {
      dailyDiary: marks.dailyDiary || 0,
      projectOutcomes: marks.projectOutcomes || 0,
      objectiveLiteratureReview: marks.objectiveLiteratureReview || 0,
      methodologyArea: marks.methodologyArea || 0,
      workDescription: marks.workDescription || 0,
      dataResultDiscussion: marks.dataResultDiscussion || 0,
      overallFormatPlagiarism: marks.overallFormatPlagiarism || 0,
      totalReportMarks: marks.totalReportMarks || 0,
      defineObjective: marks.defineObjective || 0,
      contentPresentation: marks.contentPresentation || 0,
      presentationSkill: marks.presentationSkill || 0,
      socialIndustrialRelevance: marks.socialIndustrialRelevance || 0,
      questionAnswer: marks.questionAnswer || 0,
      totalPresentationMarks: marks.totalPresentationMarks || 0,
      grandTotal: marks.grandTotal || 0
    };
  }

  // Helper method to format date safely
  formatDate(date, format = 'DD/MM/YYYY HH:mm') {
    if (!date) return '';
    return moment(date).format(format);
  }

  // Helper method to get MPR progress
  getMPRProgress(mprSubmissions) {
    if (!mprSubmissions) {
      return {
        submitted: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        total: 5
      };
    }

    const mprTypes = ['mpr1', 'mpr2', 'mpr3', 'midSem1', 'midSem2'];
    let submitted = 0, approved = 0, pending = 0, rejected = 0;

    mprTypes.forEach(type => {
      const mpr = mprSubmissions[type];
      if (mpr && mpr.document && mpr.submittedAt) {
        submitted++;
        if (mpr.status === 'approved') approved++;
        else if (mpr.status === 'pending') pending++;
        else if (mpr.status === 'rejected') rejected++;
      }
    });

    return { submitted, approved, pending, rejected, total: 5 };
  }

  // Enhanced method to extract final report documents with better field mapping
  getFinalReportDocuments(finalReportData) {
    const documents = {};

    if (!finalReportData) return documents;

    // Helper to extract URL from different formats
    const getUrl = (value) => {
      if (typeof value === 'string' && value.trim()) return value;
      if (value && typeof value === 'object') {
        return value.url || value.link || value.fileUrl || value.documentUrl || '';
      }
      return '';
    };

    // Enhanced paths for final report documents
    const finalReportPaths = {
      finalReportDocument: [
        'document', 'finalReport', 'reportDocument', 'projectReport', 'finalReportDocument'
      ],
      ppoOffer: [
        'ppoOffer', 'ppo', 'placementOffer', 'jobOffer', 'offerLetter', 'ppoOfferDocument'
      ],
      finalPPT: [
        'finalPPT', 'presentationPPT', 'finalPresentation', 'projectPPT', 'finalPresentationPPT'
      ],
      certificate: [
        'certificate', 'completionCertificate', 'internshipCertificate', 'certificateDocument'
      ],
      evaluationReport: [
        'evaluationReport', 'evaluation', 'performanceReport', 'evaluationDocument'
      ],
      additionalDocuments: [
        'additionalDocuments', 'otherDocuments', 'extraDocuments', 'miscDocuments'
      ]
    };

    // Extract each document type with better searching
    Object.entries(finalReportPaths).forEach(([docType, paths]) => {
      documents[docType] = '';

      // Try each path
      for (const path of paths) {
        const value = this.getDocumentURL(finalReportData, path);
        if (value) {
          documents[docType] = getUrl(value);
          break;
        }
      }

      // If not found, try direct access
      if (!documents[docType] && finalReportData[docType]) {
        documents[docType] = getUrl(finalReportData[docType]);
      }

      // Additional check for nested objects
      if (!documents[docType] && typeof finalReportData === 'object') {
        Object.keys(finalReportData).forEach(key => {
          if (key.toLowerCase().includes(docType.toLowerCase()) && finalReportData[key]) {
            documents[docType] = getUrl(finalReportData[key]);
          }
        });
      }
    });

    return documents;
  }

  // Enhanced method to get all document URLs with better field mapping
  getAllDocumentURLs(registrationData) {
    const documents = {};

    if (!registrationData) return documents;

    // Helper to extract URL from different formats
    const getUrl = (value) => {
      if (typeof value === 'string' && value.trim()) return value;
      if (value && typeof value === 'object') {
        return value.url || value.link || value.fileUrl || value.documentUrl || '';
      }
      return '';
    };

    // Enhanced document path mappings
    const documentPaths = {
      noc: [
        'noc', 'nocDocument', 'noc_document', 'documents.noc', 'documents.nocDocument',
        'documents.noc_document', 'NOC', 'nocDoc', 'no_objection_certificate'
      ],
      offerLetter: [
        'offerLetter', 'offer_letter', 'offerLetterDocument', 'documents.offerLetter',
        'internshipOffer', 'jobOffer', 'companyOffer'
      ],
      stipendProof: [
        'stipendProof', 'stipend_proof', 'stipendDocument', 'documents.stipendProof',
        'salarySlip', 'paymentProof', 'stipendSlip'
      ],
      projectPPT: [
        'projectPPT', 'project_ppt', 'presentationPPT', 'documents.projectPPT',
        'projectPresentation', 'pptDocument'
      ],
      joiningLetter: [
        'joiningLetter', 'joining_letter', 'joiningDocument', 'documents.joiningLetter',
        'appointmentLetter', 'joiningDoc'
      ],
      completionCertificate: [
        'completionCertificate', 'completion_certificate', 'documents.completionCertificate',
        'internshipCertificate', 'certificateCompletion'
      ],
      projectReport: [
        'projectReport', 'project_report', 'documents.projectReport',
        'finalReport', 'internshipReport', 'reportDocument'
      ],
      presentationSlides: [
        'presentationSlides', 'presentation_slides', 'documents.presentationSlides',
        'finalPresentation', 'slidesDocument'
      ],
      internshipCertificate: [
        'internshipCertificate', 'internship_certificate', 'documents.internshipCertificate',
        'certificate', 'internshipDoc'
      ],
      recommendationLetter: [
        'recommendationLetter', 'recommendation_letter', 'documents.recommendationLetter',
        'referenceDocument', 'recommendationDoc'
      ],
      workSamples: [
        'workSamples', 'work_samples', 'documents.workSamples',
        'portfolioSamples', 'workPortfolio'
      ],
      additionalDocuments: [
        'additionalDocuments', 'additional_documents', 'documents.additionalDocuments',
        'otherDocuments', 'extraDocuments', 'miscDocuments'
      ]
    };

    // Extract each document type with comprehensive searching
    Object.entries(documentPaths).forEach(([docType, paths]) => {
      documents[docType] = '';

      // Try each predefined path
      for (const path of paths) {
        const value = this.getDocumentURL(registrationData, path);
        if (value) {
          documents[docType] = getUrl(value);
          break;
        }
      }

      // If not found, try direct access
      if (!documents[docType] && registrationData[docType]) {
        documents[docType] = getUrl(registrationData[docType]);
      }

      // Final fallback - search all keys for partial matches
      if (!documents[docType] && typeof registrationData === 'object') {
        Object.keys(registrationData).forEach(key => {
          const keyLower = key.toLowerCase();
          const docTypeLower = docType.toLowerCase();

          if (keyLower.includes(docTypeLower) ||
            (docTypeLower === 'noc' && keyLower.includes('objection')) ||
            (docTypeLower === 'offerletter' && keyLower.includes('offer')) ||
            (docTypeLower === 'stipendproof' && keyLower.includes('stipend')) ||
            (docTypeLower === 'projectppt' && (keyLower.includes('ppt') || keyLower.includes('presentation'))) ||
            (docTypeLower === 'joiningleetter' && keyLower.includes('joining')) ||
            (docTypeLower === 'completioncertificate' && keyLower.includes('completion')) ||
            (docTypeLower === 'projectreport' && keyLower.includes('report')) ||
            (docTypeLower === 'presentationslides' && keyLower.includes('slides')) ||
            (docTypeLower === 'internshipcertificate' && keyLower.includes('certificate')) ||
            (docTypeLower === 'recommendationletter' && keyLower.includes('recommendation')) ||
            (docTypeLower === 'worksamples' && keyLower.includes('work')) ||
            (docTypeLower === 'additionaldocuments' && (keyLower.includes('additional') || keyLower.includes('other')))) {

            if (registrationData[key]) {
              documents[docType] = getUrl(registrationData[key]);
            }
          }
        });
      }
    });

    return documents;
  }

  // Export all student data for admin with comprehensive details
  // ─── CHANGED: added studentIds = null parameter for department filtering ──
  async exportAllStudentData(studentIds = null) {
    try {
      console.log('Starting comprehensive student data export...');

      // ─── CHANGED: use studentIds filter if provided, else get all students
      // ─── CHANGED: use studentIds filter if provided, else get all students
      const studentQuery = studentIds
        ? { role: 'student', _id: { $in: studentIds } }
        : { role: 'student' };

      const submissionQuery = studentIds
        ? { student: { $in: studentIds } }
        : {};

      const students = await User.find(studentQuery)
        .populate('assignedMentor', 'name email phone')
        .lean();

      const submissions = await Submission.find(submissionQuery)
        .populate('student', 'name enrollmentNo email branch phone')
        .populate('registrationReview.reviewedBy', 'name')
        .populate('finalReportReview.reviewedBy', 'name')
        .lean();

      // Create submission map for easy lookup
      const submissionMap = {};
      submissions.forEach(sub => {
        if (sub.student && sub.student._id) {
          submissionMap[sub.student._id.toString()] = sub;
        }
      });

      console.log(`Processing ${students.length} students and ${submissions.length} submissions...`);

      // Prepare comprehensive data for Excel
      const excelData = students.map(student => {
        const submission = submissionMap[student._id.toString()];

        // Base student information with ALL required fields
        const baseData = {
          'Student Name': student.name || '',
          'Enrollment No': student.enrollmentNo || '',
          'Email': student.email || '',
          'Branch': student.branch || '',
          'Phone': student.phone || '',
          'Mentor Name': student.assignedMentor?.name || 'Not Assigned',
          'Mentor Email': student.assignedMentor?.email || '',
          'Mentor Phone': student.assignedMentor?.phone || '',
          'Account Status': student.isActive ? 'Active' : 'Inactive',
          'Student Registration Date': this.formatDate(student.createdAt),
        };

        if (submission) {
          // Get final report documents with enhanced extraction
          const finalReportDocs = this.getFinalReportDocuments(submission.finalReport);

          // Basic submission information
          Object.assign(baseData, {
            'Semester Type': submission.semesterType || '',
            'Current Step': submission.currentStep || '',
            'Overall Status': submission.status || '',
            'Submission Created Date': this.formatDate(submission.createdAt),
            'Last Updated': this.formatDate(submission.updatedAt),

            // Registration Review Details
            'Registration Status': submission.registrationReview?.status || 'Not Started',
            'Registration Reviewed Date': this.formatDate(submission.registrationReview?.reviewedAt),
            'Registration Reviewed By': submission.registrationReview?.reviewedBy?.name || '',
            'Registration Feedback': submission.registrationReview?.feedback || '',

            // Final Report Review Details with enhanced document extraction
            'Final Report Status': submission.finalReportReview?.status || 'Not Started',
            'Final Report Reviewed Date': this.formatDate(submission.finalReportReview?.reviewedAt),
            'Final Report Reviewed By': submission.finalReportReview?.reviewedBy?.name || '',
            'Final Report Feedback': submission.finalReportReview?.feedback || '',
            'Final Report Submitted Date': this.formatDate(submission.finalReport?.submittedAt),
            'Final Report Document URL': finalReportDocs.finalReportDocument || this.getDocumentURL(submission, 'finalReport.document'),
            'PPO Offer Document URL': finalReportDocs.ppoOffer || '',
            'Final PPT Document URL': finalReportDocs.finalPPT || '',
            'Final Completion Certificate URL': finalReportDocs.certificate || '',
            'Final Evaluation Report URL': finalReportDocs.evaluationReport || '',
            'Final Additional Documents URL': finalReportDocs.additionalDocuments || ''
          });

          // Get ALL document URLs from registration data with enhanced extraction
          const allDocuments = this.getAllDocumentURLs(submission.registrationData);

          // Add all document fields to Excel
          Object.assign(baseData, {
            'Offer Letter Document URL': allDocuments.offerLetter || '',
            'NOC Document URL': allDocuments.noc || '',
            'Stipend Proof Document URL': allDocuments.stipendProof || '',
            'Project PPT Document URL': allDocuments.projectPPT || '',
            'Joining Letter Document URL': allDocuments.joiningLetter || '',
            'Completion Certificate Document URL': allDocuments.completionCertificate || '',
            'Project Report Document URL': allDocuments.projectReport || '',
            'Presentation Slides Document URL': allDocuments.presentationSlides || '',
            'Internship Certificate Document URL': allDocuments.internshipCertificate || '',
            'Recommendation Letter Document URL': allDocuments.recommendationLetter || '',
            'Work Samples Document URL': allDocuments.workSamples || '',
            'Registration Additional Documents URL': allDocuments.additionalDocuments || ''
          });

          // Detailed Registration/Company Information with ALL fields
          if (submission.registrationData) {
            Object.assign(baseData, {
              'Company Name': submission.registrationData.companyName || '',
              'Company Address': submission.registrationData.companyAddress || '',
              'Internship Title': submission.registrationData.internshipTitle || '',
              'Industry Type': submission.registrationData.industryType || '',
              'Internship Type': submission.registrationData.internshipType || '',
              'Start Date': this.formatDate(submission.registrationData.startDate, 'DD/MM/YYYY'),
              'End Date': this.formatDate(submission.registrationData.endDate, 'DD/MM/YYYY'),
              'Duration (Months)': submission.registrationData.duration || '',
              'Stipend Per Month': submission.registrationData.stipendPerMonth || '',
              'PPO Amount': submission.registrationData.ppoAmount || submission.registrationData.packageAmount || '',
              'Job Offer Received': submission.registrationData.jobOfferReceived || '',

              // Industry Contact Details - ALL fields
              'Industry Mentor Name': submission.registrationData.mentorName || submission.registrationData.industryMentorName || '',
              'Industry Mentor Email': submission.registrationData.industryMentorEmail || submission.registrationData.mentorEmail || '',
              'Industry Mentor Phone': submission.registrationData.industryMentorPhone || submission.registrationData.mentorPhone || '',
              'HR Name': submission.registrationData.hrName || '',
              'HR Email': submission.registrationData.hrEmail || '',
              'HR Phone': submission.registrationData.hrPhone || '',

              // Project Details
              'Project Title': submission.registrationData.projectTitle || '',
              'Project Type': submission.registrationData.projectType || '',
              'Project Description': submission.registrationData.projectDescription || '',

              // Additional registration fields that might exist
              'Company Website': submission.registrationData.companyWebsite || '',
              'Company Size': submission.registrationData.companySize || '',
              'Technology Stack': submission.registrationData.technologyStack || submission.registrationData.technologies || '',
              'Learning Objectives': submission.registrationData.learningObjectives || '',
              'Expected Outcomes': submission.registrationData.expectedOutcomes || ''
            });
          }

          // MPR Submissions Details (for 7th and 8th semester internships)
          if (['7th_internship', '8th_internship'].includes(submission.semesterType)) {
            const mprProgress = this.getMPRProgress(submission.mprSubmissions);

            Object.assign(baseData, {
              'Total MPRs Required': mprProgress.total,
              'MPRs Submitted': mprProgress.submitted,
              'MPRs Approved': mprProgress.approved,
              'MPRs Pending': mprProgress.pending,
              'MPRs Rejected': mprProgress.rejected,
              'All MPRs Completed': mprProgress.submitted === mprProgress.total ? 'Yes' : 'No',
              'All MPRs Approved': mprProgress.approved === mprProgress.submitted && mprProgress.submitted > 0 ? 'Yes' : 'No'
            });

            // Individual MPR details with documents
            if (submission.mprSubmissions) {
              const mprTypes = ['mpr1', 'mpr2', 'mpr3', 'midSem1', 'midSem2'];

              mprTypes.forEach(mprType => {
                const mprData = submission.mprSubmissions[mprType];
                const mprPrefix = mprType.toUpperCase();

                if (mprData) {
                  baseData[`${mprPrefix} Document URL`] = mprData.document || '';
                  baseData[`${mprPrefix} Status`] = mprData.status || 'Not Submitted';
                  baseData[`${mprPrefix} Submitted Date`] = this.formatDate(mprData.submittedAt);
                  baseData[`${mprPrefix} Reviewed Date`] = this.formatDate(mprData.reviewedAt);
                  baseData[`${mprPrefix} Feedback`] = mprData.feedback || '';
                } else {
                  baseData[`${mprPrefix} Document URL`] = '';
                  baseData[`${mprPrefix} Status`] = 'Not Submitted';
                  baseData[`${mprPrefix} Submitted Date`] = '';
                  baseData[`${mprPrefix} Reviewed Date`] = '';
                  baseData[`${mprPrefix} Feedback`] = '';
                }
              });
            }
          }

          // Monthly Submissions Data (for internships) with enhanced details
          if (submission.monthlySubmissions && submission.monthlySubmissions.length > 0) {
            baseData['Total Monthly Submissions'] = submission.monthlySubmissions.length;

            // Add details for each monthly submission
            submission.monthlySubmissions.forEach((monthly, index) => {
              const monthNum = monthly.month || (index + 1);
              const monthPrefix = `Month ${monthNum}`;

              baseData[`${monthPrefix} - Placement Status`] = monthly.placementStatus || '';
              baseData[`${monthPrefix} - Package Amount`] = monthly.packageAmount || '';
              baseData[`${monthPrefix} - PPT URL`] = monthly.submissionPPT || '';
              baseData[`${monthPrefix} - Company Feedback`] = monthly.companyFeedback || '';
              baseData[`${monthPrefix} - Submitted Date`] = this.formatDate(monthly.submittedAt);
            });

            // Latest placement information
            const latestMonth = submission.monthlySubmissions[submission.monthlySubmissions.length - 1];
            baseData['Current Placement Status'] = latestMonth.placementStatus || '';
            baseData['Current Package Amount'] = latestMonth.packageAmount || '';
            baseData['Last Monthly Update'] = this.formatDate(latestMonth.submittedAt);

            // Calculate pending monthly submissions
            const currentDate = new Date();
            const startDate = new Date(submission.registrationData?.startDate);
            if (startDate && !isNaN(startDate)) {
              const monthsPassed = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24 * 30)) + 1;
              const submissionsReceived = submission.monthlySubmissions.length;
              const duration = submission.registrationData?.duration || 0;

              baseData['Expected Monthly Submissions'] = Math.min(monthsPassed, duration);
              baseData['Actual Monthly Submissions'] = submissionsReceived;
              baseData['Pending Monthly Submissions'] = Math.max(0, Math.min(monthsPassed, duration) - submissionsReceived);
            }
          } else {
            baseData['Total Monthly Submissions'] = 0;
            baseData['Current Placement Status'] = '';
            baseData['Current Package Amount'] = '';
            baseData['Last Monthly Update'] = '';
            baseData['Expected Monthly Submissions'] = 0;
            baseData['Actual Monthly Submissions'] = 0;
            baseData['Pending Monthly Submissions'] = 0;
          }

          // Additional computed fields
          baseData['Has Pending Reviews'] =
            (submission.registrationReview?.status === 'pending' ||
              submission.finalReportReview?.status === 'pending' ||
              submission.hasPendingMPRReviews) ? 'Yes' : 'No';

          baseData['Ready For Final Report'] =
            submission.currentStep === 'final_report_pending' ? 'Yes' : 'No';

          baseData['Submission Completed'] =
            submission.currentStep === 'completed' ? 'Yes' : 'No';

        } else {
          // No submission data - fill with defaults including ALL possible fields
          Object.assign(baseData, {
            'Semester Type': 'Not Selected',
            'Current Step': 'Not Started',
            'Overall Status': 'Not Submitted',
            'Submission Created Date': '',
            'Last Updated': '',
            'Registration Status': 'Not Started',
            'Registration Reviewed Date': '',
            'Registration Reviewed By': '',
            'Registration Feedback': '',
            'Final Report Status': 'Not Started',
            'Final Report Reviewed Date': '',
            'Final Report Reviewed By': '',
            'Final Report Feedback': '',
            'Final Report Submitted Date': '',
            'Final Report Document URL': '',
            'PPO Offer Document URL': '',
            'Final PPT Document URL': '',
            'Final Completion Certificate URL': '',
            'Final Evaluation Report URL': '',
            'Final Additional Documents URL': '',
            'Company Name': '',
            'Company Address': '',
            'Internship Title': '',
            'Industry Type': '',
            'Internship Type': '',
            'Start Date': '',
            'End Date': '',
            'Duration (Months)': '',
            'Stipend Per Month': '',
            'PPO Amount': '',
            'Job Offer Received': '',
            'Industry Mentor Name': '',
            'Industry Mentor Email': '',
            'Industry Mentor Phone': '',
            'HR Name': '',
            'HR Email': '',
            'HR Phone': '',
            'Project Title': '',
            'Project Type': '',
            'Project Description': '',
            'Company Website': '',
            'Company Size': '',
            'Technology Stack': '',
            'Learning Objectives': '',
            'Expected Outcomes': '',
            // All document fields with empty defaults
            'Offer Letter Document URL': '',
            'NOC Document URL': '',
            'Stipend Proof Document URL': '',
            'Project PPT Document URL': '',
            'Joining Letter Document URL': '',
            'Completion Certificate Document URL': '',
            'Project Report Document URL': '',
            'Presentation Slides Document URL': '',
            'Internship Certificate Document URL': '',
            'Recommendation Letter Document URL': '',
            'Work Samples Document URL': '',
            'Registration Additional Documents URL': '',
            'Total Monthly Submissions': 0,
            'Current Placement Status': '',
            'Current Package Amount': '',
            'Last Monthly Update': '',
            'Expected Monthly Submissions': 0,
            'Actual Monthly Submissions': 0,
            'Pending Monthly Submissions': 0,
            'Has Pending Reviews': 'No',
            'Ready For Final Report': 'No',
            'Submission Completed': 'No'
          });
        }

        // ─── ADDED: make all /uploads/... paths into full http://localhost:5000/... URLs
        return this.makeUrlsAbsolute(baseData);
      });

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Enhanced column auto-sizing with better width calculation
      const colWidths = [];
      if (excelData.length > 0) {
        Object.keys(excelData[0]).forEach(key => {
          const maxLength = Math.max(
            key.length,
            ...excelData.slice(0, 100).map(row => String(row[key] || '').length) // Sample first 100 rows for performance
          );
          // Special handling for document URL columns
          if (key.toLowerCase().includes('document') || key.toLowerCase().includes('url')) {
            colWidths.push({
              width: Math.min(Math.max(maxLength + 3, 25), 80) // Wider for URLs
            });
          } else {
            colWidths.push({
              width: Math.min(Math.max(maxLength + 3, 12), 60)
            });
          }
        });
        worksheet['!cols'] = colWidths;
      }

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Complete Student Data');

      // Generate buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      console.log(`Export completed: ${excelData.length} records processed`);

      return {
        buffer,
        filename: `InternTrack_Complete_Student_Data_${moment().format('DD-MM-YYYY_HH-mm')}.xlsx`,
        totalRecords: excelData.length
      };

    } catch (error) {
      console.error('Error exporting complete student data:', error);
      throw new Error('Failed to export complete student data: ' + error.message);
    }
  }

  // ============================================================================
  // CORRECTED exportMentorStudentData METHOD
  // ============================================================================

  async exportMentorStudentData(mentorId) {
    try {
      console.log(`Starting streamlined mentor export for mentor: ${mentorId}`);

      // Get mentor's assigned students
      const students = await User.find({
        role: 'student',
        assignedMentor: mentorId
      }).lean();

      const studentIds = students.map(s => s._id);

      // Get ALL submissions for these students (not just active ones)
      const submissions = await Submission.find({
        student: { $in: studentIds }
      })
        .populate('student', 'name enrollmentNo email branch phone')
        .populate('registrationReview.reviewedBy', 'name')
        .populate('finalReportReview.reviewedBy', 'name')
        .sort({ 'student.enrollmentNo': 1, createdAt: 1 })
        .lean();

      // Get mentor info
      const mentor = await User.findById(mentorId).select('name email');

      console.log(`Processing ${submissions.length} submissions for ${students.length} students`);

      // Process each SUBMISSION as a separate row
      const excelData = submissions.map(submission => {
        const student = students.find(s => s._id.toString() === submission.student._id.toString());

        const baseData = {
          // ===== BASIC STUDENT INFO =====
          'Student Name': submission.student?.name || student?.name || '',
          'Enrollment No': submission.student?.enrollmentNo || student?.enrollmentNo || '',
          'Branch': submission.student?.branch || student?.branch || '',
          'Email': submission.student?.email || student?.email || '',
          'Phone': submission.student?.phone || student?.phone || '',

          // ===== FACULTY ASSIGNMENT =====
          'Assigned Faculty': mentor?.name || '',
          'Faculty Email': mentor?.email || '',

          // ===== SUBMISSION STATUS =====
          'Semester Type': (submission.semesterType || '').replace('_', ' ').toUpperCase(),
          'Current Status': submission.currentStep || '',
          'Overall Progress': submission.status || '',
          'Submitted On': this.formatDate(submission.createdAt, 'DD/MM/YYYY'),
        };

        // ===== COMPLETE COMPANY/PROJECT DETAILS =====
        if (submission.registrationData) {
          Object.assign(baseData, {
            // Company Info
            'Company/Organization': submission.registrationData.companyName || submission.registrationData.projectTitle || '',
            'Company Type': submission.registrationData.companyType || '',
            'Company Full Address': submission.registrationData.companyFullAddress || submission.registrationData.companyAddress || '',

            // Internship Details
            'Internship/Project Title': submission.registrationData.internshipTitle || submission.registrationData.projectTitle || '',
            'Internship Type': submission.registrationData.internshipType || '',
            'Type of Work': submission.registrationData.typeOfWork || '',
            'Internship Domain': submission.registrationData.internshipDomain || '',

            // Duration
            'Duration (Months)': submission.registrationData.duration || '',
            'Start Date': this.formatDate(submission.registrationData.startDate, 'DD/MM/YYYY'),
            'End Date': this.formatDate(submission.registrationData.endDate, 'DD/MM/YYYY'),

            // Stipend
            'Has Stipend': submission.registrationData.hasStipend ? 'Yes' : 'No',
            'Stipend Amount (₹/month)': submission.registrationData.stipendAmount || submission.registrationData.stipendPerMonth || '0',

            // Student Contact
            'Student Mobile Number': submission.registrationData.studentMobileNumber || '',

            // Industry Mentor Details
            'Industry Mentor Name': submission.registrationData.mentorName || '',
            'Industry Mentor Role': submission.registrationData.mentorRole || '',
            'Industry Mentor Contact Number': submission.registrationData.mentorContactNumber || '',
            'Industry Mentor Email': submission.registrationData.mentorEmail || '',

            // HR Details
            'HR Name': submission.registrationData.hrName || '',
            'HR Email': submission.registrationData.hrEmail || '',

            // Project Type (for 8th semester projects)
            'Project Type': submission.registrationData.projectType || '',
          });
        } else {
          // Add empty fields if no registration data
          Object.assign(baseData, {
            'Company/Organization': '',
            'Company Type': '',
            'Company Full Address': '',
            'Internship/Project Title': '',
            'Internship Type': '',
            'Type of Work': '',
            'Internship Domain': '',
            'Duration (Months)': '',
            'Start Date': '',
            'End Date': '',
            'Has Stipend': '',
            'Stipend Amount (₹/month)': '',
            'Student Mobile Number': '',
            'Industry Mentor Name': '',
            'Industry Mentor Role': '',
            'Industry Mentor Contact Number': '',
            'Industry Mentor Email': '',
            'HR Name': '',
            'HR Email': '',
            'Project Type': '',
          });
        }

        // ===== REGISTRATION MARKS =====
        if (submission.registrationReview && submission.registrationReview.marks) {
          const regMarks = submission.registrationReview.marks;

          Object.assign(baseData, {
            'Registration - Objective/Problem (5)': Number(regMarks.objectiveProblemIdentification) || 0,
            'Registration - Methodology (5)': Number(regMarks.proposedMethodology) || 0,
            'Registration - Relevance (5)': Number(regMarks.relevanceRealWorld) || 0,
            'Registration - Synopsis (5)': Number(regMarks.synopsisPresentation) || 0,
            'Registration Total Marks (20)': Number(regMarks.totalRegistrationMarks) || 0,
            'Registration Status': submission.registrationReview.status || '',
            'Registration Reviewed On': this.formatDate(submission.registrationReview.reviewedAt, 'DD/MM/YYYY'),
          });
        } else {
          Object.assign(baseData, {
            'Registration - Objective/Problem (5)': 0,
            'Registration - Methodology (5)': 0,
            'Registration - Relevance (5)': 0,
            'Registration - Synopsis (5)': 0,
            'Registration Total Marks (20)': 0,
            'Registration Status': submission.registrationReview?.status || 'Not Started',
            'Registration Reviewed On': '',
          });
        }

        // ===== MPR MARKS (for 7th & 8th internships) =====
        if (['7th_internship', '8th_internship'].includes(submission.semesterType)) {
          if (submission.mprSubmissions) {
            // MPR1, MPR2, MPR3 (10 marks each)
            ['mpr1', 'mpr2', 'mpr3'].forEach(mprType => {
              const mpr = submission.mprSubmissions[mprType];
              if (mpr) {
                const marks = typeof mpr.marks === 'number' ? mpr.marks : 0;
                baseData[`${mprType.toUpperCase()} Marks (10)`] = Number(marks) || 0;
                baseData[`${mprType.toUpperCase()} Status`] = mpr.status || 'Not Submitted';
              } else {
                baseData[`${mprType.toUpperCase()} Marks (10)`] = 0;
                baseData[`${mprType.toUpperCase()} Status`] = 'Not Submitted';
              }
            });

            // Mid Sem 1 (100 marks)
            if (submission.mprSubmissions.midSem1 && submission.mprSubmissions.midSem1.marks) {
              const mid1 = submission.mprSubmissions.midSem1.marks;

              Object.assign(baseData, {
                'MidSem1 - Daily Diary (10)': Number(mid1.dailyDiary) || 0,
                'MidSem1 - Outcomes (10)': Number(mid1.expectedAchievedOutcomes) || 0,
                'MidSem1 - Report (30)': Number(mid1.briefReport) || 0,
                'MidSem1 - Presentation (50)': Number(mid1.presentationViva) || 0,
                'MidSem1 Total (100)': Number(mid1.total) || 0,
                'MidSem1 Status': submission.mprSubmissions.midSem1.status || 'Not Submitted',
              });
            } else {
              Object.assign(baseData, {
                'MidSem1 - Daily Diary (10)': 0,
                'MidSem1 - Outcomes (10)': 0,
                'MidSem1 - Report (30)': 0,
                'MidSem1 - Presentation (50)': 0,
                'MidSem1 Total (100)': 0,
                'MidSem1 Status': submission.mprSubmissions.midSem1?.status || 'Not Submitted',
              });
            }

            // Mid Sem 2 (100 marks)
            if (submission.mprSubmissions.midSem2 && submission.mprSubmissions.midSem2.marks) {
              const mid2 = submission.mprSubmissions.midSem2.marks;

              Object.assign(baseData, {
                'MidSem2 - Daily Diary (10)': Number(mid2.dailyDiary) || 0,
                'MidSem2 - Outcomes (10)': Number(mid2.expectedAchievedOutcomes) || 0,
                'MidSem2 - Report (30)': Number(mid2.briefReport) || 0,
                'MidSem2 - Presentation (50)': Number(mid2.presentationViva) || 0,
                'MidSem2 Total (100)': Number(mid2.total) || 0,
                'MidSem2 Status': submission.mprSubmissions.midSem2.status || 'Not Submitted',
              });
            } else {
              Object.assign(baseData, {
                'MidSem2 - Daily Diary (10)': 0,
                'MidSem2 - Outcomes (10)': 0,
                'MidSem2 - Report (30)': 0,
                'MidSem2 - Presentation (50)': 0,
                'MidSem2 Total (100)': 0,
                'MidSem2 Status': submission.mprSubmissions.midSem2?.status || 'Not Submitted',
              });
            }

            // Overall MPR Progress
            const mprTypes = ['mpr1', 'mpr2', 'mpr3', 'midSem1', 'midSem2'];
            const approvedCount = mprTypes.filter(type =>
              submission.mprSubmissions[type]?.status === 'approved'
            ).length;
            baseData['MPRs Approved (out of 5)'] = `${approvedCount}/5`;
          }
        }

        // ===== FINAL REPORT MARKS =====
        if (submission.finalReportReview && submission.finalReportReview.marks) {
          const finalMarks = submission.finalReportReview.marks;

          Object.assign(baseData, {
            // Summary marks
            'Final - Daily Diary (20)': Number(finalMarks.dailyDiary) || 0,
            'Final - Project Outcomes (30)': Number(finalMarks.projectOutcomes) || 0,

            // Report marks (100)
            'Final - Objective & Literature (20)': Number(finalMarks.objectiveLiteratureReview) || 0,
            'Final - Methodology (20)': Number(finalMarks.methodologyArea) || 0,
            'Final - Work Description (20)': Number(finalMarks.workDescription) || 0,
            'Final - Results & Discussion (20)': Number(finalMarks.dataResultDiscussion) || 0,
            'Final - Format & Plagiarism (20)': Number(finalMarks.overallFormatPlagiarism) || 0,
            'Final Report Marks (100)': Number(finalMarks.totalReportMarks) || 0,

            // Presentation marks (100)
            'Final - Define Objective (20)': Number(finalMarks.defineObjective) || 0,
            'Final - Content (20)': Number(finalMarks.contentPresentation) || 0,
            'Final - Presentation Skill (20)': Number(finalMarks.presentationSkill) || 0,
            'Final - Relevance (20)': Number(finalMarks.socialIndustrialRelevance) || 0,
            'Final - Q&A (20)': Number(finalMarks.questionAnswer) || 0,
            'Final Presentation Marks (100)': Number(finalMarks.totalPresentationMarks) || 0,

            // Grand total
            'FINAL GRAND TOTAL (250)': Number(finalMarks.grandTotal) || 0,
            'Final Report Status': submission.finalReportReview.status || '',
            'Final Report Reviewed On': this.formatDate(submission.finalReportReview.reviewedAt, 'DD/MM/YYYY'),
          });
        } else {
          Object.assign(baseData, {
            'Final - Daily Diary (20)': 0,
            'Final - Project Outcomes (30)': 0,
            'Final - Objective & Literature (20)': 0,
            'Final - Methodology (20)': 0,
            'Final - Work Description (20)': 0,
            'Final - Results & Discussion (20)': 0,
            'Final - Format & Plagiarism (20)': 0,
            'Final Report Marks (100)': 0,
            'Final - Define Objective (20)': 0,
            'Final - Content (20)': 0,
            'Final - Presentation Skill (20)': 0,
            'Final - Relevance (20)': 0,
            'Final - Q&A (20)': 0,
            'Final Presentation Marks (100)': 0,
            'FINAL GRAND TOTAL (250)': 0,
            'Final Report Status': submission.finalReportReview?.status || 'Not Started',
            'Final Report Reviewed On': '',
          });
        }

        // ===== DOCUMENT LINKS (Key Documents Only) =====
        Object.assign(baseData, {
          // Registration documents
          'Offer Letter': this.getDocumentURL(submission, 'registrationData.offerLetter'),
          'NOC Letter': this.getDocumentURL(submission, 'registrationData.nocLetter') || this.getDocumentURL(submission, 'registrationData.noc'),
          'Stipend Proof': this.getDocumentURL(submission, 'registrationData.stipendProof'),

          // MPR documents (for 7th/8th internships)
          ...((['7th_internship', '8th_internship'].includes(submission.semesterType)) ? {
            'MPR1 Document': this.getDocumentURL(submission, 'mprSubmissions.mpr1.document'),
            'MPR2 Document': this.getDocumentURL(submission, 'mprSubmissions.mpr2.document'),
            'MPR3 Document': this.getDocumentURL(submission, 'mprSubmissions.mpr3.document'),
            'MidSem1 Document': this.getDocumentURL(submission, 'mprSubmissions.midSem1.document'),
            'MidSem2 Document': this.getDocumentURL(submission, 'mprSubmissions.midSem2.document'),
          } : {}),

          // Project report (for 8th semester projects)
          ...(submission.semesterType === '8th_project' ? {
            'Project Report': this.getDocumentURL(submission, 'registrationData.projectReport'),
          } : {}),

          // Final report documents
          'Final Report Document': this.getDocumentURL(submission, 'finalReport.finalReport'),
          'Final PPT': this.getDocumentURL(submission, 'finalReport.finalPPT'),
          'Completion Certificate': this.getDocumentURL(submission, 'finalReport.certificate'),
          'Final MPR': this.getDocumentURL(submission, 'finalReport.finalMPR'),
        });

        // ===== PLACEMENT INFO =====
        if (submission.finalReport?.hasPPO) {
          Object.assign(baseData, {
            'PPO Received': 'Yes',
            'PPO Amount (LPA)': submission.finalReport.ppoAmount || '',
            'PPO Offer Letter': this.getDocumentURL(submission, 'finalReport.ppoOfferLetter'),
          });
        } else {
          baseData['PPO Received'] = 'No';
          baseData['PPO Amount (LPA)'] = '';
          baseData['PPO Offer Letter'] = '';
        }

        // ===== FEEDBACK =====
        Object.assign(baseData, {
          'Registration Feedback': submission.registrationReview?.feedback || '',
          'Final Report Feedback': submission.finalReportReview?.feedback || '',
        });

        // ─── ADDED: make all /uploads/... paths into full http://localhost:5000/... URLs
        return this.makeUrlsAbsolute(baseData);
      });

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Enhanced column auto-sizing
      const colWidths = [];
      if (excelData.length > 0) {
        Object.keys(excelData[0]).forEach(key => {
          const maxLength = Math.max(
            key.length,
            ...excelData.slice(0, 50).map(row => String(row[key] || '').length)
          );

          // Special handling for document URL columns
          if (key.toLowerCase().includes('document') ||
            key.toLowerCase().includes('letter') ||
            key.toLowerCase().includes('certificate') ||
            key.toLowerCase().includes('ppt') ||
            key.toLowerCase().includes('proof')) {
            colWidths.push({ width: Math.min(Math.max(maxLength + 3, 30), 80) });
          } else if (key.toLowerCase().includes('feedback') || key.toLowerCase().includes('address')) {
            colWidths.push({ width: Math.min(Math.max(maxLength + 3, 40), 60) });
          } else {
            colWidths.push({ width: Math.min(Math.max(maxLength + 3, 12), 40) });
          }
        });
        worksheet['!cols'] = colWidths;
      }

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Student Progress & Marks');

      // Generate buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      console.log(`✅ Streamlined mentor export completed: ${excelData.length} rows (${students.length} unique students)`);

      return {
        buffer,
        filename: `${mentor?.name || 'Mentor'}_Students_Marks_${moment().format('DD-MM-YYYY')}.xlsx`,
        totalRecords: excelData.length
      };

    } catch (error) {
      console.error('❌ Error exporting streamlined mentor student data:', error);
      throw new Error('Failed to export student data: ' + error.message);
    }
  }

  // Export submissions summary with all document links and missing fields
  async exportSubmissionsSummary() {
    try {
      console.log('Starting submissions summary export...');

      const submissions = await Submission.find()
        .populate('student', 'name enrollmentNo email branch phone')
        .populate('mentor', 'name email phone')
        .populate('registrationReview.reviewedBy', 'name')
        .populate('finalReportReview.reviewedBy', 'name')
        .lean();

      const excelData = submissions.map(submission => {

        // Base student information with ALL fields
        const baseData = {
          'Student Name': submission.student?.name || '',
          'Enrollment No': submission.student?.enrollmentNo || '',
          'Email': submission.student?.email || '',
          'Branch': submission.student?.branch || '',
          'Phone': submission.student?.phone || '',
          'Mentor Name': submission.mentor?.name || '',
          'Mentor Email': submission.mentor?.email || '',
          'Mentor Phone': submission.mentor?.phone || '',
          'Semester Type': submission.semesterType || '',
          'Current Step': submission.currentStep || '',
          'Overall Status': submission.status || '',
          'Submission Created Date': this.formatDate(submission.createdAt),
          'Last Updated': this.formatDate(submission.updatedAt),

          // Registration Review Details
          'Registration Status': submission.registrationReview?.status || 'Not Started',
          'Registration Reviewed Date': this.formatDate(submission.registrationReview?.reviewedAt),
          'Registration Reviewed By': submission.registrationReview?.reviewedBy?.name || '',
          'Registration Feedback': submission.registrationReview?.feedback || '',

          // Final Report Review Details with enhanced document extraction
          'Final Report Status': submission.finalReportReview?.status || 'Not Started',
          'Final Report Reviewed Date': this.formatDate(submission.finalReportReview?.reviewedAt),
          'Final Report Reviewed By': submission.finalReportReview?.reviewedBy?.name || '',
          'Final Report Feedback': submission.finalReportReview?.feedback || '',
          'Final Report Submitted Date': this.formatDate(submission.finalReport?.submittedAt)
        };

        // Get enhanced final report documents
        const finalReportDocs = this.getFinalReportDocuments(submission.finalReport);
        Object.assign(baseData, {
          'Final Report Document URL': finalReportDocs.finalReportDocument || this.getDocumentURL(submission, 'finalReport.document'),
          'PPO Offer Document URL': finalReportDocs.ppoOffer || '',
          'Final PPT Document URL': finalReportDocs.finalPPT || '',
          'Final Completion Certificate URL': finalReportDocs.certificate || '',
          'Final Evaluation Report URL': finalReportDocs.evaluationReport || '',
          'Final Additional Documents URL': finalReportDocs.additionalDocuments || ''
        });

        // Get ALL document URLs from registration data with enhanced extraction
        const allDocuments = this.getAllDocumentURLs(submission.registrationData);

        // Add all registration document fields to Excel
        Object.assign(baseData, {
          'Offer Letter Document URL': allDocuments.offerLetter || '',
          'NOC Document URL': allDocuments.noc || '',
          'Stipend Proof Document URL': allDocuments.stipendProof || '',
          'Project PPT Document URL': allDocuments.projectPPT || '',
          'Joining Letter Document URL': allDocuments.joiningLetter || '',
          'Completion Certificate Document URL': allDocuments.completionCertificate || '',
          'Project Report Document URL': allDocuments.projectReport || '',
          'Presentation Slides Document URL': allDocuments.presentationSlides || '',
          'Internship Certificate Document URL': allDocuments.internshipCertificate || '',
          'Recommendation Letter Document URL': allDocuments.recommendationLetter || '',
          'Work Samples Document URL': allDocuments.workSamples || '',
          'Registration Additional Documents URL': allDocuments.additionalDocuments || ''
        });

        // Add complete company/project details with ALL missing fields
        if (submission.registrationData) {
          Object.assign(baseData, {
            'Company Name': submission.registrationData.companyName || '',
            'Company Address': submission.registrationData.companyAddress || '',
            'Project Title': submission.registrationData.projectTitle || '',
            'Project Description': submission.registrationData.projectDescription || '',
            'Internship Title': submission.registrationData.internshipTitle || '',
            'Industry Type': submission.registrationData.industryType || '',
            'Internship Type': submission.registrationData.internshipType || '',
            'Start Date': this.formatDate(submission.registrationData.startDate, 'DD/MM/YYYY'),
            'End Date': this.formatDate(submission.registrationData.endDate, 'DD/MM/YYYY'),
            'Duration (Months)': submission.registrationData.duration || '',
            'Stipend Per Month': submission.registrationData.stipendPerMonth || '',
            'PPO Amount': submission.registrationData.ppoAmount || submission.registrationData.packageAmount || '',
            'Job Offer Received': submission.registrationData.jobOfferReceived || '',

            // Complete Industry Contact Details
            'Industry Mentor Name': submission.registrationData.mentorName || submission.registrationData.industryMentorName || '',
            'Industry Mentor Email': submission.registrationData.industryMentorEmail || submission.registrationData.mentorEmail || '',
            'Industry Mentor Phone': submission.registrationData.industryMentorPhone || submission.registrationData.mentorPhone || '',
            'HR Name': submission.registrationData.hrName || '',
            'HR Email': submission.registrationData.hrEmail || '',
            'HR Phone': submission.registrationData.hrPhone || '',

            // Additional company details
            'Company Website': submission.registrationData.companyWebsite || '',
            'Company Size': submission.registrationData.companySize || '',
            'Technology Stack': submission.registrationData.technologyStack || submission.registrationData.technologies || '',
            'Learning Objectives': submission.registrationData.learningObjectives || '',
            'Expected Outcomes': submission.registrationData.expectedOutcomes || ''
          });
        }

        // Add MPR summary and details for internships
        if (['7th_internship', '8th_internship'].includes(submission.semesterType)) {
          const mprProgress = this.getMPRProgress(submission.mprSubmissions);

          Object.assign(baseData, {
            'MPRs Submitted': mprProgress.submitted,
            'MPRs Approved': mprProgress.approved,
            'MPRs Pending': mprProgress.pending,
            'MPRs Rejected': mprProgress.rejected,
            'All MPRs Approved': mprProgress.approved === mprProgress.submitted && mprProgress.submitted > 0 ? 'Yes' : 'No'
          });

          // Individual MPR document details
          if (submission.mprSubmissions) {
            const mprTypes = ['mpr1', 'mpr2', 'mpr3', 'midSem1', 'midSem2'];

            mprTypes.forEach(mprType => {
              const mprData = submission.mprSubmissions[mprType];
              const mprPrefix = mprType.toUpperCase();

              baseData[`${mprPrefix} Document URL`] = mprData?.document || '';
              baseData[`${mprPrefix} Status`] = mprData?.status || 'Not Submitted';
              baseData[`${mprPrefix} Submitted Date`] = this.formatDate(mprData?.submittedAt);
              baseData[`${mprPrefix} Reviewed Date`] = this.formatDate(mprData?.reviewedAt);
              baseData[`${mprPrefix} Feedback`] = mprData?.feedback || '';
            });
          }
        }

        // Add enhanced placement status from monthly submissions
        if (submission.monthlySubmissions && submission.monthlySubmissions.length > 0) {
          const latest = submission.monthlySubmissions[submission.monthlySubmissions.length - 1];
          baseData['Current Placement Status'] = latest.placementStatus || '';
          baseData['Current Package Amount'] = latest.packageAmount || '';
          baseData['Total Monthly Reports'] = submission.monthlySubmissions.length;
          baseData['Last Monthly Update'] = this.formatDate(latest.submittedAt);

          // Check if ever placed and get highest package
          const everPlaced = submission.monthlySubmissions.some(monthly =>
            monthly.placementStatus === 'yes' || monthly.placementStatus === 'Yes'
          );
          baseData['Ever Placed'] = everPlaced ? 'Yes' : 'No';

          const packages = submission.monthlySubmissions
            .filter(monthly => monthly.packageAmount && parseFloat(monthly.packageAmount) > 0)
            .map(monthly => parseFloat(monthly.packageAmount));

          baseData['Highest Package Offered'] = packages.length > 0 ? Math.max(...packages) : '';
        } else {
          baseData['Current Placement Status'] = '';
          baseData['Current Package Amount'] = '';
          baseData['Total Monthly Reports'] = 0;
          baseData['Last Monthly Update'] = '';
          baseData['Ever Placed'] = 'No Data';
          baseData['Highest Package Offered'] = '';
        }

        // ─── ADDED: make all /uploads/... paths into full http://localhost:5000/... URLs
        return this.makeUrlsAbsolute(baseData);
      });

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Auto-size columns with special handling for document URLs
      const colWidths = [];
      if (excelData.length > 0) {
        Object.keys(excelData[0]).forEach(key => {
          const maxLength = Math.max(
            key.length,
            ...excelData.slice(0, 50).map(row => String(row[key] || '').length)
          );
          // Special handling for document URL columns
          if (key.toLowerCase().includes('document') || key.toLowerCase().includes('url')) {
            colWidths.push({ width: Math.min(Math.max(maxLength + 2, 25), 80) });
          } else {
            colWidths.push({ width: Math.min(Math.max(maxLength + 2, 10), 50) });
          }
        });
        worksheet['!cols'] = colWidths;
      }

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Submissions Summary');

      // Generate buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      console.log(`Submissions summary export completed: ${excelData.length} records processed`);

      return {
        buffer,
        filename: `Submissions_Complete_Summary_${moment().format('DD-MM-YYYY_HH-mm')}.xlsx`,
        totalRecords: excelData.length
      };

    } catch (error) {
      console.error('Error exporting submissions summary:', error);
      throw new Error('Failed to export submissions summary: ' + error.message);
    }
  }

  // Export detailed MPR data with document links
  async exportMPRDetails() {
    try {
      console.log('Starting MPR details export...');

      const submissions = await Submission.find({
        semesterType: { $in: ['7th_internship', '8th_internship'] },
        mprSubmissions: { $exists: true }
      })
        .populate('student', 'name enrollmentNo email branch phone')
        .populate('mentor', 'name email phone')
        .lean();

      const mprData = [];

      submissions.forEach(submission => {
        if (submission.mprSubmissions) {
          const mprTypes = ['mpr1', 'mpr2', 'mpr3', 'midSem1', 'midSem2'];

          mprTypes.forEach(mprType => {
            const mprSubmission = submission.mprSubmissions[mprType];

            // ─── ADDED: makeUrlsAbsolute wraps the push
            mprData.push(this.makeUrlsAbsolute({
              'Student Name': submission.student?.name || '',
              'Enrollment No': submission.student?.enrollmentNo || '',
              'Branch': submission.student?.branch || '',
              'Email': submission.student?.email || '',
              'Phone': submission.student?.phone || '',
              'Mentor Name': submission.mentor?.name || '',
              'Mentor Email': submission.mentor?.email || '',
              'Mentor Phone': submission.mentor?.phone || '',
              'Semester Type': submission.semesterType,
              'Company Name': submission.registrationData?.companyName || '',
              'Industry Type': submission.registrationData?.industryType || '',
              'Project Title': submission.registrationData?.projectTitle || '',
              'Stipend Per Month': submission.registrationData?.stipendPerMonth || '',
              'PPO Amount': submission.registrationData?.ppoAmount || submission.registrationData?.packageAmount || '',
              'MPR Type': mprType.toUpperCase(),
              'Document URL': mprSubmission?.document || '',
              'Status': mprSubmission?.status || 'Not Submitted',
              'Submitted Date': this.formatDate(mprSubmission?.submittedAt),
              'Reviewed Date': this.formatDate(mprSubmission?.reviewedAt),
              'Feedback': mprSubmission?.feedback || '',
              'Registration Status': submission.registrationReview?.status || '',
              'Overall Submission Status': submission.status || '',
              'Current Step': submission.currentStep || ''
            }));
          });
        }
      });

      // Sort by student name, then by MPR type
      mprData.sort((a, b) => {
        if (a['Student Name'] !== b['Student Name']) {
          return a['Student Name'].localeCompare(b['Student Name']);
        }
        return a['MPR Type'].localeCompare(b['MPR Type']);
      });

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(mprData);

      // Auto-size columns
      const colWidths = [];
      if (mprData.length > 0) {
        Object.keys(mprData[0]).forEach(key => {
          const maxLength = Math.max(
            key.length,
            ...mprData.slice(0, 100).map(row => String(row[key] || '').length)
          );

          if (key.toLowerCase().includes('url') || key.toLowerCase().includes('document')) {
            colWidths.push({
              width: Math.min(Math.max(maxLength + 2, 25), 80)
            });
          } else {
            colWidths.push({
              width: Math.min(Math.max(maxLength + 2, 10), 50)
            });
          }
        });
        worksheet['!cols'] = colWidths;
      }

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'MPR Details');

      // Generate buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      console.log(`MPR details export completed: ${mprData.length} records processed`);

      return {
        buffer,
        filename: `MPR_Complete_Details_${moment().format('DD-MM-YYYY_HH-mm')}.xlsx`,
        totalRecords: mprData.length
      };

    } catch (error) {
      console.error('Error exporting MPR details:', error);
      throw new Error('Failed to export MPR details: ' + error.message);
    }
  }

  // Enhanced method: Export placement statistics with comprehensive data and ALL missing fields
  async exportPlacementStats() {
    try {
      console.log('Starting enhanced placement statistics export...');

      // Get all approved internship submissions with monthly data
      const internships = await Submission.find({
        status: { $in: ['approved', 'completed'] },
        semesterType: { $regex: 'internship' }
      })
        .populate('student', 'name enrollmentNo branch email phone')
        .populate('mentor', 'name email phone')
        .lean();

      const placementData = [];

      internships.forEach(internship => {
        const baseRecord = {
          'Student Name': internship.student?.name || '',
          'Enrollment No': internship.student?.enrollmentNo || '',
          'Branch': internship.student?.branch || '',
          'Email': internship.student?.email || '',
          'Phone': internship.student?.phone || '',
          'Mentor Name': internship.mentor?.name || '',
          'Mentor Email': internship.mentor?.email || '',
          'Mentor Phone': internship.mentor?.phone || '',
          'Semester Type': internship.semesterType || '',
          'Company Name': internship.registrationData?.companyName || '',
          'Company Address': internship.registrationData?.companyAddress || '',
          'Industry Type': internship.registrationData?.industryType || '',
          'Internship Type': internship.registrationData?.internshipType || '',
          'Internship Title': internship.registrationData?.internshipTitle || '',
          'Project Title': internship.registrationData?.projectTitle || '',
          'Project Description': internship.registrationData?.projectDescription || '',
          'Duration (Months)': internship.registrationData?.duration || '',
          'Stipend Per Month': internship.registrationData?.stipendPerMonth || '',
          'PPO Amount': internship.registrationData?.ppoAmount || internship.registrationData?.packageAmount || '',
          'Job Offer Received': internship.registrationData?.jobOfferReceived || '',
          'Start Date': this.formatDate(internship.registrationData?.startDate, 'DD/MM/YYYY'),
          'End Date': this.formatDate(internship.registrationData?.endDate, 'DD/MM/YYYY'),
          'Submission Status': internship.status || '',
          'Current Step': internship.currentStep || '',
          'Registration Approved Date': this.formatDate(internship.registrationReview?.reviewedAt),

          // Industry Contact Details
          'Industry Mentor Name': internship.registrationData?.mentorName || internship.registrationData?.industryMentorName || '',
          'Industry Mentor Email': internship.registrationData?.industryMentorEmail || internship.registrationData?.mentorEmail || '',
          'Industry Mentor Phone': internship.registrationData?.industryMentorPhone || internship.registrationData?.mentorPhone || '',
          'HR Name': internship.registrationData?.hrName || '',
          'HR Email': internship.registrationData?.hrEmail || '',
          'HR Phone': internship.registrationData?.hrPhone || '',

          // Company additional details
          'Company Website': internship.registrationData?.companyWebsite || '',
          'Company Size': internship.registrationData?.companySize || '',
          'Technology Stack': internship.registrationData?.technologyStack || internship.registrationData?.technologies || ''
        };

        // Get ALL document URLs from registration data
        const allDocuments = this.getAllDocumentURLs(internship.registrationData);
        const finalReportDocs = this.getFinalReportDocuments(internship.finalReport);

        // Add all document fields
        Object.assign(baseRecord, {
          'Offer Letter URL': allDocuments.offerLetter || '',
          'NOC Document URL': allDocuments.noc || '',
          'Stipend Proof URL': allDocuments.stipendProof || '',
          'Project PPT URL': allDocuments.projectPPT || '',
          'Joining Letter URL': allDocuments.joiningLetter || '',
          'Completion Certificate URL': allDocuments.completionCertificate || '',
          'Project Report URL': allDocuments.projectReport || '',
          'Presentation Slides URL': allDocuments.presentationSlides || '',
          'Internship Certificate URL': allDocuments.internshipCertificate || '',
          'Recommendation Letter URL': allDocuments.recommendationLetter || '',
          'Work Samples URL': allDocuments.workSamples || '',
          'Registration Additional Documents URL': allDocuments.additionalDocuments || '',
          'Final Report URL': finalReportDocs.finalReportDocument || this.getDocumentURL(internship, 'finalReport.document'),
          'PPO Offer URL': finalReportDocs.ppoOffer || '',
          'Final PPT URL': finalReportDocs.finalPPT || '',
          'Final Certificate URL': finalReportDocs.certificate || '',
          'Final Evaluation URL': finalReportDocs.evaluationReport || '',
          'Final Additional Docs URL': finalReportDocs.additionalDocuments || ''
        });

        if (internship.monthlySubmissions && internship.monthlySubmissions.length > 0) {
          // Get latest placement status
          const latestSubmission = internship.monthlySubmissions[internship.monthlySubmissions.length - 1];

          baseRecord['Current Placement Status'] = latestSubmission.placementStatus || 'No Data';
          baseRecord['Current Package Amount'] = latestSubmission.packageAmount || '';
          baseRecord['Last Monthly Update'] = this.formatDate(latestSubmission.submittedAt);
          baseRecord['Total Monthly Reports'] = internship.monthlySubmissions.length;

          // Check if placed in any month
          const everPlaced = internship.monthlySubmissions.some(monthly =>
            monthly.placementStatus === 'yes' || monthly.placementStatus === 'Yes'
          );
          baseRecord['Ever Placed'] = everPlaced ? 'Yes' : 'No';

          // Get highest package if placed
          const packages = internship.monthlySubmissions
            .filter(monthly => monthly.packageAmount && parseFloat(monthly.packageAmount) > 0)
            .map(monthly => parseFloat(monthly.packageAmount));

          if (packages.length > 0) {
            baseRecord['Highest Package Offered'] = Math.max(...packages);
          } else {
            baseRecord['Highest Package Offered'] = '';
          }

          // Add each monthly submission as separate columns
          internship.monthlySubmissions.forEach((monthly, index) => {
            const monthNum = monthly.month || (index + 1);
            baseRecord[`Month ${monthNum} - Placement`] = monthly.placementStatus || '';
            baseRecord[`Month ${monthNum} - Package`] = monthly.packageAmount || '';
            baseRecord[`Month ${monthNum} - PPT URL`] = monthly.submissionPPT || '';
            baseRecord[`Month ${monthNum} - Date`] = this.formatDate(monthly.submittedAt, 'DD/MM/YYYY');
          });

        } else {
          baseRecord['Current Placement Status'] = 'No Monthly Data';
          baseRecord['Current Package Amount'] = '';
          baseRecord['Last Monthly Update'] = '';
          baseRecord['Total Monthly Reports'] = 0;
          baseRecord['Ever Placed'] = 'No Data';
          baseRecord['Highest Package Offered'] = '';
        }

        // Add MPR summary for applicable internships
        if (['7th_internship', '8th_internship'].includes(internship.semesterType)) {
          const mprProgress = this.getMPRProgress(internship.mprSubmissions);
          baseRecord['MPRs Submitted'] = mprProgress.submitted;
          baseRecord['MPRs Approved'] = mprProgress.approved;
          baseRecord['All MPRs Approved'] = mprProgress.approved === mprProgress.submitted && mprProgress.submitted > 0 ? 'Yes' : 'No';
        }

        // ─── ADDED: make all /uploads/... paths into full http://localhost:5000/... URLs
        placementData.push(this.makeUrlsAbsolute(baseRecord));
      });

      // Sort by placement status, then by package amount
      placementData.sort((a, b) => {
        // First sort by placement status
        const aPlaced = a['Current Placement Status'] === 'yes' || a['Current Placement Status'] === 'Yes';
        const bPlaced = b['Current Placement Status'] === 'yes' || b['Current Placement Status'] === 'Yes';

        if (aPlaced !== bPlaced) {
          return bPlaced ? 1 : -1; // Placed students first
        }

        // Then by package amount (highest first)
        const aPackage = parseFloat(a['Current Package Amount']) || 0;
        const bPackage = parseFloat(b['Current Package Amount']) || 0;
        return bPackage - aPackage;
      });

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(placementData);

      // Auto-size columns with better sizing for URLs
      const colWidths = [];
      if (placementData.length > 0) {
        Object.keys(placementData[0]).forEach(key => {
          let maxLength = key.length;

          // Sample data for column width calculation
          const sampleValues = placementData.slice(0, 50).map(row => String(row[key] || ''));
          const maxValueLength = Math.max(...sampleValues.map(val => val.length));
          maxLength = Math.max(maxLength, maxValueLength);

          // Special handling for URL columns
          if (key.toLowerCase().includes('url') || key.toLowerCase().includes('document')) {
            colWidths.push({ width: Math.min(Math.max(maxLength + 2, 25), 80) });
          } else {
            colWidths.push({ width: Math.min(Math.max(maxLength + 2, 10), 40) });
          }
        });
        worksheet['!cols'] = colWidths;
      }

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Placement Statistics');

      // Generate buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      console.log(`Placement statistics export completed: ${placementData.length} records processed`);

      return {
        buffer,
        filename: `Placement_Complete_Statistics_${moment().format('DD-MM-YYYY_HH-mm')}.xlsx`,
        totalRecords: placementData.length
      };

    } catch (error) {
      console.error('Error exporting placement stats:', error);
      throw new Error('Failed to export placement statistics: ' + error.message);
    }
  }

  // Additional method: Export detailed monthly progression report with ALL fields
  async exportMonthlyProgressionReport() {
    try {
      console.log('Starting monthly progression report export...');

      const submissions = await Submission.find({
        status: { $in: ['approved', 'completed'] },
        semesterType: { $regex: 'internship' },
        monthlySubmissions: { $exists: true, $ne: [] }
      })
        .populate('student', 'name enrollmentNo email branch phone')
        .populate('mentor', 'name email phone')
        .lean();

      const monthlyData = [];

      submissions.forEach(submission => {
        if (submission.monthlySubmissions && submission.monthlySubmissions.length > 0) {
          submission.monthlySubmissions.forEach(monthly => {
            // ─── ADDED: makeUrlsAbsolute wraps the push
            monthlyData.push(this.makeUrlsAbsolute({
              'Student Name': submission.student?.name || '',
              'Enrollment No': submission.student?.enrollmentNo || '',
              'Branch': submission.student?.branch || '',
              'Email': submission.student?.email || '',
              'Phone': submission.student?.phone || '',
              'Mentor Name': submission.mentor?.name || '',
              'Mentor Email': submission.mentor?.email || '',
              'Mentor Phone': submission.mentor?.phone || '',
              'Company Name': submission.registrationData?.companyName || '',
              'Industry Type': submission.registrationData?.industryType || '',
              'Semester Type': submission.semesterType,
              'Stipend Per Month': submission.registrationData?.stipendPerMonth || '',
              'PPO Amount': submission.registrationData?.ppoAmount || submission.registrationData?.packageAmount || '',
              'Month Number': monthly.month || '',
              'Placement Status': monthly.placementStatus || '',
              'Package Amount': monthly.packageAmount || '',
              'Company Feedback': monthly.companyFeedback || '',
              'Submission PPT URL': monthly.submissionPPT || '',
              'Submitted Date': this.formatDate(monthly.submittedAt),
              'Internship Start Date': this.formatDate(submission.registrationData?.startDate, 'DD/MM/YYYY'),
              'Expected Duration': submission.registrationData?.duration || '',
              'Registration Status': submission.registrationReview?.status || '',
              'Overall Submission Status': submission.status || '',
              'Current Step': submission.currentStep || ''
            }));
          });
        }
      });

      // Sort by student name, then by month
      monthlyData.sort((a, b) => {
        if (a['Student Name'] !== b['Student Name']) {
          return a['Student Name'].localeCompare(b['Student Name']);
        }
        return (a['Month Number'] || 0) - (b['Month Number'] || 0);
      });

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(monthlyData);

      // Auto-size columns
      const colWidths = [];
      if (monthlyData.length > 0) {
        Object.keys(monthlyData[0]).forEach(key => {
          const maxLength = Math.max(
            key.length,
            ...monthlyData.slice(0, 100).map(row => String(row[key] || '').length)
          );

          if (key.toLowerCase().includes('url')) {
            colWidths.push({ width: Math.min(Math.max(maxLength + 2, 25), 80) });
          } else {
            colWidths.push({ width: Math.min(Math.max(maxLength + 2, 10), 40) });
          }
        });
        worksheet['!cols'] = colWidths;
      }

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Monthly Progression');

      // Generate buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      console.log(`Monthly progression export completed: ${monthlyData.length} records processed`);

      return {
        buffer,
        filename: `Monthly_Progression_Report_${moment().format('DD-MM-YYYY_HH-mm')}.xlsx`,
        totalRecords: monthlyData.length
      };

    } catch (error) {
      console.error('Error exporting monthly progression report:', error);
      throw new Error('Failed to export monthly progression report: ' + error.message);
    }
  }

  async exportAllStudentDataByBranch(branch = '') {
    try {
      console.log(`Starting admin student export... branch filter: "${branch}"`);
  
      // Build student query
      const studentQuery = { role: 'student' };
      if (branch) studentQuery.branch = branch;
  
      const students = await User.find(studentQuery)
        .populate('assignedMentor', 'name email department')
        .lean();
  
      const studentIds = students.map(s => s._id);
  
      if (studentIds.length === 0) {
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet([]);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Student Data');
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        return {
          buffer,
          filename: `Students_${branch || 'All_Branches'}_${moment().format('DD-MM-YYYY')}.xlsx`,
          totalRecords: 0
        };
      }
  
      // Get ALL submissions for these students — same as mentor export
      const submissions = await Submission.find({ student: { $in: studentIds } })
        .populate('student', 'name enrollmentNo email branch phone')
        .populate('registrationReview.reviewedBy', 'name')
        .populate('finalReportReview.reviewedBy', 'name')
        .sort({ 'student.enrollmentNo': 1, createdAt: 1 })
        .lean();
  
      // Build a mentor lookup map from students
      const mentorMap = {};
      students.forEach(s => {
        mentorMap[s._id.toString()] = s.assignedMentor;
      });
  
      console.log(`Processing ${submissions.length} submissions for ${students.length} students`);
  
      // ── Same structure as exportMentorStudentData, one row per submission ──
      const excelData = submissions.map(submission => {
        const mentor = mentorMap[submission.student._id.toString()];
  
        const baseData = {
          // ===== BASIC STUDENT INFO =====
          'Student Name': submission.student?.name || '',
          'Enrollment No': submission.student?.enrollmentNo || '',
          'Branch': submission.student?.branch || '',
          'Email': submission.student?.email || '',
          'Phone': submission.student?.phone || '',
  
          // ===== FACULTY ASSIGNMENT =====
          'Assigned Faculty': mentor?.name || '',
          'Faculty Email': mentor?.email || '',
          'Department': mentor?.department || '',
  
          // ===== SUBMISSION STATUS =====
          'Semester Type': (submission.semesterType || '').replace('_', ' ').toUpperCase(),
          'Current Status': submission.currentStep || '',
          'Overall Progress': submission.status || '',
          'Submitted On': this.formatDate(submission.createdAt, 'DD/MM/YYYY'),
        };
  
        // ===== COMPANY/PROJECT DETAILS =====
        if (submission.registrationData) {
          const r = submission.registrationData;
          Object.assign(baseData, {
            'Company/Organization': r.companyName || r.projectTitle || '',
            'Company Type': r.companyType || '',
            'Company Full Address': r.companyFullAddress || r.companyAddress || '',
            'Internship/Project Title': r.internshipTitle || r.projectTitle || '',
            'Internship Type': r.internshipType || '',
            'Type of Work': r.typeOfWork || '',
            'Internship Domain': r.internshipDomain || '',
            'Duration (Months)': r.duration || '',
            'Start Date': this.formatDate(r.startDate, 'DD/MM/YYYY'),
            'End Date': this.formatDate(r.endDate, 'DD/MM/YYYY'),
            'Has Stipend': r.hasStipend ? 'Yes' : 'No',
            'Stipend Amount (₹/month)': r.stipendAmount || r.stipendPerMonth || '0',
            'Student Mobile Number': r.studentMobileNumber || '',
            'Industry Mentor Name': r.mentorName || '',
            'Industry Mentor Role': r.mentorRole || '',
            'Industry Mentor Contact Number': r.mentorContactNumber || '',
            'Industry Mentor Email': r.mentorEmail || '',
            'HR Name': r.hrName || '',
            'HR Email': r.hrEmail || '',
            'Project Type': r.projectType || '',
          });
        } else {
          Object.assign(baseData, {
            'Company/Organization': '', 'Company Type': '', 'Company Full Address': '',
            'Internship/Project Title': '', 'Internship Type': '', 'Type of Work': '',
            'Internship Domain': '', 'Duration (Months)': '', 'Start Date': '', 'End Date': '',
            'Has Stipend': '', 'Stipend Amount (₹/month)': '', 'Student Mobile Number': '',
            'Industry Mentor Name': '', 'Industry Mentor Role': '',
            'Industry Mentor Contact Number': '', 'Industry Mentor Email': '',
            'HR Name': '', 'HR Email': '', 'Project Type': '',
          });
        }
  
        // ===== REGISTRATION MARKS =====
        if (submission.registrationReview?.marks) {
          const m = submission.registrationReview.marks;
          Object.assign(baseData, {
            'Registration - Objective/Problem (5)': Number(m.objectiveProblemIdentification) || 0,
            'Registration - Methodology (5)': Number(m.proposedMethodology) || 0,
            'Registration - Relevance (5)': Number(m.relevanceRealWorld) || 0,
            'Registration - Synopsis (5)': Number(m.synopsisPresentation) || 0,
            'Registration Total Marks (20)': Number(m.totalRegistrationMarks) || 0,
            'Registration Status': submission.registrationReview.status || '',
            'Registration Reviewed On': this.formatDate(submission.registrationReview.reviewedAt, 'DD/MM/YYYY'),
          });
        } else {
          Object.assign(baseData, {
            'Registration - Objective/Problem (5)': 0,
            'Registration - Methodology (5)': 0,
            'Registration - Relevance (5)': 0,
            'Registration - Synopsis (5)': 0,
            'Registration Total Marks (20)': 0,
            'Registration Status': submission.registrationReview?.status || 'Not Started',
            'Registration Reviewed On': '',
          });
        }
  
        // ===== MPR MARKS (7th & 8th internships) =====
        if (['7th_internship', '8th_internship'].includes(submission.semesterType)) {
          if (submission.mprSubmissions) {
            ['mpr1', 'mpr2', 'mpr3'].forEach(mprType => {
              const mpr = submission.mprSubmissions[mprType];
              if (mpr) {
                baseData[`${mprType.toUpperCase()} Marks (10)`] = Number(typeof mpr.marks === 'number' ? mpr.marks : 0) || 0;
                baseData[`${mprType.toUpperCase()} Status`] = mpr.status || 'Not Submitted';
              } else {
                baseData[`${mprType.toUpperCase()} Marks (10)`] = 0;
                baseData[`${mprType.toUpperCase()} Status`] = 'Not Submitted';
              }
            });
  
            const mid1 = submission.mprSubmissions.midSem1;
            if (mid1?.marks) {
              Object.assign(baseData, {
                'MidSem1 - Daily Diary (10)': Number(mid1.marks.dailyDiary) || 0,
                'MidSem1 - Outcomes (10)': Number(mid1.marks.expectedAchievedOutcomes) || 0,
                'MidSem1 - Report (30)': Number(mid1.marks.briefReport) || 0,
                'MidSem1 - Presentation (50)': Number(mid1.marks.presentationViva) || 0,
                'MidSem1 Total (100)': Number(mid1.marks.total) || 0,
                'MidSem1 Status': mid1.status || 'Not Submitted',
              });
            } else {
              Object.assign(baseData, {
                'MidSem1 - Daily Diary (10)': 0, 'MidSem1 - Outcomes (10)': 0,
                'MidSem1 - Report (30)': 0, 'MidSem1 - Presentation (50)': 0,
                'MidSem1 Total (100)': 0, 'MidSem1 Status': mid1?.status || 'Not Submitted',
              });
            }
  
            const mprTypes = ['mpr1', 'mpr2', 'mpr3', 'midSem1'];
            const approvedCount = mprTypes.filter(t => submission.mprSubmissions[t]?.status === 'approved').length;
            baseData['MPRs Approved (out of 4)'] = `${approvedCount}/4`;
  
            Object.assign(baseData, {
              'MPR1 Document': this.getDocumentURL(submission, 'mprSubmissions.mpr1.document'),
              'MPR2 Document': this.getDocumentURL(submission, 'mprSubmissions.mpr2.document'),
              'MPR3 Document': this.getDocumentURL(submission, 'mprSubmissions.mpr3.document'),
              'MidSem1 Document': this.getDocumentURL(submission, 'mprSubmissions.midSem1.document'),
            });
          }
        }
  
        // ===== FINAL REPORT MARKS =====
        if (submission.finalReportReview?.marks) {
          const fm = submission.finalReportReview.marks;
          Object.assign(baseData, {
            'Final - Daily Diary (20)': Number(fm.dailyDiary) || 0,
            'Final - Project Outcomes (30)': Number(fm.projectOutcomes) || 0,
            'Final - Objective & Literature (20)': Number(fm.objectiveLiteratureReview) || 0,
            'Final - Methodology (20)': Number(fm.methodologyArea) || 0,
            'Final - Work Description (20)': Number(fm.workDescription) || 0,
            'Final - Results & Discussion (20)': Number(fm.dataResultDiscussion) || 0,
            'Final - Format & Plagiarism (20)': Number(fm.overallFormatPlagiarism) || 0,
            'Final Report Marks (100)': Number(fm.totalReportMarks) || 0,
            'Final - Define Objective (20)': Number(fm.defineObjective) || 0,
            'Final - Content (20)': Number(fm.contentPresentation) || 0,
            'Final - Presentation Skill (20)': Number(fm.presentationSkill) || 0,
            'Final - Relevance (20)': Number(fm.socialIndustrialRelevance) || 0,
            'Final - Q&A (20)': Number(fm.questionAnswer) || 0,
            'Final Presentation Marks (100)': Number(fm.totalPresentationMarks) || 0,
            'FINAL GRAND TOTAL (250)': Number(fm.grandTotal) || 0,
            'Final Report Status': submission.finalReportReview.status || '',
            'Final Report Reviewed On': this.formatDate(submission.finalReportReview.reviewedAt, 'DD/MM/YYYY'),
          });
        } else {
          Object.assign(baseData, {
            'Final - Daily Diary (20)': 0, 'Final - Project Outcomes (30)': 0,
            'Final - Objective & Literature (20)': 0, 'Final - Methodology (20)': 0,
            'Final - Work Description (20)': 0, 'Final - Results & Discussion (20)': 0,
            'Final - Format & Plagiarism (20)': 0, 'Final Report Marks (100)': 0,
            'Final - Define Objective (20)': 0, 'Final - Content (20)': 0,
            'Final - Presentation Skill (20)': 0, 'Final - Relevance (20)': 0,
            'Final - Q&A (20)': 0, 'Final Presentation Marks (100)': 0,
            'FINAL GRAND TOTAL (250)': 0,
            'Final Report Status': submission.finalReportReview?.status || 'Not Started',
            'Final Report Reviewed On': '',
          });
        }
  
        // ===== DOCUMENT LINKS =====
        Object.assign(baseData, {
          'Offer Letter': this.getDocumentURL(submission, 'registrationData.offerLetter'),
          'NOC Letter': this.getDocumentURL(submission, 'registrationData.nocLetter') || this.getDocumentURL(submission, 'registrationData.noc'),
          'Stipend Proof': this.getDocumentURL(submission, 'registrationData.stipendProof'),
          ...((['7th_internship', '8th_internship'].includes(submission.semesterType)) ? {
            'MPR1 Document': this.getDocumentURL(submission, 'mprSubmissions.mpr1.document'),
            'MPR2 Document': this.getDocumentURL(submission, 'mprSubmissions.mpr2.document'),
            'MPR3 Document': this.getDocumentURL(submission, 'mprSubmissions.mpr3.document'),
            'MidSem1 Document': this.getDocumentURL(submission, 'mprSubmissions.midSem1.document'),
          } : {}),
          ...(submission.semesterType === '8th_project' ? {
            'Project Report': this.getDocumentURL(submission, 'registrationData.projectReport'),
          } : {}),
          'Final Report Document': this.getDocumentURL(submission, 'finalReport.finalReport'),
          'Final PPT': this.getDocumentURL(submission, 'finalReport.finalPPT'),
          'Completion Certificate': this.getDocumentURL(submission, 'finalReport.certificate'),
          'Final MPR': this.getDocumentURL(submission, 'finalReport.finalMPR'),
        });
  
        // ===== PPO =====
        if (submission.finalReport?.hasPPO) {
          Object.assign(baseData, {
            'PPO Received': 'Yes',
            'PPO Amount (LPA)': submission.finalReport.ppoAmount || '',
            'PPO Offer Letter': this.getDocumentURL(submission, 'finalReport.ppoOfferLetter'),
          });
        } else {
          baseData['PPO Received'] = 'No';
          baseData['PPO Amount (LPA)'] = '';
          baseData['PPO Offer Letter'] = '';
        }
  
        // ===== FEEDBACK =====
        Object.assign(baseData, {
          'Registration Feedback': submission.registrationReview?.feedback || '',
          'Final Report Feedback': submission.finalReportReview?.feedback || '',
        });
  
        return this.makeUrlsAbsolute(baseData);
      });
  
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);
  
      if (excelData.length > 0) {
        const colWidths = Object.keys(excelData[0]).map(key => {
          const maxLen = Math.max(key.length, ...excelData.slice(0, 100).map(r => String(r[key] || '').length));
          const isWide = key.toLowerCase().includes('document') || key.toLowerCase().includes('letter') ||
            key.toLowerCase().includes('certificate') || key.toLowerCase().includes('ppt') ||
            key.toLowerCase().includes('proof') || key.toLowerCase().includes('feedback') ||
            key.toLowerCase().includes('address');
          return { width: Math.min(Math.max(maxLen + 3, 12), isWide ? 80 : 40) };
        });
        worksheet['!cols'] = colWidths;
      }
  
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Student Data');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  
      const branchLabel = branch ? branch.replace(/\s+/g, '_') : 'All_Branches';
      console.log(`✅ Admin export done: ${excelData.length} rows for ${students.length} students`);
  
      return {
        buffer,
        filename: `Students_${branchLabel}_${moment().format('DD-MM-YYYY')}.xlsx`,
        totalRecords: excelData.length
      };
  
    } catch (error) {
      console.error('Error in exportAllStudentDataByBranch:', error);
      throw new Error('Failed to export student data: ' + error.message);
    }
  }
}

module.exports = new ExcelService();