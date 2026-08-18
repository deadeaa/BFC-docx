// frontend/src/components/pages/admin/AdminBatchKhususPage.tsx
import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, X, Save, AlertCircle, CheckCircle2 } from 'lucide-react'
import api from '../../lib/api'
import { useTheme } from '../../context/ThemeContext'
import { cn } from '../../lib/utils'

interface AdminBKMaterial {
  id?: number
  product_id?: number
  material_index: number
  kode_material: string
  qty_per_sachet: number
  teoritis: number
  range_min: number
  range_max: number
}

interface AdminBKRendemen {
  id?: number
  product_id?: number
  sort_order: number
  persen: number
}

interface AdminBKProduct {
  id?: number
  kode_produk: string
  nama_produk: string
  materials: AdminBKMaterial[]
  rendemen: AdminBKRendemen[]
}

const emptyMaterial = (): AdminBKMaterial => ({
  material_index: 0,
  kode_material: '',
  qty_per_sachet: 0,
  teoritis: 0,
  range_min: 0,
  range_max: 0,
})

const emptyRendemen = (): AdminBKRendemen => ({
  sort_order: 0,
  persen: 0,
})

const emptyProduct = (): AdminBKProduct => ({
  kode_produk: '',
  nama_produk: '',
  materials: [],
  rendemen: [],
})

// ── Helper untuk generate default material name ──────────────

function getDefaultMaterialName(index: number, kodeProduk: string): string {
  switch (index) {
    case 0:
      return '2AS006000J'
    case 1:
      if (kodeProduk && kodeProduk.length > 0) {
        return 'X' + kodeProduk.slice(1)
      }
      return ''
    case 2:
      return '2AC006000J'
    case 3:
      return '2AS012000J'
    default:
      return ''
  }
}

