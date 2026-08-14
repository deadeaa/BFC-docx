// frontend/src/components/pages/DownloadReportPage.tsx
import { useState, useEffect, useCallback } from 'react'
import { FileDown, ChevronDown, AlertCircle, CheckCircle2, FileText, Calendar, User, Tag, Layers } from 'lucide-react'
import api from '../../lib/api'
import { useTheme } from '../../context/ThemeContext'
import { cn } from '../../lib/utils'

interface ProductOption {
  kode_produk: string
  nama_produk: string
}

interface BaseReport {
  id: number
  kode_produk: string
  no_batch: string
  tgl_pembuatan: string
  created_by_name?: string
  created_at: string
}

interface BOReport extends BaseReport {
  type: 'BO'
  kesimpulan: 'MS' | 'TMS'
  bobot_total: number
}

interface BKReport extends BaseReport {
  type: 'BK'
  bobot_total: number
  input_sisa_minor: number
}

export default function DownloadReportPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [products, setProducts] = useState<ProductOption[]>([])
  const [selectedKode, setSelectedKode] = useState<string>('')

  // BO Reports
  const [boReports, setBoReports] = useState<BOReport[]>([])
  const [selectedBO, setSelectedBO] = useState<BOReport | null>(null)
  const [loadingBO, setLoadingBO] = useState(false)

  // BK Reports
  const [bkReports, setBkReports] = useState<BKReport[]>([])
  const [selectedBK, setSelectedBK] = useState<BKReport | null>(null)
  const [loadingBK, setLoadingBK] = useState(false)

  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Load products
  useEffect(() => {
    Promise.all([
      api.get('/batch-overfilled/products').catch(() => ({ data: [] })),
      api.get('/batch-khusus/products').catch(() => ({ data: [] })),
    ]).then(([boRes, bkRes]) => {
      const all = [...(boRes.data || []), ...(bkRes.data || [])]
      const unique = all.filter((p, i, self) => 
        i === self.findIndex(x => x.kode_produk === p.kode_produk)
      )
      setProducts(unique)
    }).catch(() => {})
  }, [])

  // Load BO reports when product selected
  const loadBOReports = useCallback(async (kode: string) => {
    if (!kode) {
      setBoReports([])
      setSelectedBO(null)
      return
    }

    setLoadingBO(true)
    try {
      const res = await api.get(`/batch-overfilled/reports/product/${kode}`, {
        params: { limit: 100 }
      })
      const reports = (res.data || []).map((r: any) => ({ ...r, type: 'BO' as const }))
      reports.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setBoReports(reports)
      setSelectedBO(reports.length > 0 ? reports[0] : null)
    } catch (err) {
      console.error('❌ Load BO reports error:', err)
      setBoReports([])
      setSelectedBO(null)
    } finally {
      setLoadingBO(false)
    }
  }, [])

  // Load BK reports when product selected
  const loadBKReports = useCallback(async (kode: string) => {
    if (!kode) {
      setBkReports([])
      setSelectedBK(null)
      return
    }

    setLoadingBK(true)
    try {
      const res = await api.get(`/batch-khusus/reports/product/${kode}`, {
        params: { limit: 100 }
      })
      const reports = (res.data || []).map((r: any) => ({ ...r, type: 'BK' as const }))
      reports.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setBkReports(reports)
      setSelectedBK(reports.length > 0 ? reports[0] : null)
    } catch (err) {
      console.error('❌ Load BK reports error:', err)
      setBkReports([])
      setSelectedBK(null)
    } finally {
      setLoadingBK(false)
    }
  }, [])

  const handleSelectKode = (kode: string) => {
    setSelectedKode(kode)
    setSelectedBO(null)
    setSelectedBK(null)
    setError('')
    setSuccess('')
    if (kode) {
      loadBOReports(kode)
      loadBKReports(kode)
    } else {
      setBoReports([])
      setBkReports([])
    }
  }

  // ✅ Download gabungan BO + BK sesuai pilihan user
  const handleDownloadCombined = async () => {
    if (!selectedKode) {
      setError('Pilih kode produk terlebih dahulu')
      return
    }

    if (!selectedBO && !selectedBK) {
      setError('Pilih minimal 1 report (BO atau BK)')
      return
    }

    setDownloading(true)
    setError('')
    setSuccess('')

    try {
      // Kirim ID BO dan BK yang dipilih
      const payload = {
        kode_produk: selectedKode,
        bo_report_id: selectedBO?.id || 0,
        bk_report_id: selectedBK?.id || 0,
      }

      const response = await api.post('/reports/download/combined', payload, {
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      let filename = `report_combined_${selectedKode}`
      if (selectedBO) filename += `_BO_${selectedBO.no_batch}`
      if (selectedBK) filename += `_BK_${selectedBK.no_batch}`
      filename += '.docx'
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      setSuccess(`Report gabungan berhasil didownload!`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      console.error('❌ Download combined error:', err)
      if (err.response?.status === 404) {
        setError(`⚠️ ${err.response?.data?.message || 'Template atau report tidak ditemukan'}`)
      } else {
        setError(err.response?.data?.message || 'Gagal mendownload report gabungan')
      }
    } finally {
      setDownloading(false)
    }
  }

  const card = isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
  const inputBase = cn(
    'w-full px-3 py-2 rounded-lg border text-sm transition-colors outline-none',
    isDark
      ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-brand-green-light'
      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-brand-green'
  )

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr + 'T00:00:00').toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
    } catch {
      return dateStr
    }
  }

  const TypeBadge = ({ type }: { type: 'BO' | 'BK' }) => {
    const styles = {
      BO: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      BK: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    }
    return (
      <span className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold',
        styles[type]
      )}>
        {type}
      </span>
    )
  }

  return (
    <div className={cn('min-h-full p-6', isDark ? 'bg-gray-900' : 'bg-brand-bg')}>
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <FileText size={20} className="text-blue-500" />
          </div>
          <div>
            <h1 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>
              Download Report Gabungan
            </h1>
            <p className={cn('text-sm mt-0.5', isDark ? 'text-gray-400' : 'text-gray-500')}>
              Pilih produk, lalu pilih report BO dan BK, download otomatis dalam 1 file
            </p>
          </div>
        </div>
      </div>

      <div className={cn('rounded-xl p-5 shadow-sm', card)}>
        {/* Pilih Produk */}
        <div className="mb-4">
          <label className={cn('block text-xs font-medium mb-1.5', isDark ? 'text-gray-400' : 'text-gray-600')}>
            Kode Produk <span className="text-red-500">*</span>
          </label>
          <div className="relative max-w-md">
            <select
              value={selectedKode}
              onChange={(e) => handleSelectKode(e.target.value)}
              className={cn(inputBase, 'pr-9 appearance-none cursor-pointer')}
            >
              <option value="">-- Pilih Produk --</option>
              {products.map((p) => (
                <option key={p.kode_produk} value={p.kode_produk}>
                  {p.kode_produk} – {p.nama_produk}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
          </div>
        </div>

        {/* 2 Dropdown: BO dan BK */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Pilih BO Report */}
          <div>
            <label className={cn('block text-xs font-medium mb-1.5', isDark ? 'text-gray-400' : 'text-gray-600')}>
              <TypeBadge type="BO" /> Report Batch Overfilled
            </label>
            <div className="relative">
              <select
                value={selectedBO?.id || ''}
                onChange={(e) => {
                  const report = boReports.find(r => r.id === parseInt(e.target.value))
                  setSelectedBO(report || null)
                }}
                disabled={!selectedKode || loadingBO}
                className={cn(inputBase, 'pr-9 appearance-none cursor-pointer', 'disabled:opacity-50')}
              >
                <option value="">-- Pilih BO Report --</option>
                {boReports.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.no_batch} ({formatDate(r.tgl_pembuatan)}) - {r.kesimpulan}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
            </div>
            {loadingBO && (
              <div className="flex items-center gap-2 mt-1">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-brand-green border-t-transparent" />
                <p className="text-xs text-gray-400">Memuat BO reports...</p>
              </div>
            )}
            {!loadingBO && boReports.length === 0 && selectedKode && (
              <p className="text-xs text-yellow-500 mt-1">⚠️ Belum ada report BO</p>
            )}
          </div>

          {/* Pilih BK Report */}
          <div>
            <label className={cn('block text-xs font-medium mb-1.5', isDark ? 'text-gray-400' : 'text-gray-600')}>
              <TypeBadge type="BK" /> Report Batch Khusus
            </label>
            <div className="relative">
              <select
                value={selectedBK?.id || ''}
                onChange={(e) => {
                  const report = bkReports.find(r => r.id === parseInt(e.target.value))
                  setSelectedBK(report || null)
                }}
                disabled={!selectedKode || loadingBK}
                className={cn(inputBase, 'pr-9 appearance-none cursor-pointer', 'disabled:opacity-50')}
              >
                <option value="">-- Pilih BK Report --</option>
                {bkReports.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.no_batch} ({formatDate(r.tgl_pembuatan)})
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
            </div>
            {loadingBK && (
              <div className="flex items-center gap-2 mt-1">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-brand-green border-t-transparent" />
                <p className="text-xs text-gray-400">Memuat BK reports...</p>
              </div>
            )}
            {!loadingBK && bkReports.length === 0 && selectedKode && (
              <p className="text-xs text-yellow-500 mt-1">⚠️ Belum ada report BK</p>
            )}
          </div>
        </div>

        {/* Preview pilihan */}
        {(selectedBO || selectedBK) && (
          <div className={cn(
            'p-4 rounded-lg mb-4 border',
            isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
          )}>
            <div className="text-sm font-medium mb-2">
              📋 Ringkasan Pilihan:
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>BO</span>
                {selectedBO ? (
                  <p className="font-medium flex items-center gap-2">
                    <Tag size={14} className="text-gray-400" />
                    {selectedBO.no_batch}
                    <span className="text-xs text-gray-400">
                      ({formatDate(selectedBO.tgl_pembuatan)})
                    </span>
                    <span className={cn(
                      'text-xs font-bold',
                      selectedBO.kesimpulan === 'MS' ? 'text-green-500' : 'text-red-500'
                    )}>
                      {selectedBO.kesimpulan}
                    </span>
                  </p>
                ) : (
                  <p className="text-xs text-gray-400">Tidak dipilih</p>
                )}
              </div>
              <div>
                <span className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>BK</span>
                {selectedBK ? (
                  <p className="font-medium flex items-center gap-2">
                    <Tag size={14} className="text-gray-400" />
                    {selectedBK.no_batch}
                    <span className="text-xs text-gray-400">
                      ({formatDate(selectedBK.tgl_pembuatan)})
                    </span>
                  </p>
                ) : (
                  <p className="text-xs text-gray-400">Tidak dipilih</p>
                )}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 mb-4">
            <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
            <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30 mb-4">
            <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
            <span className="text-sm text-green-700 dark:text-green-400">{success}</span>
          </div>
        )}

        {/* ✅ SATU TOMBOL DOWNLOAD */}
        <button
          onClick={handleDownloadCombined}
          disabled={!selectedKode || downloading || (!selectedBO && !selectedBK)}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold transition-all',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'bg-purple-600 hover:bg-purple-700 text-white'
          )}
        >
          {downloading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Mengunduh...
            </>
          ) : (
            <>
              <Layers size={18} />
              Download Gabungan (
              {selectedBO ? 'BO' : ''}
              {selectedBO && selectedBK ? ' + ' : ''}
              {selectedBK ? 'BK' : ''}
              )
            </>
          )}
        </button>

        {selectedKode && !selectedBO && !selectedBK && !loadingBO && !loadingBK && (
          <p className="text-sm text-center text-gray-400 mt-3">
            Pilih minimal 1 report (BO atau BK) untuk download
          </p>
        )}
      </div>
    </div>
  )
}