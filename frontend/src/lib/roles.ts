import type { Role, Jabatan, BKReportStatus } from '../types'

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrator',
  ppic: 'PPIC',
  produksi: 'Produksi',
  qa: 'QA',
  ts: 'Technical Services',
}

export const JABATAN_LABELS: Record<Jabatan, string> = {
  staff: 'Staff',
  spv: 'Supervisor (SPV)',
  mgr: 'Manager (MGR)',
}

export function roleLabel(role: Role | string | undefined | null): string {
  if (!role) return ''
  return ROLE_LABELS[role as Role] ?? role
}

export function jabatanLabel(jabatan?: Jabatan | string | null): string {
  if (!jabatan) return ''
  return JABATAN_LABELS[jabatan as Jabatan] ?? jabatan
}

export function fullRoleLabel(role?: Role | string | null, jabatan?: Jabatan | string | null): string {
  if (!role) return ''
  const rLabel = roleLabel(role)
  if (role === 'ts' && jabatan) {
    return `${rLabel} · ${jabatanLabel(jabatan)}`
  }
  return rLabel
}

export function approvalLabel(status?: string | null): string {
  if (status === 'pending') return 'Menunggu Approval'
  if (status === 'rejected') return 'Ditolak'
  return 'Aktif'
}

export const STATUS_LABELS: Record<BKReportStatus, string> = {
  draft: 'Draft',
  waiting_spv: 'Menunggu SPV',
  waiting_mgr: 'Menunggu Manager',
  approved: 'Disetujui',
  rejected: 'Ditolak',
}

export function statusLabel(status?: BKReportStatus | string | null): string {
  if (!status) return 'Draft'
  return STATUS_LABELS[status as BKReportStatus] ?? status
}

export const SIGNUP_ROLES: Role[] = ['produksi', 'qa', 'ppic']

export const ADMIN_ROLES: Role[] = ['admin', 'ts']

export function isAdminRole(role: Role | string | undefined | null): boolean {
  if (!role) return false
  return ADMIN_ROLES.includes(role as Role)
}