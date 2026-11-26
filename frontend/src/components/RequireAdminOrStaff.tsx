import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RequireAdminOrStaff({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#F5F0E8]">
        <div className="h-10 w-10 border-[3px] border-brand-green border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  const isAdmin = user.role === 'admin'
  const isTSStaff = user.role === 'ts' && user.jabatan === 'staff'

  if (!isAdmin && !isTSStaff) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}