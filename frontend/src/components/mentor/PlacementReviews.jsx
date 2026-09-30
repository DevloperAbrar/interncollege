import React, { useState, useEffect } from 'react'
import { mentorService } from '../../services/mentorService'
import { formatDateTime } from '../../utils/helpers'

const FILTERS = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all', label: 'All' }
]

const SEM_LABEL = {
  any_internship: 'Any Internship',
  '6th_internship': '6th Sem Internship',
  '7th_internship': '7th Sem Internship',
  '8th_internship': '8th Sem Internship',
  '8th_project': '8th Sem Project'
}

const TYPE_LABEL = { off_campus: 'Off campus', close_campus: 'Close campus' }
const PLAN_LABEL = {
  higher_study: 'Higher study',
  job_preparation: 'Job preparation',
  not_applicable: 'Not applicable'
}
const EXAM_LABEL = { none: 'None', gate: 'GATE', cat: 'CAT', gre: 'GRE', other: 'Other exam' }

const STATUS_STYLE = {
  pending: 'bg-amber-50 text-amber-800 border-amber-200',
  approved: 'bg-green-50 text-green-800 border-green-200',
  rejected: 'bg-red-50 text-red-800 border-red-200'
}
const STATUS_LABEL = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' }

const StatusPill = ({ status }) => (
  <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded border ${STATUS_STYLE[status] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
    {STATUS_LABEL[status] || status}
  </span>
)

const Row = ({ label, value }) => (
  <div className="py-2.5 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
    <dt className="text-sm text-gray-500">{label}</dt>
    <dd className="sm:col-span-2 text-sm text-gray-900 break-words whitespace-pre-line">{value || '-'}</dd>
  </div>
)

const examsToText = (pd) =>
  (pd.clearedExams || [])
    .map((e) => (e === 'other' ? `Other exam (${pd.clearedExamOther || ''})` : EXAM_LABEL[e] || e))
    .join(', ')

const PlacementReviews = ({ onPendingCountChange }) => {
  const [filter, setFilter] = useState('pending')
  const [items, setItems] = useState([])
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 })
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [notice, setNotice] = useState('')

  const [selected, setSelected] = useState(null)
  const [feedback, setFeedback] = useState('')
  const [modalError, setModalError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    load(filter)
  }, [filter])

  const load = async (status) => {
    try {
      setLoading(true)
      setLoadError('')
      const response = await mentorService.getPlacementDetails(status)
      const data = response.data || {}
      setItems(data.items || [])
      setCounts(data.counts || { pending: 0, approved: 0, rejected: 0 })
      if (onPendingCountChange) onPendingCountChange(data.counts?.pending || 0)
    } catch (error) {
      console.error('Error loading placement details:', error)
      setLoadError(error.response?.data?.message || 'Could not load placement details')
    } finally {
      setLoading(false)
    }
  }

  const openItem = (item) => {
    setSelected(item)
    setFeedback('')
    setModalError('')
  }

  const closeModal = () => {
    if (saving) return
    setSelected(null)
    setFeedback('')
    setModalError('')
  }

  const handleReview = async (action) => {
    if (action === 'reject' && !feedback.trim()) {
      setModalError('Write what the student needs to correct before rejecting.')
      return
    }
    try {
      setSaving(true)
      setModalError('')
      const response = await mentorService.reviewPlacementDetails(selected._id, action, feedback.trim())
      setNotice(response.message || 'Review saved')
      setSelected(null)
      setFeedback('')
      await load(filter)
    } catch (error) {
      setModalError(error.response?.data?.message || 'Could not save the review. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const pd = selected?.placementDetails
  const isPending = pd?.status === 'pending'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const count = f.key === 'all' ? counts.pending + counts.approved + counts.rejected : counts[f.key]
          const active = filter === f.key
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 text-sm rounded-md border ${
                active
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {f.label} ({count})
            </button>
          )
        })}
      </div>

      {notice && (
        <div className="flex items-start justify-between border border-green-200 bg-green-50 rounded-md px-4 py-3">
          <p className="text-sm text-green-800">{notice}</p>
          <button type="button" onClick={() => setNotice('')} className="text-sm text-green-800 hover:underline ml-4">
            Dismiss
          </button>
        </div>
      )}

      {loadError && (
        <div className="border border-red-200 bg-red-50 rounded-md px-4 py-3 text-sm text-red-700">{loadError}</div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Student', 'Type', 'Placed', 'Company', 'Package (LPA)', 'Submitted', 'Status', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-500">Loading...</td>
              </tr>
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-500">
                  {filter === 'pending' ? 'No placement details waiting for review' : 'Nothing to show here'}
                </td>
              </tr>
            )}
            {!loading &&
              items.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">{item.studentName}</div>
                    <div className="text-xs text-gray-500">{item.enrollmentNo}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{SEM_LABEL[item.semesterType] || item.semesterType}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {item.placementDetails?.hasPlacement ? 'Yes' : 'No'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{item.placementDetails?.companyName || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{item.placementDetails?.packageLPA ?? 0}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                    {formatDateTime(item.placementDetails?.submittedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={item.placementDetails?.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openItem(item)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {item.placementDetails?.status === 'pending' ? 'Review' : 'View'}
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {selected && pd && (
        <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-50 overflow-y-auto">
          <div className="min-h-full flex items-start justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl my-6">
              <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Placement details</h2>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {selected.studentName} ({selected.enrollmentNo}) | {SEM_LABEL[selected.semesterType] || selected.semesterType}
                  </p>
                </div>
                <StatusPill status={pd.status} />
              </div>

              <div className="px-6 py-2">
                <dl className="divide-y divide-gray-100">
                  <Row label="Have you placed in any company?" value={pd.hasPlacement ? 'Yes' : 'No'} />
                  {pd.hasPlacement && (
                    <Row label="Placed off campus or close campus?" value={TYPE_LABEL[pd.placementType]} />
                  )}
                  {pd.hasPlacement && <Row label="Name of company" value={pd.companyName} />}
                  <Row label="Placement package (yearly, in lakhs)" value={String(pd.packageLPA ?? 0)} />
                  {pd.hasPlacement && <Row label="Offer letter or proof" value={pd.offerProof} />}
                  <Row label="Higher study or job preparation?" value={PLAN_LABEL[pd.nextPlan]} />
                  <Row label="Cleared GATE / CAT / GRE or other exam?" value={examsToText(pd)} />
                  {(pd.clearedExams || []).some((e) => e !== 'none') && (
                    <Row label="Score card details" value={pd.scoreCardDetails} />
                  )}
                  <Row label="Internship / project" value={selected.organization} />
                  <Row label="Submitted on" value={formatDateTime(pd.submittedAt)} />
                  {!isPending && pd.reviewedAt && <Row label="Reviewed on" value={formatDateTime(pd.reviewedAt)} />}
                  {!isPending && pd.feedback && <Row label="Your feedback" value={pd.feedback} />}
                </dl>
              </div>

              {isPending && (
                <div className="px-6 pb-2 pt-3 border-t border-gray-100">
                  <label className="block text-sm font-medium text-gray-900 mb-1">Feedback</label>
                  <p className="text-xs text-gray-500 mb-2">
                    Required if you reject. Approving marks this internship or project as completed.
                  </p>
                  <textarea
                    rows={3}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    maxLength={1000}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {modalError && <p className="text-sm text-red-600 mt-2">{modalError}</p>}
                </div>
              )}

              <div className="px-6 py-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  Close
                </button>
                {isPending && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleReview('reject')}
                      disabled={saving}
                      className="px-4 py-2 text-sm rounded-md border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-60"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReview('approve')}
                      disabled={saving}
                      className="px-4 py-2 text-sm rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
                    >
                      {saving ? 'Saving...' : 'Approve'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PlacementReviews