const { body, validationResult } = require('express-validator');

// Helper function to check validation errors
const checkValidationResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Login validation
const validateLogin = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 1 })
    .withMessage('Password cannot be empty')
];

// Mentor validation functions
const validateMentorCreation = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2-50 characters'),
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('department')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Department must be less than 50 characters'),
  body('designation')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Designation must be less than 50 characters')
];

const validateMentorUpdate = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2-50 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format'),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('department')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Department must be less than 50 characters'),
  body('designation')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Designation must be less than 50 characters'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('Active status must be boolean')
];

// Validate registration submission based on semester type
const validateRegistrationSubmission = [
  body('semesterType')
    .notEmpty()
    .withMessage('Semester type is required')
    .isIn(['6th_internship', '7th_internship', '8th_internship', '8th_project', 'any_internship'])
    .withMessage('Invalid semester type'),

  // Common fields for internships
  body('companyName')
    .if(body('semesterType').not().equals('8th_project'))
    .notEmpty()
    .withMessage('Company name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2-100 characters'),

  body('companyType')
    .if(body('semesterType').not().equals('8th_project'))
    .notEmpty()
    .withMessage('Company type is required'),

  body('internshipType')
    .if(body('semesterType').not().equals('8th_project'))
    .notEmpty()
    .withMessage('Internship type is required'),

  body('internshipTitle')
    .if(body('semesterType').not().equals('8th_project'))
    .notEmpty()
    .withMessage('Internship title is required')
    .isLength({ min: 5, max: 100 })
    .withMessage('Internship title must be between 5-100 characters'),

  body('startDate')
    .if(body('semesterType').not().equals('8th_project'))
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Invalid start date format'),

  body('endDate')
    .if(body('semesterType').not().equals('8th_project'))
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('Invalid end date format')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),

  body('hasStipend')
    .if(body('semesterType').not().equals('8th_project'))
    .isBoolean()
    .withMessage('Stipend status must be boolean'),

  body('stipendAmount')
    .if((value, { req }) => req.body.hasStipend === 'true' || req.body.hasStipend === true)
    .notEmpty()
    .withMessage('Stipend amount is required when stipend is available')
    .isNumeric()
    .withMessage('Stipend amount must be numeric'),

  body('mentorName')
    .if(body('semesterType').not().equals('8th_project'))
    .notEmpty()
    .withMessage('Mentor name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Mentor name must be between 2-50 characters'),

  body('mentorEmail')
    .if(body('semesterType').not().equals('8th_project'))
    .notEmpty()
    .withMessage('Mentor email is required')
    .isEmail()
    .withMessage('Invalid mentor email format'),

  body('hrName')
    .if(body('semesterType').not().equals('8th_project'))
    .notEmpty()
    .withMessage('HR name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('HR name must be between 2-50 characters'),

  body('hrEmail')
    .if(body('semesterType').not().equals('8th_project'))
    .notEmpty()
    .withMessage('HR email is required')
    .isEmail()
    .withMessage('Invalid HR email format'),

  // Fields specific to 8th project
  body('projectTitle')
    .if(body('semesterType').equals('8th_project'))
    .notEmpty()
    .withMessage('Project title is required')
    .isLength({ min: 5, max: 100 })
    .withMessage('Project title must be between 5-100 characters'),

  body('projectType')
    .if(body('semesterType').equals('8th_project'))
    .notEmpty()
    .withMessage('Project type is required')
    .isIn(['software', 'hardware', 'software_hardware', 'experimental'])
    .withMessage('Invalid project type')
];

// Validate MPR submission
const validateMPRSubmission = [
  body('mprType')
    .notEmpty()
    .withMessage('MPR type is required')
    .isIn(['mpr1', 'mpr2', 'mpr3', 'midSem1', 'midSem2'])
    .withMessage('Invalid MPR type')
];

// Validate final report submission based on semester type
const validateFinalReportSubmission = [
  // FIXED: More flexible validation that accounts for file uploads
  body().custom((value, { req }) => {
    // Check if we have either form fields OR files
    const hasFormFields = req.body && Object.keys(req.body).length > 0;
    const hasFiles = req.files && Object.keys(req.files).length > 0;
    
    // At least one of these should be present
    if (!hasFormFields && !hasFiles) {
      throw new Error('Final report submission requires either form data or file uploads');
    }
    return true;
  }),

  // Conference link validation for 8th project (made more flexible)
  body('conferenceLink')
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage('Invalid conference link format'),

  // Research paper status validation
  body('researchPaperStatus')
    .optional({ checkFalsy: true })
    .isIn(['published', 'accepted'])
    .withMessage('Invalid research paper status'),

  // Placement validation (handle both string and boolean)
  body('hasPlacement')
    .optional({ checkFalsy: true })
    .custom(value => {
      // Handle both 'true'/'false' strings and actual booleans
      if (typeof value === 'string') {
        return value === 'true' || value === 'false';
      }
      return typeof value === 'boolean';
    })
    .withMessage('Placement status must be boolean'),

  body('placementFrom')
    .if(body('hasPlacement').custom(value => {
      // Handle both string 'true' and boolean true
      return value === 'true' || value === true;
    }))
    .notEmpty()
    .withMessage('Placement source is required when placement is available')
    .isIn(['college', 'off_campus'])
    .withMessage('Invalid placement source'),

  // PPO validation (handle both string and boolean)
  body('hasPPO')
    .optional({ checkFalsy: true })
    .custom(value => {
      // Handle both 'true'/'false' strings and actual booleans
      if (typeof value === 'string') {
        return value === 'true' || value === 'false';
      }
      return typeof value === 'boolean';
    })
    .withMessage('PPO status must be boolean')
];

