import React, { useState, useEffect } from 'react'
import { useApi } from '../../hooks/useApi'
import { adminService } from '../../services/adminService'
import { formatDateTime } from '../../utils/helpers'
import FileUpload from '../common/FileUpload'
import Table from '../common/Table'
import { Upload, Download, FileText, AlertCircle, CheckCircle } from 'lucide-react'

const BulkUpload = () => {
  const { execute, loading } = useApi()
  const [uploadHistory, setUploadHistory] = useState([])
  const [pagination, setPagination] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadStatus, setUploadStatus] = useState(null)

  // ─── Individual student add ─────────────────────────────────────────────
  const [studentForm, setStudentForm] = useState({ enrollmentNo: '', email: '' })
  const [addStatus, setAddStatus] = useState(null)
  const [addingStudent, setAddingStudent] = useState(false)

  useEffect(() => {
    loadUploadHistory()
  }, [])

  const loadUploadHistory = async (page = 1) => {
    try {
      console.log('Loading upload history for page:', page);

      // Don't pass adminId in the frontend - let backend get it from req.user
      const response = await execute(() => adminService.getBulkUploadHistory(page))
      if (response.success) {
        setUploadHistory(response.data.uploads)
        setPagination(response.data)
      }
    } catch (error) {
      console.error('Error loading upload history:', error)
    }
  }

  const handleFileSelect = (file) => {
    setSelectedFile(file)
    setUploadStatus(null)
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus({
        type: 'error',
        message: 'Please select a file first'
      });
      return;
    }

    // Validate file type
    const allowedExtensions = ['csv', 'xlsx', 'xls'];
    const fileExtension = selectedFile.name.split('.').pop().toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      setUploadStatus({
        type: 'error',
        message: 'Only CSV, XLSX, and XLS files are allowed'
      });
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (selectedFile.size > maxSize) {
      setUploadStatus({
        type: 'error',
        message: 'File size must be less than 10MB'
      });
      return;
    }

    try {
      setUploadStatus({ type: 'loading', message: 'Uploading file...' });

      console.log('Uploading file:', {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type
      });

      // Don't pass adminId - let backend get it from req.user
      const response = await execute(() => adminService.bulkUploadStudents(selectedFile));

      if (response.success) {
        setUploadStatus({
          type: 'success',
          message: response.message || 'File uploaded successfully. Processing in background.'
        });
        setSelectedFile(null);

        // Reload upload history after a short delay
        setTimeout(() => {
          loadUploadHistory();
        }, 2000); // Increased delay to 2 seconds
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus({
        type: 'error',
        message: error.response?.data?.message || error.message || 'Upload failed'
      });
    }
  };

  // ─── Add a single student manually ──────────────────────────────────────
  const handleAddStudent = async (e) => {
    e.preventDefault()

    if (!studentForm.enrollmentNo.trim() || !studentForm.email.trim()) {
      setAddStatus({ type: 'error', message: 'Enrollment number and email are required' })
      return
    }

    try {
      setAddingStudent(true)
      setAddStatus({ type: 'loading', message: 'Adding student...' })

      const response = await adminService.addStudent({
        enrollmentNo: studentForm.enrollmentNo.trim(),
        email: studentForm.email.trim().toLowerCase()
      })

      if (response.success) {
        setAddStatus({ type: 'success', message: response.message || 'Student added successfully' })
        setStudentForm({ enrollmentNo: '', email: '' })
        setTimeout(() => loadUploadHistory(), 1000)
      }
    } catch (error) {
      console.error('Add student error:', error)
      setAddStatus({
        type: 'error',
        message: error.response?.data?.message || error.message || 'Failed to add student'
      })
    } finally {
      setAddingStudent(false)
    }
  }

  // ← UPDATED: fetches template from backend, falls back to local generation
  const handleDownloadTemplate = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/download-template`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to download template')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'students_template.csv'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Template download error:', error)
      // Fallback: generate locally with the correct columns
      const headers = ['studentName', 'enrollmentNo', 'email', 'branch', 'mentorEmail', 'semester']
      const samples = [
        'John Doe,EN2024001,john@college.edu,Computer Science & Engineering,mentor@college.edu,5',
        'Jane Smith,EN2024002,jane@college.edu,Information Technology,mentor2@college.edu,6',
        'Raj Kumar,EN2024003,raj@college.edu,Mechanical Engineering,mentor3@college.edu,7',
        'Priya Shah,EN2024004,priya@college.edu,Electronics Engineering,mentor4@college.edu,8'
      ]
      const csvContent = [headers.join(','), ...samples].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'students_template.csv'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    }
  }

  const columns = [
    {
      header: 'File Name',
      accessor: 'fileName',
      render: (upload) => (
        <div className="flex items-center">
          <FileText className="h-4 w-4 text-gray-400 mr-2" />
          {upload.fileName}
        </div>
      )
    },
    {
      header: 'Total Records',
      accessor: 'totalRecords'
    },
    {
      header: 'Success',
      accessor: 'successCount',
      render: (upload) => (
        <span className="text-green-600 font-medium">{upload.successCount}</span>
      )
    },
    {
      header: 'Failed',
      accessor: 'failureCount',
      render: (upload) => (
        <span className="text-red-600 font-medium">{upload.failureCount}</span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (upload) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${upload.status === 'completed' ? 'bg-green-100 text-green-800' :
            upload.status === 'failed' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
          }`}>
          {upload.status}
        </span>
      )
    },
    {
      header: 'Uploaded',
      accessor: 'createdAt',
      render: (upload) => formatDateTime(upload.createdAt)
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bulk Upload Students</h1>
        <p className="text-gray-600">Upload multiple students from CSV or Excel files</p>
      </div>

      {/* Upload Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File Upload */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload File</h3>

          <FileUpload
            onFileSelect={handleFileSelect}
            accept=".csv,.xlsx,.xls"
            allowedTypes={['csv', 'xlsx', 'xls']}
            label="Select CSV or Excel File"
            required
          />

          {/* Upload Status */}
          {uploadStatus && (
            <div className={`mt-4 p-3 rounded-lg flex items-center ${uploadStatus.type === 'success' ? 'bg-green-50 text-green-700' :
                uploadStatus.type === 'error' ? 'bg-red-50 text-red-700' :
                  'bg-blue-50 text-blue-700'
              }`}>
              {uploadStatus.type === 'success' && <CheckCircle className="h-4 w-4 mr-2" />}
              {uploadStatus.type === 'error' && <AlertCircle className="h-4 w-4 mr-2" />}
              {uploadStatus.type === 'loading' && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              )}
              {uploadStatus.message}
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!selectedFile || loading}
            className="w-full mt-4 btn-primary disabled:opacity-50 flex items-center justify-center"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Students
          </button>
        </div>

        {/* Instructions */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Instructions</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">1</div>
              <p>Download the template — it only needs <strong>enrollmentNo</strong> and <strong>email</strong></p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">2</div>
              <p>Use college email format: <code className="bg-gray-100 px-1 rounded">23io10mo34@mitsgwl.ac.in</code> — branch code is auto-parsed from the email</p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">3</div>
              <p>Upload the file — students are created and mentors can filter them by branch code</p>
            </div>
          </div>

          <button
            onClick={handleDownloadTemplate}
            className="w-full mt-6 btn-secondary flex items-center justify-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </button>
        </div>
      </div>

      {/* Add Individual Student */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Individual Student</h3>
        <p className="text-sm text-gray-600 mb-4">
          Add one student at a time — same rules as bulk upload: only enrollment number and college email are needed, branch is auto-parsed from the email.
        </p>

        <form onSubmit={handleAddStudent} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Enrollment Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={studentForm.enrollmentNo}
              onChange={(e) => setStudentForm(prev => ({ ...prev, enrollmentNo: e.target.value }))}
              placeholder="EN2024001"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              College Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={studentForm.email}
              onChange={(e) => setStudentForm(prev => ({ ...prev, email: e.target.value }))}
              placeholder="23io10mo34@mitsgwl.ac.in"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="sm:col-span-2">
            {addStatus && (
              <div className={`mb-4 p-3 rounded-lg flex items-center ${
                addStatus.type === 'success' ? 'bg-green-50 text-green-700' :
                addStatus.type === 'error' ? 'bg-red-50 text-red-700' :
                'bg-blue-50 text-blue-700'
              }`}>
                {addStatus.type === 'success' && <CheckCircle className="h-4 w-4 mr-2" />}
                {addStatus.type === 'error' && <AlertCircle className="h-4 w-4 mr-2" />}
                {addStatus.type === 'loading' && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                )}
                {addStatus.message}
              </div>
            )}

            <button
              type="submit"
              disabled={addingStudent}
              className="btn-primary disabled:opacity-50 flex items-center justify-center"
            >
              <Upload className="h-4 w-4 mr-2" />
              Add Student
            </button>
          </div>
        </form>
      </div>

      {/* Upload History */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload History</h3>

        <Table
          columns={columns}
          data={uploadHistory}
          loading={loading}
          pagination={pagination}
          onPageChange={loadUploadHistory}
          emptyMessage="No uploads found"
        />
      </div>
    </div>
  )
}

export default BulkUpload