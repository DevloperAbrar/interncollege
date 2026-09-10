import React, { useState, useEffect } from 'react'
import { deptAdminService } from '../../services/deptAdminService'
import { Plus, Trash2, Pencil, User, GitBranch, X, ChevronDown, ChevronRight, Award } from 'lucide-react'

const DeptMentorManagement = () => {
  const [mentors, setMentors] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)

  // Add modal state
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ email: '', branchId: '', maxStudents: 20 })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Edit modal state
  const [editingMentor, setEditingMentor] = useState(null)
  const [editForm, setEditForm] = useState({ branchId: '', maxStudents: '' })
  const [editError, setEditError] = useState('')
  const [saving, setSaving] = useState(false)

  // Expand/students-dropdown state
  const [expandedId, setExpandedId] = useState(null)
  const [studentsByMentor, setStudentsByMentor] = useState({}) // { mentorId: [students] }
  const [studentsLoading, setStudentsLoading] = useState(null) // mentorId currently loading

  useEffect(() => { loadMentors(); loadBranches() }, [])

  const loadMentors = async () => {
    setLoading(true)
    try {
      const res = await deptAdminService.getMentors()
      if (res.success) setMentors(res.data)
    } finally { setLoading(false) }
  }

  const loadBranches = async () => {
    try {
      const res = await deptAdminService.getBranches()
      if (res.success) setBranches(res.data)
    } catch {}
  }

  const toggleExpand = async (mentor) => {
    const id = mentor._id
    if (expandedId === id) {
      setExpandedId(null)
      return
    }
    setExpandedId(id)
    // Fetch lazily — only once per mentor, cache the result
    if (!studentsByMentor[id]) {
      setStudentsLoading(id)
      try {
        const res = await deptAdminService.getMentorStudents(id)
        if (res.success) {
          setStudentsByMentor(prev => ({ ...prev, [id]: res.data }))
        }
      } catch {
        setStudentsByMentor(prev => ({ ...prev, [id]: [] }))
      } finally {
        setStudentsLoading(null)
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.branchId) return setError('Email and branch are required')
    if (!form.maxStudents || Number(form.maxStudents) < 1) return setError('Enter a valid max students value (at least 1)')
    setSubmitting(true); setError('')
    try {
      const res = await deptAdminService.createMentor(form)
      if (res.success) { setShowModal(false); setForm({ email: '', branchId: '', maxStudents: 20 }); loadMentors() }
      else setError(res.message || 'Failed to create mentor')
    } catch (err) {
      setError(err.response?.data?.message || 'Error occurred')
    } finally { setSubmitting(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this mentor?')) return
    try {
      await deptAdminService.deleteMentor(id)
      if (expandedId === id) setExpandedId(null)
      loadMentors()
    }
    catch { alert('Failed to delete') }
  }

  const openEdit = (mentor) => {
    setEditingMentor(mentor)
    setEditForm({
      branchId: mentor.branch?._id || '',
      maxStudents: mentor.maxStudents ?? ''
    })
    setEditError('')
  }

  const closeEdit = () => {
    setEditingMentor(null)
    setEditForm({ branchId: '', maxStudents: '' })
    setEditError('')
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!editForm.branchId) return setEditError('Branch is required')
    if (editForm.maxStudents === '' || Number(editForm.maxStudents) < 0) {
      return setEditError('Enter a valid max students value')
    }
    setSaving(true); setEditError('')
    try {
      const res = await deptAdminService.updateMentor(editingMentor._id, {
        branchId: editForm.branchId,
        maxStudents: editForm.maxStudents
      })
      if (res.success) { closeEdit(); loadMentors() }
      else setEditError(res.message || 'Failed to update mentor')
    } catch (err) {
      setEditError(err.response?.data?.message || 'Error occurred')
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mentor Management</h1>
          <p className="text-gray-600">Add and manage mentors in your department</p>
        </div>
        <button onClick={() => { setForm({ email: '', branchId: '', maxStudents: 20 }); setError(''); setShowModal(true) }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" /> Add Mentor
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>
      ) : mentors.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
          <User className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No mentors yet. Add your first mentor.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['', 'Mentor', 'Branch', 'Students', 'Actions'].map((h, i) => (
                  <th key={i} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {mentors.map(m => {
                const isExpanded = expandedId === m._id
                const studentCount = m.currentStudentCount || 0
                return (
                  <React.Fragment key={m._id}>
                    <tr
                      className={`hover:bg-gray-50 ${studentCount > 0 ? 'cursor-pointer' : ''}`}
                      onClick={() => studentCount > 0 && toggleExpand(m)}
                    >
                      <td className="pl-4 py-4 w-8">
                        {studentCount > 0 && (
                          isExpanded
                            ? <ChevronDown className="h-4 w-4 text-gray-400" />
                            : <ChevronRight className="h-4 w-4 text-gray-400" />
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {m.profilePhoto
                            ? <img src={m.profilePhoto} alt={m.name} className="h-9 w-9 rounded-full object-cover" />
                            : <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center"><User className="h-4 w-4 text-green-600" /></div>
                          }
                          <div>
                            <p className="font-medium text-gray-900">{m.name}</p>
                            <p className="text-sm text-gray-500">{m.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm text-gray-700">
                          <GitBranch className="h-3 w-3 text-blue-500" />
                          {m.branch?.name || '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{studentCount} / {m.maxStudents}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <button onClick={() => openEdit(m)} className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50" title="Edit">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(m._id)} className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr>
                        <td colSpan={5} className="bg-gray-50 px-6 py-4">
                          {studentsLoading === m._id ? (
                            <div className="flex justify-center py-4">
                              <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full" />
                            </div>
                          ) : (studentsByMentor[m._id] || []).length === 0 ? (
                            <p className="text-sm text-gray-500 pl-8">No students found.</p>
                          ) : (
                            <div className="pl-8 space-y-2">
                              {studentsByMentor[m._id].map(s => (
                                <div key={s._id} className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-4 py-2">
                                  <div className="flex items-center gap-2">
                                    <Award className="h-3.5 w-3.5 text-gray-400" />
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">{s.name}</p>
                                      <p className="text-xs text-gray-500">{s.email}</p>
                                    </div>
                                  </div>
                                  <div className="text-xs text-gray-500 text-right">
                                    <p>{s.enrollmentNo || '—'}</p>
                                    <p>{s.branch?.name || '—'}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Mentor Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => !submitting && setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Add Mentor</h3>
              <button onClick={() => setShowModal(false)} disabled={submitting}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gmail Address <span className="text-red-500">*</span></label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="mentor@gmail.com" />
                <p className="text-xs text-gray-500 mt-1">Mentor will login using this Google account. Their name and photo will be fetched automatically.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Branch <span className="text-red-500">*</span></label>
                <select value={form.branchId} onChange={e => setForm(f => ({ ...f, branchId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Branch</option>
                  {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                </select>
                {branches.length === 0 && <p className="text-xs text-amber-600 mt-1">No branches found. Create branches first.</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Students <span className="text-red-500">*</span></label>
                <input type="number" min={1} value={form.maxStudents}
                  onChange={e => setForm(f => ({ ...f, maxStudents: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="20" />
                <p className="text-xs text-gray-500 mt-1">How many students this mentor can be assigned. Defaults to 20 — increase as needed.</p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} disabled={submitting} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {submitting ? 'Adding...' : 'Add Mentor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Mentor Modal */}
      {editingMentor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => !saving && closeEdit()} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Edit Mentor</h3>
              <button onClick={closeEdit} disabled={saving}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {editError && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{editError}</div>}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gmail Address</label>
                <input type="email" value={editingMentor.email} disabled
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500" />
                <p className="text-xs text-gray-500 mt-1">Email can't be changed — it's tied to the mentor's Google login.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch <span className="text-red-500">*</span></label>
                <select value={editForm.branchId} onChange={e => setEditForm(f => ({ ...f, branchId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Branch</option>
                  {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Students <span className="text-red-500">*</span></label>
                <input type="number" min={editingMentor.currentStudentCount || 0} value={editForm.maxStudents}
                  onChange={e => setEditForm(f => ({ ...f, maxStudents: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <p className="text-xs text-gray-500 mt-1">Currently has {editingMentor.currentStudentCount || 0} assigned student(s).</p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeEdit} disabled={saving} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default DeptMentorManagement