// Legacy validation functions for backward compatibility
const validateInternshipSubmission = [
  body('companyName')
    .notEmpty()
    .withMessage('Company name is required'),
  body('internshipTitle')
    .notEmpty()
    .withMessage('Internship title is required'),
  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Invalid start date'),
  body('endDate')
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('Invalid end date')
];

const validateProjectSubmission = [
  body('projectTitle')
    .notEmpty()
    .withMessage('Project title is required'),
  body('projectType')
    .notEmpty()
    .withMessage('Project type is required')
];

const validateMonthlySubmission = [
  body('month')
    .notEmpty()
    .withMessage('Month is required')
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1-12'),
  body('placementStatus')
    .notEmpty()
    .withMessage('Placement status is required')
    .isIn(['yes', 'no'])
    .withMessage('Invalid placement status')
];

// Client-side validation helpers
const validateInternshipForm = (formData) => {
  const errors = {};
  
  if (!formData.companyName?.trim()) {
    errors.companyName = 'Company name is required';
  }
  
  if (!formData.internshipTitle?.trim()) {
    errors.internshipTitle = 'Internship title is required';
  }
  
  if (!formData.startDate) {
    errors.startDate = 'Start date is required';
  }
  
  if (!formData.endDate) {
    errors.endDate = 'End date is required';
  } else if (formData.startDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
    errors.endDate = 'End date must be after start date';
  }
  
  if (!formData.mentorName?.trim()) {
    errors.mentorName = 'Mentor name is required';
  }
  
  if (!formData.industryMentorEmail?.trim()) {
    errors.industryMentorEmail = 'Industry mentor email is required';
  } else if (!/\S+@\S+\.\S+/.test(formData.industryMentorEmail)) {
    errors.industryMentorEmail = 'Invalid email format';
  }
  
  if (!formData.hrEmail?.trim()) {
    errors.hrEmail = 'HR email is required';
  } else if (!/\S+@\S+\.\S+/.test(formData.hrEmail)) {
    errors.hrEmail = 'Invalid email format';
  }
  
  if (!formData.industryType) {
    errors.industryType = 'Industry type is required';
  }
  
  if (!formData.internshipType) {
    errors.internshipType = 'Internship type is required';
  }
  
  if (!formData.stipendPerMonth?.toString().trim()) {
    errors.stipendPerMonth = 'Stipend amount is required';
  } else if (isNaN(formData.stipendPerMonth) || formData.stipendPerMonth < 0) {
    errors.stipendPerMonth = 'Invalid stipend amount';
  }
  
  if (!formData.jobOfferReceived) {
    errors.jobOfferReceived = 'Job offer status is required';
  }
  
  return errors;
};

const validateRegistrationForm = (formData, semesterType) => {
  const errors = {};
  
  if (semesterType === '8th_project') {
    // Project validation
    if (!formData.projectTitle?.trim()) {
      errors.projectTitle = 'Project title is required';
    }
    
    if (!formData.projectType) {
      errors.projectType = 'Project type is required';
    }
  } else {
    // Internship validation
    if (!formData.companyName?.trim()) {
      errors.companyName = 'Company name is required';
    }
    
    if (!formData.companyType) {
      errors.companyType = 'Company type is required';
    }
    
    if (!formData.internshipType) {
      errors.internshipType = 'Internship type is required';
    }
    
    if (!formData.internshipTitle?.trim()) {
      errors.internshipTitle = 'Internship title is required';
    }
    
    if (!formData.startDate) {
      errors.startDate = 'Start date is required';
    }
    
    if (!formData.endDate) {
      errors.endDate = 'End date is required';
    } else if (formData.startDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      errors.endDate = 'End date must be after start date';
    }
    
    if (formData.hasStipend && !formData.stipendAmount) {
      errors.stipendAmount = 'Stipend amount is required when stipend is available';
    }
    
    if (!formData.mentorName?.trim()) {
      errors.mentorName = 'Mentor name is required';
    }
    
    if (!formData.mentorEmail?.trim()) {
      errors.mentorEmail = 'Mentor email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.mentorEmail)) {
      errors.mentorEmail = 'Invalid email format';
    }
    
    if (!formData.hrName?.trim()) {
      errors.hrName = 'HR name is required';
    }
    
    if (!formData.hrEmail?.trim()) {
      errors.hrEmail = 'HR email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.hrEmail)) {
      errors.hrEmail = 'Invalid email format';
    }
  }
  
  return errors;
};

const hasValidationErrors = (errors) => {
  return Object.keys(errors).length > 0;
};

module.exports = {
  validateLogin,
  validateMentorCreation,
  validateMentorUpdate,
  validateRegistrationSubmission,
  validateMPRSubmission,
  validateFinalReportSubmission,
  validateInternshipSubmission,
  validateProjectSubmission,
  validateMonthlySubmission,
  checkValidationResult,
  validateInternshipForm,
  validateRegistrationForm,
  hasValidationErrors
};