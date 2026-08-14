// frontend/src/components/layout/Sidebar.tsx
import { NavLink } from 'react-router-dom'
import {
  Calculator,
  FileBarChart,
  Users,
  Clock,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Settings,
  Database,
  FileText,
  FileDown,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

const calcItems = [
  { name: 'Batch Overfilled', path: '/perhitungan/batch-overfilled' },
  { name: 'Batch Khusus', path: '/perhitungan/batch-khusus' },
]

const reportItems = [
  { name: 'Batch Overfilled', path: '/report/batch-overfilled' },
  { name: 'Batch Khusus', path: '/report/batch-khusus' },
]

const adminItems = [
  { name: 'Batch Overfilled', path: '/admin/batch-overfilled' },
  { name: 'Batch Khusus', path: '/admin/batch-khusus' },
]

// Helper to read persisted boolean from localStorage; returns `fallback` if not set
function readStorage(key: string, fallback: boolean): boolean {
  try {
    const val = localStorage.getItem(key)
    if (val === null) return fallback
    return val === 'true'
  } catch {
    return fallback
  }
}

function writeStorage(key: string, value: boolean) {
  try {
    localStorage.setItem(key, String(value))
  } catch {
    // ignore
  }
}

export default function Sidebar() {
  const { logout, hasRole } = useAuth()
  const { theme } = useTheme()
  const [collapsed, setCollapsed] = useState(false)

  // Default closed (false) on first visit; persisted across refreshes
  const [calcOpen, setCalcOpen] = useState(() => readStorage('sidebar_calcOpen', false))
  const [reportOpen, setReportOpen] = useState(() => readStorage('sidebar_reportOpen', false))
  const [adminOpen, setAdminOpen] = useState(() => readStorage('sidebar_adminOpen', false))

  const isDark = theme === 'dark'
  const bg = isDark ? 'bg-gray-900' : 'bg-brand-sidebar'

  const canCalc = hasRole('admin', 'produksi', 'qa')
  const canReport = hasRole('admin', 'produksi', 'qa')
  const isAdmin = hasRole('admin')

  const toggleCalc = () => {
    const next = !calcOpen
    setCalcOpen(next)
    writeStorage('sidebar_calcOpen', next)
  }

  const toggleReport = () => {
    const next = !reportOpen
    setReportOpen(next)
    writeStorage('sidebar_reportOpen', next)
  }

  const toggleAdmin = () => {
    const next = !adminOpen
    setAdminOpen(next)
    writeStorage('sidebar_adminOpen', next)
  }

  return (
    <aside
      className={`${collapsed ? 'w-[72px]' : 'w-64'} transition-all duration-300 ease-in-out
        flex flex-col h-screen ${bg} text-white shadow-xl relative flex-shrink-0`}
    >
      {/* Header / Logo */}
      <div className="border-b border-white/10 relative">
        {collapsed ? (
          <div className="py-5 flex items-center justify-center">
            <button
              onClick={() => setCollapsed(false)}
              className="text-white/70 hover:text-brand-green-light transition-colors"
            >
              <ChevronRight size={22} />
            </button>
          </div>
        ) : (
          <div className="py-4 pl-5 pr-4 flex items-center justify-between h-20 overflow-hidden">
            <img
              src="/src/assets/B7-logo-white.png"
              alt="Bintang Toedjoe"
              className="h-24 w-auto object-contain object-top -mt-2"
            />
            <button
              onClick={() => setCollapsed(true)}
              className="text-white/70 hover:text-brand-green-light transition-colors flex-shrink-0"
            >
              <ChevronLeft size={22} />
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={`flex-1 px-3 py-5 space-y-1 ${collapsed ? 'overflow-hidden' : 'overflow-y-auto scrollbar-thin'}`}>
        {/* Perhitungan */}
        {canCalc && (
          <div>
            {collapsed ? (
              calcItems.map((item) => (
                <TooltipLink key={item.path} item={item} icon={<Calculator size={20} />} />
              ))
            ) : (
              <div className="mb-1">
                <button
                  onClick={toggleCalc}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg
                    text-white/80 hover:bg-white/5 hover:text-white transition-all duration-200 text-[15px]"
                >
                  <Calculator size={20} className="flex-shrink-0" />
                  <span className="flex-1 text-left font-medium">Perhitungan</span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${calcOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {calcOpen && (
                  <div className="ml-4 mt-1 space-y-0.5 border-l border-white/10 pl-3">
                    {calcItems.map((item) => (
                      <SubLink key={item.path} item={item} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Report */}
        {canReport && (
          <div>
            {collapsed ? (
              reportItems.map((item) => (
                <TooltipLink key={item.path} item={item} icon={<FileBarChart size={20} />} />
              ))
            ) : (
              <div className="mb-1">
                <button
                  onClick={toggleReport}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg
                    text-white/80 hover:bg-white/5 hover:text-white transition-all duration-200 text-[15px]"
                >
                  <FileBarChart size={20} className="flex-shrink-0" />
                  <span className="flex-1 text-left font-medium">Report</span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${reportOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {reportOpen && (
                  <div className="ml-4 mt-1 space-y-0.5 border-l border-white/10 pl-3">
                    {reportItems.map((item) => (
                      <SubLink key={item.path} item={item} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Admin - Manajemen */}
        {isAdmin && (
          <div>
            {collapsed ? (
              adminItems.map((item) => (
                <TooltipLink key={item.path} item={item} icon={<Database size={20} />} />
              ))
            ) : (
              <div className="mb-1">
                <button
                  onClick={toggleAdmin}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg
                    text-white/80 hover:bg-white/5 hover:text-white transition-all duration-200 text-[15px]"
                >
                  <Settings size={20} className="flex-shrink-0" />
                  <span className="flex-1 text-left font-medium">Admin</span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${adminOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {adminOpen && (
                  <div className="ml-4 mt-1 space-y-0.5 border-l border-white/10 pl-3">
                    {adminItems.map((item) => (
                      <SubLink key={item.path} item={item} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ✅ TEMPLATE REPORT - Admin Only */}
        {isAdmin && (
          <div className="pt-2">
            {collapsed ? (
              <TooltipLink item={{ name: 'Template Report', path: '/admin/report-templates' }} icon={<FileText size={20} />} />
            ) : (
              <NavItem path="/admin/report-templates" icon={<FileText size={20} />} label="Template Report" collapsed={collapsed} />
            )}
          </div>
        )}

        {/* ✅ DOWNLOAD REPORT - All Users */}
        {canReport && (
          <div>
            {collapsed ? (
              <TooltipLink item={{ name: 'Download Report', path: '/download-report' }} icon={<FileDown size={20} />} />
            ) : (
              <NavItem path="/download-report" icon={<FileDown size={20} />} label="Download Report" collapsed={collapsed} />
            )}
          </div>
        )}

        {/* Manajemen User & Log - hanya untuk admin */}
        {isAdmin && (
          <div className="pt-2 space-y-1">
            {!collapsed && (
              <p className="px-4 text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-1">
                Manajemen
              </p>
            )}
            <NavItem path="/users" icon={<Users size={20} />} label="Users" collapsed={collapsed} />
            <NavItem path="/log-aktivitas" icon={<Clock size={20} />} label="Log Aktivitas" collapsed={collapsed} />
          </div>
        )}
      </nav>

      {/* Footer — logout only */}
      <div className="border-t border-white/10 p-3">
        <button
          onClick={logout}
          className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-lg
            text-white/70 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200
            ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut size={20} className="flex-shrink-0" />
          {!collapsed && <span className="text-[15px]">Logout</span>}
        </button>
      </div>
    </aside>
  )
}

function SubLink({ item }: { item: { name: string; path: string } }) {
  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `block px-3 py-2 rounded-lg text-sm transition-all duration-200
        ${isActive ? 'text-brand-green-light font-medium bg-white/5' : 'text-white/60 hover:text-white hover:bg-white/5'}`
      }
    >
      {item.name}
    </NavLink>
  )
}

function NavItem({ path, icon, label, collapsed }: {
  path: string; icon: React.ReactNode; label: string; collapsed: boolean
}) {
  return (
    <NavLink
      to={path}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group relative
        ${isActive ? 'bg-white/10 text-brand-green-light font-medium' : 'text-white/80 hover:bg-white/5 hover:text-white'}
        ${collapsed ? 'justify-center' : ''}`
      }
    >
      {({ isActive }) => (
        <>
          <span className={`flex-shrink-0 ${isActive ? 'text-brand-green-light' : ''}`}>{icon}</span>
          {!collapsed && <span className="text-[15px]">{label}</span>}
          {collapsed && (
            <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg
              opacity-0 invisible group-hover:opacity-100 group-hover:visible
              transition-all duration-200 whitespace-nowrap z-50 shadow-lg">
              {label}
              <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
            </div>
          )}
        </>
      )}
    </NavLink>
  )
}

function TooltipLink({ item, icon }: { item: { name: string; path: string }; icon: React.ReactNode }) {
  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `flex items-center justify-center px-4 py-2.5 rounded-lg transition-all duration-200 group relative
        ${isActive ? 'bg-white/10 text-brand-green-light' : 'text-white/80 hover:bg-white/5 hover:text-white'}`
      }
    >
      {icon}
      <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg
        opacity-0 invisible group-hover:opacity-100 group-hover:visible
        transition-all duration-200 whitespace-nowrap z-50 shadow-lg">
        {item.name}
        <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
      </div>
    </NavLink>
  )
}