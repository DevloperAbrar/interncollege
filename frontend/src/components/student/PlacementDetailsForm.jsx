import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { studentService } from '../../services/studentService'
import { formatDateTime } from '../../utils/helpers'
import FileUpload from '../common/FileUpload'
import { ArrowLeft } from 'lucide-react'

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2 MB

const PLACEMENT_TYPES = [
  { value: 'off_campus', label: 'Off campus' },
  { value: 'close_campus', label: 'Close campus' }
]

const NEXT_PLANS = [
  { value: 'higher_study', label: 'Higher study' },
  { value: 'job_preparation', label: 'Job preparation' },
  { value: 'not_applicable', label: 'Not applicable' }
]

const EXAMS = [
  { value: 'gate', label: 'GATE' },
  { value: 'cat', label: 'CAT' },
  { value: 'gre', label: 'GRE' },
  { value: 'other', label: 'Other exam' }
]

const EXAM_LABEL = { none: 'None', gate: 'GATE', cat: 'CAT', gre: 'GRE', other: 'Other exam' }
const PLAN_LABEL = Object.fromEntries(NEXT_PLANS.map((p) => [p.value, p.label]))
const TYPE_LABEL = Object.fromEntries(PLACEMENT_TYPES.map((p) => [p.value, p.label]))

const MPR_SEMESTERS = ['7th_internship', '8th_internship', '8th_project']

const EMPTY_FORM = {
  hasPlacement: '',
  placementType: '',
  companyName: '',
  packageLPA: '',
  nextPlan: '',
  clearedExams: [],
  clearedExamOther: '',
  scoreCardDetails: ''
}

const inputClass = (hasError) =>
  `w-full rounded-md border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
    hasError ? 'border-red-400' : 'border-gray-300'
  }`

