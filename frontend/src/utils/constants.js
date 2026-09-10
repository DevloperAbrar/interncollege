// Industry Types
export const INDUSTRY_TYPES = [
  'IT',
  'Manufacturing',
  'Healthcare',
  'Finance',
  'Education',
  'Automotive',
  'Telecom',
  'Other'
]

// Internship Types
export const INTERNSHIP_TYPES = [
  'Full-time',
  'Part-time',
  'Remote',
  'Hybrid',
  'On-site'
]

// Project Types
export const PROJECT_TYPES = [
  'Web Development',
  'Mobile App',
  'AI/ML',
  'Data Science',
  'IoT',
  'Blockchain',
  'Game Development',
  'Other'
]

// User Roles
export const USER_ROLES = [
  'admin',
  'mentor',
  'student'
]

// Submission Status
export const SUBMISSION_STATUS = [
  'pending',
  'approved',
  'rejected',
  'completed'
]

// File Types
export const ALLOWED_FILE_TYPES = {
  pdf: 'application/pdf',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv'
}

// Navigation Items
export const NAVIGATION = {
  admin: [
    { name: 'Dashboard', path: '/admin/dashboard', icon: 'LayoutDashboard' },
    { name: 'Mentors', path: '/admin/mentors', icon: 'Users' },
    { name: 'Bulk Upload', path: '/admin/bulk-upload', icon: 'Upload' },
    { name: 'System Overview', path: '/admin/system-overview', icon: 'BarChart3' }
  ],
  mentor: [
    { name: 'Dashboard', path: '/mentor/dashboard', icon: 'LayoutDashboard' },
    { name: 'My Students', path: '/mentor/students', icon: 'Users' },
    { name: 'Review Submissions', path: '/mentor/submissions', icon: 'FileCheck' },
    // { name: 'Progress Monitoring', path: '/mentor/monitoring', icon: 'TrendingUp' }
  ],
  student: [
    { name: 'Dashboard', path: '/student/dashboard', icon: 'LayoutDashboard' },
    { name: 'Submit Choice', path: '/student/choice', icon: 'FileText' },
    { name: 'Progress', path: '/student/progress', icon: 'TrendingUp' },
    // { name: 'Monthly Report', path: '/student/monthly', icon: 'Calendar' }
  ]
}

// Status Colors
export const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  completed: 'bg-blue-100 text-blue-800'
}

// Toast Types
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
}