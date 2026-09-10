import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldX } from 'lucide-react'

const UnauthorizedPage = () => {
  const navigate = useNavigate()
  const reason = sessionStorage.getItem('unauth_reason')

  // Clear it so it doesn't persist on refresh
  sessionStorage.removeItem('unauth_reason')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-red-100 p-8 text-center">
        <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <ShieldX className="h-8 w-8 text-red-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Not Eligible for InternTrack
        </h1>

        <p className="text-gray-600 mb-4">
          {reason && reason.length > 0
            ? reason
            : 'You are not registered in the InternTrack system. Only students added by the department can access this platform.'}
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-amber-800">
            <strong>If you believe this is a mistake:</strong>
          </p>
          <ul className="text-sm text-amber-700 mt-2 space-y-1 list-disc list-inside">
            <li>Contact your assigned mentor</li>
            <li>Reach out to your department coordinator</li>
            <li>Ask your mentor to verify your enrollment number and email are correctly uploaded</li>
          </ul>
        </div>

        <button
          onClick={() => navigate('/login')}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
        >
          Back to Login
        </button>
      </div>
    </div>
  )
}

export default UnauthorizedPage