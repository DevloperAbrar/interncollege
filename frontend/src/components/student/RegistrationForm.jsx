import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useApi } from '../../hooks/useApi'
import { studentService } from '../../services/studentService'
import FileUpload from '../common/FileUpload'
import { Building, Code, Calendar, DollarSign, User, FileText, ArrowLeft, Info, Lock } from 'lucide-react'

const RegistrationForm = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { execute, loading } = useApi()

  const semesterType = location.state?.semesterType || '8th_internship'
  const [selectedSubType, setSelectedSubType] = useState('')

  // ─── NEW: uploads-enabled state ────────────────────────────────────────────
  const [uploadsEnabled, setUploadsEnabled] = useState(true)
  const [uploadsClosedReason, setUploadsClosedReason] = useState('')
  const [checkingAccess, setCheckingAccess] = useState(true)

  useEffect(() => {
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

  const [formData, setFormData] = useState({
    companyName: '',
    companyType: '',
    internshipType: '',
    internshipTitle: '',
    startDate: '',
    endDate: '',
    hasStipend: false,
    stipendAmount: '',
    mentorName: '',
    mentorEmail: '',
    hrName: '',
    hrEmail: '',
    studentMobileNumber: '',
    mentorRole: '',
    mentorContactNumber: '',
    companyFullAddress: '',
    typeOfWork: '',
    internshipDomain: '',
    projectTitle: '',
    projectType: ''
  })

  const [files, setFiles] = useState({
    stipendProof: null,
    offerLetter: null,
    nocLetter: null,
    projectReport: null
  })

  const [formErrors, setFormErrors] = useState({})

  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  // ─── NEW: distinguishes real byte-upload from server-side processing ────────
  // 'uploading' = files still being sent (real % from axios onUploadProgress)
  // 'processing' = 100% sent, waiting on server to save/validate/respond
  const [submitPhase, setSubmitPhase] = useState('uploading')

  const show8thTypeSelection = semesterType === '8th_internship' && !selectedSubType
  const isProjectType = selectedSubType === 'project' || semesterType === '8th_project'
  const isInternshipType = !isProjectType

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

    if (isProjectType) {
      if (!formData.projectTitle?.trim() || formData.projectTitle.trim().length < 5) {
        errors.projectTitle = 'Project title must be at least 5 characters long'
      }
      if (!formData.projectType) {
        errors.projectType = 'Project type is required'
      }
      if (!files.projectReport) {
        errors.projectReport = 'Project report is required'
      }
    } else {
      if (!formData.studentMobileNumber?.trim()) {
        errors.studentMobileNumber = 'Student mobile number is required'
      } else if (!/^\d{10}$/.test(formData.studentMobileNumber.trim())) {
        errors.studentMobileNumber = 'Please enter a valid 10-digit mobile number'
      }

      if (!formData.mentorRole?.trim()) {
        errors.mentorRole = 'Mentor role is required'
      }

      if (!formData.mentorContactNumber?.trim()) {
        errors.mentorContactNumber = 'Mentor contact number is required'
      } else if (!/^\d{10}$/.test(formData.mentorContactNumber.trim())) {
        errors.mentorContactNumber = 'Please enter a valid 10-digit contact number'
      }

      if (!formData.companyFullAddress?.trim()) {
        errors.companyFullAddress = 'Company full address is required'
      } else if (formData.companyFullAddress.trim().length < 20) {
        errors.companyFullAddress = 'Please provide complete address (minimum 20 characters)'
      }

      if (!formData.typeOfWork) {
        errors.typeOfWork = 'Type of work is required'
      }

      if (!formData.internshipDomain?.trim()) {
        errors.internshipDomain = 'Internship domain is required'
      }
      if (!formData.companyName?.trim()) {
        errors.companyName = 'Company name is required'
      }
      if (!formData.companyType) {
        errors.companyType = 'Company type is required'
      }
      if (!formData.internshipTitle?.trim()) {
        errors.internshipTitle = 'Internship title is required'
      } else if (formData.internshipTitle.trim().length < 5) {
        errors.internshipTitle = 'Internship title must be at least 5 characters long'
      } else if (formData.internshipTitle.trim().length > 100) {
        errors.internshipTitle = 'Internship title must be less than 100 characters'
      }
      if (!formData.internshipType) {
        errors.internshipType = 'Internship type is required'
      }
      if (!formData.startDate) {
        errors.startDate = 'Start date is required'
      }
      if (!formData.endDate) {
        errors.endDate = 'End date is required'
      }

      if (formData.startDate && formData.endDate) {
        if (new Date(formData.endDate) <= new Date(formData.startDate)) {
          errors.endDate = 'End date must be after start date'
        }
      }

      if (!formData.mentorName?.trim()) {
        errors.mentorName = 'Mentor name is required'
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!formData.mentorEmail || !emailRegex.test(formData.mentorEmail)) {
        errors.mentorEmail = 'Valid mentor email is required'
      }

      if (!formData.hrName?.trim()) {
        errors.hrName = 'HR name is required'
      }

      if (!formData.hrEmail || !emailRegex.test(formData.hrEmail)) {
        errors.hrEmail = 'Valid HR email is required'
      }

      if (!files.offerLetter) {
        errors.offerLetter = 'Offer letter is required'
      }
      if (!files.nocLetter) {
        errors.nocLetter = 'NOC letter is required'
      }

      if (formData.hasStipend) {
        if (!formData.stipendAmount || isNaN(formData.stipendAmount) || Number(formData.stipendAmount) <= 0) {
          errors.stipendAmount = 'Valid stipend amount is required'
        }
        if (!files.stipendProof) {
          errors.stipendProof = 'Stipend proof is required'
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

    if (!validateForm()) {
      return
    }

    try {
      const formDataToSend = new FormData()

      let finalSemesterType = semesterType
      if (semesterType === '8th_internship') {
        finalSemesterType = selectedSubType === 'project' ? '8th_project' : '8th_internship'
      }

      formDataToSend.append('semesterType', finalSemesterType)

      Object.keys(formData).forEach(key => {
        const value = formData[key]
        if (value !== null && value !== undefined) {
          formDataToSend.append(key, value.toString())
        }
      })

      Object.keys(files).forEach(key => {
        if (files[key]) {
          formDataToSend.append(key, files[key])
        }
      })

      setIsUploading(true)
      setUploadProgress(0)
      setSubmitPhase('uploading')
      try {
        await execute(() => studentService.submitRegistration(formDataToSend, (percent) => {
          setUploadProgress(percent)
          // ── Real bytes finished sending, but server hasn't responded yet ──
          // Switch to an indeterminate "processing" state instead of leaving
          // a static 100% bar sitting there while the request is still pending.
          if (percent >= 100) {
            setSubmitPhase('processing')
          }
        }))
      } finally {
        setIsUploading(false)
      }
      navigate('/student/dashboard')
    } catch (error) {
      console.error('❌ Error submitting registration:', error)

      if (error.response) {
        if (error.response.status === 403) {
          // Uploads closed error came back from backend mid-flow
          setUploadsEnabled(false)
          setUploadsClosedReason(error.response.data?.message || 'Uploads are currently closed.')
          alert(error.response.data?.message || 'Uploads are currently closed. Please contact your mentor.')
          return
        }
        if (error.response.data?.errors && Array.isArray(error.response.data.errors)) {
          const errorDetails = error.response.data.errors.map(err => {
            if (typeof err === 'object') {
              return `${err.field || 'Unknown field'}: ${err.message || JSON.stringify(err)}`
            }
            return err.toString()
          }).join('\n')
          alert(`Validation Errors:\n${errorDetails}`)
        } else {
          const errorMessage = error.response.data?.message || 'Submission failed'
          alert(`Submission Error: ${errorMessage}`)
        }
      } else if (error.request) {
        alert('Network Error: Unable to reach server. Please check if the server is running.')
      } else {
        alert(`Error: ${error.message}`)
      }
    }
  }

  // ─── NEW: Uploads Closed screen — blocks everything ──────────────────────────
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
              {uploadsClosedReason || 'Document uploads are currently unavailable. Please contact your mentor or administrator.'}
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

  if (show8thTypeSelection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">8th Semester - Choose Your Path</h1>
            <p className="text-gray-600">Select whether you want to do an internship or project</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div
              onClick={() => setSelectedSubType('internship')}
              className="cursor-pointer bg-white rounded-xl border-2 border-gray-200 hover:border-blue-500 p-8 text-center transition-all duration-300"
            >
              <Building className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Internship</h3>
              <p className="text-gray-600">Industry internship with MPR submissions</p>
            </div>

            <div
              onClick={() => setSelectedSubType('project')}
              className="cursor-pointer bg-white rounded-xl border-2 border-gray-200 hover:border-purple-500 p-8 text-center transition-all duration-300"
            >
              <Code className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Project</h3>
              <p className="text-gray-600">Research/development project with final report</p>
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {isProjectType ? 'Project Registration' : 'Internship Registration'}
              </h1>
              <p className="text-gray-600">
                {semesterType.replace('_', ' ').toUpperCase()} - Complete your registration details
              </p>
            </div>
            <button
              onClick={() => navigate('/student/choice')}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 rounded-lg"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {isProjectType ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6">
                <h3 className="text-xl font-semibold text-white">Project Details</h3>
              </div>
              <div className="p-8 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Project Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="projectTitle"
                    value={formData.projectTitle}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Enter your project title"
                  />
                  {formErrors.projectTitle && <p className="text-red-600 text-sm mt-1">{formErrors.projectTitle}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Project Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="projectType"
                    value={formData.projectType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">Select Project Type</option>
                    <option value="software">Software</option>
                    <option value="hardware">Hardware</option>
                    <option value="software_hardware">Software & Hardware</option>
                    <option value="experimental">Experimental</option>
                  </select>
                  {formErrors.projectType && <p className="text-red-600 text-sm mt-1">{formErrors.projectType}</p>}
                </div>

                <div>
                  <FileUpload
                    onFileSelect={(file) => handleFileSelect('projectReport', file)}
                    accept=".pdf"
                    allowedTypes={['pdf']}
                    label="Project Report Document"
                    required
                    error={formErrors.projectReport}
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Company Information */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
                  <h3 className="text-xl font-semibold text-white">Company Information</h3>
                </div>
                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Company Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter company name"
                      />
                      {formErrors.companyName && <p className="text-red-600 text-sm mt-1">{formErrors.companyName}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Company Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="companyType"
                        value={formData.companyType}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Type</option>
                        <option value="startup">Startup</option>
                        <option value="mnc">MNC</option>
                        <option value="government">Government</option>
                        <option value="psu">PSU</option>
                        <option value="academic_institute">Academic Institute</option>
                        <option value="research">Research</option>
                        <option value="other">Other</option>
                      </select>
                      {formErrors.companyType && <p className="text-red-600 text-sm mt-1">{formErrors.companyType}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Company Full Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="companyFullAddress"
                        value={formData.companyFullAddress}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., TechnoDuxx Pvt Ltd., Plot No. 9, Aditya Avenue, Airport Road, Bhopal, Madhya Pradesh 462080"
                      />
                      {formErrors.companyFullAddress && <p className="text-red-600 text-sm mt-1">{formErrors.companyFullAddress}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Type of Work <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="typeOfWork"
                        value={formData.typeOfWork}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Work Type</option>
                        <option value="software">Software</option>
                        <option value="hardware">Hardware</option>
                        <option value="product_development">Product Development</option>
                        <option value="software_hardware">Software & Hardware</option>
                        <option value="experiment_based">Experiment Based</option>
                        <option value="testing_based">Testing Based</option>
                        <option value="case_study">Case Study</option>
                        <option value="other">Other</option>
                      </select>
                      {formErrors.typeOfWork && <p className="text-red-600 text-sm mt-1">{formErrors.typeOfWork}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Internship Domain <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="internshipDomain"
                        value={formData.internshipDomain}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Web Development, AI/ML, Data Science, Mobile App Development"
                      />
                      {formErrors.internshipDomain && <p className="text-red-600 text-sm mt-1">{formErrors.internshipDomain}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Internship Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="internshipTitle"
                        value={formData.internshipTitle}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter internship title (min 5 characters)"
                      />
                      {formErrors.internshipTitle && <p className="text-red-600 text-sm mt-1">{formErrors.internshipTitle}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Internship Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="internshipType"
                        value={formData.internshipType}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Type</option>
                        <option value="remote">Remote</option>
                        <option value="onsite">On-site</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                      {formErrors.internshipType && <p className="text-red-600 text-sm mt-1">{formErrors.internshipType}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Duration */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-green-700 p-6">
                  <h3 className="text-xl font-semibold text-white">Duration & Dates</h3>
                </div>
                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Start Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                      {formErrors.startDate && <p className="text-red-600 text-sm mt-1">{formErrors.startDate}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        End Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                      {formErrors.endDate && <p className="text-red-600 text-sm mt-1">{formErrors.endDate}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stipend */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-yellow-600 to-orange-600 p-6">
                  <h3 className="text-xl font-semibold text-white">Stipend Information</h3>
                </div>
                <div className="p-8">
                  <div className="mb-6">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="hasStipend"
                        checked={formData.hasStipend}
                        onChange={handleChange}
                        className="mr-3 w-5 h-5 text-yellow-600"
                      />
                      <span className="text-sm font-semibold text-gray-700">This internship offers stipend</span>
                    </label>
                  </div>

                  {formData.hasStipend && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Stipend Amount (₹) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          name="stipendAmount"
                          value={formData.stipendAmount}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                          placeholder="Enter stipend amount"
                        />
                        {formErrors.stipendAmount && <p className="text-red-600 text-sm mt-1">{formErrors.stipendAmount}</p>}
                      </div>

                      <div>
                        <FileUpload
                          onFileSelect={(file) => handleFileSelect('stipendProof', file)}
                          accept=".pdf"
                          allowedTypes={['pdf']}
                          label="Stipend Proof Document"
                          required
                          error={formErrors.stipendProof}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Mentor Details */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6">
                  <h3 className="text-xl font-semibold text-white">Mentor & HR Details</h3>
                </div>
                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Industry Mentor Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="mentorName"
                        value={formData.mentorName}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Enter mentor name"
                      />
                      {formErrors.mentorName && <p className="text-red-600 text-sm mt-1">{formErrors.mentorName}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Student Mobile Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="studentMobileNumber"
                        value={formData.studentMobileNumber}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Enter your mobile number"
                      />
                      {formErrors.studentMobileNumber && <p className="text-red-600 text-sm mt-1">{formErrors.studentMobileNumber}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Industry Mentor Role in Company <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="mentorRole"
                        value={formData.mentorRole}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="e.g., Senior Software Engineer, Team Lead, Project Manager"
                      />
                      {formErrors.mentorRole && <p className="text-red-600 text-sm mt-1">{formErrors.mentorRole}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Industry Mentor Contact Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="mentorContactNumber"
                        value={formData.mentorContactNumber}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Enter mentor's contact number"
                      />
                      {formErrors.mentorContactNumber && <p className="text-red-600 text-sm mt-1">{formErrors.mentorContactNumber}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Industry Mentor Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="mentorEmail"
                        value={formData.mentorEmail}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="mentor@company.com"
                      />
                      {formErrors.mentorEmail && <p className="text-red-600 text-sm mt-1">{formErrors.mentorEmail}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        HR Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="hrName"
                        value={formData.hrName}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Enter HR name"
                      />
                      {formErrors.hrName && <p className="text-red-600 text-sm mt-1">{formErrors.hrName}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        HR Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="hrEmail"
                        value={formData.hrEmail}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="hr@company.com"
                      />
                      {formErrors.hrEmail && <p className="text-red-600 text-sm mt-1">{formErrors.hrEmail}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-red-600 to-pink-600 p-6">
                  <h3 className="text-xl font-semibold text-white">Required Documents</h3>
                </div>
                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <FileUpload
                        onFileSelect={(file) => handleFileSelect('offerLetter', file)}
                        accept=".pdf"
                        allowedTypes={['pdf']}
                        label="Offer Letter"
                        required
                        error={formErrors.offerLetter}
                      />
                    </div>

                    <div>
                      <FileUpload
                        onFileSelect={(file) => handleFileSelect('nocLetter', file)}
                        accept=".pdf"
                        allowedTypes={['pdf']}
                        label="NOC Letter"
                        required
                        error={formErrors.nocLetter}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {isUploading && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              {submitPhase === 'uploading' ? (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Uploading documents...</span>
                    <span className="text-sm font-semibold text-blue-600">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Files uploaded — processing your submission...</span>
                    <span className="text-sm font-semibold text-green-600">Almost done</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    {/* Indeterminate bar — honest signal that upload is done but the
                        server is still working, instead of a static, misleading 100% */}
                    <div className="bg-blue-600 h-2.5 rounded-full w-1/3 animate-[indeterminate_1.2s_ease-in-out_infinite]" />
                  </div>
                  <style>{`
                    @keyframes indeterminate {
                      0%   { margin-left: 0%;   width: 25%; }
                      50%  { margin-left: 75%;  width: 25%; }
                      100% { margin-left: 0%;   width: 25%; }
                    }
                  `}</style>
                </>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-4">
              <button
                type="button"
                onClick={() => navigate('/student/choice')}
                className="px-8 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !uploadsEnabled}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[200px]"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                    {submitPhase === 'processing' ? 'Processing...' : 'Submitting...'}
                  </>
                ) : (
                  'Submit Registration'
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Info Box */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mt-8">
          <div className="flex items-start">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mr-4">
              <Info className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-blue-900 mb-2">What happens next?</h4>
              <p className="text-blue-800 leading-relaxed">
                Your registration will be reviewed by your assigned mentor. Once approved, you'll be able to proceed with the next steps based on your semester type.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegistrationForm