// frontend/src/lib/roles.ts
import type { Role } from '../types'

// Satu-satunya sumber label tampilan Role di seluruh aplikasi.
// Nilai role di database/API tetap lowercase ('admin' | 'produksi' | 'qa'),
// hanya label yang ditampilkan ke user yang diformat di sini — supaya
// "QA" konsisten tampil dengan huruf besar semua (bukan "Qa") di mana pun
// role ditampilkan (Badge Role, Dropdown, User Management, Login, Sign Up,
// Sidebar, Filter, Log Aktivitas, dst).
export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrator',
  produksi: 'Produksi',
  qa: 'QA',
}

export function roleLabel(role: Role | string | undefined | null): string {
  if (!role) return ''
  return ROLE_LABELS[role as Role] ?? role
}