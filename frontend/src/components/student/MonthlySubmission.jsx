import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../../hooks/useApi'
import { studentService } from '../../services/studentService'
import { validateMonthlyForm, hasValidationErrors } from '../../utils/validation'
import { formatDate } from '../../utils/helpers'
import FileUpload from '../common/FileUpload'
import { 
  Calendar, 
  TrendingUp, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Building,
  Target,
  Award,
  Upload,
  Clock,
  DollarSign
} from 'lucide-react'

const MonthlySubmission = () => {
  const navigate = useNavigate()
  const { execute, loading } = useApi()
  const [requirements, setRequirements] = useState(null)
  const [formData, setFormData] = useState({
    month: '',
    placementStatus: '',
    packageAmount: ''
  })
  const [files, setFiles] = useState({
    submissionPPT: null
  })
  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    loadMonthlyRequirements()
  }, [])

  const loadMonthlyRequirements = async () => {
    try {
      const response = await execute(() => studentService.getMonthlyRequirements())
      if (response.success) {
        setRequirements(response.data)
      }
    } catch (error) {
      console.error('Error loading monthly requirements:', error)
      navigate('/student/dashboard')
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

    // Clear package amount if not placed
    if (name === 'placementStatus' && value === 'no') {
      setFormData(prev => ({
        ...prev,
        packageAmount: ''
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
    
    const errors = validateMonthlyForm(formData)
    
    if (!files.submissionPPT) {
      errors.submissionPPT = 'Monthly presentation is required'
    }
    
    setFormErrors(errors)
    
    if (hasValidationErrors(errors)) return

    try {
      const formDataToSend = new FormData()
      
      // Add form fields
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          formDataToSend.append(key, formData[key])
        }
      })
      
      // Add files
      if (files.submissionPPT) {
        formDataToSend.append('submissionPPT', files.submissionPPT)
      }
      
      await execute(() => studentService.submitMonthlyProgress(formDataToSend))
      navigate('/student/dashboard')
    } catch (error) {
      console.error('Error submitting monthly progress:', error)
    }
  }

  if (!requirements) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center min-h-64">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600"></div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 opacity-20"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const availableMonths = requirements.monthlyRequirements?.filter(m => m.canSubmit) || []

  if (availableMonths.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-12 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">All Caught Up!</h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Congratulations! You have completed all required monthly submissions for your internship.
              Keep up the excellent work!
            </p>
            <button
              onClick={() => navigate('/student/dashboard')}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 px-8 rounded-2xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="max-w-5xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full mb-6 shadow-lg">
            <Calendar className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Monthly Progress Report</h1>
          <p className="text-lg text-gray-600">Submit your monthly internship progress and track your journey</p>
        </div>

        {/* Internship Overview Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-8">
            <div className="flex items-center justify-between text-white">
              <div>
                <h3 className="text-2xl font-bold mb-2">Your Internship Details</h3>
                <p className="text-blue-100">Overview of your current internship program</p>
              </div>
              <Building className="h-10 w-10 text-blue-200" />
            </div>
          </div>
          
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                <span className="text-xs text-blue-600 font-semibold uppercase tracking-wide block mb-1">Company</span>
                <span className="text-lg font-bold text-gray-900">{requirements.companyName}</span>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100">
                <span className="text-xs text-purple-600 font-semibold uppercase tracking-wide block mb-1">Position</span>
                <span className="text-sm font-bold text-gray-900">{requirements.internshipTitle}</span>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100">
                <span className="text-xs text-green-600 font-semibold uppercase tracking-wide block mb-1">Duration</span>
                <span className="text-lg font-bold text-gray-900">{requirements.duration} months</span>
              </div>
              <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border border-orange-100">
                <span className="text-xs text-orange-600 font-semibold uppercase tracking-wide block mb-1">Progress</span>
                <span className="text-lg font-bold text-gray-900">
                  {requirements.totalSubmitted} / {requirements.totalRequired}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Progress Overview */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-8">
            <div className="flex items-center justify-between text-white">
              <div>
                <h3 className="text-2xl font-bold mb-2">Monthly Progress Overview</h3>
                <p className="text-emerald-100">Track your submission timeline and status</p>
              </div>
              <Target className="h-10 w-10 text-emerald-200" />
            </div>
          </div>
          
          <div className="p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {requirements.monthlyRequirements?.map((month) => (
                <div
                  key={month.month}
                  className={`relative p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                    month.isSubmitted
                      ? 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 shadow-md'
                      : month.canSubmit
                      ? 'border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-md'
                      : month.isOverdue
                      ? 'border-red-300 bg-gradient-to-br from-red-50 to-pink-50 shadow-md'
                      : 'border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-bold text-gray-900">Month {month.month}</span>
                    <div className={`p-2 rounded-full ${
                      month.isSubmitted 
                        ? 'bg-green-500' 
                        : month.canSubmit 
                        ? 'bg-blue-500' 
                        : month.isOverdue 
                        ? 'bg-red-500' 
                        : 'bg-gray-400'
                    }`}>
                      {month.isSubmitted && <CheckCircle className="h-5 w-5 text-white" />}
                      {month.isOverdue && <AlertCircle className="h-5 w-5 text-white" />}
                      {month.canSubmit && !month.isSubmitted && <Clock className="h-5 w-5 text-white" />}
                      {!month.canSubmit && !month.isSubmitted && !month.isOverdue && <Calendar className="h-5 w-5 text-white" />}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Due: <span className="font-semibold">{formatDate(month.monthDate)}</span>
                    </p>
                    <div className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                      month.isSubmitted
                        ? 'bg-green-100 text-green-700'
                        : month.canSubmit
                        ? 'bg-blue-100 text-blue-700'
                        : month.isOverdue
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {month.isSubmitted
                        ? 'Completed'
                        : month.canSubmit
                        ? 'Can Submit'
                        : month.isOverdue
                        ? 'Overdue'
                        : 'Not Due'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Submission Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Month Selection */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-6">
              <div className="flex items-center text-white">
                <Calendar className="h-8 w-8 mr-4" />
                <div>
                  <h3 className="text-xl font-bold">Month Selection</h3>
                  <p className="text-violet-100">Choose the month for your report submission</p>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              <label className="block text-sm font-bold text-gray-700 mb-4">
                Select Month to Submit <span className="text-red-500">*</span>
              </label>
              <select
                name="month"
                value={formData.month}
                onChange={handleChange}
                className={`w-full px-6 py-4 border-2 rounded-2xl text-lg font-medium transition-all duration-300 focus:ring-4 focus:ring-purple-100 focus:border-purple-500 ${
                  formErrors.month ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <option value="">Choose a month to submit your report</option>
                {availableMonths.map(month => (
                  <option key={month.month} value={month.month}>
                    Month {month.month} - Due {formatDate(month.monthDate)}
                  </option>
                ))}
              </select>
              {formErrors.month && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-600 font-medium">{formErrors.month}</p>
                </div>
              )}
            </div>
          </div>

          {/* Placement Status */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-teal-500 to-cyan-600 p-6">
              <div className="flex items-center text-white">
                <TrendingUp className="h-8 w-8 mr-4" />
                <div>
                  <h3 className="text-xl font-bold">Placement Status</h3>
                  <p className="text-teal-100">Update us on your job placement progress</p>
                </div>
              </div>
            </div>
            
            <div className="p-8 space-y-8">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-6">
                  Have you received a job offer? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="relative cursor-pointer">
                    <input
                      type="radio"
                      name="placementStatus"
                      value="yes"
                      checked={formData.placementStatus === 'yes'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                      formData.placementStatus === 'yes'
                        ? 'border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 shadow-md'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    }`}>
                      <div className="flex items-center">
                        <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center ${
                          formData.placementStatus === 'yes'
                            ? 'border-green-500 bg-green-500'
                            : 'border-gray-300'
                        }`}>
                          {formData.placementStatus === 'yes' && (
                            <CheckCircle className="h-4 w-4 text-white" />
                          )}
                        </div>
                        <div>
                          <span className="font-semibold text-gray-900">Yes, I have received a job offer!</span>
                          <p className="text-sm text-gray-600">Congratulations on your success!</p>
                        </div>
                      </div>
                    </div>
                  </label>
                  
                  <label className="relative cursor-pointer">
                    <input
                      type="radio"
                      name="placementStatus"
                      value="no"
                      checked={formData.placementStatus === 'no'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                      formData.placementStatus === 'no'
                        ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-md'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    }`}>
                      <div className="flex items-center">
                        <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center ${
                          formData.placementStatus === 'no'
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {formData.placementStatus === 'no' && (
                            <CheckCircle className="h-4 w-4 text-white" />
                          )}
                        </div>
                        <div>
                          <span className="font-semibold text-gray-900">No, I haven't received a job offer yet</span>
                          <p className="text-sm text-gray-600">Keep working hard, opportunities are coming!</p>
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
                {formErrors.placementStatus && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-600 font-medium">{formErrors.placementStatus}</p>
                  </div>
                )}
              </div>

              {formData.placementStatus === 'yes' && (
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-2xl border border-orange-200">
                  <div className="flex items-center mb-4">
                    <DollarSign className="h-6 w-6 text-orange-500 mr-3" />
                    <label className="block text-sm font-bold text-gray-700">
                      Package Amount (₹ per annum) <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <input
                    type="number"
                    name="packageAmount"
                    value={formData.packageAmount}
                    onChange={handleChange}
                    className={`w-full px-6 py-4 border-2 rounded-2xl text-lg font-medium transition-all duration-300 focus:ring-4 focus:ring-orange-100 focus:border-orange-500 ${
                      formErrors.packageAmount ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
                    }`}
                    placeholder="Enter your annual package amount"
                    min="0"
                  />
                  {formErrors.packageAmount && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                      <p className="text-sm text-red-600 font-medium">{formErrors.packageAmount}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Monthly Presentation */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-pink-500 to-rose-600 p-6">
              <div className="flex items-center text-white">
                <FileText className="h-8 w-8 mr-4" />
                <div>
                  <h3 className="text-xl font-bold">Monthly Presentation</h3>
                  <p className="text-pink-100">Upload your progress presentation document</p>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-2xl border-2 border-dashed border-gray-300">
                <FileUpload
                  onFileSelect={(file) => handleFileSelect('submissionPPT', file)}
                  accept=".ppt,.pptx,.pdf"
                  allowedTypes={['ppt', 'pptx', 'pdf']}
                  label="Monthly Progress Presentation"
                  required
                  error={formErrors.submissionPPT}
                />
                <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-sm text-blue-700 leading-relaxed">
                    <strong>Upload Guidelines:</strong> Please upload a presentation (PPT, PPTX, or PDF) that summarizes your work progress, achievements, and learnings for this month. Maximum file size: 10MB.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            <div className="flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-6">
              <button
                type="button"
                onClick={() => navigate('/student/dashboard')}
                className="px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-semibold text-lg transition-all duration-300 border-2 border-gray-200 hover:border-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-2xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:hover:scale-100 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mr-3"></div>
                    Submitting Report...
                  </>
                ) : (
                  <>
                    <Upload className="h-6 w-6 mr-3" />
                    Submit Monthly Report
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Guidelines */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-400 to-yellow-500 p-6">
            <div className="flex items-center text-white">
              <Award className="h-8 w-8 mr-4" />
              <div>
                <h4 className="text-xl font-bold">Monthly Report Guidelines</h4>
                <p className="text-amber-100">Follow these best practices for your submission</p>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                    1
                  </div>
                  <div>
                    <h5 className="font-bold text-gray-900 mb-2">Task Summary</h5>
                    <p className="text-gray-600 text-sm leading-relaxed">Include a comprehensive summary of all tasks completed during the month with specific examples and outcomes.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                    2
                  </div>
                  <div>
                    <h5 className="font-bold text-gray-900 mb-2">Key Learnings</h5>
                    <p className="text-gray-600 text-sm leading-relaxed">Highlight the key learnings, new skills acquired, and technologies you've worked with during this period.</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                    3
                  </div>
                  <div>
                    <h5 className="font-bold text-gray-900 mb-2">Challenges & Solutions</h5>
                    <p className="text-gray-600 text-sm leading-relaxed">Mention any challenges faced and explain how they were resolved, showcasing your problem-solving abilities.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                    4
                  </div>
                  <div>
                    <h5 className="font-bold text-gray-900 mb-2">Placement Updates</h5>
                    <p className="text-gray-600 text-sm leading-relaxed">Update your placement status honestly - this data helps us track program success and provide better support.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MonthlySubmission