import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { studentService } from '../services/studentService'
import api from '../services/api'
import {
  CheckCircle, Clock, XCircle, AlertCircle, ChevronDown,
  ChevronRight, User, Calendar, Building, Search, Activity, Filter, GitBranch
} from 'lucide-react'

// ─── helpers ──────────────────────────────────────────────────────────────────
const SEM_LABEL = {
  any_internship:   'Any Internship',
  '6th_internship': '6th Sem Internship',
  '7th_internship': '7th Sem Internship',
  '8th_internship': '8th Sem Internship',
  '8th_project':    '8th Sem Project',
}

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }) : '—'

// Resolve branch — handles ObjectId string, populated object, or plain string
const resolveBranch = (branch) => {
  if (!branch) return null
  if (typeof branch === 'object' && branch.name) return branch.name
  // 24-char hex = raw ObjectId — not displayable
  if (typeof branch === 'string' && /^[a-f0-9]{24}$/i.test(branch)) return null
  return branch
}

// ─── Status configs ───────────────────────────────────────────────────────────
const STATUS_CFG = {
  completed:   { bg: 'bg-green-50',  border: 'border-green-300',  text: 'text-green-800',  icon: CheckCircle,  label: 'Completed'    },
  approved:    { bg: 'bg-green-50',  border: 'border-green-300',  text: 'text-green-800',  icon: CheckCircle,  label: 'Approved'     },
  pending:     { bg: 'bg-amber-50',  border: 'border-amber-300',  text: 'text-amber-800',  icon: Clock,        label: 'Under Review' },
  in_progress: { bg: 'bg-blue-50',   border: 'border-blue-300',   text: 'text-blue-800',   icon: Clock,        label: 'In Progress'  },
  rejected:    { bg: 'bg-red-50',    border: 'border-red-300',    text: 'text-red-800',    icon: XCircle,      label: 'Rejected'     },
  not_started: { bg: 'bg-gray-50',   border: 'border-gray-200',   text: 'text-gray-400',   icon: AlertCircle,  label: 'Not Started'  },
}

const OverallBadge = ({ status }) => {
  const cfg = STATUS_CFG[status] || STATUS_CFG.not_started
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${cfg.bg} ${cfg.border} ${cfg.text}`}>
      <Icon className="h-3.5 w-3.5" /> {cfg.label}
    </span>
  )
}

// ─── Derive step status ───────────────────────────────────────────────────────
const getStepStatus = (submission, stepKey) => {
  if (!submission) return 'not_started'
  const { currentStep, registrationReview, mprSubmissions, finalReportReview } = submission

  if (stepKey === 'registration') {
    const s = registrationReview?.status
    if (s === 'approved') return 'approved'
    if (s === 'rejected') return 'rejected'
    if (currentStep === 'registration_pending') return 'pending'
    return 'not_started'
  }
  if (['mpr1','mpr2','mpr3','midSem1'].includes(stepKey)) {
    const m = mprSubmissions?.[stepKey]
    if (!m?.document) return 'not_started'
    return m.status === 'approved' ? 'approved' : m.status === 'rejected' ? 'rejected' : 'pending'
  }
  if (stepKey === 'final_report') {
    const s = finalReportReview?.status
    if (currentStep === 'completed') return 'completed'
    if (s === 'approved') return 'approved'
    if (s === 'rejected') return 'rejected'
    if (currentStep === 'final_report_pending') return 'pending'
    return 'not_started'
  }
  return 'not_started'
}

// ─── Submission progress block ────────────────────────────────────────────────
const SubmissionSteps = ({ submission }) => {
  const needsMPR = ['7th_internship','8th_internship','8th_project'].includes(submission.semesterType)
  const isCompleted = submission.currentStep === 'completed'

  const overallStatus = isCompleted ? 'completed'
    : submission.currentStep?.includes('rejected') ? 'rejected'
    : submission.currentStep?.includes('pending') ? 'pending'
    : 'in_progress'

  const steps = needsMPR
    ? [
        { key: 'registration', label: 'Initial Reg.' },
        { key: 'mpr1',         label: 'MPR 1' },
        { key: 'mpr2',         label: 'MPR 2' },
        { key: 'mpr3',         label: 'MPR 3' },
        { key: 'midSem1',      label: 'Mid Sem' },
        { key: 'final_report', label: 'Final Report' },
      ]
    : [
        { key: 'registration', label: 'Initial Reg.' },
        { key: 'final_report', label: 'Final Report' },
      ]

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      {/* Sem header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
            {SEM_LABEL[submission.semesterType] || submission.semesterType}
          </span>
          <OverallBadge status={overallStatus} />
        </div>
        <span className="text-xs text-gray-400">
          Started {fmtDate(submission.createdAt)}
          {isCompleted && submission.completedAt && <> · Completed {fmtDate(submission.completedAt)}</>}
        </span>
      </div>

      {/* Company / project */}
      {(submission.registrationData?.companyName || submission.registrationData?.projectTitle) && (
        <div className="px-4 py-2 bg-white border-b border-gray-100 flex items-center gap-2">
          <Building className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
          <span className="text-xs text-gray-600">
            {submission.registrationData?.companyName || submission.registrationData?.projectTitle}
            {submission.registrationData?.internshipType && (
              <span className="ml-2 text-gray-400">· {submission.registrationData.internshipType}</span>
            )}
          </span>
        </div>
      )}

      {/* Steps grid */}
      <div className="p-4 bg-white">
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
        >
          {steps.map(({ key, label }) => {
            const status = getStepStatus(submission, key)
            const cfg = STATUS_CFG[status] || STATUS_CFG.not_started
            const Icon = cfg.icon
            return (
              <div
                key={key}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border ${cfg.bg} ${cfg.border}`}
              >
                <Icon className={`h-5 w-5 ${cfg.text}`} />
                <span className={`text-xs font-semibold ${cfg.text} text-center leading-tight`}>{label}</span>
                <span className={`text-xs ${cfg.text} opacity-80 text-center leading-tight`}>{cfg.label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Student card ─────────────────────────────────────────────────────────────
const StudentCard = ({ student, submissions, lastLogin }) => {
  const [open, setOpen] = useState(false)
  const branchName = resolveBranch(student.branch)
  const mentorName = student.assignedMentor?.name || student.assignedMentor?.email?.split('@')[0] || null
  const completedCount = submissions.filter(s => s.currentStep === 'completed').length
  const activeCount    = submissions.filter(s => s.currentStep !== 'completed').length
  const hasAny         = submissions.length > 0

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors text-left"
      >
        {/* Avatar */}
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
          <span className="text-white font-bold text-sm">
            {(student.name || student.email || '?')[0].toUpperCase()}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <p className="font-semibold text-gray-900 truncate">
              {student.name || student.email?.split('@')[0] || 'Unknown'}
            </p>
            {student.enrollmentNo && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-mono border border-gray-200">
                {student.enrollmentNo}
              </span>
            )}
            {branchName && (
              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 font-medium">
                {branchName}
              </span>
            )}
            {mentorName ? (
              <span className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200 font-medium">
                <User className="h-3 w-3" /> {mentorName}
              </span>
            ) : (
              <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full border border-orange-200 font-medium">
                Mentor: Not Assigned
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 truncate">{student.email}</p>
        </div>

        {/* Stats + chevron */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="hidden sm:flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-1.5">
              {completedCount > 0 && (
                <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200 font-medium">
                  <CheckCircle className="h-3 w-3" /> {completedCount} done
                </span>
              )}
              {activeCount > 0 && (
                <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200 font-medium">
                  <Clock className="h-3 w-3" /> {activeCount} active
                </span>
              )}
              {!hasAny && (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full border border-gray-200">
                  No submissions
                </span>
              )}
            </div>
            {lastLogin && (
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {fmtDateTime(lastLogin)}
              </p>
            )}
          </div>

          <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
            open ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
          }`}>
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </div>
        </div>
      </button>

      {/* Expanded */}
      {open && (
        <div className="border-t border-gray-100 px-6 py-5 bg-gray-50/50 space-y-4">
          {!hasAny ? (
            <div className="text-center py-6">
              <Activity className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No submissions yet.</p>
              {student.assignedSemester && (
                <p className="text-xs text-blue-600 mt-1">
                  Assigned: <strong>{SEM_LABEL[student.assignedSemester] || student.assignedSemester}</strong>
                </p>
              )}
            </div>
          ) : (
            submissions.map(sub => <SubmissionSteps key={sub._id} submission={sub} />)
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
const StudentProgressPage = () => {
  const { user } = useAuth()
  const role = user?.role
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ search: '', branchCode: '' })

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      if (role === 'student') {
        const res = await studentService.getSubmissionHistory()
        if (res.success) setRows([{ student: user, submissions: res.data.submissions || [], lastLogin: null }])
      } else {
        const res = await api.get('/student-progress', {
          params: { role, search: filters.search, branchCode: filters.branchCode }
        })
        if (res.data?.success) setRows(res.data.data)
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  // Student's own view
  if (role === 'student') {
    const myRow = rows[0]
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Progress</h1>
          <p className="text-gray-600">Track all your submission steps</p>
        </div>
        {loading ? <LoadingSkeleton /> : !myRow?.submissions.length ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
            <Activity className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No submissions yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {myRow.submissions.map(sub => (
              <div key={sub._id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <SubmissionSteps submission={sub} />
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const title = role === 'admin' ? 'All Students Progress'
    : role === 'dept_admin' ? 'Department Students Progress'
    : 'My Students Progress'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-600">Real-time view of every student's submission journey</p>
      </div>

      {/* Stats */}
      {!loading && rows.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Students',     val: rows.length,                                                              bg: 'bg-blue-50',  border: 'border-blue-100',  text: 'text-blue-700'  },
            { label: 'Active Submissions', val: rows.filter(r => r.submissions.some(s => s.currentStep !== 'completed')).length, bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700' },
            { label: 'Completed',          val: rows.filter(r => r.submissions.some(s => s.currentStep === 'completed')).length, bg: 'bg-green-50', border: 'border-green-100', text: 'text-green-700' },
            { label: 'No Submission',      val: rows.filter(r => r.submissions.length === 0).length,                      bg: 'bg-gray-50',  border: 'border-gray-200',  text: 'text-gray-600'  },
          ].map(({ label, val, bg, border, text }) => (
            <div key={label} className={`${bg} border ${border} rounded-2xl p-4 text-center`}>
              <p className={`text-3xl font-bold ${text}`}>{val}</p>
              <p className={`text-xs ${text} mt-1 font-medium`}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search + Branch filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] border border-gray-200 rounded-lg px-3 py-2">
            <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by name, email or enrollment no..."
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              onKeyDown={e => { if (e.key === 'Enter') load() }}
              className="flex-1 border-0 outline-none text-sm text-gray-900 placeholder-gray-400 bg-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Branch code (e.g. io, eo)"
              value={filters.branchCode}
              onChange={e => setFilters(f => ({ ...f, branchCode: e.target.value }))}
              onKeyDown={e => { if (e.key === 'Enter') load() }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-44 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button onClick={load} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2">
            <Filter className="h-4 w-4" /> Search
          </button>
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-500">
            Branch code parsed from college email. <code>23io10mo34@mitsgwl.ac.in</code> → <strong>io</strong>
          </p>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{rows.length} students</span>
        </div>
      </div>

      {/* List */}
      {loading ? <LoadingSkeleton /> : rows.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
          <User className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No students found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(r => (
            <StudentCard key={r.student._id} student={r.student} submissions={r.submissions} lastLogin={r.lastLogin} />
          ))}
        </div>
      )}
    </div>
  )
}

const LoadingSkeleton = () => (
  <div className="space-y-3">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded-full w-1/4" />
            <div className="h-3 bg-gray-200 rounded-full w-1/3" />
          </div>
          <div className="h-6 bg-gray-200 rounded-full w-20" />
        </div>
      </div>
    ))}
  </div>
)

export default StudentProgressPage