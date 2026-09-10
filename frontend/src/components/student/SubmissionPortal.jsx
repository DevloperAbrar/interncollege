import React, { useState, useEffect } from 'react'
import { useApi } from '../../hooks/useApi'
import { studentService } from '../../services/studentService'
import FileUpload from '../common/FileUpload'
import { FileText, CheckCircle, Clock, Upload, Calendar, Award, Target } from 'lucide-react'

const SubmissionPortal = ({ submission }) => {
  const { execute, loading } = useApi()
  const [activeTab, setActiveTab] = useState('overview')
  const [submissionFile, setSubmissionFile] = useState(null)
  const [submissionType, setSubmissionType] = useState('')

  const getSubmissionConfig = () => {
    const { category, submissionType: type } = submission

    const configs = {
      'any': {
        submissions: [
          { key: 'ppt', label: 'Presentation (PPT)', icon: FileText, required: true },
          { key: 'certificate', label: 'Certificate', icon: Award, required: true },
          { key: 'report', label: 'Report', icon: FileText, required: true }
        ]
      },
      '6th-sem': {
        submissions: [
          { key: 'ppt', label: 'Presentation (PPT)', icon: FileText, required: true },
          { key: 'certificate', label: 'Certificate', icon: Award, required: true },
          { key: 'report', label: 'Report', icon: FileText, required: true }
        ]
      },
      '7th-sem': {
        submissions: [
          { key: 'mpr1', label: 'Monthly Progress Report 1', icon: FileText, required: true },
          { key: 'mpr2', label: 'Monthly Progress Report 2', icon: FileText, required: true },
          { key: 'mpr3', label: 'Monthly Progress Report 3', icon: FileText, required: true },
          { key: 'midsem1', label: 'Mid Semester Report 1', icon: Target, required: true },
          { key: 'midsem2', label: 'Mid Semester Report 2', icon: Target, required: true },
          { key: 'final', label: 'Final Report', icon: Award, required: true, dependsOn: ['mpr1', 'mpr2', 'mpr3', 'midsem1', 'midsem2'] }
        ]
      },
      '8th-sem': {
        submissions: type === 'project' ? [
          { key: 'project-final', label: 'Final Project Submission', icon: FileText, required: true }
        ] : [
          { key: 'mpr1', label: 'Monthly Progress Report 1', icon: FileText, required: true },
          { key: 'mpr2', label: 'Monthly Progress Report 2', icon: FileText, required: true },
          { key: 'mpr3', label: 'Monthly Progress Report 3', icon: FileText, required: true },
          { key: 'midsem1', label: 'Mid Semester Report 1', icon: Target, required: true },
          { key: 'midsem2', label: 'Mid Semester Report 2', icon: Target, required: true },
          { key: 'final', label: 'Final Report', icon: Award, required: true, dependsOn: ['mpr1', 'mpr2', 'mpr3', 'midsem1', 'midsem2'] }
        ]
      }
    }

    return configs[category] || configs['any']
  }

  const config = getSubmissionConfig()
  const unlockedSubmissions = submission.unlockedSubmissions || []
  const completedSubmissions = submission.completedSubmissions || []

  const handleSubmit = async (submissionKey) => {
    if (!submissionFile) return

    try {
      const formData = new FormData()
      formData.append('documentType', submissionKey)
      formData.append('document', submissionFile)

      if (submissionKey.startsWith('mpr')) {
        const month = submissionKey.replace('mpr', '')
        formData.append('month', month)
        formData.append('title', `Monthly Progress Report ${month}`)
        await execute(() => studentService.submitMonthlyProgress(formData))
      } else if (submissionKey.startsWith('midsem')) {
        const reportNumber = submissionKey.replace('midsem', '')
        formData.append('reportNumber', reportNumber)
        await execute(() => studentService.submitMidSemReport(formData))
      } else if (submissionKey === 'final') {
        // Handle final report submission differently
        return
      } else {
        await execute(() => studentService.submitAdditionalDocument(formData))
      }

      setSubmissionFile(null)
      setSubmissionType('')
    } catch (error) {
      console.error('Submission error:', error)
    }
  }

  const isSubmissionUnlocked = (key) => {
    return unlockedSubmissions.includes(key)
  }

  const isSubmissionCompleted = (key) => {
    return completedSubmissions.includes(key)
  }

  const canSubmit = (submissionItem) => {
    if (submissionItem.dependsOn) {
      return submissionItem.dependsOn.every(dep => completedSubmissions.includes(dep))
    }
    return isSubmissionUnlocked(submissionItem.key)
  }

  const getSubmissionStatus = (key) => {
    if (isSubmissionCompleted(key)) return 'completed'
    if (isSubmissionUnlocked(key)) return 'available'
    return 'locked'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Submission Portal</h2>
        <p className="text-gray-600">
          Your initial registration has been approved. You can now submit your documents.
        </p>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
              <div>
                <p className="font-semibold text-gray-900">Registration</p>
                <p className="text-sm text-gray-600">Approved</p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <FileText className="h-6 w-6 text-blue-600 mr-2" />
              <div>
                <p className="font-semibold text-gray-900">Available</p>
                <p className="text-sm text-gray-600">{unlockedSubmissions.length} submissions</p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Award className="h-6 w-6 text-purple-600 mr-2" />
              <div>
                <p className="font-semibold text-gray-900">Completed</p>
                <p className="text-sm text-gray-600">{completedSubmissions.length} submissions</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submission Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {config.submissions.map((item) => {
          const Icon = item.icon
          const status = getSubmissionStatus(item.key)
          const canSubmitItem = canSubmit(item)
          
          return (
            <div
              key={item.key}
              className={`bg-white rounded-2xl shadow-sm border transition-all duration-300 ${
                status === 'completed'
                  ? 'border-green-200 bg-green-50'
                  : status === 'available'
                  ? 'border-blue-200 bg-blue-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className={`p-3 rounded-lg mr-4 ${
                      status === 'completed'
                        ? 'bg-green-100'
                        : status === 'available'
                        ? 'bg-blue-100'
                        : 'bg-gray-100'
                    }`}>
                      <Icon className={`h-6 w-6 ${
                        status === 'completed'
                          ? 'text-green-600'
                          : status === 'available'
                          ? 'text-blue-600'
                          : 'text-gray-400'
                      }`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{item.label}</h3>
                      <p className={`text-sm ${
                        status === 'completed'
                          ? 'text-green-600'
                          : status === 'available'
                          ? 'text-blue-600'
                          : 'text-gray-500'
                      }`}>
                        {status === 'completed' && '✓ Submitted'}
                        {status === 'available' && '● Available for submission'}
                        {status === 'locked' && '🔒 Locked'}
                      </p>
                    </div>
                  </div>
                  
                  {status === 'completed' && (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  )}
                  {status === 'locked' && (
                    <Clock className="h-6 w-6 text-gray-400" />
                  )}
                </div>

                {status === 'available' && canSubmitItem && (
                  <div className="space-y-4">
                    {submissionType !== item.key ? (
                      <button
                        onClick={() => setSubmissionType(item.key)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Submit {item.label}
                      </button>
                    ) : (
                      <div className="space-y-4">
                        <FileUpload
                          onFileSelect={setSubmissionFile}
                          accept=".pdf,.ppt,.pptx"
                          allowedTypes={['pdf', 'ppt', 'pptx']}
                          label={`Upload ${item.label}`}
                          required
                        />
                        
                        <div className="flex space-x-3">
                          <button
                            onClick={() => {
                              setSubmissionType('')
                              setSubmissionFile(null)
                            }}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                          
                          <button
                            onClick={() => handleSubmit(item.key)}
                            disabled={!submissionFile || loading}
                            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center"
                          >
                            {loading ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            ) : (
                              'Submit'
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {status === 'locked' && item.dependsOn && (
                  <div className="text-sm text-gray-600">
                    Complete the following first: {item.dependsOn.map(dep => 
                      config.submissions.find(s => s.key === dep)?.label
                    ).join(', ')}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Final Report Modal for 7th and 8th sem */}
      {(submission.category === '7th-sem' || submission.category === '8th-sem') && 
       submissionType === 'final' && (
        <FinalReportModal
          isOpen={true}
          onClose={() => setSubmissionType('')}
          onSubmit={handleSubmit}
          loading={loading}
        />
      )}
    </div>
  )
}

// Final Report Modal Component
const FinalReportModal = ({ isOpen, onClose, onSubmit, loading }) => {
  const [finalFiles, setFinalFiles] = useState({
    finalMPR: null,
    certificate: null,
    finalReport: null,
    ppoLetter: null
  })
  const [hasPPO, setHasPPO] = useState(false)
  const [ppoSalary, setPPOSalary] = useState('')

  const handleSubmitFinal = async () => {
    const formData = new FormData()
    formData.append('hasPPO', hasPPO)
    if (hasPPO) formData.append('ppoSalary', ppoSalary)
    
    Object.entries(finalFiles).forEach(([key, file]) => {
      if (file) formData.append(key, file)
    })

    await onSubmit('final', formData)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="p-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Final Report Submission</h3>
          
          <div className="space-y-6">
            <FileUpload
              onFileSelect={(file) => setFinalFiles(prev => ({ ...prev, finalMPR: file }))}
              accept=".pdf"
              allowedTypes={['pdf']}
              label="Final Monthly Progress Report"
              required
            />

            <FileUpload
              onFileSelect={(file) => setFinalFiles(prev => ({ ...prev, certificate: file }))}
              accept=".pdf"
              allowedTypes={['pdf']}
              label="Internship Certificate"
              required
            />

            <FileUpload
              onFileSelect={(file) => setFinalFiles(prev => ({ ...prev, finalReport: file }))}
              accept=".pdf"
              allowedTypes={['pdf']}
              label="Final Internship Report"
              required
            />

            {/* PPO Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="flex items-center space-x-3 mb-4">
                <input
                  type="checkbox"
                  checked={hasPPO}
                  onChange={(e) => setHasPPO(e.target.checked)}
                  className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  I received a Pre-Placement Offer (PPO)
                </span>
              </label>

              {hasPPO && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Annual Salary (in Lakhs)
                    </label>
                    <input
                      type="number"
                      value={ppoSalary}
                      onChange={(e) => setPPOSalary(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter annual salary in lakhs"
                      step="0.1"
                      min="0"
                    />
                  </div>

                  <FileUpload
                    onFileSelect={(file) => setFinalFiles(prev => ({ ...prev, ppoLetter: file }))}
                    accept=".pdf"
                    allowedTypes={['pdf']}
                    label="PPO Offer Letter"
                    required={hasPPO}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-8">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            
            <button
              onClick={handleSubmitFinal}
              disabled={loading || !finalFiles.finalMPR || !finalFiles.certificate || !finalFiles.finalReport}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Submitting...
                </>
              ) : (
                'Submit Final Report'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SubmissionPortal