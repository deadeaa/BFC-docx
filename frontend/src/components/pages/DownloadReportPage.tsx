// frontend/src/components/pages/DownloadReportPage.tsx
import { useState, useEffect, useCallback } from 'react'
import { FileDown, ChevronDown, AlertCircle, CheckCircle2, FileText, Calendar, User, Tag } from 'lucide-react'
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

  const [bkReports, setBkReports] = useState<BKReport[]>([])
  const [selectedBK, setSelectedBK] = useState<BKReport | null>(null)
  const [loadingBK, setLoadingBK] = useState(false)

  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // ============================================================
  // LOAD PRODUCTS
  // ============================================================
  useEffect(() => {
    api.get('/batch-khusus/products')
      .then((res) => {
        const data = res.data || []
        const unique = data.filter((p: ProductOption, i: number, self: ProductOption[]) =>
          i === self.findIndex((x: ProductOption) => x.kode_produk === p.kode_produk)
        )
        setProducts(unique)
      })
      .catch(() => {})
  }, [])

  // ============================================================
  // LOAD BK REPORTS
  // ============================================================
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

  // ============================================================
  // HANDLE SELECT PRODUCT
  // ============================================================
  const handleSelectKode = (kode: string) => {
    setSelectedKode(kode)
    setSelectedBK(null)
    setError('')
    setSuccess('')

    if (kode) {
      loadBKReports(kode)
    } else {
      setBkReports([])
    }
  }

  // ============================================================
  // ✅ FORMAT DATE - ROBUST
  // ============================================================
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    
    try {
      let date: Date
      
      // Coba parse langsung
      date = new Date(dateStr)
      
      // Kalau invalid, coba format DD-MM-YYYY
      if (isNaN(date.getTime())) {
        const parts = dateStr.split('-')
        if (parts.length === 3 && parts[0].length === 2) {
          // format: DD-MM-YYYY
          date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]))
        } else if (parts.length === 3 && parts[0].length === 4) {
          // format: YYYY-MM-DD
          date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
        }
      }
      
      // Kalau masih invalid, coba split dengan '/'
      if (isNaN(date.getTime())) {
        const parts = dateStr.split('/')
        if (parts.length === 3) {
          date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]))
        }
      }
      
      // Kalau masih invalid, return original string
      if (isNaN(date.getTime())) {
        return dateStr
      }
      
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
    } catch {
      return dateStr
    }
  }

  // ============================================================
  // DOWNLOAD REPORT
  // ============================================================
  const handleDownload = async () => {
    if (!selectedKode) {
      setError('Pilih kode produk terlebih dahulu')
      return
    }

    if (!selectedBK) {
      setError('Pilih report BK')
      return
    }

    setDownloading(true)
    setError('')
    setSuccess('')

    try {
      const payload = {
        kode_produk: selectedKode,
        bk_report_id: selectedBK?.id || 0,
      }

      const response = await api.post('/reports/download', payload, {
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      let filename = `report_${selectedKode}`
      if (selectedBK) filename += `_BK_${selectedBK.no_batch}`
      filename += '.docx'
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      setSuccess(`Report BK berhasil didownload!`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      console.error('❌ Download error:', err)
      if (err.response?.status === 404) {
        setError(`⚠️ ${err.response?.data?.message || 'Template atau report tidak ditemukan'}`)
      } else {
        setError(err.response?.data?.message || 'Gagal mendownload report')
      }
    } finally {
      setDownloading(false)
    }
  }

  // ============================================================
  // STYLING
  // ============================================================
  const card = isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
  const inputBase = cn(
    'w-full px-3 py-2 rounded-lg border text-sm transition-colors outline-none',
    isDark
      ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-brand-green-light'
      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-brand-green'
  )

  const TypeBadge = ({ type }: { type: 'BK' }) => {
    const styles = {
      BK: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
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

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className={cn('min-h-full p-6', isDark ? 'bg-gray-900' : 'bg-brand-bg')}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/10">
            <FileText size={20} className="text-green-500" />
          </div>
          <div>
            <h1 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>
              Download Report Batch Khusus
            </h1>
            <p className={cn('text-sm mt-0.5', isDark ? 'text-gray-400' : 'text-gray-500')}>
              Pilih produk dan batch, lalu download report BK
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

        {/* Pilih BK Report */}
        <div className="mb-4">
          <label className={cn('block text-xs font-medium mb-1.5', isDark ? 'text-gray-400' : 'text-gray-600')}>
            <TypeBadge type="BK" /> Pilih Batch
          </label>
          <div className="relative max-w-md">
            <select
              value={selectedBK?.id || ''}
              onChange={(e) => {
                const report = bkReports.find(r => r.id === parseInt(e.target.value))
                setSelectedBK(report || null)
              }}
              disabled={!selectedKode || loadingBK}
              className={cn(inputBase, 'pr-9 appearance-none cursor-pointer', 'disabled:opacity-50')}
            >
              <option value="">-- Pilih Batch --</option>
              {bkReports.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.no_batch} ({formatDate(r.tgl_pembuatan)})
                  {r.created_by_name && ` - ${r.created_by_name}`}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
          </div>
          {loadingBK && (
            <div className="flex items-center gap-2 mt-1">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-brand-green border-t-transparent" />
              <p className="text-xs text-gray-400">Memuat data batch...</p>
            </div>
          )}
          {!loadingBK && bkReports.length === 0 && selectedKode && (
            <p className="text-xs text-yellow-500 mt-1">⚠️ Belum ada report BK untuk produk ini</p>
          )}
        </div>

        {/* Preview pilihan */}
        {selectedBK && (
          <div className={cn(
            'p-4 rounded-lg mb-4 border',
            isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
          )}>
            <div className="text-sm font-medium mb-2">
              📋 Ringkasan Pilihan:
            </div>
            <div className="text-sm">
              <span className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>BK</span>
              <p className="font-medium flex items-center gap-2">
                <Tag size={14} className="text-gray-400" />
                {selectedBK.no_batch}
                <span className="text-xs text-gray-400">
                  ({formatDate(selectedBK.tgl_pembuatan)})
                </span>
                {selectedBK.created_by_name && (
                  <span className="text-xs text-gray-400">
                    oleh {selectedBK.created_by_name}
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Bobot Total: {selectedBK.bobot_total} Kg
              </p>
            </div>
          </div>
        )}

        {/* Error / Success */}
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

        {/* Tombol Download */}
        <button
          onClick={handleDownload}
          disabled={!selectedKode || downloading || !selectedBK}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold transition-all',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'bg-green-600 hover:bg-green-700 text-white'
          )}
        >
          {downloading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Mengunduh...
            </>
          ) : (
            <>
              <FileDown size={18} />
              Download Report BK
            </>
          )}
        </button>

        {selectedKode && !selectedBK && !loadingBK && (
          <p className="text-sm text-center text-gray-400 mt-3">
            Pilih batch BK untuk download report
          </p>
        )}
      </div>
    </div>
  )
}