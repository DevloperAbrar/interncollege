import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { validateEmail } from '../../utils/validation'
import { Eye, EyeOff, LogIn, Lock } from 'lucide-react'
import { useAuth0 } from '@auth0/auth0-react' 

const AdminLogin = () => {
  const { login, googleLoginSuccess, loading, error } = useAuth()
  const navigate = useNavigate()
  const {
    loginWithRedirect,
    isAuthenticated,
    user: auth0User,
    getAccessTokenSilently,
    logout: auth0Logout,
    isLoading: auth0Loading
  } = useAuth0()

  const [formData, setFormData] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [formErrors, setFormErrors] = useState({})
  const [isProcessingAuth0, setIsProcessingAuth0] = useState(false)

  // Prevent double-processing on StrictMode / re-renders
  const processingRef = useRef(false)

  // ─── Handle Auth0 callback ──────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !auth0User || auth0Loading || processingRef.current) return

    processingRef.current = true
    setIsProcessingAuth0(true)

    const handleAuth0Login = async () => {
      try {
        const accessToken = await getAccessTokenSilently()

        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/google-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: auth0User.email,
            name: auth0User.name,
            auth0Sub: auth0User.sub,
            accessToken
          })
        })

        const data = await response.json()

        if (data.success) {
          const { token, user } = data.data

          // 1. Persist to localStorage
          localStorage.setItem('token', token)
          localStorage.setItem('user', JSON.stringify(user))

          // 2. Hydrate AuthContext (prevents the login-page redirect loop)
          googleLoginSuccess(user, token)

          // 3. Route by role
          const roleRoutes = {
            admin: '/admin/dashboard',
            mentor: '/mentor/dashboard',
            student: '/student/dashboard'
          }
          navigate(roleRoutes[user.role] || '/student/dashboard', { replace: true })
        } else {
          setFormErrors({ general: data.message || 'Google login failed. Please try again.' })
          setIsProcessingAuth0(false)
          processingRef.current = false

          await auth0Logout({
            logoutParams: { returnTo: window.location.origin + '/login' }
          })
        }
      } catch (err) {
        console.error('Auth0 login error:', err)
        setFormErrors({ general: 'Failed to complete Google login. Please try again.' })
        setIsProcessingAuth0(false)
        processingRef.current = false

        await auth0Logout({
          logoutParams: { returnTo: window.location.origin + '/login' }
        })
      }
    }

    handleAuth0Login()
  }, [isAuthenticated, auth0User, auth0Loading]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Email / password submit ────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }))
  }

  const validateForm = () => {
    const errors = {}
    if (!validateEmail(formData.email)) errors.email = 'Please enter a valid email address'
    if (!formData.password) errors.password = 'Password is required'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    const result = await login(formData.email, formData.password)

    if (result.success) {
      const roleRoutes = {
        admin: '/admin/dashboard',
        mentor: '/mentor/dashboard',
        student: '/student/dashboard'
      }
      navigate(roleRoutes[result.user?.role] || '/student/dashboard', { replace: true })
    } else {
      setFormErrors({ general: result.message })
    }
  }

  // ─── Google login button ────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    try {
      await loginWithRedirect({
        authorizationParams: {
          connection: 'google-oauth2',
          redirect_uri: window.location.origin + '/login',
          prompt: 'select_account'
        }
      })
    } catch {
      setFormErrors({ general: 'Failed to initiate Google login. Please try again.' })
    }
  }

  // ─── Loading spinner while Auth0 processes ──────────────────────────────
  if (isProcessingAuth0 || (auth0Loading && isAuthenticated)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Completing Google login...</p>
          <p className="mt-2 text-sm text-gray-500">You will be redirected to your dashboard</p>
        </div>
      </div>
    )
  }

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">Welcome to InternTrack</h2>
            <p className="mt-3 text-sm text-gray-600">Sign in to your account to manage internships</p>
          </div>

          {/* Error Message */}
          {(error || formErrors.general) && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600 text-center">{error || formErrors.general}</p>
            </div>
          )}

          {/* Google Login */}
          <div className="mt-8">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={auth0Loading}
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 px-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {auth0Loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-700 border-t-transparent"></div>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </>
              )}
            </button>
            <p className="mt-2 text-xs text-center text-gray-500">
              Google login is available for students only
            </p>
          </div>

          {/* Divider */}
          <div className="mt-6 mb-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Or continue with email</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 border-2 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${formErrors.email ? 'border-red-300' : 'border-gray-300 hover:border-gray-400'}`}
                placeholder="Enter your email address"
              />
              {formErrors.email && <p className="mt-2 text-sm text-red-600">{formErrors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 pr-12 border-2 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${formErrors.password ? 'border-red-300' : 'border-gray-300 hover:border-gray-400'}`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword
                    ? <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    : <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  }
                </button>
              </div>
              {formErrors.password && <p className="mt-2 text-sm text-red-600">{formErrors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5 mr-3" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 text-center">
                <strong>Need access?</strong> Contact your administrator for login credentials.
              </p>
            </div>
            <p className="mt-4 text-xs text-gray-500 text-center">
              Secure login powered by InternTrack
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin
