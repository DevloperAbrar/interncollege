import React, { useState, useEffect } from 'react'
import { useApi } from '../../hooks/useApi'
import { mentorService } from '../../services/mentorService'
import { formatDateTime, formatCurrency } from '../../utils/helpers'
import Table from '../common/Table'
import { 
  Calendar, 
  TrendingUp, 
  Building, 
  DollarSign, 
  ExternalLink,
  Users,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'

const ProgressMonitoring = () => {
  const { execute, loading } = useApi()
  const [monthlySubmissions, setMonthlySubmissions] = useState([])
  const [filters, setFilters] = useState({
    studentId: '',
    month: ''
  })
  const [students, setStudents] = useState([])

  useEffect(() => {
    loadMonthlySubmissions()
    loadStudents()
  }, [filters])

  const loadMonthlySubmissions = async () => {
    try {
      const response = await execute(() => mentorService.getMonthlySubmissions(filters.studentId, filters.month))
      if (response.success) {
        setMonthlySubmissions(response.data)
      }
    } catch (error) {
      console.error('Error loading monthly submissions:', error)
    }
  }

  const loadStudents = async () => {
    try {
      const response = await execute(() => mentorService.getAssignedStudents(1, 100))
      if (response.success) {
        const internshipStudents = response.data.students.filter(s => 
          s.submissionStatus?.type === 'internship' && s.submissionStatus?.status === 'approved'
        )
        setStudents(internshipStudents)
      }
    } catch (error) {
      console.error('Error loading students:', error)
    }
  }

  const columns = [
    {
      header: 'Student',
      render: (submission) => (
        <div>
          <div className="font-medium text-gray-900">{submission.student?.name}</div>
          <div className="text-sm text-gray-500">{submission.student?.enrollmentNo}</div>
          <div className="text-sm text-gray-500">{submission.student?.branch}</div>
        </div>
      )
    },
    {
      header: 'Company',
      render: (submission) => (
        <div className="flex items-center">
          <Building className="h-4 w-4 text-gray-400 mr-2" />
          <span>{submission.companyName}</span>
        </div>
      )
    },
    {
      header: 'Month',
      render: (submission) => (
        <div className="flex items-center">
          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
          <span>Month {submission.month}</span>
        </div>
      )
    },
    {
      header: 'Placement Status',
      render: (submission) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          submission.placementStatus === 'yes' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {submission.placementStatus === 'yes' ? 'Placed' : 'Not Placed'}
        </span>
      )
    },
    {
      header: 'Package',
      render: (submission) => (
        submission.placementStatus === 'yes' && submission.packageAmount ? (
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 text-green-600 mr-1" />
            <span className="font-medium text-green-600">
              {formatCurrency(submission.packageAmount)}
            </span>
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )
      )
    },
    {
      header: 'Presentation',
      render: (submission) => (
        submission.submissionPPT ? (
          <a
            href={submission.submissionPPT}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            View PPT
          </a>
        ) : (
          <span className="text-gray-400">Not available</span>
        )
      )
    },
    {
      header: 'Submitted',
      render: (submission) => formatDateTime(submission.submittedAt)
    }
  ]

  // Calculate summary statistics
  const totalSubmissions = monthlySubmissions.length
  const placedStudents = monthlySubmissions.filter(s => s.placementStatus === 'yes').length
  const averagePackage = monthlySubmissions
    .filter(s => s.placementStatus === 'yes' && s.packageAmount)
    .reduce((sum, s, _, arr) => sum + (s.packageAmount / arr.length), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Progress Monitoring</h1>
        <p className="text-gray-600">Monitor monthly progress and placement status of your students</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Reports</p>
              <p className="text-2xl font-bold text-gray-900">{totalSubmissions}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Placed Students</p>
              <p className="text-2xl font-bold text-gray-900">{placedStudents}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Placement Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalSubmissions > 0 ? Math.round((placedStudents / totalSubmissions) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100">
              <DollarSign className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Package</p>
              <p className="text-2xl font-bold text-gray-900">
                {averagePackage > 0 ? formatCurrency(averagePackage) : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <select
          value={filters.studentId}
          onChange={(e) => setFilters({ ...filters, studentId: e.target.value })}
          className="input-field w-64"
        >
          <option value="">All Students</option>
          {students.map(student => (
            <option key={student._id} value={student._id}>
              {student.name} ({student.enrollmentNo})
            </option>
          ))}
        </select>

        <select
          value={filters.month}
          onChange={(e) => setFilters({ ...filters, month: e.target.value })}
          className="input-field w-40"
        >
          <option value="">All Months</option>
          {[...Array(12)].map((_, i) => (
            <option key={i + 1} value={i + 1}>
              Month {i + 1}
            </option>
          ))}
        </select>
      </div>

      {/* Monthly Submissions Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Monthly Progress Reports</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Users className="h-4 w-4" />
            <span>{monthlySubmissions.length} reports</span>
          </div>
        </div>

        {monthlySubmissions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((column, index) => (
                    <th
                      key={index}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {monthlySubmissions.map((submission, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    {columns.map((column, colIndex) => (
                      <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {column.render ? column.render(submission) : submission[column.accessor]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No monthly progress reports found</p>
            <p className="text-sm text-gray-400 mt-1">Students will submit monthly reports during their internship period</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProgressMonitoring