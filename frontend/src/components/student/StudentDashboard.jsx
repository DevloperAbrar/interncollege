import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApi } from '../../hooks/useApi'
import { studentService } from '../../services/studentService'
import { formatDateTime, formatDate } from '../../utils/helpers'
import { cleanName, getGreeting, prettySemester } from '../../utils/studentUi'
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
  Trophy,
  UserCheck,
  Mail,
  Check,
  X,
  Circle,
  RefreshCw
} from 'lucide-react'

// ─── Style maps (full class names so Tailwind can see them) ───────────────────
const TINTS = {
  indigo: 'bg-indigo-50 text-indigo-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  violet: 'bg-violet-50 text-violet-600',
  sky: 'bg-sky-50 text-sky-600'
}

const NOTICE_TONES = {
  info: { box: 'border-indigo-100 bg-indigo-50/60', icon: 'bg-indigo-100 text-indigo-600' },
  warn: { box: 'border-amber-100 bg-amber-50/70', icon: 'bg-amber-100 text-amber-600' },
  success: { box: 'border-emerald-100 bg-emerald-50/70', icon: 'bg-emerald-100 text-emerald-600' },
  danger: { box: 'border-rose-100 bg-rose-50/70', icon: 'bg-rose-100 text-rose-600' }
}

const ACTION_BUTTON = {
  orange: 'bg-amber-500 hover:bg-amber-600',
  green: 'bg-emerald-600 hover:bg-emerald-700',
  purple: 'bg-violet-600 hover:bg-violet-700',
  blue: 'bg-indigo-600 hover:bg-indigo-700'
}

const ACTION_TILE = {
  orange: 'bg-amber-50 text-amber-600',
  green: 'bg-emerald-50 text-emerald-600',
  purple: 'bg-violet-50 text-violet-600',
  blue: 'bg-indigo-50 text-indigo-600'
}

const STEP_STYLE = {
  done: { circle: 'bg-emerald-500 text-white', chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200', label: 'Completed', Icon: Check },
  active: { circle: 'bg-amber-500 text-white st-pulse', chip: 'bg-amber-50 text-amber-700 ring-amber-200', label: 'In progress', Icon: Clock },
  rejected: { circle: 'bg-rose-500 text-white', chip: 'bg-rose-50 text-rose-700 ring-rose-200', label: 'Needs revision', Icon: X },
  todo: { circle: 'bg-slate-100 text-slate-400 ring-1 ring-slate-200', chip: 'bg-slate-50 text-slate-500 ring-slate-200', label: 'Upcoming', Icon: Circle }
}

// ─── Small helpers ────────────────────────────────────────────────────────────
const useCountUp = (target, duration = 900) => {
  const [value, setValue] = useState(0)

  useEffect(() => {
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce || !target) {
      setValue(target || 0)
      return undefined
    }
    let raf
    let start
    const tick = (now) => {
      if (start === undefined) start = now
      const p = Math.min((now - start) / duration, 1)
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return value
}

const resolveBranch = (branch) => {
  if (!branch) return '—'
  if (typeof branch === 'object') return branch.name || '—'
  if (/^[a-f0-9]{24}$/i.test(branch)) return '—' // raw id, nothing to show
  return branch
}

const Reveal = ({ delay = 0, className = '', children }) => (
  <div className={`st-fade-up ${className}`} style={{ '--d': `${delay}ms` }}>
    {children}
  </div>
)

const Card = ({ className = '', children }) => (
  <div className={`rounded-2xl border border-slate-200/80 bg-white shadow-sm ${className}`}>{children}</div>
)

const CardHeader = ({ icon: Icon, title, subtitle, tint = 'indigo' }) => (
  <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${TINTS[tint]}`}>
      <Icon className="h-5 w-5" />
    </span>
    <div className="min-w-0">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {subtitle && <p className="truncate text-sm text-slate-500">{subtitle}</p>}
    </div>
  </div>
)

const InfoTile = ({ label, children }) => (
  <div className="rounded-xl bg-slate-50 p-4">
    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
    <div className="mt-1.5 text-sm font-medium text-slate-900">{children}</div>
  </div>
)

const StatCard = ({ icon: Icon, tint, label, value, sub, delay }) => (
  <Reveal delay={delay} className="h-full">
    <div className="st-lift h-full rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
      <span className={`grid h-10 w-10 place-items-center rounded-xl ${TINTS[tint]}`}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 truncate text-base font-semibold text-slate-900 sm:text-lg" title={String(value)}>
        {value}
      </p>
      {sub && (
        <p className="mt-0.5 truncate text-xs text-slate-500" title={sub}>
          {sub}
        </p>
      )}
    </div>
  </Reveal>
)

// ─── Progress ring (hero) ─────────────────────────────────────────────────────
const ProgressRing = ({ percent, size = 112, stroke = 9 }) => {
  const [mounted, setMounted] = useState(false)
  const shown = useCountUp(percent)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - ((mounted ? percent : 0) / 100) * c

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" role="img" aria-label={`${percent}% complete`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="white"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <span className="text-2xl font-semibold leading-none">{shown}%</span>
        <span className="mt-1 text-[11px] text-indigo-100">complete</span>
      </div>
    </div>
  )
}

// ─── Workflow timeline ────────────────────────────────────────────────────────
const StepTimeline = ({ steps }) => (
  <ol className="px-5 py-6 sm:px-6">
    {steps.map((step, i) => {
      const s = STEP_STYLE[step.state]
      const Icon = s.Icon
      const isLast = i === steps.length - 1
      return (
        <li key={step.key} className="st-fade-up relative flex gap-4 pb-7 last:pb-0" style={{ '--d': `${i * 90}ms` }}>
          {!isLast && (
            <span className="absolute bottom-0 left-[17px] top-9 w-0.5 bg-slate-200">
              {step.state === 'done' && (
                <span className="st-grow block h-full w-full bg-emerald-400" style={{ '--d': `${i * 90 + 150}ms` }} />
              )}
            </span>
          )}
          <span className={`relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full ${s.circle}`}>
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0 pt-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-medium text-slate-900">{step.title}</h4>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${s.chip}`}>{s.label}</span>
            </div>
            <p className="mt-0.5 text-sm text-slate-500">{step.desc}</p>
          </div>
        </li>
      )
    })}
  </ol>
)

