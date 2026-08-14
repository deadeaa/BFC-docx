import { useState, useEffect, useCallback } from 'react'
import { FileBarChart, Search, RefreshCw, FileDown, Trash2, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'
import * as XLSX from 'xlsx'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { cn } from '../../lib/utils'

// ── Types ────────────────────────────────────────────────────

interface BOReport {
  id: number
  kode_produk: string
  nama_produk: string
  no_batch: string
  tgl_pembuatan: string
  bobot_total: number
  kesimpulan: 'MS' | 'TMS'
  detail_json: string
  created_by: number
  created_by_name: string
  created_at: string
}

interface BOReportListResponse {
  data: BOReport[]
  total: number
  page: number
  page_size: number
}

const PAGE_SIZE = 50

// ── Helpers ──────────────────────────────────────────────────

// Menampilkan Tanggal + Jam menggunakan timestamp asli dari database
// (created_at), bukan waktu buatan. Contoh: "22 Jul 2026, 14.37"
function fmtDateTime(dateStr: string): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '-'
  const datePart = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  const timePart = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.')
  return `${datePart}, ${timePart}`
}

function fmtNum(v: number): string {
  return v.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
}

function todayFilename(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '/')
}

// ── Component ────────────────────────────────────────────────

export default function ReportBatchOverfilledPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { hasRole } = useAuth()
  const canDelete = hasRole('admin')

  const [reports, setReports] = useState<BOReport[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [deleteTarget, setDeleteTarget] = useState<BOReport | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState('')

  const fetchReports = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get<BOReportListResponse>('/batch-overfilled/reports', {
        params: { page, page_size: PAGE_SIZE, search: search || undefined },
      })
      setReports(data.data ?? [])
      setTotal(data.total ?? 0)
    } catch {
      setReports([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  // Debounce pencarian agar tidak memanggil API di setiap keystroke.
  // Search tetap menggunakan pagination dari backend (bukan filter frontend).
  useEffect(() => {
    const t = setTimeout(fetchReports, 350)
    return () => clearTimeout(t)
  }, [fetchReports])

  // Reset ke halaman 1 setiap kali pencarian berubah
  useEffect(() => {
    setPage(1)
  }, [search])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2500)
    return () => clearTimeout(t)
  }, [toast])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/batch-overfilled/reports/${deleteTarget.id}`)
      setDeleteTarget(null)
      setToast('Report berhasil dihapus')
      // Jika halaman saat ini jadi kosong setelah hapus (dan bukan halaman 1), mundur satu halaman
      if (reports.length === 1 && page > 1) {
        setPage((p) => p - 1)
      } else {
        fetchReports()
      }
    } catch {
      setToast('Gagal menghapus report')
    } finally {
      setDeleting(false)
    }
  }

  // ── Export XLSX (data pada halaman yang sedang ditampilkan) ────
  function handleExportXLSX() {
    const filename = `Report_Batch_Overfilled_${todayFilename()}.xlsx`

    const data = reports.map((r, i) => ({
      'No':             (page - 1) * PAGE_SIZE + i + 1,
      'Kode Produk':    r.kode_produk,
      'Nama Produk':    r.nama_produk ?? '',
      'Tgl Pembuatan':  fmtDateTime(r.created_at),
      'Bobot Total':    r.bobot_total,
      'Kesimpulan':     r.kesimpulan,
      'Dibuat Oleh':    r.created_by_name ?? '',
    }))

    const ws = XLSX.utils.json_to_sheet(data)

    // Lebar kolom
    ws['!cols'] = [
      { wch: 5 },   // No
      { wch: 14 },  // Kode Produk
      { wch: 32 },  // Nama Produk
      { wch: 20 },  // Tgl Pembuatan
      { wch: 14 },  // Bobot Total
      { wch: 12 },  // Kesimpulan
      { wch: 20 },  // Dibuat Oleh
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Report Batch Overfilled')
    XLSX.writeFile(wb, filename)
  }

  // ── Styling ───────────────────────────────────────────────────
  const card = isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'

  const inputBase = cn(
    'px-3 py-2 rounded-lg border text-sm transition-colors outline-none',
    isDark
      ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-brand-green-light'
      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-brand-green'
  )

  const th = cn(
    'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider',
    isDark ? 'text-gray-400 bg-gray-700/50' : 'text-gray-500 bg-gray-50'
  )

  const td = cn(
    'px-4 py-3 text-sm border-b',
    isDark ? 'border-gray-700/50 text-gray-300' : 'border-gray-100 text-gray-700'
  )

  const badge = (status: 'MS' | 'TMS') => cn(
    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold',
    status === 'MS'
      ? (isDark ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700')
      : (isDark ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-700')
  )

  const startRow = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const endRow = Math.min(page * PAGE_SIZE, total)

  return (
    <div className={cn('min-h-full p-6', isDark ? 'bg-gray-900' : 'bg-brand-bg')}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-lg bg-brand-green/10">
            <FileBarChart size={20} className="text-brand-green" />
          </div>
          <h1 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>
            Report Batch Overfilled
          </h1>
        </div>
        <p className={cn('text-sm ml-12', isDark ? 'text-gray-400' : 'text-gray-500')}>
          Riwayat semua perhitungan batch overfilled yang telah disimpan.
        </p>
      </div>

      {/* Toolbar */}
      <div className={cn('rounded-xl p-4 mb-5 shadow-sm flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between', card)}>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari kode produk, nama produk, atau no. batch…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={cn(inputBase, 'pl-9 w-80')}
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportXLSX}
            disabled={reports.length === 0}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'bg-emerald-600 hover:bg-emerald-700 text-white'
            )}
          >
            <FileDown size={15} />
            Export XLSX
          </button>
          <button
            onClick={fetchReports}
            disabled={loading}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            )}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabel */}
      <div className={cn('rounded-xl shadow-sm overflow-hidden', card)}>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-green border-t-transparent mb-3" />
            <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>Memuat data…</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <FileBarChart size={36} className={isDark ? 'text-gray-600 mb-3' : 'text-gray-300 mb-3'} />
            <p className={cn('text-sm font-medium', isDark ? 'text-gray-400' : 'text-gray-500')}>
              {search ? 'Tidak ada data yang sesuai pencarian.' : 'Belum ada laporan yang tersimpan.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className={th}>No</th>
                  <th className={th}>Kode Produk</th>
                  <th className={th}>Nama Produk</th>
                  <th className={th}>Tanggal Pembuatan</th>
                  <th className={cn(th, 'text-right')}>Bobot Total</th>
                  <th className={th}>Kesimpulan</th>
                  <th className={th}>Dibuat Oleh</th>
                  {canDelete && <th className={cn(th, 'text-center')}>Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {reports.map((r, i) => (
                  <tr
                    key={r.id}
                    className={cn('transition-colors', isDark ? 'hover:bg-gray-700/40' : 'hover:bg-gray-50')}
                  >
                    <td className={cn(td, 'text-gray-400 text-xs w-10')}>{(page - 1) * PAGE_SIZE + i + 1}</td>
                    <td className={td}>
                      <span className={cn(
                        'inline-block px-2 py-0.5 rounded text-xs font-semibold',
                        isDark ? 'bg-brand-green/20 text-brand-green-light' : 'bg-brand-green/10 text-brand-green'
                      )}>
                        {r.kode_produk}
                      </span>
                    </td>
                    <td className={cn(td, 'max-w-[200px] truncate')} title={r.nama_produk}>
                      {r.nama_produk ?? '—'}
                    </td>
                    <td className={cn(td, 'whitespace-nowrap')}>{fmtDateTime(r.created_at)}</td>
                    <td className={cn(td, 'text-right font-semibold tabular-nums')}>
                      {fmtNum(r.bobot_total)}
                    </td>
                    <td className={td}>
                      <span className={badge(r.kesimpulan)}>{r.kesimpulan}</span>
                    </td>
                    <td className={cn(td, 'text-xs')}>{r.created_by_name ?? '—'}</td>
                    {canDelete && (
                      <td className={cn(td, 'text-center')}>
                        <button
                          onClick={() => setDeleteTarget(r)}
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                            isDark ? 'text-red-400 hover:bg-red-400/10' : 'text-red-600 hover:bg-red-50'
                          )}
                        >
                          <Trash2 size={14} />
                          Hapus
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && reports.length > 0 && (
          <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3.5 border-t text-sm', isDark ? 'border-gray-700' : 'border-gray-100')}>
            <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
              Menampilkan {startRow}–{endRow} dari {total} data
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
                  isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                )}
              >
                <ChevronLeft size={14} />
                Previous
              </button>
              <span className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold', isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800')}>
                Halaman {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
                  isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                )}
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className={`w-full max-w-sm rounded-2xl shadow-2xl border p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4 mx-auto">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className={`text-center font-bold text-lg mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Hapus Report Ini?
            </h3>
            <p className={`text-center text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Apakah Anda yakin ingin menghapus report <b>{deleteTarget.kode_produk}</b> (No. Batch {deleteTarget.no_batch})? Tindakan ini tidak bisa dibatalkan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors disabled:opacity-50
                  ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                {deleting ? 'Menghapus…' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notifikasi */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg bg-emerald-600 text-white text-sm font-medium animate-fade-in">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}
    </div>
  )
}
