import React, { useState, useEffect } from 'react'
import { useApi } from '../../hooks/useApi'
import { mentorService } from '../../services/mentorService'
import { formatDateTime } from '../../utils/helpers'
import { StatusBadge } from '../common/ProgressIndicator'
import {
  Users,
  FileText,
  Clock,
  CheckCircle,
  TrendingUp,
  AlertCircle,
  Calendar,
  Download,
  FolderOpen,
  XCircle,
  Link as LinkIcon,
  RefreshCw
} from 'lucide-react'

const MentorDashboard = () => {
  const { execute, loading } = useApi()
  const [stats, setStats] = useState(null)

  // ─── NEW: Drive folder state ────────────────────────────────────────────────
  const [driveStatus, setDriveStatus] = useState(null) // { driveFolderId, driveFolderLink, driveFolderStatus }
  const [driveLoading, setDriveLoading] = useState(true)
  const [folderInput, setFolderInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [driveError, setDriveError] = useState('')
  const [driveSuccess, setDriveSuccess] = useState('')

  useEffect(() => {
    loadDashboardStats()
    loadDriveStatus()
  }, [])

  const loadDashboardStats = async () => {
    try {
      const response = await execute(() => mentorService.getDashboard())
      if (response.success) {
        setStats(response.data)
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
    }
  }

  const loadDriveStatus = async () => {
    setDriveLoading(true)
    try {
      const res = await mentorService.getDriveFolderStatus()
      if (res.success) {
        setDriveStatus(res.data)
        setFolderInput(res.data.driveFolderLink || '')
      }
    } catch (error) {
      console.error('Error loading drive status:', error)
    } finally {
      setDriveLoading(false)
    }
  }

  const handleSaveFolder = async () => {
    if (!folderInput.trim()) {
      setDriveError('Please paste your Google Drive folder link')
      return
    }
    setSaving(true)
    setDriveError('')
    setDriveSuccess('')
    try {
      const res = await mentorService.setDriveFolder(folderInput.trim())
      if (res.success) {
        setDriveSuccess('Google Drive folder connected successfully!')
        await loadDriveStatus()
      } else {
        setDriveError(res.message || 'Failed to connect folder')
      }
    } catch (err) {
      setDriveError(err.response?.data?.message || 'Failed to connect folder. Please check the link and sharing permissions.')
    } finally {
      setSaving(false)
    }
  }

  const handleRecheck = async () => {
    setDriveError('')
    setDriveSuccess('')
    await loadDriveStatus()
  }

  const handleExport = async () => {
    try {
      const response = await execute(() => mentorService.exportAssignedStudents())
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `my_students_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
    }
  }

  const StatCard = ({ title, value, icon: Icon, color = 'blue', description = '' }) => (
    <div className="stat-card">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {description && (
            <p className="text-xs text-gray-500">{description}</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Mentor Dashboard</h1>
          <p className="text-gray-600">Monitor your assigned students and review submissions</p>
        </div>
        <button
          onClick={handleExport}
          className="btn-primary flex items-center"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Student Data
        </button>
      </div>

      {/* ─── NEW: Google Drive Folder Card ────────────────────────────────────── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <FolderOpen className="h-5 w-5 mr-2 text-blue-600" />
            Document Storage — Google Drive Folder
          </h3>
          {!driveLoading && driveStatus?.driveFolderStatus && (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${driveStatus.driveFolderStatus === 'connected'
                ? 'bg-green-100 text-green-800'
                : driveStatus.driveFolderStatus === 'access_revoked'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-700'
              }`}>
              {driveStatus.driveFolderStatus === 'connected' && <CheckCircle className="h-3.5 w-3.5 mr-1" />}
              {driveStatus.driveFolderStatus === 'access_revoked' && <XCircle className="h-3.5 w-3.5 mr-1" />}
              {driveStatus.driveFolderStatus === 'connected' ? 'Connected' :
                driveStatus.driveFolderStatus === 'access_revoked' ? 'Access Revoked' : 'Not Connected'}
            </span>
          )}
        </div>

        {driveLoading ? (
          <div className="animate-pulse h-10 bg-gray-100 rounded"></div>
        ) : (
          <>
            {driveStatus?.driveFolderStatus === 'access_revoked' && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                We lost access to your folder. Your students' uploads are currently blocked. Please re-share the folder (see steps below) and click "Connect" again.
              </div>
            )}

            {driveStatus?.driveFolderStatus === 'not_connected' && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                Your students cannot upload documents until you connect a Google Drive folder.
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-sm text-gray-600 space-y-1">
              <p className="font-semibold text-gray-700">Setup steps:</p>
              <p>1. Create a folder in your Google Drive (e.g. "My Students").</p>
              <p>2. Right-click → Share → General access → set to "Anyone with the link" → role "Editor".</p>
              <p>3. Copy the folder's link and paste it below.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center flex-1 border border-gray-300 rounded-lg px-3 focus-within:ring-2 focus-within:ring-blue-500">
                <LinkIcon className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                <input
                  type="text"
                  value={folderInput}
                  onChange={(e) => setFolderInput(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="flex-1 py-2 border-0 outline-none text-sm text-gray-900"
                />
              </div>
              <button
                onClick={handleSaveFolder}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Connecting...
                  </>
                ) : (
                  'Connect'
                )}
              </button>
              <button
                onClick={handleRecheck}
                className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Recheck
              </button>
            </div>

            {driveError && (
              <p className="text-sm text-red-600 mt-3">{driveError}</p>
            )}
            {driveSuccess && (
              <p className="text-sm text-green-600 mt-3">{driveSuccess}</p>
            )}
          </>
        )}
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Assigned Students"
          value={stats?.overview?.totalAssignedStudents || 0}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Total Submissions"
          value={stats?.overview?.totalSubmissions || 0}
          icon={FileText}
          color="purple"
        />
        <StatCard
          title="Pending Reviews"
          value={stats?.overview?.pendingSubmissions || 0}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="Placed Students"
          value={stats?.overview?.placedStudents || 0}
          icon={TrendingUp}
          color="green"
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Submission Summary</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-yellow-600 mr-3" />
                <span className="font-medium text-gray-900">Pending Review</span>
              </div>
              <span className="text-xl font-bold text-yellow-600">
                {stats?.overview?.pendingSubmissions || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                <span className="font-medium text-gray-900">Approved</span>
              </div>
              <span className="text-xl font-bold text-green-600">
                {stats?.overview?.approvedSubmissions || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
                <span className="font-medium text-gray-900">Monthly Pending</span>
              </div>
              <span className="text-xl font-bold text-red-600">
                {stats?.overview?.pendingMonthlySubmissions || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Review Pending Submissions</p>
                  <p className="text-sm text-gray-500">{stats?.overview?.pendingSubmissions || 0} waiting</p>
                </div>
              </div>
            </button>

            <button className="w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-green-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">View My Students</p>
                  <p className="text-sm text-gray-500">{stats?.overview?.totalAssignedStudents || 0} assigned</p>
                </div>
              </div>
            </button>

            <button className="w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-purple-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Monitor Progress</p>
                  <p className="text-sm text-gray-500">Track monthly updates</p>
                </div>
              </div>
            </button>
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
    </div>
  )
}

export default MentorDashboard