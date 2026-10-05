import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useApi } from '../../hooks/useApi'
import { studentService } from '../../services/studentService'
import FileUpload from '../common/FileUpload'
import {
  Building,
  Building2,
  Code,
  Calendar,
  IndianRupee,
  Users,
  FileText,
  ArrowLeft,
  Info,
  Lock,
  AlertCircle,
  ChevronDown
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2 MB per document

const COMPANY_TYPE_OPTIONS = [
  ['startup', 'Startup'],
  ['mnc', 'MNC'],
  ['government', 'Government'],
  ['psu', 'PSU'],
  ['academic_institute', 'Academic Institute'],
  ['research', 'Research'],
  ['other', 'Other']
]

const WORK_TYPE_OPTIONS = [
  ['software', 'Software'],
  ['hardware', 'Hardware'],
  ['product_development', 'Product Development'],
  ['software_hardware', 'Software & Hardware'],
  ['experiment_based', 'Experiment Based'],
  ['testing_based', 'Testing Based'],
  ['case_study', 'Case Study'],
  ['other', 'Other']
]

const INTERNSHIP_TYPE_OPTIONS = [
  ['remote', 'Remote'],
  ['onsite', 'On-site'],
  ['hybrid', 'Hybrid']
]

const PROJECT_TYPE_OPTIONS = [
  ['software', 'Software'],
  ['hardware', 'Hardware'],
  ['software_hardware', 'Software & Hardware'],
  ['experimental', 'Experimental']
]

const PHONE_FIELDS = ['studentMobileNumber', 'mentorContactNumber']

// ─── Validation helpers ───────────────────────────────────────────────────────
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/
const MOBILE_REGEX = /^[6-9]\d{9}$/
const PERSON_NAME_REGEX = /^\p{L}[\p{L} .'-]{1,49}$/u
const HAS_ALNUM_REGEX = /[\p{L}\p{N}]/u

const isValidDate = (value) => {
  const d = new Date(value)
  return !Number.isNaN(d.getTime()) && d.getFullYear() >= 2000 && d.getFullYear() <= 2100
}

const textRule = (label, min, max) => (value) => {
  const s = (value || '').trim()
  if (!s) return `${label} is required`
  if (s.length < min) return `${label} must be at least ${min} characters`
  if (s.length > max) return `${label} must not exceed ${max} characters`
  if (!HAS_ALNUM_REGEX.test(s)) return `Enter a valid ${label.toLowerCase()}`
  return ''
}

const nameRule = (label) => (value) => {
  const s = (value || '').trim()
  if (!s) return `${label} is required`
  if (!PERSON_NAME_REGEX.test(s)) return `Enter a valid ${label.toLowerCase()} (letters only, 2–50 characters)`
  return ''
}

const emailRule = (label) => (value) => {
  const s = (value || '').trim()
  if (!s) return `${label} is required`
  if (s.length > 254 || s.includes('..') || !EMAIL_REGEX.test(s)) {
    return 'Enter a valid email address (e.g., name@company.com)'
  }
  return ''
}

const mobileRule = (label) => (value) => {
  const s = (value || '').trim()
  if (!s) return `${label} is required`
  if (!/^\d+$/.test(s)) return `${label} must contain digits only`
  if (s.length !== 10) return `${label} must be exactly 10 digits`
  if (!MOBILE_REGEX.test(s)) return 'Mobile number must start with 6, 7, 8 or 9'
  return ''
}

const fieldValidators = {
  companyName: textRule('Company name', 2, 100),
  companyType: (v) => (v ? '' : 'Please select a company type'),
  companyTypeOther: (v) => {
    if (!(v || '').trim()) return 'Please specify your company type'
    return textRule('Company type', 2, 50)(v)
  },
  companyFullAddress: textRule('Company address', 20, 300),
  typeOfWork: (v) => (v ? '' : 'Please select the type of work'),
  internshipDomain: textRule('Internship domain', 2, 100),
  internshipTitle: textRule('Internship title', 5, 100),
  internshipType: (v) => (v ? '' : 'Please select the internship type'),
  startDate: (v) => {
    if (!v) return 'Start date is required'
    if (!isValidDate(v)) return 'Enter a valid start date'
    return ''
  },
  endDate: (v, d) => {
    if (!v) return 'End date is required'
    if (!isValidDate(v)) return 'Enter a valid end date'
    if (d.startDate && isValidDate(d.startDate) && new Date(v) <= new Date(d.startDate)) {
      return 'End date must be after the start date'
    }
    return ''
  },
  stipendAmount: (v) => {
    const s = String(v || '').trim()
    if (!s) return 'Stipend amount is required'
    if (!/^\d+$/.test(s) || Number(s) < 1) return 'Enter a valid amount greater than 0'
    if (Number(s) > 1000000) return 'Amount looks too high. Please check and re-enter'
    return ''
  },
  mentorName: nameRule('Mentor name'),
  mentorRole: textRule('Mentor role', 2, 100),
  mentorEmail: emailRule('Mentor email'),
  mentorContactNumber: mobileRule('Mentor contact number'),
  hrName: nameRule('HR name'),
  hrEmail: emailRule('HR email'),
  studentMobileNumber: mobileRule('Student mobile number')
}

const FILE_RULES = {
  stipendProof: { label: 'Stipend proof', types: ['pdf'] },
  offerLetter: { label: 'Offer letter', types: ['pdf'] },
  nocLetter: { label: 'NOC letter', types: ['pdf'] },
  synopsisPPT: { label: 'Preliminary review presentation', types: ['pdf', 'ppt', 'pptx'] },
  projectReport: { label: 'Start-up report', types: ['pdf'] }
}

const validateFileField = (name, file) => {
  const rule = FILE_RULES[name]
  if (!file) return `${rule.label} is required`
  const ext = (file.name.split('.').pop() || '').toLowerCase()
  if (!rule.types.includes(ext)) {
    return `${rule.label} must be a ${rule.types.map((t) => t.toUpperCase()).join(' or ')} file`
  }
  if (file.size === 0) return `${rule.label} appears to be empty`
  if (file.size > MAX_FILE_SIZE) return `${rule.label} must be 2 MB or smaller`
  return ''
}

const getActiveFields = (d) =>
  Object.keys(fieldValidators).filter((name) => {
    if (name === 'companyTypeOther') return d.companyType === 'other'
    if (name === 'stipendAmount') return d.hasStipend
    return true
  })

const getActiveFileFields = (d) => [
  'offerLetter',
  'nocLetter',
  'synopsisPPT',
  ...(d.hasStipend ? ['stipendProof'] : [])
]

const normalizePhone = (raw) => {
  let digits = raw.replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2) // pasted +91 number
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1) // pasted 0-prefixed number
  return digits.slice(0, 10)
}

const inputClass = (hasError) =>
  `block w-full rounded-lg border bg-white px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:outline-none focus:ring-2 ${
    hasError
      ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
      : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100'
  }`

// ─── Presentational helpers (defined outside so inputs never remount) ────────
const SectionCard = ({ icon: Icon, title, description, children }) => (
  <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
    <header className="flex items-start gap-3 border-b border-slate-200 px-5 py-4 sm:px-6">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
      </div>
    </header>
    <div className="p-5 sm:p-6">{children}</div>
  </section>
)

const Field = ({ name, label, required, error, hint, className = '', children }) => (
  <div id={`field-${name}`} className={className}>
    <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-slate-700">
      {label}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
    {children}
    {error ? (
      <p id={`${name}-error`} role="alert" className="mt-1.5 flex items-start gap-1.5 text-sm text-red-600">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{error}</span>
      </p>
    ) : hint ? (
      <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
    ) : null}
  </div>
)

const Select = ({ options, placeholder, className = '', ...props }) => (
  <div className="relative">
    <select {...props} className={`${className} appearance-none pr-10`}>
      <option value="">{placeholder}</option>
      {options.map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
  </div>
)

const SubHeading = ({ children }) => (
  <div className="border-b border-slate-200 pb-2 pt-1 md:col-span-2">
    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{children}</h3>
  </div>
)

// ─── Main component ──────────────────────────────────────────────────────────
const RegistrationForm = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { execute, loading } = useApi()

  const semesterType = location.state?.semesterType || '8th_internship'
  const [selectedSubType, setSelectedSubType] = useState('')

  // ─── uploads-enabled state ────────────────────────────────────────────────
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
    companyTypeOther: '',
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
    synopsisPPT: null,
    projectReport: null
  })

  const [formErrors, setFormErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const submitErrorRef = useRef(null)

  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  // 'uploading' = files still being sent, 'processing' = 100% sent, waiting on server
  const [submitPhase, setSubmitPhase] = useState('uploading')

  const show8thTypeSelection = false
  const isProjectType = false

  useEffect(() => {
    if (submitError) {
      submitErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [submitError])

  const scrollToFirstError = (errors) => {
    requestAnimationFrame(() => {
      const nodes = Array.from(document.querySelectorAll('[id^="field-"]'))
      const target = nodes.find((n) => errors[n.id.replace('field-', '')])
      if (!target) return
      target.scrollIntoView({ behavior: 'smooth', block: 'center' })
      target.querySelector('input:not([type="file"]), select, textarea')?.focus({ preventScroll: true })
    })
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    let next = type === 'checkbox' ? checked : value

    if (PHONE_FIELDS.includes(name)) next = normalizePhone(value)
    if (name === 'stipendAmount') next = value.replace(/\D/g, '').slice(0, 7)

    setFormData((prev) => {
      const updated = { ...prev, [name]: next }
      if (name === 'companyType' && next !== 'other') updated.companyTypeOther = ''
      if (name === 'hasStipend' && !next) updated.stipendAmount = ''
      return updated
    })

    if (name === 'hasStipend' && !next) {
      setFiles((prev) => ({ ...prev, stipendProof: null }))
    }

    setFormErrors((prev) => {
      const updated = { ...prev, [name]: '' }
      if (name === 'companyType') updated.companyTypeOther = ''
      if (name === 'hasStipend' && !next) {
        updated.stipendAmount = ''
        updated.stipendProof = ''
      }
      // Re-check end date live when start date changes
      if (name === 'startDate' && formData.endDate) {
        updated.endDate = fieldValidators.endDate(formData.endDate, { ...formData, startDate: next })
      }
      return updated
    })
  }

  const handleBlur = (e) => {
    const { name } = e.target
    if (!fieldValidators[name] || !getActiveFields(formData).includes(name)) return
    const message = fieldValidators[name](formData[name], formData)
    setFormErrors((prev) => ({ ...prev, [name]: message }))
  }

  const handleFileSelect = (fieldName, file) => {
    setFiles((prev) => ({ ...prev, [fieldName]: file }))
    if (formErrors[fieldName]) {
      setFormErrors((prev) => ({ ...prev, [fieldName]: '' }))
    }
  }

  const bind = (name) => ({
    id: name,
    name,
    value: formData[name],
    onChange: handleChange,
    onBlur: handleBlur,
    className: inputClass(Boolean(formErrors[name])),
    'aria-invalid': Boolean(formErrors[name]),
    'aria-describedby': formErrors[name] ? `${name}-error` : undefined
  })

  const validateForm = () => {
    const errors = {}

    if (isProjectType) {
      if (!formData.projectTitle?.trim() || formData.projectTitle.trim().length < 5) {
        errors.projectTitle = 'Start-up title must be at least 5 characters long'
      }
      if (!formData.projectType) {
        errors.projectType = 'Start-up type is required'
      }
      const reportError = validateFileField('projectReport', files.projectReport)
      if (reportError) errors.projectReport = reportError
    } else {
      getActiveFields(formData).forEach((name) => {
        const message = fieldValidators[name](formData[name], formData)
        if (message) errors[name] = message
      })
      getActiveFileFields(formData).forEach((name) => {
        const message = validateFileField(name, files[name])
        if (message) errors[name] = message
      })
    }

    setFormErrors(errors)
    if (Object.keys(errors).length > 0) scrollToFirstError(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')

    // hard block if uploads closed
    if (!uploadsEnabled) {
      alert(uploadsClosedReason || 'Uploads are currently closed. Please contact your mentor.')
      return
    }

    if (!validateForm()) {
      return
    }

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('semesterType', semesterType)

      const payload = { ...formData }
      Object.keys(payload).forEach((key) => {
        if (typeof payload[key] === 'string') payload[key] = payload[key].trim()
      })
      payload.mentorEmail = payload.mentorEmail.toLowerCase()
      payload.hrEmail = payload.hrEmail.toLowerCase()
      if (payload.companyType !== 'other') delete payload.companyTypeOther
      if (!payload.hasStipend) delete payload.stipendAmount
      if (!isProjectType) {
        delete payload.projectTitle
        delete payload.projectType
      }

      Object.entries(payload).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formDataToSend.append(key, value.toString())
        }
      })

      Object.entries(files).forEach(([key, file]) => {
        if (!file) return
        if (key === 'stipendProof' && !formData.hasStipend) return
        formDataToSend.append(key, file)
      })

      setIsUploading(true)
      setUploadProgress(0)
      setSubmitPhase('uploading')
      try {
        await execute(() =>
          studentService.submitRegistration(formDataToSend, (percent) => {
            setUploadProgress(percent)
            // Bytes finished sending but server hasn't responded yet
            if (percent >= 100) {
              setSubmitPhase('processing')
            }
          })
        )
      } finally {
        setIsUploading(false)
      }
      navigate('/student/dashboard')
    } catch (error) {
      console.error('❌ Error submitting registration:', error)

      if (error.response) {
        if (error.response.status === 403) {
          setUploadsEnabled(false)
          setUploadsClosedReason(error.response.data?.message || 'Uploads are currently closed.')
          alert(error.response.data?.message || 'Uploads are currently closed. Please contact your mentor.')
          return
        }

        const serverErrors = error.response.data?.errors
        if (Array.isArray(serverErrors) && serverErrors.length > 0) {
          const fieldErrors = {}
          const general = []
          serverErrors.forEach((err) => {
            if (err && typeof err === 'object') {
              const field = err.path || err.field
              const message = err.msg || err.message || 'Invalid value'
              if (field && field in formData && !fieldErrors[field]) fieldErrors[field] = message
              else general.push(message)
            } else {
              general.push(String(err))
            }
          })
          setFormErrors((prev) => ({ ...prev, ...fieldErrors }))
          if (Object.keys(fieldErrors).length > 0) scrollToFirstError(fieldErrors)
          setSubmitError(
            general.length > 0
              ? general.join(' • ')
              : 'Please correct the highlighted fields and try again.'
          )
        } else {
          setSubmitError(error.response.data?.message || 'Submission failed. Please try again.')
        }
      } else if (error.request) {
        setSubmitError('Unable to reach the server. Please check your internet connection and try again.')
      } else {
        setSubmitError(error.message || 'Something went wrong. Please try again.')
      }
    }
  }

  // ─── Uploads Closed screen ────────────────────────────────────────────────
  if (!checkingAccess && !uploadsEnabled) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
        <div className="mx-auto w-full max-w-md">
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <Lock className="h-7 w-7 text-red-600" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-slate-900">Uploads Closed</h2>
            <p className="mb-6 leading-relaxed text-slate-600">
              {uploadsClosedReason ||
                'Document uploads are currently unavailable. Please contact your mentor or administrator.'}
            </p>
            <button
              onClick={() => navigate('/student/dashboard')}
              className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-slate-800 px-6 text-sm font-semibold text-white transition hover:bg-slate-900"
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
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-2xl font-semibold text-slate-900 sm:text-3xl">8th Semester - Choose Your Path</h1>
            <p className="text-slate-600">Select whether you want to do an internship or start-up</p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div
              onClick={() => setSelectedSubType('internship')}
              className="cursor-pointer rounded-xl border border-slate-200 bg-white p-8 text-center transition hover:border-blue-500"
            >
              <Building className="mx-auto mb-4 h-12 w-12 text-blue-600" />
              <h3 className="mb-2 text-xl font-semibold text-slate-900">Internship</h3>
              <p className="text-slate-600">Industry internship with MPR submissions</p>
            </div>

            <div
              onClick={() => setSelectedSubType('Start-up')}
              className="cursor-pointer rounded-xl border border-slate-200 bg-white p-8 text-center transition hover:border-blue-500"
            >
              <Code className="mx-auto mb-4 h-12 w-12 text-blue-600" />
              <h3 className="mb-2 text-xl font-semibold text-slate-900">Start-up</h3>
              <p className="text-slate-600">Innovation & start-up work with final report</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const busy = loading || isUploading

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
              {semesterType.replace('_', ' ').toUpperCase()}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              {isProjectType ? 'Start-up Registration' : 'Internship Registration'}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Complete your registration details. Fields marked <span className="text-red-500">*</span> are required.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/student/choice')}
            className="inline-flex h-10 items-center self-start rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 sm:self-auto"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </button>
        </header>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {isProjectType ? (
            <SectionCard icon={Code} title="Start-up Details">
              <div className="space-y-5">
                <Field name="projectTitle" label="Start-up Title" required error={formErrors.projectTitle}>
                  <input type="text" {...bind('projectTitle')} placeholder="Enter your Start-up title" />
                </Field>
                <Field name="projectType" label="Start-up Type" required error={formErrors.projectType}>
                  <Select {...bind('projectType')} placeholder="Select Start-up type" options={PROJECT_TYPE_OPTIONS} />
                </Field>
                <div id="field-projectReport">
                  <FileUpload
                    onFileSelect={(file) => handleFileSelect('projectReport', file)}
                    accept=".pdf"
                    allowedTypes={['pdf']}
                    maxSize={MAX_FILE_SIZE}
                    label="Start-up Report Document"
                    required
                    error={formErrors.projectReport}
                  />
                </div>
              </div>
            </SectionCard>
          ) : (
            <>
              {/* Company Information */}
              <SectionCard
                icon={Building2}
                title="Company Information"
                description="Details of the organisation where you will be interning."
              >
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
                  <Field name="companyName" label="Company Name" required error={formErrors.companyName}>
                    <input
                      type="text"
                      {...bind('companyName')}
                      maxLength={100}
                      autoComplete="organization"
                      placeholder="Enter company name"
                    />
                  </Field>

                  <Field name="companyType" label="Company Type" required error={formErrors.companyType}>
                    <Select {...bind('companyType')} placeholder="Select type" options={COMPANY_TYPE_OPTIONS} />
                  </Field>

                  {formData.companyType === 'other' && (
                    <Field
                      name="companyTypeOther"
                      label="Specify Company Type"
                      required
                      error={formErrors.companyTypeOther}
                      className="md:col-span-2"
                    >
                      <input
                        type="text"
                        {...bind('companyTypeOther')}
                        maxLength={50}
                        placeholder="e.g., NGO, Consulting Firm, Healthcare"
                      />
                    </Field>
                  )}

                  <Field
                    name="companyFullAddress"
                    label="Company Full Address"
                    required
                    error={formErrors.companyFullAddress}
                    hint="Include building, street, city, state and PIN code."
                    className="md:col-span-2"
                  >
                    <textarea
                      rows={3}
                      {...bind('companyFullAddress')}
                      maxLength={300}
                      placeholder="e.g., TechnoDuxx Pvt Ltd., Plot No. 9, Aditya Avenue, Airport Road, Bhopal, Madhya Pradesh 462080"
                    />
                  </Field>

                  <Field name="typeOfWork" label="Type of Work" required error={formErrors.typeOfWork}>
                    <Select {...bind('typeOfWork')} placeholder="Select work type" options={WORK_TYPE_OPTIONS} />
                  </Field>

                  <Field name="internshipType" label="Internship Type" required error={formErrors.internshipType}>
                    <Select {...bind('internshipType')} placeholder="Select type" options={INTERNSHIP_TYPE_OPTIONS} />
                  </Field>

                  <Field name="internshipDomain" label="Internship Domain" required error={formErrors.internshipDomain}>
                    <input
                      type="text"
                      {...bind('internshipDomain')}
                      maxLength={100}
                      placeholder="e.g., Web Development, AI/ML, Data Science"
                    />
                  </Field>

                  <Field
                    name="internshipTitle"
                    label="Internship Title"
                    required
                    error={formErrors.internshipTitle}
                    hint="Between 5 and 100 characters."
                  >
                    <input
                      type="text"
                      {...bind('internshipTitle')}
                      maxLength={100}
                      placeholder="Enter internship title"
                    />
                  </Field>
                </div>
              </SectionCard>

              {/* Duration */}
              <SectionCard icon={Calendar} title="Duration & Dates" description="The official start and end dates of your internship.">
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
                  <Field name="startDate" label="Start Date" required error={formErrors.startDate}>
                    <input type="date" {...bind('startDate')} min="2000-01-01" max="2100-12-31" />
                  </Field>

                  <Field name="endDate" label="End Date" required error={formErrors.endDate}>
                    <input
                      type="date"
                      {...bind('endDate')}
                      min={formData.startDate || '2000-01-01'}
                      max="2100-12-31"
                    />
                  </Field>
                </div>
              </SectionCard>

              {/* Stipend */}
              <SectionCard icon={IndianRupee} title="Stipend Information" description="Let us know if this internship is paid.">
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${
                    formData.hasStipend ? 'border-blue-300 bg-blue-50/60' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    name="hasStipend"
                    checked={formData.hasStipend}
                    onChange={handleChange}
                    className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 accent-blue-700"
                  />
                  <span>
                    <span className="block text-sm font-medium text-slate-900">This internship offers a stipend</span>
                    <span className="block text-sm text-slate-500">
                      Select this to enter the amount and upload a proof document.
                    </span>
                  </span>
                </label>

                {formData.hasStipend && (
                  <div className="mt-5 grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
                    <Field name="stipendAmount" label="Stipend Amount (₹)" required error={formErrors.stipendAmount}>
                      <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-500">
                          ₹
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          {...bind('stipendAmount')}
                          className={`${inputClass(Boolean(formErrors.stipendAmount))} pl-8`}
                          placeholder="Enter stipend amount"
                        />
                      </div>
                    </Field>

                    <div id="field-stipendProof">
                      <FileUpload
                        onFileSelect={(file) => handleFileSelect('stipendProof', file)}
                        accept=".pdf"
                        allowedTypes={['pdf']}
                        maxSize={MAX_FILE_SIZE}
                        label="Stipend Proof Document"
                        required
                        error={formErrors.stipendProof}
                      />
                    </div>
                  </div>
                )}
              </SectionCard>

              {/* Mentor, HR & Student contact */}
              <SectionCard
                icon={Users}
                title="Mentor & HR Details"
                description="Contact details we may use to verify your internship."
              >
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
                  <SubHeading>Industry Mentor</SubHeading>

                  <Field name="mentorName" label="Industry Mentor Name" required error={formErrors.mentorName}>
                    <input type="text" {...bind('mentorName')} maxLength={50} placeholder="Enter mentor name" />
                  </Field>

                  <Field name="mentorRole" label="Industry Mentor Role in Company" required error={formErrors.mentorRole}>
                    <input
                      type="text"
                      {...bind('mentorRole')}
                      maxLength={100}
                      placeholder="e.g., Senior Software Engineer, Team Lead"
                    />
                  </Field>

                  <Field name="mentorEmail" label="Industry Mentor Email" required error={formErrors.mentorEmail}>
                    <input
                      type="email"
                      {...bind('mentorEmail')}
                      maxLength={254}
                      autoComplete="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      placeholder="mentor@company.com"
                    />
                  </Field>

                  <Field
                    name="mentorContactNumber"
                    label="Industry Mentor Contact Number"
                    required
                    error={formErrors.mentorContactNumber}
                    hint="10-digit mobile number."
                  >
                    <input
                      type="tel"
                      inputMode="numeric"
                      {...bind('mentorContactNumber')}
                      autoComplete="off"
                      placeholder="Enter mentor's contact number"
                    />
                  </Field>

                  <SubHeading>HR Contact</SubHeading>

                  <Field name="hrName" label="HR Name" required error={formErrors.hrName}>
                    <input type="text" {...bind('hrName')} maxLength={50} placeholder="Enter HR name" />
                  </Field>

                  <Field name="hrEmail" label="HR Email" required error={formErrors.hrEmail}>
                    <input
                      type="email"
                      {...bind('hrEmail')}
                      maxLength={254}
                      autoComplete="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      placeholder="hr@company.com"
                    />
                  </Field>

                  <SubHeading>Your Contact</SubHeading>

                  <Field
                    name="studentMobileNumber"
                    label="Student Mobile Number"
                    required
                    error={formErrors.studentMobileNumber}
                    hint="10-digit mobile number."
                  >
                    <input
                      type="tel"
                      inputMode="numeric"
                      {...bind('studentMobileNumber')}
                      autoComplete="tel-national"
                      placeholder="Enter your mobile number"
                    />
                  </Field>
                </div>
              </SectionCard>

              {/* Documents */}
              <SectionCard
                icon={FileText}
                title="Required Documents"
                description="Upload clear, readable copies of the documents below."
              >
                <div className="mb-5 flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-sm text-slate-600">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                  <p>
                    Each file must be <span className="font-medium text-slate-800">2 MB or smaller</span>. Offer letter,
                    NOC and stipend proof must be PDF. The preliminary review file can be PDF or PPT/PPTX.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
                  <div id="field-offerLetter">
                    <FileUpload
                      onFileSelect={(file) => handleFileSelect('offerLetter', file)}
                      accept=".pdf"
                      allowedTypes={['pdf']}
                      maxSize={MAX_FILE_SIZE}
                      label="Offer Letter"
                      required
                      error={formErrors.offerLetter}
                    />
                  </div>

                  <div id="field-nocLetter">
                    <FileUpload
                      onFileSelect={(file) => handleFileSelect('nocLetter', file)}
                      accept=".pdf"
                      allowedTypes={['pdf']}
                      maxSize={MAX_FILE_SIZE}
                      label="NOC Letter"
                      required
                      error={formErrors.nocLetter}
                    />
                  </div>

                  <div id="field-synopsisPPT" className="md:col-span-2">
                    <FileUpload
                      onFileSelect={(file) => handleFileSelect('synopsisPPT', file)}
                      accept=".pdf,.ppt,.pptx"
                      allowedTypes={['pdf', 'ppt', 'pptx']}
                      maxSize={MAX_FILE_SIZE}
                      label="Preliminary Review: Presentation of Synopsis/Outline, Identification of Outcomes (PDF / PPT)"
                      required
                      error={formErrors.synopsisPPT}
                    />
                  </div>
                </div>
              </SectionCard>
            </>
          )}

          {isUploading && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              {submitPhase === 'uploading' ? (
                <>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">Uploading documents...</span>
                    <span className="text-sm font-semibold text-blue-700">{uploadProgress}%</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-2.5 rounded-full bg-blue-700 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-slate-700">
                      Files uploaded — processing your submission...
                    </span>
                    <span className="shrink-0 text-sm font-semibold text-green-600">Almost done</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                    {/* Indeterminate bar: upload finished, server still working */}
                    <div className="h-2.5 w-1/3 animate-[indeterminate_1.2s_ease-in-out_infinite] rounded-full bg-blue-700" />
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

          {submitError && (
            <div
              ref={submitErrorRef}
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <div>
                <p className="font-semibold">We couldn&apos;t submit your registration</p>
                <p className="mt-0.5">{submitError}</p>
              </div>
            </div>
          )}

          {/* Action bar — sticks to bottom on mobile */}
          <div className="sticky bottom-0 z-10 -mx-4 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:rounded-xl sm:border sm:p-5 sm:shadow-sm">
            <div className="flex gap-3 sm:justify-end">
              <button
                type="button"
                onClick={() => navigate('/student/choice')}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-lg border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:flex-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy || !uploadsEnabled}
                className="inline-flex h-11 flex-[2] items-center justify-center rounded-lg bg-blue-700 px-6 text-sm font-semibold text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[200px] sm:flex-none"
              >
                {busy ? (
                  <>
                    <div className="mr-3 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
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
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
              <Info className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-slate-900">What happens next?</h4>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Your registration will be reviewed by your assigned mentor. Once approved, you&apos;ll be able to proceed
                with the next steps based on your semester type.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegistrationForm