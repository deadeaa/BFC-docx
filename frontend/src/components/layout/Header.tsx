import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sun, Moon, Bell, CheckCircle2, Clock, AlertCircle, ChevronRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { fullRoleLabel, statusLabel } from '../../lib/roles'
import api from '../../lib/api'
import type { NotificationResponse, ApprovalNotificationItem } from '../../types'

export default function Header() {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const navigate = useNavigate()

  const [notifications, setNotifications] = useState<ApprovalNotificationItem[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = async () => {
    if (!user) return
    try {
      const { data } = await api.get<NotificationResponse>('/batch-khusus/notifications')
      setNotifications(data.items || [])
      setPendingCount(data.pending_count || 0)
    } catch {
      // silently ignore
    }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [user])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelectNotification(item: ApprovalNotificationItem) {
    setShowDropdown(false)
    navigate(`/batch-khusus?kode=${encodeURIComponent(item.kode_produk)}&no_batch=${encodeURIComponent(item.no_batch)}&report_id=${item.id}`)
  }

  return (
    <header
      className={`h-16 flex items-center justify-between px-6 flex-shrink-0 shadow-md relative z-40
        ${isDark ? 'bg-gray-900 text-white' : 'bg-brand-sidebar text-white'}`}
    >
      <div>
        <h2 className="text-sm font-semibold tracking-wide text-white/90">
          Batch Formula Calculation
        </h2>
        <p className="text-[10px] text-white/50">Bintang Toedjoe · A Kalbe Company</p>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Dark / Light Toggle */}
        <button
          onClick={toggleTheme}
          className={`transition-colors p-1.5 rounded-lg
            ${isDark ? 'text-white/70 hover:text-brand-green-light hover:bg-white/10' : 'text-white/70 hover:text-brand-green-light hover:bg-white/10'}`}
          title={isDark ? 'Switch to Light' : 'Switch to Dark'}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notification Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => {
              setShowDropdown(!showDropdown)
              if (!showDropdown) fetchNotifications()
            }}
            className={`transition-colors p-1.5 rounded-lg relative
              ${isDark ? 'text-white/70 hover:text-brand-green-light hover:bg-white/10' : 'text-white/70 hover:text-brand-green-light hover:bg-white/10'}`}
            title="Notifikasi Approval"
          >
            <Bell size={18} />
            {pendingCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {pendingCount > 99 ? '99+' : pendingCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown Popover */}
          {showDropdown && (
            <div
              className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl shadow-2xl border overflow-hidden transition-all duration-200 z-50
                ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`}
            >
              <div
                className={`flex items-center justify-between px-4 py-3 border-b text-xs font-semibold
                  ${isDark ? 'border-gray-700 bg-gray-900/50' : 'border-gray-100 bg-gray-50'}`}
              >
                <div className="flex items-center gap-2">
                  <Bell size={15} className="text-brand-green" />
                  <span>Notifikasi Approval</span>
                </div>
                {pendingCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 font-bold">
                    {pendingCount} butuh tindakan
                  </span>
                ) : (
                  <span className="text-[11px] text-gray-400 font-normal">Tidak ada antrean</span>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700/60">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-400">
                    Belum ada riwayat atau antrean approval.
                  </div>
                ) : (
                  notifications.map((n) => {
                    const isPending = n.status === 'waiting_spv' || n.status === 'waiting_mgr'
                    const isRejected = n.status === 'rejected'
                    const isApproved = n.status === 'approved'

                    return (
                      <div
                        key={n.id}
                        onClick={() => handleSelectNotification(n)}
                        className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 text-left
                          ${isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}
                      >
                        <div className="mt-0.5">
                          {isApproved && <CheckCircle2 size={16} className="text-green-500" />}
                          {isRejected && <AlertCircle size={16} className="text-red-500" />}
                          {isPending && <Clock size={16} className="text-amber-500 animate-spin-slow" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-semibold text-xs truncate">
                              Batch: {n.no_batch}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                                isApproved
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                  : isRejected
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                  : n.status === 'waiting_mgr'
                                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                              }`}
                            >
                              {statusLabel(n.status)}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                            {n.kode_produk} · {n.nama_produk || 'Batch Khusus'}
                          </p>
                          {n.reject_note && (
                            <p className="text-[10px] text-red-500 bg-red-50 dark:bg-red-950/40 rounded px-2 py-1 mt-1 line-clamp-2">
                              Alasan tolak: {n.reject_note}
                            </p>
                          )}
                          <p className="text-[10px] text-gray-400 mt-1">
                            Oleh {n.created_by_name || 'Staff'} ·{' '}
                            {new Date(n.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <ChevronRight size={14} className="text-gray-400 flex-shrink-0 mt-2" />
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Account Info */}
        <div className="flex items-center gap-2.5">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold leading-tight text-white">
              {user?.full_name}
            </p>
            <p className="text-[11px] text-brand-green-light leading-tight">
              {fullRoleLabel(user?.role, user?.jabatan)}
            </p>
          </div>
          <div className="h-8 w-8 rounded-full bg-white/10 border border-white/30 flex items-center justify-center">
            <span className="text-white text-sm font-bold">
              {user?.full_name?.[0]?.toUpperCase() ?? 'U'}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}