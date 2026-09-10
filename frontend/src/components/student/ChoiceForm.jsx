import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../../hooks/useApi'
import { studentService } from '../../services/studentService'
import {
  GraduationCap, Building, Code, BookOpen, ArrowRight,
  CheckCircle, Users, Calendar, Award, TrendingUp, Clock
} from 'lucide-react'

const ALL_OPTIONS = {
  any_internship: {
    id: 'any_internship',
    title: 'Any Other Internship',
    description: 'Submit any internship experience for academic recognition.',
    icon: Calendar,
    color: 'from-orange-500 to-red-500',
    bgColor: 'from-orange-50 to-red-50',
    borderColor: 'border-orange-200',
    features: ['Flexible documentation', 'Custom duration support', 'Basic progress tracking', 'Academic credit eligibility'],
    timeline: 'Variable duration'
  },
  '6th_internship': {
    id: '6th_internship',
    title: '6th Semester Internship',
    description: 'Mid-program industry training with focused internship program.',
    icon: Users,
    color: 'from-green-500 to-emerald-500',
    bgColor: 'from-green-50 to-emerald-50',
    borderColor: 'border-green-200',
    features: ['Simple registration', 'Basic documentation', 'Final report submission', 'Industry exposure'],
    timeline: '2–4 months'
  },
  '7th_internship': {
    id: '7th_internship',
    title: '7th Semester Internship',
    description: 'Pre-final year industry experience with comprehensive tracking.',
    icon: Building,
    color: 'from-blue-500 to-indigo-500',
    bgColor: 'from-blue-50 to-indigo-50',
    borderColor: 'border-blue-200',
    features: ['Registration & approval', '3 Monthly progress reports', '1 Mid-semester evaluation', 'Final report'],
    timeline: '4–6 months'
  },
  '8th_internship': {
    id: '8th_internship',
    title: '8th Semester Internship',
    description: 'Final year internship with full MPR tracking and evaluation.',
    icon: GraduationCap,
    color: 'from-purple-500 to-pink-500',
    bgColor: 'from-purple-50 to-pink-50',
    borderColor: 'border-purple-200',
    features: ['Complete registration', '3 MPR submissions', '1 Mid-semester evaluation', 'Final report'],
    timeline: '6+ months'
  },
  '8th_project': {
    id: '8th_project',
    title: '8th Semester Project',
    description: 'Research or development project for final semester.',
    icon: Code,
    color: 'from-indigo-500 to-blue-600',
    bgColor: 'from-indigo-50 to-blue-50',
    borderColor: 'border-indigo-200',
    features: ['Project proposal', 'Research methodology', 'Conference tracking', 'Publication status'],
    timeline: 'Full semester'
  }
}
const getChoicesForSemester = (semesterNumber) => {
  const sem = parseInt(semesterNumber) || 0
  if (sem < 8) return []
  return ['8th_internship', '8th_project']
}

