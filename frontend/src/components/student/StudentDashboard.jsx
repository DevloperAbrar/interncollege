import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApi } from '../../hooks/useApi'
import { studentService } from '../../services/studentService'
import { formatDateTime, formatDate } from '../../utils/helpers'
import { StatusBadge } from '../common/ProgressIndicator'
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Building,
  User,
  ArrowRight,
  Plus,
  BookOpen,
  TrendingUp,
  Award,
  Code,
  Users,
  GraduationCap,
  Star,
  Sparkles
} from 'lucide-react'

// ─── Completion Celebration Component ────────────────────────────────────────
const CompletionCelebration = ({ completedSubmissions }) => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  const semLabels = {
    any_internship: 'Any Internship',
    '6th_internship': '6th Sem Internship',
    '7th_internship': '7th Sem Internship',
    '8th_internship': '8th Sem Internship',
    '8th_project': '8th Sem Project'
  }

  const confettiColors = [
    '#534AB7', '#1D9E75', '#D85A30', '#378ADD',
    '#BA7517', '#993556', '#639922', '#E24B4A',
    '#7F77DD', '#5DCAA5', '#F0997B', '#85B7EB'
  ]

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Confetti pieces */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        {confettiColors.map((color, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${(i * 7.3 + 5) % 95}%`,
              top: '-10px',
              width: i % 3 === 0 ? '10px' : '7px',
              height: i % 3 === 0 ? '10px' : '7px',
              background: color,
              borderRadius: i % 2 === 0 ? '50%' : '2px',
              animation: `confettiFall ${2.5 + (i % 4) * 0.6}s linear ${(i * 0.25) % 3}s infinite`,
              opacity: 0
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg);   opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(500px) rotate(720deg); opacity: 0; }
        }
        @keyframes celebFloat {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50%       { transform: translateY(-14px) rotate(2deg); }
        }
        @keyframes celebPop {
          0%   { transform: scale(0.4); opacity: 0; }
          70%  { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes celebSlideUp {
          from { transform: translateY(28px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes celebShimmer {
          0%, 100% { opacity: 0.7; }
          50%       { opacity: 1;   }
        }
        @keyframes celebSpin {
          from { transform: rotate(0deg);   }
          to   { transform: rotate(360deg); }
        }
        @keyframes celebPulse {
          0%, 100% { transform: scale(1);    }
          50%       { transform: scale(1.05); }
        }
        @keyframes starPop {
          0%   { transform: scale(0) rotate(-30deg); opacity: 0; }
          60%  { transform: scale(1.25) rotate(5deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg);   opacity: 1; }
        }
      `}</style>

      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '2.5rem 1.5rem 2rem', textAlign: 'center'
      }}>

        {/* Stars row */}
        <div style={{
          display: 'flex', gap: '8px', justifyContent: 'center',
          marginBottom: '1rem',
          opacity: visible ? 1 : 0,
          animation: visible ? 'celebSlideUp 0.5s ease-out 0.1s both' : 'none'
        }}>
          {['#534AB7', '#1D9E75', '#D85A30', '#378ADD', '#BA7517'].map((c, i) => (
            <svg key={i} width="18" height="18" viewBox="0 0 20 20" style={{
              animation: visible ? `starPop 0.4s ease-out ${0.1 + i * 0.08}s both` : 'none',
              opacity: 0
            }}>
              <path d="M10 2l2.2 5h5.3l-4.3 3.1 1.7 5.2L10 12.2l-4.9 3.1 1.7-5.2L2.5 7h5.3z" fill={c} />
            </svg>
          ))}
        </div>

        {/* Trophy */}
        <div style={{
          fontSize: '72px', lineHeight: 1, marginBottom: '1rem',
          animation: visible ? 'celebPop 0.6s ease-out 0.2s both, celebFloat 3.5s ease-in-out 1s infinite' : 'none',
          opacity: 0,
          display: 'block'
        }}>
          🏆
        </div>

        {/* College badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '7px',
          background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
          color: '#4338CA',
          border: '1px solid #C7D2FE',
          borderRadius: '999px',
          padding: '6px 18px',
          fontSize: '13px', fontWeight: 600,
          marginBottom: '1.25rem',
          animation: visible ? 'celebSlideUp 0.5s ease-out 0.35s both' : 'none',
          opacity: 0
        }}>
          <GraduationCap size={15} />
          MITS-DU Gwalior
        </div>

        {/* Main title */}
        <h2 style={{
          fontSize: '26px', fontWeight: 700, color: '#111827',
          marginBottom: '0.5rem', lineHeight: 1.3,
          animation: visible ? 'celebSlideUp 0.5s ease-out 0.45s both' : 'none',
          opacity: 0
        }}>
          Your journey at MITS-DU is complete! 🎉
        </h2>

        {/* Subtitle */}
        <p style={{
          fontSize: '14px', color: '#6B7280', maxWidth: '420px',
          lineHeight: 1.7, marginBottom: '1.75rem',
          animation: visible ? 'celebSlideUp 0.5s ease-out 0.55s both' : 'none',
          opacity: 0
        }}>
          Every late night, every report submitted, every challenge overcome — it all led here.
          You've built <strong style={{ color: '#374151' }}>real-world skills</strong> that will
          carry you far. <strong style={{ color: '#374151' }}>Go make MITS-DU proud!</strong>
        </p>

        {/* Stats row */}
        <div style={{
          display: 'flex', gap: '12px', flexWrap: 'wrap',
          justifyContent: 'center', marginBottom: '1.5rem',
          animation: visible ? 'celebSlideUp 0.5s ease-out 0.65s both' : 'none',
          opacity: 0
        }}>
          {[
            { val: completedSubmissions.length, lbl: 'Semesters done' },
            { val: '100%', lbl: 'Completion rate' },
            { val: '∞', lbl: 'Bright future' }
          ].map((s, i) => (
            <div key={i} style={{
              background: '#F9FAFB', border: '1px solid #E5E7EB',
              borderRadius: '14px', padding: '12px 20px',
              minWidth: '95px', textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#111827' }}>{s.val}</div>
              <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '3px' }}>{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* Completed semester pills */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '8px',
          justifyContent: 'center', maxWidth: '460px',
          animation: visible ? 'celebSlideUp 0.5s ease-out 0.75s both' : 'none',
          opacity: 0
        }}>
          {completedSubmissions.map((sub, i) => (
            <span key={sub._id || i} style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: '#F0FDF4', color: '#15803D',
              border: '1px solid #BBF7D0',
              borderRadius: '999px', padding: '6px 14px',
              fontSize: '13px', fontWeight: 500,
              animation: visible ? `starPop 0.4s ease-out ${0.8 + i * 0.1}s both` : 'none',
              opacity: 0
            }}>
              <CheckCircle size={13} />
              {semLabels[sub.semesterType] || sub.semesterType.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Dashboard Component ─────────────────────────────────────────────────
const StudentDashboard = () => {
  const { execute, loading } = useApi()
  const [dashboardData, setDashboardData] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const response = await execute(() => studentService.getDashboard())
      if (response.success) {
        setDashboardData(response.data)
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    }
  }

  const getSemesterIcon = (semesterType) => {
    const iconMap = {
      '8th_internship': GraduationCap,
      '7th_internship': Building,
      '6th_internship': Users,
      'any_internship': Calendar,
      '8th_project': Code
    }
    return iconMap[semesterType] || Building
  }

  const getStepDescription = (currentStep, semesterType) => {
    const stepMap = {
      'registration_pending': 'Registration under review',
      'registration_rejected': 'Registration needs revision',
      'registration_approved': semesterType === '6th_internship' || semesterType === 'any_internship'
        ? 'Ready for final report'
        : semesterType === '8th_project'
          ? 'Ready for MPR submissions'
          : 'Ready for MPR submissions',
      'mpr_submissions': 'MPR submissions in progress',
      'final_report_pending': 'Final report under review',
      'final_report_rejected': 'Final report needs revision',
      'completed': 'Successfully completed!'
    }
    return stepMap[currentStep] || 'In progress'
  }

  const getNextAction = (currentStep, semesterType, submission) => {
    switch (currentStep) {
      case 'registration_rejected':
        return {
          text: 'Revise Registration',
          link: '/student/registration',
          color: 'orange',
          state: { semesterType }
        }

      case 'registration_approved':
        if (semesterType === '6th_internship' || semesterType === 'any_internship') {
          return { text: 'Submit Final Report', link: '/student/final-report', color: 'green' }
        } else if (semesterType === '7th_internship' || semesterType === '8th_internship' || semesterType === '8th_project') {
          return { text: 'Submit MPR Documents', link: '/student/mpr', color: 'blue' }
        }
        break

      case 'mpr_submissions': {
        const mprData = submission?.mprSubmissions || {}
        const allFourApproved = ['mpr1', 'mpr2', 'mpr3', 'midSem1'].every(
          t => mprData[t]?.status === 'approved'
        )
        if (allFourApproved) {
          return { text: 'Submit Final Report', link: '/student/final-report', color: 'green' }
        }
        return { text: 'Continue MPR Submissions', link: '/student/mpr', color: 'purple' }
      }

      case 'final_report_pending':
        return { text: 'View Final Report Status', link: '/student/progress', color: 'blue' }

      case 'final_report_rejected':
        return { text: 'Revise Final Report', link: '/student/final-report', color: 'orange' }

      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse">
                <div className="h-32 bg-gradient-to-r from-gray-200 to-gray-100 rounded-xl"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const {
    student,
    submission,
    hasSubmission,
    semesterType,
    currentStep,
    submissionStatus,
    completedSubmissions = [],
    availableSemesters = []
  } = dashboardData || {}

  // ── Determine if all semesters are done ──────────────────────────────────
  const allDone = !hasSubmission && completedSubmissions.length > 0 && availableSemesters.length === 0

  // ── Mentor gate: block Registration until a mentor has added this student ──
  const hasMentor = !!student?.assignedMentor?.name

  const handleRegistrationClick = (e) => {
    e.preventDefault()
    if (!hasMentor) {
      alert('No mentor has added you yet. Once your mentor adds you, you will be able to submit.')
      return
    }
    navigate('/student/choice')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">

        {/* Welcome Header */}
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-4 shadow-lg">
            <User className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome back, <span className="text-blue-600">{student?.name}</span>!
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Track your academic journey and monitor your progress with our comprehensive submission system
          </p>
        </div>

        {/* Quick Stats Overview */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <User className="h-6 w-6 text-orange-600" />
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-gray-900 block">
                {hasMentor ? 'Assigned' : 'Pending'}
              </span>
              {hasMentor && (
                <span className="text-xs text-gray-500 font-medium">
                  {student.assignedMentor.name}
                </span>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-500 font-medium">Mentor Status</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {student?.branch?.name || student?.branch || '—'}
              </span>
            </div>
            <p className="text-sm text-gray-500 font-medium">Academic Branch</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Award className="h-6 w-6 text-green-600" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                {student?.enrollmentNo || '—'}
              </span>
            </div>
            <p className="text-sm text-gray-500 font-medium">Enrollment No.</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <span className="text-lg font-bold text-gray-900">
                {hasSubmission ? (
                  semesterType?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                ) : allDone ? 'All Done!' : 'Not Started'}
              </span>
            </div>
            <p className="text-sm text-gray-500 font-medium">Current Track</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <User className="h-6 w-6 text-orange-600" />
              </div>
              <span className="text-lg font-bold text-gray-900">
                {hasMentor ? 'Assigned' : 'Pending'}
              </span>
            </div>
            <p className="text-sm text-gray-500 font-medium">Mentor Status</p>
          </div>
        </div>

        {/* Completed Submissions Timeline */}
        {completedSubmissions && completedSubmissions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <Award className="h-6 w-6 text-green-500 mr-2" />
                Your Academic Journey
              </h3>
              <span className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
                {completedSubmissions.length} Semester{completedSubmissions.length > 1 ? 's' : ''} Completed
              </span>
            </div>

            <div className="space-y-4">
              {completedSubmissions.map((completedSub, index) => (
                <div key={completedSub._id} className="relative">
                  {index < completedSubmissions.length - 1 && (
                    <div className="absolute left-6 top-14 bottom-0 w-0.5 bg-green-200"></div>
                  )}
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex-1 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-bold text-gray-900 text-lg">
                            {completedSub.semesterType.replace(/_/g, ' ').toUpperCase()}
                          </h4>
                          {completedSub.semesterType.includes('project') ? (
                            <p className="text-gray-600 text-sm">
                              {completedSub.registrationData?.projectTitle || 'Project Completed'}
                            </p>
                          ) : (
                            <p className="text-gray-600 text-sm">
                              {completedSub.registrationData?.companyName || 'Internship Completed'}
                            </p>
                          )}
                        </div>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                          Completed
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                        <div>
                          <span className="text-gray-500 block">Submitted</span>
                          <span className="text-gray-900 font-medium">
                            {new Date(completedSub.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Completed</span>
                          <span className="text-gray-900 font-medium">
                            {new Date(completedSub.completedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Semester CTA — only when active and next semesters available */}
        {completedSubmissions && completedSubmissions.length > 0 && !hasSubmission && availableSemesters && availableSemesters.length > 0 && (
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg p-8 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-3">
                  <TrendingUp className="h-8 w-8 mr-3" />
                  <h3 className="text-2xl font-bold">Ready for Your Next Challenge?</h3>
                </div>
                <p className="text-blue-100 text-lg mb-6">
                  You've successfully completed {completedSubmissions.length} semester{completedSubmissions.length > 1 ? 's' : ''}!
                  Continue your academic journey by registering for the next semester.
                </p>
                <div className="flex flex-wrap gap-3 mb-6">
                  {availableSemesters.map((sem) => (
                    <span key={sem} className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-medium">
                      {sem.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleRegistrationClick}
                  className="inline-flex items-center bg-white text-blue-600 hover:bg-blue-50 font-semibold py-3 px-8 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Register for Next Semester
                  <ArrowRight className="h-5 w-5 ml-2" />
                </button>
              </div>
              <div className="hidden lg:block">
                <div className="w-32 h-32 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <GraduationCap className="h-16 w-16 text-white" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="xl:col-span-2 space-y-6">

            {/* Submission Status Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6">
                <div className="flex items-center justify-between text-white">
                  <div>
                    <h3 className="text-xl font-bold mb-1">Current Progress</h3>
                    <p className="text-blue-100">Your academic submission status</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-200" />
                </div>
              </div>

              <div className="p-6">
                {/* ── ALL DONE: show celebration ── */}
                {allDone ? (
                  <CompletionCelebration completedSubmissions={completedSubmissions} />
                ) : hasSubmission ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <span className="text-sm text-gray-500 block mb-1">Current Step</span>
                        <div className="flex items-center">
                          {(() => {
                            const Icon = getSemesterIcon(semesterType)
                            return <Icon className="h-5 w-5 text-blue-600 mr-2" />
                          })()}
                          <span className="text-lg font-semibold text-gray-900">
                            {getStepDescription(currentStep, semesterType)}
                          </span>
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <span className="text-sm text-gray-500 block mb-1">Overall Status</span>
                        <StatusBadge status={submissionStatus} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <span className="text-sm text-gray-500 block mb-1">Started On</span>
                        <span className="text-sm font-medium text-gray-900">{formatDateTime(submission?.createdAt)}</span>
                      </div>
                      {submission?.updatedAt && submission?.updatedAt !== submission?.createdAt && (
                        <div className="p-4 bg-gray-50 rounded-xl">
                          <span className="text-sm text-gray-500 block mb-1">Last Updated</span>
                          <span className="text-sm font-medium text-gray-900">{formatDateTime(submission.updatedAt)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <Link
                        to="/student/progress"
                        className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3 px-6 rounded-xl font-medium flex items-center justify-center transition-all duration-300 shadow-md hover:shadow-lg"
                      >
                        View Detailed Progress
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </Link>

                      {(() => {
                        const nextAction = getNextAction(currentStep, semesterType, submission)
                        if (nextAction) {
                          return (
                            <Link
                              to={nextAction.link}
                              state={nextAction.state}
                              className={`flex-1 bg-gradient-to-r ${nextAction.color === 'orange' ? 'from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700' :
                                nextAction.color === 'green' ? 'from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700' :
                                  nextAction.color === 'purple' ? 'from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700' :
                                    'from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
                                } text-white py-3 px-6 rounded-xl font-medium flex items-center justify-center transition-all duration-300 shadow-md hover:shadow-lg`}
                            >
                              {nextAction.text}
                              <ArrowRight className="h-5 w-5 ml-2" />
                            </Link>
                          )
                        }
                        return null
                      })()}
                    </div>
                  </div>
                ) : (
                  /* No submission yet */
                  <div className="text-center py-8">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="h-10 w-10 text-gray-400" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Ready to Begin?</h4>
                    <p className="text-gray-500 mb-6">Choose your academic path and start your submission journey</p>
                    <button
                      type="button"
                      onClick={handleRegistrationClick}
                      className="inline-flex items-center bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 px-8 rounded-xl font-medium transition-all duration-300 shadow-md hover:shadow-lg"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Registration
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Workflow Card — only when active submission */}
            {hasSubmission && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6">
                  <div className="flex items-center justify-between text-white">
                    <div>
                      <h3 className="text-xl font-bold mb-1">Submission Workflow</h3>
                      <p className="text-purple-100">Track your progress through each step</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-200" />
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-4">
                    <div className="relative">
                      {/* Registration Step */}
                      <div className="flex items-center mb-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${currentStep === 'registration_pending' || currentStep === 'registration_rejected'
                          ? 'bg-yellow-100 text-yellow-600'
                          : 'bg-green-100 text-green-600'
                          }`}>
                          {currentStep === 'registration_pending' ? '⏳' : currentStep === 'registration_rejected' ? '❌' : '✅'}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">Registration</h4>
                          <p className="text-sm text-gray-600">Submit initial details and documents</p>
                        </div>
                      </div>

                      {/* MPR Step — 7th, 8th internship, 8th project */}
                      {(semesterType === '7th_internship' || semesterType === '8th_internship' || semesterType === '8th_project') && (
                        <div className="flex items-center mb-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${currentStep === 'mpr_submissions'
                            ? 'bg-yellow-100 text-yellow-600'
                            : currentStep === 'final_report_pending' || currentStep === 'final_report_rejected' || currentStep === 'completed'
                              ? 'bg-green-100 text-green-600'
                              : 'bg-gray-100 text-gray-400'
                            }`}>
                            {currentStep === 'mpr_submissions' ? '⏳' :
                              (currentStep === 'final_report_pending' || currentStep === 'final_report_rejected' || currentStep === 'completed') ? '✅' : '⭕'}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">MPR Submissions</h4>
                            <p className="text-sm text-gray-600">Submit monthly progress reports and evaluations</p>
                          </div>
                        </div>
                      )}

                      {/* Final Report Step */}
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${currentStep === 'final_report_pending' || currentStep === 'final_report_rejected'
                          ? 'bg-yellow-100 text-yellow-600'
                          : currentStep === 'completed'
                            ? 'bg-green-100 text-green-600'
                            : 'bg-gray-100 text-gray-400'
                          }`}>
                          {currentStep === 'final_report_pending' ? '⏳' :
                            currentStep === 'final_report_rejected' ? '❌' :
                              currentStep === 'completed' ? '✅' : '⭕'}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">Final Report</h4>
                          <p className="text-sm text-gray-600">Complete final submission and documentation</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column — Sidebar */}
          <div className="space-y-6">
            {/* Student Info Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-500" />
                Your Profile
              </h3>
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <span className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Full Name</span>
                  <p className="text-gray-900 font-medium">{student?.name}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <span className="text-xs text-green-600 font-semibold uppercase tracking-wide">Email Address</span>
                  <p className="text-gray-900 font-medium break-all">{student?.email}</p>
                </div>
                {student?.assignedMentor && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Assigned Mentor</h4>
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <p className="font-medium text-gray-900">{student.assignedMentor.name}</p>
                      <p className="text-sm text-gray-600">{student.assignedMentor.email}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Quick Actions</h3>
              <div className="space-y-3">
                {allDone ? (
                  /* All done — no registration option, just view journey */
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-500 rounded-lg mr-4">
                        <Award className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">Journey Complete</p>
                        <p className="text-sm text-green-700">{completedSubmissions.length} semester{completedSubmissions.length > 1 ? 's' : ''} finished</p>
                      </div>
                    </div>
                  </div>
                ) : !hasSubmission ? (
                  <button
                    type="button"
                    onClick={handleRegistrationClick}
                    className="group w-full text-left p-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-xl transition-all duration-300 border border-blue-100 hover:border-blue-200 block"
                  >
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-500 rounded-lg mr-4 group-hover:bg-blue-600 transition-colors">
                        <Plus className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">Start Your Journey</p>
                        <p className="text-sm text-gray-600">Choose your academic path</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                    </div>
                  </button>
                ) : (
                  <>
                    <Link
                      to="/student/progress"
                      className="group w-full text-left p-4 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 rounded-xl transition-all duration-300 border border-green-100 hover:border-green-200 block"
                    >
                      <div className="flex items-center">
                        <div className="p-2 bg-green-500 rounded-lg mr-4 group-hover:bg-green-600 transition-colors">
                          <CheckCircle className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">View Progress</p>
                          <p className="text-sm text-gray-600">Check detailed submission status</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                      </div>
                    </Link>

                    {(() => {
                      const nextAction = getNextAction(currentStep, semesterType, submission)
                      if (nextAction) {
                        return (
                          <Link
                            to={nextAction.link}
                            state={nextAction.state}
                            className={`group w-full text-left p-4 bg-gradient-to-r ${nextAction.color === 'orange' ? 'from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 border-orange-100 hover:border-orange-200' :
                              nextAction.color === 'green' ? 'from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border-green-100 hover:border-green-200' :
                                nextAction.color === 'purple' ? 'from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border-purple-100 hover:border-purple-200' :
                                  'from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-blue-100 hover:border-blue-200'
                              } rounded-xl transition-all duration-300 border block`}
                          >
                            <div className="flex items-center">
                              <div className={`p-2 ${nextAction.color === 'orange' ? 'bg-orange-500 group-hover:bg-orange-600' :
                                nextAction.color === 'green' ? 'bg-green-500 group-hover:bg-green-600' :
                                  nextAction.color === 'purple' ? 'bg-purple-500 group-hover:bg-purple-600' :
                                    'bg-blue-500 group-hover:bg-blue-600'
                                } rounded-lg mr-4 transition-colors`}>
                                <Calendar className="h-5 w-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900">{nextAction.text}</p>
                                <p className="text-sm text-gray-600">Continue your submission</p>
                              </div>
                              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                            </div>
                          </Link>
                        )
                      }
                      return null
                    })()}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Current Submission Details — only when active */}
        {hasSubmission && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-6">
              <h3 className="text-xl font-bold text-white mb-1">Current Submission Details</h3>
              <p className="text-emerald-100">Overview of your {semesterType?.includes('project') ? 'project' : 'internship'} submission</p>
            </div>
            <div className="p-6">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-2xl">
                {semesterType?.includes('project') ? (
                  <div className="flex items-start">
                    <Code className="h-6 w-6 text-gray-400 mr-3 mt-1" />
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg mb-1">
                        {submission?.registrationData?.projectTitle || 'Project Submission'}
                      </h4>
                      <p className="text-gray-600">
                        {submission?.registrationData?.projectType?.replace('_', ' & ').replace(/\b\w/g, l => l.toUpperCase()) || 'Research Project'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <Building className="h-6 w-6 text-gray-400 mr-3 mt-1 flex-shrink-0" />
                        <div>
                          <h4 className="font-bold text-gray-900 text-lg mb-1">
                            {submission?.registrationData?.companyName || 'Company Name'}
                          </h4>
                          <p className="text-gray-700 font-medium">
                            {submission?.registrationData?.internshipTitle || 'Internship Position'}
                          </p>
                          <p className="text-gray-500 text-sm">
                            {submission?.registrationData?.companyType?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} •{' '}
                            {submission?.registrationData?.internshipType?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-gray-600">
                          {submission?.registrationData?.startDate && submission?.registrationData?.endDate
                            ? `${formatDate(submission.registrationData.startDate)} - ${formatDate(submission.registrationData.endDate)}`
                            : 'Duration not specified'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-white p-3 rounded-lg">
                          <span className="text-gray-500 block">Duration</span>
                          <span className="font-semibold text-gray-900">{submission?.registrationData?.duration || 0} months</span>
                        </div>
                        <div className="bg-white p-3 rounded-lg">
                          <span className="text-gray-500 block">Stipend</span>
                          <span className="font-semibold text-gray-900">
                            {submission?.registrationData?.hasStipend
                              ? `₹${submission.registrationData.stipendAmount || 0}`
                              : 'Unpaid'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {(submission?.registrationReview?.feedback || submission?.finalReportReview?.feedback) && (
                <div className="mt-6 space-y-4">
                  {submission?.registrationReview?.feedback && (
                    <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                      <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                        <User className="h-5 w-5 mr-2 text-blue-500" />
                        Registration Feedback
                      </h4>
                      <p className="text-gray-700 leading-relaxed">{submission.registrationReview.feedback}</p>
                    </div>
                  )}
                  {submission?.finalReportReview?.feedback && (
                    <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-100">
                      <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                        <User className="h-5 w-5 mr-2 text-green-500" />
                        Final Report Feedback
                      </h4>
                      <p className="text-gray-700 leading-relaxed">{submission.finalReportReview.feedback}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* What's Next */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">What's Next?</h3>
          <div className="space-y-4">
            {allDone && (
              <div className="flex items-center p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                <GraduationCap className="h-8 w-8 text-indigo-500 mr-4 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">Congratulations, Graduate! 🎓</p>
                  <p className="text-sm text-gray-600">You've completed all internship requirements at MITS-DU Gwalior. Your bright future awaits!</p>
                </div>
              </div>
            )}
            {!hasSubmission && !allDone && (
              <div className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-4">1</div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Choose Your Academic Path</p>
                  <p className="text-sm text-gray-600">Select your semester type and submission track to get started</p>
                </div>
              </div>
            )}
            {hasSubmission && currentStep === 'registration_pending' && (
              <div className="flex items-center p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-100">
                <Clock className="h-8 w-8 text-yellow-500 mr-4 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">Under Review</p>
                  <p className="text-sm text-gray-600">Your registration is currently being reviewed by your assigned mentor</p>
                </div>
              </div>
            )}
            {hasSubmission && (currentStep === 'registration_rejected' || currentStep === 'final_report_rejected') && (
              <div className="flex items-center p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-100">
                <AlertCircle className="h-8 w-8 text-red-500 mr-4 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">Action Required</p>
                  <p className="text-sm text-gray-600">Please review the mentor feedback and resubmit with necessary changes</p>
                </div>
              </div>
            )}
            {hasSubmission && currentStep === 'completed' && (
              <div className="flex items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                <CheckCircle className="h-8 w-8 text-green-500 mr-4 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">Congratulations! 🎉</p>
                  <p className="text-sm text-gray-600">
                    Your {semesterType?.includes('project') ? 'project' : 'internship'} has been successfully completed and approved
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

export default StudentDashboard