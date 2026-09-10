import api from './api'

export const authService = {
  // Login user
  login: async (email, password) => {
    try {
      console.log('AuthService: Making login request...') // Debug
      const response = await api.post('/auth/login', { email, password })
      console.log('AuthService: Login response received:', response.data) // Debug
      return response.data
    } catch (error) {
      console.error('AuthService: Login error:', error.response?.data || error.message)
      throw error
    }
  },

  // Get user profile
  getProfile: async () => {
    try {
      const response = await api.get('/auth/profile')
      return response.data
    } catch (error) {
      console.error('AuthService: Get profile error:', error)
      throw error
    }
  },

  // Verify token
  verifyToken: async () => {
    try {
      console.log('AuthService: Verifying token...') // Debug
      const response = await api.get('/auth/verify')
      console.log('AuthService: Token verification response:', response.data) // Debug
      return response.data
    } catch (error) {
      console.error('AuthService: Token verification error:', error.response?.data || error.message)
      throw error
    }
  },

  // Logout
  logout: async () => {
    try {
      const response = await api.post('/auth/logout')
      return response.data
    } catch (error) {
      console.error('AuthService: Logout error:', error)
      throw error
    }
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await api.put('/auth/change-password', {
        currentPassword,
        newPassword
      })
      return response.data
    } catch (error) {
      console.error('AuthService: Change password error:', error)
      throw error
    }
  }
}