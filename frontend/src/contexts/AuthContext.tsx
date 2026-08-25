import {
  createContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { apiClient, getApiErrorMessage } from '../api/client'

export type AuthUser = {
  id: string
  full_name: string
  email: string
  created_at: string
  updated_at: string
}

type AuthContextValue = {
  token: string | null
  user: AuthUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<AuthUser>
  register: (full_name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const TOKEN_KEY = 'globetrotter_token'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    return window.localStorage.getItem(TOKEN_KEY)
  })
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const clearSession = () => {
    window.localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }

  useEffect(() => {
    const handleUnauthorized = () => clearSession()
    window.addEventListener('globetrotter:unauthorized', handleUnauthorized)

    const restoreSession = async () => {
      const savedToken = window.localStorage.getItem(TOKEN_KEY)

      if (!savedToken) {
        setIsLoading(false)
        return
      }

      try {
        const response = await apiClient.get('/api/v1/auth/me')
        setUser(response.data)
        setToken(savedToken)
      } catch {
        clearSession()
      } finally {
        setIsLoading(false)
      }
    }

    void restoreSession()

    return () => window.removeEventListener('globetrotter:unauthorized', handleUnauthorized)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/api/v1/auth/login', {
        email,
        password,
      })

      const nextToken = response.data.access_token as string
      window.localStorage.setItem(TOKEN_KEY, nextToken)
      setToken(nextToken)

      const meResponse = await apiClient.get('/api/v1/auth/me')
      setUser(meResponse.data)

      return meResponse.data as AuthUser
    } catch (error) {
      throw new Error(getApiErrorMessage(error))
    }
  }

  const register = async (full_name: string, email: string, password: string) => {
    try {
      await apiClient.post('/api/v1/auth/register', {
        full_name,
        email,
        password,
      })
    } catch (error) {
      throw new Error(getApiErrorMessage(error))
    }
  }

  const logout = () => {
    clearSession()
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isLoading,
      login,
      register,
      logout,
    }),
    [token, user, isLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export { AuthContext }
