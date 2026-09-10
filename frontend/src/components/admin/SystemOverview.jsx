import React, { useState, useEffect } from 'react'
import { useApi } from '../../hooks/useApi'
import { adminService } from '../../services/adminService'
import { formatDateTime, downloadFile } from '../../utils/helpers'
import Table from '../common/Table'
import { Download, Filter, Search, Users, FileText, Building, TrendingUp, Edit, Trash2, X, AlertTriangle, CheckSquare, Square, ChevronDown, ChevronUp } from 'lucide-react'

const SystemOverview = () => {
  const { execute, loading } = useApi()
  const [activeTab, setActiveTab] = useState('students')
  const [students, setStudents] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [pagination, setPagination] = useState(null)

  // ── Department is ONLY for export, kept separate from table filters ──────
  const [exportDepartment, setExportDepartment] = useState('')

  // ── Table filters (branch here is the student's own branch field) ────────
  const [filters, setFilters] = useState({
    search: '',
    branch: '',
    mentor: '',
    status: '',
    type: ''
  })

  // ── Dynamic branch list built from actual student data ───────────────────
  const [availableBranches, setAvailableBranches] = useState([])

  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [selectedStudents, setSelectedStudents] = useState([])
  const [bulkDeleteType, setBulkDeleteType] = useState('')
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    branch: '',
    assignedMentor: '',
    isActive: true
  })
  const [mentors, setMentors] = useState([])
  const [showBulkDeleteOptions, setShowBulkDeleteOptions] = useState(false)

  useEffect(() => {
    if (activeTab === 'students') {
      loadStudents()
      loadMentors()
    } else if (activeTab === 'submissions') {
      loadSubmissions()
    }
  }, [activeTab, filters])

  const loadStudents = async (page = 1) => {
    try {
      // NOTE: department is NOT passed here — it's export-only
      const response = await execute(() => adminService.getAllStudents(page, 10, filters))
      if (response.success) {
        setStudents(response.data.students)
        setPagination(response.data.pagination)

        // ── Build dynamic branch list from whatever students are returned ──
        // We load all branches once on first load (no filter) so the list is complete
        if (page === 1 && !filters.branch && !filters.search && !filters.status && !filters.type) {
          const branches = [
            ...new Set(
              response.data.students
                .map(s => typeof s.branch === 'object' ? s.branch?.name : s.branch)
                .filter(Boolean)
            )
          ].sort()
          if (branches.length > 0) setAvailableBranches(branches)
        }
      }
    } catch (error) {
      console.error('Error loading students:', error)
    }
  }

  // ── Load ALL branches for the filter dropdown (unfiltered, page 1, big limit) ─
  const loadAllBranches = async () => {
    try {
      const response = await adminService.getAllStudents(1, 1000, {})
      if (response.success) {
        const branches = [
          ...new Set(
            response.data.students
              .map(s => typeof s.branch === 'object' ? s.branch?.name : s.branch)
              .filter(Boolean)
          )
        ].sort()
        setAvailableBranches(branches)
      }
    } catch (error) {
      console.error('Error loading branches:', error)
    }
  }

  const loadSubmissions = async (page = 1) => {
    try {
      const response = await execute(() => adminService.getAllSubmissions(page, 10, filters))
      if (response.success) {
        setSubmissions(response.data.submissions)
        setPagination(response.data.pagination)
      }
    } catch (error) {
      console.error('Error loading submissions:', error)
    }
  }

  const loadMentors = async () => {
    try {
      const response = await execute(() => adminService.getAllMentors())
      if (response.success) {
        setMentors(response.data || [])
      }
    } catch (error) {
      console.error('Error loading mentors:', error)
    }
  }

  // Load all branches once on mount
  useEffect(() => {
    loadAllBranches()
  }, [])

  const handleEditStudent = (student) => {
    setSelectedStudent(student)
    setEditFormData({
      name: student.name || '',
      email: student.email || '',
      branch: student.branch || '',
      assignedMentor: student.assignedMentor?._id || '',
      isActive: student.isActive
    })
    setShowEditModal(true)
  }

  const handleDeleteStudent = (student) => {
    setSelectedStudent(student)
    setShowDeleteModal(true)
  }

  const handleBulkDelete = (type) => {
    setBulkDeleteType(type)
    setShowBulkDeleteModal(true)
  }

  const handleStudentSelect = (studentId) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
  }

  const handleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(students.map(student => student._id))
    }
  }

  const handleUpdateStudent = async (e) => {
    e.preventDefault()
    try {
      const response = await execute(() =>
        adminService.updateStudent(selectedStudent._id, editFormData)
      )
      if (response.success) {
        setShowEditModal(false)
        setSelectedStudent(null)
        loadStudents()
        loadAllBranches() // refresh branches after edit
        alert('Student updated successfully')
      }
    } catch (error) {
      console.error('Error updating student:', error)
      alert('Failed to update student')
    }
  }

  const handleConfirmDelete = async () => {
    try {
      const response = await execute(() =>
        adminService.deleteStudent(selectedStudent._id)
      )
      if (response.success) {
        setShowDeleteModal(false)
        setSelectedStudent(null)
        loadStudents()
        alert('Student deleted successfully')
      }
    } catch (error) {
      console.error('Error deleting student:', error)
      alert('Failed to delete student')
    }
  }

  const handleConfirmBulkDelete = async () => {
    try {
      let response

      if (bulkDeleteType === 'all') {
        response = await execute(() => adminService.deleteAllStudents())
      } else if (bulkDeleteType === 'selected') {
        response = await execute(() => adminService.deleteSelectedStudents(selectedStudents))
      } else {
        response = await execute(() => adminService.deleteStudentsByType(bulkDeleteType))
      }

      if (response.success) {
        setShowBulkDeleteModal(false)
        setBulkDeleteType('')
        setSelectedStudents([])
        loadStudents()
        loadAllBranches()
        alert(`Students deleted successfully: ${response.data.deletedCount} students removed`)
      }
    } catch (error) {
      console.error('Error in bulk delete:', error)
      alert('Failed to delete students')
    }
  }

  // ── Export: uses exportDepartment (separate from table filters) ───────────
  const handleExport = async (type) => {
    try {
      let response
      let filename

      switch (type) {
        case 'students':
          // ← FIXED: passes exportDepartment, not filters.department
          response = await execute(() => adminService.exportAllStudentData(exportDepartment))
          filename = exportDepartment
            ? `students_${exportDepartment.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`
            : `students_all_${new Date().toISOString().split('T')[0]}.xlsx`
          break
        case 'submissions':
          response = await execute(() => adminService.exportSubmissions())
          filename = `submissions_${new Date().toISOString().split('T')[0]}.xlsx`
          break
        case 'placements':
          response = await execute(() => adminService.exportPlacementStats())
          filename = `placements_${new Date().toISOString().split('T')[0]}.xlsx`
          break
        default:
          return
      }

      downloadFile(response.data, filename)
    } catch (error) {
      console.error('Export error:', error)
    }
  }

  const studentColumns = [
    {
      header: (
        <div className="flex items-center">
          <button
            onClick={handleSelectAll}
            className="mr-3 p-1 hover:bg-gray-100 rounded"
          >
            {selectedStudents.length === students.length && students.length > 0 ? (
              <CheckSquare className="h-4 w-4 text-blue-600" />
            ) : (
              <Square className="h-4 w-4 text-gray-400" />
            )}
          </button>
          Student Details
        </div>
      ),
      render: (student) => (
        <div className="flex items-center">
          <button
            onClick={() => handleStudentSelect(student._id)}
            className="mr-3 p-1 hover:bg-gray-100 rounded"
          >
            {selectedStudents.includes(student._id) ? (
              <CheckSquare className="h-4 w-4 text-blue-600" />
            ) : (
              <Square className="h-4 w-4 text-gray-400" />
            )}
          </button>
          <div>
            <div className="font-medium text-gray-900">{student.name}</div>
            <div className="text-sm text-gray-500">{student.enrollmentNo}</div>
            <div className="text-sm text-gray-500">{student.email}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Branch',
      render: (student) => {
        const b = student.branch
        if (!b) return <span className="text-gray-400">—</span>
        if (typeof b === 'object' && b.name) return <span>{b.name}</span>
        if (typeof b === 'string' && !/^[a-f0-9]{24}$/i.test(b)) return <span>{b}</span>
        return <span className="text-gray-400">—</span>
      }
    },
    {
      header: 'Mentor',
      render: (student) => (
        <div>
          <div className="text-sm text-gray-900">{student.assignedMentor?.name || 'Not Assigned'}</div>
          <div className="text-xs text-gray-500">{student.assignedMentor?.email}</div>
        </div>
      )
    },
    {
      header: 'Submission',
      render: (student) => (
        student.submissionStatus ? (
          <div>
            <span className="capitalize text-sm text-gray-900">{student.submissionStatus.type}</span>
            <div className="mt-1">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${student.submissionStatus.status === 'approved' ? 'bg-green-100 text-green-800' :
                  student.submissionStatus.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                }`}>
                {student.submissionStatus.status}
              </span>
            </div>
          </div>
        ) : (
          <span className="text-sm text-gray-400">No submission</span>
        )
      )
    },
    {
      header: 'Status',
      render: (student) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${student.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
          {student.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      header: 'Actions',
      render: (student) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleEditStudent(student)}
            className="text-blue-600 hover:text-blue-800 p-1"
            title="Edit Student"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteStudent(student)}
            className="text-red-600 hover:text-red-800 p-1"
            title="Delete Student"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ]

  const submissionColumns = [
    {
      header: 'Student',
      render: (submission) => (
        <div>
          <div className="font-medium text-gray-900">{submission.student?.name}</div>
          <div className="text-sm text-gray-500">{submission.student?.enrollmentNo}</div>
        </div>
      )
    },
    {
      header: 'Type',
      render: (submission) => (
        <span className="capitalize">{submission.type}</span>
      )
    },
    {
      header: 'Company/Project',
      render: (submission) => (
        submission.type === 'internship' ? submission.companyName : submission.projectTitle
      )
    },
    {
      header: 'Mentor',
      render: (submission) => submission.mentor?.name
    },
    {
      header: 'Status',
      render: (submission) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${submission.status === 'approved' ? 'bg-green-100 text-green-800' :
            submission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              submission.status === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
          }`}>
          {submission.status}
        </span>
      )
    },
    {
      header: 'Submitted',
      render: (submission) => formatDateTime(submission.createdAt)
    }
  ]

  const tabs = [
    { id: 'students', label: 'Students', icon: Users },
    { id: 'submissions', label: 'Submissions', icon: FileText }
  ]

  const getBulkDeleteTitle = () => {
    switch (bulkDeleteType) {
      case 'all': return 'Delete All Students'
      case 'selected': return `Delete Selected Students (${selectedStudents.length})`
      case '6th_internship': return 'Delete 6th Semester Internship Students'
      case '7th_internship': return 'Delete 7th Semester Internship Students'
      case '8th_internship': return 'Delete 8th Semester Internship Students'
      case '8th_project': return 'Delete 8th Semester Project Students'
      case 'any_internship': return 'Delete Any Other Internship Students'
      default: return 'Delete Students'
    }
  }

  const getBulkDeleteMessage = () => {
    switch (bulkDeleteType) {
      case 'all': return 'This will permanently delete ALL students and their submissions from the system.'
      case 'selected': return `This will permanently delete the ${selectedStudents.length} selected students and all their submissions.`
      case '6th_internship': return 'This will permanently delete all students who have submitted 6th semester internship forms and their submissions.'
      case '7th_internship': return 'This will permanently delete all students who have submitted 7th semester internship forms and their submissions.'
      case '8th_internship': return 'This will permanently delete all students who have submitted 8th semester internship forms and their submissions.'
      case '8th_project': return 'This will permanently delete all students who have submitted 8th semester project forms and their submissions.'
      case 'any_internship': return 'This will permanently delete all students who have submitted any other internship forms and their submissions.'
      default: return 'This will permanently delete the selected students and their submissions.'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Overview</h1>
          <p className="text-gray-600">Comprehensive view of all students and submissions</p>
        </div>

        <div className="flex items-center space-x-3">
          {/* ── Export department selector — ONLY affects export, not table ── */}
          <div className="flex items-center space-x-2">
            <select
              value={exportDepartment}
              onChange={(e) => setExportDepartment(e.target.value)}
              className="input-field w-56 text-sm"
            >
              <option value="">All Branches</option>
              {availableBranches.map(branch => (
                <option key={branch} value={branch}>{branch}</option>
              ))}
            </select>
            <button
              onClick={() => handleExport('students')}
              className="btn-secondary flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              {exportDepartment ? `Export (${exportDepartment})` : 'Export Students'}
            </button>
          </div>

          {/* <button
            onClick={() => handleExport('submissions')}
            className="btn-secondary flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Submissions
          </button>
          <button
            onClick={() => handleExport('placements')}
            className="btn-primary flex items-center"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Export Placements
          </button> */}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Collapsible Bulk Actions */}
      {activeTab === 'students' && (
        <div className="bg-red-50 border border-red-200 rounded-lg">
          <button
            onClick={() => setShowBulkDeleteOptions(!showBulkDeleteOptions)}
            className="w-full p-4 flex items-center justify-between hover:bg-red-100 transition-colors rounded-lg"
          >
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
              <div className="text-left">
                <h3 className="text-lg font-semibold text-red-900">Bulk Delete Options</h3>
                <p className="text-sm text-red-700">Click to expand dangerous operations</p>
              </div>
            </div>
            {showBulkDeleteOptions ? (
              <ChevronUp className="h-5 w-5 text-red-600" />
            ) : (
              <ChevronDown className="h-5 w-5 text-red-600" />
            )}
          </button>

          {showBulkDeleteOptions && (
            <div className="px-4 pb-4 border-t border-red-200">
              <div className="pt-4">
                <p className="text-sm text-red-700 mb-4 font-medium">
                  ⚠️ WARNING: All deletions are permanent and cannot be undone!
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button onClick={() => handleBulkDelete('all')} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">Delete All Students</button>
                  <button onClick={() => handleBulkDelete('selected')} disabled={selectedStudents.length === 0} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Delete Selected ({selectedStudents.length})</button>
                  <button onClick={() => handleBulkDelete('6th_internship')} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">Delete 6th Sem</button>
                  <button onClick={() => handleBulkDelete('7th_internship')} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">Delete 7th Sem</button>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <button onClick={() => handleBulkDelete('8th_internship')} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">Delete 8th Sem Internship</button>
                  <button onClick={() => handleBulkDelete('8th_project')} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">Delete 8th Sem Project</button>
                  <button onClick={() => handleBulkDelete('any_internship')} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">Delete Any Other</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="pl-10 input-field w-64"
          />
        </div>

        {activeTab === 'students' && (
          <>
            {/* ── FIXED: dynamic branch list from real student data ── */}
            <select
              value={filters.branch}
              onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
              className="input-field w-48"
            >
              <option value="">All Branches</option>
              {availableBranches.map(branch => (
                <option key={branch} value={branch}>{branch}</option>
              ))}
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="input-field w-32"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="input-field w-48"
            >
              <option value="">All Submission Types</option>
              <option value="6th_internship">6th Semester Internship</option>
              <option value="7th_internship">7th Semester Internship</option>
              <option value="8th_internship">8th Semester Internship</option>
              <option value="8th_project">8th Semester Project</option>
              <option value="any_internship">Any Other Internship</option>
            </select>
          </>
        )}

        {activeTab === 'submissions' && (
          <>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="input-field w-40"
            >
              <option value="">All Types</option>
              <option value="6th_internship">6th Sem Internship</option>
              <option value="7th_internship">7th Sem Internship</option>
              <option value="8th_internship">8th Sem Internship</option>
              <option value="8th_project">8th Sem Project</option>
              <option value="any_internship">Any Other</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="input-field w-36"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </>
        )}
      </div>

      {/* Content */}
      {activeTab === 'students' && (
        <Table
          columns={studentColumns}
          data={students}
          loading={loading}
          pagination={pagination}
          onPageChange={loadStudents}
          emptyMessage="No students found"
        />
      )}

      {activeTab === 'submissions' && (
        <Table
          columns={submissionColumns}
          data={submissions}
          loading={loading}
          pagination={pagination}
          onPageChange={loadSubmissions}
          emptyMessage="No submissions found"
        />
      )}

      {/* Edit Student Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Edit Student</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input type="text" value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} className="input-field" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" value={editFormData.email} onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })} className="input-field" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Branch</label>
                {/* ── FIXED: edit modal also uses dynamic branches ── */}
                <select value={editFormData.branch} onChange={(e) => setEditFormData({ ...editFormData, branch: e.target.value })} className="input-field" required>
                  <option value="">Select Branch</option>
                  {availableBranches.map(branch => (
                    <option key={branch} value={branch}>{branch}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Assigned Mentor</label>
                <select value={editFormData.assignedMentor} onChange={(e) => setEditFormData({ ...editFormData, assignedMentor: e.target.value })} className="input-field">
                  <option value="">Select Mentor</option>
                  {mentors.map((mentor) => (
                    <option key={mentor._id} value={mentor._id}>
                      {mentor.name} ({mentor.currentStudentCount}/{mentor.maxStudents})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <input type="checkbox" checked={editFormData.isActive} onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })} className="h-4 w-4 text-blue-600 rounded" />
                <label className="ml-2 block text-sm text-gray-900">Active Student</label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Updating...' : 'Update Student'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Single Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Confirm Delete</h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600">Are you sure you want to delete <strong>{selectedStudent?.name}</strong>?</p>
              <p className="text-sm text-red-600 mt-2"><strong>Warning:</strong> This will permanently delete the student and all their submissions. This action cannot be undone.</p>
            </div>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowDeleteModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleConfirmDelete} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700" disabled={loading}>{loading ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[500px] shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">{getBulkDeleteTitle()}</h3>
              <button onClick={() => setShowBulkDeleteModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
            </div>
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
                <div>
                  <p className="text-lg font-semibold text-red-900">DANGER ZONE</p>
                  <p className="text-sm text-red-700">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-4">{getBulkDeleteMessage()}</p>
              <div className="bg-red-100 border border-red-300 rounded-lg p-4">
                <p className="text-sm text-red-800 font-medium">Please type "DELETE" in the box below to confirm:</p>
                <input type="text" placeholder="Type DELETE to confirm" className="w-full mt-2 px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" onChange={(e) => setDeleteConfirmation(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button onClick={() => { setShowBulkDeleteModal(false); setDeleteConfirmation('') }} className="btn-secondary">Cancel</button>
              <button onClick={handleConfirmBulkDelete} disabled={deleteConfirmation !== 'DELETE' || loading} className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {loading ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SystemOverview