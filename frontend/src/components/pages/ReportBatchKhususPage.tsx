import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileBarChart, Search, RefreshCw, FileDown, Trash2, ChevronLeft, ChevronRight, CheckCircle2, Filter, AlertCircle, XCircle, Clock } from 'lucide-react'
import * as XLSX from 'xlsx'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { cn } from '../../lib/utils'
import type { BKReport, BKReportStatus } from '../../types'
import { statusLabel } from '../../lib/roles'

interface BKReportListResponse {
  data: BKReport[]
  total: number
  page: number
  page_size: number
}

const PAGE_SIZE = 50

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



function StampApprove({ name, date }: { name: string; date?: string | null }) {
  return (
    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md border-2 border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-600 text-green-700 dark:text-green-300 text-[11px] font-semibold">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <span className="leading-tight">
        {name}
        {date && (
          <span className="block text-[9px] font-normal opacity-80">
            {new Date(date).toLocaleDateString('id-ID')}
          </span>
        )}
      </span>
    </div>
  )
}

function StampReject({ name, date }: { name: string; date?: string | null }) {
  return (
    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md border-2 border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-600 text-red-700 dark:text-red-300 text-[11px] font-semibold">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
      <span className="leading-tight">
        {name}
        {date && (
          <span className="block text-[9px] font-normal opacity-80">
            {new Date(date).toLocaleDateString('id-ID')}
          </span>
        )}
      </span>
    </div>
  )
}

