import React, { useState, useEffect } from 'react'
import { useApi } from '../../hooks/useApi'
import { adminService } from '../../services/adminService'
import { formatDateTime, getStatusBadgeClass } from '../../utils/helpers'
import { StatusBadge } from '../common/ProgressIndicator'
import { 
  Users, 
  UserCheck, 
  FileText, 
  CheckCircle, 
  Clock, 
  XCircle,
  TrendingUp,
  Download
} from 'lucide-react'

const AdminDashboard = () => {
  const { execute, loading } = useApi()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    loadDashboardStats()
  }, [])

  const loadDashboardStats = async () => {
    try {
      const response = await execute(() => adminService.getDashboardStats())
      if (response.success) {
        setStats(response.data)
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
    }
  }

  const StatCard = ({ title, value, icon: Icon, color = 'blue', trend = null }) => (
    <div className="stat-card">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className={`text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '+' : ''}{trend}% from last month
            </p>
          )}
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="stat-card animate-pulse">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-gray-200 w-12 h-12"></div>
                <div className="ml-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Overview of system statistics and recent activities</p>
        </div>
        <button className="btn-primary flex items-center">
          <Download className="h-4 w-4 mr-2" />
          Export Reports
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={stats?.overview?.totalStudents || 0}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Total Mentors"
          value={stats?.overview?.totalMentors || 0}
          icon={UserCheck}
          color="green"
        />
        <StatCard
          title="Total Submissions"
          value={stats?.overview?.totalSubmissions || 0}
          icon={FileText}
          color="purple"
        />
        <StatCard
          title="Placed Students"
          value={stats?.overview?.placedStudents || 0}
          icon={TrendingUp}
          color="indigo"
        />
      </div>

      {/* Submission Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submission Status Breakdown */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Submission Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-yellow-600 mr-3" />
                <span className="font-medium text-gray-900">Pending</span>
              </div>
              <span className="text-xl font-bold text-yellow-600">
                {stats?.submissions?.pending || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                <span className="font-medium text-gray-900">Approved</span>
              </div>
              <span className="text-xl font-bold text-green-600">
                {stats?.submissions?.approved || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center">
                <XCircle className="h-5 w-5 text-red-600 mr-3" />
                <span className="font-medium text-gray-900">Rejected</span>
              </div>
              <span className="text-xl font-bold text-red-600">
                {stats?.submissions?.rejected || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Submission Type Breakdown */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Submission Types</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="font-medium text-gray-900">Internships</span>
              <span className="text-xl font-bold text-blue-600">
                {stats?.submissions?.internships || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <span className="font-medium text-gray-900">Projects</span>
              <span className="text-xl font-bold text-purple-600">
                {stats?.submissions?.projects || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Submissions</h3>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            View All
          </button>
        </div>
        
        {stats?.recentSubmissions?.length > 0 ? (
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
                    Mentor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.recentSubmissions.map((submission) => (
                  <tr key={submission.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {submission.studentName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {submission.enrollmentNo}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="capitalize text-sm text-gray-900">
                        {submission.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={submission.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {submission.mentorName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(submission.submittedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">No recent submissions</p>
        )}
      </div>

      {/* Mentor Utilization */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Mentor Utilization</h3>
        
        {stats?.mentorUtilization?.length > 0 ? (
          <div className="space-y-4">
            {stats.mentorUtilization.map((mentor, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{mentor.name}</p>
                  <p className="text-sm text-gray-500">
                    {mentor.currentStudents} of {mentor.maxStudents} students
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        mentor.utilizationPercent >= 90 ? 'bg-red-600' :
                        mentor.utilizationPercent >= 70 ? 'bg-yellow-600' : 'bg-green-600'
                      }`}
                      style={{ width: `${mentor.utilizationPercent}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {mentor.utilizationPercent}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">No mentor data available</p>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard