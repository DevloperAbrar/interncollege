import React, { useState, useEffect } from 'react'
import { useApi } from '../../hooks/useApi'
import { mentorService } from '../../services/mentorService'
import { formatDateTime, formatCurrency } from '../../utils/helpers'
import Table from '../common/Table'
import FileUpload from '../common/FileUpload'
import {
  FileText,
  Eye,
  CheckCircle,
  XCircle,
  ExternalLink,
  Building,
  Calendar,
  DollarSign,
  User,
  AlertCircle,
  Download,
  Mail,
  Phone,
  MapPin,
  Clock,
  Award,
  Briefcase,
  FileCheck,
  Edit,
  Save,
  X as CloseIcon
} from 'lucide-react'

// StatusBadge component
const StatusBadge = ({ status }) => {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
      {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'}
    </span>
  )
}

const DocumentLink = ({ url, label, icon: Icon = FileText }) => {
  if (!url) return <span className="text-gray-400">Not provided</span>

  const getFullUrl = (rawUrl) => {
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      return rawUrl
    }
    if (rawUrl.startsWith('/uploads/')) {
      const backendBase = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'
      return `${backendBase}${rawUrl}`
    }
    return rawUrl
  }

  const handleOpenDocument = (e) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      if (url.includes('drive.google.com')) {
        let fileId = null
        const patterns = [
          /\/file\/d\/([a-zA-Z0-9-_]+)/,
          /id=([a-zA-Z0-9-_]+)/,
          /\/d\/([a-zA-Z0-9-_]+)/,
          /([a-zA-Z0-9-_]{25,})/
        ]
        for (const pattern of patterns) {
          const match = url.match(pattern)
          if (match) { fileId = match[1]; break }
        }
        if (fileId) {
          window.open(`https://drive.google.com/file/d/${fileId}/preview`, '_blank', 'width=900,height=700,scrollbars=yes')
        } else {
          window.open(url, '_blank')
        }
      } else {
        const fullUrl = getFullUrl(url)
        if (fullUrl.toLowerCase().endsWith('.pdf')) {
          window.open(fullUrl, '_blank')
        } else {
          const a = document.createElement('a')
          a.href = fullUrl
          a.target = '_blank'
          a.rel = 'noopener noreferrer'
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
        }
      }
    } catch (error) {
      console.error('Error opening document:', error)
    }
  }

  if (url.includes('drive.google.com')) {
    return (
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={handleOpenDocument}
          className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md"
        >
          <Icon className="h-4 w-4 mr-1" />
          {label}
          <ExternalLink className="h-3 w-3 ml-1" />
        </button>
        <span className="text-xs text-gray-500">Google Drive</span>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={handleOpenDocument}
      className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
    >
      <Icon className="h-4 w-4 mr-1" />
      {label}
      <ExternalLink className="h-3 w-3 ml-1" />
    </button>
  )
}

// Marks Input Components (keep existing)
const MarksInput = ({ label, value, onChange, max, required = false }) => {
  return (
    <div className="flex flex-col">
      <label className="text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
        <span className="text-gray-500 ml-1">(Max: {max})</span>
      </label>
      <input
        type="number"
        min="0"
        max={max}
        step="0.5"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  );
};

const RegistrationMarks = ({ marks, setMarks }) => {
  const updateMarks = (field, value) => {
    const newMarks = { ...marks, [field]: Math.min(value, getMax(field)) };
    setMarks(newMarks);
  };

  const getMax = (field) => {
    switch (field) {
      case 'objectiveProblemIdentification':
      case 'proposedMethodology':
      case 'relevanceRealWorld':
      case 'synopsisPresentation':
        return 5;
      default:
        return 0;
    }
  };

  const total =
    (marks.objectiveProblemIdentification || 0) +
    (marks.proposedMethodology || 0) +
    (marks.relevanceRealWorld || 0) +
    (marks.synopsisPresentation || 0);

  return (
    <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
      <h5 className="font-semibold text-gray-900 mb-4">Registration Marks Assignment (Max: 20)</h5>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MarksInput
          label="Objective/Problem Identification/Topic Selection"
          value={marks.objectiveProblemIdentification || 0}
          onChange={(val) => updateMarks('objectiveProblemIdentification', val)}
          max={5}
        />
        <MarksInput
          label="Proposed Methodology/Technical Details & Timeline"
          value={marks.proposedMethodology || 0}
          onChange={(val) => updateMarks('proposedMethodology', val)}
          max={5}
        />
        <MarksInput
          label="Relevance with Real World Problem"
          value={marks.relevanceRealWorld || 0}
          onChange={(val) => updateMarks('relevanceRealWorld', val)}
          max={5}
        />
        <MarksInput
          label="Synopsis/Presentation"
          value={marks.synopsisPresentation || 0}
          onChange={(val) => updateMarks('synopsisPresentation', val)}
          max={5}
        />
      </div>

      <div className="mt-4 pt-4 border-t border-blue-300">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-900">Total Registration Marks:</span>
          <span className="text-2xl font-bold text-blue-600">{total.toFixed(1)} / 20</span>
        </div>
      </div>
    </div>
  );
};

const MPRMarks = ({ marks, setMarks, mprType }) => {
  const maxMarks = 10;

  return (
    <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
      <h5 className="font-semibold text-gray-900 mb-4">{mprType?.toUpperCase()} Marks (Max: 10)</h5>

      <MarksInput
        label={`${mprType?.toUpperCase()} Document Quality & Content`}
        value={marks || 0}
        onChange={setMarks}
        max={maxMarks}
      />
    </div>
  );
};

const MidSemMarks = ({ marks, setMarks, semNumber }) => {
  const updateMarks = (field, value) => {
    const newMarks = { ...marks, [field]: Math.min(value, getMax(field)) };
    setMarks(newMarks);
  };

  const getMax = (field) => {
    switch (field) {
      case 'dailyDiary':
      case 'expectedAchievedOutcomes':
        return 20;
      case 'briefReport':
        return 30;
      case 'presentationViva':
        return 40;
      default:
        return 0;
    }
  };

  const total =
    (marks.dailyDiary || 0) +
    (marks.expectedAchievedOutcomes || 0) +
    (marks.briefReport || 0) +
    (marks.presentationViva || 0);

  return (
    <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-200">
      <h5 className="font-semibold text-gray-900 mb-4">Mid Semester {semNumber} Marks (Max: 100)</h5>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MarksInput
          label="Internship/Project Daily Diary"
          value={marks.dailyDiary || 0}
          onChange={(val) => updateMarks('dailyDiary', val)}
          max={10}
        />
        <MarksInput
          label="Expected/Achieved Outcomes & Social Relevance"
          value={marks.expectedAchievedOutcomes || 0}
          onChange={(val) => updateMarks('expectedAchievedOutcomes', val)}
          max={20}
        />
        <MarksInput
          label="Brief Internship/Project Report"
          value={marks.briefReport || 0}
          onChange={(val) => updateMarks('briefReport', val)}
          max={30}
        />
        <MarksInput
          label="Presentation & Viva"
          value={marks.presentationViva || 0}
          onChange={(val) => updateMarks('presentationViva', val)}
          max={40}
        />
      </div>

      <div className="mt-4 pt-4 border-t border-indigo-300">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-900">Total Mid Sem {semNumber} Marks:</span>
          <span className="text-2xl font-bold text-indigo-600">{total.toFixed(1)} / 100</span>
        </div>
      </div>
    </div>
  );
};

