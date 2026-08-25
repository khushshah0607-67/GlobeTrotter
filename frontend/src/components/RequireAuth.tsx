import { type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { LoadingSpinner } from './LoadingSpinner'
import { useAuth } from '../hooks/useAuth'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { token, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
