import React, { useState, useEffect } from 'react'
import { deptAdminService } from '../../services/deptAdminService'
import { Users, GitBranch, UserCheck, BookOpen, Download } from 'lucide-react'

const DeptAdminDashboard = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')

  useEffect(() => {
    deptAdminService.getDashboard()
      .then(res => { if (res.success) setData(res.data) })
      .finally(() => setLoading(false))
  }, [])

  const handleExport = async () => {
    try {
      setExporting(true)
      setExportError('')
      const response = await deptAdminService.exportStudents()
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `department_students_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
      setExportError('Could not export student data. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>

  const stats = [
    { label: 'Total Branches', value: data?.stats?.totalBranches || 0, icon: GitBranch, color: 'blue' },
    { label: 'Total Mentors', value: data?.stats?.totalMentors || 0, icon: UserCheck, color: 'green' },
    { label: 'Total Students', value: data?.stats?.totalStudents || 0, icon: Users, color: 'purple' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Department Dashboard</h1>
          <p className="text-gray-600">{data?.department?.name || 'Your Department'}</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="btn-primary flex items-center disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Download className="h-4 w-4 mr-2" />
          {exporting ? 'Exporting...' : 'Export Student Data'}
        </button>
      </div>

      {exportError && (
        <div className="border border-red-200 bg-red-50 rounded-md px-4 py-3">
          <p className="text-sm text-red-700">{exportError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-${color}-100`}>
                <Icon className={`h-6 w-6 text-${color}-600`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {data?.department?.programs?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Programs in your department</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {data.department.programs.map((p, i) => (
              <div key={i} className="bg-blue-50 rounded-lg px-4 py-3">
                <p className="font-medium text-blue-900 text-sm">{p.name}</p>
                <p className="text-xs text-blue-600">{p.totalSemesters} Semesters</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default DeptAdminDashboard