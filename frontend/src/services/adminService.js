import api from './api'

export const adminService = {
  
  // Add these to adminService object:

// Departments
getDepartments: async () => (await api.get('/admin/departments')).data,
createDepartment: async (data) => (await api.post('/admin/departments', data)).data,
updateDepartment: async (id, data) => (await api.put(`/admin/departments/${id}`, data)).data,
deleteDepartment: async (id) => (await api.delete(`/admin/departments/${id}`)).data,

// Dept Admins
getAllDeptAdmins: async (page = 1, limit = 10, search = '') =>
  (await api.get('/admin/dept-admins', { params: { page, limit, search } })).data,
createDeptAdmin: async (data) => (await api.post('/admin/dept-admins', data)).data,
deleteDeptAdmin: async (id) => (await api.delete(`/admin/dept-admins/${id}`)).data,
  // Dashboard

  getDashboardStats: async () => {
    
    try {
      const response = await api.get('/admin/dashboard')
      return response.data
    } catch (error) {
      console.error('Get dashboard stats error:', error)
      throw error
    }
  },

  // Mentor Management
  createMentor: async (mentorData) => {
    try {
      console.log('AdminService: Creating mentor with data:', { 
        ...mentorData, 
        password: mentorData.password ? '[SET]' : '[NOT SET]' 
      })
      const response = await api.post('/admin/mentors', mentorData)
      console.log('AdminService: Create mentor response:', response.data)
      return response.data
    } catch (error) {
      console.error('AdminService: Create mentor error:', error.response?.data || error.message)
      throw error
    }
  },

  getAllMentors: async (page = 1, limit = 10, search = '') => {
    try {
      const response = await api.get('/admin/mentors', {
        params: { page, limit, search }
      })
      return response.data
    } catch (error) {
      console.error('Get all mentors error:', error)
      throw error
    }
  },

  updateMentor: async (id, mentorData) => {
    try {
      console.log('AdminService: Updating mentor with data:', { 
        ...mentorData, 
        password: mentorData.password ? '[SET]' : '[NOT SET]' 
      })
      const response = await api.put(`/admin/mentors/${id}`, mentorData)
      console.log('AdminService: Update mentor response:', response.data)
      return response.data
    } catch (error) {
      console.error('AdminService: Update mentor error:', error.response?.data || error.message)
      throw error
    }
  },

  deleteMentor: async (id) => {
    try {
      const response = await api.delete(`/admin/mentors/${id}`)
      return response.data
    } catch (error) {
      console.error('Delete mentor error:', error)
      throw error
    }
  },

  // Student Management
  getAllStudents: async (page = 1, limit = 10, filters = {}) => {
    const response = await api.get('/admin/students', {
      params: {
        page,
        limit,
        search: filters.search || '',
        branch: filters.branch || '',
        mentor: filters.mentor || '',
        status: filters.status || '',
        type: filters.type || '',
        department: filters.department || ''   // ← ADD THIS
      }
    })
    return response.data
  },

  updateStudent: async (id, studentData) => {
    try {
      const response = await api.put(`/admin/students/${id}`, studentData)
      return response.data
    } catch (error) {
      console.error('Update student error:', error)
      throw error
    }
  },

  deleteStudent: async (id) => {
    try {
      const response = await api.delete(`/admin/students/${id}`)
      return response.data
    } catch (error) {
      console.error('Delete student error:', error)
      throw error
    }
  },

  // NEW: Bulk Delete Methods
  deleteAllStudents: async () => {
    try {
      console.log('AdminService: Deleting all students...')
      const response = await api.delete('/admin/students/bulk/all')
      console.log('AdminService: Delete all students response:', response.data)
      return response.data
    } catch (error) {
      console.error('AdminService: Delete all students error:', error.response?.data || error.message)
      throw error
    }
  },

  deleteSelectedStudents: async (studentIds) => {
    try {
      console.log('AdminService: Deleting selected students:', studentIds.length)
      const response = await api.delete('/admin/students/bulk/selected', {
        data: { studentIds }
      })
      console.log('AdminService: Delete selected students response:', response.data)
      return response.data
    } catch (error) {
      console.error('AdminService: Delete selected students error:', error.response?.data || error.message)
      throw error
    }
  },

  deleteStudentsByType: async (type) => {
    try {
      console.log('AdminService: Deleting students by type:', type)
      const response = await api.delete(`/admin/students/bulk/type/${type}`)
      console.log('AdminService: Delete students by type response:', response.data)
      return response.data
    } catch (error) {
      console.error('AdminService: Delete students by type error:', error.response?.data || error.message)
      throw error
    }
  },

  addStudent: async (studentData) => {
    try {
      console.log('AdminService: Adding student:', studentData)
      const response = await api.post('/admin/students/add-single', studentData)
      console.log('AdminService: Add student response:', response.data)
      return response.data
    } catch (error) {
      console.error('AdminService: Add student error:', error.response?.data || error.message)
      throw error
    }
  },

  // Bulk Upload - FIXED VERSION
  bulkUploadStudents: async (file) => {
    try {
      console.log('AdminService: Bulk upload file:', file);
      
      // Create FormData properly
      const formData = new FormData();
      formData.append('csvFile', file); // 'csvFile' matches the multer field name
      
      // Log FormData contents for debugging
      console.log('FormData created with file:', file.name, 'Size:', file.size);
      
      const response = await api.post('/admin/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 60000 // 60 seconds timeout for large files
      });
      
      console.log('AdminService: Bulk upload response:', response.data);
      return response.data;
    } catch (error) {
      console.error('AdminService: Bulk upload error:', error.response?.data || error.message);
      throw error;
    }
  },

  // FIXED: Don't pass adminId from frontend
  getBulkUploadHistory: async (page = 1, limit = 10) => {
    try {
      const response = await api.get('/admin/bulk-upload/history', {
        params: { page, limit }
      })
      return response.data
    } catch (error) {
      console.error('Get bulk upload history error:', error)
      throw error
    }
  },

  // Submissions Management
  getAllSubmissions: async (page = 1, limit = 10, type = '', status = '', mentor = '') => {
    try {
      const response = await api.get('/admin/submissions', {
        params: { page, limit, type, status, mentor }
      })
      return response.data
    } catch (error) {
      console.error('Get all submissions error:', error)
      throw error
    }
  },

  // Export Functions

  // ─── FIXED: department is now passed as query param so backend filters correctly
  exportAllStudentData: async (branch = '') => {
    try {
      const response = await api.get('/admin/export/students', {
        params: branch ? { branch } : {},
        responseType: 'blob'
      })
      return response
    } catch (error) {
      console.error('Export student data error:', error)
      throw error
    }
  },

  exportSubmissions: async () => {
    try {
      const response = await api.get('/admin/export/submissions', {
        responseType: 'blob'
      })
      return response
    } catch (error) {
      console.error('Export submissions error:', error)
      throw error
    }
  },

  exportPlacementStats: async () => {
    try {
      const response = await api.get('/admin/export/placements', {
        responseType: 'blob'
      })
      return response
    } catch (error) {
      console.error('Export placement stats error:', error)
      throw error
    }
  }
}