// ─── Completion celebration ───────────────────────────────────────────────────
const CompletionCelebration = ({ completedSubmissions }) => {
  const confetti = [
    '#6366f1', '#10b981', '#f97316', '#0ea5e9',
    '#eab308', '#ec4899', '#84cc16', '#ef4444',
    '#8b5cf6', '#14b8a6', '#fb923c', '#38bdf8'
  ]

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {confetti.map((color, i) => (
          <span
            key={color}
            className="absolute"
            style={{
              left: `${(i * 7.3 + 5) % 95}%`,
              top: -10,
              width: i % 3 === 0 ? 10 : 7,
              height: i % 3 === 0 ? 10 : 7,
              background: color,
              borderRadius: i % 2 === 0 ? '50%' : 2,
              opacity: 0,
              animation: `st-confetti ${2.5 + (i % 4) * 0.6}s linear ${(i * 0.25) % 3}s infinite`
            }}
          />
        ))}
      </div>

      <div className="relative flex flex-col items-center px-2 py-8 text-center sm:px-6">
        <div className="st-trophy grid h-20 w-20 place-items-center rounded-full bg-amber-100 text-amber-600 shadow-inner">
          <Trophy className="h-10 w-10" />
        </div>

        <span
          className="st-fade-up mt-5 inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-4 py-1.5 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200"
          style={{ '--d': '250ms' }}
        >
          <GraduationCap className="h-4 w-4" /> MITS-DU Gwalior
        </span>

        <h2 className="st-fade-up mt-4 text-xl font-semibold text-slate-900 sm:text-2xl" style={{ '--d': '350ms' }}>
          Your journey at MITS-DU is complete!
        </h2>
        <p className="st-fade-up mt-2 max-w-md text-sm leading-relaxed text-slate-500" style={{ '--d': '450ms' }}>
          Every late night, every report submitted, every challenge overcome led you here. You have built{' '}
          <strong className="text-slate-700">real-world skills</strong> that will carry you far.
        </p>

        <div className="st-fade-up mt-6 grid w-full max-w-sm grid-cols-3 gap-3" style={{ '--d': '550ms' }}>
          {[
            { val: completedSubmissions.length, lbl: 'Semesters' },
            { val: '100%', lbl: 'Completed' },
            { val: '∞', lbl: 'Future' }
          ].map((s) => (
            <div key={s.lbl} className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-3">
              <p className="text-xl font-semibold text-slate-900">{s.val}</p>
              <p className="mt-0.5 text-xs text-slate-500">{s.lbl}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {completedSubmissions.map((sub, i) => (
            <span
              key={sub._id || i}
              className="st-pop inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200"
              style={{ '--d': `${650 + i * 90}ms` }}
            >
              <CheckCircle className="h-3.5 w-3.5" />
              {prettySemester(sub.semesterType)}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Skeleton while loading ───────────────────────────────────────────────────
const DashboardSkeleton = () => (
  <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
    <div className="st-skeleton h-56 rounded-3xl sm:h-48" />
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="st-skeleton h-36 rounded-2xl" />
      ))}
    </div>
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="st-skeleton h-64 rounded-2xl" />
        <div className="st-skeleton h-72 rounded-2xl" />
      </div>
      <div className="space-y-6">
        <div className="st-skeleton h-56 rounded-2xl" />
        <div className="st-skeleton h-40 rounded-2xl" />
      </div>
    </div>
  </div>
)

// ─── Business logic helpers ───────────────────────────────────────────────────
const getStepDescription = (currentStep, semesterType, submission) => {
  const isMpr = ['7th_internship', '8th_internship', '8th_project'].includes(semesterType)
  const stepMap = {
    registration_pending: 'Registration under review',
    registration_rejected: 'Registration needs revision',
    registration_approved:
      semesterType === '6th_internship' || semesterType === 'any_internship'
        ? 'Ready for final report'
        : 'Ready for MPR submissions',
    mpr_submissions: 'MPR submissions in progress',
    final_report_pending: submission?.finalReport?.submittedAt
      ? 'Final report under review'
      : 'Placement record approved, final report pending',
    final_report_rejected: 'Final report needs revision',
    placement_pending: isMpr
      ? 'MPRs approved, placement record details pending'
      : 'Final report approved, placement record details pending',
    placement_submitted: 'Placement record details under review',
    placement_rejected: 'Placement record details need revision',
    completed: 'Successfully completed!'
  }
  return stepMap[currentStep] || 'In progress'
}

const getNextAction = (currentStep, semesterType, submission) => {
  switch (currentStep) {
    case 'registration_rejected':
      return { text: 'Revise Registration', link: '/student/registration', color: 'orange', state: { semesterType } }

    case 'registration_approved':
      if (semesterType === '6th_internship' || semesterType === 'any_internship') {
        return { text: 'Submit Final Report', link: '/student/final-report', color: 'green' }
      } else if (semesterType === '7th_internship' || semesterType === '8th_internship' || semesterType === '8th_project') {
        return { text: 'Submit MPR Documents', link: '/student/mpr', color: 'blue' }
      }
      break

    case 'mpr_submissions': {
      const mprData = submission?.mprSubmissions || {}
      const allFourApproved = ['mpr1', 'mpr2', 'mpr3', 'midSem1'].every((t) => mprData[t]?.status === 'approved')
      if (allFourApproved) {
        return { text: 'Fill Placement Record Details', link: '/student/placement', color: 'green' }
      }
      return { text: 'Continue MPR Submissions', link: '/student/mpr', color: 'purple' }
    }

    case 'final_report_pending':
      return submission?.finalReport?.submittedAt
        ? { text: 'View Final Report Status', link: '/student/progress', color: 'blue' }
        : { text: 'Submit Final Report', link: '/student/final-report', color: 'green' }

    case 'final_report_rejected':
      return { text: 'Revise Final Report', link: '/student/final-report', color: 'orange' }

    case 'placement_pending':
      return { text: 'Fill Placement Record Details', link: '/student/placement', color: 'green' }

    case 'placement_submitted':
      return { text: 'View Placement Record Details', link: '/student/placement', color: 'blue' }

    case 'placement_rejected':
      return { text: 'Revise Placement Record Details', link: '/student/placement', color: 'orange' }

    default:
      return null
  }
}

const buildSteps = ({ currentStep, isMprFlow, inPlacementPhase }) => {
  const afterMpr = [
    'final_report_pending',
    'final_report_rejected',
    'placement_pending',
    'placement_submitted',
    'placement_rejected',
    'completed'
  ].includes(currentStep)

  const registrationState =
    currentStep === 'registration_pending' ? 'active' : currentStep === 'registration_rejected' ? 'rejected' : 'done'

  const mprState = currentStep === 'mpr_submissions' ? 'active' : afterMpr ? 'done' : 'todo'

  const placementState =
    currentStep === 'placement_rejected'
      ? 'rejected'
      : ['placement_pending', 'placement_submitted'].includes(currentStep)
        ? 'active'
        : isMprFlow
          ? ['final_report_pending', 'final_report_rejected', 'completed'].includes(currentStep)
            ? 'done'
            : 'todo'
          : currentStep === 'completed'
            ? 'done'
            : 'todo'

  const finalState =
    currentStep === 'final_report_rejected'
      ? 'rejected'
      : currentStep === 'final_report_pending'
        ? 'active'
        : isMprFlow
          ? currentStep === 'completed'
            ? 'done'
            : 'todo'
          : inPlacementPhase || currentStep === 'completed'
            ? 'done'
            : 'todo'

  const registration = { key: 'registration', title: 'Registration', desc: 'Submit initial details and documents', state: registrationState }
  const mpr = { key: 'mpr', title: 'MPR Submissions', desc: 'Submit monthly progress reports and evaluations', state: mprState }
  const placement = {
    key: 'placement',
    title: 'Placement Record Details',
    desc: 'Placement, future plan and offer letter, verified by your mentor',
    state: placementState
  }
  const finalReport = { key: 'final', title: 'Final Report', desc: 'Complete final submission and documentation', state: finalState }

  return isMprFlow ? [registration, mpr, placement, finalReport] : [registration, finalReport, placement]
}

const getNotice = ({ currentStep, hasSubmission, allDone, isMprFlow, submission, semesterType }) => {
  if (allDone) {
    return {
      tone: 'success',
      Icon: GraduationCap,
      title: 'Congratulations, Graduate!',
      text: "You've completed all internship requirements at MITS-DU Gwalior. Your bright future awaits!"
    }
  }
  if (!hasSubmission) {
    return {
      tone: 'info',
      Icon: BookOpen,
      title: 'Choose your academic path',
      text: 'Select your semester type and submission track to get started.'
    }
  }

  const kind = semesterType?.includes('project') ? 'project' : 'internship'

  switch (currentStep) {
    case 'registration_pending':
      return { tone: 'warn', Icon: Clock, title: 'Under review', text: 'Your registration is currently being reviewed by your assigned mentor.' }
    case 'placement_pending':
      return {
        tone: 'success',
        Icon: CheckCircle,
        title: isMprFlow ? 'All MPR documents approved' : 'Final report approved',
        text: isMprFlow
          ? 'Next step: fill in your placement record details and upload your offer letter. The final report unlocks after your mentor approves them.'
          : 'One last step: fill in your placement record details so your mentor can verify and complete your submission.'
      }
    case 'placement_submitted':
      return {
        tone: 'warn',
        Icon: Clock,
        title: 'Placement record details under review',
        text: isMprFlow
          ? 'Your mentor is verifying your placement record. The final report unlocks once they approve.'
          : 'Your mentor is verifying your placement record. Your submission completes once they approve.'
      }
    case 'final_report_pending':
      return !submission?.finalReport?.submittedAt
        ? { tone: 'success', Icon: CheckCircle, title: 'Placement record approved', text: 'You can now submit your final report.' }
        : null
    case 'registration_rejected':
    case 'final_report_rejected':
    case 'placement_rejected':
      return {
        tone: 'danger',
        Icon: AlertCircle,
        title: 'Action required',
        text: 'Please review the mentor feedback and resubmit with the necessary changes.'
      }
    case 'completed':
      return {
        tone: 'success',
        Icon: CheckCircle,
        title: 'Congratulations!',
        text: `Your ${kind} has been successfully completed and approved.`
      }
    default:
      return null
  }
}

const getSemesterIcon = (semesterType) => {
  const iconMap = {
    '8th_internship': GraduationCap,
    '7th_internship': Building,
    '6th_internship': Users,
    any_internship: Calendar,
    '8th_project': Code
  }
  return iconMap[semesterType] || Building
}

// ─── Main dashboard ───────────────────────────────────────────────────────────
const StudentDashboard = () => {
  const { execute, loading } = useApi()
  const [dashboardData, setDashboardData] = useState(null)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  // Hooks must run on every render, so this sits above the early returns below
  const completedTotal = dashboardData?.completedSubmissions?.length || 0
  const completedCount = useCountUp(completedTotal, 700)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setError('')
    try {
      const response = await execute(() => studentService.getDashboard())
      if (response?.success) {
        setDashboardData(response.data)
      } else {
        setError(response?.message || 'Could not load your dashboard.')
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err)
      setError('Could not load your dashboard. Please check your connection and try again.')
    }
  }

  if (error && !dashboardData) {
    return (
      <Card className="mx-auto mt-10 max-w-md p-8 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-rose-50 text-rose-500">
          <AlertCircle className="h-7 w-7" />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-slate-900">Something went wrong</h2>
        <p className="mt-1 text-sm text-slate-500">{error}</p>
        <button
          type="button"
          onClick={loadDashboardData}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          <RefreshCw className="h-4 w-4" /> Try again
        </button>
      </Card>
    )
  }

  if (loading || !dashboardData) {
    return <DashboardSkeleton />
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
  } = dashboardData

  const inPlacementPhase = ['placement_pending', 'placement_submitted', 'placement_rejected'].includes(currentStep)
  const isMprFlow = ['7th_internship', '8th_internship', '8th_project'].includes(semesterType)
  const allDone = !hasSubmission && completedSubmissions.length > 0 && availableSemesters.length === 0
  const hasMentor = !!student?.assignedMentor?.name

  const displayName = cleanName(student?.name) || 'Student'
  const nextAction = hasSubmission ? getNextAction(currentStep, semesterType, submission) : null
  const notice = getNotice({ currentStep, hasSubmission, allDone, isMprFlow, submission, semesterType })

  const steps = hasSubmission ? buildSteps({ currentStep, isMprFlow, inPlacementPhase }) : []
  const doneCount = steps.filter((s) => s.state === 'done').length
  const activeBonus = steps.some((s) => s.state === 'active') ? 0.5 : 0
  const percent = allDone
    ? 100
    : hasSubmission
      ? Math.min(100, Math.round(((doneCount + activeBonus) / steps.length) * 100))
      : 0

  const handleRegistrationClick = (e) => {
    e?.preventDefault?.()
    if (!hasMentor) {
      alert('No mentor has added you yet. Once your mentor adds you, you will be able to submit.')
      return
    }
    navigate('/student/choice')
  }

  const heroSubtitle = allDone
    ? "You've completed every requirement. Congratulations on finishing strong!"
    : hasSubmission
      ? `${prettySemester(semesterType)} · ${getStepDescription(currentStep, semesterType, submission)}`
      : 'Pick your track and submit your registration to get started.'

  const SemesterIcon = getSemesterIcon(semesterType)

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="st-fade-up relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 p-6 text-white shadow-lg shadow-indigo-900/10 sm:p-8">
        <div aria-hidden="true" className="st-float pointer-events-none absolute -right-16 -top-16 h-60 w-60 rounded-full bg-white/10 blur-2xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-violet-400/20 blur-3xl" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 max-w-xl">
            <p className="text-sm font-medium text-indigo-100">{getGreeting()}</p>
            <h1 className="mt-1 break-words text-2xl font-semibold tracking-tight sm:text-3xl">{displayName}</h1>
            <p className="mt-2 text-sm leading-relaxed text-indigo-100/90 sm:text-base">{heroSubtitle}</p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {nextAction && (
                <Link
                  to={nextAction.link}
                  state={nextAction.state}
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50"
                >
                  {nextAction.text}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              )}
              {!hasSubmission && !allDone && completedSubmissions.length === 0 && (
                <button
                  type="button"
                  onClick={handleRegistrationClick}
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50"
                >
                  <Plus className="h-4 w-4" />
                  Start registration
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              )}
              {hasSubmission && (
                <Link
                  to="/student/progress"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-sm font-medium text-white ring-1 ring-white/25 transition hover:bg-white/20"
                >
                  View full progress
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 sm:flex-col sm:gap-2">
            <ProgressRing percent={percent} />
            <p className="max-w-[9rem] text-xs leading-snug text-indigo-100 sm:text-center">
              {allDone
                ? 'All semesters completed'
                : hasSubmission
                  ? `${doneCount} of ${steps.length} steps done`
                  : 'Not started yet'}
            </p>
          </div>
        </div>
      </section>

      {/* ── Next-up notice ───────────────────────────────────── */}
      {notice && (
        <Reveal delay={80}>
          <div className={`flex items-start gap-3 rounded-2xl border p-4 sm:p-5 ${NOTICE_TONES[notice.tone].box}`}>
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${NOTICE_TONES[notice.tone].icon}`}>
              <notice.Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="font-medium text-slate-900">{notice.title}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{notice.text}</p>
            </div>
          </div>
        </Reveal>
      )}

      {/* ── Stats ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard icon={BookOpen} tint="indigo" label="Academic branch" value={resolveBranch(student?.branch)} delay={120} />
        <StatCard icon={Award} tint="emerald" label="Enrollment no." value={student?.enrollmentNo || '—'} delay={180} />
        <StatCard
          icon={TrendingUp}
          tint="violet"
          label="Current track"
          value={hasSubmission ? prettySemester(semesterType) : allDone ? 'All done' : 'Not started'}
          delay={240}
        />
        <StatCard
          icon={UserCheck}
          tint="amber"
          label="Mentor"
          value={hasMentor ? 'Assigned' : 'Pending'}
          sub={hasMentor ? student.assignedMentor.name : 'Waiting to be added'}
          delay={300}
        />
      </div>

      {/* ── Next semester call-to-action ─────────────────────── */}
      {completedSubmissions.length > 0 && !hasSubmission && availableSemesters.length > 0 && (
        <Reveal delay={120}>
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 p-5 sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-indigo-700">
                  <TrendingUp className="h-5 w-5" />
                  <h3 className="text-lg font-semibold text-slate-900">Ready for your next challenge?</h3>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  You have completed {completedCount} semester{completedSubmissions.length > 1 ? 's' : ''}. Continue by
                  registering for the next one.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {availableSemesters.map((sem) => (
                    <span key={sem} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-200">
                      {prettySemester(sem)}
                    </span>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={handleRegistrationClick}
                className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                Register for next semester
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </Reveal>
      )}

      {/* ── Main grid ────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2 lg:space-y-8">
          <Reveal delay={140}>
            <Card className="overflow-hidden">
              <CardHeader icon={FileText} title="Current progress" subtitle="Where your submission stands right now" />
              <div className="p-5 sm:p-6">
                {allDone ? (
                  <CompletionCelebration completedSubmissions={completedSubmissions} />
                ) : hasSubmission ? (
                  <div className="space-y-5">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <InfoTile label="Current step">
                        <span className="flex items-start gap-2">
                          <SemesterIcon className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                          <span>{getStepDescription(currentStep, semesterType, submission)}</span>
                        </span>
                      </InfoTile>
                      <InfoTile label="Overall status">
                        <StatusBadge status={submissionStatus} />
                      </InfoTile>
                      <InfoTile label="Started on">{formatDateTime(submission?.createdAt)}</InfoTile>
                      {submission?.updatedAt && submission?.updatedAt !== submission?.createdAt && (
                        <InfoTile label="Last updated">{formatDateTime(submission.updatedAt)}</InfoTile>
                      )}
                    </div>

                    {nextAction && (
                      <Link
                        to={nextAction.link}
                        state={nextAction.state}
                        className={`group flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition ${ACTION_BUTTON[nextAction.color]}`}
                      >
                        {nextAction.text}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="py-6 text-center">
                    <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-slate-100 text-slate-400">
                      <Clock className="h-8 w-8" />
                    </span>
                    <h4 className="mt-4 text-lg font-semibold text-slate-900">Ready to begin?</h4>
                    <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                      Choose your academic path and start your submission journey.
                    </p>
                    <button
                      type="button"
                      onClick={handleRegistrationClick}
                      className="group mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                    >
                      <Plus className="h-4 w-4" />
                      Registration &amp; Preliminary Review
                    </button>
                  </div>
                )}
              </div>
            </Card>
          </Reveal>

          {hasSubmission && (
            <Reveal delay={200}>
              <Card className="overflow-hidden">
                <CardHeader icon={TrendingUp} tint="violet" title="Submission workflow" subtitle="Track your progress through each step" />
                <StepTimeline steps={steps} />
              </Card>
            </Reveal>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6 lg:space-y-8">
          <Reveal delay={180}>
            <Card className="p-5 sm:p-6">
              <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                <User className="h-4 w-4 text-indigo-500" /> Your profile
              </h3>

              <div className="mt-4 flex items-center gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-base font-semibold text-white">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900" title={displayName}>{displayName}</p>
                  <p className="flex items-center gap-1.5 truncate text-sm text-slate-500" title={student?.email}>
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{student?.email}</span>
                  </p>
                </div>
              </div>

              {student?.assignedMentor && (
                <div className="mt-5 rounded-xl bg-amber-50/70 p-4 ring-1 ring-amber-100">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Assigned mentor</p>
                  <p className="mt-1 font-medium text-slate-900">{student.assignedMentor.name}</p>
                  <p className="break-all text-sm text-slate-600">{student.assignedMentor.email}</p>
                </div>
              )}
            </Card>
          </Reveal>

          <Reveal delay={240}>
            <Card className="p-5 sm:p-6">
              <h3 className="text-base font-semibold text-slate-900">Quick actions</h3>
              <div className="mt-4 space-y-3">
                {allDone ? (
                  <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-500 text-white">
                      <Award className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-medium text-slate-900">Journey complete</p>
                      <p className="text-sm text-emerald-700">
                        {completedSubmissions.length} semester{completedSubmissions.length > 1 ? 's' : ''} finished
                      </p>
                    </div>
                  </div>
                ) : !hasSubmission ? (
                  <button
                    type="button"
                    onClick={handleRegistrationClick}
                    className="group flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3.5 text-left transition hover:border-indigo-200 hover:bg-indigo-50/50"
                  >
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${ACTION_TILE.blue}`}>
                      <Plus className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-slate-900">Start your journey</span>
                      <span className="block text-sm text-slate-500">Choose your academic path</span>
                    </span>
                    <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" />
                  </button>
                ) : (
                  <>
                    <Link
                      to="/student/progress"
                      className="group flex items-center gap-3 rounded-xl border border-slate-200 p-3.5 transition hover:border-emerald-200 hover:bg-emerald-50/50"
                    >
                      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${ACTION_TILE.green}`}>
                        <CheckCircle className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium text-slate-900">View progress</span>
                        <span className="block text-sm text-slate-500">Check detailed submission status</span>
                      </span>
                      <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" />
                    </Link>

                    {nextAction && (
                      <Link
                        to={nextAction.link}
                        state={nextAction.state}
                        className="group flex items-center gap-3 rounded-xl border border-slate-200 p-3.5 transition hover:border-indigo-200 hover:bg-indigo-50/50"
                      >
                        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${ACTION_TILE[nextAction.color]}`}>
                          <Calendar className="h-5 w-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium text-slate-900">{nextAction.text}</span>
                          <span className="block text-sm text-slate-500">Continue your submission</span>
                        </span>
                        <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" />
                      </Link>
                    )}
                  </>
                )}
              </div>
            </Card>
          </Reveal>
        </div>
      </div>

      {/* ── Submission details ───────────────────────────────── */}
      {hasSubmission && (
        <Reveal delay={120}>
          <Card className="overflow-hidden">
            <CardHeader
              icon={semesterType?.includes('project') ? Code : Building}
              tint="emerald"
              title="Current submission details"
              subtitle={`Overview of your ${semesterType?.includes('project') ? 'project' : 'internship'} submission`}
            />
            <div className="p-5 sm:p-6">
              {semesterType?.includes('project') ? (
                <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
                  <Code className="mt-1 h-5 w-5 shrink-0 text-slate-400" />
                  <div className="min-w-0">
                    <h4 className="break-words text-base font-semibold text-slate-900">
                      {submission?.registrationData?.projectTitle || 'Project Submission'}
                    </h4>
                    <p className="text-sm text-slate-600">
                      {submission?.registrationData?.projectType
                        ?.replace('_', ' & ')
                        .replace(/\b\w/g, (l) => l.toUpperCase()) || 'Research Project'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
                  <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
                    <Building className="mt-1 h-5 w-5 shrink-0 text-slate-400" />
                    <div className="min-w-0">
                      <h4 className="break-words text-base font-semibold text-slate-900">
                        {submission?.registrationData?.companyName || 'Company Name'}
                      </h4>
                      <p className="text-sm font-medium text-slate-700">
                        {submission?.registrationData?.internshipTitle || 'Internship Position'}
                      </p>
                      <p className="mt-0.5 text-sm text-slate-500">
                        {submission?.registrationData?.companyType?.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                        {' • '}
                        {submission?.registrationData?.internshipType?.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
                      {submission?.registrationData?.startDate && submission?.registrationData?.endDate
                        ? `${formatDate(submission.registrationData.startDate)} – ${formatDate(submission.registrationData.endDate)}`
                        : 'Duration not specified'}
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <span className="block text-slate-500">Duration</span>
                        <span className="font-semibold text-slate-900">{submission?.registrationData?.duration || 0} months</span>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <span className="block text-slate-500">Stipend</span>
                        <span className="font-semibold text-slate-900">
                          {submission?.registrationData?.hasStipend
                            ? `₹${submission.registrationData.stipendAmount || 0}`
                            : 'Unpaid'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {(submission?.registrationReview?.feedback || submission?.finalReportReview?.feedback) && (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {submission?.registrationReview?.feedback && (
                    <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 sm:p-5">
                      <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <User className="h-4 w-4 text-indigo-500" /> Registration feedback
                      </h4>
                      <p className="mt-2 text-sm leading-relaxed text-slate-700">{submission.registrationReview.feedback}</p>
                    </div>
                  )}
                  {submission?.finalReportReview?.feedback && (
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 sm:p-5">
                      <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <User className="h-4 w-4 text-emerald-500" /> Final report feedback
                      </h4>
                      <p className="mt-2 text-sm leading-relaxed text-slate-700">{submission.finalReportReview.feedback}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </Reveal>
      )}

      {/* ── Academic journey ─────────────────────────────────── */}
      {completedSubmissions.length > 0 && (
        <Reveal delay={120}>
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <span className={`grid h-10 w-10 place-items-center rounded-xl ${TINTS.emerald}`}>
                  <Award className="h-5 w-5" />
                </span>
                <h3 className="text-base font-semibold text-slate-900">Your academic journey</h3>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                {completedSubmissions.length} semester{completedSubmissions.length > 1 ? 's' : ''} completed
              </span>
            </div>

            <ol className="p-5 sm:p-6">
              {completedSubmissions.map((sub, index) => (
                <li
                  key={sub._id}
                  className="st-fade-up relative flex gap-4 pb-6 last:pb-0"
                  style={{ '--d': `${index * 90}ms` }}
                >
                  {index < completedSubmissions.length - 1 && (
                    <span className="absolute bottom-0 left-[19px] top-11 w-0.5 bg-emerald-200" />
                  )}
                  <span className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-500 text-white ring-4 ring-white">
                    <CheckCircle className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-semibold text-slate-900">{prettySemester(sub.semesterType)}</h4>
                        <p className="break-words text-sm text-slate-600">
                          {sub.semesterType.includes('project')
                            ? sub.registrationData?.projectTitle || 'Project Completed'
                            : sub.registrationData?.companyName || 'Internship Completed'}
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">Completed</span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="block text-slate-500">Submitted</span>
                        <span className="font-medium text-slate-900">{formatDate(sub.createdAt)}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500">Completed</span>
                        <span className="font-medium text-slate-900">{formatDate(sub.completedAt)}</span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </Reveal>
      )}
    </div>
  )
}

export default StudentDashboard