import { X, Clock, CheckCircle2, AlertCircle, FileText, Calendar, User, Hash, Filter, RefreshCw } from 'lucide-react'
import { cn } from '../lib/utils'

interface BOMaterial {
  id: number
  material_index: number
  kode_material: string
  label: string
  target_kg: number
}

interface BOReport {
  id: number
  kode_produk: string
  nama_produk?: string
  no_batch: string
  tgl_pembuatan: string
  bobot_total: number
  kesimpulan: 'MS' | 'TMS'
  detail_json: string
  created_by: number
  created_by_name?: string
  created_at: string
}

interface HistoryModalProps {
  isOpen: boolean
  onClose: () => void
  history: BOReport[]
  materials: BOMaterial[]
  isDark: boolean
  onSelectReport: (report: BOReport) => void
  filterNoBatch: string
  onFilterChange: (value: string) => void
  onRefresh: () => void
}

function fmt(v: number | null | undefined, decimals = 3): string {
  if (v == null || isNaN(v)) return '0.000'
  return v.toFixed(decimals)
}

export default function HistoryModal({
  isOpen,
  onClose,
  history,
  materials,
  isDark,
  onSelectReport,
  filterNoBatch,
  onFilterChange,
  onRefresh
}: HistoryModalProps) {
  if (!isOpen) return null

  const getStatusColor = (status: 'MS' | 'TMS') => {
    if (status === 'MS') {
      return isDark ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700'
    }
    return isDark ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-700'
  }

  const getStatusIcon = (status: 'MS' | 'TMS') => {
    if (status === 'MS') {
      return <CheckCircle2 size={14} className="text-green-500" />
    }
    return <AlertCircle size={14} className="text-red-500" />
  }

  // Get unique batch numbers from history data
  const batchNumbers = Array.from(new Set(history.map(r => r.no_batch).filter(Boolean)))

  const parseDetail = (detailJson: string) => {
    try {
      if (!detailJson) return null
      return typeof detailJson === 'string' ? JSON.parse(detailJson) : detailJson
    } catch (e) {
      console.error('Error parsing detail:', e)
      return null
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={cn(
        'w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl overflow-hidden',
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
              title="Refresh data"
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

        {/* Filter Section */}
        <div className={cn(
          'px-4 py-3 border-b flex items-center gap-3 flex-wrap',
          isDark ? 'border-gray-700' : 'border-gray-200'
        )}>
          <Filter size={16} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
          <span className={cn('text-sm font-medium', isDark ? 'text-gray-300' : 'text-gray-600')}>
            Filter No. Batch:
          </span>
          <select
            value={filterNoBatch || ''}
            onChange={(e) => {
              const value = e.target.value
              console.log('📊 Filter changed to:', value)
              onFilterChange(value)
            }}
            className={cn(
              'px-3 py-1.5 rounded-lg border text-sm outline-none min-w-[150px]',
              isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
            )}
          >
            <option value="">Semua Batch</option>
            {batchNumbers.map(batch => (
              <option key={batch} value={batch}>
                {batch}
              </option>
            ))}
          </select>
          
          {filterNoBatch && filterNoBatch !== '' && (
            <button
              onClick={() => {
                console.log('🔄 Clearing filter')
                onFilterChange('')
              }}
              className={cn('text-xs px-2 py-1 rounded transition-colors',
                isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              )}
            >
              ✕ Hapus Filter
            </button>
          )}
          
          {filterNoBatch && filterNoBatch !== '' && (
            <span className={cn('text-xs px-2 py-0.5 rounded-full bg-brand-green/20 text-brand-green')}>
              Filter: {filterNoBatch}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4 space-y-3" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {history.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto text-gray-400 mb-3" />
              <p className={cn('text-sm font-medium', isDark ? 'text-gray-400' : 'text-gray-500')}>
                {filterNoBatch ? 'Tidak ada data untuk No. Batch ini' : 'Belum ada riwayat perhitungan'}
              </p>
              {filterNoBatch && (
                <button
                  onClick={() => onFilterChange('')}
                  className="mt-2 text-xs text-brand-green hover:underline"
                >
                  Hapus filter untuk melihat semua data
                </button>
              )}
            </div>
          ) : (
            history.map((report, idx) => {
              const detail = parseDetail(report.detail_json)
              const pivotLabel = detail?.pivot_label || detail?.kriteria?.find((k: any) => k.is_pivot)?.label || '-'
              
              return (
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
                      {/* Header: No Batch + Badges */}
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
                        <span className={cn(
                          'text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1',
                          getStatusColor(report.kesimpulan)
                        )}>
                          {getStatusIcon(report.kesimpulan)}
                          {report.kesimpulan}
                        </span>
                      </div>

                      {/* Grid Info */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <div>
                          <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Tanggal</span>
                          <p className={cn('font-medium', isDark ? 'text-gray-200' : 'text-gray-700')}>
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
                          <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Nilai Tertinggi</span>
                          <p className={cn('font-medium', isDark ? 'text-gray-200' : 'text-gray-700')}>
                            {detail?.nilai_tertinggi ? fmt(detail.nilai_tertinggi, 3) : '-'}
                          </p>
                        </div>
                        <div>
                          <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Dibuat</span>
                          <p className={cn('font-medium', isDark ? 'text-gray-200' : 'text-gray-700')}>
                            {report.created_by_name || 'User'}
                            <br />
                            <span className="text-xs opacity-60">
                              {new Date(report.created_at).toLocaleString('id-ID')}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Detail Materials */}
                      {detail?.materials && detail.materials.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-dashed" 
                          style={{ borderColor: isDark ? '#374151' : '#e5e7eb' }}>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 text-xs">
                            {detail.materials.map((m: any, i: number) => (
                              <div key={i} className="flex items-center gap-1">
                                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                                  {m.kode_material || m.label || `Col-${i}`}:
                                </span>
                                <span className={cn('font-medium', isDark ? 'text-gray-200' : 'text-gray-700')}>
                                  {fmt(m.hasil_batching)} Kg
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ✅ SYARAT - HANYA MS/TMS SAJA TANPA DETAIL */}
                      {detail?.kriteria && detail.kriteria.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-dashed" 
                          style={{ borderColor: isDark ? '#374151' : '#e5e7eb' }}>
                          <div className="text-xs font-semibold mb-1" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                            Syarat
                          </div>
                          <div className="flex items-center gap-3 flex-wrap text-xs">
                            {detail.kriteria.map((cr: any, crIdx: number) => {
                              const isPivot = cr.is_pivot || cr.materialIndex === detail.kriteria.findIndex((k: any) => k.is_pivot)
                              
                              return (
                                <div key={crIdx} className="flex items-center gap-1.5">
                                  <span className="font-medium" style={{ color: isDark ? '#D1D5DB' : '#374151' }}>
                                    {cr.label || `Material-${cr.materialIndex}`}:
                                  </span>
                                  <span className={cn(
                                    'text-xs font-bold px-2 py-0.5 rounded',
                                    cr.status === 'MS' 
                                      ? (isDark ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700')
                                      : (isDark ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-700')
                                  )}>
                                    {cr.status}
                                  </span>
                                  {isPivot && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">
                                      PIVOT
                                    </span>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Tombol Muat Data */}
                    <button
                      className={cn(
                        'ml-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0',
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
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}