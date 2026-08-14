import { useState, useEffect, useCallback } from 'react'
import { Calculator, Save, ChevronDown, AlertCircle, CheckCircle2, FileDown, History } from 'lucide-react'
import api from '../../lib/api'
import { useTheme } from '../../context/ThemeContext'
import { cn } from '../../lib/utils'
import HistoryModal from '../../components/HistoryModal'
import { useAuth } from '../../context/AuthContext'

// ── Types ────────────────────────────────────────────────────

interface BOMaterial {
  id: number
  material_index: number
  kode_material: string
  label: string
  target_kg: number
}

interface BOThreshold {
  id: number
  criteria_index: number
  target_index: number
  min_ratio: number
  max_ratio: number
}

interface BOProduct {
  id: number
  kode_produk: string
  nama_produk: string
  materials: BOMaterial[]
  thresholds: BOThreshold[]
}

interface ProductOption {
  id: number
  kode_produk: string
  nama_produk: string
}

interface CriteriaResult {
  materialIndex: number
  label: string
  status: 'MS' | 'TMS'
  pivotValue: number
  checks: { 
    targetIndex: number
    minRatio: number
    maxRatio: number
    actualRatio: number
    passed: boolean
  }[]
}

interface ReportDetail {
  materials: Array<{
    kode_material: string
    label: string
    target_kg: number
    hasil_batching: number
    perbandingan: number
    ratio: number
    target_baru: number
    tambahan_reproses: number
  }>
  bobot_total: number
  nilai_tertinggi: number
  kriteria: CriteriaResult[]
  kesimpulan: 'MS' | 'TMS'
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

// ── Helpers ──────────────────────────────────────────────────

const EPS = 1e-9

// ✅ Format angka - hilangkan angka 0 di belakang
function fmt(v: number | null | undefined): string {
  if (v == null || isNaN(v)) return '-'
  return parseFloat(v.toFixed(5)).toString()
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatDateForFilename(date: string): string {
  return date.replace(/-/g, '/')
}

function materialHeader(m: BOMaterial): string {
  if (m.label.toLowerCase() === 'minor') return m.kode_material
  return `${m.kode_material} (${m.label})`
}

function findPivotIndex(ratioValues: number[]): number {
  if (ratioValues.length === 0) return -1
  let maxIdx = 0
  let maxVal = ratioValues[0]
  for (let i = 1; i < ratioValues.length; i++) {
    if (ratioValues[i] > maxVal) {
      maxVal = ratioValues[i]
      maxIdx = i
    }
  }
  return maxIdx
}

// ── Helpers ──────────────────────────────────────────────────

function calculateCriteria(
  materials: BOMaterial[],
  ratio: (number | null)[],
  thresholds: BOThreshold[],
  allFilled: boolean
): CriteriaResult[] {
  if (!allFilled || ratio.some(r => r == null)) {
    return materials.map((m, i) => ({
      materialIndex: i,
      label: m.label,
      status: 'TMS' as const,
      pivotValue: 0,
      checks: []
    }))
  }

  const ratioVals = ratio as number[]
  const pivotIdx = findPivotIndex(ratioVals)
  const pivotValue = ratioVals[pivotIdx]

  return materials.map((m, i) => {
    const isPivot = i === pivotIdx
    
    if (!isPivot) {
      // ❌ Non-pivot otomatis TMS
      return {
        materialIndex: i,
        label: m.label,
        status: 'TMS' as const,
        pivotValue: 0,
        checks: []
      }
    }
    
    // ✅ PIVOT: cek semua threshold
    const checks: { targetIndex: number, minRatio: number, maxRatio: number, actualRatio: number, passed: boolean }[] = []
    let allPassed = true
    
    // Cek semua material target untuk pivot ini
    materials.forEach((targetMat, j) => {
      if (i === j) {
        // Pivot terhadap dirinya sendiri: harus 1
        const passed = Math.abs(ratioVals[i] - 1) < EPS
        if (!passed) allPassed = false
        
        checks.push({
          targetIndex: i,
          minRatio: 1,
          maxRatio: 1,
          actualRatio: ratioVals[i],
          passed
        })
      } else {
        // Cari threshold untuk pivot (i) terhadap target (j)
        const th = thresholds.find(t => t.criteria_index === i && t.target_index === j)
        
        if (th) {
          const passed = ratioVals[j] >= th.min_ratio - EPS && ratioVals[j] <= th.max_ratio + EPS
          if (!passed) allPassed = false
          
          checks.push({
            targetIndex: j,
            minRatio: th.min_ratio,
            maxRatio: th.max_ratio,
            actualRatio: ratioVals[j],
            passed
          })
        } else {
          // Tidak ada threshold, dianggap passed
          checks.push({
            targetIndex: j,
            minRatio: 0,
            maxRatio: 0,
            actualRatio: ratioVals[j],
            passed: true
          })
        }
      }
    })
    
    // ✅ Status pivot: MS jika semua syarat terpenuhi
    const status = allPassed ? 'MS' : 'TMS'
    
    return {
      materialIndex: i,
      label: m.label,
      status,
      pivotValue: isPivot ? pivotValue : 0,
      checks
    }
  })
}

// ── Main Component ───────────────────────────────────────────

export default function BatchOverfilledPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { user } = useAuth()

  const [productList, setProductList] = useState<ProductOption[]>([])
  const [selectedKode, setSelectedKode] = useState<string>('')
  const [product, setProduct] = useState<BOProduct | null>(null)
  const [loadingProduct, setLoadingProduct] = useState(false)
  const [loadingLatest, setLoadingLatest] = useState(false)

  const [latestReport, setLatestReport] = useState<BOReport | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [historyData, setHistoryData] = useState<BOReport[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [filterNoBatch, setFilterNoBatch] = useState<string>('')

  const [inputRaws, setInputRaws] = useState<string[]>([])
  const [bobotTotalRaw, setBobotTotalRaw] = useState<string>('')
  const [noBatch, setNoBatch] = useState<string>('')
  const [tglPembuatan] = useState(today())
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState('')

  // Load product list
  useEffect(() => {
    api.get<ProductOption[]>('/batch-overfilled/products')
      .then(res => setProductList(res.data))
      .catch(() => {})
  }, [])

  const materials = product?.materials ?? []
  const thresholds = product?.thresholds ?? []
  const directCount = Math.max(materials.length - 1, 0)
  const lastIndex = materials.length - 1

  function isInputFilled(i: number): boolean {
    const raw = inputRaws[i]
    return raw !== undefined && raw !== '' && !isNaN(parseFloat(raw))
  }

  const isBobotTotalFilled = bobotTotalRaw !== '' && !isNaN(parseFloat(bobotTotalRaw))

  const allInputsFilled =
    materials.length > 0 &&
    inputRaws.length === directCount &&
    Array.from({ length: directCount }, (_, i) => i).every(isInputFilled) &&
    isBobotTotalFilled

  const allFilled = allInputsFilled
  const bobotTotal: number | null = isBobotTotalFilled ? parseFloat(bobotTotalRaw) : null

  const hasilBatching: (number | null)[] = materials.map((_, i) => {
    if (i < directCount) {
      return isInputFilled(i) ? (parseFloat(inputRaws[i]) || 0) : null
    }
    if (!allInputsFilled || bobotTotal == null) return null
    const sumDirect = inputRaws.reduce((s, raw) => s + (parseFloat(raw) || 0), 0)
    const result = bobotTotal - sumDirect
    return result >= 0 ? result : null
  })

  const perbandingan = materials.map((m, i) => {
    const a = hasilBatching[i]
    if (a == null || !m.target_kg) return null
    return a / m.target_kg
  })

  const perbandinganLengkap = perbandingan.every(v => v != null)
  const nilaiTertinggi: number | null = perbandinganLengkap && perbandingan.length
    ? Math.max(...(perbandingan as number[]))
    : null

  const ratio = perbandingan.map(c => (c != null && nilaiTertinggi ? c / nilaiTertinggi : null))

  const criteriaResults = calculateCriteria(materials, ratio, thresholds, allFilled)
  
  const pivotIndex = allFilled && ratio.some(r => r != null) 
    ? findPivotIndex(ratio as number[]) 
    : -1
  
  // ✅ Kesimpulan: MS jika semua material MS, TMS jika ada yang TMS
const pivotResult = criteriaResults.find(c => c.pivotValue > 0) // cari pivot
const kesimpulan: 'MS' | 'TMS' = pivotResult?.status === 'MS' ? 'MS' : 'TMS'
  const targetBaru = materials.map(m => (nilaiTertinggi != null ? m.target_kg * nilaiTertinggi : null))
  const tambahanReproses = targetBaru.map((f, i) => (f != null && hasilBatching[i] != null ? f - (hasilBatching[i] as number) : null))

  // ── Load History ─────────────────────────────────────────────
  const loadHistory = useCallback(async (kode?: string) => {
    const targetKode = kode || selectedKode
    if (!targetKode) {
      console.warn('⚠️ No kode selected for history')
      return
    }
    
    setLoadingHistory(true)
    try {
      const params: { no_batch?: string; limit?: string } = {
        limit: '100'
      }
      
      const currentFilter = filterNoBatch?.trim() || ''
      if (currentFilter && currentFilter !== '' && currentFilter !== 'all' && currentFilter !== 'undefined') {
        params.no_batch = currentFilter
      }
      
      console.log(`📡 Fetching history for: ${targetKode}`, params)
      
      const res = await api.get<BOReport[]>(`/batch-overfilled/reports/product/${targetKode}`, {
        params
      })
      
      console.log(`✅ History loaded: ${res.data?.length || 0} items`)
      
      if (params.no_batch) {
        console.log(`📊 Filtered by batch: ${params.no_batch}`)
        console.log(`📊 Found ${res.data?.length || 0} records`)
      }
      
      setHistoryData(res.data || [])
    } catch (err: any) {
      console.error('❌ Gagal load history:', err.response?.data || err.message)
      setHistoryData([])
    } finally {
      setLoadingHistory(false)
    }
  }, [selectedKode, filterNoBatch])

  // ── ✅ AUTO-REFRESH HISTORY WHEN FILTER CHANGES ──────────────
  useEffect(() => {
    if (selectedKode && showHistory) {
      console.log('🔄 Auto-refresh history due to filter change:', filterNoBatch || 'all')
      loadHistory(selectedKode)
    }
  }, [filterNoBatch, selectedKode, showHistory, loadHistory])

  // ── Handle select product ────────────────────────────────────
  const handleSelectKode = useCallback(async (kode: string) => {
    setSelectedKode(kode)
    setProduct(null)
    setLatestReport(null)
    setInputRaws([])
    setBobotTotalRaw('')
    setNoBatch('')
    setSaveSuccess(false)
    setSaveError('')
    setFilterNoBatch('')
    setHistoryData([])
    
    if (!kode) return
    
    setLoadingProduct(true)
    setLoadingLatest(true)
    
    try {
      const productRes = await api.get<BOProduct>(`/batch-overfilled/products/${kode}`)
      const safeProduct: BOProduct = {
        ...productRes.data,
        materials: productRes.data.materials ?? [],
        thresholds: productRes.data.thresholds ?? [],
      }
      setProduct(safeProduct)
      
      const directCount = Math.max(safeProduct.materials.length - 1, 0)
      setInputRaws(new Array(directCount).fill(''))
      
      // Load latest report
      try {
        const reportRes = await api.get<BOReport>(`/batch-overfilled/reports/latest/${kode}`)
        if (reportRes.data && reportRes.data.detail_json) {
          const detail: ReportDetail = JSON.parse(reportRes.data.detail_json)
          setLatestReport(reportRes.data)
          
          if (detail.materials) {
            const lastInputs = detail.materials.slice(0, directCount).map((m: any) => 
              m.hasil_batching?.toString() || ''
            )
            setInputRaws(lastInputs)
            setBobotTotalRaw(reportRes.data.bobot_total?.toString() || '')
            setNoBatch(reportRes.data.no_batch || '')
            // setTglPembuatan(reportRes.data.tgl_pembuatan || today())
          }
        }
      } catch (err) {
        console.log('ℹ️ No latest report found for:', kode)
        setInputRaws(new Array(directCount).fill(''))
        setBobotTotalRaw('')
        setNoBatch('')
      }
      
      // Load history
      await loadHistory(kode)
      
    } catch (err) {
      console.error('❌ Gagal memuat data produk:', err)
      setSaveError('Gagal memuat data produk. Coba pilih ulang.')
    } finally {
      setLoadingProduct(false)
      setLoadingLatest(false)
    }
  }, [loadHistory])

  // ── Save ──────────────────────────────────────────────────────
  async function handleSave() {
    if (!product || !tglPembuatan) {
      setSaveError('Lengkapi Tanggal Pembuatan sebelum menyimpan.')
      return
    }
    if (!allFilled || nilaiTertinggi == null || bobotTotal == null) {
      setSaveError('Lengkapi seluruh input (termasuk Bobot Total) terlebih dahulu.')
      return
    }
    if (!noBatch.trim()) {
      setSaveError('Isi No. Batch terlebih dahulu.')
      return
    }
    
    if (hasilBatching.some(h => h != null && h < 0)) {
      setSaveError('Hasil Batching komponen terakhir tidak boleh negatif. Periksa Bobot Total.')
      return
    }
    
    setSaving(true)
    setSaveError('')
    setSaveSuccess(false)
    
    try {
      const payload = {
        kode_produk: product.kode_produk,
        no_batch: noBatch.trim(),
        tgl_pembuatan: tglPembuatan,
        bobot_total: bobotTotal,
        kesimpulan: kesimpulan,
        detail: {
          materials: materials.map((m, i) => ({
            kode_material: m.kode_material,
            label: m.label,
            target_kg: m.target_kg,
            hasil_batching: parseFloat((hasilBatching[i] ?? 0).toFixed(5)),
            perbandingan: parseFloat((perbandingan[i] ?? 0).toFixed(5)),
            ratio: parseFloat((ratio[i] ?? 0).toFixed(5)),
            target_baru: parseFloat((targetBaru[i] ?? 0).toFixed(5)),
            tambahan_reproses: parseFloat((tambahanReproses[i] ?? 0).toFixed(5)),
          })),
          bobot_total: parseFloat(bobotTotal.toFixed(5)),
          nilai_tertinggi: parseFloat((nilaiTertinggi ?? 0).toFixed(5)),
          kriteria: criteriaResults.map(cr => ({
            materialIndex: cr.materialIndex,
            label: cr.label,
            status: cr.status,
            pivotValue: cr.pivotValue,
            checks: cr.checks
          })),
          kesimpulan: kesimpulan,
        },
      }

      const response = await api.post<BOReport>('/batch-overfilled/reports', payload)
      
      setLatestReport(response.data)
      setHistoryData(prev => [response.data, ...prev])
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 4000)
      
    } catch (err: any) {
      console.error('❌ Save error:', err.response?.data)
      setSaveError(err.response?.data?.message || 'Gagal menyimpan. Coba lagi.')
    } finally {
      setSaving(false)
    }
  }

  // ── Export PDF ──────────────────────────────────────────────
  function handleExportPDF() {
    if (!product || !allFilled || nilaiTertinggi == null || bobotTotal == null) return
    
    const createdBy = user?.full_name || user?.username || 'User'
    const dateStr = formatDateForFilename(tglPembuatan)
    const filename = `Calculation_Batch_Overfilled_${dateStr}`

    const matHeaders = materials.map(m => `<th>${materialHeader(m)}</th>`).join('')

    // ✅ Format angka - hilangkan trailing zeros
    const getValue = (val: number | null | undefined): string => {
      if (val == null || isNaN(val)) return '-'
      return parseFloat(val.toFixed(5)).toString()
    }

    // ✅ Row "ISI DI BARIS INI" - komponen terakhir harus terisi (hasil otomatis)
    const rowIsiDiBarisIni = `
      <tr>
        <td colspan="2" class="label green-label">Hasil Batching </td>
        ${materials.map((_, i) => {
          if (i < directCount) {
            // Input manual
            return `<td class="num green-cell">${getValue(parseFloat(inputRaws[i]))}</td>`
          } else {
            // Komponen terakhir - hasil otomatis (bobot total - sum)
            return `<td class="num green-cell">${getValue(hasilBatching[i])}</td>`
          }
        }).join('')}
      </tr>
      <tr>
        <td colspan="2" class="label bold">Bobot Total </td>
        <td class="num bold green-cell" colspan="${materials.length}">${getValue(bobotTotal)}</td>
      </tr>`

    const rowHasil = `
      <tr>
        <td colspan="2" class="label">A &ndash; Hasil Batching</td>
        ${hasilBatching.map(v => `<td class="num">${getValue(v)}</td>`).join('')}
      </tr>`

    const rowTarget = `
      <tr>
        <td colspan="2" class="label">B &ndash; Target (Kg)</td>
        ${materials.map(m => `<td class="num">${getValue(m.target_kg)}</td>`).join('')}
      </tr>`

    const rowPerbandingan = `
      <tr>
        <td colspan="2" class="label">C &ndash; Perbandingan(i) (A/B)</td>
        ${perbandingan.map(v => `<td class="num">${getValue(v)}</td>`).join('')}
      </tr>`

    // ✅ Nilai Tertinggi - center
    const rowNilaiTertinggi = `
      <tr>
        <td colspan="2" class="label">D &ndash; Pilih Nilai (C) Tertinggi(i)</td>
        <td class="num bold" colspan="${materials.length}" style="text-align:center;">${getValue(nilaiTertinggi)}</td>
      </tr>`

    const rowRatio = `
      <tr>
        <td colspan="2" class="label">E &ndash; Ratio(i) (C/D)</td>
        ${ratio.map(v => `<td class="num">${getValue(v)}</td>`).join('')}
      </tr>`

    // ✅ SYARAT - tanpa bintang
    const syaratRows = materials.map((rowMat, i) => {
      const cr = criteriaResults[i]
      const isPivot = i === pivotIndex
      
      const checkCells = materials.map((_, j) => {
        if (i === j) {
          return `<td class="num">1</td>`
        }
        const th = thresholds.find(t => t.criteria_index === i && t.target_index === j)
        if (th) {
          const minVal = parseFloat(th.min_ratio.toFixed(5)).toString()
          const maxVal = parseFloat(th.max_ratio.toFixed(5)).toString()
          return `<td class="num">${minVal} - ${maxVal}</td>`
        }
        return `<td class="num text-gray-400">-</td>`
      }).join('')
      
      const statusColor = cr.status === 'MS' ? 'text-green-500' : 'text-red-500'
      
      return `
        <tr>
          <td colspan="2" class="label">Overfilled ${rowMat.label}${isPivot ? '' : ''} <span class="${statusColor}">(${cr.status})</span></td>
          ${checkCells}
        </tr>
      `
    }).join('')

    // ✅ Kesimpulan - full width
    const rowKesimpulan = `
      <tr>
        <td colspan="2" class="label bold">Kesimpulan</td>
        <td class="num bold" colspan="${materials.length}" style="font-size:14px;font-weight:700;text-align:center;">${kesimpulan}</td>
      </tr>`

    const rowTargetBaru = `
      <tr>
        <td colspan="2" class="label">F &ndash; Target Baru Jika Ratio Tidak Masuk Syarat (B×D)</td>
        ${targetBaru.map(v => `<td class="num">${getValue(v)}</td>`).join('')}
      </tr>`

    const rowTambahan = `
      <tr>
        <td colspan="2" class="label">G &ndash; Tambahan Untuk Reproses (F-A)</td>
        ${tambahanReproses.map(v => `<td class="num">${getValue(v)}</td>`).join('')}
      </tr>`

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
  td.num { text-align: center; font-family: monospace; white-space: nowrap; }
  td.bold { font-weight: 700; }
  td.green-label { color: #166534; }
  td.green-cell { background: #dcfce7; font-weight: 700; }
  td.text-green-500 { color: #22c55e; }
  td.text-red-500 { color: #ef4444; }
  td.text-gray-400 { color: #9ca3af; }
  .footer { margin-top: 20px; font-size: 10px; color: #aaa; text-align: right; }
  @media print { body { padding: 16px; } @page { margin: 1.5cm; } }
</style>
</head>
<body>
<h2>Perhitungan Batch Overfilled</h2>
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
    </tr>
  </thead>
  <tbody>
    ${rowIsiDiBarisIni}
    ${rowHasil}
    ${rowTarget}
    ${rowPerbandingan}
    ${rowNilaiTertinggi}
    ${rowRatio}
    <tr>
      <td colspan="2" class="label" style="background:#f9f9f9;font-weight:700;">Syarat</td>
      ${materials.map(() => `<td></td>`).join('')}
    </tr>
    ${syaratRows}
    ${rowKesimpulan}
    ${rowTargetBaru}
    ${rowTambahan}
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

  const th = cn(
    'px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-left',
    isDark ? 'text-gray-400' : 'text-gray-500'
  )

  const codeBadge = cn(
    'inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold mr-2 flex-shrink-0',
    isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
  )

  const badge = (status: 'MS' | 'TMS') => cn(
    'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold',
    status === 'MS'
      ? (isDark ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700')
      : (isDark ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-700')
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
            Perhitungan Batch Overfilled
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
          Pilih kode produk, isi No. Batch, lalu isi nilai di bagian berwarna hijau
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
              console.log('📊 Opening history modal...')
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

            {/* "ISI DI BARIS INI" */}
            <div className="overflow-x-auto mb-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className={cn('border-b', isDark ? 'border-gray-700' : 'border-gray-200')}>
                    {materials.slice(0, directCount).map((m) => (
                      <th key={m.material_index} className={cn(th, 'text-center')}>
                        {materialHeader(m)}
                      </th>
                    ))}
                    <th className={cn(th, 'text-center')}>Bobot Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {materials.slice(0, directCount).map((m, i) => (
                      <td key={m.material_index} className="px-3 py-2">
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="0"
                          value={inputRaws[i] ?? ''}
                          onChange={e => setInputRaws(prev => prev.map((v, idx) => idx === i ? e.target.value : v))}
                          className={greenInput}
                        />
                      </td>
                    ))}
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0"
                        value={bobotTotalRaw}
                        onChange={e => setBobotTotalRaw(e.target.value)}
                        className={greenInput}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Tabel utama */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={cn('border-b', isDark ? 'border-gray-700' : 'border-gray-200')}>
                    <th className={cn(th, 'w-56')}>Keterangan</th>
                    {materials.map(m => (
                      <th key={m.material_index} className={cn(th, 'text-center')}>{materialHeader(m)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className={cn('border-b', isDark ? 'border-gray-700/50' : 'border-gray-100')}>
                    <td className={cn('px-3 py-2.5 font-medium text-sm flex items-center', isDark ? 'text-gray-200' : 'text-gray-700')}>
                      <span className={codeBadge}>A</span>Hasil Batching
                    </td>
                    {materials.map((m, i) => (
                      <td key={m.material_index} className="px-3 py-2">
                        <div className={cn(calcCell, hasilBatching[i] != null ? '' : 'opacity-40', i === lastIndex ? 'font-semibold' : '')}>
                          {fmt(hasilBatching[i])}
                        </div>
                      </td>
                    ))}
                  </tr>

                  <tr className={cn('border-b', isDark ? 'border-gray-700/50' : 'border-gray-100')}>
                    <td className={cn('px-3 py-2.5 font-medium text-sm flex items-center', isDark ? 'text-gray-200' : 'text-gray-700')}>
                      <span className={codeBadge}>B</span>Target (Kg)
                    </td>
                    {materials.map(m => (
                      <td key={m.material_index} className="px-3 py-2">
                        <div className={calcCell}>{fmt(m.target_kg)}</div>
                      </td>
                    ))}
                  </tr>

                  <tr className={cn('border-b', isDark ? 'border-gray-700/50' : 'border-gray-100')}>
                    <td className={cn('px-3 py-2.5 text-sm flex items-center', isDark ? 'text-gray-400' : 'text-gray-500')}>
                      <span className={codeBadge}>C</span>Perbandingan(i)
                    </td>
                    {materials.map((m, i) => (
                      <td key={m.material_index} className="px-3 py-2">
                        <div className={cn(calcCell, perbandingan[i] != null ? '' : 'opacity-40')}>
                          {fmt(perbandingan[i])}
                        </div>
                      </td>
                    ))}
                  </tr>

                  <tr className={cn('border-b', isDark ? 'border-gray-700/50' : 'border-gray-100')}>
                    <td className={cn('px-3 py-2.5 text-sm flex items-center', isDark ? 'text-gray-400' : 'text-gray-500')}>
                      <span className={codeBadge}>D</span>Pilih Nilai Tertinggi(i)
                    </td>
                    <td className="px-3 py-2" colSpan={materials.length}>
                      <div className={cn(calcCell, 'font-semibold text-center')}>
                        {fmt(nilaiTertinggi)}
                      </div>
                    </td>
                  </tr>

                  <tr className={cn('border-b', isDark ? 'border-gray-700/50' : 'border-gray-100')}>
                    <td className={cn('px-3 py-2.5 text-sm flex items-center', isDark ? 'text-gray-400' : 'text-gray-500')}>
                      <span className={codeBadge}>E</span>Ratio(i)
                    </td>
                    {materials.map((m, i) => (
                      <td key={m.material_index} className="px-3 py-2">
                        <div className={cn(calcCell, ratio[i] != null ? '' : 'opacity-40')}>
                          {fmt(ratio[i])}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* ✅ SYARAT - Range min-max */}
                  <tr className={cn('border-b', isDark ? 'border-gray-700/50' : 'border-gray-100')}>
                    <td colSpan={materials.length + 1} className="px-3 pt-4 pb-1">
                      <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                        Syarat
                        {allFilled && ratio.some(r => r != null) && pivotIndex >= 0 && (
                          <span className="ml-2 text-yellow-600 dark:text-yellow-400">
                            (Pivot: {materials[pivotIndex]?.label || '-'})
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* ✅ Tabel Syarat - Range dengan MS/TMS yang benar */}
                  {allFilled && materials.map((rowMat, i) => {
                    const cr = criteriaResults[i]
                    const isPivot = i === pivotIndex
                    
                    return (
                      <tr key={i} className={cn('border-b', isDark ? 'border-gray-700/50' : 'border-gray-100')}>
                        <td className={cn('px-3 py-2.5 text-sm whitespace-nowrap min-w-[180px]', isDark ? 'text-gray-300' : 'text-gray-600')}>
                          <span>Overfilled {rowMat.label}{isPivot ? ' ⭐' : ''}</span>
                          <span className={cn('ml-2 text-xs font-bold', cr.status === 'MS' ? 'text-green-500' : 'text-red-500')}>
                            ({cr.status})
                          </span>
                        </td>
                        {materials.map((_, j) => {
                          if (i === j) {
                            return (
                              <td key={j} className="px-3 py-2 text-center text-gray-400 whitespace-nowrap">
                                1
                              </td>
                            )
                          }
                          const th = thresholds.find(t => t.criteria_index === i && t.target_index === j)
                          if (th) {
                            const minVal = parseFloat(th.min_ratio.toFixed(5)).toString()
                            const maxVal = parseFloat(th.max_ratio.toFixed(5)).toString()
                            return (
                              <td key={j} className="px-3 py-2 text-center whitespace-nowrap">
                                <span className="text-gray-600 dark:text-gray-400">
                                  {minVal} - {maxVal}
                                </span>
                              </td>
                            )
                          }
                          return (
                            <td key={j} className="px-3 py-2 text-center text-gray-400 whitespace-nowrap">
                              -
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}

                  {/* ✅ Kesimpulan - full width */}
                  <tr className={cn('border-b', isDark ? 'border-gray-700/50' : 'border-gray-100')}>
                    <td className={cn('px-3 py-2.5 text-sm font-semibold', isDark ? 'text-gray-200' : 'text-gray-700')}>
                      Kesimpulan
                    </td>
                    <td className="px-3 py-2" colSpan={materials.length}>
                      <div className={cn(
                        'text-center font-bold text-base py-1 px-4 rounded-lg',
                        allFilled 
                          ? kesimpulan === 'MS' 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                          : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                      )}>
                        {allFilled ? kesimpulan : '—'}
                      </div>
                    </td>
                  </tr>

                  <tr className={cn('border-b', isDark ? 'border-gray-700/50' : 'border-gray-100')}>
                    <td className={cn('px-3 py-2.5 text-sm flex items-center', isDark ? 'text-gray-400' : 'text-gray-500')}>
                      <span className={codeBadge}>F</span>Target Baru (B×D)
                    </td>
                    {materials.map((m, i) => (
                      <td key={m.material_index} className="px-3 py-2">
                        <div className={cn(calcCell, targetBaru[i] != null ? '' : 'opacity-40')}>
                          {fmt(targetBaru[i])}
                        </div>
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className={cn('px-3 py-2.5 text-sm flex items-center', isDark ? 'text-gray-400' : 'text-gray-500')}>
                      <span className={codeBadge}>G</span>Tambahan Reproses (F-A)
                    </td>
                    {materials.map((m, i) => (
                      <td key={m.material_index} className="px-3 py-2">
                        <div className={cn(calcCell, tambahanReproses[i] != null ? '' : 'opacity-40')}>
                          {fmt(tambahanReproses[i])}
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-green-500" />
                <span className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>Input manual</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={cn('w-3 h-3 rounded-sm', isDark ? 'bg-gray-700' : 'bg-gray-100')} />
                <span className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>Dihitung otomatis</span>
              </div>
            </div> */}
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
                  Bobot Total (Kg)
                </label>
                <div className={cn(inputBase, 'font-semibold text-right', bobotTotal != null ? '' : 'opacity-40')}>
                  {fmt(bobotTotal)}
                </div>
              </div>
            </div>

            {saveError && product && (
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
                disabled={saving || !allFilled || !tglPembuatan || !noBatch.trim()}
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
                disabled={!allFilled || !product}
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
              Calculation_Batch_Overfilled_{formatDateForFilename(tglPembuatan)}
            </p>
          </div>
        </>
      )}

      {/* History Modal */}
      {showHistory && (
        <HistoryModal
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          history={historyData}
          materials={materials}
          isDark={isDark}
          onSelectReport={(report: BOReport) => {
            if (report.detail_json) {
              try {
                const detail: ReportDetail = JSON.parse(report.detail_json)
                const directCount = Math.max(materials.length - 1, 0)
                const inputs = detail.materials.slice(0, directCount).map((m: any) => 
                  m.hasil_batching?.toString() || ''
                )
                setInputRaws(inputs)
                setBobotTotalRaw(report.bobot_total?.toString() || '')
                setNoBatch(report.no_batch || '')
                // setTglPembuatan(report.tgl_pembuatan || today())
                setLatestReport(report)
                setShowHistory(false)
              } catch (e) {
                console.error('Error parsing report detail:', e)
              }
            }
          }}
          filterNoBatch={filterNoBatch}
          onFilterChange={(value: string) => {
            console.log('📊 Filter changed to:', value)
            setFilterNoBatch(value)
          }}
          onRefresh={() => {
            console.log('🔄 Refreshing history...')
            loadHistory()
          }}
        />
      )}
    </div>
  )
}