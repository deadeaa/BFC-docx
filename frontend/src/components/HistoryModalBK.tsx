// frontend/src/components/HistoryModalBK.tsx
import { X, Clock, CheckCircle2, AlertCircle, FileText, Calendar, User, Hash, Filter, RefreshCw } from 'lucide-react'
import { cn } from '../lib/utils'

interface BKMaterial {
  id: number
  material_index: number
  kode_material: string
  qty_per_sachet: number
  range_min: number
  range_max: number
}

interface BKReport {
  id: number
  kode_produk: string
  nama_produk?: string
  no_batch: string
  tgl_pembuatan: string
  bobot_total: number
  input_sisa_minor: number
  created_by: number
  created_by_name?: string
  created_at: string
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
  materials,
  isDark,
  onSelectReport,
  filterNoBatch,
  onFilterChange,
  onRefresh
}: HistoryModalBKProps) {
  if (!isOpen) return null

  // Get unique batch numbers for filter dropdown
  const batchNumbers = Array.from(new Set(history.map(r => r.no_batch).filter(Boolean)))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={cn(
        'w-full max-w-6xl max-h-[90vh] rounded-xl shadow-2xl overflow-hidden',
        isDark ? 'bg-gray-800' : 'bg-white'
      )}>
        {/* Header */}
        <div className={cn(
          'flex items-center justify-between p-4 border-b',
          isDark ? 'border-gray-700' : 'border-gray-200'
        )}>
          <div className="flex items-center gap-2">
            <Clock size={20} className="text-brand-green" />
            <h2 className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-gray-900')}>
              Riwayat Perhitungan
            </h2>
            <span className={cn('text-sm ml-2 px-2.5 py-0.5 rounded-full font-medium',
              isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
            )}>
              {history.length} data
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className={cn('p-1.5 rounded-lg transition-colors',
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              )}
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

        {/* Filter */}
        <div className={cn(
          'px-4 py-3 border-b flex items-center gap-3 flex-wrap',
          isDark ? 'border-gray-700' : 'border-gray-200'
        )}>
          <Filter size={16} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
          <span className={cn('text-sm font-medium', isDark ? 'text-gray-300' : 'text-gray-600')}>
            Filter No. Batch:
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
              ✕ Hapus Filter
            </button>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-160px)] p-4">
          {history.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto text-gray-400 mb-3" />
              <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>
                {filterNoBatch ? 'Tidak ada data untuk No. Batch ini' : 'Belum ada riwayat perhitungan untuk produk ini'}
              </p>
              <p className={cn('text-xs mt-1', isDark ? 'text-gray-500' : 'text-gray-400')}>
                {filterNoBatch ? 'Coba hapus filter atau pilih No. Batch lain' : 'Simpan perhitungan pertama Anda untuk mulai membuat riwayat'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((report, idx) => (
                <div
                  key={report.id}
                  className={cn(
                    'p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md',
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
                        {idx === 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-brand-green/20 text-brand-green font-medium">
                            Terbaru
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
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
                        <div className="col-span-2 md:col-span-3">
                          <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Dibuat</span>
                          <p className={cn('font-medium', isDark ? 'text-gray-200' : 'text-gray-700')}>
                            <User size={12} className="inline mr-1" />
                            {report.created_by_name || `User ${report.created_by}`}
                            <span className="text-xs opacity-60 ml-2">
                              {new Date(report.created_at).toLocaleString('id-ID')}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      className={cn(
                        'ml-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                        isDark 
                          ? 'bg-brand-green/20 text-brand-green hover:bg-brand-green/30' 
                          : 'bg-brand-green/10 text-brand-green hover:bg-brand-green/20'
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectReport(report)
                      }}
                    >
                      Muat Data
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