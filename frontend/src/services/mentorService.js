import api, { apiFormData } from './api'

export const mentorService = {

  getAvailableStudents: async (filters = {}) =>
    (await api.get('/mentor/available-students', { params: filters })).data,
  addStudents: async (studentIds) =>
    (await api.post('/mentor/add-students', { studentIds })).data,
  
  // Dashboard
  getDashboard: async () => {
    const response = await api.get('/mentor/dashboard')
    return response.data
  },

  setDriveFolder: async (folderLink) =>
    (await api.post('/mentor/drive-folder', { folderLink })).data,

  getDriveFolderStatus: async () =>
    (await api.get('/mentor/drive-folder')).data,

  // Student Management
  getAssignedStudents: async (page = 1, limit = 10, filters = {}) => {
    const response = await api.get('/mentor/students', {
      params: { page, limit, ...filters }
    })
    return response.data
  },

  // Submission Review
  getPendingSubmissions: async (page = 1, limit = 10, type = '') => {
    const response = await api.get('/mentor/submissions/pending', {
      params: { page, limit, type }
    })
    return response.data
  },

  getSubmissionHistory: async (page = 1, limit = 10, filters = {}) => {
    const response = await api.get('/mentor/submissions/history', {
      params: { page, limit, ...filters }
    })
    return response.data
  },

  getSubmissionDetails: async (id) => {
    const response = await api.get(`/mentor/submissions/${id}`)  // FIXED: proper template literal
    return response.data
  },
  updateSubmission: async (id, formData) => {
    const response = await apiFormData.put(`/mentor/submissions/${id}`, formData)
    return response.data
  },
  
  reviewSubmission: async (id, action, feedback = '', marks = null) => {
    const response = await api.put(`/mentor/submissions/${id}/review`, {
      action,
      feedback,
      marks  // ✅ ADD THIS - It was missing!
    })
    return response.data
  },

  // NEW: MPR Review Method
  reviewMPR: async (mprId, action, feedback = '') => {
    const response = await api.put(`/mentor/mpr/${mprId}/review`, {
      action,
      feedback
    })
    return response.data
  },

  // Monthly Submissions
  getMonthlySubmissions: async (studentId = '', month = '') => {
    const response = await api.get('/mentor/monthly-submissions', {
      params: { studentId, month }
    })
    return response.data
  },

  // Reminder System
  sendMonthlyReminder: async (studentIds) => {
    const response = await api.post('/mentor/send-monthly-reminder', {
      studentIds
    })
    return response.data
  },

  // Export
  exportAssignedStudents: async () => {
    const response = await api.get('/mentor/export/students', {
      responseType: 'blob'
    })
    return response
  }
}