const SemesterChoice = () => {
  const navigate = useNavigate()
  const { execute } = useApi()
  const [selectedChoice, setSelectedChoice] = useState('')
  const [dashboardData, setDashboardData] = useState(null)
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      setPageLoading(true)
      const response = await execute(() => studentService.getDashboard())
      if (response.success) setDashboardData(response.data)
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setPageLoading(false)
    }
  }

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your options...</p>
        </div>
      </div>
    )
  }

  // Redirect if active submission exists
  if (dashboardData?.hasSubmission && dashboardData?.currentStep !== 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 text-center">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <TrendingUp className="h-10 w-10 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Active Submission In Progress</h2>
            <p className="text-gray-600 mb-8">
              You have an active {dashboardData.semesterType?.replace(/_/g, ' ')} submission.
              Please complete it before registering for a new semester.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8 text-left space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-semibold text-gray-700">Current Semester:</span>
                <span className="text-sm text-gray-900">{dashboardData.semesterType?.replace(/_/g, ' ').toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-semibold text-gray-700">Status:</span>
                <span className="text-sm text-gray-900">{dashboardData.currentStep?.replace(/_/g, ' ')}</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/student/progress')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center"
            >
              View Current Progress <ArrowRight className="h-5 w-5 ml-2" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  const student = dashboardData?.student
  const completedSubmissions = dashboardData?.completedSubmissions || []
  const backendAvailable = dashboardData?.availableSemesters || []
  const semesterBased = getChoicesForSemester(student?.semester)
  const finalChoices = backendAvailable.length > 0 ? backendAvailable : semesterBased

  // ── KEY FIX: always strip out already-completed semester types on the frontend
  //    as a safety net, regardless of what backend or semester-based logic returns ──
  const completedTypes = new Set(completedSubmissions.map(s => s.semesterType))
  const visibleOptions = finalChoices
    .filter(id => !completedTypes.has(id))
    .map(id => ALL_OPTIONS[id])
    .filter(Boolean)

  // All semesters completed: redirect to dashboard where the celebration lives
  if (completedSubmissions.length > 0 && visibleOptions.length === 0) {
    navigate('/student/dashboard', { replace: true })
    return null
  }

  // always navigate to /student/registration with semesterType in state
  const handleProceed = () => {
    if (!selectedChoice) return
    navigate('/student/registration', { state: { semesterType: selectedChoice } })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            {completedSubmissions.length > 0 ? 'Choose Your Next Semester' : 'Choose Your Academic Path'}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {completedSubmissions.length > 0
              ? `You've completed ${completedSubmissions.length} semester${completedSubmissions.length > 1 ? 's' : ''}. Select your next step.`
              : 'Select the internship type that matches your current semester.'
            }
          </p>
          {student?.semester && (
            <div className="mt-4 inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold">
              <Clock className="h-4 w-4 mr-2" />
              Your Semester: {student.semester}
            </div>
          )}
        </div>

        {/* Completed strip */}
        {completedSubmissions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-8">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center">
              <Award className="h-4 w-4 text-green-500 mr-2" />Completed
            </h3>
            <div className="flex flex-wrap gap-3">
              {completedSubmissions.map((sub, i) => (
                <div key={i} className="inline-flex items-center bg-green-50 text-green-700 px-4 py-2 rounded-lg border border-green-200 text-sm font-medium">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {sub.semesterType.replace(/_/g, ' ').toUpperCase()}
                </div>
              ))}
            </div>
          </div>
        )}

        {visibleOptions.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8 text-center">
            <BookOpen className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Available Options</h3>
            <p className="text-gray-600">Please contact your administrator if you believe this is an error.</p>
          </div>
        )}

        {visibleOptions.length > 0 && (
          <>
            <div className={`grid gap-6 mb-10 ${
              visibleOptions.length === 1 ? 'grid-cols-1 max-w-md mx-auto' :
              visibleOptions.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
              'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            }`}>
              {visibleOptions.map((option) => {
                const Icon = option.icon
                const isSelected = selectedChoice === option.id
                return (
                  <div
                    key={option.id}
                    onClick={() => setSelectedChoice(option.id)}
                    className={`cursor-pointer rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
                      isSelected
                        ? `${option.borderColor} shadow-xl scale-[1.02]`
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-lg bg-white'
                    }`}
                  >
                    <div className={`bg-gradient-to-r ${option.color} p-6 text-white`}>
                      <div className="flex items-center justify-between">
                        <div className="bg-white/20 p-3 rounded-xl">
                          <Icon className="h-7 w-7 text-white" />
                        </div>
                        {isSelected && (
                          <div className="bg-white/30 rounded-full p-1">
                            <CheckCircle className="h-6 w-6 text-white" />
                          </div>
                        )}
                      </div>
                      <h3 className="text-xl font-bold mt-4">{option.title}</h3>
                      <p className="text-white/80 text-sm mt-1">{option.description}</p>
                    </div>
                    <div className={`p-6 ${isSelected ? `bg-gradient-to-br ${option.bgColor}` : 'bg-white'}`}>
                      <div className="flex items-center text-sm text-gray-600 mb-4">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="font-medium">{option.timeline}</span>
                      </div>
                      <ul className="space-y-2">
                        {option.features.map((f, i) => (
                          <li key={i} className="flex items-start text-sm text-gray-600">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />{f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )
              })}
            </div>

            {selectedChoice && (
              <div className="text-center">
                <button
                  onClick={handleProceed}
                  className="inline-flex items-center px-12 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-lg font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Continue with {ALL_OPTIONS[selectedChoice]?.title}
                  <ArrowRight className="h-6 w-6 ml-3" />
                </button>
                <p className="text-sm text-gray-500 mt-3">You can review your choice before final submission</p>
              </div>
            )}

            <div className="mt-10 bg-amber-50 border border-amber-200 rounded-2xl p-6">
              <div className="flex items-start">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0 mr-4">
                  <BookOpen className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-amber-900 mb-2">Guidelines</h4>
                  <ul className="text-amber-800 text-sm space-y-1">
                    <li>• Only options for your current semester are shown</li>
                    <li>• Complete each semester before moving to the next</li>
                    <li>• All submissions require mentor verification</li>
                    <li>• Once submitted, you cannot change your choice</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default SemesterChoice