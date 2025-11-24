import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useUser } from '@/contexts/UserContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireJury?: boolean
}

export function ProtectedRoute({ children, requireJury = false }: ProtectedRouteProps) {
  const { user, isJury } = useUser()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!user) {
      navigate('/login', { replace: true })
      return
    }

    // Redirect employees to dashboard if they try to access jury-only routes
    if (requireJury && !isJury) {
      navigate('/', { replace: true })
    }
    
    // Also redirect employees if they're on any non-dashboard page
    if (!isJury && location.pathname !== '/') {
      navigate('/', { replace: true })
    }
  }, [user, isJury, requireJury, navigate, location.pathname])

  if (!user) {
    return null
  }

  if (requireJury && !isJury) {
    return null
  }

  return <>{children}</>
}