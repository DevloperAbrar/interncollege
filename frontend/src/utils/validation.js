

// Email validation
export const validateEmail = (email) => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
  return emailRegex.test(email)
}

// Password validation
export const validatePassword = (password) => {
  return password && password.length >= 6
}

// Name validation
export const validateName = (name) => {
  return name && name.trim().length >= 2 && name.trim().length <= 50
}

// Enrollment number validation
export const validateEnrollmentNo = (enrollmentNo) => {
  return enrollmentNo && enrollmentNo.trim().length > 0
}

// Phone number validation
export const validatePhoneNumber = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/
  return phoneRegex.test(phone)
}

// Date validation
export const validateDate = (date) => {
  return date && !isNaN(new Date(date))
}

// End date after start date validation
export const validateEndDateAfterStartDate = (startDate, endDate) => {
  if (!startDate || !endDate) return false
  return new Date(endDate) > new Date(startDate)
}

// File validation
export const validateFile = (file, allowedTypes = [], maxSize = 10 * 1024 * 1024) => {
  const errors = []
  
  if (!file) {
    errors.push('File is required')
    return errors
  }
  
  if (maxSize && file.size > maxSize) {
    errors.push(`File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`)
  }
  
  if (allowedTypes.length > 0) {
    const fileExtension = file.name.split('.').pop().toLowerCase()
    if (!allowedTypes.includes(fileExtension)) {
      errors.push(`File type must be one of: ${allowedTypes.join(', ')}`)
    }
  }
  
  return errors
}

// Form validation for registration
export const validateRegistrationForm = (data, isProjectType, files) => {
  const errors = {}
  
  if (isProjectType) {
    // Project validation
    if (!data.projectTitle?.trim() || data.projectTitle.trim().length < 5) {
      errors.projectTitle = 'Project title must be at least 5 characters long'
    }
    
    if (!data.projectType) {
      errors.projectType = 'Project type is required'
    }
    
    if (!files.projectReport) {
      errors.projectReport = 'Project report document is required'
    }
  } else {
    // Internship validation
    if (!data.companyName?.trim()) {
      errors.companyName = 'Company name is required'
    }
    
    if (!data.internshipTitle?.trim()) {
      errors.internshipTitle = 'Internship title is required'
    }
    
    if (!validateDate(data.startDate)) {
      errors.startDate = 'Valid start date is required'
    }
    
    if (!validateDate(data.endDate)) {
      errors.endDate = 'Valid end date is required'
    }
    
    if (data.startDate && data.endDate && !validateEndDateAfterStartDate(data.startDate, data.endDate)) {
      errors.endDate = 'End date must be after start date'
    }
    
    if (!data.mentorName?.trim()) {
      errors.mentorName = 'Mentor name is required'
    }
    
    if (!validateEmail(data.mentorEmail)) {
      errors.mentorEmail = 'Valid mentor email is required'
    }
    
    if (!data.hrName?.trim()) {
      errors.hrName = 'HR name is required'
    }
    
    if (!validateEmail(data.hrEmail)) {
      errors.hrEmail = 'Valid HR email is required'
    }
    
    if (!files.offerLetter) {
      errors.offerLetter = 'Offer letter is required'
    }
    
    if (!files.nocLetter) {
      errors.nocLetter = 'NOC letter is required'
    }
    
    // Stipend validation (only if stipend is enabled)
    if (data.hasStipend) {
      if (!data.stipendAmount || isNaN(data.stipendAmount) || data.stipendAmount <= 0) {
        errors.stipendAmount = 'Valid stipend amount is required'
      }
      
      if (!files.stipendProof) {
        errors.stipendProof = 'Stipend proof document is required'
      }
    }
  }
  
  return errors
}

// Form validation for internship submission
export const validateInternshipForm = (data) => {
  const errors = {}
  
  if (!data.companyName?.trim()) {
    errors.companyName = 'Company name is required'
  }
  
  if (!data.internshipTitle?.trim()) {
    errors.internshipTitle = 'Internship title is required'
  }
  
  if (!validateDate(data.startDate)) {
    errors.startDate = 'Valid start date is required'
  }
  
  if (!validateDate(data.endDate)) {
    errors.endDate = 'Valid end date is required'
  }
  
  if (data.startDate && data.endDate && !validateEndDateAfterStartDate(data.startDate, data.endDate)) {
    errors.endDate = 'End date must be after start date'
  }
  
  if (!data.mentorName?.trim()) {
    errors.mentorName = 'Industry mentor name is required'
  }
  
  if (!validateEmail(data.industryMentorEmail)) {
    errors.industryMentorEmail = 'Valid industry mentor email is required'
  }
  
  if (!validateEmail(data.hrEmail)) {
    errors.hrEmail = 'Valid HR email is required'
  }
  
  if (!data.industryType) {
    errors.industryType = 'Industry type is required'
  }
  
  if (!data.internshipType) {
    errors.internshipType = 'Internship type is required'
  }
  
  if (!data.stipendPerMonth || isNaN(data.stipendPerMonth) || data.stipendPerMonth < 0) {
    errors.stipendPerMonth = 'Valid stipend amount is required'
  }
  
  if (!data.jobOfferReceived) {
    errors.jobOfferReceived = 'Job offer status is required'
  }
  
  return errors
}

// Form validation for project submission
export const validateProjectForm = (data) => {
  const errors = {}
  
  if (!data.projectTitle?.trim() || data.projectTitle.trim().length < 5) {
    errors.projectTitle = 'Project title must be at least 5 characters long'
  }
  
  if (!data.projectType) {
    errors.projectType = 'Project type is required'
  }
  
  return errors
}

// Form validation for monthly submission
export const validateMonthlyForm = (data) => {
  const errors = {}
  
  if (!data.month || isNaN(data.month) || data.month < 1 || data.month > 12) {
    errors.month = 'Valid month is required'
  }
  
  if (!data.placementStatus) {
    errors.placementStatus = 'Placement status is required'
  }
  
  if (data.placementStatus === 'yes' && (!data.packageAmount || isNaN(data.packageAmount) || data.packageAmount <= 0)) {
    errors.packageAmount = 'Package amount is required when placed'
  }
  
  return errors
}

// Form validation for mentor creation
export const validateMentorForm = (data) => {
  const errors = {}
  
  if (!validateName(data.name)) {
    errors.name = 'Name must be between 2 and 50 characters'
  }
  
  if (!validateEmail(data.email)) {
    errors.email = 'Valid email is required'
  }
  
  if (!data.maxStudents || isNaN(data.maxStudents) || data.maxStudents < 1 || data.maxStudents > 100) {
    errors.maxStudents = 'Max students must be between 1 and 100'
  }
  
  return errors
}

// Check if object has errors
export const hasValidationErrors = (errors) => {
  return Object.keys(errors).length > 0
}