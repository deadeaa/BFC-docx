// frontend/src/components/IdleTimeoutWatcher.tsx
//
// Auto Logout berdasarkan waktu idle (tidak ada aktivitas), BUKAN berdasarkan
// waktu login. Setiap aktivitas user (klik, mouse move, keyboard, scroll,
// touch, perpindahan halaman) akan me-reset timer idle.
//
// Komponen ini tidak mengubah logic login, endpoint login, middleware
// authentication, maupun role — hanya menambahkan pengecekan idle di sisi
// frontend dan memanggil fungsi logout yang sudah ada di AuthContext.

import { useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const IDLE_LIMIT_MS = 12 * 60 * 60 * 1000 // 12 jam
const CHECK_INTERVAL_MS = 30 * 1000 // cek setiap 30 detik
const LAST_ACTIVITY_KEY = 'bfc_last_activity'

const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  'mousedown',
  'mousemove',
  'keydown',
  'scroll',
  'touchstart',
  'click',
]

export default function IdleTimeoutWatcher() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const intervalRef = useRef<number | null>(null)
  const loggingOutRef = useRef(false)

  const recordActivity = useCallback(() => {
    if (loggingOutRef.current) return
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()))
  }, [])

  const clearAuthRelatedStorage = useCallback(() => {
    // Hapus data yang berkaitan dengan autentikasi saja — data lain (mis.
    // preferensi tema) sengaja tidak disentuh.
    localStorage.removeItem('access_token')
    localStorage.removeItem(LAST_ACTIVITY_KEY)
    sessionStorage.clear()
  }, [])

  const handleIdleLogout = useCallback(async () => {
    if (loggingOutRef.current) return
    loggingOutRef.current = true

    try {
      // Memanggil endpoint logout yang sudah ada agar refresh token /
      // cookie autentikasi di server turut dihapus.
      await logout()
    } catch {
      // Abaikan error jaringan — tetap lanjutkan pembersihan di sisi client.
    } finally {
      clearAuthRelatedStorage()
      navigate('/login', { replace: true, state: { idleTimeout: true } })
      loggingOutRef.current = false
    }
  }, [logout, clearAuthRelatedStorage, navigate])

  // Pasang listener aktivitas & interval pengecekan idle, hanya saat user
  // sedang login.
  useEffect(() => {
    if (!user) {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    if (!localStorage.getItem(LAST_ACTIVITY_KEY)) {
      localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()))
    }

    ACTIVITY_EVENTS.forEach(evt =>
      window.addEventListener(evt, recordActivity, { passive: true })
    )

    intervalRef.current = window.setInterval(() => {
      const lastActivityRaw = localStorage.getItem(LAST_ACTIVITY_KEY)
      const lastActivity = lastActivityRaw ? Number(lastActivityRaw) : Date.now()
      if (Date.now() - lastActivity >= IDLE_LIMIT_MS) {
        handleIdleLogout()
      }
    }, CHECK_INTERVAL_MS)

    return () => {
      ACTIVITY_EVENTS.forEach(evt => window.removeEventListener(evt, recordActivity))
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [user, recordActivity, handleIdleLogout])

  // Perpindahan halaman di dalam aplikasi juga dihitung sebagai aktivitas.
  useEffect(() => {
    if (user) {
      recordActivity()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  return null
}