import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../../hooks/useApi'
import { studentService } from '../../services/studentService'
import { FileText, Award, Briefcase, ExternalLink, ArrowLeft, Info, Loader, Lock } from 'lucide-react'

// Mock FileUpload component for demo
const FileUpload = ({ onFileSelect, accept, allowedTypes, label, required, error }) => (
  <div className="space-y-2">
    <label className="block text-sm font-semibold text-gray-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type="file"
      accept={accept}
      onChange={(e) => onFileSelect(e.target.files[0])}
      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    />
    {error && <p className="text-red-600 text-sm">{error}</p>}
  </div>
)

const FinalReportForm = () => {
  const navigate = useNavigate()
  const { execute, loading: apiLoading } = useApi()
  const [dashboardData, setDashboardData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    hasPPO: false,
    ppoAmount: '',
    conferenceLink: '',
    researchPaperStatus: '',
    hasPlacement: false,
    placementFrom: ''
  })
  const [files, setFiles] = useState({
    finalPPT: null,
    finalReport: null,
    certificate: null,
    finalMPR: null,
    ppoOfferLetter: null,
    ppoOfferLetterProject: null,
    conferencePaymentProof: null,
    conferenceCertificate: null,
    finalProjectReport: null,
    publishedPaperCopy: null
  })
  const [formErrors, setFormErrors] = useState({})

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
      console.log('Progress response:', response)

      if (response && response.success && response.data) {
        setDashboardData(response.data)
        console.log('Dashboard data set:', response.data)
      } else {
        console.error('Invalid response structure:', response)
        setDashboardData(null)
      }
    } catch (error) {
      console.error('Error loading progress data:', error)
      setDashboardData(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))

    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleFileSelect = (fieldName, file) => {
    setFiles(prev => ({ ...prev, [fieldName]: file }))
    if (formErrors[fieldName]) {
      setFormErrors(prev => ({ ...prev, [fieldName]: '' }))
    }
  }

  const validateForm = () => {
    const errors = {}

    if (!dashboardData?.submission) {
      errors.general = 'Unable to validate form - submission data not loaded'
      setFormErrors(errors)
      return false
    }

    const { submission } = dashboardData
    const semesterType = submission.semesterType

    if (semesterType === '8th_project') {
      if (!formData.conferenceLink) errors.conferenceLink = 'Conference link is required'
      if (!formData.researchPaperStatus) errors.researchPaperStatus = 'Research paper status is required'
      if (!files.conferenceCertificate) errors.conferenceCertificate = 'Conference certificate is required'
      if (!files.finalProjectReport) errors.finalProjectReport = 'Final project report is required'
      if (!files.publishedPaperCopy) errors.publishedPaperCopy = 'Published paper copy is required'
      if (!files.conferencePaymentProof) errors.conferencePaymentProof = 'Conference payment proof is required'

      if (formData.hasPlacement && !formData.placementFrom) {
        errors.placementFrom = 'Placement source is required'
      }
      if (formData.hasPlacement && !files.ppoOfferLetterProject) {
        errors.ppoOfferLetterProject = 'PPO offer letter is required'
      }
    } else if (['7th_internship', '8th_internship'].includes(semesterType)) {
      if (!files.finalMPR) errors.finalMPR = 'Final MPR is required'
      if (!files.finalReport) errors.finalReport = 'Final report is required'
      if (!files.certificate) errors.certificate = 'Certificate is required'

      if (formData.hasPPO) {
        if (!formData.ppoAmount || parseFloat(formData.ppoAmount) <= 0) {
          errors.ppoAmount = 'PPO amount is required and must be greater than 0'
        }
        if (!files.ppoOfferLetter) {
          errors.ppoOfferLetter = 'PPO offer letter is required'
        }
      }
    } else {
      if (!files.finalPPT) errors.finalPPT = 'Final PPT is required'
      if (!files.finalReport) errors.finalReport = 'Final report is required'
      if (!files.certificate) errors.certificate = 'Certificate is required'

      if (formData.hasPPO) {
        if (!formData.ppoAmount || parseFloat(formData.ppoAmount) <= 0) {
          errors.ppoAmount = 'PPO amount is required and must be greater than 0'
        }
        if (!files.ppoOfferLetter) {
          errors.ppoOfferLetter = 'PPO offer letter is required'
        }
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // ─── NEW: hard block if uploads closed ────────────────────────────────────
    if (!uploadsEnabled) {
      alert(uploadsClosedReason || 'Uploads are currently closed. Please contact your mentor.')
      return
    }

    if (!validateForm()) return

    try {
      setLoading(true)
      console.log('Submitting final report...')

      const formDataToSend = new FormData()

      Object.keys(formData).forEach(key => {
        if (formData[key] !== '' && formData[key] !== false) {
          formDataToSend.append(key, formData[key])
        }
      })

      Object.keys(files).forEach(key => {
        if (files[key]) {
          formDataToSend.append(key, files[key])
        }
      })

      const response = await execute(() => studentService.submitFinalReport(formDataToSend))

      if (response && response.success) {
        console.log('Final report submitted successfully')
        alert('Final report submitted successfully!')
        navigate('/student/progress')
      } else {
        throw new Error(response?.message || 'Failed to submit final report')
      }

    } catch (error) {
      console.error('Error submitting final report:', error)

      // ─── NEW: handle uploads-closed error from backend ──────────────────────
      if (error.response?.status === 403) {
        setUploadsEnabled(false)
        setUploadsClosedReason(error.response.data?.message || 'Uploads are currently closed.')
        alert(error.response.data?.message || 'Uploads are currently closed. Please contact your mentor.')
        return
      }

      alert(`Error submitting final report: ${error.message || 'Please try again.'}`)
    } finally {
      setLoading(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <Loader className="h-8 w-8 text-blue-600 mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h2>
          <p className="text-gray-600">Please wait while we load your data</p>
        </div>
      </div>
    )
  }

  // No submission found
  if (!dashboardData?.hasSubmission || !dashboardData?.submission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Registration Found</h2>
            <p className="text-gray-600 mb-6">You need to complete registration before submitting final report.</p>
            <button
              onClick={() => navigate('/student/dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── NEW: Uploads Closed screen — checked after data loads, before form logic ──
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

  const { submission } = dashboardData
  const semesterType = submission.semesterType

  let canSubmitFinalReport = false
  let reasonMessage = ''

  if (semesterType === '6th_internship' || semesterType === 'any_internship') {
    canSubmitFinalReport = [
      'final_report_pending',
      'final_report_rejected',
      'registration_approved'
    ].includes(submission.currentStep)

    if (!canSubmitFinalReport) {
      reasonMessage = 'Registration must be approved first'
    }
  } else if (semesterType === '8th_project') {
    const mprSubmissions = submission?.mprSubmissions || {}
    const allMPRTypes = ['mpr1', 'mpr2', 'mpr3', 'midSem1']
    const approvedMPRs = allMPRTypes.filter(t => mprSubmissions[t]?.status === 'approved')
    const allFourApproved = approvedMPRs.length === 4

    canSubmitFinalReport =
      ['final_report_pending', 'final_report_rejected'].includes(submission.currentStep) ||
      (allFourApproved && ['mpr_submissions', 'registration_approved'].includes(submission.currentStep))

    if (!canSubmitFinalReport) {
      reasonMessage = allFourApproved
        ? 'Registration must be approved first'
        : `All 4 MPR submissions must be approved first. Currently approved: ${approvedMPRs.length}/4`
    }
  }

  else if (semesterType === '7th_internship' || semesterType === '8th_internship') {
    const mprSubmissions = submission?.mprSubmissions || {}

    const allMPRTypes = ['mpr1', 'mpr2', 'mpr3', 'midSem1']
    const approvedMPRs = allMPRTypes.filter(type =>
      mprSubmissions[type]?.status === 'approved'
    )
    const approvedMPRCount = approvedMPRs.length

    const allFourMPRsApproved = approvedMPRCount === 4

    canSubmitFinalReport =
      ['final_report_pending', 'final_report_rejected'].includes(submission.currentStep) ||
      (allFourMPRsApproved && ['mpr_submissions', 'registration_approved'].includes(submission.currentStep))

    if (!canSubmitFinalReport) {
      reasonMessage = `All 4 MPR submissions must be approved first. Currently approved: ${approvedMPRCount}/4`
    }
  }

  // Can't submit final report
  if (!canSubmitFinalReport) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <FileText className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Final Report Not Available</h2>
            <p className="text-gray-600 mb-2">
              Current Step: {submission.currentStep}
            </p>
            <p className="text-gray-600 mb-6">{reasonMessage}</p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/student/progress')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                View Progress
              </button>
              {(semesterType === '7th_internship' || semesterType === '8th_internship' || semesterType === '8th_project') &&
                submission.currentStep === 'mpr_submissions' && (
                  <button
                    onClick={() => navigate('/student/mpr')}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors ml-3"
                  >
                    Submit MPR Documents
                  </button>
                )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Final Report Submission</h1>
              <p className="text-gray-600">{semesterType.replace('_', ' ').toUpperCase()} - Submit your final documentation</p>
              <p className="text-sm text-blue-600 mt-1">Current Step: {submission.currentStep}</p>
            </div>
            <button
              onClick={() => navigate('/student/dashboard')}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </button>
          </div>
        </div>

        {/* Error Display */}
        {formErrors.general && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8">
            <p className="text-red-600 font-medium">{formErrors.general}</p>
          </div>
        )}

        {/* Success Message for MPR Completion */}
        {(semesterType === '7th_internship' || semesterType === '8th_internship') &&
          submission?.allMPRApproved && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-8">
              <p className="text-green-600 font-medium">✅ All MPR submissions have been approved! You can now submit your final report.</p>
            </div>
          )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Project Final Report (8th semester project) */}
          {semesterType === '8th_project' && (
            <>
              {/* Conference Details */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6">
                  <div className="flex items-center text-white">
                    <ExternalLink className="h-6 w-6 mr-3" />
                    <h3 className="text-xl font-semibold">Conference & Research Details</h3>
                  </div>
                </div>
                <div className="p-8 space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Conference Link <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      name="conferenceLink"
                      value={formData.conferenceLink}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      placeholder="https://conference-link.com"
                    />
                    {formErrors.conferenceLink && <p className="text-red-600 text-sm mt-1">{formErrors.conferenceLink}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Research Paper Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="researchPaperStatus"
                      value={formData.researchPaperStatus}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                    >
                      <option value="">Select Status</option>
                      <option value="published">Published</option>
                      <option value="accepted">Accepted</option>
                    </select>
                    {formErrors.researchPaperStatus && <p className="text-red-600 text-sm mt-1">{formErrors.researchPaperStatus}</p>}
                  </div>
                </div>
              </div>

              {/* Placement Status */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-green-700 p-6">
                  <div className="flex items-center text-white">
                    <Briefcase className="h-6 w-6 mr-3" />
                    <h3 className="text-xl font-semibold">Placement Information</h3>
                  </div>
                </div>
                <div className="p-8 space-y-6">
                  <div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="hasPlacement"
                        checked={formData.hasPlacement}
                        onChange={handleChange}
                        className="mr-3 w-5 h-5 text-green-600 rounded focus:ring-green-500"
                      />
                      <span className="text-sm font-semibold text-gray-700">I have received placement</span>
                    </label>
                  </div>

                  {formData.hasPlacement && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Placement From <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="placementFrom"
                          value={formData.placementFrom}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        >
                          <option value="">Select Source</option>
                          <option value="college">College Placement</option>
                          <option value="off_campus">Off Campus</option>
                        </select>
                        {formErrors.placementFrom && <p className="text-red-600 text-sm mt-1">{formErrors.placementFrom}</p>}
                      </div>

                      <div>
                        <FileUpload
                          onFileSelect={(file) => handleFileSelect('ppoOfferLetterProject', file)}
                          accept=".pdf"
                          allowedTypes={['pdf']}
                          label="PPO Offer Letter"
                          required
                          error={formErrors.ppoOfferLetterProject}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Project Documents */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
                  <div className="flex items-center text-white">
                    <FileText className="h-6 w-6 mr-3" />
                    <h3 className="text-xl font-semibold">Required Documents</h3>
                  </div>
                </div>
                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FileUpload
                      onFileSelect={(file) => handleFileSelect('conferencePaymentProof', file)}
                      accept=".pdf"
                      allowedTypes={['pdf']}
                      label="Conference Payment Proof"
                      required
                      error={formErrors.conferencePaymentProof}
                    />

                    <FileUpload
                      onFileSelect={(file) => handleFileSelect('conferenceCertificate', file)}
                      accept=".pdf"
                      allowedTypes={['pdf']}
                      label="Conference Certificate"
                      required
                      error={formErrors.conferenceCertificate}
                    />

                    <FileUpload
                      onFileSelect={(file) => handleFileSelect('finalProjectReport', file)}
                      accept=".pdf"
                      allowedTypes={['pdf']}
                      label="Final Project Report"
                      required
                      error={formErrors.finalProjectReport}
                    />

                    <FileUpload
                      onFileSelect={(file) => handleFileSelect('publishedPaperCopy', file)}
                      accept=".pdf"
                      allowedTypes={['pdf']}
                      label="Published Paper Copy"
                      required
                      error={formErrors.publishedPaperCopy}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* PPO Status Section - For ALL Internships */}
          {(semesterType.includes('internship')) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-green-700 p-6">
                <div className="flex items-center text-white">
                  <Award className="h-6 w-6 mr-3" />
                  <h3 className="text-xl font-semibold">PPO Status</h3>
                </div>
              </div>
              <div className="p-8">
                <div className="space-y-6">
                  <div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="hasPPO"
                        checked={formData.hasPPO}
                        onChange={handleChange}
                        className="mr-3 w-5 h-5 text-green-600 rounded focus:ring-green-500"
                      />
                      <span className="text-sm font-semibold text-gray-700">I have received PPO (Pre-Placement Offer)</span>
                    </label>
                  </div>

                  {formData.hasPPO && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          PPO Amount (in Lakhs) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          name="ppoAmount"
                          value={formData.ppoAmount}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                          placeholder="e.g., 5.0"
                        />
                        {formErrors.ppoAmount && <p className="text-red-600 text-sm mt-1">{formErrors.ppoAmount}</p>}
                      </div>

                      <div>
                        <FileUpload
                          onFileSelect={(file) => handleFileSelect('ppoOfferLetter', file)}
                          accept=".pdf"
                          allowedTypes={['pdf']}
                          label="PPO Offer Letter"
                          required
                          error={formErrors.ppoOfferLetter}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Internship Final Report (7th and 8th semester internships) */}
          {['7th_internship', '8th_internship'].includes(semesterType) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
                <div className="flex items-center text-white">
                  <FileText className="h-6 w-6 mr-3" />
                  <h3 className="text-xl font-semibold">Final Documents</h3>
                </div>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FileUpload
                    onFileSelect={(file) => handleFileSelect('finalMPR', file)}
                    accept=".pdf"
                    allowedTypes={['pdf']}
                    label="Final MPR"
                    required
                    error={formErrors.finalMPR}
                  />

                  <FileUpload
                    onFileSelect={(file) => handleFileSelect('finalReport', file)}
                    accept=".pdf"
                    allowedTypes={['pdf']}
                    label="Final Report"
                    required
                    error={formErrors.finalReport}
                  />

                  <div className="md:col-span-2">
                    <FileUpload
                      onFileSelect={(file) => handleFileSelect('certificate', file)}
                      accept=".pdf"
                      allowedTypes={['pdf']}
                      label="Completion Certificate"
                      required
                      error={formErrors.certificate}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Simple Internship Final Report (6th semester and any internship) */}
          {['6th_internship', 'any_internship'].includes(semesterType) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
                <div className="flex items-center text-white">
                  <FileText className="h-6 w-6 mr-3" />
                  <h3 className="text-xl font-semibold">Final Submission Documents</h3>
                </div>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FileUpload
                    onFileSelect={(file) => handleFileSelect('finalPPT', file)}
                    accept=".pdf"
                    allowedTypes={['pdf']}
                    label="Final Presentation (PPT as PDF)"
                    required
                    error={formErrors.finalPPT}
                  />

                  <FileUpload
                    onFileSelect={(file) => handleFileSelect('finalReport', file)}
                    accept=".pdf"
                    allowedTypes={['pdf']}
                    label="Final Report"
                    required
                    error={formErrors.finalReport}
                  />

                  <div className="md:col-span-2">
                    <FileUpload
                      onFileSelect={(file) => handleFileSelect('certificate', file)}
                      accept=".pdf"
                      allowedTypes={['pdf']}
                      label="Completion Certificate"
                      required
                      error={formErrors.certificate}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-4">
              <button
                type="button"
                onClick={() => navigate('/student/dashboard')}
                className="px-8 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || apiLoading || !uploadsEnabled}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[200px] transition-all"
              >
                {(loading || apiLoading) ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                    Submitting...
                  </>
                ) : (
                  'Submit Final Report'
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Info Box */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 mt-8">
          <div className="flex items-start">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0 mr-4">
              <Info className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-amber-900 mb-2">Final Submission</h4>
              <p className="text-amber-800 leading-relaxed">
                This is your final submission. Once approved by your mentor, your {semesterType?.includes('project') ? 'project' : 'internship'} will be marked as completed.
                Please ensure all documents are accurate and complete before submitting.
                {(semesterType === '7th_internship' || semesterType === '8th_internship') && (
                  <span className="block mt-2 font-medium">
                    Note: All MPR submissions must be approved before final report submission.
                  </span>
                )}
                {semesterType?.includes('internship') && (
                  <span className="block mt-2 font-medium">
                    If you received a PPO offer, please provide the amount and upload the offer letter.
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default FinalReportForm