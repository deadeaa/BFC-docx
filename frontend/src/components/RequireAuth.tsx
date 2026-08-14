import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { Role } from '../types'

interface Props {
  children: ReactNode
  roles?: Role[]
}

export default function RequireAuth({ children, roles }: Props) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#F5F0E8]">
        <div className="h-10 w-10 border-3 border-brand-green border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}