export default function ReportBatchKhususPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const canDelete = user?.role === 'admin'

  const [reports, setReports] = useState<BKReport[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const [deleteTarget, setDeleteTarget] = useState<BKReport | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState('')
  const [activeNote, setActiveNote] = useState<{ batch: string; note: string; by: string } | null>(null)

  const fetchReports = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get<BKReportListResponse>('/batch-khusus/reports', {
        params: {
          page,
          page_size: PAGE_SIZE,
          search: search || undefined,
          status: filterStatus !== 'all' ? filterStatus : undefined,
        },
      })
      setReports(data.data ?? [])
      setTotal(data.total ?? 0)
    } catch {
      setReports([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, search, filterStatus])

  useEffect(() => {
    const t = setTimeout(fetchReports, 350)
    return () => clearTimeout(t)
  }, [fetchReports])

  useEffect(() => {
    setPage(1)
  }, [search, filterStatus])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2500)
    return () => clearTimeout(t)
  }, [toast])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  
  function openReport(r: BKReport) {
    const params = new URLSearchParams()
    params.set('kode', r.kode_produk)
    params.set('report', String(r.id))
    if (r.no_batch) params.set('no_batch', r.no_batch)
    navigate(`/perhitungan/batch-khusus?${params.toString()}`)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/batch-khusus/reports/${deleteTarget.id}`)
      setDeleteTarget(null)
      setToast('Report berhasil dihapus')
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

  function handleExportXLSX() {
    const filename = `Report_Batch_Khusus_${todayFilename()}.xlsx`

    const data = reports.map((r, i) => ({
      'No':               (page - 1) * PAGE_SIZE + i + 1,
      'Kode Produk':      r.kode_produk,
      'Nama Produk':      r.nama_produk ?? '',
      'No. Batch':        r.no_batch ?? '',
      'Status':           statusLabel(r.status),
      'Tgl Pembuatan':    fmtDateTime(r.created_at),
      'Input Sisa Minor': r.input_sisa_minor,
      'Dibuat Oleh':      r.created_by_name ?? '',
      'SPV (Pemeriksa)':  r.spv_name ?? '',
      'MGR (Penyetujui)': r.mgr_name ?? '',
      'Ditolak Oleh':     r.rejected_by_name ?? '',
      'Catatan Tolak':    r.reject_note ?? '',
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    ws['!cols'] = [
      { wch: 5 }, { wch: 14 }, { wch: 32 }, { wch: 18 }, { wch: 18 },
      { wch: 20 }, { wch: 16 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
      { wch: 20 }, { wch: 30 },
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Report Batch Khusus')
    XLSX.writeFile(wb, filename)
  }

  function renderStatusBadge(status?: BKReportStatus | string) {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 font-semibold">
            <CheckCircle2 size={12} /> Disetujui
          </span>
        )
      case 'waiting_mgr':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 font-semibold">
            <Clock size={12} /> Menunggu Manager
          </span>
        )
      case 'waiting_spv':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 font-semibold">
            <Clock size={12} /> Menunggu SPV
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 font-semibold">
            <XCircle size={12} /> Ditolak
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 font-semibold">
            Draft
          </span>
        )
    }
  }

   function renderVerification(r: BKReport) {
    const items: React.ReactNode[] = []

    
    if (r.spv_name) {
      items.push(
        <StampApprove key="spv" name={`SPV: ${r.spv_name}`} date={r.spv_approved_at} />
      )
    } else if (r.status === 'rejected' && r.rejected_by_name && !r.mgr_name) {
      
      items.push(
        <StampReject key="spv-reject" name={`SPV: ${r.rejected_by_name}`} date={r.rejected_at} />
      )
    } else if (r.status === 'waiting_spv') {
      items.push(
        <span key="spv-wait" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-amber-400 text-amber-600 dark:text-amber-300 text-[11px] font-medium">
          <Clock size={11} /> Menunggu SPV
        </span>
      )
    } else {
      items.push(
        <span key="spv-none" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-400 text-[11px]">
          — SPV
        </span>
      )
    }

    
    if (r.mgr_name) {
      items.push(
        <StampApprove key="mgr" name={`MGR: ${r.mgr_name}`} date={r.mgr_approved_at} />
      )
    } else if (r.status === 'rejected' && r.rejected_by_name && r.spv_name) {
      
      items.push(
        <StampReject key="mgr-reject" name={`MGR: ${r.rejected_by_name}`} date={r.rejected_at} />
      )
    } else if (r.status === 'waiting_mgr') {
      items.push(
        <span key="mgr-wait" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-purple-400 text-purple-600 dark:text-purple-300 text-[11px] font-medium">
          <Clock size={11} /> Menunggu MGR
        </span>
      )
    } else if (r.status === 'rejected' && !r.spv_name) {
      
      items.push(
        <span key="mgr-na" className="inline-flex items-center px-2 py-0.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-400 text-[11px]">
          — MGR
        </span>
      )
    } else {
      items.push(
        <span key="mgr-none" className="inline-flex items-center px-2 py-0.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-400 text-[11px]">
          — MGR
        </span>
      )
    }

    return <div className="flex flex-col gap-1">{items}</div>
  }


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

  const startRow = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const endRow = Math.min(page * PAGE_SIZE, total)

  return (
    <div className={cn('min-h-full p-6', isDark ? 'bg-gray-900' : 'bg-brand-bg')}>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-lg bg-brand-green/10">
            <FileBarChart size={20} className="text-brand-green" />
          </div>
          <h1 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>
            Report Batch Khusus
          </h1>
        </div>
        <p className={cn('text-sm ml-12', isDark ? 'text-gray-400' : 'text-gray-500')}>
          Klik baris untuk membuka detail perhitungan. Riwayat semua batch khusus yang telah disimpan.
        </p>
      </div>

      <div className={cn('rounded-xl p-4 mb-5 shadow-sm flex flex-col md:flex-row gap-3 items-start md:items-center justify-between', card)}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari kode, nama, atau no. batch…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={cn(inputBase, 'pl-9 w-full')}
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={15} className="text-gray-400 flex-shrink-0" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={cn(inputBase, 'text-xs py-2')}
            >
              <option value="all">Semua Status</option>
              <option value="waiting_spv">Menunggu SPV</option>
              <option value="waiting_mgr">Menunggu Manager</option>
              <option value="approved">Disetujui (Approved)</option>
              <option value="rejected">Ditolak (Rejected)</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end md:self-auto">
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
              {search || filterStatus !== 'all' ? 'Tidak ada data yang sesuai filter.' : 'Belum ada laporan yang tersimpan.'}
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
                  <th className={th}>No. Batch</th>
                  <th className={th}>Status</th>
                  <th className={th}>Verifikasi</th>
                  <th className={th}>Tanggal Pembuatan</th>
                  <th className={cn(th, 'text-right')}>Sisa Minor</th>
                  <th className={th}>Dibuat Oleh</th>
                  {canDelete && <th className={cn(th, 'text-center')}>Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {reports.map((r, i) => (
                  <tr
                    key={r.id}
                    onClick={() => openReport(r)}
                    className={cn(
                      'transition-colors cursor-pointer',
                      isDark ? 'hover:bg-gray-700/40' : 'hover:bg-gray-50'
                    )}
                    title="Klik untuk membuka detail perhitungan"
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
                    <td className={cn(td, 'font-mono text-xs whitespace-nowrap')}>
                      {r.no_batch || '—'}
                    </td>
                    <td className={cn(td, 'whitespace-nowrap')}>
                      <div className="flex items-center gap-1.5">
                        {renderStatusBadge(r.status)}
                        {r.status === 'rejected' && r.reject_note && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setActiveNote({
                                batch: r.no_batch,
                                note: r.reject_note || '',
                                by: r.rejected_by_name || 'Atasan',
                              })
                            }}
                            className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                            title="Lihat alasan penolakan"
                          >
                            <AlertCircle size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className={cn(td, 'min-w-[180px]')}>{renderVerification(r)}</td>
                    <td className={cn(td, 'whitespace-nowrap')}>{fmtDateTime(r.created_at)}</td>
                    <td className={cn(td, 'text-right font-semibold tabular-nums')}>
                      {fmtNum(r.input_sisa_minor)}
                    </td>
                    <td className={cn(td, 'text-xs')}>{r.created_by_name ?? '—'}</td>
                    {canDelete && (
                      <td className={cn(td, 'text-center')}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteTarget(r)
                          }}
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

        {!loading && reports.length > 0 && (
          <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3.5 border-t text-sm', isDark ? 'border-gray-700' : 'border-gray-100')}>
            <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
              Menampilkan {startRow}–{endRow} dari {total} data
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={(e) => { e.stopPropagation(); setPage((p) => Math.max(1, p - 1)) }}
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
                onClick={(e) => { e.stopPropagation(); setPage((p) => Math.min(totalPages, p + 1)) }}
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

      {activeNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={cn('w-full max-w-md rounded-2xl p-6 shadow-2xl border', card)}>
            <div className="flex items-center gap-2 mb-3 text-red-500">
              <XCircle size={20} />
              <h3 className="font-bold text-base">Alasan Penolakan</h3>
            </div>
            <p className={cn('text-xs mb-2', isDark ? 'text-gray-400' : 'text-gray-500')}>
              No. Batch: <span className="font-mono font-semibold">{activeNote.batch}</span> · oleh{' '}
              <span className="font-semibold">{activeNote.by}</span>
            </p>
            <div className={cn('p-3 rounded-lg text-sm mb-4', isDark ? 'bg-red-950/40 border border-red-800 text-red-200' : 'bg-red-50 border border-red-200 text-red-800')}>
              {activeNote.note}
            </div>
            <button
              onClick={() => setActiveNote(null)}
              className="w-full py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-sm font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

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

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg bg-emerald-600 text-white text-sm font-medium animate-fade-in">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}
    </div>
  )
}