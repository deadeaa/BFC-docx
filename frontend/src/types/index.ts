// frontend/src/types/index.ts

export type Role = 'admin' | 'ppic' | 'produksi' | 'qa' | 'ts'

export interface User {
  id: number
  username: string
  full_name: string
  role: Role
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AuthState {
  user: User | null
  accessToken: string | null
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  user: User
}

export interface ApiError {
  message: string
  error?: string
}

// ── Log Aktivitas / Audit Trail ──────────────────────────────

export interface ActivityLog {
  id: number
  user_id: number
  user_name: string
  role: string
  menu: string
  activity: string
  description: string
  method: string
  endpoint: string
  ip_address: string
  user_agent: string
  created_at: string
  updated_at: string
}

export interface ActivityLogListResponse {
  data: ActivityLog[]
  total: number
  page: number
  page_size: number
}