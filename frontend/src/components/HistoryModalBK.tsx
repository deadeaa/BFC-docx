import { useState } from 'react'
import { X, Clock, CheckCircle2, AlertCircle, FileText, Calendar, User, Hash, Filter, RefreshCw, CheckCheck, XCircle } from 'lucide-react'
import { cn } from '../lib/utils'
import type { BKReport, BKReportStatus } from '../types'
import { statusLabel } from '../lib/roles'

interface BKMaterial {
  id: number
  material_index: number
  kode_material: string
  qty_per_sachet: number
  range_min: number
  range_max: number
}

interface HistoryModalBKProps {
  isOpen: boolean
  onClose: () => void
  history: BKReport[]
  materials: BKMaterial[]
  isDark: boolean
  onSelectReport: (report: BKReport) => void
  filterNoBatch: string
  onFilterChange: (value: string) => void
  onRefresh: () => void
}

function fmt(v: number | null | undefined, decimals = 3): string {
  if (v == null || isNaN(v)) return '-'
  return v.toFixed(decimals)
}

export default function HistoryModalBK({
  isOpen,
  onClose,
  history,
  materials: _materials,
  isDark,
  onSelectReport,
  filterNoBatch,
  onFilterChange,
  onRefresh
}: HistoryModalBKProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all')

  if (!isOpen) return null

  const batchNumbers = Array.from(new Set(history.map(r => r.no_batch).filter(Boolean)))

  const filteredHistory = history.filter(report => {
    if (filterNoBatch && report.no_batch !== filterNoBatch) return false
    if (filterStatus === 'all') return true
    if (filterStatus === 'waiting') return report.status === 'waiting_spv' || report.status === 'waiting_mgr'
    return report.status === filterStatus
  })

  function renderStatusBadge(status?: BKReportStatus | string) {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 font-semibold">
            <CheckCheck size={12} />
            Disetujui
          </span>
        )
      case 'waiting_mgr':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 font-semibold">
            <Clock size={12} />
            Menunggu Manager
          </span>
        )
      case 'waiting_spv':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 font-semibold">
            <Clock size={12} />
            Menunggu SPV
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 font-semibold">
            <XCircle size={12} />
            Ditolak
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={cn(
        'w-full max-w-6xl max-h-[90vh] rounded-xl shadow-2xl overflow-hidden',
        isDark ? 'bg-gray-800' : 'bg-white'
      )}>
        <div className={cn(
          'flex items-center justify-between p-4 border-b',
          isDark ? 'border-gray-700' : 'border-gray-200'
        )}>
          <div className="flex items-center gap-2">
            <Clock size={20} className="text-brand-green" />
            <h2 className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-gray-900')}>
              Riwayat Perhitungan & Status Approval
            </h2>
            <span className={cn('text-sm ml-2 px-2.5 py-0.5 rounded-full font-medium',
              isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
            )}>
              {filteredHistory.length} dari {history.length} data
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className={cn('p-1.5 rounded-lg transition-colors',
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              )}
              title="Refresh Riwayat"
            >
              <RefreshCw size={18} className={isDark ? 'text-gray-400' : 'text-gray-600'} />
            </button>
            <button
              onClick={onClose}
              className={cn('p-1.5 rounded-lg transition-colors',
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              )}
            >
              <X size={20} className={isDark ? 'text-gray-400' : 'text-gray-600'} />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className={cn(
          'px-4 py-3 border-b flex items-center gap-4 flex-wrap text-sm',
          isDark ? 'border-gray-700 bg-gray-900/30' : 'border-gray-200 bg-gray-50/50'
        )}>
          <div className="flex items-center gap-2">
            <Filter size={16} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
            <span className={cn('font-medium', isDark ? 'text-gray-300' : 'text-gray-600')}>
              No. Batch:
            </span>
            <select
              value={filterNoBatch}
              onChange={(e) => onFilterChange(e.target.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg border text-sm outline-none',
                isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              )}
            >
              <option value="">Semua Batch</option>
              {batchNumbers.map(batch => (
                <option key={batch} value={batch}>{batch}</option>
              ))}
            </select>
            {filterNoBatch && (
              <button
                onClick={() => onFilterChange('')}
                className={cn('text-xs px-2 py-1 rounded',
                  isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                )}
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={cn('font-medium mr-1', isDark ? 'text-gray-300' : 'text-gray-600')}>
              Status:
            </span>
            {[
              { id: 'all', label: 'Semua' },
              { id: 'waiting', label: 'Menunggu' },
              { id: 'approved', label: 'Disetujui' },
              { id: 'rejected', label: 'Ditolak' },
              { id: 'draft', label: 'Draft' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-semibold transition-all',
                  filterStatus === tab.id
                    ? 'bg-brand-green text-white shadow-sm'
                    : isDark
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-160px)] p-4">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto text-gray-400 mb-3" />
              <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>
                Tidak ada data riwayat yang sesuai dengan filter.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((report, idx) => (
                <div
                  key={report.id}
                  className={cn(
                    'p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md',
                    isDark ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-gray-50',
                    idx === 0 && (isDark ? 'border-brand-green/40' : 'border-brand-green/40')
                  )}
                  onClick={() => onSelectReport(report)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
                          <Hash size={14} className="inline mr-1" />
                          {report.no_batch}
                        </span>
                        {renderStatusBadge(report.status)}
                        {idx === 0 && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-brand-green/20 text-brand-green font-medium">
                            Terbaru
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-2">
                        <div>
                          <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Tanggal Produksi</span>
                          <p className={cn('font-medium', isDark ? 'text-gray-200' : 'text-gray-700')}>
                            <Calendar size={12} className="inline mr-1" />
                            {new Date(report.tgl_pembuatan).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        <div>
                          <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Bobot Total</span>
                          <p className={cn('font-medium', isDark ? 'text-gray-200' : 'text-gray-700')}>
                            {fmt(report.bobot_total)} Kg
                          </p>
                        </div>
                        <div>
                          <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Input Sisa Minor</span>
                          <p className={cn('font-medium', isDark ? 'text-gray-200' : 'text-gray-700')}>
                            {fmt(report.input_sisa_minor)}
                          </p>
                        </div>
                        <div>
                          <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Pembuat (Staff)</span>
                          <p className={cn('font-medium', isDark ? 'text-gray-200' : 'text-gray-700')}>
                            <User size={12} className="inline mr-1" />
                            {report.created_by_name || `User ${report.created_by}`}
                          </p>
                        </div>
                      </div>

                      {/* Detail Approval Info */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] pt-1.5 border-t border-gray-100 dark:border-gray-700/50">
                        {report.spv_name && (
                          <span className={report.spv_approved_at ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-400'}>
                            ✓ SPV: {report.spv_name} {report.spv_approved_at && `(${new Date(report.spv_approved_at).toLocaleDateString('id-ID')})`}
                          </span>
                        )}
                        {report.mgr_name && (
                          <span className={report.mgr_approved_at ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-400'}>
                            ✓ MGR: {report.mgr_name} {report.mgr_approved_at && `(${new Date(report.mgr_approved_at).toLocaleDateString('id-ID')})`}
                          </span>
                        )}
                        {report.status === 'rejected' && (
                          <span className="text-red-500 font-medium">
                            ✕ Ditolak oleh {report.rejected_by_name || 'Atasan'}
                            {report.reject_note && `: "${report.reject_note}"`}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <button
                      className={cn(
                        'ml-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap self-center',
                        isDark 
                          ? 'bg-brand-green/20 text-brand-green hover:bg-brand-green/30' 
                          : 'bg-brand-green/10 text-brand-green hover:bg-brand-green/20'
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectReport(report)
                      }}
                    >
                      Buka Data
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
   