import React, { useState, useEffect } from 'react'
import { mentorService } from '../../services/mentorService'
import { Search, UserPlus, Check, Filter, ChevronDown, UserCheck } from 'lucide-react'

const SEMESTER_OPTIONS = [
  { value: 'any_internship',   label: 'Any Internship' },
  { value: '6th_internship',   label: '6th Sem Internship' },
  { value: '7th_internship',   label: '7th Sem Internship' },
  { value: '8th_internship',   label: '8th Sem Internship / Project' },
]

const AddStudents = () => {
  const [students, setStudents]         = useState([])
  const [selected, setSelected]         = useState([])          // [{ studentId, semester }]
  const [loading, setLoading]           = useState(false)
  const [adding, setAdding]             = useState(false)
  const [filters, setFilters]           = useState({ branchCode: '', search: '' })
  const [success, setSuccess]           = useState('')
  const [error, setError]               = useState('')
  const [semesterMap, setSemesterMap]   = useState({})          // { studentId: semesterValue }

  const load = async () => {
    setLoading(true); setError('')
    try {
      const res = await mentorService.getAvailableStudents(filters)
      if (res.success) setStudents(res.data)
    } catch { setError('Failed to load students') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  // Toggle student selection
  const toggle = (id) => {
    setSelected(prev =>
      prev.some(s => s.studentId === id)
        ? prev.filter(s => s.studentId !== id)
        : [...prev, { studentId: id, semester: semesterMap[id] || '' }]
    )
  }

  const isSelected = (id) => selected.some(s => s.studentId === id)

  // Update semester for a student (in both semesterMap and selected list)
  const setSemester = (studentId, semester) => {
    setSemesterMap(prev => ({ ...prev, [studentId]: semester }))
    setSelected(prev =>
      prev.map(s => s.studentId === studentId ? { ...s, semester } : s)
    )
  }

  const handleAdd = async () => {
    // Validate all selected students have a semester assigned
    const missing = selected.filter(s => !s.semester)
    if (missing.length > 0) {
      setError(`Please assign a semester type to all selected students (${missing.length} missing)`)
      return
    }
    if (selected.length === 0) return

    setAdding(true); setError(''); setSuccess('')
    try {
      const res = await mentorService.addStudents(selected)   // now sends [{ studentId, semester }]
      if (res.success) {
        setSuccess(`${selected.length} student(s) added successfully!`)
        setSelected([])
        setSemesterMap({})
        load()
      } else setError(res.message || 'Failed to add students')
    } catch (err) {
      setError(err.response?.data?.message || 'Error occurred')
    } finally { setAdding(false) }
  }

  const selectAll = () => {
    setSelected(
      students
        .filter(s => !s.assignedMentor)
        .map(s => ({
          studentId: s._id,
          semester: semesterMap[s._id] || ''
        }))
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add Students</h1>
        <p className="text-gray-600">Search, select students and assign their semester type</p>
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
          <button onClick={load} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
            Search
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Branch code parsed from college email. <code>23io10mo34@mitsgwl.ac.in</code> → <strong>io</strong>
        </p>
      </div>

      {/* Status messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm flex items-center gap-2">
          <Check className="h-4 w-4" />{success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>
      )}

      {/* Action bar */}
      {selected.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-5 py-3 flex items-center justify-between">
          <span className="text-blue-800 text-sm font-medium">
            {selected.length} student(s) selected
            {selected.filter(s => !s.semester).length > 0 && (
              <span className="text-orange-600 ml-2">
                · {selected.filter(s => !s.semester).length} need semester assigned
              </span>
            )}
          </span>
          <button
            onClick={handleAdd}
            disabled={adding}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            {adding ? 'Adding...' : `Add ${selected.length} Student(s)`}
          </button>
        </div>
      )}

      {/* Student list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500">No unassigned students found matching your filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <span className="text-sm text-gray-600">{students.length} student(s) found</span>
            <button onClick={selectAll} className="text-blue-600 text-sm hover:underline">
              Select All
            </button>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 px-6 py-2 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase">
            <div className="col-span-1"></div>
            <div className="col-span-4">Student</div>
            <div className="col-span-3">Enrollment / Branch</div>
            <div className="col-span-4">Assign Semester</div>
          </div>

          <div className="divide-y divide-gray-100">
            {students.map(s => (
              <div
                key={s._id}
                className={`grid grid-cols-12 gap-2 items-center px-6 py-4 transition-colors ${
                  isSelected(s._id) ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
              >
                {/* Checkbox */}
                <div
                  className="col-span-1 cursor-pointer"
                  onClick={() => toggle(s._id)}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected(s._id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                  }`}>
                    {isSelected(s._id) && <Check className="h-3 w-3 text-white" />}
                  </div>
                </div>

                {/* Student info */}
                <div
                  className="col-span-4 cursor-pointer min-w-0"
                  onClick={() => toggle(s._id)}
                >
                  <p className="font-medium text-gray-900 truncate">{s.name || s.email.split('@')[0]}</p>
                  <p className="text-sm text-gray-500 truncate">{s.email}</p>
                </div>

                {/* Enrollment / branch */}
                <div className="col-span-3">
                  <p className="text-sm font-medium text-gray-700">{s.enrollmentNo || '—'}</p>
                  {s.branchCode && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{s.branchCode}</span>
                  )}
                </div>

                {/* Semester dropdown */}
                <div className="col-span-4">
                  <div className="relative">
                    <select
                      value={semesterMap[s._id] || ''}
                      onChange={e => {
                        setSemester(s._id, e.target.value)
                        // Auto-select the student when semester is picked
                        if (!isSelected(s._id) && e.target.value) {
                          setSelected(prev => [...prev, { studentId: s._id, semester: e.target.value }])
                        }
                      }}
                      className={`w-full appearance-none border rounded-lg px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isSelected(s._id) && !semesterMap[s._id]
                          ? 'border-orange-400 bg-orange-50'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      <option value="">— Select Semester —</option>
                      {SEMESTER_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                  {isSelected(s._id) && !semesterMap[s._id] && (
                    <p className="text-xs text-orange-600 mt-1">Semester required</p>
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

export default AddStudents