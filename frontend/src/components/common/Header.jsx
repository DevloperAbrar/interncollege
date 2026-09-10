import React, { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { getInitials, getRandomColor } from '../../utils/helpers'
import { Bell, LogOut, ChevronDown } from 'lucide-react'

const Header = () => {
  const { user, logout } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleLogout = () => {
    logout()
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left side - Title */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {user?.role === 'admin' && 'Admin Dashboard'}
            {user?.role === 'mentor' && 'Mentor Dashboard'}
            {user?.role === 'student' && 'Student Portal'}
          </h1>
          <p className="text-sm text-gray-500">
            Welcome back, {user?.name}
          </p>
        </div>

        {/* Right side - User menu */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="p-2 text-gray-400 hover:text-gray-600 relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-3 text-sm bg-gray-50 rounded-lg px-3 py-2 hover:bg-gray-100 transition-colors"
            >
              <div className={`h-8 w-8 rounded-full ${getRandomColor()} flex items-center justify-center text-white text-sm font-medium`}>
                {getInitials(user?.name)}
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>

                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    onMouseDown={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {dropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setDropdownOpen(false)}
        ></div>
      )}
    </header>
  )
}

export default Header