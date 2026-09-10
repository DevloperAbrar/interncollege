import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext()

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: true,
  error: null
}

const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'LOGIN_SUCCESS':
      localStorage.setItem('token', action.payload.token)
      localStorage.setItem('user', JSON.stringify(action.payload.user))
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null
      }
    case 'LOGIN_FAILURE':
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: action.payload
      }
    case 'LOGOUT':
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: null
      }
    case 'UPDATE_USER':
      localStorage.setItem('user', JSON.stringify(action.payload))
      return {
        ...state,
        user: action.payload
      }
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      }
    case 'RESTORE_USER':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false
      }
    default:
      return state
  }
}

export const AuthContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // ─── Initialize from localStorage on mount ───────────────────────────────
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token')
      const userData = localStorage.getItem('user')

      if (token && userData) {
        try {
          const user = JSON.parse(userData)

          // Optimistically restore from cache first so UI doesn't flash
          dispatch({
            type: 'RESTORE_USER',
            payload: { user, token }
          })

          // Then verify in background
          try {
            const response = await authService.verifyToken()
            if (response.success) {
              dispatch({
                type: 'RESTORE_USER',
                payload: { user: response.data.user, token }
              })
            } else {
              dispatch({ type: 'LOGOUT' })
            }
          } catch {
            // If verify fails (network etc.) keep the cached user to avoid
            // kicking logged-in users offline unnecessarily
            dispatch({ type: 'SET_LOADING', payload: false })
          }
        } catch {
          dispatch({ type: 'LOGOUT' })
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }

    initializeAuth()
  }, [])

  // ─── Email / password login ───────────────────────────────────────────────
  const login = async (email, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const response = await authService.login(email, password)

      if (response.success) {
        dispatch({ type: 'LOGIN_SUCCESS', payload: response.data })
        return { success: true, user: response.data.user }
      } else {
        dispatch({ type: 'LOGIN_FAILURE', payload: response.message })
        return { success: false, message: response.message }
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed'
      dispatch({ type: 'LOGIN_FAILURE', payload: message })
      return { success: false, message }
    }
  }

  // ─── Google / Auth0 login ─────────────────────────────────────────────────
  // Called by Login.jsx after it has already stored token+user in localStorage
  // via the backend google-login endpoint. We just need to hydrate the context.
  const googleLoginSuccess = (user, token) => {
    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: { user, token }
    })
  }

  // ─── Logout ───────────────────────────────────────────────────────────────
  const logout = async () => {
    try {
      await authService.logout()
    } catch {
      // ignore
    } finally {
      dispatch({ type: 'LOGOUT' })
    }
  }

  const updateUser = (userData) => {
    dispatch({ type: 'UPDATE_USER', payload: userData })
  }

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' })
  }

  const value = {
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,
    login,
    googleLoginSuccess,
    logout,
    updateUser,
    clearError
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within AuthContextProvider')
  }
  return context
}