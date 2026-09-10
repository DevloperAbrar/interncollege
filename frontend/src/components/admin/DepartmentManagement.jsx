import React, { useState, useEffect } from 'react'
import { adminService } from '../../services/adminService'
import { Plus, Trash2, ChevronDown, ChevronUp, X, Edit } from 'lucide-react'

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingDept, setEditingDept] = useState(null)
  const [expanded, setExpanded] = useState({})
  const [form, setForm] = useState({ name: '', programs: [{ name: '', totalSemesters: 4 }] })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { loadDepartments() }, [])

  const loadDepartments = async () => {
    setLoading(true)
    try {
      const res = await adminService.getDepartments()
      if (res.success) setDepartments(res.data)
    } finally { setLoading(false) }
  }

  const openCreate = () => {
    setEditingDept(null)
    setForm({ name: '', programs: [{ name: '', totalSemesters: 4 }] })
    setError('')
    setShowModal(true)
  }

  const openEdit = (dept) => {
    setEditingDept(dept)
    setForm({ name: dept.name, programs: dept.programs.map(p => ({ name: p.name, totalSemesters: p.totalSemesters })) })
    setError('')
    setShowModal(true)
  }

  const addProgram = () => setForm(f => ({ ...f, programs: [...f.programs, { name: '', totalSemesters: 4 }] }))
  const removeProgram = (i) => setForm(f => ({ ...f, programs: f.programs.filter((_, idx) => idx !== i) }))
  const updateProgram = (i, field, value) => {
    setForm(f => {
      const programs = [...f.programs]
      programs[i] = { ...programs[i], [field]: value }
      return { ...f, programs }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return setError('Department name is required')
    if (form.programs.some(p => !p.name.trim())) return setError('All programs must have a name')
    setSubmitting(true)
    setError('')
    try {
      let res
      if (editingDept) {
        res = await adminService.updateDepartment(editingDept._id, form)
      } else {
        res = await adminService.createDepartment(form)
      }
      if (res.success) { setShowModal(false); loadDepartments() }
      else setError(res.message || 'Failed')
    } catch (err) {
      setError(err.response?.data?.message || 'Error occurred')
    } finally { setSubmitting(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this department? This cannot be undone.')) return
    try {
      await adminService.deleteDepartment(id)
      loadDepartments()
    } catch (err) { alert('Failed to delete department') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Department Management</h1>
          <p className="text-gray-600">Create and manage college departments and their programs</p>
        </div>
        <button onClick={openCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" /> Add Department
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>
      ) : departments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500 text-lg">No departments yet.</p>
          <p className="text-gray-400 text-sm mt-1">Click "Add Department" to create the first one.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {departments.map(dept => (
            <div key={dept._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <button onClick={() => setExpanded(e => ({ ...e, [dept._id]: !e[dept._id] }))} className="text-gray-400 hover:text-gray-600">
                    {expanded[dept._id] ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </button>
                  <div>
                    <h3 className="font-semibold text-gray-900">{dept.name}</h3>
                    <p className="text-sm text-gray-500">{dept.programs?.length || 0} program{dept.programs?.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(dept)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(dept._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              {expanded[dept._id] && (
                <div className="border-t border-gray-100 px-6 py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {dept.programs?.map((prog, i) => (
                      <div key={i} className="bg-blue-50 rounded-lg px-4 py-3">
                        <p className="font-medium text-blue-900">{prog.name}</p>
                        <p className="text-sm text-blue-600">{prog.totalSemesters} Semesters</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => !submitting && setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">{editingDept ? 'Edit Department' : 'Create Department'}</h3>
              <button onClick={() => setShowModal(false)} disabled={submitting}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department Name <span className="text-red-500">*</span></label>
                <input
                  type="text" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Computer Science & Engineering"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Programs <span className="text-red-500">*</span></label>
                  <button type="button" onClick={addProgram} className="text-blue-600 text-sm flex items-center hover:text-blue-700">
                    <Plus className="h-3 w-3 mr-1" /> Add Program
                  </button>
                </div>
                <div className="space-y-3">
                  {form.programs.map((prog, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text" value={prog.name} placeholder="Program name (e.g. BTech)"
                        onChange={e => updateProgram(i, 'name', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <select value={prog.totalSemesters} onChange={e => updateProgram(i, 'totalSemesters', parseInt(e.target.value))}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        {[2,4,6,8,10,12].map(n => <option key={n} value={n}>{n} Sem</option>)}
                      </select>
                      {form.programs.length > 1 && (
                        <button type="button" onClick={() => removeProgram(i)} className="text-red-500 hover:text-red-700 p-1"><X className="h-4 w-4" /></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </form>
            <div className="flex justify-end gap-3 px-6 py-4 border-t">
              <button type="button" onClick={() => setShowModal(false)} disabled={submitting} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSubmit} disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 min-w-[120px]">
                {submitting ? <div className="flex items-center justify-center"><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />Saving...</div> : (editingDept ? 'Update' : 'Create')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DepartmentManagement