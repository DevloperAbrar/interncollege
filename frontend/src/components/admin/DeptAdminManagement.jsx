import React, { useState, useEffect } from 'react'
import { adminService } from '../../services/adminService'
import { Plus, Trash2, Search, X, User } from 'lucide-react'

const DeptAdminManagement = () => {
  const [admins, setAdmins] = useState([])
  const [departments, setDepartments] = useState([])
  const [pagination, setPagination] = useState(null)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ email: '', departmentId: '', program: '' })

  useEffect(() => { loadAdmins(); loadDepts() }, [])

  const loadAdmins = async (page = 1) => {
    setLoading(true)
    try {
      const res = await adminService.getAllDeptAdmins(page, 10, search)
      if (res.success) { setAdmins(res.data.admins); setPagination(res.data.pagination) }
    } finally { setLoading(false) }
  }

  const loadDepts = async () => {
    try {
      const res = await adminService.getDepartments()
      if (res.success) setDepartments(res.data)
    } catch {}
  }

  const selectedDept = departments.find(d => d._id === form.departmentId)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.departmentId) return setError('Email and department are required')
    setSubmitting(true); setError('')
    try {
      const res = await adminService.createDeptAdmin(form)
      if (res.success) { setShowModal(false); setForm({ email: '', departmentId: '', program: '' }); loadAdmins() }
      else setError(res.message || 'Failed to create')
    } catch (err) {
      setError(err.response?.data?.message || 'Error occurred')
    } finally { setSubmitting(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this department admin?')) return
    try { await adminService.deleteDeptAdmin(id); loadAdmins() }
    catch { alert('Failed to delete') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Department Admins</h1>
          <p className="text-gray-600">Manage department administrators</p>
        </div>
        <button onClick={() => { setForm({ email: '', departmentId: '', program: '' }); setError(''); setShowModal(true) }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" /> Add Dept Admin
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && loadAdmins()}
            placeholder="Search by name or email..."
            className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <button onClick={() => loadAdmins()} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm">Search</button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>
      ) : admins.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500">No department admins yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Admin', 'Department', 'Program', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {admins.map(admin => (
                <tr key={admin._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {admin.profilePhoto
                        ? <img src={admin.profilePhoto} alt={admin.name} className="h-9 w-9 rounded-full object-cover" />
                        : <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center"><User className="h-4 w-4 text-blue-600" /></div>
                      }
                      <div>
                        <p className="font-medium text-gray-900">{admin.name}</p>
                        <p className="text-sm text-gray-500">{admin.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{admin.department?.name || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{admin.program || '—'}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleDelete(admin._id)} className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => !submitting && setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Add Department Admin</h3>
              <button onClick={() => setShowModal(false)} disabled={submitting}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gmail Address <span className="text-red-500">*</span></label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="admin@gmail.com" />
                <p className="text-xs text-gray-500 mt-1">They will login using this Google account</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department <span className="text-red-500">*</span></label>
                <select value={form.departmentId} onChange={e => setForm(f => ({ ...f, departmentId: e.target.value, program: '' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>
              {selectedDept?.programs?.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Program (optional)</label>
                  <select value={form.program} onChange={e => setForm(f => ({ ...f, program: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">All Programs</option>
                    {selectedDept.programs.map((p, i) => <option key={i} value={p.name}>{p.name} ({p.totalSemesters} sems)</option>)}
                  </select>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} disabled={submitting} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {submitting ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default DeptAdminManagement