export default function AdminBatchKhususPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [products, setProducts] = useState<AdminBKProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<AdminBKProduct>(emptyProduct())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)

  // Display values
  const [displayValues, setDisplayValues] = useState<{
    materials: { qty_per_sachet: string; teoritis: string; range_min: string; range_max: string }[]
    rendemen: { persen: string }[]
  }>({
    materials: [],
    rendemen: []
  })

  // Sync display values
  useEffect(() => {
    setDisplayValues({
      materials: formData.materials.map(m => ({
        qty_per_sachet: m.qty_per_sachet.toString(),
        teoritis: m.teoritis.toString(),
        range_min: m.range_min.toString(),
        range_max: m.range_max.toString(),
      })),
      rendemen: formData.rendemen.map(r => ({
        persen: (r.persen * 100).toFixed(2).toString(),
      })),
    })
  }, [formData.materials, formData.rendemen])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get<AdminBKProduct[]>('/admin/bk/products')
      setProducts(data || [])
    } catch {
      setError('Gagal memuat data produk')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const openCreateModal = () => {
    setIsEditing(false)
    setFormData(emptyProduct())
    setError('')
    setIsModalOpen(true)
  }

  const openEditModal = (product: AdminBKProduct) => {
    setIsEditing(true)
    const clonedProduct = {
      ...product,
      materials: product.materials ? product.materials.map(m => ({ ...m })) : [],
      rendemen: product.rendemen ? product.rendemen.map(r => ({ ...r })) : [],
    }
    setFormData(clonedProduct)
    setError('')
    setIsModalOpen(true)
  }

  // Auto-generate rendemen berdasarkan jumlah material (default 0)
  const generateRendemen = (materialsCount: number): AdminBKRendemen[] => {
    if (materialsCount < 1) return []
    
    const rendemen: AdminBKRendemen[] = []
    for (let i = 0; i < materialsCount; i++) {
      rendemen.push({
        sort_order: i,
        persen: 0,
      })
    }
    return rendemen
  }

  // ── Material Handlers ──────────────────────────────────────

  const addMaterial = () => {
    const lastIndex = formData.materials.length
    const defaultName = getDefaultMaterialName(lastIndex, formData.kode_produk)
    
    const newMaterials = [...formData.materials, { 
      ...emptyMaterial(), 
      material_index: lastIndex,
      kode_material: defaultName,
    }]
    
    const newRendemen = generateRendemen(newMaterials.length)
    
    setFormData({
      ...formData,
      materials: newMaterials,
      rendemen: newRendemen,
    })
  }

  const handleKodeProdukChange = (newKode: string) => {
    const upperKode = newKode.toUpperCase()
    setFormData({ ...formData, kode_produk: upperKode })
    
    // Update material index 1 jika ada
    const materialIndex1 = formData.materials.findIndex(m => m.material_index === 1)
    if (materialIndex1 !== -1) {
      const currentMaterial = formData.materials[materialIndex1]
      const defaultName = getDefaultMaterialName(1, upperKode)
      
      if (!currentMaterial.kode_material || 
          currentMaterial.kode_material.startsWith('X') ||
          currentMaterial.kode_material === getDefaultMaterialName(1, formData.kode_produk)) {
        const newMaterials = [...formData.materials]
        newMaterials[materialIndex1] = { 
          ...newMaterials[materialIndex1], 
          kode_material: defaultName 
        }
        setFormData(prev => ({ ...prev, materials: newMaterials }))
      }
    }
  }

  const removeMaterial = (index: number) => {
    const newMaterials = formData.materials.filter((_, i) => i !== index)
    newMaterials.forEach((m, i) => m.material_index = i)
    
    const newRendemen = generateRendemen(newMaterials.length)
    
    setFormData({
      ...formData,
      materials: newMaterials,
      rendemen: newRendemen,
    })
  }

  const updateMaterialDisplay = (index: number, field: 'qty_per_sachet' | 'teoritis' | 'range_min' | 'range_max', value: string) => {
    const newDisplay = { ...displayValues }
    newDisplay.materials[index] = { ...newDisplay.materials[index], [field]: value }
    setDisplayValues(newDisplay)
  }

  const handleMaterialBlur = (index: number, field: 'qty_per_sachet' | 'teoritis' | 'range_min' | 'range_max') => {
    const displayVal = displayValues.materials[index]?.[field] || '0'
    
    let cleanVal = displayVal.replace(/,/g, '.')
    cleanVal = cleanVal.replace(/[^0-9.-]/g, '')
    
    const parts = cleanVal.split('.')
    if (parts.length > 2) {
      cleanVal = parts[0] + '.' + parts.slice(1).join('')
    }
    
    const minusCount = (cleanVal.match(/-/g) || []).length
    if (minusCount > 1) {
      cleanVal = cleanVal.replace(/-/g, '')
    }
    if (cleanVal.includes('-') && !cleanVal.startsWith('-')) {
      cleanVal = cleanVal.replace(/-/g, '')
    }
    
    const numValue = parseFloat(cleanVal)
    if (!isNaN(numValue) && cleanVal !== '' && cleanVal !== '.' && cleanVal !== '-') {
      const roundedValue = parseFloat(numValue.toFixed(4))
      const newMaterials = [...formData.materials]
      newMaterials[index] = { ...newMaterials[index], [field]: roundedValue }
      setFormData({ ...formData, materials: newMaterials })
      
      const newDisplay = { ...displayValues }
      newDisplay.materials[index] = { ...newDisplay.materials[index], [field]: roundedValue.toString() }
      setDisplayValues(newDisplay)
    } else if (cleanVal === '' || cleanVal === '.' || cleanVal === '-') {
      const newMaterials = [...formData.materials]
      newMaterials[index] = { ...newMaterials[index], [field]: 0 }
      setFormData({ ...formData, materials: newMaterials })
      
      const newDisplay = { ...displayValues }
      newDisplay.materials[index] = { ...newDisplay.materials[index], [field]: '0' }
      setDisplayValues(newDisplay)
    }
  }

  const updateMaterialText = (index: number, field: 'kode_material', value: string) => {
    const newMaterials = [...formData.materials]
    newMaterials[index] = { ...newMaterials[index], [field]: value }
    setFormData({ ...formData, materials: newMaterials })
  }

  // ── Rendemen Handlers ──────────────────────────────────────

  const addRendemen = () => {
    const lastOrder = formData.rendemen.length
    setFormData({
      ...formData,
      rendemen: [...formData.rendemen, { ...emptyRendemen(), sort_order: lastOrder }],
    })
  }

  const removeRendemen = (index: number) => {
    const newRendemen = formData.rendemen.filter((_, i) => i !== index)
    newRendemen.forEach((r, i) => r.sort_order = i)
    setFormData({ ...formData, rendemen: newRendemen })
  }

  const updateRendemenDisplay = (index: number, value: string) => {
    const newDisplay = { ...displayValues }
    newDisplay.rendemen[index] = { ...newDisplay.rendemen[index], persen: value }
    setDisplayValues(newDisplay)
  }

  const handleRendemenBlur = (index: number) => {
    const displayVal = displayValues.rendemen[index]?.persen || '0'
    
    let cleanVal = displayVal.replace(/,/g, '.')
    cleanVal = cleanVal.replace(/[^0-9.-]/g, '')
    
    const parts = cleanVal.split('.')
    if (parts.length > 2) {
      cleanVal = parts[0] + '.' + parts.slice(1).join('')
    }
    
    const numValue = parseFloat(cleanVal)
    if (!isNaN(numValue) && cleanVal !== '' && cleanVal !== '.' && cleanVal !== '-') {
      const decimalValue = parseFloat((numValue / 100).toFixed(4))
      const newRendemen = [...formData.rendemen]
      newRendemen[index] = { ...newRendemen[index], persen: decimalValue }
      setFormData({ ...formData, rendemen: newRendemen })
      
      const newDisplay = { ...displayValues }
      newDisplay.rendemen[index] = { persen: (decimalValue * 100).toFixed(4).toString() }
      setDisplayValues(newDisplay)
    } else if (cleanVal === '' || cleanVal === '.' || cleanVal === '-') {
      const newRendemen = [...formData.rendemen]
      newRendemen[index] = { ...newRendemen[index], persen: 0 }
      setFormData({ ...formData, rendemen: newRendemen })
      
      const newDisplay = { ...displayValues }
      newDisplay.rendemen[index] = { persen: '0' }
      setDisplayValues(newDisplay)
    }
  }

  const handleSave = async () => {
    if (!formData.kode_produk.trim() || !formData.nama_produk.trim()) {
      setError('Kode produk dan nama produk wajib diisi')
      return
    }

    if (formData.materials.length === 0) {
      setError('Minimal 1 material harus ditambahkan')
      return
    }

    setSaving(true)
    setError('')
    try {
      if (isEditing && formData.id) {
        await api.put(`/admin/bk/products/${formData.id}`, formData)
        setSuccess('Produk berhasil diperbarui')
      } else {
        await api.post('/admin/bk/products', formData)
        setSuccess('Produk berhasil ditambahkan')
      }
      setIsModalOpen(false)
      fetchProducts()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan produk')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await api.delete(`/admin/bk/products/${deleteTarget}`)
      setDeleteTarget(null)
      fetchProducts()
      setSuccess('Produk berhasil dihapus')
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setError('Gagal menghapus produk')
    }
  }

  // ── Styling ───────────────────────────────────────────────────

  const card = isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
  const inputBase = cn(
    'w-full px-3 py-2 rounded-lg border text-sm transition-colors outline-none',
    isDark
      ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-brand-green-light'
      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-brand-green'
  )

  return (
    <div className={cn('min-h-full p-6', isDark ? 'bg-gray-900' : 'bg-brand-bg')}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>
            Admin - Batch Khusus
          </h1>
          <p className={cn('text-sm mt-0.5', isDark ? 'text-gray-400' : 'text-gray-500')}>
            Kelola produk, material (Qty/sachet, Teoritis), dan rendemen
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-green hover:bg-brand-green/90 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Tambah Produk
        </button>
      </div>

      {/* Success/Error */}
      {success && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30 mb-4">
          <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
          <span className="text-sm text-green-700 dark:text-green-400">{success}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 mb-4">
          <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
          <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
        </div>
      )}

      {/* Product List */}
      <div className={cn('rounded-xl shadow-sm overflow-hidden', card)}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-green border-t-transparent" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>
              Belum ada produk Batch Khusus. Klik "Tambah Produk" untuk mulai.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={cn('border-b', isDark ? 'border-gray-700' : 'border-gray-200')}>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Kode Produk</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Nama Produk</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">Materials</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">Rendemen</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className={cn('border-b', isDark ? 'border-gray-700/50' : 'border-gray-100')}>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-block px-2 py-0.5 rounded text-xs font-semibold',
                        isDark ? 'bg-brand-green/20 text-brand-green-light' : 'bg-brand-green/10 text-brand-green'
                      )}>
                        {p.kode_produk}
                      </span>
                    </td>
                    <td className={cn('px-4 py-3 text-sm', isDark ? 'text-gray-300' : 'text-gray-700')}>
                      {p.nama_produk}
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs', isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700')}>
                        {p.materials?.length || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs', isDark ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700')}>
                        {p.rendemen?.length || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditModal(p)} className={cn('p-1.5 rounded-lg transition-colors', isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100')}>
                          <Pencil size={14} className={isDark ? 'text-gray-400' : 'text-gray-600'} />
                        </button>
                        <button onClick={() => setDeleteTarget(p.id!)} className={cn('p-1.5 rounded-lg transition-colors', isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100')}>
                          <Trash2 size={14} className="text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={cn('w-full max-w-5xl max-h-[90vh] rounded-xl shadow-2xl overflow-hidden', card)}>
            <div className={cn('flex items-center justify-between p-4 border-b', isDark ? 'border-gray-700' : 'border-gray-200')}>
              <h2 className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-gray-900')}>
                {isEditing ? 'Edit Produk Batch Khusus' : 'Tambah Produk Batch Khusus'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className={cn('p-1.5 rounded-lg transition-colors', isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100')}>
                <X size={20} className={isDark ? 'text-gray-400' : 'text-gray-600'} />
              </button>
            </div>

            <div className="overflow-y-auto p-4 space-y-4" style={{ maxHeight: 'calc(90vh - 80px)' }}>
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={cn('block text-xs font-medium mb-1.5', isDark ? 'text-gray-400' : 'text-gray-600')}>
                    Kode Produk <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.kode_produk}
                    onChange={(e) => handleKodeProdukChange(e.target.value)}
                    className={inputBase}
                    placeholder="Contoh: PEBJ3"
                    disabled={isEditing}
                  />
                  {isEditing && (
                    <p className="text-xs text-gray-400 mt-1">Kode produk tidak dapat diubah</p>
                  )}
                </div>
                <div>
                  <label className={cn('block text-xs font-medium mb-1.5', isDark ? 'text-gray-400' : 'text-gray-600')}>
                    Nama Produk <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nama_produk}
                    onChange={(e) => setFormData({ ...formData, nama_produk: e.target.value })}
                    className={inputBase}
                    placeholder="Nama produk"
                  />
                </div>
              </div>

              {/* Materials */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={cn('text-sm font-semibold', isDark ? 'text-gray-200' : 'text-gray-700')}>
                    Materials <span className="text-red-500">*</span>
                    <span className="text-xs font-normal text-gray-400 ml-2">
                      ({formData.materials.length} material)
                    </span>
                  </label>
                  <button
                    onClick={addMaterial}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-green/10 text-brand-green hover:bg-brand-green/20 transition-colors"
                  >
                    <Plus size={14} /> Tambah Material
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={cn('border-b', isDark ? 'border-gray-700' : 'border-gray-200')}>
                        <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider" style={{ width: '40px' }}>#</th>
                        <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider" style={{ width: '20%' }}>Kode Material</th>
                        <th className="px-2 py-2 text-right text-xs font-semibold uppercase tracking-wider" style={{ width: '15%' }}>Qty/sachet</th>
                        <th className="px-2 py-2 text-right text-xs font-semibold uppercase tracking-wider" style={{ width: '15%' }}>Teoritis</th>
                        <th className="px-2 py-2 text-right text-xs font-semibold uppercase tracking-wider" style={{ width: '15%' }}>Range Min</th>
                        <th className="px-2 py-2 text-right text-xs font-semibold uppercase tracking-wider" style={{ width: '15%' }}>Range Max</th>
                        <th className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wider" style={{ width: '50px' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.materials.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-4 text-gray-400 text-sm">
                            Belum ada material. Klik "Tambah Material"
                          </td>
                        </tr>
                      ) : (
                        formData.materials.map((m, i) => (
                          <tr key={i} className={cn('border-b', isDark ? 'border-gray-700/50' : 'border-gray-100')}>
                            <td className="px-2 py-2 text-xs text-center">{i + 1}</td>
                            <td className="px-2 py-2">
                              <input
                                type="text"
                                value={m.kode_material}
                                onChange={(e) => updateMaterialText(i, 'kode_material', e.target.value)}
                                className={cn(inputBase, 'w-full')}
                                placeholder={i < 4 ? getDefaultMaterialName(i, formData.kode_produk) : 'Kosong'}
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={displayValues.materials[i]?.qty_per_sachet || '0'}
                                onChange={(e) => updateMaterialDisplay(i, 'qty_per_sachet', e.target.value)}
                                onBlur={() => handleMaterialBlur(i, 'qty_per_sachet')}
                                className={cn(inputBase, 'w-full text-right')}
                                placeholder="0"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={displayValues.materials[i]?.teoritis || '0'}
                                onChange={(e) => updateMaterialDisplay(i, 'teoritis', e.target.value)}
                                onBlur={() => handleMaterialBlur(i, 'teoritis')}
                                className={cn(inputBase, 'w-full text-right')}
                                placeholder="0"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={displayValues.materials[i]?.range_min || '0'}
                                onChange={(e) => updateMaterialDisplay(i, 'range_min', e.target.value)}
                                onBlur={() => handleMaterialBlur(i, 'range_min')}
                                className={cn(inputBase, 'w-full text-right')}
                                placeholder="0"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={displayValues.materials[i]?.range_max || '0'}
                                onChange={(e) => updateMaterialDisplay(i, 'range_max', e.target.value)}
                                onBlur={() => handleMaterialBlur(i, 'range_max')}
                                className={cn(inputBase, 'w-full text-right')}
                                placeholder="0"
                              />
                            </td>
                            <td className="px-2 py-2 text-center">
                              <button
                                onClick={() => removeMaterial(i)}
                                className="text-red-500 hover:text-red-700 transition-colors p-1"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Rendemen */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={cn('text-sm font-semibold', isDark ? 'text-gray-200' : 'text-gray-700')}>
                    Rendemen
                    <span className="text-xs font-normal text-gray-400 ml-2">
                      ({formData.rendemen.length})
                    </span>
                  </label>
                  <button
                    onClick={addRendemen}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-green/10 text-brand-green hover:bg-brand-green/20 transition-colors"
                  >
                    <Plus size={14} /> Tambah
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={cn('border-b', isDark ? 'border-gray-700' : 'border-gray-200')}>
                        <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider" style={{ width: '40px' }}>#</th>
                        <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider" style={{ width: '120px' }}>Persentase (%)</th>
                        <th className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wider" style={{ width: '50px' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.rendemen.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="text-center py-4 text-gray-400 text-sm">
                            Belum ada rendemen. Klik "Tambah"
                          </td>
                        </tr>
                      ) : (
                        formData.rendemen.map((r, i) => (
                          <tr key={i} className={cn('border-b', isDark ? 'border-gray-700/50' : 'border-gray-100')}>
                            <td className="px-2 py-2 text-xs text-center">{i + 1}</td>
                            <td className="px-2 py-2">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={displayValues.rendemen[i]?.persen || '0'}
                                onChange={(e) => updateRendemenDisplay(i, e.target.value)}
                                onBlur={() => handleRendemenBlur(i)}
                                className={cn(inputBase, 'w-full text-right')}
                                placeholder="0"
                                style={{ maxWidth: '120px' }}
                              />
                            </td>
                            <td className="px-2 py-2 text-center">
                              <button
                                onClick={() => removeRendemen(i)}
                                className="text-red-500 hover:text-red-700 transition-colors p-1"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                  <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t" style={{ borderColor: isDark ? '#374151' : '#e5e7eb' }}>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className={cn('flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors',
                    isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  )}
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-brand-green hover:bg-brand-green/90 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  {isEditing ? 'Simpan Perubahan' : 'Tambah Produk'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={cn('w-full max-w-sm rounded-xl shadow-2xl p-6', card)}>
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4 mx-auto">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className={cn('text-center font-bold text-lg mb-2', isDark ? 'text-white' : 'text-gray-800')}>
              Hapus Produk?
            </h3>
            <p className={cn('text-center text-sm mb-6', isDark ? 'text-gray-400' : 'text-gray-500')}>
              Semua data material dan rendemen yang terkait juga akan dihapus.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className={cn('flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors',
                  isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                )}
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}