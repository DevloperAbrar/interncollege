import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { useAuth } from '../../hooks/useAuth'

const Callback = () => {
  const navigate = useNavigate()
  const { isAuthenticated, user: auth0User, getAccessTokenSilently, isLoading, logout: auth0Logout } = useAuth0()
  const { googleLoginSuccess } = useAuth()
  const processingRef = useRef(false)

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated || !auth0User) return
    if (processingRef.current) return

    processingRef.current = true

    const handleCallback = async () => {
      try {
        const accessToken = await getAccessTokenSilently()

        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/google-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: auth0User.email,
            name: auth0User.name,
            auth0Sub: auth0User.sub,
            picture: auth0User.picture,
            accessToken
          })
        })

        const data = await response.json()

        if (data.success) {
          const { token, user } = data.data
          localStorage.setItem('token', token)
          localStorage.setItem('user', JSON.stringify(user))
          googleLoginSuccess(user, token)

          const roleRoutes = {
            admin: '/admin/dashboard',
            mentor: '/mentor/dashboard',
            student: '/student/dashboard',
            dept_admin: '/dept-admin/dashboard'
          }
          navigate(roleRoutes[user.role] || '/student/dashboard', { replace: true })
        } else {
          console.error('Backend rejected login:', data.message)
          await auth0Logout({ logoutParams: { returnTo: window.location.origin + '/login' } })
        }
      } catch (err) {
        console.error('Callback error:', err)
        await auth0Logout({ logoutParams: { returnTo: window.location.origin + '/login' } })
      }
    }

    handleCallback()
  }, [isLoading, isAuthenticated, auth0User])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-700 font-medium">Completing sign in...</p>
        <p className="mt-2 text-sm text-gray-500">You'll be redirected shortly</p>
      </div>
    </div>
  )
}

export default Callback