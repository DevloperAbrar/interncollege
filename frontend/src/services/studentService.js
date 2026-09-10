import api, { apiFormData } from './api'

export const studentService = {
  // Dashboard
  getDashboard: async () => {
    const response = await api.get('/student/dashboard')
    return response.data
  },

  // Progress
  getProgress: async () => {
    const response = await api.get('/student/progress')
    return response.data
  },

  // New registration submission (replaces old internship/project submissions)
  submitRegistration: async (formData, onUploadProgress) => {
    const response = await apiFormData.post('/student/submit/registration', formData, {
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onUploadProgress(percent)
        }
      }
    })
    return response.data
  },

  // MPR submissions for 7th and 8th semester internships
  submitMPR: async (formData, onUploadProgress) => {
    const response = await apiFormData.post('/student/submit/mpr', formData, {
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onUploadProgress(percent)
        }
      }
    })
    return response.data
  },

  // Final report submission
  submitFinalReport: async (formData, onUploadProgress) => {
    const response = await apiFormData.post('/student/submit/final-report', formData, {
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onUploadProgress(percent)
        }
      }
    })
    return response.data
  },

  // Update submission (for rejected ones)
  updateSubmission: async (id, formData, onUploadProgress) => {
    const response = await apiFormData.put(`/student/submission/${id}`, formData, {
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onUploadProgress(percent)
        }
      }
    })
    return response.data
  },

  // Legacy methods for backward compatibility (if needed)
  submitInternship: async (formData) => {
    console.warn('submitInternship is deprecated, use submitRegistration instead')
    return await studentService.submitRegistration(formData)
  },

  submitProject: async (formData) => {
    console.warn('submitProject is deprecated, use submitRegistration instead')
    return await studentService.submitRegistration(formData)
  },

  submitMonthlyProgress: async (formData) => {
    console.warn('submitMonthlyProgress is deprecated, use submitMPR instead')
    return await studentService.submitMPR(formData)
  },

  getMonthlyRequirements: async () => {
    console.warn('getMonthlyRequirements is deprecated')
    return { success: false, message: 'This endpoint is no longer available' }
  }
}