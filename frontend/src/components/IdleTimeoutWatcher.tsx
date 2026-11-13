import { useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const IDLE_LIMIT_MS = 1 * 60 * 60 * 1000 // 12 jam
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
    
    
    localStorage.removeItem('access_token')
    localStorage.removeItem(LAST_ACTIVITY_KEY)
    sessionStorage.clear()
  }, [])

  const handleIdleLogout = useCallback(async () => {
    if (loggingOutRef.current) return
    loggingOutRef.current = true

    try {
      
      
      await logout()
    } catch {
      
    } finally {
      clearAuthRelatedStorage()
      navigate('/login', { replace: true, state: { idleTimeout: true } })
      loggingOutRef.current = false
    }
  }, [logout, clearAuthRelatedStorage, navigate])

  
  
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

  
  useEffect(() => {
    if (user) {
      recordActivity()
    }
    
  }, [location.pathname])

  return null
}