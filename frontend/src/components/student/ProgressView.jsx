import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useApi } from '../../hooks/useApi'
import { studentService } from '../../services/studentService'
import { formatDate, formatDateTime, formatCurrency } from '../../utils/helpers'
import { StatusBadge } from '../common/ProgressIndicator'
import ProgressIndicator from '../common/ProgressIndicator'
import { 
  Building, 
  Calendar, 
  DollarSign, 
  FileText, 
  ExternalLink,
  User,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  TrendingUp,
  Award,
  Target,
  Activity
} from 'lucide-react'

const ProgressView = () => {
  const { execute, loading } = useApi()
  const [progress, setProgress] = useState(null)

  useEffect(() => {
    loadProgress()
  }, [])

  const loadProgress = async () => {
    try {
      const response = await execute(() => studentService.getProgress())
      if (response.success) {
        setProgress(response.data)
      }
    } catch (error) {
      console.error('Error loading progress:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center min-h-64">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 opacity-20"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!progress || !progress.hasSubmission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-12 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
              <Clock className="h-12 w-12 text-gray-400" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">No Submission Found</h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              You haven't submitted your internship or project details yet.<br />
              Let's get started on your academic journey!
            </p>
            <Link 
              to="/student/choice" 
              className="inline-flex items-center bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-4 px-8 rounded-2xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus className="h-6 w-6 mr-3" />
              Make Your Choice
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const steps = [
    { name: 'Submit Details' },
    { name: 'Under Review' },
    { name: 'Approved' },
    ...(progress.submissionType === 'internship' ? [{ name: 'Monthly Reports' }] : [])
  ]

  const getCurrentStep = () => {
    switch (progress.submissionStatus) {
      case 'pending': return 1
      case 'approved': return progress.submissionType === 'internship' ? 3 : 2
      case 'rejected': return 0
      default: return 0
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-4 shadow-lg">
            <TrendingUp className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Progress Tracking</h1>
          <p className="text-lg text-gray-600">Monitor your submission status and academic progress</p>
        </div>

        {/* Progress Indicator */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-8">
            <div className="flex items-center justify-between text-white">
              <div>
                <h3 className="text-2xl font-bold mb-2">Current Status</h3>
                <p className="text-indigo-100">Track your journey through each milestone</p>
              </div>
              <Activity className="h-10 w-10 text-indigo-200" />
            </div>
          </div>
          
          <div className="p-8">
            <ProgressIndicator steps={steps} currentStep={getCurrentStep()} />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Content - Left Column */}
          <div className="xl:col-span-2 space-y-8">
            {/* Status Card */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-6">
                <div className="flex items-center justify-between text-white">
                  <div>
                    <h3 className="text-xl font-bold mb-1">Submission Overview</h3>
                    <p className="text-emerald-100">Current status and timeline</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={progress.submissionStatus} />
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl">
                      <span className="text-xs text-blue-600 font-semibold uppercase tracking-wide block mb-1">Submission Type</span>
                      <span className="text-lg font-bold text-gray-900 capitalize">{progress.submissionType}</span>
                    </div>
                    
                    <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl">
                      <span className="text-xs text-purple-600 font-semibold uppercase tracking-wide block mb-1">Submitted On</span>
                      <span className="text-sm font-semibold text-gray-900">{formatDateTime(progress.submittedAt)}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {progress.reviewedAt && (
                      <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl">
                        <span className="text-xs text-green-600 font-semibold uppercase tracking-wide block mb-1">Reviewed On</span>
                        <span className="text-sm font-semibold text-gray-900">{formatDateTime(progress.reviewedAt)}</span>
                      </div>
                    )}
                    
                    <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl">
                      <span className="text-xs text-orange-600 font-semibold uppercase tracking-wide block mb-1">Assigned Mentor</span>
                      <span className="text-sm font-semibold text-gray-900">{progress.mentor?.name}</span>
                    </div>
                  </div>
                </div>

                {/* Feedback */}
                {progress.feedback && (
                  <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                    <div className="flex items-center mb-4">
                      <User className="h-6 w-6 text-blue-500 mr-3" />
                      <h4 className="text-lg font-bold text-gray-900">Mentor Feedback</h4>
                    </div>
                    <p className="text-gray-700 leading-relaxed bg-white p-4 rounded-xl border border-blue-100">{progress.feedback}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Details Card */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-6">
                <h3 className="text-xl font-bold text-white mb-1">
                  {progress.submissionType === 'internship' ? 'Internship' : 'Project'} Details
                </h3>
                <p className="text-violet-100">Comprehensive information about your submission</p>
              </div>
              
              <div className="p-6">
                {progress.submissionType === 'internship' ? (
                  <div className="space-y-8">
                    {/* Company Info */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-2xl border border-gray-200">
                      <div className="flex items-center mb-6">
                        <div className="p-3 bg-blue-500 rounded-2xl mr-4">
                          <Building className="h-8 w-8 text-white" />
                        </div>
                        <div>
                          <h4 className="text-2xl font-bold text-gray-900">{progress.companyName}</h4>
                          <p className="text-gray-600 font-medium">{progress.internshipTitle}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                          <span className="text-sm text-gray-500 block mb-1">Duration</span>
                          <span className="text-lg font-bold text-gray-900">{progress.duration} months</span>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                          <span className="text-sm text-gray-500 block mb-1">Start Date</span>
                          <span className="text-lg font-bold text-gray-900">{formatDate(progress.startDate)}</span>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                          <span className="text-sm text-gray-500 block mb-1">End Date</span>
                          <span className="text-lg font-bold text-gray-900">{formatDate(progress.endDate)}</span>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                          <span className="text-sm text-gray-500 block mb-1">Status</span>
                          <StatusBadge status={progress.submissionStatus} />
                        </div>
                      </div>
                    </div>

                    {/* Monthly Progress */}
                    {progress.submissionStatus === 'approved' && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Target className="h-6 w-6 text-purple-500 mr-3" />
                            <h4 className="text-xl font-bold text-gray-900">Monthly Progress Tracking</h4>
                          </div>
                          {!progress.isCompleted && (
                            <Link 
                              to="/student/monthly" 
                              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white py-2 px-4 rounded-xl font-medium flex items-center transition-all duration-300 shadow-md hover:shadow-lg"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Submit Report
                            </Link>
                          )}
                        </div>
                        
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-100">
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-gray-700 font-semibold">
                              Progress Completion: {progress.monthsCompleted} / {progress.totalMonthsRequired}
                            </span>
                            <div className="text-right">
                              <span className="text-3xl font-bold text-gray-900">
                                {Math.round((progress.monthsCompleted / progress.totalMonthsRequired) * 100)}%
                              </span>
                              <p className="text-sm text-gray-500">Complete</p>
                            </div>
                          </div>
                          
                          <div className="relative mb-4">
                            <div className="w-full bg-gray-200 rounded-full h-4">
                              <div 
                                className="bg-gradient-to-r from-purple-500 to-pink-500 h-4 rounded-full transition-all duration-1000 ease-out shadow-sm"
                                style={{ width: `${(progress.monthsCompleted / progress.totalMonthsRequired) * 100}%` }}
                              ></div>
                            </div>
                          </div>

                          {progress.isCompleted ? (
                            <div className="flex items-center text-green-600 bg-green-50 p-4 rounded-xl border border-green-200">
                              <CheckCircle className="h-6 w-6 mr-3" />
                              <div>
                                <span className="font-bold text-lg">Congratulations!</span>
                                <p className="text-sm text-green-700">All monthly reports have been completed successfully!</p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center text-blue-600 bg-blue-50 p-4 rounded-xl border border-blue-200">
                              <Clock className="h-6 w-6 mr-3" />
                              <div>
                                <span className="font-bold">Next Report Due</span>
                                <p className="text-sm text-blue-700">Month {progress.nextMonthDue} submission pending</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Monthly Submissions List */}
                        {progress.monthlySubmissions && progress.monthlySubmissions.length > 0 && (
                          <div className="space-y-4">
                            <h5 className="text-lg font-bold text-gray-900 flex items-center">
                              <Award className="h-5 w-5 mr-2 text-yellow-500" />
                              Submitted Reports History
                            </h5>
                            <div className="space-y-3">
                              {progress.monthlySubmissions.map((monthly, index) => (
                                <div key={index} className="bg-white border-2 border-gray-100 hover:border-gray-200 rounded-2xl p-6 transition-all duration-300 hover:shadow-md">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                      <div className="p-3 bg-blue-100 rounded-xl mr-4">
                                        <Calendar className="h-6 w-6 text-blue-600" />
                                      </div>
                                      <div>
                                        <h6 className="text-lg font-bold text-gray-900">Month {monthly.month}</h6>
                                        <p className="text-sm text-gray-500">
                                          Submitted: {formatDateTime(monthly.submittedAt)}
                                        </p>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-4">
                                      <div className="text-right">
                                        <div className={`text-sm font-bold px-3 py-1 rounded-full ${
                                          monthly.placementStatus === 'yes' 
                                            ? 'bg-green-100 text-green-700' 
                                            : 'bg-gray-100 text-gray-600'
                                        }`}>
                                          {monthly.placementStatus === 'yes' ? 'Placed' : 'Not Placed'}
                                        </div>
                                        {monthly.packageAmount && (
                                          <div className="text-xs text-gray-500 mt-1">
                                            {formatCurrency(monthly.packageAmount)}
                                          </div>
                                        )}
                                      </div>
                                      
                                      {monthly.submissionPPT && (
                                        <a
                                          href={monthly.submissionPPT}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors duration-300"
                                        >
                                          <ExternalLink className="h-5 w-5" />
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  // Project Details
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-100">
                    <div className="flex items-center mb-4">
                      <div className="p-3 bg-purple-500 rounded-2xl mr-4">
                        <FileText className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h4 className="text-2xl font-bold text-gray-900">{progress.projectTitle}</h4>
                        <p className="text-gray-600 font-medium">{progress.projectType}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            {progress.submissionStatus === 'rejected' && (
              <div className="bg-white rounded-3xl shadow-xl border border-red-200 overflow-hidden">
                <div className="bg-gradient-to-r from-red-500 to-pink-600 p-6">
                  <div className="flex items-center text-white">
                    <AlertCircle className="h-8 w-8 mr-3" />
                    <h3 className="text-xl font-bold">Action Required</h3>
                  </div>
                </div>
                
                <div className="p-6">
                  <p className="text-gray-700 mb-6 leading-relaxed">
                    Your submission has been rejected. Please review the mentor feedback above and resubmit with the required changes.
                  </p>
                  <Link
                    to={progress.submissionType === 'internship' ? '/student/internship' : '/student/project'}
                    className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white py-3 px-6 rounded-xl font-semibold flex items-center justify-center transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    <FileText className="h-5 w-5 mr-2" />
                    Update Submission
                  </Link>
                </div>
              </div>
            )}

            {/* Next Steps */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-teal-500 to-cyan-600 p-6">
                <h3 className="text-xl font-bold text-white mb-1">What's Next?</h3>
                <p className="text-teal-100">Your upcoming milestones</p>
              </div>
              
              <div className="p-6 space-y-4">
                {progress.submissionStatus === 'pending' && (
                  <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200">
                    <div className="flex items-center">
                      <Clock className="h-8 w-8 text-yellow-600 mr-4 flex-shrink-0" />
                      <div>
                        <p className="font-bold text-gray-900 text-lg">Under Review</p>
                        <p className="text-sm text-gray-600">Your mentor is currently reviewing your submission</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {progress.submissionStatus === 'approved' && progress.submissionType === 'internship' && !progress.isCompleted && (
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                    <div className="flex items-center">
                      <Calendar className="h-8 w-8 text-blue-600 mr-4 flex-shrink-0" />
                      <div>
                        <p className="font-bold text-gray-900 text-lg">Monthly Reports</p>
                        <p className="text-sm text-gray-600">Keep submitting your monthly progress reports on schedule</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {progress.submissionStatus === 'approved' && progress.submissionType === 'project' && (
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                    <div className="flex items-center">
                      <CheckCircle className="h-8 w-8 text-green-600 mr-4 flex-shrink-0" />
                      <div>
                        <p className="font-bold text-gray-900 text-lg">Project Complete!</p>
                        <p className="text-sm text-gray-600">Your project has been successfully approved</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {progress.isCompleted && (
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                    <div className="flex items-center">
                      <Award className="h-8 w-8 text-green-600 mr-4 flex-shrink-0" />
                      <div>
                        <p className="font-bold text-gray-900 text-lg">Congratulations!</p>
                        <p className="text-sm text-gray-600">All internship requirements have been completed successfully</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Quick Summary</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl">
                  <div className="flex items-center">
                    <FileText className="h-6 w-6 text-blue-500 mr-3" />
                    <span className="font-medium text-gray-700">Type</span>
                  </div>
                  <span className="font-bold text-gray-900 capitalize">{progress.submissionType}</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl">
                  <div className="flex items-center">
                    <Activity className="h-6 w-6 text-green-500 mr-3" />
                    <span className="font-medium text-gray-700">Status</span>
                  </div>
                  <StatusBadge status={progress.submissionStatus} />
                </div>
                
                {progress.submissionType === 'internship' && progress.submissionStatus === 'approved' && (
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl">
                    <div className="flex items-center">
                      <TrendingUp className="h-6 w-6 text-purple-500 mr-3" />
                      <span className="font-medium text-gray-700">Progress</span>
                    </div>
                    <span className="font-bold text-gray-900">
                      {Math.round((progress.monthsCompleted / progress.totalMonthsRequired) * 100)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProgressView