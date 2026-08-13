// frontend/src/components/pages/LogAktivitasPage.tsx
import { useState, useEffect, useCallback } from 'react'
import { History, X, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import api from '../../lib/api'
import type { ActivityLog, ActivityLogListResponse, Role } from '../../types'
import { useTheme } from '../../context/ThemeContext'
import { cn } from '../../lib/utils'
import { roleLabel } from '../../lib/roles'

const ROLES: Role[] = ['admin', 'produksi', 'qa']
const PAGE_SIZE = 20

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function LogAktivitasPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  // Filter — hanya dikirim ke server saat berubah (tidak dicatat sebagai aktivitas apa pun)
  const [userName, setUserName] = useState('')
  const [role, setRole] = useState('')
  const [activity, setActivity] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [selected, setSelected] = useState<ActivityLog | null>(null)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get<ActivityLogListResponse>('/logs', {
        params: {
          page,
          page_size: PAGE_SIZE,
          user_name: userName || undefined,
          role: role || undefined,
          activity: activity || undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
        },
      })
      setLogs(data.data)
      setTotal(data.total)
    } catch {
      setLogs([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, userName, role, activity, dateFrom, dateTo])

  // Debounce pencarian/filter teks agar tidak memanggil API di setiap keystroke
  useEffect(() => {
    const t = setTimeout(fetchLogs, 350)
    return () => clearTimeout(t)
  }, [fetchLogs])

  // Reset ke halaman 1 setiap kali filter berubah
  useEffect(() => {
    setPage(1)
  }, [userName, role, activity, dateFrom, dateTo])

  function resetFilters() {
    setUserName('')
    setRole('')
    setActivity('')
    setDateFrom('')
    setDateTo('')
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const hasFilter = !!(userName || role || activity || dateFrom || dateTo)

  const cardBg = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
  const inputCls = cn(
    'w-full border rounded-xl px-3 py-2.5 text-sm outline-none transition-all duration-200',
    isDark
      ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 focus:border-brand-green/60'
      : 'bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-brand-green/60'
  )

  const roleBadge = (r: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      produksi: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      qa: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    }
    return colors[r] ?? (isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600')
  }

  return (
    <div className="p-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Log Aktivitas
          </h1>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {total} aktivitas tercatat
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className={cn('rounded-2xl border p-4 mb-5', cardBg)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className={cn('block text-xs font-medium mb-1.5', isDark ? 'text-gray-400' : 'text-gray-600')}>
              Nama User
            </label>
            <input
              type="text"
              placeholder="Nama / username"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={cn('block text-xs font-medium mb-1.5', isDark ? 'text-gray-400' : 'text-gray-600')}>
              Role
            </label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className={inputCls}>
              <option value="">Semua Role</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {roleLabel(r)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={cn('block text-xs font-medium mb-1.5', isDark ? 'text-gray-400' : 'text-gray-600')}>
              Aktivitas
            </label>
            <input
              type="text"
              placeholder="mis. Menghapus User"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={cn('block text-xs font-medium mb-1.5', isDark ? 'text-gray-400' : 'text-gray-600')}>
              Dari Tanggal
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={cn('block text-xs font-medium mb-1.5', isDark ? 'text-gray-400' : 'text-gray-600')}>
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
        {hasFilter && (
          <button
            onClick={resetFilters}
            className={cn(
              'flex items-center gap-1.5 mt-3 text-xs font-medium transition-colors',
              isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'
            )}
          >
            <RotateCcw size={13} />
            Reset Filter
          </button>
        )}
      </div>

      {/* Table */}
      <div className={`rounded-2xl border overflow-hidden ${cardBg}`}>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <History size={40} className={isDark ? 'text-gray-600' : 'text-gray-300'} />
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Tidak ada log aktivitas ditemukan
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  className={`border-b text-xs uppercase tracking-wide ${isDark ? 'border-gray-700 bg-gray-700/50 text-gray-400' : 'border-gray-100 bg-gray-50/80 text-gray-500'}`}
                >
                  <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">Tanggal &amp; Waktu</th>
                  <th className="px-6 py-4 text-left font-semibold">Nama User</th>
                  <th className="px-6 py-4 text-left font-semibold">Role</th>
                  <th className="px-6 py-4 text-left font-semibold">Menu</th>
                  <th className="px-6 py-4 text-left font-semibold">Aktivitas</th>
                  <th className="px-6 py-4 text-left font-semibold">Deskripsi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {logs.map((l) => (
                  <tr
                    key={l.id}
                    onClick={() => setSelected(l)}
                    className={`cursor-pointer transition-colors ${isDark ? 'hover:bg-gray-700/40' : 'hover:bg-gray-50'}`}
                  >
                    <td className={cn('px-6 py-4 whitespace-nowrap', isDark ? 'text-gray-300' : 'text-gray-700')}>
                      {formatDateTime(l.created_at)}
                    </td>
                    <td className={cn('px-6 py-4 font-medium', isDark ? 'text-white' : 'text-gray-800')}>
                      {l.user_name || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleBadge(l.role)}`}>
                        {l.role ? roleLabel(l.role) : '-'}
                      </span>
                    </td>
                    <td className={cn('px-6 py-4', isDark ? 'text-gray-300' : 'text-gray-600')}>{l.menu || '-'}</td>
                    <td className={cn('px-6 py-4 font-medium', isDark ? 'text-gray-200' : 'text-gray-700')}>
                      {l.activity || '-'}
                    </td>
                    <td className={cn('px-6 py-4 max-w-xs truncate', isDark ? 'text-gray-400' : 'text-gray-500')}>
                      {l.description || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && logs.length > 0 && (
          <div className={cn('flex items-center justify-between px-6 py-3.5 border-t text-sm', isDark ? 'border-gray-700' : 'border-gray-100')}>
            <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
              Halaman {page} dari {totalPages} &middot; {total} baris
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className={cn(
                  'p-1.5 rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
                  isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                )}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className={cn(
                  'p-1.5 rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
                  isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                )}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Log — read only */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className={`w-full max-w-lg rounded-2xl shadow-2xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Detail Log Aktivitas
              </h2>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-3 text-sm max-h-[70vh] overflow-y-auto">
              <DetailRow isDark={isDark} label="Tanggal & Waktu" value={formatDateTime(selected.created_at)} />
              <DetailRow isDark={isDark} label="Nama User" value={selected.user_name || '-'} />
              <DetailRow isDark={isDark} label="Role" value={selected.role ? roleLabel(selected.role) : '-'} />
              <DetailRow isDark={isDark} label="Menu" value={selected.menu || '-'} />
              <DetailRow isDark={isDark} label="Aktivitas" value={selected.activity || '-'} />
              <DetailRow isDark={isDark} label="Deskripsi" value={selected.description || '-'} />
            </div>

            <div className="px-6 pb-6">
              <button
                onClick={() => setSelected(null)}
                className={cn(
                  'w-full py-2.5 rounded-xl border text-sm font-medium transition-colors',
                  isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                )}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailRow({ isDark, label, value, mono }: { isDark: boolean; label: string; value: string; mono?: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <span className={cn('text-xs font-medium pt-0.5', isDark ? 'text-gray-400' : 'text-gray-500')}>{label}</span>
      <span
        className={cn(
          'col-span-2 break-words',
          mono ? 'font-mono text-xs' : '',
          isDark ? 'text-gray-100' : 'text-gray-800'
        )}
      >
        {value}
      </span>
    </div>
  )
}