const FinalReportMarks = ({ marks, setMarks }) => {
  const updateMarks = (field, value) => {
    const newMarks = { ...marks, [field]: Math.min(value, getMax(field)) };
    setMarks(newMarks);
  };

  const getMax = (field) => {
    switch (field) {
      case 'dailyDiary':
        return 20;
      case 'projectOutcomes':
        return 30;
      case 'objectiveLiteratureReview':
      case 'methodologyArea':
      case 'workDescription':
      case 'dataResultDiscussion':
      case 'overallFormatPlagiarism':
      case 'defineObjective':
      case 'contentPresentation':
      case 'presentationSkill':
      case 'socialIndustrialRelevance':
      case 'questionAnswer':
        return 20;
      default:
        return 0;
    }
  };

  const reportTotal =
    (marks.objectiveLiteratureReview || 0) +
    (marks.methodologyArea || 0) +
    (marks.workDescription || 0) +
    (marks.dataResultDiscussion || 0) +
    (marks.overallFormatPlagiarism || 0);

  const presentationTotal =
    (marks.defineObjective || 0) +
    (marks.contentPresentation || 0) +
    (marks.presentationSkill || 0) +
    (marks.socialIndustrialRelevance || 0) +
    (marks.questionAnswer || 0);

  const grandTotal =
    (marks.dailyDiary || 0) +
    (marks.projectOutcomes || 0) +
    reportTotal +
    presentationTotal;

  return (
    <div className="bg-green-50 p-6 rounded-lg border border-green-200 space-y-6">
      <h5 className="font-semibold text-gray-900 mb-4">Final Report Marks Assignment (Max: 250)</h5>

      {/* Daily Diary and Outcomes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MarksInput
          label="Internship/Project Daily Diary"
          value={marks.dailyDiary || 0}
          onChange={(val) => updateMarks('dailyDiary', val)}
          max={20}
        />
        <MarksInput
          label="Internship/Project Outcomes"
          value={marks.projectOutcomes || 0}
          onChange={(val) => updateMarks('projectOutcomes', val)}
          max={30}
        />
      </div>

      {/* Final Report Section (100 marks) */}
      <div className="border-t border-green-300 pt-4">
        <h6 className="font-medium text-gray-900 mb-3">Final Report (Max: 100)</h6>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MarksInput
            label="Objective & Literature Review"
            value={marks.objectiveLiteratureReview || 0}
            onChange={(val) => updateMarks('objectiveLiteratureReview', val)}
            max={20}
          />
          <MarksInput
            label="Methodology/Area of Internship/Project"
            value={marks.methodologyArea || 0}
            onChange={(val) => updateMarks('methodologyArea', val)}
            max={20}
          />
          <MarksInput
            label="Hardware/Software/Work Description"
            value={marks.workDescription || 0}
            onChange={(val) => updateMarks('workDescription', val)}
            max={20}
          />
          <MarksInput
            label="Data Collection/Result/Discussion/Conclusion"
            value={marks.dataResultDiscussion || 0}
            onChange={(val) => updateMarks('dataResultDiscussion', val)}
            max={20}
          />
          <MarksInput
            label="Overall Format & Plagiarism"
            value={marks.overallFormatPlagiarism || 0}
            onChange={(val) => updateMarks('overallFormatPlagiarism', val)}
            max={20}
          />
        </div>
        <div className="mt-3 text-right">
          <span className="font-semibold text-green-700">Report Subtotal: {reportTotal.toFixed(1)} / 100</span>
        </div>
      </div>

      {/* Presentation Section (100 marks) */}
      <div className="border-t border-green-300 pt-4">
        <h6 className="font-medium text-gray-900 mb-3">Presentation & Q&A (Max: 100)</h6>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MarksInput
            label="Define Objective of the Work"
            value={marks.defineObjective || 0}
            onChange={(val) => updateMarks('defineObjective', val)}
            max={20}
          />
          <MarksInput
            label="Content of the Presentation"
            value={marks.contentPresentation || 0}
            onChange={(val) => updateMarks('contentPresentation', val)}
            max={20}
          />
          <MarksInput
            label="Presentation Skill"
            value={marks.presentationSkill || 0}
            onChange={(val) => updateMarks('presentationSkill', val)}
            max={20}
          />
          <MarksInput
            label="Relevance to Social & Industrial Need"
            value={marks.socialIndustrialRelevance || 0}
            onChange={(val) => updateMarks('socialIndustrialRelevance', val)}
            max={20}
          />
          <MarksInput
            label="Question-Answer"
            value={marks.questionAnswer || 0}
            onChange={(val) => updateMarks('questionAnswer', val)}
            max={20}
          />
        </div>
        <div className="mt-3 text-right">
          <span className="font-semibold text-green-700">Presentation Subtotal: {presentationTotal.toFixed(1)} / 100</span>
        </div>
      </div>

      {/* Grand Total */}
      <div className="mt-6 pt-4 border-t-2 border-green-400">
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-gray-900">Grand Total:</span>
          <span className="text-3xl font-bold text-green-600">{grandTotal.toFixed(1)} / 250</span>
        </div>
      </div>
    </div>
  );
};

