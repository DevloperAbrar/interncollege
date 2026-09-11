import React, { useState, useEffect } from 'react'
import { deptAdminService } from '../../services/deptAdminService'
import { Search, UserPlus, Check, Filter, ChevronDown, X, User } from 'lucide-react'

const SEMESTER_OPTIONS = [
  { value: 'any_internship',   label: 'Any Internship' },
  { value: '6th_internship',   label: '6th Sem Internship' },
  { value: '7th_internship',   label: '7th Sem Internship' },
  { value: '8th_internship',   label: '8th Sem Internship / Project' },
]

const AssignStudents = () => {
  const [mentors, setMentors]       = useState([])
  const [mentorId, setMentorId]     = useState('')
  const [semester, setSemester]     = useState('')
  const [students, setStudents]     = useState([])
  const [selected, setSelected]     = useState([])   // array of studentId strings
  const [loading, setLoading]       = useState(false)
  const [assigning, setAssigning]   = useState(false)
  const [filters, setFilters]       = useState({ branchCode: '', search: '' })
  const [success, setSuccess]       = useState('')
  const [error, setError]           = useState('')

  useEffect(() => { loadMentors(); loadStudents() }, [])

  const loadMentors = async () => {
    try {
      const res = await deptAdminService.getMentors()
      if (res.success) setMentors(res.data)
    } catch {}
  }

  const loadStudents = async () => {
    setLoading(true); setError('')
    try {
      const res = await deptAdminService.getAllStudents(filters)
      if (res.success) setStudents(res.data)
    } catch { setError('Failed to load students') }
    finally { setLoading(false) }
  }

  const toggle = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const selectAll = () => setSelected(students.map(s => s._id))
  const clearAll = () => setSelected([])

  const handleAssign = async () => {
    if (!mentorId) return setError('Please select a mentor')
    if (!semester) return setError('Please select a semester to assign')
    if (selected.length === 0) return setError('Select at least one student')

    setAssigning(true); setError(''); setSuccess('')
    try {
      const res = await deptAdminService.assignStudents(mentorId, selected, semester)
      if (res.success) {
        setSuccess(`${selected.length} student(s) assigned successfully!`)
        setSelected([])
        loadStudents()
      } else setError(res.message || 'Failed to assign students')
    } catch (err) {
      setError(err.response?.data?.message || 'Error occurred')
    } finally { setAssigning(false) }
  }

  const handleRemove = async (studentId) => {
    if (!confirm('Remove this student from their mentor?')) return
    try {
      await deptAdminService.unassignStudent(studentId)
      loadStudents()
    } catch { alert('Failed to remove') }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Assign Students</h1>
        <p className="text-gray-600">Assign or reassign students to a mentor with a shared semester type</p>
      </div>

      {/* Mentor + Semester selection */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Mentor <span className="text-red-500">*</span></label>
            <select
              value={mentorId}
              onChange={e => setMentorId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Mentor</option>
              {mentors.map(m => (
                <option key={m._id} value={m._id}>
                  {m.name} ({m.currentStudentCount || 0}/{m.maxStudents}) — {m.branch?.name || 'No branch'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign Semester (applies to all selected) <span className="text-red-500">*</span></label>
            <select
              value={semester}
              onChange={e => setSemester(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Semester</option>
              {SEMESTER_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by name, email, enrollment..."
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              className="flex-1 border-0 outline-none text-sm text-gray-900 placeholder-gray-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Branch code (e.g. io, cs)"
              value={filters.branchCode}
              onChange={e => setFilters(f => ({ ...f, branchCode: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button onClick={loadStudents} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
            Search
          </button>
        </div>
      </div>

      {/* Status messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm flex items-center gap-2">
          <Check className="h-4 w-4" />{success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')}><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Action bar */}
      {selected.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-5 py-3 flex items-center justify-between">
          <span className="text-blue-800 text-sm font-medium">{selected.length} student(s) selected</span>
          <div className="flex items-center gap-2">
            <button onClick={clearAll} className="text-gray-600 text-sm hover:underline">Clear</button>
            <button
              onClick={handleAssign}
              disabled={assigning}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              {assigning ? 'Assigning...' : `Assign ${selected.length} Student(s)`}
            </button>
          </div>
        </div>
      )}

      {/* Student list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500">No students found matching your filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <span className="text-sm text-gray-600">{students.length} student(s) found</span>
            <button onClick={selectAll} className="text-blue-600 text-sm hover:underline">
              Select All
            </button>
          </div>

          <div className="grid grid-cols-12 gap-2 px-6 py-2 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase">
            <div className="col-span-1"></div>
            <div className="col-span-4">Student</div>
            <div className="col-span-3">Enrollment / Branch</div>
            <div className="col-span-3">Current Mentor</div>
            <div className="col-span-1"></div>
          </div>

          <div className="divide-y divide-gray-100">
            {students.map(s => (
              <div
                key={s._id}
                className={`grid grid-cols-12 gap-2 items-center px-6 py-4 transition-colors ${
                  selected.includes(s._id) ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="col-span-1 cursor-pointer" onClick={() => toggle(s._id)}>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    selected.includes(s._id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                  }`}>
                    {selected.includes(s._id) && <Check className="h-3 w-3 text-white" />}
                  </div>
                </div>

                <div className="col-span-4 cursor-pointer min-w-0" onClick={() => toggle(s._id)}>
                  <p className="font-medium text-gray-900 truncate">{s.name || s.email.split('@')[0]}</p>
                  <p className="text-sm text-gray-500 truncate">{s.email}</p>
                </div>

                <div className="col-span-3">
                  <p className="text-sm font-medium text-gray-700">{s.enrollmentNo || '—'}</p>
                  {s.branchCode && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{s.branchCode}</span>
                  )}
                </div>

                <div className="col-span-3">
                  {s.assignedMentor ? (
                    <div className="flex items-center gap-1.5 text-sm text-gray-700">
                      <User className="h-3.5 w-3.5 text-green-600" />
                      <span className="truncate">{s.assignedMentor.name}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded">Unassigned</span>
                  )}
                </div>

                <div className="col-span-1 text-right">
                  {s.assignedMentor && (
                    <button
                      onClick={() => handleRemove(s._id)}
                      className="text-red-500 hover:text-red-700 text-xs hover:underline"
                      title="Remove from mentor"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default AssignStudents