import React, { useState, useEffect } from 'react'
import { deptAdminService } from '../../services/deptAdminService'
import { Plus, Trash2, GitBranch, Pencil, Check, X } from 'lucide-react'

const BranchManagement = () => {
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)

  // Edit state
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editError, setEditError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const res = await deptAdminService.getBranches()
      if (res.success) setBranches(res.data)
    } finally { setLoading(false) }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!name.trim()) return setError('Branch name is required')
    setCreating(true); setError('')
    try {
      const res = await deptAdminService.createBranch(name.trim())
      if (res.success) { setName(''); load() }
      else setError(res.message || 'Failed to create branch')
    } catch (err) {
      setError(err.response?.data?.message || 'Error occurred')
    } finally { setCreating(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this branch?')) return
    try { await deptAdminService.deleteBranch(id); load() }
    catch { alert('Failed to delete branch') }
  }

  const startEdit = (branch) => {
    setEditingId(branch._id)
    setEditName(branch.name)
    setEditError('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditError('')
  }

  const handleUpdate = async (id) => {
    if (!editName.trim()) return setEditError('Branch name is required')
    setSaving(true); setEditError('')
    try {
      const res = await deptAdminService.updateBranch(id, editName.trim())
      if (res.success) {
        cancelEdit()
        load()
      } else {
        setEditError(res.message || 'Failed to update branch')
      }
    } catch (err) {
      setEditError(err.response?.data?.message || 'Error occurred')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Branch Management</h1>
        <p className="text-gray-600">Manage branches in your department</p>
      </div>

      {/* Create form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Create New Branch</h3>
        <form onSubmit={handleCreate} className="flex gap-3">
          <input type="text" value={name} onChange={e => { setName(e.target.value); setError('') }}
            placeholder="Branch name (e.g. Computer Science)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button type="submit" disabled={creating}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
            <Plus className="h-4 w-4" /> {creating ? 'Creating...' : 'Create'}
          </button>
        </form>
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-8"><div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full" /></div>
      ) : branches.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
          <GitBranch className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No branches yet. Create your first branch above.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branch Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {branches.map(b => (
                <tr key={b._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {editingId === b._id ? (
                      <div>
                        <div className="flex items-center gap-2">
                          <GitBranch className="h-4 w-4 text-blue-500 shrink-0" />
                          <input
                            type="text"
                            value={editName}
                            autoFocus
                            onChange={e => { setEditName(e.target.value); setEditError('') }}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleUpdate(b._id)
                              if (e.key === 'Escape') cancelEdit()
                            }}
                            className="flex-1 px-3 py-1.5 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </div>
                        {editError && <p className="text-red-600 text-xs mt-1">{editError}</p>}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <GitBranch className="h-4 w-4 text-blue-500" />
                        <span className="font-medium text-gray-900">{b.name}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(b.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    {editingId === b._id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleUpdate(b._id)}
                          disabled={saving}
                          className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50 disabled:opacity-50"
                          title="Save"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={saving}
                          className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                          title="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEdit(b)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(b._id)}
                          className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default BranchManagement