import React, { useState, useEffect } from 'react'
import api from '../services/api'
import { Search, Users, UserCheck, Building2, Calendar, Clock, Filter } from 'lucide-react'

const ROLE_CFG = {
  student:    { label: 'Student',    bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-200'   },
  mentor:     { label: 'Mentor',     bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-200'  },
  dept_admin: { label: 'Dept Admin', bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
}

const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }) : '—'

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  }) : '—'

const timeAgo = (d) => {
  if (!d) return '—'
  const diff = Date.now() - new Date(d).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'Just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7)   return `${days}d ago`
  return fmtDate(d)
}

const RoleBadge = ({ role }) => {
  const cfg = ROLE_CFG[role] || { label: role, bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {cfg.label}
    </span>
  )
}

const LogsPage = () => {
  const [logs, setLogs]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  useEffect(() => { load() }, [search, roleFilter])

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/logs', {
        params: { search, role: roleFilter }
      })
      if (res.data?.success) setLogs(res.data.data)
    } catch (e) {
      console.error('Logs load error:', e)
    } finally {
      setLoading(false)
    }
  }

  // Summary counts
  const counts = {
    total:      logs.length,
    students:   logs.filter(l => l.role === 'student').length,
    mentors:    logs.filter(l => l.role === 'mentor').length,
    deptAdmins: logs.filter(l => l.role === 'dept_admin').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Logs</h1>
        <p className="text-gray-600">Last activity time for all students, mentors and department admins</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Users',    val: counts.total,      icon: Users,     bg: 'bg-gray-50',    border: 'border-gray-200',   text: 'text-gray-700'   },
          { label: 'Students',       val: counts.students,   icon: Users,     bg: 'bg-blue-50',    border: 'border-blue-100',   text: 'text-blue-700'   },
          { label: 'Mentors',        val: counts.mentors,    icon: UserCheck, bg: 'bg-green-50',   border: 'border-green-100',  text: 'text-green-700'  },
          { label: 'Dept Admins',    val: counts.deptAdmins, icon: Building2, bg: 'bg-purple-50',  border: 'border-purple-100', text: 'text-purple-700' },
        ].map(({ label, val, icon: Icon, bg, border, text }) => (
          <div key={label} className={`${bg} border ${border} rounded-2xl p-4 flex items-center gap-3`}>
            <div className={`p-2 rounded-xl ${bg}`}>
              <Icon className={`h-5 w-5 ${text}`} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${text}`}>{val}</p>
              <p className={`text-xs ${text} font-medium`}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3 flex-wrap">
        <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search by name, email or enrollment no..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] border-0 outline-none text-sm text-gray-900 placeholder-gray-400 bg-transparent"
        />
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Roles</option>
            <option value="student">Students</option>
            <option value="mentor">Mentors</option>
            <option value="dept_admin">Dept Admins</option>
          </select>
        </div>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full flex-shrink-0">
          {logs.length} users
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSkeleton />
      ) : logs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
          <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No users found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Details</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Activity</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map(log => (
                  <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                    {/* User */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                          {log.profilePhoto ? (
                            <img src={log.profilePhoto} alt={log.name} className="w-9 h-9 rounded-full object-cover" />
                          ) : (
                            <span className="text-white font-bold text-sm">
                              {(log.name || log.email || '?')[0].toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{log.name || '—'}</p>
                          <p className="text-xs text-gray-400 truncate">{log.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-5 py-4">
                      <RoleBadge role={log.role} />
                    </td>

                    {/* Details */}
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        {log.enrollmentNo && (
                          <p className="text-xs text-gray-600 font-mono bg-gray-100 px-2 py-0.5 rounded w-fit">
                            {log.enrollmentNo}
                          </p>
                        )}
                        {log.branch && (
                          <p className="text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded w-fit border border-blue-100">
                            {log.branch}
                          </p>
                        )}
                        {log.department && (
                          <p className="text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded w-fit border border-purple-100">
                            {log.department}
                          </p>
                        )}
                        {log.assignedMentor && (
                          <p className="text-xs text-gray-500">Mentor: {log.assignedMentor}</p>
                        )}
                      </div>
                    </td>

                    {/* Joined */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        {fmtDate(log.createdAt)}
                      </div>
                    </td>

                    {/* Last Activity */}
                    <td className="px-5 py-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                          <Clock className="h-3.5 w-3.5 text-gray-400" />
                          {timeAgo(log.lastActivity)}
                        </div>
                        <p className="text-xs text-gray-400 pl-5">{fmtDateTime(log.lastActivity)}</p>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        log.isActive
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {log.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

const LoadingSkeleton = () => (
  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-gray-100 animate-pulse">
        <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-3 bg-gray-200 rounded w-1/3" />
        </div>
        <div className="h-6 bg-gray-200 rounded w-20" />
        <div className="h-4 bg-gray-200 rounded w-24" />
        <div className="h-4 bg-gray-200 rounded w-28" />
      </div>
    ))}
  </div>
)

export default LogsPage