const Field = ({ label, hint, error, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-900 mb-1">{label}</label>
    {hint && <p className="text-xs text-gray-500 mb-2">{hint}</p>}
    {children}
    {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
  </div>
)

const SummaryRow = ({ label, value }) => (
  <div className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
    <dt className="text-sm text-gray-500">{label}</dt>
    <dd className="sm:col-span-2 text-sm text-gray-900 break-words whitespace-pre-line">{value || '-'}</dd>
  </div>
)

const examsToText = (details) =>
  (details.clearedExams || [])
    .map((e) => (e === 'other' ? `Other exam (${details.clearedExamOther || ''})` : EXAM_LABEL[e] || e))
    .join(', ')

const OfferLetterValue = ({ details }) => {
  if (details.offerProofDocument) {
    return (
      <a
        href={details.offerProofDocument}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 underline"
      >
        View uploaded offer letter (PDF)
      </a>
    )
  }
  return details.offerProof || '-'
}

const PlacementDetailsSummary = ({ details }) => {
  const placed = details.hasPlacement === true
  const hasExam = (details.clearedExams || []).some((e) => e !== 'none')
  return (
    <dl className="divide-y divide-gray-100">
      <SummaryRow label="Have you placed in any company?" value={placed ? 'Yes' : 'No'} />
      {placed && <SummaryRow label="Placed off campus or close campus?" value={TYPE_LABEL[details.placementType]} />}
      {placed && <SummaryRow label="Name of company" value={details.companyName} />}
      <SummaryRow label="Placement package (yearly, in lakhs)" value={String(details.packageLPA ?? 0)} />
      {placed && <SummaryRow label="Offer letter or proof" value={<OfferLetterValue details={details} />} />}
      <SummaryRow label="Higher study or job preparation?" value={PLAN_LABEL[details.nextPlan]} />
      <SummaryRow label="Cleared GATE / CAT / GRE or other exam?" value={examsToText(details)} />
      {hasExam && <SummaryRow label="Score card details" value={details.scoreCardDetails} />}
    </dl>
  )
}

const PlacementDetailsForm = () => {
  const navigate = useNavigate()
  const [state, setState] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [offerFile, setOfferFile] = useState(null)
  const [errors, setErrors] = useState({})
  const [generalError, setGeneralError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [uploadPercent, setUploadPercent] = useState(0)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setLoadError('')
      const response = await studentService.getPlacementDetails()
      const data = response.data
      setState(data)

      // Pre-fill when the mentor sent it back for changes
      const pd = data?.placementDetails
      if (data?.eligible && data.canEdit && pd) {
        setForm({
          hasPlacement: pd.hasPlacement === true ? 'yes' : pd.hasPlacement === false ? 'no' : '',
          placementType: pd.placementType || '',
          companyName: pd.companyName || '',
          packageLPA: pd.hasPlacement && pd.packageLPA ? String(pd.packageLPA) : '',
          nextPlan: pd.nextPlan || '',
          clearedExams: pd.clearedExams || [],
          clearedExamOther: pd.clearedExamOther || '',
          scoreCardDetails: pd.scoreCardDetails || ''
        })
      }
    } catch (error) {
      console.error('Error loading placement details:', error)
      setLoadError(error.response?.data?.message || 'Could not load this page. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const handleOfferFile = (file) => {
    setOfferFile(file)
    if (errors.offerProofDocument) setErrors((prev) => ({ ...prev, offerProofDocument: undefined }))
  }

  const toggleExam = (value) => {
    setForm((prev) => {
      let next
      if (value === 'none') {
        next = prev.clearedExams.includes('none') ? [] : ['none']
      } else {
        const without = prev.clearedExams.filter((e) => e !== 'none')
        next = without.includes(value) ? without.filter((e) => e !== value) : [...without, value]
      }
      return { ...prev, clearedExams: next }
    })
    if (errors.clearedExams) setErrors((prev) => ({ ...prev, clearedExams: undefined }))
  }

  const placed = form.hasPlacement === 'yes'
  const hasExam = form.clearedExams.some((e) => e !== 'none')
  const hasOtherExam = form.clearedExams.includes('other')
  const existingDocument = state?.placementDetails?.offerProofDocument || ''

  const validate = () => {
    const e = {}
    if (!form.hasPlacement) e.hasPlacement = 'Please select Yes or No'

    if (placed) {
      if (!form.placementType) e.placementType = 'Select off campus or close campus'
      if (form.companyName.trim().length < 2) e.companyName = 'Enter the full name of the company'
      const pkg = Number(form.packageLPA)
      if (form.packageLPA === '' || Number.isNaN(pkg) || pkg <= 0) {
        e.packageLPA = 'Enter the yearly package in lakhs (greater than 0)'
      }
      if (!offerFile && !existingDocument) {
        e.offerProofDocument = 'Upload the offer letter or proof as a PDF (max 2 MB)'
      }
    }

    if (!form.nextPlan) e.nextPlan = 'Please select one option'
    if (form.clearedExams.length === 0) e.clearedExams = 'Select the exam(s) you have cleared, or "None"'
    if (hasOtherExam && form.clearedExamOther.trim().length < 2) e.clearedExamOther = 'Enter the name of the exam'
    if (hasExam && form.scoreCardDetails.trim().length < 3) {
      e.scoreCardDetails = 'Enter your score card details (exam, year, score or rank)'
    }
    return e
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setGeneralError('')

    const found = validate()
    setErrors(found)
    if (Object.keys(found).length > 0) {
      setGeneralError('Please correct the highlighted fields.')
      return
    }

    const fd = new FormData()
    fd.append('hasPlacement', placed ? 'true' : 'false')
    if (placed) {
      fd.append('placementType', form.placementType)
      fd.append('companyName', form.companyName.trim())
      fd.append('packageLPA', String(Number(form.packageLPA)))
      if (offerFile) fd.append('offerProofDocument', offerFile)
    }
    fd.append('nextPlan', form.nextPlan)
    fd.append('clearedExams', JSON.stringify(form.clearedExams))
    fd.append('clearedExamOther', hasOtherExam ? form.clearedExamOther.trim() : '')
    fd.append('scoreCardDetails', hasExam ? form.scoreCardDetails.trim() : '')

    try {
      setSubmitting(true)
      setUploadPercent(0)
      await studentService.submitPlacementDetails(fd, setUploadPercent)
      setOfferFile(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      await loadData()
    } catch (error) {
      const data = error.response?.data
      if (data?.errors) setErrors(data.errors)
      setGeneralError(data?.message || 'Could not submit your details. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const backButton = (
    <button
      type="button"
      onClick={() => navigate('/student/dashboard')}
      className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
    >
      <ArrowLeft className="h-4 w-4 mr-1" />
      Back to dashboard
    </button>
  )

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center text-gray-500 text-sm">Loading...</div>
    )
  }

  if (loadError) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4 space-y-4">
        {backButton}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-sm text-red-600 mb-4">{loadError}</p>
          <button
            type="button"
            onClick={loadData}
            className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (!state?.eligible) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4 space-y-4">
        {backButton}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Placement record details</h1>
          <p className="text-sm text-gray-600">
            {state?.reason || 'This form opens after your mentor approves your MPR documents and the Mid Sem evaluation.'}
          </p>
        </div>
      </div>
    )
  }

  const pd = state.placementDetails
  const isMprFlow = MPR_SEMESTERS.includes(state.semesterType)
  const afterApprovalText = isMprFlow
    ? 'your final report unlocks'
    : 'your internship is marked complete'

  // Submitted, waiting for the mentor
  if (!state.canEdit) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4 space-y-4">
        {backButton}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-lg font-semibold text-gray-900">Placement record details</h1>
            <p className="text-sm text-gray-600 mt-1">
              Submitted{pd?.submittedAt ? ` on ${formatDateTime(pd.submittedAt)}` : ''}. Your mentor is verifying
              these details. Once they are approved, {afterApprovalText}.
            </p>
          </div>
          <div className="px-6">{pd && <PlacementDetailsSummary details={pd} />}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-4">
      {backButton}

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-lg font-semibold text-gray-900">Placement record details</h1>
          <p className="text-sm text-gray-600 mt-1">
            Fill this in honestly. Your mentor verifies it, and once it is approved, {afterApprovalText}.
          </p>
        </div>

        {state.currentStep === 'placement_rejected' && pd?.feedback && (
          <div className="mx-6 mt-5 border border-red-200 bg-red-50 rounded-md px-4 py-3">
            <p className="text-sm font-medium text-red-800">Your mentor asked for changes</p>
            <p className="text-sm text-red-700 mt-1 whitespace-pre-line">{pd.feedback}</p>
          </div>
        )}

        {generalError && (
          <div className="mx-6 mt-5 border border-red-200 bg-red-50 rounded-md px-4 py-3">
            <p className="text-sm text-red-700">{generalError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6" noValidate>
          {/* 1 */}
          <Field label="Have you placed in any company?" error={errors.hasPlacement}>
            <div className="flex gap-6">
              {[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' }
              ].map((opt) => (
                <label key={opt.value} className="inline-flex items-center text-sm text-gray-800">
                  <input
                    type="radio"
                    name="hasPlacement"
                    value={opt.value}
                    checked={form.hasPlacement === opt.value}
                    onChange={() => setField('hasPlacement', opt.value)}
                    className="h-4 w-4 text-blue-600 border-gray-300 mr-2"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </Field>

          {placed && (
            <>
              {/* 2 */}
              <Field label="Placed off campus or close campus?" error={errors.placementType}>
                <div className="flex gap-6">
                  {PLACEMENT_TYPES.map((opt) => (
                    <label key={opt.value} className="inline-flex items-center text-sm text-gray-800">
                      <input
                        type="radio"
                        name="placementType"
                        value={opt.value}
                        checked={form.placementType === opt.value}
                        onChange={() => setField('placementType', opt.value)}
                        className="h-4 w-4 text-blue-600 border-gray-300 mr-2"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </Field>

              {/* 3 */}
              <Field label="Name of company" hint="Please fill the full name." error={errors.companyName}>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(e) => setField('companyName', e.target.value)}
                  maxLength={150}
                  className={inputClass(errors.companyName)}
                />
              </Field>

              {/* 4 */}
              <Field
                label="Placement package (yearly, in lakhs)"
                hint="For example 4.5 for 4.5 LPA."
                error={errors.packageLPA}
              >
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={form.packageLPA}
                  onChange={(e) => setField('packageLPA', e.target.value)}
                  className={inputClass(errors.packageLPA)}
                />
              </Field>

              {/* 5: PDF upload */}
              <div id="field-offerProofDocument">
                {existingDocument && (
                  <p className="text-sm text-gray-600 mb-2">
                    Currently uploaded:{' '}
                    <a
                      href={existingDocument}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      View file
                    </a>
                    . Upload a new PDF only if you want to replace it.
                  </p>
                )}
                <FileUpload
                  onFileSelect={handleOfferFile}
                  accept=".pdf"
                  allowedTypes={['pdf']}
                  maxSize={MAX_FILE_SIZE}
                  label="Company placement offer letter or any proof (email)"
                  required={!existingDocument}
                  error={errors.offerProofDocument}
                />
              </div>
            </>
          )}

          {form.hasPlacement === 'no' && (
            <p className="text-sm text-gray-500">Your placement package will be recorded as 0.</p>
          )}

          {/* 6 */}
          <Field label="Are you going for higher study or job preparation?" error={errors.nextPlan}>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {NEXT_PLANS.map((opt) => (
                <label key={opt.value} className="inline-flex items-center text-sm text-gray-800">
                  <input
                    type="radio"
                    name="nextPlan"
                    value={opt.value}
                    checked={form.nextPlan === opt.value}
                    onChange={() => setField('nextPlan', opt.value)}
                    className="h-4 w-4 text-blue-600 border-gray-300 mr-2"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </Field>

          {/* 7 */}
          <Field
            label="Cleared GATE / CAT / GRE exam or any other exam?"
            hint="Select every exam you have cleared."
            error={errors.clearedExams}
          >
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {EXAMS.map((opt) => (
                <label key={opt.value} className="inline-flex items-center text-sm text-gray-800">
                  <input
                    type="checkbox"
                    checked={form.clearedExams.includes(opt.value)}
                    onChange={() => toggleExam(opt.value)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded mr-2"
                  />
                  {opt.label}
                </label>
              ))}
              <label className="inline-flex items-center text-sm text-gray-800">
                <input
                  type="checkbox"
                  checked={form.clearedExams.includes('none')}
                  onChange={() => toggleExam('none')}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded mr-2"
                />
                None
              </label>
            </div>
          </Field>

          {hasOtherExam && (
            <Field label="Name of the other exam" error={errors.clearedExamOther}>
              <input
                type="text"
                value={form.clearedExamOther}
                onChange={(e) => setField('clearedExamOther', e.target.value)}
                maxLength={100}
                className={inputClass(errors.clearedExamOther)}
              />
            </Field>
          )}

          {/* 8 */}
          {hasExam && (
            <Field
              label="Score card details (GATE / CAT / GRE / other exam)"
              hint="Write the exam, year and your score or rank."
              error={errors.scoreCardDetails}
            >
              <textarea
                rows={3}
                value={form.scoreCardDetails}
                onChange={(e) => setField('scoreCardDetails', e.target.value)}
                maxLength={500}
                className={inputClass(errors.scoreCardDetails)}
              />
            </Field>
          )}

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate('/student/dashboard')}
              className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting
                ? (uploadPercent > 0 && uploadPercent < 100 ? `Uploading ${uploadPercent}%` : 'Submitting...')
                : 'Submit for verification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PlacementDetailsForm