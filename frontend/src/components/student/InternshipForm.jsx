import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../../hooks/useApi'
import { studentService } from '../../services/studentService'
import { validateInternshipForm, hasValidationErrors } from '../../utils/validation'
import { INDUSTRY_TYPES, INTERNSHIP_TYPES } from '../../utils/constants'
import FileUpload from '../common/FileUpload'
import { Building, Calendar, DollarSign, User, FileText, ArrowLeft, CheckCircle, Info } from 'lucide-react'

const InternshipForm = () => {
  const navigate = useNavigate()
  const { execute, loading } = useApi()
  const [formData, setFormData] = useState({
    companyName: '',
    internshipTitle: '',
    startDate: '',
    endDate: '',
    mentorName: '',
    industryMentorEmail: '',
    hrEmail: '',
    industryType: '',
    internshipType: '',
    stipendPerMonth: '',
    jobOfferReceived: ''
  })
  const [files, setFiles] = useState({
    offerLetter: null,
    noc: null
  })
  const [formErrors, setFormErrors] = useState({})
  const [hasExistingSubmission, setHasExistingSubmission] = useState(false)

  useEffect(() => {
    checkExistingSubmission()
  }, [])

  const checkExistingSubmission = async () => {
    try {
      const response = await execute(() => studentService.getDashboard())
      if (response.success && response.data.hasSubmission) {
        setHasExistingSubmission(true)
      }
    } catch (error) {
      console.error('Error checking submission status:', error)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear specific field error
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleFileSelect = (fieldName, file) => {
    setFiles(prev => ({
      ...prev,
      [fieldName]: file
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const errors = validateInternshipForm(formData)
    
    if (!files.offerLetter) {
      errors.offerLetter = 'Offer letter is required'
    }
    
    if (!files.noc) {
      errors.noc = 'NOC document is required'
    }
    
    setFormErrors(errors)
    
    if (hasValidationErrors(errors)) return

    try {
      const formDataToSend = new FormData()
      
      // Add form fields
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key])
      })
      
      // Add files
      if (files.offerLetter) {
        formDataToSend.append('offerLetter', files.offerLetter)
      }
      if (files.noc) {
        formDataToSend.append('noc', files.noc)
      }
      
      await execute(() => studentService.submitInternship(formDataToSend))
      navigate('/student/dashboard')
    } catch (error) {
      console.error('Error submitting internship:', error)
    }
  }

  if (hasExistingSubmission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-gray-100">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Already Submitted</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              You have already made your submission. Check your progress to view details and track your internship status.
            </p>
            <button
              onClick={() => navigate('/student/progress')}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              View Progress
            </button>
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Internship Submission</h1>
              <p className="text-gray-600 text-lg">Provide details about your internship experience</p>
            </div>
            <button
              onClick={() => navigate('/student/choice')}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 font-medium"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Choice
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Company Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
              <div className="flex items-center text-white">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-4">
                  <Building className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Company Information</h3>
                  <p className="text-blue-100 text-sm mt-1">Tell us about your internship company</p>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
                      formErrors.companyName ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="Enter company name"
                  />
                  {formErrors.companyName && (
                    <p className="text-sm text-red-600 mt-1">{formErrors.companyName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Internship Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="internshipTitle"
                    value={formData.internshipTitle}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
                      formErrors.internshipTitle ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="e.g., Software Development Intern"
                  />
                  {formErrors.internshipTitle && (
                    <p className="text-sm text-red-600 mt-1">{formErrors.internshipTitle}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Industry Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="industryType"
                    value={formData.industryType}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
                      formErrors.industryType ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-200'
                    }`}
                  >
                    <option value="">Select Industry</option>
                    {INDUSTRY_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {formErrors.industryType && (
                    <p className="text-sm text-red-600 mt-1">{formErrors.industryType}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Internship Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="internshipType"
                    value={formData.internshipType}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
                      formErrors.internshipType ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-200'
                    }`}
                  >
                    <option value="">Select Type</option>
                    {INTERNSHIP_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {formErrors.internshipType && (
                    <p className="text-sm text-red-600 mt-1">{formErrors.internshipType}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Duration & Compensation */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-green-700 p-6">
              <div className="flex items-center text-white">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-4">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Duration & Compensation</h3>
                  <p className="text-green-100 text-sm mt-1">Internship timeline and payment details</p>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 ${
                      formErrors.startDate ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-200'
                    }`}
                  />
                  {formErrors.startDate && (
                    <p className="text-sm text-red-600 mt-1">{formErrors.startDate}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 ${
                      formErrors.endDate ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-200'
                    }`}
                  />
                  {formErrors.endDate && (
                    <p className="text-sm text-red-600 mt-1">{formErrors.endDate}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Stipend per Month (₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      name="stipendPerMonth"
                      value={formData.stipendPerMonth}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 ${
                        formErrors.stipendPerMonth ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-200'
                      }`}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  {formErrors.stipendPerMonth && (
                    <p className="text-sm text-red-600 mt-1">{formErrors.stipendPerMonth}</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Job Offer Received <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-6">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="jobOfferReceived"
                      value="yes"
                      checked={formData.jobOfferReceived === 'yes'}
                      onChange={handleChange}
                      className="mr-3 w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">Yes</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="jobOfferReceived"
                      value="no"
                      checked={formData.jobOfferReceived === 'no'}
                      onChange={handleChange}
                      className="mr-3 w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">No</span>
                  </label>
                </div>
                {formErrors.jobOfferReceived && (
                  <p className="text-sm text-red-600">{formErrors.jobOfferReceived}</p>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6">
              <div className="flex items-center text-white">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-4">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Contact Information</h3>
                  <p className="text-purple-100 text-sm mt-1">Mentor and HR contact details</p>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Industry Mentor Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="mentorName"
                    value={formData.mentorName}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 ${
                      formErrors.mentorName ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="Enter mentor name"
                  />
                  {formErrors.mentorName && (
                    <p className="text-sm text-red-600 mt-1">{formErrors.mentorName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Industry Mentor Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="industryMentorEmail"
                    value={formData.industryMentorEmail}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 ${
                      formErrors.industryMentorEmail ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="mentor@company.com"
                  />
                  {formErrors.industryMentorEmail && (
                    <p className="text-sm text-red-600 mt-1">{formErrors.industryMentorEmail}</p>
                  )}
                </div>

                <div className="lg:col-span-2 space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    HR Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="hrEmail"
                    value={formData.hrEmail}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 ${
                      formErrors.hrEmail ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="hr@company.com"
                  />
                  {formErrors.hrEmail && (
                    <p className="text-sm text-red-600 mt-1">{formErrors.hrEmail}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Document Uploads */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-600 to-orange-700 p-6">
              <div className="flex items-center text-white">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-4">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Required Documents</h3>
                  <p className="text-orange-100 text-sm mt-1">Upload your internship documents (PDF only)</p>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                    onFileSelect={(file) => handleFileSelect('noc', file)}
                    accept=".pdf"
                    allowedTypes={['pdf']}
                    label="NOC (No Objection Certificate)"
                    required
                    error={formErrors.noc}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-4">
              <button
                type="button"
                onClick={() => navigate('/student/choice')}
                className="px-8 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[200px] transition-all duration-200"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                    Submitting...
                  </>
                ) : (
                  'Submit Internship Details'
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
                Your submission will be carefully reviewed by your assigned mentor. You'll receive a notification once approved, 
                and then you can start submitting monthly progress reports to track your internship journey.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InternshipForm