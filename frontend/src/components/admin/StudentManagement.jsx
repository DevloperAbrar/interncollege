import React, { useState, useEffect } from 'react'
import { BarChart3, PieChart, TrendingUp, Users, Download } from 'lucide-react'
import adminService from '../../services/adminService'
import { useApi } from '../../hooks/useApi'
import { formatDateTime, getStatusColor, calculatePercentage } from '../../utils/helpers'

const SystemOverview = () => {
  const [students, setStudents] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [stats, setStats] = useState(null)
  const [activeTab, setActiveTab] = useState('students')
  
  const { loading, error, execute } = useApi()

  useEffect(() => {
    loadOverviewData()
  }, [])

  const loadOverviewData = async () => {
    try {
      const [studentsResponse, submissionsResponse, statsResponse] = await Promise.all([
        execute(() => adminService.getAllStudents({ limit: 50 })),
        execute(() => adminService.getAllSubmissions({ limit: 50 })),
        execute(() => adminService.getDashboardStats())
      ])

      if (studentsResponse.success) setStudents(studentsResponse.data.students)
      if (submissionsResponse.success) setSubmissions(submissionsResponse.data.submissions)
      if (statsResponse.success) setStats(statsResponse.data)
    } catch (err) {
      console.error('Failed to load overview data:', err)
    }
  }

  const exportData = async (type) => {
    try {
      let response, filename
      
      switch (type) {
        case 'students':
          response = await adminService.exportStudents()
          filename = `all_students_${new Date().toISOString().split('T')[0]}.xlsx`
          break
        case 'submissions':
          response = await adminService.exportSubmissions()
          filename = `all_submissions_${new Date().toISOString().split('T')[0]}.xlsx`
          break
        case 'placements':
          response = await adminService.exportPlacements()
          filename = `placement_stats_${new Date().toISOString().split('T')[0]}.xlsx`
          break
      }

      const url = window.URL.createObjectURL(new Blob([response]))
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    }
  }

  const tabs = [
    { id: 'students', label: 'Students Overview', icon: Users },
    { id: 'submissions', label: 'Submissions Overview', icon: BarChart3 },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Overview</h1>
          <p className="text-gray-600">Comprehensive view of system data and analytics</p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => exportData('placements')}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export Placements</span>
          </button>
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
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Account Status</h4>
              <div className="space-y-2">
                {['Active', 'Inactive'].map(status => {
                  const count = students.filter(s => s.isActive === (status === 'Active')).length
                  return (
                    <div key={status} className="flex justify-between">
                      <span className="text-sm text-gray-600">{status}</span>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="card p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Submission Status</h4>
              <div className="space-y-2">
                {['Has Submitted', 'Not Submitted'].map(status => {
                  const count = students.filter(s => status === 'Has Submitted' ? s.submissionStatus : !s.submissionStatus).length
                  return (
                    <div key={status} className="flex justify-between">
                      <span className="text-sm text-gray-600">{status}</span>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="card p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">By Branch</h4>
              <div className="space-y-2">
                {Object.entries(students.reduce((acc, student) => {
                  acc[student.branch] = (acc[student.branch] || 0) + 1
                  return acc
                }, {})).map(([branch, count]) => (
                  <div key={branch} className="flex justify-between">
                    <span className="text-sm text-gray-600">{branch}</span>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Students Table */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900">Recent Students</h4>
              <button
                onClick={() => exportData('students')}
                className="btn-secondary flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export All</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Branch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submission
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.slice(0, 20).map((student) => (
                    <tr key={student._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500">{student.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.branch}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          student.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {student.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          student.submissionStatus 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {student.submissionStatus ? 'Submitted' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(student.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'submissions' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Submissions</h4>
              <div className="space-y-3">
                {submissions.slice(0, 10).map((submission) => (
                  <div key={submission._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {submission.student?.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {submission.type} • {formatDateTime(submission.createdAt)}
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(submission.status)}`}>
                      {submission.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Submission Trends</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Internships</span>
                    <span className="text-sm font-medium">
                      {stats?.submissions?.internships || 0}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ 
                        width: `${calculatePercentage(
                          stats?.submissions?.internships || 0, 
                          stats?.submissions?.total || 1
                        )}%` 
                      }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Projects</span>
                    <span className="text-sm font-medium">
                      {stats?.submissions?.projects || 0}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ 
                        width: `${calculatePercentage(
                          stats?.submissions?.projects || 0, 
                          stats?.submissions?.total || 1
                        )}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submissions Table */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900">All Submissions</h4>
              <button
                onClick={() => exportData('submissions')}
                className="btn-secondary flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export All</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Industry
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {submissions.map((submission) => (
                    <tr key={submission._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {submission.student?.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 capitalize">{submission.type}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(submission.status)}`}>
                          {submission.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {submission.industryType || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(submission.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Mentor Utilization Chart */}
            <div className="card p-6 lg:col-span-2">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Mentor Capacity Utilization</h4>
              <div className="space-y-3">
                {stats.mentorUtilization?.map((mentor, index) => (
                  <div key={index}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{mentor.name}</span>
                      <span className="text-sm text-gray-500">
                        {mentor.currentStudents}/{mentor.maxStudents} ({mentor.utilizationPercent}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          mentor.utilizationPercent >= 90 ? 'bg-red-500' :
                          mentor.utilizationPercent >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${mentor.utilizationPercent}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="card p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h4>
              <div className="space-y-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {calculatePercentage(stats.overview.placedStudents, stats.overview.totalStudents)}%
                  </div>
                  <div className="text-sm text-blue-800">Placement Rate</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {calculatePercentage(stats.submissions.approved, stats.submissions.total)}%
                  </div>
                  <div className="text-sm text-green-800">Approval Rate</div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(stats.overview.totalStudents / stats.overview.totalMentors)}
                  </div>
                  <div className="text-sm text-purple-800">Avg Students/Mentor</div>
                </div>
              </div>
            </div>
          </div>

          {/* Industry Distribution */}
          <div className="card p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Industry Distribution</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(
                submissions
                  .filter(s => s.type === 'internship' && s.industryType)
                  .reduce((acc, submission) => {
                    acc[submission.industryType] = (acc[submission.industryType] || 0) + 1
                    return acc
                  }, {})
              ).map(([industry, count]) => (
                <div key={industry} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-xl font-bold text-gray-900">{count}</div>
                  <div className="text-sm text-gray-600">{industry}</div>
                </div>
              ))}
            </div>
          </div>

          {/* System Health */}
          <div className="card p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">System Health</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
                <div className="text-lg font-semibold text-gray-900">System Active</div>
                <div className="text-sm text-gray-500">All services running</div>
              </div>
              
              <div className="text-center">
                <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {stats?.overview?.totalStudents + stats?.overview?.totalMentors}
                </div>
                <div className="text-sm text-gray-500">Active Users</div>
              </div>
              
              <div className="text-center">
                <div className="h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <BarChart3 className="h-8 w-8 text-purple-600" />
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {stats?.submissions?.total}
                </div>
                <div className="text-sm text-gray-500">Total Submissions</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">
            Error loading data: {error}
          </div>
        </div>
      )}
    </div>
  )
}

export default SystemOverview