// Enhanced api.js with better debugging
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL

console.log('API Base URL:', API_BASE_URL) // Debug log

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    
    // Enhanced debugging
    console.log('🔍 Token exists:', !!token)
    console.log('🔍 Token length:', token ? token.length : 0)
    console.log('🔍 User exists:', !!user)
    console.log('🔍 User data:', user ? JSON.parse(user) : null)
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('✅ Authorization header added')
    } else {
      console.log('❌ No token found in localStorage')
    }
    
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`)
    console.log('🔍 Request headers:', config.headers)
    
    return config
  },
  (error) => {
    console.error('❌ API Request error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`)
    return response
  },
  (error) => {
    console.error('❌ API Response error details:')
    console.error('  Status:', error.response?.status)
    console.error('  Status Text:', error.response?.statusText)
    console.error('  Data:', error.response?.data)
    console.error('  Headers:', error.response?.headers)
    console.error('  Full Error:', error)
    
    if (error.response?.status === 401) {
      console.log('🔐 401 error - clearing storage and redirecting to login')
      localStorage.removeItem('token')
      localStorage.removeItem('user') // Also clear user data
      
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Create form data axios instance for file uploads
const apiFormData = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'multipart/form-data'
  }
})

// Add auth token to form data requests
apiFormData.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Handle form data response errors
apiFormData.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user') // Also clear user data
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export { api, apiFormData }
export default api