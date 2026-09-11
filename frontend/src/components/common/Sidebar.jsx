import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
  LayoutDashboard,
  Users,
  Upload,
  BarChart3,
  FileCheck,
  TrendingUp,
  FileText,
  Calendar,
  GraduationCap,
  BookOpen,
  UserCheck,
  GitBranch,
  UserPlus,
  Building2,
  Activity
} from 'lucide-react'

const iconMap = {
  LayoutDashboard,
  Users,
  Upload,
  BarChart3,
  FileCheck,
  TrendingUp,
  FileText,
  Calendar,
  BookOpen,
  UserCheck,
  GitBranch,
  UserPlus,
  Building2,
  Activity
}

// Navigation config per role
const NAVIGATION = {
  admin: [
    { name: 'Dashboard',          path: '/admin/dashboard',         icon: 'LayoutDashboard' },
    { name: 'Departments',        path: '/admin/departments',       icon: 'BookOpen' },
    { name: 'Dept Admins',        path: '/admin/dept-admins',       icon: 'Building2' },
    // { name: 'Students',           path: '/admin/students',          icon: 'Users' },
    { name: 'Student Progress',   path: '/admin/student-progress',  icon: 'Activity' },
    { name: 'Bulk Upload',        path: '/admin/bulk-upload',       icon: 'Upload' },
    { name: 'System Overview',    path: '/admin/system-overview',   icon: 'BarChart3' },
    { name: 'Logs', path: '/admin/logs', icon: 'FileText' },
  ],
  dept_admin: [
    { name: 'Dashboard',          path: '/dept-admin/dashboard',         icon: 'LayoutDashboard' },
    { name: 'Branches',           path: '/dept-admin/branches',          icon: 'GitBranch' },
    { name: 'Mentors',            path: '/dept-admin/mentors',           icon: 'UserCheck' },
    { name: 'Assign Students',    path: '/dept-admin/assign-students',   icon: 'UserPlus' },   // NEW
    { name: 'Student Progress',   path: '/dept-admin/student-progress',  icon: 'Activity' },
  ],
  mentor: [
    { name: 'Dashboard',          path: '/mentor/dashboard',         icon: 'LayoutDashboard' },
    { name: 'My Students',        path: '/mentor/students',          icon: 'Users' },
    { name: 'Add Students',       path: '/mentor/add-students',      icon: 'UserPlus' },
    { name: 'Student Progress',   path: '/mentor/student-progress',  icon: 'Activity' },
    { name: 'Submissions',        path: '/mentor/submissions',       icon: 'FileCheck' },
    { name: 'Monitoring',         path: '/mentor/monitoring',        icon: 'TrendingUp' },
  ],
  student: [
    { name: 'Dashboard',    path: '/student/dashboard',        icon: 'LayoutDashboard' },
    { name: 'My Progress',  path: '/student/student-progress', icon: 'Activity' },
  ]
}

// Role display labels and colors
const ROLE_CONFIG = {
  admin:      { label: 'Super Admin', badgeClass: 'bg-red-100 text-red-700' },
  dept_admin: { label: 'Dept Admin',  badgeClass: 'bg-purple-100 text-purple-700' },
  mentor:     { label: 'Mentor',      badgeClass: 'bg-green-100 text-green-700' },
  student:    { label: 'Student',     badgeClass: 'bg-blue-100 text-blue-700' }
}

const Sidebar = () => {
  const { user } = useAuth()
  const location = useLocation()

  const navigationItems = NAVIGATION[user?.role] || []
  const roleConfig = ROLE_CONFIG[user?.role] || { label: user?.role, badgeClass: 'bg-gray-100 text-gray-700' }

  const isActiveLink = (path) => location.pathname === path

  const getInitials = (name) => {
    if (!name) return '?'
    const parts = name.trim().split(' ')
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
  }

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen flex flex-col">

      {/* Logo */}
      <div className="flex items-center px-6 py-4 border-b border-gray-200 flex-shrink-0">
        <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <GraduationCap className="h-5 w-5 text-white" />
        </div>
        <span className="ml-3 text-xl font-semibold text-gray-900">InternTrack</span>
      </div>

      {/* Department info for dept_admin */}
      {user?.role === 'dept_admin' && user?.department?.name && (
        <div className="px-4 py-3 bg-purple-50 border-b border-purple-100">
          <p className="text-xs text-purple-500 font-medium uppercase tracking-wide">Department</p>
          <p className="text-sm font-semibold text-purple-800 mt-0.5 truncate">
            {user.department.name}
          </p>
          {user?.program && (
            <p className="text-xs text-purple-600 mt-0.5">{user.program}</p>
          )}
        </div>
      )}

      {/* Branch info for mentor */}
      {user?.role === 'mentor' && user?.branch?.name && (
        <div className="px-4 py-3 bg-green-50 border-b border-green-100">
          <p className="text-xs text-green-500 font-medium uppercase tracking-wide">Branch</p>
          <p className="text-sm font-semibold text-green-800 mt-0.5 truncate">
            {user.branch.name}
          </p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 mt-4 px-3 overflow-y-auto">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = iconMap[item.icon]
            if (!Icon) return null
            const isActive = isActiveLink(item.path)

            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon
                  className={`h-5 w-5 mr-3 flex-shrink-0 ${
                    isActive ? 'text-blue-700' : 'text-gray-400'
                  }`}
                />
                <span className="truncate">{item.name}</span>
              </NavLink>
            )
          })}
        </div>
      </nav>

      {/* User Info */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          {user?.profilePhoto ? (
            <img
              src={user.profilePhoto}
              alt={user.name}
              className="h-9 w-9 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="h-9 w-9 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-white">
                {getInitials(user?.name)}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {user?.name || 'Unknown User'}
            </p>
            <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-0.5 ${roleConfig.badgeClass}`}>
              {roleConfig.label}
            </span>
          </div>
        </div>
      </div>

    </div>
  )
}

export default Sidebar