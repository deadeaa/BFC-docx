// frontend/src/components/layout/Header.tsx
import { Sun, Moon } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { roleLabel } from '../../lib/roles'

export default function Header() {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <header
      className={`h-16 flex items-center justify-between px-6 flex-shrink-0 shadow-md
        ${isDark ? 'bg-gray-900 text-white' : 'bg-brand-sidebar text-white'}`}
    >
      <div>
        <h2 className="text-sm font-semibold tracking-wide text-white/90">
          Batch Formula Calculation
        </h2>
        <p className="text-[10px] text-white/50">Bintang Toedjoe · A Kalbe Company</p>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className={`transition-colors p-1.5 rounded-lg
            ${isDark ? 'text-white/70 hover:text-brand-green-light hover:bg-white/10' : 'text-white/70 hover:text-brand-green-light hover:bg-white/10'}`}
          title={isDark ? 'Switch to Light' : 'Switch to Dark'}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="flex items-center gap-2.5">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold leading-tight text-white">
              {user?.full_name}
            </p>
            <p className="text-[11px] text-brand-green-light leading-tight">{roleLabel(user?.role)}</p>
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