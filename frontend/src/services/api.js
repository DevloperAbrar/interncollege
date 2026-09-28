import axios from 'axios'

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000/api' : '')

if (!API_BASE_URL) {
  console.error(
    'VITE_API_URL is not set. Add it in Render (Static Site → Environment) and redeploy.'
  )
}

const AUTH_PAGES = ['/login', '/admin-login']

// Clears the session and redirects on 401, but NOT when the 401 came from a
// login attempt itself (wrong password must show an error, not redirect).
const handleUnauthorized = (error) => {
  const status = error.response?.status
  const requestUrl = error.config?.url || ''
  const isLoginAttempt =
    requestUrl.includes('/auth/login') || requestUrl.includes('/auth/google-login')

  if (status === 401 && !isLoginAttempt) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')

    if (!AUTH_PAGES.includes(window.location.pathname)) {
      window.location.href = '/login'
    }
  }
}

const attachToken = (config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}

// ─── JSON instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(attachToken, (error) => Promise.reject(error))

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (import.meta.env.DEV) {
      console.error('API error:', {
        url: error.config?.url,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      })
    }
    handleUnauthorized(error)
    return Promise.reject(error)
  }
)

// ─── Multipart instance (file uploads) ───────────────────────────────────────
const apiFormData = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'multipart/form-data'
  }
})

apiFormData.interceptors.request.use(attachToken, (error) => Promise.reject(error))

apiFormData.interceptors.response.use(
  (response) => response,
  (error) => {
    handleUnauthorized(error)
    return Promise.reject(error)
  }
)

export { api, apiFormData }
export default api