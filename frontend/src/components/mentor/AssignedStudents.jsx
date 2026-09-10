import React, { useState, useEffect } from 'react'
import { useApi } from '../../hooks/useApi'
import { mentorService } from '../../services/mentorService'
import { formatDateTime, debounce } from '../../utils/helpers'
import Table from '../common/Table'
import { StatusBadge } from '../common/ProgressIndicator'
import { Search, Users, Mail, Calendar, FileText } from 'lucide-react'

const AssignedStudents = () => {
  const { execute, loading } = useApi()
  const [students, setStudents] = useState([])
  const [pagination, setPagination] = useState(null)
  const [filters, setFilters] = useState({
    search: '',
    status: ''
  })

  useEffect(() => {
    loadStudents()
  }, [])

  const debouncedSearch = debounce((searchTerm) => {
    loadStudents(1, 10, { ...filters, search: searchTerm })
  }, 500)

  useEffect(() => {
    debouncedSearch(filters.search)
  }, [filters.search])

  const loadStudents = async (page = 1, limit = 10, currentFilters = filters) => {
    try {
      const response = await execute(() => mentorService.getAssignedStudents(page, limit, currentFilters))
      if (response.success) {
        setStudents(response.data.students)
        setPagination(response.data.pagination)
      }
    } catch (error) {
      console.error('Error loading students:', error)
    }
  }

  const sendReminder = async (studentIds) => {
    try {
      await execute(() => mentorService.sendMonthlyReminder(studentIds))
      alert('Reminders sent successfully!')
    } catch (error) {
      console.error('Error sending reminders:', error)
    }
  }

  const columns = [
    {
      header: 'Student Details',
      render: (student) => (
        <div>
          <div className="font-medium text-gray-900">{student.name}</div>
          <div className="text-sm text-gray-500">{student.enrollmentNo}</div>
          <div className="text-sm text-gray-500">{student.email}</div>
          <div className="text-sm text-gray-500">{student.branch}</div>
        </div>
      )
    },
    {
      header: 'Submission Status',
      render: (student) => (
        student.submissionStatus ? (
          <div>
            <div className="flex items-center mb-1">
              <FileText className="h-4 w-4 text-gray-400 mr-1" />
              <span className="capitalize text-sm text-gray-900">{student.submissionStatus.type}</span>
            </div>
            <StatusBadge status={student.submissionStatus.status} />
            {student.submissionStatus.submittedAt && (
              <div className="text-xs text-gray-500 mt-1">
                Submitted: {formatDateTime(student.submissionStatus.submittedAt)}
              </div>
            )}
          </div>
        ) : (
          <span className="text-sm text-gray-400">No submission</span>
        )
      )
    },
    {
      header: 'Monthly Progress',
      render: (student) => (
        student.submissionStatus?.type === 'internship' && student.submissionStatus?.status === 'approved' ? (
          <div>
            <div className="text-sm text-gray-900">
              {student.submissionStatus.monthlySubmissions?.completed || 0} / {student.submissionStatus.monthlySubmissions?.required || 0}
            </div>
            <div className="w-16 bg-gray-200 rounded-full h-1 mt-1">
              <div 
                className="bg-blue-600 h-1 rounded-full"
                style={{ 
                  width: `${((student.submissionStatus.monthlySubmissions?.completed || 0) / (student.submissionStatus.monthlySubmissions?.required || 1)) * 100}%` 
                }}
              ></div>
            </div>
          </div>
        ) : (
          <span className="text-sm text-gray-400">N/A</span>
        )
      )
    },
    {
      header: 'Account Status',
      render: (student) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          student.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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
            onClick={() => sendReminder([student._id])}
            className="text-blue-600 hover:text-blue-900 text-sm"
            disabled={!student.submissionStatus || student.submissionStatus.type !== 'internship'}
          >
            <Mail className="h-4 w-4" />
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
          <h1 className="text-2xl font-bold text-gray-900">My Students</h1>
          <p className="text-gray-600">Manage and monitor your assigned students</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              const studentsNeedingReminder = students.filter(s => 
                s.submissionStatus?.type === 'internship' && s.submissionStatus?.status === 'approved'
              ).map(s => s._id)
              
              if (studentsNeedingReminder.length > 0) {
                sendReminder(studentsNeedingReminder)
              }
            }}
            className="btn-secondary flex items-center"
          >
            <Mail className="h-4 w-4 mr-2" />
            Send Bulk Reminder
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search students..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="pl-10 input-field"
          />
        </div>
        
        <select
          value={filters.status}
          onChange={(e) => {
            const newFilters = { ...filters, status: e.target.value }
            setFilters(newFilters)
            loadStudents(1, 10, newFilters)
          }}
          className="input-field w-40"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Students Table */}
      <Table
        columns={columns}
        data={students}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => loadStudents(page, 10, filters)}
        emptyMessage="No students assigned to you yet"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-xl font-bold text-gray-900">{students.length}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Submitted</p>
              <p className="text-xl font-bold text-gray-900">
                {students.filter(s => s.submissionStatus).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Active Internships</p>
              <p className="text-xl font-bold text-gray-900">
                {students.filter(s => 
                  s.submissionStatus?.type === 'internship' && 
                  s.submissionStatus?.status === 'approved'
                ).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AssignedStudents