// Main Component
const ReviewSubmissions = () => {
  const { execute, loading } = useApi()
  const [pendingSubmissions, setPendingSubmissions] = useState([])
  const [submissionHistory, setSubmissionHistory] = useState([])
  const [pagination, setPagination] = useState(null)
  const [activeTab, setActiveTab] = useState('pending')
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [reviewAction, setReviewAction] = useState('')
  const [feedback, setFeedback] = useState('')
  const [detailsLoading, setDetailsLoading] = useState(false)

  // Edit mode state
  const [editMode, setEditMode] = useState(false)
  const [editedData, setEditedData] = useState({})
  const [editedFiles, setEditedFiles] = useState({})

  // Marks state
  const [marks, setMarks] = useState({})

  useEffect(() => {
    if (activeTab === 'pending') {
      loadPendingSubmissions()
    } else {
      loadSubmissionHistory()
    }
  }, [activeTab])

  const loadPendingSubmissions = async (page = 1) => {
    try {
      const response = await execute(() => mentorService.getPendingSubmissions(page, 10))
      if (response?.success) {
        setPendingSubmissions(response.data.submissions || [])
        setPagination(response.data.pagination || null)
      }
    } catch (error) {
      console.error('Error loading pending submissions:', error)
      setPendingSubmissions([])
    }
  }

  const loadSubmissionHistory = async (page = 1) => {
    try {
      const response = await execute(() => mentorService.getSubmissionHistory(page, 10))
      if (response?.success) {
        setSubmissionHistory(response.data.submissions || [])
        setPagination(response.data.pagination || null)
      }
    } catch (error) {
      console.error('Error loading submission history:', error)
      setSubmissionHistory([])
    }
  }

  const handleViewDetails = async (submissionId) => {
    if (!submissionId) {
      alert('Invalid submission ID')
      return
    }

    setDetailsLoading(true)
    setShowModal(false)
    setSelectedSubmission(null)

    try {
      const response = await execute(() => mentorService.getSubmissionDetails(submissionId))

      if (response?.success && response.data) {
        setSelectedSubmission(response.data)
        setReviewAction('')
        setFeedback('')
        setEditMode(false)
        setEditedData({})
        setEditedFiles({})

        // Initialize marks based on review type
        if (response.data.reviewType === 'registration') {
          setMarks(response.data.registrationReview?.marks || {})
        } else if (response.data.reviewType === 'mpr') {
          const mprType = response.data.mprType
          if (mprType === 'midSem1' || mprType === 'midSem2') {
            setMarks(response.data.mprDetails?.marks || {})
          } else {
            setMarks({ simpleMarks: response.data.mprDetails?.marks || 0 })
          }
        } else if (response.data.reviewType === 'finalReport') {
          setMarks(response.data.finalReportReview?.marks || {})
        }

        setShowModal(true)
      } else {
        alert('Failed to load submission details')
      }
    } catch (error) {
      console.error('API error:', error)
      alert(`Failed to load submission details: ${error.message}`)
    } finally {
      setDetailsLoading(false)
    }
  }

  const handleSaveEdits = async () => {
    if (!selectedSubmission) return

    try {
      const formData = new FormData()

      // Determine update type
      let updateType = 'registration'
      if (selectedSubmission.reviewType === 'mpr') {
        updateType = 'mpr'
      } else if (selectedSubmission.reviewType === 'finalReport') {
        updateType = 'finalReport'
      }

      formData.append('updateType', updateType)

      // Add edited text data
      Object.entries(editedData).forEach(([key, value]) => {
        formData.append(key, value)
      })

      // Add edited files
      Object.entries(editedFiles).forEach(([key, file]) => {
        if (file) {
          formData.append(key, file)
        }
      })

      const response = await execute(() =>
        mentorService.updateSubmission(selectedSubmission._id, formData)
      )

      if (response?.success) {
        alert('Submission updated successfully')
        setEditMode(false)
        setEditedData({})
        setEditedFiles({})
        // Reload details
        handleViewDetails(selectedSubmission._id)
      }
    } catch (error) {
      console.error('Error saving edits:', error)
      alert('Failed to save edits: ' + error.message)
    }
  }

  const handleReview = async () => {
    if (!selectedSubmission || !reviewAction) {
      alert('Please select a review action')
      return
    }

    if (reviewAction === 'reject' && !feedback.trim()) {
      alert('Feedback is required for rejection')
      return
    }

    try {
      console.log('🔄 Starting review process:', {
        submissionId: selectedSubmission._id,
        reviewAction,
        reviewType: selectedSubmission.reviewType,
        marks
      });

      let submissionIdToUse = selectedSubmission._id;

      if (selectedSubmission.reviewType === 'mpr') {
        if (!selectedSubmission._id.includes('_') && selectedSubmission.originalSubmissionId) {
          submissionIdToUse = `${selectedSubmission.originalSubmissionId}_${selectedSubmission.mprType}`;
        }
      }

      // Prepare marks data based on review type
      let marksData = null
      if (reviewAction === 'approve') {
        if (selectedSubmission.reviewType === 'registration') {
          marksData = marks
        } else if (selectedSubmission.reviewType === 'mpr') {
          const mprType = selectedSubmission.mprType
          if (mprType === 'midSem1' || mprType === 'midSem2') {
            marksData = marks
          } else {
            marksData = marks.simpleMarks || 0
          }
        } else if (selectedSubmission.reviewType === 'finalReport') {
          marksData = marks
        }
      }

      const response = await execute(() => mentorService.reviewSubmission(
        submissionIdToUse,
        reviewAction,
        feedback,
        marksData
      ))

      if (response?.success) {
        const submissionType = selectedSubmission.reviewType === 'mpr' ?
          `${selectedSubmission.mprType?.toUpperCase()} MPR` :
          selectedSubmission.reviewType === 'finalReport' ? 'Final Report' : 'Registration';

        alert(`${submissionType} ${reviewAction}d successfully`)
        resetModal()

        if (activeTab === 'pending') {
          loadPendingSubmissions()
        } else {
          loadSubmissionHistory()
        }
      } else {
        console.error('❌ Review response was not successful:', response);
        alert('Failed to review submission: ' + (response?.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Error reviewing submission:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Please try again.';
      alert(`Failed to review submission: ${errorMessage}`);
    }
  }

  const resetModal = () => {
    setShowModal(false)
    setSelectedSubmission(null)
    setReviewAction('')
    setFeedback('')
    setEditMode(false)
    setEditedData({})
    setEditedFiles({})
    setMarks({})
  }

  // Helper to get submission display info
  const getSubmissionDisplayInfo = (submission) => {
    if (submission.reviewType === 'mpr') {
      return {
        type: submission.displayType || `${submission.mprType?.toUpperCase()} Review`,
        title: submission.displayType || `${submission.mprType?.toUpperCase()} Document`,
        companyName: submission.registrationDetails?.companyName,
        description: `MPR document submission for review`
      }
    }

    if (submission.reviewType === 'finalReport') {
      return {
        type: 'Final Report Review',
        title: 'Final Report',
        companyName: submission.registrationDetails?.companyName || submission.companyName,
        description: 'Final report submission for review'
      }
    }

    if (submission.type) {
      return {
        type: submission.type,
        companyName: submission.details?.companyName || submission.companyName,
        internshipTitle: submission.details?.internshipTitle || submission.internshipTitle,
        projectTitle: submission.details?.projectTitle || submission.projectTitle,
        projectType: submission.details?.projectType || submission.projectType
      }
    } else {
      const isInternship = submission.semesterType?.includes('internship')
      return {
        type: isInternship ? 'Internship Registration' : 'Project Registration',
        companyName: submission.companyName,
        internshipTitle: submission.internshipTitle,
        projectTitle: submission.projectTitle,
        projectType: submission.projectType
      }
    }
  }

  // Table columns
  const pendingColumns = [
    {
      header: 'Student',
      render: (submission) => (
        <div>
          <div className="font-medium text-gray-900">{submission.student?.name || submission.studentName || 'N/A'}</div>
          <div className="text-sm text-gray-500">{submission.student?.enrollmentNo || submission.enrollmentNo || 'N/A'}</div>
          <div className="text-sm text-gray-500">{submission.student?.branch || submission.branch || 'N/A'}</div>
        </div>
      )
    },
    {
      header: 'Type',
      render: (submission) => {
        const displayInfo = getSubmissionDisplayInfo(submission)
        return (
          <div className="flex items-center">
            <FileText className="h-4 w-4 text-gray-400 mr-2" />
            <div>
              <span className="capitalize font-medium">{displayInfo.type || 'N/A'}</span>
              {submission.reviewType === 'mpr' && (
                <div className="text-xs text-blue-600 mt-1">
                  {submission.mprType?.toUpperCase()} Document
                </div>
              )}
            </div>
          </div>
        )
      }
    },
    {
      header: 'Details',
      render: (submission) => {
        const displayInfo = getSubmissionDisplayInfo(submission)

        if (submission.reviewType === 'mpr') {
          return (
            <div>
              <div className="font-medium text-gray-900">{displayInfo.companyName || 'N/A'}</div>
              <div className="text-sm text-gray-500">{submission.mprType?.toUpperCase()} - {submission.semesterType}</div>
            </div>
          )
        }

        if (submission.reviewType === 'finalReport') {
          return (
            <div>
              <div className="font-medium text-gray-900">{displayInfo.companyName || 'Final Report'}</div>
              <div className="text-sm text-gray-500">{submission.semesterType}</div>
            </div>
          )
        }

        const isInternship = submission.semesterType?.includes('internship')
        return (
          <div>
            {isInternship ? (
              <>
                <div className="font-medium text-gray-900">{displayInfo.companyName || 'N/A'}</div>
                <div className="text-sm text-gray-500">{displayInfo.internshipTitle || 'N/A'}</div>
              </>
            ) : (
              <>
                <div className="font-medium text-gray-900">{displayInfo.projectTitle || 'N/A'}</div>
                <div className="text-sm text-gray-500">{displayInfo.projectType || 'N/A'}</div>
              </>
            )}
          </div>
        )
      }
    },
    {
      header: 'Submitted',
      render: (submission) => formatDateTime(submission.submittedDate || submission.createdAt)
    },
    {
      header: 'Actions',
      render: (submission) => (
        <button
          onClick={() => handleViewDetails(submission._id)}
          disabled={detailsLoading}
          className="text-blue-600 hover:text-blue-900 flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2 rounded-md hover:bg-blue-50"
        >
          <Eye className="h-4 w-4 mr-1" />
          {detailsLoading ? 'Loading...' : 'Review'}
        </button>
      )
    }
  ]

  const historyColumns = [
    {
      header: 'Student',
      render: (submission) => (
        <div>
          <div className="font-medium text-gray-900">{submission.student?.name || submission.studentName || 'N/A'}</div>
          <div className="text-sm text-gray-500">{submission.student?.enrollmentNo || submission.enrollmentNo || 'N/A'}</div>
        </div>
      )
    },
    {
      header: 'Type',
      render: (submission) => {
        const displayInfo = getSubmissionDisplayInfo(submission)
        return (
          <div>
            <span className="capitalize">{displayInfo.type || 'N/A'}</span>
            {submission.reviewType === 'mpr' && (
              <div className="text-xs text-blue-600 mt-1">
                {submission.mprType?.toUpperCase()}
              </div>
            )}
          </div>
        )
      }
    },
    {
      header: 'Status',
      render: (submission) => <StatusBadge status={submission.status || submission.currentReviewStatus} />
    },
    {
      header: 'Reviewed',
      render: (submission) => formatDateTime(submission.reviewedAt || submission.updatedAt)
    },
    {
      header: 'Actions',
      render: (submission) => (
        <button
          onClick={() => handleViewDetails(submission._id)}
          disabled={detailsLoading}
          className="text-blue-600 hover:text-blue-900 flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2 rounded-md hover:bg-blue-50"
        >
          <Eye className="h-4 w-4 mr-1" />
          {detailsLoading ? 'Loading...' : 'View'}
        </button>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Review Submissions</h1>
        <p className="text-gray-600">Review and approve student submissions</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'pending'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Pending Reviews ({pendingSubmissions.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'history'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Review History ({submissionHistory.length})
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'pending' && (
        <Table
          columns={pendingColumns}
          data={pendingSubmissions}
          loading={loading}
          pagination={pagination}
          onPageChange={loadPendingSubmissions}
          emptyMessage="No pending submissions"
        />
      )}

      {activeTab === 'history' && (
        <Table
          columns={historyColumns}
          data={submissionHistory}
          loading={loading}
          pagination={pagination}
          onPageChange={loadSubmissionHistory}
          emptyMessage="No submission history"
        />
      )}

      {/* Modal */}
      {showModal && selectedSubmission && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white max-h-[95vh] overflow-y-auto">
            <div className="mt-3">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedSubmission?.reviewType === 'finalReport' ? 'Final Report Review' :
                    selectedSubmission?.reviewType === 'mpr' ? `${selectedSubmission.mprDetails?.type?.toUpperCase()} Review` :
                      selectedSubmission?.semesterType?.includes('internship') ? 'Internship Registration Review' :
                        'Project Registration Review'}
                </h3>
                <div className="flex items-center space-x-3">
                  <StatusBadge status={selectedSubmission?.currentReviewStatus || selectedSubmission?.status} />
                  {selectedSubmission?.currentReviewStatus === 'pending' && (
                    <button
                      onClick={() => setEditMode(!editMode)}
                      className={`px-4 py-2 rounded-md flex items-center ${editMode
                        ? 'bg-gray-200 text-gray-700'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                    >
                      {editMode ? (
                        <>
                          <CloseIcon className="h-4 w-4 mr-1" />
                          Cancel Edit
                        </>
                      ) : (
                        <>
                          <Edit className="h-4 w-4 mr-1" />
                          Edit Details
                        </>
                      )}
                    </button>
                  )}
                  <button
                    onClick={resetModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              {detailsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading...</span>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Student Information - Always show, no edit */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div>
                      <strong className="text-gray-700">Name:</strong>
                      <div className="text-gray-900">{selectedSubmission.student?.name || selectedSubmission.studentName || 'N/A'}</div>
                    </div>
                    <div>
                      <strong className="text-gray-700">Enrollment No:</strong>
                      <div className="text-gray-900">{selectedSubmission.student?.enrollmentNo || selectedSubmission.enrollmentNo || 'N/A'}</div>
                    </div>
                    <div>
                      <strong className="text-gray-700">Student Email:</strong>
                      <div className="text-gray-900 flex items-center">
                        <Mail className="h-4 w-4 mr-1 text-gray-400" />
                        {selectedSubmission.student?.email || selectedSubmission.email || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <strong className="text-gray-700">Branch:</strong>
                      <div className="text-gray-900">{selectedSubmission.student?.branch || selectedSubmission.branch || 'N/A'}</div>
                    </div>
                    <div>
                      <strong className="text-gray-700">Submitted On:</strong>
                      <div className="text-gray-900 flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-gray-400" />
                        {formatDateTime(selectedSubmission.createdAt)}
                      </div>
                    </div>
                    {selectedSubmission.registrationData?.mentorEmail && (
                      <div>
                        <strong className="text-gray-700">Industry Mentor Email:</strong>
                        <div className="text-gray-900 flex items-center">
                          <Mail className="h-4 w-4 mr-1 text-gray-400" />
                          {selectedSubmission.registrationData.mentorEmail}
                        </div>
                      </div>
                    )}
                  </div>


                  {/* Registration Details - Keep existing code */}
                  {/* Registration Details - Complete Display */}
                  {selectedSubmission.reviewType === 'registration' && selectedSubmission.registrationDetails && (
                    <div className="bg-blue-50 p-6 rounded-lg">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold text-gray-900 flex items-center">
                          {selectedSubmission.semesterType?.includes('internship') ? (
                            <>
                              <Building className="h-5 w-5 mr-2" />
                              Complete Internship Registration Details
                            </>
                          ) : (
                            <>
                              <Briefcase className="h-5 w-5 mr-2" />
                              Complete Project Registration Details
                            </>
                          )}
                        </h4>
                        {editMode && (
                          <button
                            onClick={handleSaveEdits}
                            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 flex items-center"
                          >
                            <Save className="h-4 w-4 mr-1" />
                            Save Changes
                          </button>
                        )}
                      </div>

                      {/* Display Mode */}
                      {!editMode ? (
                        <div className="space-y-6">
                          {/* Company Information */}
                          {selectedSubmission.semesterType?.includes('internship') && (
                            <>
                              <div className="bg-white p-4 rounded-lg border border-blue-200">
                                <h5 className="font-semibold text-gray-900 mb-3">Company Information</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <strong className="text-gray-700">Company Name:</strong>
                                    <div className="text-gray-900">{selectedSubmission.registrationData?.companyName || 'N/A'}</div>
                                  </div>
                                  <div>
                                    <strong className="text-gray-700">Company Type:</strong>
                                    <div className="text-gray-900 capitalize">{selectedSubmission.registrationData?.companyType || 'N/A'}</div>
                                  </div>
                                  <div className="md:col-span-2">
                                    <strong className="text-gray-700">Full Address:</strong>
                                    <div className="text-gray-900">{selectedSubmission.registrationData?.companyFullAddress || 'N/A'}</div>
                                  </div>
                                </div>
                              </div>

                              {/* Internship Details */}
                              <div className="bg-white p-4 rounded-lg border border-blue-200">
                                <h5 className="font-semibold text-gray-900 mb-3">Internship Details</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <strong className="text-gray-700">Internship Title:</strong>
                                    <div className="text-gray-900">{selectedSubmission.registrationData?.internshipTitle || 'N/A'}</div>
                                  </div>
                                  <div>
                                    <strong className="text-gray-700">Domain:</strong>
                                    <div className="text-gray-900">{selectedSubmission.registrationData?.internshipDomain || 'N/A'}</div>
                                  </div>
                                  <div>
                                    <strong className="text-gray-700">Type:</strong>
                                    <div className="text-gray-900 capitalize">{selectedSubmission.registrationData?.internshipType || 'N/A'}</div>
                                  </div>
                                  <div>
                                    <strong className="text-gray-700">Type of Work:</strong>
                                    <div className="text-gray-900 capitalize">{selectedSubmission.registrationData?.typeOfWork?.replace('_', ' ') || 'N/A'}</div>
                                  </div>
                                  <div>
                                    <strong className="text-gray-700">Start Date:</strong>
                                    <div className="text-gray-900">{selectedSubmission.registrationData?.startDate ? new Date(selectedSubmission.registrationData.startDate).toLocaleDateString() : 'N/A'}</div>
                                  </div>
                                  <div>
                                    <strong className="text-gray-700">End Date:</strong>
                                    <div className="text-gray-900">{selectedSubmission.registrationData?.endDate ? new Date(selectedSubmission.registrationData.endDate).toLocaleDateString() : 'N/A'}</div>
                                  </div>
                                  <div>
                                    <strong className="text-gray-700">Duration:</strong>
                                    <div className="text-gray-900">{selectedSubmission.registrationData?.duration || 'N/A'} months</div>
                                  </div>
                                </div>
                              </div>

                              {/* Stipend Information */}
                              <div className="bg-white p-4 rounded-lg border border-blue-200">
                                <h5 className="font-semibold text-gray-900 mb-3">Stipend Information</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <strong className="text-gray-700">Has Stipend:</strong>
                                    <div className="text-gray-900">
                                      {selectedSubmission.registrationData?.hasStipend ? (
                                        <span className="text-green-600 font-medium">Yes</span>
                                      ) : (
                                        <span className="text-gray-500">No</span>
                                      )}
                                    </div>
                                  </div>
                                  {selectedSubmission.registrationData?.hasStipend && (
                                    <>
                                      <div>
                                        <strong className="text-gray-700">Stipend Amount:</strong>
                                        <div className="text-gray-900 font-medium">₹{selectedSubmission.registrationData?.stipendAmount || '0'}</div>
                                      </div>
                                      <div>
                                        <strong className="text-gray-700">Stipend Proof:</strong>
                                        <div className="mt-1">
                                          <DocumentLink
                                            url={selectedSubmission.registrationData?.stipendProof}
                                            label="View Stipend Proof"
                                            icon={FileText}
                                          />
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Contact Information */}
                              <div className="bg-white p-4 rounded-lg border border-blue-200">
                                <h5 className="font-semibold text-gray-900 mb-3">Contact Information</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <strong className="text-gray-700">Student Mobile:</strong>
                                    <div className="text-gray-900">{selectedSubmission.registrationData?.studentMobileNumber || 'N/A'}</div>
                                  </div>
                                  <div>
                                    <strong className="text-gray-700">Industry Mentor Name:</strong>
                                    <div className="text-gray-900">{selectedSubmission.registrationData?.mentorName || 'N/A'}</div>
                                  </div>
                                  <div>
                                    <strong className="text-gray-700">Mentor Role:</strong>
                                    <div className="text-gray-900">{selectedSubmission.registrationData?.mentorRole || 'N/A'}</div>
                                  </div>
                                  <div>
                                    <strong className="text-gray-700">Mentor Contact:</strong>
                                    <div className="text-gray-900">{selectedSubmission.registrationData?.mentorContactNumber || 'N/A'}</div>
                                  </div>
                                  <div>
                                    <strong className="text-gray-700">Mentor Email:</strong>
                                    <div className="text-gray-900">{selectedSubmission.registrationData?.mentorEmail || 'N/A'}</div>
                                  </div>
                                  <div>
                                    <strong className="text-gray-700">HR Name:</strong>
                                    <div className="text-gray-900">{selectedSubmission.registrationData?.hrName || 'N/A'}</div>
                                  </div>
                                  <div>
                                    <strong className="text-gray-700">HR Email:</strong>
                                    <div className="text-gray-900">{selectedSubmission.registrationData?.hrEmail || 'N/A'}</div>
                                  </div>
                                </div>
                              </div>

                              {/* Documents */}
                              <div className="bg-white p-4 rounded-lg border border-blue-200">
                                <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                                  <FileCheck className="h-4 w-4 mr-2" />
                                  Submitted Documents
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <strong className="text-gray-700">Offer Letter:</strong>
                                    <div className="mt-1">
                                      <DocumentLink
                                        url={selectedSubmission.registrationData?.offerLetter}
                                        label="View Offer Letter"
                                        icon={FileText}
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <strong className="text-gray-700">NOC Letter:</strong>
                                    <div className="mt-1">
                                      <DocumentLink
                                        url={selectedSubmission.registrationData?.nocLetter}
                                        label="View NOC Letter"
                                        icon={FileText}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}

                          {/* Project Details */}
                          {selectedSubmission.semesterType === '8th_project' && (
                            <>
                              <div className="bg-white p-4 rounded-lg border border-blue-200">
                                <h5 className="font-semibold text-gray-900 mb-3">Project Information</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <strong className="text-gray-700">Project Title:</strong>
                                    <div className="text-gray-900">{selectedSubmission.registrationData?.projectTitle || 'N/A'}</div>
                                  </div>
                                  <div>
                                    <strong className="text-gray-700">Project Type:</strong>
                                    <div className="text-gray-900 capitalize">{selectedSubmission.registrationData?.projectType?.replace('_', ' ') || 'N/A'}</div>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-white p-4 rounded-lg border border-blue-200">
                                <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                                  <FileCheck className="h-4 w-4 mr-2" />
                                  Project Report
                                </h5>
                                <div>
                                  <DocumentLink
                                    url={selectedSubmission.registrationData?.projectReport}
                                    label="View Project Report"
                                    icon={FileText}
                                  />
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        /* Edit Mode for Registration */
                        <div className="space-y-4">
                          {/* Add edit fields here - similar structure to display mode but with input fields */}
                          <div className="bg-white p-4 rounded-lg border border-blue-200">
                            <h5 className="font-semibold text-gray-900 mb-3">Edit Company Information</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                                <input
                                  type="text"
                                  defaultValue={selectedSubmission.registrationData?.companyName}
                                  onChange={(e) => setEditedData({ ...editedData, companyName: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                              {/* Add more editable fields as needed */}
                            </div>
                          </div>

                          {/* Document replacement section */}
                          <div className="bg-white p-4 rounded-lg border border-blue-200">
                            <h5 className="font-semibold text-gray-900 mb-3">📎 Replace Documents (Optional)</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Replace Offer Letter</label>
                                <FileUpload
                                  onFileSelect={(file) => setEditedFiles({ ...editedFiles, offerLetter: file })}
                                  accept=".pdf"
                                  allowedTypes={['pdf']}
                                  label="Upload New Offer Letter"
                                />
                                {selectedSubmission.registrationData?.offerLetter && (
                                  <div className="mt-2 text-sm text-gray-600">
                                    Current: <DocumentLink url={selectedSubmission.registrationData.offerLetter} label="View Current" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Replace NOC Letter</label>
                                <FileUpload
                                  onFileSelect={(file) => setEditedFiles({ ...editedFiles, nocLetter: file })}
                                  accept=".pdf"
                                  allowedTypes={['pdf']}
                                  label="Upload New NOC Letter"
                                />
                                {selectedSubmission.registrationData?.nocLetter && (
                                  <div className="mt-2 text-sm text-gray-600">
                                    Current: <DocumentLink url={selectedSubmission.registrationData.nocLetter} label="View Current" />
                                  </div>
                                )}
                              </div>
                              {selectedSubmission.registrationData?.hasStipend && selectedSubmission.registrationData?.stipendProof && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Replace Stipend Proof</label>
                                  <FileUpload
                                    onFileSelect={(file) => setEditedFiles({ ...editedFiles, stipendProof: file })}
                                    accept=".pdf"
                                    allowedTypes={['pdf']}
                                    label="Upload New Stipend Proof"
                                  />
                                  <div className="mt-2 text-sm text-gray-600">
                                    Current: <DocumentLink url={selectedSubmission.registrationData.stipendProof} label="View Current" />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ===== NEW: MPR Details Section with Document Display and Edit ===== */}
                  {selectedSubmission.reviewType === 'mpr' && selectedSubmission.mprDetails && (
                    <div className="bg-purple-50 p-6 rounded-lg">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold text-gray-900 flex items-center">
                          <FileText className="h-5 w-5 mr-2" />
                          {selectedSubmission.mprDetails.type?.toUpperCase()} Document Details
                        </h4>
                        {editMode && (
                          <button
                            onClick={handleSaveEdits}
                            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 flex items-center"
                          >
                            <Save className="h-4 w-4 mr-1" />
                            Save Changes
                          </button>
                        )}
                      </div>

                      {/* Display Mode */}
                      {!editMode ? (
                        <div className="space-y-4">
                          {/* Company Info from Registration */}
                          {selectedSubmission.registrationDetails && (
                            <div className="bg-white p-4 rounded-lg border border-purple-200">
                              <h5 className="font-semibold text-gray-900 mb-3">Internship Context</h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <strong className="text-gray-700">Company:</strong>
                                  <div className="text-gray-900">{selectedSubmission.registrationDetails.companyName || 'N/A'}</div>
                                </div>
                                <div>
                                  <strong className="text-gray-700">Internship Title:</strong>
                                  <div className="text-gray-900">{selectedSubmission.registrationDetails.projectTitle || 'N/A'}</div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* MPR Document */}
                          <div className="bg-white p-4 rounded-lg border border-purple-200">
                            <h5 className="font-semibold text-gray-900 mb-3">Submitted Document</h5>
                            <div className="space-y-3">
                              <div>
                                <strong className="text-gray-700">Document Type:</strong>
                                <div className="text-gray-900 mt-1">{selectedSubmission.mprDetails.type?.toUpperCase()}</div>
                              </div>
                              <div>
                                <strong className="text-gray-700">Submitted At:</strong>
                                <div className="text-gray-900 mt-1">{formatDateTime(selectedSubmission.mprDetails.submittedAt)}</div>
                              </div>
                              <div>
                                <strong className="text-gray-700">Document File:</strong>
                                <div className="mt-1">
                                  <DocumentLink
                                    url={selectedSubmission.mprDetails.document}
                                    label={`View ${selectedSubmission.mprDetails.type?.toUpperCase()} Document`}
                                    icon={FileText}
                                  />
                                </div>
                              </div>
                              {selectedSubmission.mprDetails.feedback && (
                                <div>
                                  <strong className="text-gray-700">Previous Feedback:</strong>
                                  <div className="text-gray-900 mt-1 bg-yellow-50 p-3 rounded border border-yellow-200">
                                    {selectedSubmission.mprDetails.feedback}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Edit Mode for MPR */
                        <div className="space-y-4">
                          <div className="bg-white p-4 rounded-lg border border-purple-200">
                            <h5 className="font-semibold text-gray-900 mb-3">📎 Replace MPR Document (Optional)</h5>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Upload New {selectedSubmission.mprDetails.type?.toUpperCase()} Document
                                </label>
                                <FileUpload
                                  onFileSelect={(file) => setEditedFiles({ ...editedFiles, document: file })}
                                  accept=".pdf"
                                  allowedTypes={['pdf']}
                                  label="Upload New Document"
                                />
                                {selectedSubmission.mprDetails.document && (
                                  <div className="mt-2 text-sm text-gray-600">
                                    Current: <DocumentLink
                                      url={selectedSubmission.mprDetails.document}
                                      label="View Current Document"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ===== NEW: Final Report Details Section with ALL Documents Display and Edit ===== */}
                  {selectedSubmission.reviewType === 'finalReport' && selectedSubmission.finalReportDetails && (
                    <div className="bg-green-50 p-6 rounded-lg">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold text-gray-900 flex items-center">
                          <Award className="h-5 w-5 mr-2" />
                          Final Report Submission Details
                        </h4>
                        {editMode && (
                          <button
                            onClick={handleSaveEdits}
                            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 flex items-center"
                          >
                            <Save className="h-4 w-4 mr-1" />
                            Save Changes
                          </button>
                        )}
                      </div>

                      {/* Display Mode */}
                      {!editMode ? (
                        <div className="space-y-6">
                          {/* Submission Info */}
                          <div className="bg-white p-4 rounded-lg border border-green-200">
                            <h5 className="font-semibold text-gray-900 mb-3">Submission Information</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <strong className="text-gray-700">Submitted At:</strong>
                                <div className="text-gray-900">{formatDateTime(selectedSubmission.finalReportDetails.submittedAt)}</div>
                              </div>
                              <div>
                                <strong className="text-gray-700">Status:</strong>
                                <div className="text-gray-900">
                                  <StatusBadge status={selectedSubmission.finalReportDetails.status} />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* ALL Final Report Documents */}
                          <div className="bg-white p-4 rounded-lg border border-green-200">
                            <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                              <FileCheck className="h-4 w-4 mr-2" />
                              Submitted Documents
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              {/* Common for all internships */}
                              {selectedSubmission.finalReportDetails.finalPPT && (
                                <div>
                                  <strong className="text-gray-700">Final Presentation (PPT):</strong>
                                  <div className="mt-1">
                                    <DocumentLink
                                      url={selectedSubmission.finalReportDetails.finalPPT}
                                      label="View Final PPT"
                                      icon={FileText}
                                    />
                                  </div>
                                </div>
                              )}

                              {selectedSubmission.finalReportDetails.finalReport && (
                                <div>
                                  <strong className="text-gray-700">Final Report:</strong>
                                  <div className="mt-1">
                                    <DocumentLink
                                      url={selectedSubmission.finalReportDetails.finalReport}
                                      label="View Final Report"
                                      icon={FileText}
                                    />
                                  </div>
                                </div>
                              )}

                              {selectedSubmission.finalReportDetails.certificate && (
                                <div>
                                  <strong className="text-gray-700">Completion Certificate:</strong>
                                  <div className="mt-1">
                                    <DocumentLink
                                      url={selectedSubmission.finalReportDetails.certificate}
                                      label="View Certificate"
                                      icon={Award}
                                    />
                                  </div>
                                </div>
                              )}

                              {/* For 7th and 8th internships */}
                              {selectedSubmission.finalReportDetails.finalMPR && (
                                <div>
                                  <strong className="text-gray-700">Final MPR:</strong>
                                  <div className="mt-1">
                                    <DocumentLink
                                      url={selectedSubmission.finalReportDetails.finalMPR}
                                      label="View Final MPR"
                                      icon={FileText}
                                    />
                                  </div>
                                </div>
                              )}

                              {/* PPO Documents */}
                              {selectedSubmission.finalReportDetails.hasPPO && (
                                <>
                                  <div>
                                    <strong className="text-gray-700">PPO Status:</strong>
                                    <div className="text-gray-900 mt-1">Yes - ₹{selectedSubmission.finalReportDetails.ppoAmount} LPA</div>
                                  </div>
                                  {selectedSubmission.finalReportDetails.ppoOfferLetter && (
                                    <div>
                                      <strong className="text-gray-700">PPO Offer Letter:</strong>
                                      <div className="mt-1">
                                        <DocumentLink
                                          url={selectedSubmission.finalReportDetails.ppoOfferLetter}
                                          label="View PPO Offer Letter"
                                          icon={FileText}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}

                              {/* Project specific documents */}
                              {selectedSubmission.finalReportDetails.conferenceLink && (
                                <div>
                                  <strong className="text-gray-700">Conference Link:</strong>
                                  <div className="text-gray-900 mt-1">
                                    <a href={selectedSubmission.finalReportDetails.conferenceLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                                      {selectedSubmission.finalReportDetails.conferenceLink}
                                    </a>
                                  </div>
                                </div>
                              )}

                              {selectedSubmission.finalReportDetails.researchPaperStatus && (
                                <div>
                                  <strong className="text-gray-700">Research Paper Status:</strong>
                                  <div className="text-gray-900 mt-1 capitalize">{selectedSubmission.finalReportDetails.researchPaperStatus}</div>
                                </div>
                              )}

                              {selectedSubmission.finalReportDetails.conferenceCertificate && (
                                <div>
                                  <strong className="text-gray-700">Conference Certificate:</strong>
                                  <div className="mt-1">
                                    <DocumentLink
                                      url={selectedSubmission.finalReportDetails.conferenceCertificate}
                                      label="View Conference Certificate"
                                      icon={Award}
                                    />
                                  </div>
                                </div>
                              )}

                              {selectedSubmission.finalReportDetails.conferencePaymentProof && (
                                <div>
                                  <strong className="text-gray-700">Conference Payment Proof:</strong>
                                  <div className="mt-1">
                                    <DocumentLink
                                      url={selectedSubmission.finalReportDetails.conferencePaymentProof}
                                      label="View Payment Proof"
                                      icon={FileText}
                                    />
                                  </div>
                                </div>
                              )}

                              {selectedSubmission.finalReportDetails.finalProjectReport && (
                                <div>
                                  <strong className="text-gray-700">Final Project Report:</strong>
                                  <div className="mt-1">
                                    <DocumentLink
                                      url={selectedSubmission.finalReportDetails.finalProjectReport}
                                      label="View Project Report"
                                      icon={FileText}
                                    />
                                  </div>
                                </div>
                              )}

                              {selectedSubmission.finalReportDetails.publishedPaperCopy && (
                                <div>
                                  <strong className="text-gray-700">Published Paper Copy:</strong>
                                  <div className="mt-1">
                                    <DocumentLink
                                      url={selectedSubmission.finalReportDetails.publishedPaperCopy}
                                      label="View Published Paper"
                                      icon={FileText}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Placement/PPO Info if exists */}
                          {(selectedSubmission.finalReportDetails.hasPlacement || selectedSubmission.finalReportDetails.hasPPO) && (
                            <div className="bg-white p-4 rounded-lg border border-green-200">
                              {/* <h5 className="font-semibold text-gray-900 mb-3">Placement Information</h5> */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                {selectedSubmission.finalReportDetails.hasPlacement && (
                                  <>
                                    <div>
                                      <strong className="text-gray-700">Placement Received:</strong>
                                      <div className="text-gray-900 mt-1">Yes</div>
                                    </div>
                                    <div>
                                      <strong className="text-gray-700">Placement From:</strong>
                                      <div className="text-gray-900 mt-1 capitalize">
                                        {selectedSubmission.finalReportDetails.placementFrom?.replace('_', ' ')}
                                      </div>
                                    </div>
                                    {selectedSubmission.finalReportDetails.ppoOfferLetterProject && (
                                      <div>
                                        <strong className="text-gray-700">Placement Offer Letter:</strong>
                                        <div className="mt-1">
                                          <DocumentLink
                                            url={selectedSubmission.finalReportDetails.ppoOfferLetterProject}
                                            label="View Offer Letter"
                                            icon={FileText}
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Edit Mode for Final Report - Replace ALL Documents */
                        <div className="space-y-4">
                          <div className="bg-white p-4 rounded-lg border border-green-200">
                            <h5 className="font-semibold text-gray-900 mb-3">📎 Replace Final Report Documents (Optional)</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Final PPT */}
                              {selectedSubmission.finalReportDetails.finalPPT && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Replace Final PPT</label>
                                  <FileUpload
                                    onFileSelect={(file) => setEditedFiles({ ...editedFiles, finalPPT: file })}
                                    accept=".pdf"
                                    allowedTypes={['pdf']}
                                    label="Upload New Final PPT"
                                  />
                                  <div className="mt-2 text-sm text-gray-600">
                                    Current: <DocumentLink url={selectedSubmission.finalReportDetails.finalPPT} label="View Current PPT" />
                                  </div>
                                </div>
                              )}

                              {/* Final Report */}
                              {selectedSubmission.finalReportDetails.finalReport && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Replace Final Report</label>
                                  <FileUpload
                                    onFileSelect={(file) => setEditedFiles({ ...editedFiles, finalReport: file })}
                                    accept=".pdf"
                                    allowedTypes={['pdf']}
                                    label="Upload New Final Report"
                                  />
                                  <div className="mt-2 text-sm text-gray-600">
                                    Current: <DocumentLink url={selectedSubmission.finalReportDetails.finalReport} label="View Current Report" />
                                  </div>
                                </div>
                              )}

                              {/* Certificate */}
                              {selectedSubmission.finalReportDetails.certificate && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Replace Certificate</label>
                                  <FileUpload
                                    onFileSelect={(file) => setEditedFiles({ ...editedFiles, certificate: file })}
                                    accept=".pdf"
                                    allowedTypes={['pdf']}
                                    label="Upload New Certificate"
                                  />
                                  <div className="mt-2 text-sm text-gray-600">
                                    Current: <DocumentLink url={selectedSubmission.finalReportDetails.certificate} label="View Current Certificate" />
                                  </div>
                                </div>
                              )}

                              {/* Final MPR (7th/8th internship) */}
                              {selectedSubmission.finalReportDetails.finalMPR && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Replace Final MPR</label>
                                  <FileUpload
                                    onFileSelect={(file) => setEditedFiles({ ...editedFiles, finalMPR: file })}
                                    accept=".pdf"
                                    allowedTypes={['pdf']}
                                    label="Upload New Final MPR"
                                  />
                                  <div className="mt-2 text-sm text-gray-600">
                                    Current: <DocumentLink url={selectedSubmission.finalReportDetails.finalMPR} label="View Current MPR" />
                                  </div>
                                </div>
                              )}

                              {/* PPO Offer Letter */}
                              {selectedSubmission.finalReportDetails.ppoOfferLetter && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Replace PPO Offer Letter</label>
                                  <FileUpload
                                    onFileSelect={(file) => setEditedFiles({ ...editedFiles, ppoOfferLetter: file })}
                                    accept=".pdf"
                                    allowedTypes={['pdf']}
                                    label="Upload New PPO Offer Letter"
                                  />
                                  <div className="mt-2 text-sm text-gray-600">
                                    Current: <DocumentLink url={selectedSubmission.finalReportDetails.ppoOfferLetter} label="View Current Offer Letter" />
                                  </div>
                                </div>
                              )}

                              {/* Add more document upload fields for project-specific documents */}
                              {selectedSubmission.finalReportDetails.conferenceCertificate && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Replace Conference Certificate</label>
                                  <FileUpload
                                    onFileSelect={(file) => setEditedFiles({ ...editedFiles, conferenceCertificate: file })}
                                    accept=".pdf"
                                    allowedTypes={['pdf']}
                                    label="Upload New Conference Certificate"
                                  />
                                  <div className="mt-2 text-sm text-gray-600">
                                    Current: <DocumentLink url={selectedSubmission.finalReportDetails.conferenceCertificate} label="View Current Certificate" />
                                  </div>
                                </div>
                              )}

                              {/* Add remaining project documents similarly */}
                            </div>
                          </div>

                          {/* Editable text fields for Final Report */}
                          <div className="bg-white p-4 rounded-lg border border-green-200">
                            <h5 className="font-semibold text-gray-900 mb-3">Update Information</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {selectedSubmission.finalReportDetails.conferenceLink && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Conference Link</label>
                                  <input
                                    type="url"
                                    defaultValue={selectedSubmission.finalReportDetails.conferenceLink}
                                    onChange={(e) => setEditedData({ ...editedData, conferenceLink: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                  />
                                </div>
                              )}

                              {selectedSubmission.finalReportDetails.hasPPO && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">PPO Amount (LPA)</label>
                                  <input
                                    type="number"
                                    step="0.1"
                                    defaultValue={selectedSubmission.finalReportDetails.ppoAmount}
                                    onChange={(e) => setEditedData({ ...editedData, ppoAmount: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Marks Assignment Section - Show only on approve */}
                  {selectedSubmission?.currentReviewStatus === 'pending' && reviewAction === 'approve' && (
                    <div className="space-y-6">
                      {selectedSubmission.reviewType === 'registration' && (
                        <RegistrationMarks marks={marks} setMarks={setMarks} />
                      )}

                      {selectedSubmission.reviewType === 'mpr' && (
                        selectedSubmission.mprType === 'midSem1' || selectedSubmission.mprType === 'midSem2' ? (
                          <MidSemMarks
                            marks={marks}
                            setMarks={setMarks}
                            semNumber={selectedSubmission.mprType === 'midSem1' ? 1 : 2}
                          />
                        ) : (
                          <MPRMarks
                            marks={marks.simpleMarks || 0}
                            setMarks={(val) => setMarks({ simpleMarks: val })}
                            mprType={selectedSubmission.mprType}
                          />
                        )
                      )}

                      {selectedSubmission.reviewType === 'finalReport' && (
                        <FinalReportMarks marks={marks} setMarks={setMarks} />
                      )}
                    </div>
                  )}

                  {/* Review Section */}
                  {selectedSubmission.currentReviewStatus === 'pending' && (
                    <div className="bg-yellow-50 p-6 rounded-lg border-2 border-yellow-200">
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                        <AlertCircle className="h-5 w-5 mr-2 text-yellow-600" />
                        Review Decision Required
                      </h4>

                      <div className="space-y-4">
                        <div className="flex space-x-4">
                          <button
                            onClick={() => setReviewAction('approve')}
                            className={`flex items-center px-6 py-3 rounded-lg transition-all duration-200 ${reviewAction === 'approve'
                              ? 'bg-green-600 text-white shadow-lg scale-105'
                              : 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-300'
                              }`}
                          >
                            <CheckCircle className="h-5 w-5 mr-2" />
                            Approve & Assign Marks
                          </button>
                          <button
                            onClick={() => setReviewAction('reject')}
                            className={`flex items-center px-6 py-3 rounded-lg transition-all duration-200 ${reviewAction === 'reject'
                              ? 'bg-red-600 text-white shadow-lg scale-105'
                              : 'bg-red-100 text-red-800 hover:bg-red-200 border border-red-300'
                              }`}
                          >
                            <XCircle className="h-5 w-5 mr-2" />
                            Reject Submission
                          </button>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Feedback {reviewAction === 'reject' && <span className="text-red-500">*</span>}
                            {reviewAction === 'approve' && <span className="text-gray-500">(Optional)</span>}
                          </label>
                          <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder={
                              reviewAction === 'approve'
                                ? "Enter positive feedback or suggestions..."
                                : reviewAction === 'reject'
                                  ? "Please provide specific reasons for rejection..."
                                  : "Select approve or reject first..."
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex justify-between items-center pt-6 border-t mt-8">
                <div className="text-sm text-gray-500">
                  Last updated: {selectedSubmission ? formatDateTime(selectedSubmission.updatedAt) : 'N/A'}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={resetModal}
                    className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                  {selectedSubmission?.currentReviewStatus === 'pending' && (
                    <button
                      onClick={handleReview}
                      disabled={!reviewAction || (reviewAction === 'reject' && !feedback.trim()) || loading}
                      className={`px-6 py-2 text-sm font-medium text-white rounded-lg transition-all duration-200 ${!reviewAction || (reviewAction === 'reject' && !feedback.trim()) || loading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : reviewAction === 'approve'
                          ? 'bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl'
                          : 'bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl'
                        }`}
                    >
                      {loading ? 'Processing...' : `${reviewAction === 'approve' ? 'Approve' : 'Reject'}`}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReviewSubmissions