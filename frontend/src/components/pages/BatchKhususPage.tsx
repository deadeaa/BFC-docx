import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Calculator, Save, ChevronDown, AlertCircle, CheckCircle2, FileDown, History,
  Send, CheckCheck, XCircle, FileCheck, Plus,
} from 'lucide-react'
import api from '../../lib/api'
import { useTheme } from '../../context/ThemeContext'
import { cn } from '../../lib/utils'
import HistoryModalBK from '../../components/HistoryModalBK'
import { useAuth } from '../../context/AuthContext'
import type { User, BKReport, BKReportStatus } from '../../types'
import stampApproved from '../../assets/approve.png'
import stampRejected from '../../assets/reject.png'

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

function fmt(v: number | null | undefined, decimals = 2): string {
  if (v == null || isNaN(v)) return '-'
  const formatted = v.toFixed(decimals)
  return formatted.replace(/\.?0+$/, '')
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatDateForFilename(date: string): string {
  return date.replace(/-/g, '/')
}

function canEditReport(user: User | null, status: BKReportStatus | undefined): boolean {
  if (!user) return false
  const isAdmin = user.role === 'admin'
  const isTS = user.role === 'ts'
  const isSPV = isTS && user.jabatan === 'spv'
  const isMGR = isTS && user.jabatan === 'mgr'
  const isStaff = isTS && user.jabatan === 'staff'
  const isProduksi = user.role === 'produksi'
  const isViewOnly = user.role === 'qa' || user.role === 'ppic'

  if (isMGR) return false
  if (isViewOnly) return false
  if (status === 'waiting_mgr' || status === 'approved') return false
  if (isAdmin) return true
  if (isProduksi) return status === 'draft' || status === 'rejected'
  if (status === 'draft' || status === 'rejected') return isStaff || isSPV
  if (status === 'waiting_spv') return isSPV
  return false
}

function canSubmitReport(user: User | null, status: BKReportStatus | undefined): boolean {
  if (!user) return false
  if (status !== 'draft' && status !== 'rejected') return false
  const isAdmin = user.role === 'admin'
  const isStaff = user.role === 'ts' && user.jabatan === 'staff'
  return isAdmin || isStaff
}

function canApproveSPV(user: User | null, status: BKReportStatus | undefined): boolean {
  if (!user || status !== 'waiting_spv') return false
  return user.role === 'admin' || (user.role === 'ts' && user.jabatan === 'spv')
}

function canApproveMGR(user: User | null, status: BKReportStatus | undefined): boolean {
  if (!user || status !== 'waiting_mgr') return false
  return user.role === 'admin' || (user.role === 'ts' && user.jabatan === 'mgr')
}

function canRejectReport(user: User | null, status: BKReportStatus | undefined): boolean {
  if (!user) return false
  if (status !== 'waiting_spv' && status !== 'waiting_mgr') return false

  const isAdmin = user.role === 'admin'
  const isSPV = user.role === 'ts' && user.jabatan === 'spv'
  const isMGR = user.role === 'ts' && user.jabatan === 'mgr'

  if (isAdmin) return true
  if (isSPV) return status === 'waiting_spv'
  if (isMGR) return status === 'waiting_mgr'
  return false
}

async function imageToDataUrl(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas tidak didukung'))
        return
      }
      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => reject(new Error('Gagal memuat gambar stempel'))
    img.src = src
  })
}

export default function BatchKhususPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { user } = useAuth()
  const [searchParams] = useSearchParams()

  const [productList, setProductList] = useState<ProductOption[]>([])
  const [selectedKode, setSelectedKode] = useState<string>('')
  const [jenisProduk, setJenisProduk] = useState<'ruah' | 'minor' | ''>('')
  const [product, setProduct] = useState<BKProduct | null>(null)
  const [loadingProduct, setLoadingProduct] = useState(false)

  const [inputRaw, setInputRaw] = useState<string>('')
  const [noBatch, setNoBatch] = useState<string>('')
  const [tglPembuatan] = useState(today())
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState('')

  const [savedReport, setSavedReport] = useState<BKReport | null>(null)
  const [dataChanged, setDataChanged] = useState(false)
  const [reportStatus, setReportStatus] = useState<BKReportStatus>('draft')
  const [approvalInfo, setApprovalInfo] = useState<BKReport | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectNote, setRejectNote] = useState('')

  const [latestReport, setLatestReport] = useState<BKReport | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [historyData, setHistoryData] = useState<BKReport[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [filterNoBatch, setFilterNoBatch] = useState<string>('')

  const userIsAdmin = user?.role === 'admin' || user?.role === 'ts'

  useEffect(() => {
    api.get<ProductOption[]>('/batch-khusus/products')
      .then(res => setProductList(res.data))
      .catch(() => {})
  }, [])

  const filteredProducts = productList.filter((p) => {
    const kode = p.kode_produk.toUpperCase()
    if (jenisProduk === 'ruah') return kode.startsWith('P') || kode.startsWith('B')
    if (jenisProduk === 'minor') return kode.startsWith('X')
    return true
  })

  const resetReportState = () => {
    setSavedReport(null)
    setReportStatus('draft')
    setApprovalInfo(null)
    setDataChanged(false)
    setInputRaw('')
    setNoBatch('')
    setSaveError('')
    setSaveSuccess(false)
    setActionError('')
    setActionSuccess('')
  }

  const handleJenisProdukChange = (value: 'ruah' | 'minor' | '') => {
    setJenisProduk(value)
    setSelectedKode('')
    setProduct(null)
    setLatestReport(null)
    resetReportState()
    setFilterNoBatch('')
    setHistoryData([])
  }

  const handleCreateNew = () => {
    setSavedReport(null)
    setApprovalInfo(null)
    setReportStatus('draft')
    setDataChanged(false)
    setInputRaw('')
    setNoBatch('')
    setSaveError('')
    setSaveSuccess(false)
    setActionError('')
    setActionSuccess('')
  }

  const loadHistory = useCallback(async (kode?: string) => {
    const targetKode = kode || selectedKode
    if (!targetKode) return
    setLoadingHistory(true)
    try {
      const res = await api.get<BKReport[]>(`/batch-khusus/reports/product/${targetKode}`, {
        params: { no_batch: filterNoBatch || undefined },
      })
      setHistoryData(res.data || [])
    } catch {
      setHistoryData([])
    } finally {
      setLoadingHistory(false)
    }
  }, [selectedKode, filterNoBatch])

  const handleSelectKode = useCallback(async (kode: string): Promise<void> => {
    setSelectedKode(kode)
    setProduct(null)
    setLatestReport(null)
    resetReportState()
    setFilterNoBatch('')
    setHistoryData([])

    if (!kode) return

    setLoadingProduct(true)
    try {
      const productRes = await api.get<BKProduct>(`/batch-khusus/products/${kode}`)
      setProduct(productRes.data)

      try {
        const reportRes = await api.get<BKReport>(`/batch-khusus/reports/latest/${kode}`)
        if (reportRes.data) {
          setLatestReport(reportRes.data)
          setInputRaw(reportRes.data.input_sisa_minor?.toString() || '')
          setNoBatch(reportRes.data.no_batch || '')
          setSavedReport(reportRes.data)
          setApprovalInfo(reportRes.data)
          setReportStatus(reportRes.data.status ?? 'draft')
          setDataChanged(false)
        }
      } catch {
       
      }

      await loadHistory(kode)
    } catch {
      setSaveError('Gagal memuat data produk. Coba pilih ulang.')
    } finally {
      setLoadingProduct(false)
    }
  }, [loadHistory])

  useEffect(() => {
    const kode = searchParams.get('kode')
    const reportId = searchParams.get('report')
    const noBatchQuery = searchParams.get('no_batch')
    if (!kode) return

    const isMinor = kode.toUpperCase().startsWith('X')
    setJenisProduk(isMinor ? 'minor' : 'ruah')

    handleSelectKode(kode).then(() => {
      if (reportId) {
        api.get<BKReport>(`/batch-khusus/reports/single/${reportId}`)
          .then(res => {
            setInputRaw(res.data.input_sisa_minor?.toString() || '')
            setNoBatch(res.data.no_batch || '')
            setLatestReport(res.data)
            setSavedReport(res.data)
            setApprovalInfo(res.data)
            setReportStatus(res.data.status ?? 'draft')
            setDataChanged(false)
          })
          .catch(() => {})
      } else if (noBatchQuery) {
        api.get<BKReport[]>(`/batch-khusus/reports/product/${kode}`, {
          params: { no_batch: noBatchQuery },
        })
          .then(res => {
            const list = res.data || []
            if (list.length > 0) {
              const rep = list[0]
              setInputRaw(rep.input_sisa_minor?.toString() || '')
              setNoBatch(rep.no_batch || '')
              setLatestReport(rep)
              setSavedReport(rep)
              setApprovalInfo(rep)
              setReportStatus(rep.status ?? 'draft')
              setDataChanged(false)
            }
          })
          .catch(() => {})
      }
    })
    
  }, [searchParams])

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

  function computeRangeValues(): { min: number[]; max: number[] } {
    if (!product || d5 <= 0) {
      return {
        min: product?.materials.map(() => 0) || [],
        max: product?.materials.map(() => 0) || [],
      }
    }
    const minValues = materialValues.map((v, i) => v - product.materials[i].range_min)
    const maxValues = materialValues.map((v, i) => v - product.materials[i].range_max)
    return { min: minValues, max: maxValues }
  }

  const rangeValues = computeRangeValues()

  useEffect(() => {
    if (selectedKode && showHistory) loadHistory(selectedKode)
  }, [filterNoBatch, selectedKode, showHistory, loadHistory])

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
      if (savedReport && (reportStatus === 'draft' || reportStatus === 'rejected')) {
        const res = await api.put<BKReport>(`/batch-khusus/reports/${savedReport.id}`, {
          bobot_total: parseFloat(total.toFixed(4)),
          input_sisa_minor: d5,
        })
        setSavedReport(res.data)
        setApprovalInfo(res.data)
        setReportStatus(res.data.status)
      } else {
        const res = await api.post<BKReport>('/batch-khusus/reports', {
          kode_produk: product.kode_produk,
          no_batch: noBatch.trim(),
          tgl_pembuatan: tglPembuatan,
          bobot_total: parseFloat(total.toFixed(4)),
          input_sisa_minor: d5,
          status: 'draft',
        })
        setSavedReport(res.data)
        setLatestReport(res.data)
        setApprovalInfo(res.data)
        setReportStatus(res.data.status ?? 'draft')
      }
      setSaveSuccess(true)
      setDataChanged(false)
      setTimeout(() => setSaveSuccess(false), 4000)
      await loadHistory()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setSaveError(msg ?? 'Gagal menyimpan. Coba lagi.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmitApproval() {
    if (!savedReport) {
      setActionError('Simpan laporan terlebih dahulu')
      return
    }
    setSubmitting(true)
    setActionError('')
    setActionSuccess('')
    try {
      const res = await api.post<BKReport>(`/batch-khusus/reports/${savedReport.id}/submit`)
      setSavedReport(res.data)
      setApprovalInfo(res.data)
      setReportStatus(res.data.status)
      setDataChanged(false)
      setActionSuccess('Laporan berhasil diajukan ke Supervisor')
      setTimeout(() => setActionSuccess(''), 4000)
      await loadHistory()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setActionError(msg ?? 'Gagal mengajukan approval')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleApprove() {
    if (!savedReport) return
    setSubmitting(true)
    setActionError('')
    setActionSuccess('')
    try {
      const res = await api.post<BKReport>(`/batch-khusus/reports/${savedReport.id}/approve`)
      setSavedReport(res.data)
      setApprovalInfo(res.data)
      setReportStatus(res.data.status)
      setActionSuccess(
        res.data.status === 'approved'
          ? 'Laporan disetujui oleh Manager'
          : 'Laporan disetujui oleh Supervisor, menunggu Manager'
      )
      setTimeout(() => setActionSuccess(''), 4000)
      await loadHistory()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setActionError(msg ?? 'Gagal approve')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReject() {
    if (!savedReport || !rejectNote.trim()) {
      setActionError('Catatan penolakan wajib diisi')
      return
    }
    setSubmitting(true)
    setActionError('')
    setActionSuccess('')
    try {
      const res = await api.post<BKReport>(`/batch-khusus/reports/${savedReport.id}/reject`, {
        reject_note: rejectNote.trim(),
      })
      setSavedReport(res.data)
      setApprovalInfo(res.data)
      setReportStatus(res.data.status)
      setShowRejectModal(false)
      setRejectNote('')
      setActionSuccess('Laporan ditolak, dikembalikan ke Staff')
      setTimeout(() => setActionSuccess(''), 4000)
      await loadHistory()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setActionError(msg ?? 'Gagal reject')
    } finally {
      setSubmitting(false)
    }
  }

  const isExportable =
    !!product &&
    d5 > 0 &&
    !!savedReport &&
    savedReport.no_batch === noBatch.trim() &&
    !dataChanged

  async function handleExportPDF() {
    if (!product || d5 <= 0) return
    if (!savedReport || savedReport.no_batch !== noBatch.trim()) {
      setSaveError('⚠️ Simpan laporan terlebih dahulu sebelum export PDF')
      return
    }
    if (dataChanged) {
      setSaveError('⚠️ Data telah diubah. Simpan ulang sebelum export PDF')
      return
    }

    const createdBy = user?.full_name || user?.username || 'User'
    const dateStr = formatDateForFilename(tglPembuatan)
    const filename = `Calculation_Batch_Khusus_${dateStr}`

    let approvedB64 = ''
    let rejectedB64 = ''
    try {
      approvedB64 = await imageToDataUrl(stampApproved)
      rejectedB64 = await imageToDataUrl(stampRejected)
    } catch {
      
    }

    const matHeaders = product.materials
      .map(m => `<th>${m.kode_material}</th>`).join('')

    let rowQty = ''
    if (userIsAdmin) {
      rowQty = `
      <tr>
        <td colspan="2" class="label">Qty/sachet</td>
        ${product.materials.map(m => `<td class="num">${fmt(m.qty_per_sachet)}</td>`).join('')}
        <td class="num bold">${fmt(qtyTotal)}</td>
      </tr>`
    }

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
        ${rangeValues.min.map(v => `<td class="num">${fmt(v)}</td>`).join('')}
        <td class="num gray">—</td>
      </tr>`

    const rowMax = `
      <tr>
        <td class="sub">Max</td>
        ${rangeValues.max.map(v => `<td class="num">${fmt(v)}</td>`).join('')}
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

    const stampParts: string[] = []

    if (approvalInfo?.spv_name && approvedB64) {
      stampParts.push(`
        <div style="display:inline-block; text-align:center; margin-right:32px; vertical-align:top;">
          <img src="${approvedB64}" alt="Approved SPV"
               style="width:120px; height:120px; object-fit:contain; transform:rotate(-30deg);" />
          <div style="margin-top:6px; font-size:12px; font-weight:700; color:#166534;">${approvalInfo.spv_name}</div>
          <div style="font-size:10px; color:#666;">Supervisor (SPV)</div>
          ${approvalInfo.spv_approved_at ? `<div style="font-size:10px; color:#888;">${new Date(approvalInfo.spv_approved_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>` : ''}
        </div>
      `)
    }

    if (approvalInfo?.mgr_name && approvedB64) {
      stampParts.push(`
        <div style="display:inline-block; text-align:center; margin-right:32px; vertical-align:top;">
          <img src="${approvedB64}" alt="Approved MGR"
               style="width:120px; height:120px; object-fit:contain; transform:rotate(-30deg);" />
          <div style="margin-top:6px; font-size:12px; font-weight:700; color:#166534;">${approvalInfo.mgr_name}</div>
          <div style="font-size:10px; color:#666;">Manager (MGR)</div>
          ${approvalInfo.mgr_approved_at ? `<div style="font-size:10px; color:#888;">${new Date(approvalInfo.mgr_approved_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>` : ''}
        </div>
      `)
    }

    if (approvalInfo?.status === 'rejected' && rejectedB64) {
      const rejectorRole = approvalInfo.spv_name ? 'Manager (MGR)' : 'Supervisor (SPV)'
      stampParts.push(`
        <div style="display:inline-block; text-align:center; margin-right:32px; vertical-align:top;">
          <img src="${rejectedB64}" alt="Rejected"
               style="width:120px; height:120px; object-fit:contain; transform:rotate(-30deg);" />
          <div style="margin-top:6px; font-size:12px; font-weight:700; color:#dc2626;">${approvalInfo.rejected_by_name || '-'}</div>
          <div style="font-size:10px; color:#666;">${rejectorRole}</div>
          ${approvalInfo.rejected_at ? `<div style="font-size:10px; color:#888;">${new Date(approvalInfo.rejected_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>` : ''}
          ${approvalInfo.reject_note ? `<div style="font-size:10px; font-style:italic; color:#b91c1c; margin-top:4px; max-width:180px;">"${approvalInfo.reject_note}"</div>` : ''}
        </div>
      `)
    }

    const approvalStamp = stampParts.length > 0 ? `
      <div style="margin-top:24px; padding:12px; border:1px solid #ccc; border-radius:6px;">
        <div style="font-size:11px; text-transform:uppercase; color:#666; margin-bottom:12px; letter-spacing:.05em;">Stempel Approval</div>
        <div style="display:flex; flex-wrap:wrap; gap:24px;">
          ${stampParts.join('')}
        </div>
      </div>` : ''

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
${approvalStamp}
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
    'px-3 py-2 rounded text-sm text-right font-mono',
    isDark ? 'bg-gray-700/60 text-gray-300' : 'bg-gray-50 text-gray-700'
  )

  const grayCell = cn(
    'px-3 py-2 rounded text-sm text-right font-mono',
    isDark ? 'bg-gray-700/30 text-gray-500' : 'bg-gray-100 text-gray-400'
  )

  const th = cn(
    'px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-left',
    isDark ? 'text-gray-400' : 'text-gray-500'
  )

  const editable = canEditReport(user, reportStatus)
  const canCreateNew =
    user?.role === 'admin' ||
    (user?.role === 'ts' && user?.jabatan === 'staff') ||
    user?.role === 'produksi'

  const isMGRWaitingSPV =
    user?.role === 'ts' && user.jabatan === 'mgr' && reportStatus === 'waiting_spv'

  return (
    <div className={cn('min-h-full p-6', isDark ? 'bg-gray-900' : 'bg-brand-bg')}>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1 flex-wrap">
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
          Pilih jenis produk, pilih kode produk, masukkan Input Sisa Minor dan No. Batch
        </p>

        {(user?.role === 'qa' || user?.role === 'ppic') && (
          <div className={cn('rounded-lg p-3 mt-3 border flex items-center gap-2',
            isDark ? 'bg-amber-900/20 border-amber-700 text-amber-300' : 'bg-amber-50 border-amber-300 text-amber-800'
          )}>
            <AlertCircle size={16} className="flex-shrink-0" />
            <span className="text-xs">
              Role <b>{user.role.toUpperCase()}</b> hanya dapat melihat perhitungan Batch Khusus. Tidak dapat menghitung, menyimpan, atau membuat perhitungan baru.
            </span>
          </div>
        )}

        {isMGRWaitingSPV && (
          <div className={cn('rounded-lg p-3 mt-3 border flex items-center gap-2',
            isDark ? 'bg-blue-900/20 border-blue-700 text-blue-300' : 'bg-blue-50 border-blue-300 text-blue-800'
          )}>
            <AlertCircle size={16} className="flex-shrink-0" />
            <span className="text-xs">
              Perhitungan ini <b>masih dalam review Supervisor (SPV)</b>. Tombol Approve dan Reject sebagai Manager baru aktif setelah SPV menyetujui.
            </span>
          </div>
        )}
      </div>

      <div className={cn('rounded-xl p-5 mb-5 shadow-sm', card)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={cn('block text-sm font-semibold mb-2', isDark ? 'text-gray-200' : 'text-gray-700')}>
              Jenis Produk
            </label>
            <div className="relative">
              <select
                value={jenisProduk}
                onChange={(e) => handleJenisProdukChange(e.target.value as 'ruah' | 'minor' | '')}
                className={cn(inputBase, 'pr-9 appearance-none cursor-pointer', isDark ? 'bg-gray-700' : 'bg-white')}
              >
                <option value="">-- Pilih Jenis Produk --</option>
                <option value="ruah">Produk Ruah</option>
                <option value="minor">Produk Minor</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {jenisProduk === 'ruah' && '📦 Produk ruah: PEBJ3, PEBJ4, PBSJ1, dll'}
              {jenisProduk === 'minor' && '🧪 Produk minor: XEBJ3, XEBJ4, XBSJ1, dll'}
              {!jenisProduk && 'Pilih jenis produk terlebih dahulu'}
            </p>
          </div>

          <div>
            <label className={cn('block text-sm font-semibold mb-2', isDark ? 'text-gray-200' : 'text-gray-700')}>
              Kode Produk
            </label>
            <div className="relative">
              <select
                value={selectedKode}
                onChange={e => handleSelectKode(e.target.value)}
                disabled={!jenisProduk}
                className={cn(
                  inputBase,
                  'pr-9 appearance-none cursor-pointer',
                  isDark ? 'bg-gray-700' : 'bg-white',
                  !jenisProduk && 'opacity-50 cursor-not-allowed'
                )}
              >
                <option value="">-- Pilih Kode Produk --</option>
                {filteredProducts.map(p => (
                  <option key={p.kode_produk} value={p.kode_produk}>
                    {p.kode_produk} – {p.nama_produk}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {!jenisProduk
                ? 'Akan aktif setelah memilih jenis produk'
                : filteredProducts.length === 0
                ? `⚠️ Tidak ada produk ${jenisProduk} tersedia`
                : `${filteredProducts.length} produk tersedia`}
            </p>
          </div>
        </div>
      </div>

      {loadingProduct && (
        <div className={cn('rounded-xl p-8 text-center shadow-sm', card)}>
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand-green border-t-transparent mb-2" />
          <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>Memuat data produk…</p>
        </div>
      )}

      {product && !loadingProduct && (
        <div className="mb-4 flex justify-between gap-3 flex-wrap">
          {canCreateNew ? (
            <button
              onClick={handleCreateNew}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                'bg-brand-green hover:bg-brand-green/90 text-white'
              )}
            >
              <Plus size={16} />
              Buat Perhitungan Baru
            </button>
          ) : (
            <div />
          )}
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

      {product && !loadingProduct && (
        <>
          <div className={cn('rounded-xl p-5 mb-5 shadow-sm', card)}>
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
                  {userIsAdmin && (
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
                            disabled={!editable}
                            onChange={e => {
                              setInputRaw(e.target.value)
                              setDataChanged(true)
                            }}
                            className={cn(greenInput, !editable && 'opacity-60 cursor-not-allowed')}
                          />
                        ) : (
                          <div className={cn(calcCell, d5 > 0 ? '' : 'opacity-40')}>
                            {d5 > 0 ? fmt(materialValues[i]) : '0'}
                          </div>
                        )}
                      </td>
                    ))}
                    <td className="px-3 py-2">
                      <div className={cn(calcCell, 'font-semibold', d5 > 0 ? '' : 'opacity-40')}>
                        {d5 > 0 ? fmt(total) : '0'}
                      </div>
                    </td>
                  </tr>

                  <tr className={cn('border-b', isDark ? 'border-gray-700/50' : 'border-gray-100')}>
                    <td className={cn('px-3 py-2.5 font-medium text-sm', isDark ? 'text-gray-200' : 'text-gray-700')} rowSpan={2}>
                      Range Batching
                    </td>
                    <td className={cn('px-3 py-2.5 text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>Min</td>
                    {rangeValues.min.map((v, i) => (
                      <td key={i} className="px-3 py-2">
                        <div className={cn(calcCell, d5 > 0 ? '' : 'opacity-40')}>
                          {d5 > 0 ? fmt(v) : '0'}
                        </div>
                      </td>
                    ))}
                    <td className="px-3 py-2"><div className={grayCell}>—</div></td>
                  </tr>

                  <tr className={cn('border-b', isDark ? 'border-gray-700/50' : 'border-gray-100')}>
                    <td className={cn('px-3 py-2.5 text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>Max</td>
                    {rangeValues.max.map((v, i) => (
                      <td key={i} className="px-3 py-2">
                        <div className={cn(calcCell, d5 > 0 ? '' : 'opacity-40')}>
                          {d5 > 0 ? fmt(v) : '0'}
                        </div>
                      </td>
                    ))}
                    <td className="px-3 py-2"><div className={grayCell}>—</div></td>
                  </tr>

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
                      {product.materials.map(() => (
                        <td key={r.id} className="px-3 py-2">
                          <div className={grayCell}>—</div>
                        </td>
                      ))}
                      <td className="px-3 py-2">
                        <div className={cn(calcCell, d5 > 0 ? 'font-medium' : 'opacity-40')}>
                          {d5 > 0 ? fmt(r.persen * total) : '0'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {approvalInfo && approvalInfo.status !== 'draft' && (
            <div className={cn('rounded-xl p-5 mb-5 shadow-sm', card)}>
              <h3 className={cn('text-sm font-semibold mb-3 flex items-center gap-2',
                isDark ? 'text-gray-200' : 'text-gray-700')}>
                <FileCheck size={16} className="text-brand-green" />
                Status &amp; Stempel Approval
              </h3>

              <div className="mb-4">
                {approvalInfo.status === 'approved' && (
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 font-semibold">
                    <CheckCheck size={12} /> Disetujui
                  </span>
                )}
                {approvalInfo.status === 'waiting_mgr' && (
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 font-semibold">
                    ⏳ Menunggu Manager
                  </span>
                )}
                {approvalInfo.status === 'waiting_spv' && (
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 font-semibold">
                    ⏳ Menunggu SPV
                  </span>
                )}
                {approvalInfo.status === 'rejected' && (
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 font-semibold">
                    <XCircle size={12} /> Ditolak
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-12 items-start">
                {approvalInfo.spv_name && (
                  <div className="flex flex-col items-center text-center">
                    <img
                      src={stampApproved}
                      alt="Approved SPV"
                      className="w-32 h-32 object-contain mb-2 -rotate-[30deg]"
                    />
                    <p className={cn('text-sm font-semibold', isDark ? 'text-green-300' : 'text-green-800')}>
                      {approvalInfo.spv_name}
                    </p>
                    <p className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>
                      Supervisor (SPV)
                    </p>
                    {approvalInfo.spv_approved_at && (
                      <p className={cn('text-[11px] mt-0.5', isDark ? 'text-gray-500' : 'text-gray-400')}>
                        {new Date(approvalInfo.spv_approved_at).toLocaleString('id-ID', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                )}

                {approvalInfo.mgr_name && (
                  <div className="flex flex-col items-center text-center">
                    <img
                      src={stampApproved}
                      alt="Approved MGR"
                      className="w-32 h-32 object-contain mb-2 -rotate-[30deg]"
                    />
                    <p className={cn('text-sm font-semibold', isDark ? 'text-green-300' : 'text-green-800')}>
                      {approvalInfo.mgr_name}
                    </p>
                    <p className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>
                      Manager (MGR)
                    </p>
                    {approvalInfo.mgr_approved_at && (
                      <p className={cn('text-[11px] mt-0.5', isDark ? 'text-gray-500' : 'text-gray-400')}>
                        {new Date(approvalInfo.mgr_approved_at).toLocaleString('id-ID', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                )}

                {approvalInfo.status === 'rejected' && (
                  <div className="flex flex-col items-center text-center">
                    <img
                      src={stampRejected}
                      alt="Rejected"
                      className="w-32 h-32 object-contain mb-2 -rotate-[30deg]"
                    />
                    <p className={cn('text-sm font-semibold', isDark ? 'text-red-300' : 'text-red-800')}>
                      {approvalInfo.rejected_by_name || '-'}
                    </p>
                    <p className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>
                      {approvalInfo.spv_name ? 'Manager (MGR)' : 'Supervisor (SPV)'}
                    </p>
                    {approvalInfo.rejected_at && (
                      <p className={cn('text-[11px] mt-0.5', isDark ? 'text-gray-500' : 'text-gray-400')}>
                        {new Date(approvalInfo.rejected_at).toLocaleString('id-ID', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    )}
                    {approvalInfo.reject_note && (
                      <p className={cn('text-[11px] mt-1 italic max-w-[200px]', isDark ? 'text-red-300' : 'text-red-600')}>
                        "{approvalInfo.reject_note}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className={cn('rounded-xl p-5 shadow-sm', card)}>
            <h2 className={cn('text-sm font-semibold mb-4', isDark ? 'text-gray-200' : 'text-gray-700')}>
              Simpan &amp; Export
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className={cn('block text-xs font-medium mb-1.5', isDark ? 'text-gray-400' : 'text-gray-600')}>
                  No. Batch <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={noBatch}
                  disabled={!editable}
                  onChange={e => {
                    setNoBatch(e.target.value)
                    setDataChanged(true)
                  }}
                  placeholder="Contoh: BATCH-001"
                  className={cn(inputBase, !editable && 'opacity-60 cursor-not-allowed')}
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
                <p className="text-xs text-gray-400 mt-1">Otomatis tanggal hari ini</p>
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
                <span className="text-sm text-green-700 dark:text-green-400">Perhitungan berhasil disimpan.</span>
              </div>
            )}
            {actionError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 mb-4">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                <span className="text-sm text-red-600 dark:text-red-400">{actionError}</span>
              </div>
            )}
            {actionSuccess && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30 mb-4">
                <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
                <span className="text-sm text-green-700 dark:text-green-400">{actionSuccess}</span>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleSave}
                disabled={saving || !d5 || !noBatch.trim() || !editable}
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

              {canSubmitReport(user, reportStatus) && (
                <button
                  onClick={handleSubmitApproval}
                  disabled={submitting || !savedReport || dataChanged || !editable}
                  title={dataChanged ? 'Simpan perubahan terlebih dahulu' : 'Ajukan ke Supervisor'}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Send size={16} />
                  Ajukan Approval ke SPV
                </button>
              )}

              {canApproveSPV(user, reportStatus) && (
                <button
                  onClick={handleApprove}
                  disabled={submitting || dataChanged}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 transition-all"
                >
                  <CheckCheck size={16} />
                  Approve sebagai SPV
                </button>
              )}

              {canApproveMGR(user, reportStatus) && (
                <button
                  onClick={handleApprove}
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 transition-all"
                >
                  <CheckCheck size={16} />
                  Approve sebagai Manager
                </button>
              )}

              {canRejectReport(user, reportStatus) && (
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 transition-all"
                >
                  <XCircle size={16} />
                  Reject
                </button>
              )}

              <button
                onClick={handleExportPDF}
                disabled={!isExportable}
                title={!isExportable ? '⚠️ Simpan laporan terlebih dahulu sebelum export PDF' : 'Export PDF'}
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

            {!editable && (
              <p className="text-xs text-gray-400 mt-3">
                🔒 Perhitungan pada status ini tidak dapat diedit.
              </p>
            )}

            {d5 > 0 && (!savedReport || dataChanged) && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-3">
                ⚠️ {dataChanged
                  ? 'Data telah diubah. Simpan ulang sebelum export PDF'
                  : 'Simpan laporan terlebih dahulu untuk mengaktifkan tombol Export PDF'}
              </p>
            )}

            <p className={cn('text-xs mt-3 font-mono', isDark ? 'text-gray-500' : 'text-gray-400')}>
              Calculation_Batch_Khusus_{formatDateForFilename(tglPembuatan)}
            </p>
          </div>
        </>
      )}

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
            setLatestReport(report)
            setSavedReport(report)
            setApprovalInfo(report)
            setReportStatus(report.status ?? 'draft')
            setDataChanged(false)
            setShowHistory(false)
          }}
          filterNoBatch={filterNoBatch}
          onFilterChange={setFilterNoBatch}
          onRefresh={() => loadHistory()}
        />
      )}

      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className={cn('w-full max-w-md rounded-2xl shadow-2xl border p-6',
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200')}>
            <h3 className={cn('font-bold text-lg mb-2', isDark ? 'text-white' : 'text-gray-800')}>
              Tolak Perhitungan?
            </h3>
            <p className={cn('text-sm mb-4', isDark ? 'text-gray-400' : 'text-gray-500')}>
              Berikan catatan alasan penolakan agar Staff dapat memperbaiki.
            </p>
            <textarea
              value={rejectNote}
              onChange={e => setRejectNote(e.target.value)}
              rows={4}
              placeholder="Contoh: Perhitungan tidak sesuai dengan standar batch"
              className={inputBase}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setShowRejectModal(false); setRejectNote('') }}
                className={cn('flex-1 py-2.5 rounded-xl border text-sm font-medium',
                  isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50')}
              >
                Batal
              </button>
              <button
                onClick={handleReject}
                disabled={submitting || !rejectNote.trim()}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium disabled:opacity-50"
              >
                {submitting ? 'Memproses…' : 'Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}