import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../../hooks/useApi'
import { studentService } from '../../services/studentService'
import FileUpload from '../common/FileUpload'
import {
  FileText, CheckCircle, Clock, XCircle, Upload,
  ArrowLeft, Loader, Info, AlertTriangle, Award, Lock
} from 'lucide-react'

// ─── 4 document types: 3 MPRs + 1 Mid-Semester ─────────────────────────────
const MPR_TYPES = [
  { key: 'mpr1', label: 'MPR 1', title: 'Monthly Progress Report 1', description: 'Submit your first monthly progress report', deadline: 'Due: End of Month 1', color: 'blue' },
  { key: 'mpr2', label: 'MPR 2', title: 'Monthly Progress Report 2', description: 'Submit your second monthly progress report', deadline: 'Due: End of Month 2', color: 'green' },
  { key: 'mpr3', label: 'MPR 3', title: 'Monthly Progress Report 3', description: 'Submit your third monthly progress report', deadline: 'Due: End of Month 3', color: 'purple' },
  { key: 'midSem1', label: 'Mid Sem', title: 'Mid Semester Evaluation', description: 'Submit your mid-semester evaluation', deadline: 'Due: Mid-semester break', color: 'orange' }
]

const TOTAL_DOCS = 4 // 3 MPRs + 1 midSem

