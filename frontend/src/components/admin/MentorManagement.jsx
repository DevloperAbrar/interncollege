import React, { useState, useEffect } from 'react'
import { adminService } from '../../services/adminService'
import Table from '../common/Table'
import { Plus, Edit, Trash2, Search, Users, AlertCircle, X, Eye, EyeOff } from 'lucide-react'

const DEPARTMENTS = [
  'Civil Engineering',
  'Mechanical Engineering',
  'Electrical Engineering',
  'Electronics Engineering',
  'Computer Science & Engineering',
  'Information Technology',
  'Centre for Artificial Intelligence',
  'Centre for Internet of Things',
  'Engineering Mathematics & Computing',
  'Centre for Computer Science and Technology',
  'Chemical Engineering',
  'Architecture & Planning',
  'Applied Science',
  'Humanities and Management',
  'Electronics and Telecommunications Engineering'
]

const MentorManagement = () => {
  const [mentors, setMentors] = useState([])
  const [pagination, setPagination] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingMentor, setEditingMentor] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    maxStudents: 20,
    department: ''
  })
  const [formErrors, setFormErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => { loadMentors() }, [])

  const loadMentors = async (page = 1, limit = 10, search = '') => {
    setLoading(true)
    try {
      const response = await adminService.getAllMentors(page, limit, search)
      if (response && response.success) {
        setMentors(response.data.mentors || [])
        setPagination(response.data.pagination || null)
      } else {
        setMentors([])
        alert('Failed to load mentors: ' + (response?.message || 'Unknown error'))
      }
    } catch (error) {
      setMentors([])
      alert('Error loading mentors: ' + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', maxStudents: 20, department: '' })
    setFormErrors({})
    setSubmitError('')
    setShowPassword(false)
  }

  const handleAddMentor = () => {
    resetForm()
    setEditingMentor(null)
    setShowModal(true)
  }

  const handleEdit = (mentor) => {
    setEditingMentor(mentor)
    setFormData({
      name: mentor.name || '',
      email: mentor.email || '',
      password: '',
      maxStudents: mentor.maxStudents || 20,
      department: mentor.department || ''
    })
    setFormErrors({})
    setSubmitError('')
    setShowPassword(false)
    setShowModal(true)
  }

  const handleModalClose = () => {
    setShowModal(false)
    setEditingMentor(null)
    resetForm()
    setIsSubmitting(false)
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.name || !formData.name.trim()) errors.name = 'Name is required'
    if (!formData.email || !formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email'
    }
    if (!editingMentor) {
      if (!formData.password || !formData.password.trim()) errors.password = 'Password is required'
      else if (formData.password.length < 6) errors.password = 'Password must be at least 6 characters'
    } else if (formData.password && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }
    if (!formData.maxStudents || formData.maxStudents < 1 || formData.maxStudents > 100) {
      errors.maxStudents = 'Max students must be between 1 and 100'
    }
    if (!formData.department) errors.department = 'Department is required'
    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)
    setFormErrors({})
    setSubmitError('')

    try {
      const errors = validateForm()
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors)
        return
      }

      const submitData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        maxStudents: parseInt(formData.maxStudents),
        department: formData.department
      }
      if (formData.password && formData.password.trim()) {
        submitData.password = formData.password.trim()
      }

      let response
      if (editingMentor) {
        response = await adminService.updateMentor(editingMentor._id, submitData)
      } else {
        response = await adminService.createMentor(submitData)
      }

      if (response && response.success) {
        if (!editingMentor) {
          alert(`✅ Mentor created successfully!\n\nLogin credentials:\nEmail: ${submitData.email}\nPassword: ${submitData.password}\n\nPlease share these credentials with the mentor.`)
        } else {
          alert(submitData.password ? '✅ Mentor updated successfully! New password has been set.' : '✅ Mentor updated successfully!')
        }
        handleModalClose()
        await loadMentors()
      } else {
        setSubmitError(response?.message || 'Failed to save mentor')
      }
    } catch (error) {
      setSubmitError(error.response?.data?.message || error.message || 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (mentorId) => {
    if (!confirm('⚠️ Are you sure you want to delete this mentor?\n\nThis action cannot be undone.')) return
    try {
      const response = await adminService.deleteMentor(mentorId)
      if (response?.success) {
        alert('✅ Mentor deleted successfully!')
        await loadMentors()
      } else {
        alert('❌ ' + (response?.message || 'Failed to delete mentor'))
      }
    } catch (error) {
      alert('❌ Error deleting mentor: ' + (error.response?.data?.message || error.message))
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: null }))
    if (submitError) setSubmitError('')
  }

  const columns = [
    {
      header: 'Name',
      render: (mentor) => (
        <div>
          <div className="font-medium text-gray-900">{mentor.name}</div>
          <div className="text-sm text-gray-500">{mentor.email}</div>
        </div>
      )
    },
    {
      header: 'Department',
      render: (mentor) => (
        <div className="text-sm text-gray-700">{mentor.department || <span className="text-gray-400">—</span>}</div>
      )
    },
    {
      header: 'Students',
      render: (mentor) => (
        <div className="flex items-center">
          <Users className="h-4 w-4 text-gray-400 mr-2" />
          <span className={mentor.actualStudentCount >= mentor.maxStudents ? 'text-red-600 font-semibold' : ''}>
            {mentor.actualStudentCount || 0} / {mentor.maxStudents}
          </span>
        </div>
      )
    },
    {
      header: 'Actions',
      render: (mentor) => (
        <div className="flex items-center space-x-2">
          <button onClick={() => handleEdit(mentor)} className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50" title="Edit mentor">
            <Edit className="h-4 w-4" />
          </button>
          <button onClick={() => handleDelete(mentor._id)} className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50" title="Delete mentor">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mentor Management</h1>
          <p className="text-gray-600">Manage mentors and their student assignments</p>
        </div>
        <button
          onClick={handleAddMentor}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center disabled:opacity-50"
          disabled={loading}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Mentor
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search mentors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && loadMentors(1, 10, searchTerm)}
            className="pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
          />
        </div>
        <button onClick={() => loadMentors(1, 10, searchTerm)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200" disabled={loading}>
          Search
        </button>
        <div className="text-sm text-gray-500">{mentors.length} mentor{mentors.length !== 1 ? 's' : ''} found</div>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={mentors}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => loadMentors(page, 10, searchTerm)}
        emptyMessage="No mentors found. Click 'Add Mentor' to create the first mentor."
      />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleModalClose}></div>
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingMentor ? 'Edit Mentor' : 'Add New Mentor'}
                </h3>
                <button onClick={handleModalClose} className="text-gray-400 hover:text-gray-600 p-1 rounded" disabled={isSubmitting}>
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {submitError && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start">
                      <AlertCircle className="h-5 w-5 text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                      <div className="text-red-800 text-sm">{submitError}</div>
                    </div>
                  )}

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.name ? 'border-red-300' : 'border-gray-300'}`}
                      placeholder="Enter mentor name"
                      disabled={isSubmitting}
                      autoFocus
                    />
                    {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.email ? 'border-red-300' : 'border-gray-300'}`}
                      placeholder="Enter email address"
                      disabled={isSubmitting}
                    />
                    {formErrors.email && <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>}
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department <span className="text-red-500">*</span></label>
                    <select
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.department ? 'border-red-300' : 'border-gray-300'}`}
                      disabled={isSubmitting}
                    >
                      <option value="">Select Department</option>
                      {DEPARTMENTS.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                    {formErrors.department && <p className="mt-1 text-sm text-red-600">{formErrors.department}</p>}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password {!editingMentor && <span className="text-red-500">*</span>}
                      {editingMentor && <span className="text-xs text-gray-500 ml-1">(leave empty to keep current)</span>}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.password ? 'border-red-300' : 'border-gray-300'}`}
                        placeholder={editingMentor ? "Enter new password (optional)" : "Enter password"}
                        disabled={isSubmitting}
                      />
                      <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                      </button>
                    </div>
                    {formErrors.password && <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>}
                  </div>

                  {/* Max Students */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Students <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={formData.maxStudents}
                      onChange={(e) => handleInputChange('maxStudents', parseInt(e.target.value) || '')}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.maxStudents ? 'border-red-300' : 'border-gray-300'}`}
                      disabled={isSubmitting}
                    />
                    {formErrors.maxStudents && <p className="mt-1 text-sm text-red-600">{formErrors.maxStudents}</p>}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button type="button" onClick={handleModalClose} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50" disabled={isSubmitting}>
                      Cancel
                    </button>
                    <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 min-w-[120px]">
                      {isSubmitting ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {editingMentor ? 'Updating...' : 'Creating...'}
                        </div>
                      ) : (
                        editingMentor ? 'Update Mentor' : 'Create Mentor'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MentorManagement