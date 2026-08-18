// frontend/src/lib/roles.ts
import type { Role } from '../types'

// Satu-satunya sumber label tampilan Role di seluruh aplikasi.
export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrator',
  ppic: 'PPIC',
  produksi: 'Produksi',
  qa: 'QA',
  ts: 'Technical Services',
}

export function roleLabel(role: Role | string | undefined | null): string {
  if (!role) return ''
  return ROLE_LABELS[role as Role] ?? role
}

// Role yang diizinkan untuk Sign Up mandiri
export const SIGNUP_ROLES: Role[] = ['produksi', 'qa', 'ppic']

// Role dengan akses admin (full access)
export const ADMIN_ROLES: Role[] = ['admin', 'ts']

export function isAdminRole(role: Role | string | undefined | null): boolean {
  if (!role) return false
  return ADMIN_ROLES.includes(role as Role)
}