const MPRSubmission = () => {
  const navigate = useNavigate()
  const { execute, loading } = useApi()
  const [dashboardData, setDashboardData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeCard, setActiveCard] = useState(null)
  const [uploadingMPR, setUploadingMPR] = useState(null)

  // ─── NEW: uploads-enabled state ────────────────────────────────────────────
  const [uploadsEnabled, setUploadsEnabled] = useState(true)
  const [uploadsClosedReason, setUploadsClosedReason] = useState('')
  const [checkingAccess, setCheckingAccess] = useState(true)

  useEffect(() => {
    loadData()
    checkUploadAccess()
  }, [])

  const checkUploadAccess = async () => {
    try {
      const response = await execute(() => studentService.getDashboard())
      if (response.success) {
        setUploadsEnabled(response.data.uploadsEnabled !== false)
        setUploadsClosedReason(response.data.uploadsClosedReason || '')
      }
    } catch (error) {
      console.error('Error checking upload access:', error)
    } finally {
      setCheckingAccess(false)
    }
  }

  const loadData = async () => {
    try {
      setIsLoading(true)
      const response = await execute(() => studentService.getProgress())
      if (response.success) setDashboardData(response.data)
    } catch (error) {
      console.error('Error loading progress:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMPRSubmit = async (mprType, file) => {
    // ─── NEW: hard block if uploads closed ────────────────────────────────────
    if (!uploadsEnabled) {
      alert(uploadsClosedReason || 'Uploads are currently closed. Please contact your mentor.')
      return
    }

    if (!file) { alert('Please upload a document first'); return }
    setUploadingMPR(mprType)
    try {
      const formData = new FormData()
      formData.append('mprType', mprType)
      formData.append('document', file)

      const response = await execute(() => studentService.submitMPR(formData))
      if (response && response.success) {
        await loadData()
        setActiveCard(null)
        alert(`${MPR_TYPES.find(m => m.key === mprType)?.label} submitted successfully!`)
      } else {
        alert(`Error: ${response?.error || response?.message || 'Unknown error'}`)
      }
    } catch (error) {
      // ─── NEW: handle uploads-closed error from backend ──────────────────────
      if (error.response?.status === 403) {
        setUploadsEnabled(false)
        setUploadsClosedReason(error.response.data?.message || 'Uploads are currently closed.')
        alert(error.response.data?.message || 'Uploads are currently closed. Please contact your mentor.')
        return
      }
      const msg = error.response?.data?.error || error.response?.data?.message || error.message || 'Please try again.'
      alert(`Error submitting: ${msg}`)
    } finally {
      setUploadingMPR(null)
    }
  }

  const getStatusIcon = (status) => ({
    approved: <CheckCircle className="h-6 w-6 text-green-600" />,
    rejected: <XCircle className="h-6 w-6 text-red-600" />,
    pending: <Clock className="h-6 w-6 text-yellow-600" />
  }[status] || <FileText className="h-6 w-6 text-gray-400" />)

  const getStatusBadge = (status) => ({
    approved: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    not_submitted: 'bg-gray-100 text-gray-600 border-gray-200'
  }[status] || 'bg-gray-100 text-gray-600 border-gray-200')

  const getColorClasses = (color, status) => {
    if (status === 'approved') return { border: 'border-green-300', bg: 'bg-green-50', button: 'bg-gray-400 cursor-not-allowed', icon: 'bg-green-100 text-green-600' }
    const map = {
      blue:   { border: 'border-blue-200',   bg: 'bg-blue-50',   button: 'bg-blue-600 hover:bg-blue-700',     icon: 'bg-blue-100 text-blue-600' },
      green:  { border: 'border-green-200',  bg: 'bg-green-50',  button: 'bg-green-600 hover:bg-green-700',   icon: 'bg-green-100 text-green-600' },
      purple: { border: 'border-purple-200', bg: 'bg-purple-50', button: 'bg-purple-600 hover:bg-purple-700', icon: 'bg-purple-100 text-purple-600' },
      orange: { border: 'border-orange-200', bg: 'bg-orange-50', button: 'bg-orange-600 hover:bg-orange-700', icon: 'bg-orange-100 text-orange-600' }
    }
    return map[color] || map.blue
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <Loader className="h-8 w-8 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading your MPR submissions...</p>
        </div>
      </div>
    )
  }

  if (!dashboardData?.hasSubmission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center max-w-md">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Approved Registration Found</h2>
          <p className="text-gray-600 mb-6">You need an approved registration before submitting MPR documents.</p>
          <button onClick={() => navigate('/student/dashboard')} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">Go to Dashboard</button>
        </div>
      </div>
    )
  }

  const { submission } = dashboardData

  if (!['7th_internship', '8th_internship', '8th_project'].includes(submission?.semesterType)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center max-w-md">
          <FileText className="h-12 w-12 text-blue-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">MPR Not Required</h2>
          <p className="text-gray-600 mb-6">MPR documents are only required for 7th and 8th semester internships.</p>
          <button onClick={() => navigate('/student/dashboard')} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">Go to Dashboard</button>
        </div>
      </div>
    )
  }

  const canSubmitMPR = ['mpr_submissions', 'registration_approved'].includes(submission?.currentStep)
  if (!canSubmitMPR) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center max-w-md">
          <Clock className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">MPR Submission Not Available</h2>
          <p className="text-gray-600 mb-6">Your registration needs to be approved before you can submit MPR documents.</p>
          <button onClick={() => navigate('/student/progress')} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">View Progress</button>
        </div>
      </div>
    )
  }

  // ─── NEW: Uploads Closed screen — checked after data/step checks pass ────────
  if (!checkingAccess && !uploadsEnabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4 flex items-center justify-center">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-gray-100">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Uploads Closed</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              {uploadsClosedReason || 'Document uploads are currently unavailable. Please contact your mentor.'}
            </p>
            <button
              onClick={() => navigate('/student/dashboard')}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  const mprData = submission?.mprSubmissions || {}
  const submittedDocs = Object.values(mprData).filter(m => m && m.document)
  const approvedCount = submittedDocs.filter(m => m.status === 'approved').length
  const pendingCount = submittedDocs.filter(m => m.status === 'pending').length
  const rejectedCount = submittedDocs.filter(m => m.status === 'rejected').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">MPR Submissions</h1>
              <p className="text-gray-600">Submit 3 Monthly Progress Reports and 1 Mid-Semester Evaluation</p>
            </div>
            <button onClick={() => navigate('/student/dashboard')} className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 rounded-lg transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </button>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Submission Progress</h3>
            <div className="flex items-center space-x-4 text-sm">
              <span className="flex items-center text-green-600 font-medium"><CheckCircle className="h-4 w-4 mr-1" />{approvedCount} Approved</span>
              <span className="flex items-center text-yellow-600 font-medium"><Clock className="h-4 w-4 mr-1" />{pendingCount} Pending</span>
              <span className="flex items-center text-red-600 font-medium"><XCircle className="h-4 w-4 mr-1" />{rejectedCount} Rejected</span>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500" style={{ width: `${(approvedCount / TOTAL_DOCS) * 100}%` }}></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">{approvedCount} of {TOTAL_DOCS} documents approved</p>
        </div>

        {/* MPR Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {MPR_TYPES.map((mpr) => {
            const mprStatus = mprData[mpr.key]
            const status = mprStatus?.document ? mprStatus.status : 'not_submitted'
            const colors = getColorClasses(mpr.color, status)
            const canSubmit = status === 'not_submitted' || status === 'rejected'
            const isActive = activeCard === mpr.key

            return (
              <MPRCard
                key={mpr.key}
                mpr={mpr}
                status={status}
                mprStatus={mprStatus}
                colors={colors}
                canSubmit={canSubmit}
                isActive={isActive}
                uploadingMPR={uploadingMPR}
                onToggleCard={() => setActiveCard(isActive ? null : mpr.key)}
                onSubmit={handleMPRSubmit}
                getStatusIcon={getStatusIcon}
                getStatusBadge={getStatusBadge}
              />
            )
          })}
        </div>

        {/* CTA when all 4 approved */}
        {approvedCount === TOTAL_DOCS && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Award className="h-8 w-8 mr-4" />
                <div>
                  <h3 className="text-xl font-bold">All documents approved! 🎉</h3>
                  <p className="text-green-100">You can now submit your final report.</p>
                </div>
              </div>
              <button onClick={() => navigate('/student/final-report')} className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors">
                Submit Final Report
              </button>
            </div>
          </div>
        )}

        {/* Guidelines */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-start">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0 mr-4">
              <Info className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-amber-900 mb-2">MPR Submission Guidelines</h4>
              <ul className="text-amber-800 leading-relaxed space-y-1 text-sm">
                <li>• Submit all 3 MPRs and 1 Mid-Semester Evaluation ({TOTAL_DOCS} documents total)</li>
                <li>• Each document must be approved by your mentor before the final report is unlocked</li>
                <li>• Only PDF files are accepted</li>
                <li>• You can resubmit rejected documents with corrections</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Individual MPR Card ────────────────────────────────────────────────────
const MPRCard = ({ mpr, status, mprStatus, colors, canSubmit, isActive, uploadingMPR, onToggleCard, onSubmit, getStatusIcon, getStatusBadge }) => {
  const [selectedFile, setSelectedFile] = useState(null)
  const isUploading = uploadingMPR === mpr.key

  const handleSubmit = () => {
    onSubmit(mpr.key, selectedFile)
    setSelectedFile(null)
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border-2 ${colors.border} transition-all duration-300 ${isActive ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}>
      <div className={`${colors.bg} p-4 border-b ${colors.border}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${colors.icon} mr-3`}><FileText className="h-5 w-5" /></div>
            <div>
              <h4 className="font-bold text-gray-900">{mpr.label}</h4>
              <p className="text-xs text-gray-600">{mpr.deadline}</p>
            </div>
          </div>
          {getStatusIcon(status)}
        </div>
        <div className="flex items-center justify-between">
          <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(status)}`}>
            {status === 'not_submitted' ? 'Not Submitted' : status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
          {mprStatus?.submittedAt && <span className="text-xs text-gray-500">{new Date(mprStatus.submittedAt).toLocaleDateString()}</span>}
        </div>
      </div>

      <div className="p-4">
        <h5 className="font-semibold text-gray-900 mb-1">{mpr.title}</h5>
        <p className="text-sm text-gray-600 mb-4">{mpr.description}</p>

        {status === 'approved' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <div className="flex items-center text-green-700"><CheckCircle className="h-4 w-4 mr-2" /><span className="text-sm font-medium">Approved by mentor</span></div>
            {mprStatus?.feedback && <p className="text-xs text-green-600 mt-1">{mprStatus.feedback}</p>}
          </div>
        )}
        {status === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div className="flex items-center text-yellow-700"><Clock className="h-4 w-4 mr-2" /><span className="text-sm font-medium">Under review by mentor</span></div>
          </div>
        )}
        {status === 'rejected' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div className="flex items-center text-red-700"><XCircle className="h-4 w-4 mr-2" /><span className="text-sm font-medium">Needs corrections</span></div>
            {mprStatus?.feedback && <p className="text-xs text-red-600 mt-1">{mprStatus.feedback}</p>}
          </div>
        )}

        {canSubmit && (
          !isActive ? (
            <button onClick={onToggleCard} className={`w-full ${colors.button} text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center`}>
              <Upload className="h-4 w-4 mr-2" />
              {status === 'rejected' ? 'Resubmit Document' : 'Submit Document'}
            </button>
          ) : (
            <div className="space-y-4">
              <FileUpload onFileSelect={setSelectedFile} accept=".pdf" allowedTypes={['pdf']} label="Upload PDF Document" required />
              <div className="flex space-x-2">
                <button
                  onClick={handleSubmit}
                  disabled={!selectedFile || isUploading}
                  className={`flex-1 ${selectedFile && !isUploading ? colors.button : 'bg-gray-400 cursor-not-allowed'} text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center`}
                >
                  {isUploading ? <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>Submitting...</> : <><Upload className="h-4 w-4 mr-2" />Submit</>}
                </button>
                <button onClick={onToggleCard} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cancel</button>
              </div>
            </div>
          )
        )}

        {status === 'approved' && <div className="text-center py-2"><span className="text-green-600 text-sm font-medium flex items-center justify-center"><CheckCircle className="h-4 w-4 mr-1" />Approved — No action needed</span></div>}
        {status === 'pending' && <div className="text-center py-2"><span className="text-yellow-600 text-sm font-medium flex items-center justify-center"><Clock className="h-4 w-4 mr-1" />Waiting for mentor review</span></div>}
      </div>
    </div>
  )
}

export default MPRSubmission