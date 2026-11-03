export type Role = 'admin' | 'ppic' | 'produksi' | 'qa' | 'ts'

export type Jabatan = 'staff' | 'spv' | 'mgr'

export type BKReportStatus = 'draft' | 'waiting_spv' | 'waiting_mgr' | 'approved' | 'rejected'

export interface User {
  id: number
  username: string
  full_name: string
  role: Role
  jabatan?: Jabatan | '' | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface BKReport {
  id: number
  kode_produk: string
  nama_produk?: string
  no_batch: string
  tgl_pembuatan: string
  bobot_total: number
  input_sisa_minor: number
  detail_json?: string
  created_by: number
  created_by_name?: string
  created_at: string
  status: BKReportStatus
  spv_id?: number | null
  spv_name?: string | null
  spv_approved_at?: string | null
  mgr_id?: number | null
  mgr_name?: string | null
  mgr_approved_at?: string | null
  rejected_by?: number | null
  rejected_by_name?: string | null
  rejected_at?: string | null
  reject_note?: string | null
  updated_at?: string | null
}

export interface ApprovalNotificationItem {
  id: number
  kode_produk: string
  nama_produk: string
  no_batch: string
  created_by_name: string
  created_at: string
  status: BKReportStatus
  updated_at?: string
  reject_note?: string
}

export interface NotificationResponse {
  pending_count: number
  items: ApprovalNotificationItem[]
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