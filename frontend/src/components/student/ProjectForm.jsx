import React, { useState } from 'react'
import { Code, FileText, ArrowLeft, CheckCircle, Upload, X, Info } from 'lucide-react'

const ProjectForm = () => {
  const [formData, setFormData] = useState({
    projectTitle: '',
    projectType: ''
  })
  const [files, setFiles] = useState({
    projectPPT: null
  })
  const [formErrors, setFormErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [hasExistingSubmission, setHasExistingSubmission] = useState(false)

  const PROJECT_TYPES = [
    'Web Development',
    'Mobile App Development', 
    'Desktop Application',
    'Machine Learning/AI',
    'Data Analysis',
    'Research Project',
    'Hardware Project',
    'Other'
  ]

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

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      alert('Project details submitted successfully!')
    }, 2000)
  }

  const FileUploadComponent = ({ label, fieldName, required, error, accept, allowedFormats }) => {
    const file = files[fieldName]
    
    return (
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
          error ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50'
        }`}>
          {file ? (
            <div className="flex items-center justify-between bg-white rounded-lg p-4 border shadow-sm">
              <div className="flex items-center">
                <FileText className="h-6 w-6 text-orange-600 mr-3" />
                <div>
                  <span className="text-sm font-medium text-gray-900 block">{file.name}</span>
                  <span className="text-xs text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
              </div>
              <button
                onClick={() => handleFileSelect(fieldName, null)}
                className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div>
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="h-8 w-8 text-orange-600" />
              </div>
              <p className="text-lg font-medium text-gray-700 mb-2">Upload your presentation</p>
              <p className="text-sm text-gray-600 mb-4">Click to browse or drag and drop</p>
              <p className="text-xs text-gray-500">Supported formats: {allowedFormats} • Max size: 10MB</p>
              <input
                type="file"
                accept={accept}
                onChange={(e) => handleFileSelect(fieldName, e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-600 flex items-center">
            <X className="h-4 w-4 mr-1" />
            {error}
          </p>
        )}
      </div>
    )
  }

  if (hasExistingSubmission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-8 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-gray-100">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Already Submitted</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              You have already submitted your project. Check your progress to view details and track your project status.
            </p>
            <button
              onClick={() => alert('Navigate to progress page')}
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Project Submission</h1>
              <p className="text-gray-600 text-lg">Share details about your amazing project work</p>
            </div>
            <button
              onClick={() => alert('Navigate back to choice')}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 font-medium"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Choice
            </button>
          </div>
        </div>

        <div className="space-y-8">
          {/* Project Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6">
              <div className="flex items-center text-white">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-4">
                  <Code className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Project Information</h3>
                  <p className="text-purple-100 text-sm mt-1">Tell us about your innovative project</p>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Project Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="projectTitle"
                    value={formData.projectTitle}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 ${
                      formErrors.projectTitle ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="Enter your project title (minimum 5 characters)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Choose a clear, descriptive title that reflects what you built or researched
                  </p>
                  {formErrors.projectTitle && (
                    <p className="text-sm text-red-600 mt-1">{formErrors.projectTitle}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Project Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="projectType"
                    value={formData.projectType}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 ${
                      formErrors.projectType ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-200'
                    }`}
                  >
                    <option value="">Select Project Type</option>
                    {PROJECT_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {formErrors.projectType && (
                    <p className="text-sm text-red-600 mt-1">{formErrors.projectType}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Document Upload */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-600 to-orange-700 p-6">
              <div className="flex items-center text-white">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-4">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Project Presentation</h3>
                  <p className="text-orange-100 text-sm mt-1">Upload your project showcase presentation</p>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              <FileUploadComponent
                label="Project Presentation"
                fieldName="projectPPT"
                required
                error={formErrors.projectPPT}
                accept=".ppt,.pptx,.pdf"
                allowedFormats="PPT, PPTX, PDF"
              />
            </div>
          </div>

          {/* Project Guidelines */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-8">
            <div className="flex items-start">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mr-4">
                <Info className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-blue-900 mb-4">Project Submission Guidelines</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3 mt-0.5 flex-shrink-0">1</div>
                      <p className="text-sm text-blue-800">Your project title should clearly describe what you've built or researched</p>
                    </div>
                    <div className="flex items-start">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3 mt-0.5 flex-shrink-0">2</div>
                      <p className="text-sm text-blue-800">The presentation should include project overview, methodology, and results</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3 mt-0.5 flex-shrink-0">3</div>
                      <p className="text-sm text-blue-800">Include screenshots, code snippets, or demos where applicable</p>
                    </div>
                    <div className="flex items-start">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3 mt-0.5 flex-shrink-0">4</div>
                      <p className="text-sm text-blue-800">Make sure to highlight your personal contributions if it's a group project</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-4">
              <button
                type="button"
                onClick={() => alert('Navigate back to choice')}
                className="px-8 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[200px] transition-all duration-200"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                    Submitting...
                  </>
                ) : (
                  'Submit Project Details'
                )}
              </button>
            </div>
          </div>

          {/* Success Info */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-start">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mr-4">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-green-900 mb-2">What happens next?</h4>
                <p className="text-green-800 leading-relaxed">
                  Your project submission will be carefully reviewed by your assigned mentor. Once approved, 
                  your project will be marked as complete. Unlike internships, no monthly progress reports are required for projects.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectForm