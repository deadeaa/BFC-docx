// frontend/src/components/pages/BatchKhususPage.tsx
import { useState, useEffect, useCallback } from 'react'
import { Calculator, Save, ChevronDown, AlertCircle, CheckCircle2, FileDown, History } from 'lucide-react'
import api from '../../lib/api'
import { useTheme } from '../../context/ThemeContext'
import { cn } from '../../lib/utils'
import HistoryModalBK from '../../components/HistoryModalBK'
import { useAuth } from '../../context/AuthContext'

// ── Types ────────────────────────────────────────────────────

interface BKMaterial {
  id: number
  material_index: number
  kode_material: string
  qty_per_sachet: number
  teoritis: number
  range_min: number
  range_max: number
}

interface BKRendemen {
  id: number
  sort_order: number
  persen: number
}

interface BKProduct {
  id: number
  kode_produk: string
  nama_produk: string
  materials: BKMaterial[]
  rendemen: BKRendemen[]
}

interface ProductOption {
  id: number
  kode_produk: string
  nama_produk: string
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

// ── Helpers ──────────────────────────────────────────────────

function fmt(v: number | null | undefined, decimals = 3): string {
  if (v == null || isNaN(v)) return '-'
  return v.toFixed(decimals)
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatDateForFilename(date: string): string {
  return date.replace(/-/g, '/')
}

// ── Main Component ───────────────────────────────────────────

export default function BatchKhususPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { user } = useAuth()

  // ✅ Cek apakah user admin
  const isAdmin = user?.role === 'admin'

  const [productList, setProductList] = useState<ProductOption[]>([])
  const [selectedKode, setSelectedKode] = useState<string>('')
  const [product, setProduct] = useState<BKProduct | null>(null)
  const [loadingProduct, setLoadingProduct] = useState(false)
  const [loadingLatest, setLoadingLatest] = useState(false)

  const [inputRaw, setInputRaw] = useState<string>('')
  const [noBatch, setNoBatch] = useState<string>('')
  // ✅ Tanggal otomatis hari ini, tidak perlu input manual
  const [tglPembuatan] = useState(today())
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState('')

  const [latestReport, setLatestReport] = useState<BKReport | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [historyData, setHistoryData] = useState<BKReport[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [filterNoBatch, setFilterNoBatch] = useState<string>('')

  useEffect(() => {
    api.get<ProductOption[]>('/batch-khusus/products')
      .then(res => setProductList(res.data))
      .catch(() => {})
  }, [])

  const handleSelectKode = useCallback(async (kode: string) => {
    setSelectedKode(kode)
    setProduct(null)
    setLatestReport(null)
    setInputRaw('')
    setNoBatch('')
    setSaveSuccess(false)
    setSaveError('')
    setFilterNoBatch('')
    setHistoryData([])

    if (!kode) return

    setLoadingProduct(true)
    setLoadingLatest(true)

    try {
      const productRes = await api.get<BKProduct>(`/batch-khusus/products/${kode}`)
      setProduct(productRes.data)

      try {
        const reportRes = await api.get<BKReport>(`/batch-khusus/reports/latest/${kode}`)
        if (reportRes.data) {
          setLatestReport(reportRes.data)
          setInputRaw(reportRes.data.input_sisa_minor?.toString() || '')
          setNoBatch(reportRes.data.no_batch || '')
          // ✅ Tanggal tetap pakai hari ini, tapi bisa update dari report
          // setTglPembuatan(reportRes.data.tgl_pembuatan || today()) // tidak perlu karena tgl sudah state
        }
      } catch {
        // Tidak ada laporan sebelumnya
      }

      await loadHistory(kode)

    } catch {
      setSaveError('Gagal memuat data produk. Coba pilih ulang.')
    } finally {
      setLoadingProduct(false)
      setLoadingLatest(false)
    }
  }, [])

  const d5 = parseFloat(inputRaw) || 0

  function computeMaterialValues(): number[] {
    if (!product) return []
    const mats = product.materials
    const d4 = mats.find(m => m.material_index === 1)?.qty_per_sachet ?? 1
    return mats.map(m => {
      if (m.material_index === 1) return d5
      if (m.material_index === 0) return (d5 / d4) * m.qty_per_sachet
      if (m.material_index === 2) return (d5 / d4) * m.qty_per_sachet
      const e5 = (d5 / d4) * (mats.find(x => x.material_index === 2)?.qty_per_sachet ?? 0)
      const e4 = mats.find(x => x.material_index === 2)?.qty_per_sachet ?? 1
      return (e5 / e4) * m.qty_per_sachet
    })
  }

  const materialValues = computeMaterialValues()
  const total = materialValues.reduce((s, v) => s + v, 0)
  const qtyTotal = product?.materials.reduce((s, m) => s + m.qty_per_sachet, 0) ?? 0
  const teoritisTotal = product?.materials.reduce((s, m) => s + m.teoritis, 0) ?? 0

  // ── Load History ─────────────────────────────────────────────
  const loadHistory = useCallback(async (kode?: string) => {
    const targetKode = kode || selectedKode
    if (!targetKode) return

    setLoadingHistory(true)
    try {
      const res = await api.get<BKReport[]>(`/batch-khusus/reports/product/${targetKode}`, {
        params: { no_batch: filterNoBatch || undefined }
      })
      setHistoryData(res.data || [])
    } catch {
      setHistoryData([])
    } finally {
      setLoadingHistory(false)
    }
  }, [selectedKode, filterNoBatch])

  useEffect(() => {
    if (selectedKode && showHistory) {
      loadHistory(selectedKode)
    }
  }, [filterNoBatch, selectedKode, showHistory, loadHistory])

  // ── Save ──────────────────────────────────────────────────────
  async function handleSave() {
    if (!product) {
      setSaveError('Pilih produk terlebih dahulu.')
      return
    }
    if (!inputRaw || d5 <= 0) {
      setSaveError('Isi Input Sisa Minor terlebih dahulu.')
      return
    }
    if (!noBatch.trim()) {
      setSaveError('Isi No. Batch terlebih dahulu.')
      return
    }
    setSaving(true)
    setSaveError('')
    setSaveSuccess(false)
    try {
      const res = await api.post<BKReport>('/batch-khusus/reports', {
        kode_produk: product.kode_produk,
        no_batch: noBatch.trim(),
        tgl_pembuatan: tglPembuatan, // ✅ pakai tanggal otomatis
        bobot_total: parseFloat(total.toFixed(4)),
        input_sisa_minor: d5,
      })
      setSaveSuccess(true)
      setLatestReport(res.data)
      setTimeout(() => setSaveSuccess(false), 4000)
    } catch {
      setSaveError('Gagal menyimpan. Coba lagi.')
    } finally {
      setSaving(false)
    }
  }

  // ── Export PDF ─────────────────────────────────────────────────
  function handleExportPDF() {
    if (!product || d5 <= 0) return
    const createdBy = user?.full_name || user?.username || 'User'
    const dateStr = formatDateForFilename(tglPembuatan)
    const filename = `Calculation_Batch_Khusus_${dateStr}`

    const matHeaders = product.materials
      .map(m => `<th>${m.kode_material}</th>`).join('')

    // ✅ ADMIN: tampilkan Qty/sachet
    // ✅ USER: tidak ada Qty/sachet
    let rowQty = ''
    if (isAdmin) {
      rowQty = `
      <tr>
        <td colspan="2" class="label">Qty/sachet</td>
        ${product.materials.map(m => `<td class="num">${fmt(m.qty_per_sachet)}</td>`).join('')}
        <td class="num bold">${fmt(qtyTotal)}</td>
      </tr>`
    }

    // ✅ Teoritis Batching - SEMUA USER
    const rowTeoritis = `
      <tr>
        <td colspan="2" class="label">Teoritis Batching</td>
        ${product.materials.map(m => `<td class="num">${fmt(m.teoritis)}</td>`).join('')}
        <td class="num bold">${fmt(teoritisTotal)}</td>
      </tr>`

    const rowSisa = `
      <tr>
        <td colspan="2" class="label green-label">Input Sisa Minor</td>
        ${materialValues.map((v, i) => {
          const isInput = product.materials[i].material_index === 1
          return `<td class="num${isInput ? ' green-cell' : ''}">${fmt(v)}</td>`
        }).join('')}
        <td class="num bold">${fmt(total)}</td>
      </tr>`

    const rowMin = `
      <tr>
        <td rowspan="2" class="label">Range Batching</td>
        <td class="sub">Min</td>
        ${product.materials.map((m, i) => `<td class="num">${fmt(m.range_min)}</td>`).join('')}
        <td class="num gray">—</td>
      </tr>`
    const rowMax = `
      <tr>
        <td class="sub">Max</td>
        ${product.materials.map((m, i) => `<td class="num">${fmt(m.range_max)}</td>`).join('')}
        <td class="num gray">—</td>
      </tr>`

    const rowsRendemen = product.rendemen.map((r, ri) => `
      <tr>
        ${ri === 0 ? `<td rowspan="${product.rendemen.length}" class="label">Rendemen</td>` : ''}
        <td class="sub">${(r.persen * 100).toFixed(2)}%</td>
        ${product.materials.map(() => `<td class="num gray">—</td>`).join('')}
        <td class="num bold">${fmt(r.persen * total)}</td>
      </tr>`).join('')

    const tglFmt = new Date(tglPembuatan + 'T00:00:00')
      .toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8"/>
<title>${filename}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 12px; padding: 32px; color: #111; }
  h2 { font-size: 17px; font-weight: 700; margin-bottom: 4px; }
  .meta { color: #555; font-size: 11px; margin-bottom: 20px; }
  .info { display: flex; gap: 48px; margin-bottom: 18px; flex-wrap: wrap; }
  .info-item .lbl { font-size: 10px; color: #777; text-transform: uppercase; letter-spacing: .05em; }
  .info-item .val { font-size: 13px; font-weight: 700; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { background: #f2f2f2; border: 1px solid #ccc; padding: 7px 10px; text-align: center;
       font-size: 10px; text-transform: uppercase; letter-spacing: .04em; white-space: nowrap; }
  td { border: 1px solid #ccc; padding: 6px 10px; vertical-align: middle; }
  td.label { font-weight: 600; white-space: nowrap; }
  td.sub   { color: #666; white-space: nowrap; }
  td.num   { text-align: center; font-family: monospace; white-space: nowrap; }
  td.bold  { font-weight: 700; }
  td.gray  { color: #bbb; text-align: right; }
  td.green-label { color: #166534; }
  td.green-cell  { background: #dcfce7; font-weight: 700; }
  .footer { margin-top: 20px; font-size: 10px; color: #aaa; text-align: right; }
  @media print { body { padding: 16px; } @page { margin: 1.5cm; } }
</style>
</head>
<body>
<h2>Perhitungan Batch Khusus</h2>
<div class="meta">Dicetak: ${new Date().toLocaleString('id-ID')}</div>
<div class="info">
  <div class="info-item"><div class="lbl">Kode Produk</div><div class="val">${product.kode_produk}</div></div>
  <div class="info-item"><div class="lbl">Nama Produk</div><div class="val">${product.nama_produk}</div></div>
  <div class="info-item"><div class="lbl">No. Batch</div><div class="val">${noBatch || '-'}</div></div>
  <div class="info-item"><div class="lbl">Tanggal Pembuatan</div><div class="val">${tglFmt}</div></div>
  <div class="info-item"><div class="lbl">Dibuat oleh</div><div class="val">${createdBy}</div></div>
</div>
<table>
  <thead>
    <tr>
      <th colspan="2">Keterangan</th>
      ${matHeaders}
      <th>Total</th>
    </tr>
  </thead>
  <tbody>
    ${rowQty}
    ${rowTeoritis}
    ${rowSisa}
    ${rowMin}
    ${rowMax}
    ${rowsRendemen}
  </tbody>
</table>
<div class="footer">File: ${filename}</div>
</body>
</html>`

    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.document.title = filename
    win.onload = () => { win.print() }
  }

  // ── Styling ───────────────────────────────────────────────────
  const card = isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'

  const inputBase = cn(
    'w-full px-3 py-2 rounded-lg border text-sm transition-colors outline-none',
    isDark
      ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-brand-green-light'
      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-brand-green'
  )

  const greenInput = cn(
    'w-full px-3 py-2 rounded-lg border-2 text-sm text-right transition-colors outline-none',
    isDark
      ? 'bg-green-900/40 border-green-500 text-green-200 focus:border-green-400 placeholder:text-green-700'
      : 'bg-green-50 border-green-500 text-green-900 focus:border-green-600 placeholder:text-green-300'
  )

  const calcCell = cn(
    'px-3 py-2 rounded text-sm text-right',
    isDark ? 'bg-gray-700/60 text-gray-300' : 'bg-gray-50 text-gray-700'
  )

  const grayCell = cn(
    'px-3 py-2 rounded text-sm text-right',
    isDark ? 'bg-gray-700/30 text-gray-500' : 'bg-gray-100 text-gray-400'
  )

  const th = cn(
    'px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-left',
    isDark ? 'text-gray-400' : 'text-gray-500'
  )

  return (
    <div className={cn('min-h-full p-6', isDark ? 'bg-gray-900' : 'bg-brand-bg')}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-lg bg-brand-green/10">
            <Calculator size={20} className="text-brand-green" />
          </div>
          <h1 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>
            Perhitungan Batch Khusus
          </h1>
          {latestReport && (
            <span className={cn('text-xs ml-2 px-2 py-1 rounded',
              isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700'
            )}>
              Terakhir: {new Date(latestReport.created_at).toLocaleString('id-ID')}
              {latestReport.created_by_name && ` oleh ${latestReport.created_by_name}`}
            </span>
          )}
        </div>
        <p className={cn('text-sm ml-12', isDark ? 'text-gray-400' : 'text-gray-500')}>
          Pilih kode produk, masukkan Input Sisa Minor dan No. Batch, lalu simpan atau export PDF.
        </p>
      </div>

      {/* Pilih Kode Produk */}
      <div className={cn('rounded-xl p-5 mb-5 shadow-sm', card)}>
        <label className={cn('block text-sm font-semibold mb-2', isDark ? 'text-gray-200' : 'text-gray-700')}>
          Kode Produk
        </label>
        <div className="relative max-w-xs">
          <select
            value={selectedKode}
            onChange={e => handleSelectKode(e.target.value)}
            className={cn(inputBase, 'pr-9 appearance-none cursor-pointer', isDark ? 'bg-gray-700' : 'bg-white')}
          >
            <option value="">-- Pilih Kode Produk --</option>
            {productList.map(p => (
              <option key={p.kode_produk} value={p.kode_produk}>
                {p.kode_produk} – {p.nama_produk}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
        </div>
      </div>

      {/* Loading */}
      {loadingProduct && (
        <div className={cn('rounded-xl p-8 text-center shadow-sm', card)}>
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand-green border-t-transparent mb-2" />
          <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>Memuat data produk…</p>
        </div>
      )}

      {/* Tombol Riwayat */}
      {product && !loadingProduct && (
        <div className="mb-4 flex justify-end gap-3">
          <button
            onClick={() => {
              loadHistory()
              setShowHistory(true)
            }}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            )}
          >
            <History size={16} />
            Riwayat Perubahan
            {historyData.length > 0 && (
              <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-brand-green/20 text-brand-green">
                {historyData.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Tabel Perhitungan */}
      {product && !loadingProduct && (
        <>
          <div className={cn('rounded-xl p-5 mb-5 shadow-sm', card)}>
            {/* Info produk */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <span className={cn('text-xs font-medium', isDark ? 'text-gray-400' : 'text-gray-500')}>Kode Produk</span>
                <p className={cn('text-base font-bold mt-0.5', isDark ? 'text-white' : 'text-gray-900')}>{product.kode_produk}</p>
              </div>
              <div>
                <span className={cn('text-xs font-medium', isDark ? 'text-gray-400' : 'text-gray-500')}>Nama Produk</span>
                <p className={cn('text-base font-semibold mt-0.5', isDark ? 'text-white' : 'text-gray-900')}>{product.nama_produk}</p>
              </div>
            </div>

            {/* Tabel */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={cn('border-b', isDark ? 'border-gray-700' : 'border-gray-200')}>
                    <th className={cn(th, 'w-40')}>Keterangan</th>
                    <th className={cn(th, 'w-24')}></th>
                    {product.materials.map(m => (
                      <th key={m.material_index} className={cn(th, 'text-center')}>{m.kode_material}</th>
                    ))}
                    <th className={cn(th, 'text-center')}>Total</th>
                  </tr>
                </thead>
                <tbody>

                  {/* ✅ Qty/sachet - ADMIN SAJA */}
                  {isAdmin && (
                    <tr className={cn('border-b', isDark ? 'border-gray-700/50' : 'border-gray-100')}>
                      <td className={cn('px-3 py-2.5 font-medium text-sm', isDark ? 'text-gray-200' : 'text-gray-700')} colSpan={2}>
                        Qty/sachet
                      </td>
                      {product.materials.map(m => (
                        <td key={m.material_index} className="px-3 py-2">
                          <div className={calcCell}>{fmt(m.qty_per_sachet)}</div>
                        </td>
                      ))}
                      <td className="px-3 py-2">
                        <div className={cn(calcCell, 'font-semibold')}>{fmt(qtyTotal)}</div>
                      </td>
                    </tr>
                  )}

                  {/* ✅ Teoritis Batching - SEMUA USER */}
                  <tr className={cn('border-b', isDark ? 'border-gray-700/50' : 'border-gray-100')}>
                    <td className={cn('px-3 py-2.5 font-medium text-sm', isDark ? 'text-gray-200' : 'text-gray-700')} colSpan={2}>
                      Teoritis Batching
                    </td>
                    {product.materials.map(m => (
                      <td key={m.material_index} className="px-3 py-2">
                        <div className={calcCell}>{fmt(m.teoritis)}</div>
                      </td>
                    ))}
                    <td className="px-3 py-2">
                      <div className={cn(calcCell, 'font-semibold')}>{fmt(teoritisTotal)}</div>
                    </td>
                  </tr>

                  {/* Input Sisa Minor */}
                  <tr className={cn('border-b', isDark ? 'border-gray-700/50' : 'border-gray-100')}>
                    <td className={cn('px-3 py-2.5 font-semibold text-sm', isDark ? 'text-green-400' : 'text-green-700')} colSpan={2}>
                      Input Sisa Minor
                    </td>
                    {product.materials.map((m, i) => (
                      <td key={m.material_index} className="px-3 py-2">
                        {m.material_index === 1 ? (
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="0"
                            value={inputRaw}
                            onChange={e => setInputRaw(e.target.value)}
                            className={greenInput}
                          />
                        ) : (
                          <div className={cn(calcCell, d5 > 0 ? '' : 'opacity-40')}>
                            {d5 > 0 ? fmt(materialValues[i]) : '0.000'}
                          </div>
                        )}
                      </td>
                    ))}
                    <td className="px-3 py-2">
                      <div className={cn(calcCell, 'font-semibold', d5 > 0 ? '' : 'opacity-40')}>
                        {d5 > 0 ? fmt(total) : '0.000'}
                      </div>
                    </td>
                  </tr>

                  {/* Range Min */}
                  <tr className={cn('border-b', isDark ? 'border-gray-700/50' : 'border-gray-100')}>
                    <td className={cn('px-3 py-2.5 font-medium text-sm', isDark ? 'text-gray-200' : 'text-gray-700')} rowSpan={2}>
                      Range Batching
                    </td>
                    <td className={cn('px-3 py-2.5 text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>Min</td>
                    {product.materials.map((m, i) => (
                      <td key={m.material_index} className="px-3 py-2">
                        <div className={cn(calcCell, d5 > 0 ? '' : 'opacity-40')}>
                          {d5 > 0 ? fmt(m.range_min) : fmt(m.range_min)}
                        </div>
                      </td>
                    ))}
                    <td className="px-3 py-2"><div className={grayCell}>—</div></td>
                  </tr>

                  {/* Range Max */}
                  <tr className={cn('border-b', isDark ? 'border-gray-700/50' : 'border-gray-100')}>
                    <td className={cn('px-3 py-2.5 text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>Max</td>
                    {product.materials.map((m, i) => (
                      <td key={m.material_index} className="px-3 py-2">
                        <div className={cn(calcCell, d5 > 0 ? '' : 'opacity-40')}>
                          {d5 > 0 ? fmt(m.range_max) : fmt(m.range_max)}
                        </div>
                      </td>
                    ))}
                    <td className="px-3 py-2"><div className={grayCell}>—</div></td>
                  </tr>

                  {/* Rendemen */}
                  {product.rendemen.map((r, ri) => (
                    <tr key={r.id} className={cn('border-b', isDark ? 'border-gray-700/50' : 'border-gray-100')}>
                      {ri === 0 && (
                        <td
                          className={cn('px-3 py-2.5 font-medium text-sm', isDark ? 'text-gray-200' : 'text-gray-700')}
                          rowSpan={product.rendemen.length}
                        >
                          Rendemen
                        </td>
                      )}
                      <td className={cn('px-3 py-2.5 text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>
                        {(r.persen * 100).toFixed(2)}%
                      </td>
                      {product.materials.map(m => (
                        <td key={m.material_index} className="px-3 py-2">
                          <div className={grayCell}>—</div>
                        </td>
                      ))}
                      <td className="px-3 py-2">
                        <div className={cn(calcCell, d5 > 0 ? 'font-medium' : 'opacity-40')}>
                          {d5 > 0 ? fmt(r.persen * total) : '0.000'}
                        </div>
                      </td>
                    </tr>
                  ))}

                </tbody>
              </table>
            </div>

            {/* Legenda */}
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-green-500" />
                <span className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>Input manual</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={cn('w-3 h-3 rounded-sm', isDark ? 'bg-gray-700' : 'bg-gray-100')} />
                <span className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>Dihitung otomatis</span>
              </div>
            </div>
          </div>

          {/* Form Simpan & Export */}
          <div className={cn('rounded-xl p-5 shadow-sm', card)}>
            <h2 className={cn('text-sm font-semibold mb-4', isDark ? 'text-gray-200' : 'text-gray-700')}>
              Simpan & Export
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className={cn('block text-xs font-medium mb-1.5', isDark ? 'text-gray-400' : 'text-gray-600')}>
                  No. Batch <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={noBatch}
                  onChange={e => setNoBatch(e.target.value)}
                  placeholder="Contoh: BATCH-001"
                  className={inputBase}
                />
              </div>
              {/* ✅ Tanggal - readonly, otomatis hari ini */}
              <div>
                <label className={cn('block text-xs font-medium mb-1.5', isDark ? 'text-gray-400' : 'text-gray-600')}>
                  Tanggal Pembuatan <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={tglPembuatan}
                  disabled
                  className={cn(inputBase, 'opacity-60 cursor-not-allowed')}
                />
                <p className="text-xs text-gray-400 mt-1">✅ Otomatis tanggal hari ini</p>
              </div>
              <div>
                <label className={cn('block text-xs font-medium mb-1.5', isDark ? 'text-gray-400' : 'text-gray-600')}>
                  Bobot Total (F5)
                </label>
                <div className={cn(
                  'px-3 py-2 rounded-lg border text-sm font-semibold',
                  isDark ? 'bg-gray-700/60 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-700'
                )}>
                  {d5 > 0 ? fmt(total) : '—'}
                </div>
              </div>
            </div>

            {saveError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 mb-4">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                <span className="text-sm text-red-600 dark:text-red-400">{saveError}</span>
              </div>
            )}
            {saveSuccess && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30 mb-4">
                <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
                <span className="text-sm text-green-700 dark:text-green-400">Perhitungan berhasil disimpan ke laporan.</span>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleSave}
                disabled={saving || !d5 || !noBatch.trim()}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'bg-brand-green hover:bg-brand-green/90 text-white'
                )}
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Menyimpan…
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Simpan Laporan
                  </>
                )}
              </button>

              <button
                onClick={handleExportPDF}
                disabled={!d5 || !product}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'bg-blue-600 hover:bg-blue-700 text-white'
                )}
              >
                <FileDown size={16} />
                Export PDF
              </button>
            </div>

            <p className={cn('text-xs mt-3 font-mono', isDark ? 'text-gray-500' : 'text-gray-400')}>
              Calculation_Batch_Khusus_{formatDateForFilename(tglPembuatan)}
            </p>
          </div>
        </>
      )}

      {/* History Modal */}
      {showHistory && (
        <HistoryModalBK
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          history={historyData}
          materials={product?.materials || []}
          isDark={isDark}
          onSelectReport={(report: BKReport) => {
            setInputRaw(report.input_sisa_minor?.toString() || '')
            setNoBatch(report.no_batch || '')
            // ✅ Tanggal tetap pakai hari ini
            setLatestReport(report)
            setShowHistory(false)
          }}
          filterNoBatch={filterNoBatch}
          onFilterChange={setFilterNoBatch}
          onRefresh={() => loadHistory()}
        />
      )}
    </div>
  )
}