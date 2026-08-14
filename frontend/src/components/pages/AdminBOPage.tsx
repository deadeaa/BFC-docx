// frontend/src/components/pages/admin/AdminBatchOverfilledPage.tsx
import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, X, Save, AlertCircle, CheckCircle2 } from 'lucide-react'
import api from '../../lib/api'
import { useTheme } from '../../context/ThemeContext'
import { cn } from '../../lib/utils'

interface AdminBOMaterial {
  id?: number
  product_id?: number
  material_index: number
  kode_material: string
  label: string
  target_kg: number
}

interface AdminBOThreshold {
  id?: number
  product_id?: number
  criteria_index: number
  target_index: number
  min_ratio: number
  max_ratio: number
}

interface AdminBOProduct {
  id?: number
  kode_produk: string
  nama_produk: string
  materials: AdminBOMaterial[]
  thresholds: AdminBOThreshold[]
}

const emptyMaterial = (): AdminBOMaterial => ({
  material_index: 0,
  kode_material: '',
  label: '',
  target_kg: 0,
})

const emptyThreshold = (): AdminBOThreshold => ({
  criteria_index: 0,
  target_index: 0,
  min_ratio: 0,
  max_ratio: 1,
})

const emptyProduct = (): AdminBOProduct => ({
  kode_produk: '',
  nama_produk: '',
  materials: [],
  thresholds: [],
})

export default function AdminBatchOverfilledPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [products, setProducts] = useState<AdminBOProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<AdminBOProduct>(emptyProduct())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get<AdminBOProduct[]>('/admin/bo/products')
      setProducts(data || [])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data produk')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const openCreateModal = () => {
    setIsEditing(false)
    setFormData({
      kode_produk: '',
      nama_produk: '',
      materials: [],
      thresholds: [],
    })
    setError('')
    setIsModalOpen(true)
  }

  const openEditModal = (product: AdminBOProduct) => {
    setIsEditing(true)
    const clonedProduct: AdminBOProduct = {
      id: product.id,
      kode_produk: product.kode_produk || '',
      nama_produk: product.nama_produk || '',
      materials: product.materials ? product.materials.map(m => ({ ...m })) : [],
      thresholds: product.thresholds ? product.thresholds.map(t => ({ ...t })) : [],
    }
    setFormData(clonedProduct)
    setError('')
    setIsModalOpen(true)
  }

  // ✅ Auto-generate thresholds berdasarkan jumlah material
  const generateThresholds = (materialsCount: number): AdminBOThreshold[] => {
    if (materialsCount < 1) return []
    
    const thresholds: AdminBOThreshold[] = []
    for (let criteria = 0; criteria < materialsCount; criteria++) {
      for (let target = 0; target < materialsCount; target++) {
        if (criteria === target) continue
        thresholds.push({
          criteria_index: criteria,
          target_index: target,
          min_ratio: 0,
          max_ratio: 1,
        })
      }
    }
    return thresholds
  }

  // ── Material Handlers ──────────────────────────────────────
  const addMaterial = () => {
    const lastIndex = formData.materials.length
    const newMaterials = [...formData.materials, { ...emptyMaterial(), material_index: lastIndex }]
    
    // ✅ Auto-generate ulang thresholds
    const newThresholds = generateThresholds(newMaterials.length)
    
    setFormData({
      ...formData,
      materials: newMaterials,
      thresholds: newThresholds,
    })
  }

  const removeMaterial = (index: number) => {
    // if (formData.materials.length <= 1) {
    //   setError('Minimal 1 material')
    //   return
    // }
    const newMaterials = formData.materials.filter((_, i) => i !== index)
    newMaterials.forEach((m, i) => m.material_index = i)
    
    // ✅ Auto-generate ulang thresholds
    const newThresholds = generateThresholds(newMaterials.length)
    
    setFormData({
      ...formData,
      materials: newMaterials,
      thresholds: newThresholds,
    })
  }

  const updateMaterial = (index: number, field: keyof AdminBOMaterial, value: any) => {
    const newMaterials = [...formData.materials]
    newMaterials[index] = { ...newMaterials[index], [field]: value }
    setFormData({ ...formData, materials: newMaterials })
  }

  // ── Threshold Handlers ─────────────────────────────────────
  const addThreshold = () => {
    const lastIndex = formData.thresholds.length
    setFormData({
      ...formData,
      thresholds: [...formData.thresholds, { ...emptyThreshold() }],
    })
  }

  const removeThreshold = (index: number) => {
    // ✅ Bisa dihapus sampai kosong
    const newThresholds = formData.thresholds.filter((_, i) => i !== index)
    setFormData({ ...formData, thresholds: newThresholds })
  }

  const updateThreshold = (index: number, field: keyof AdminBOThreshold, value: any) => {
    const newThresholds = [...formData.thresholds]
    newThresholds[index] = { ...newThresholds[index], [field]: value }
    setFormData({ ...formData, thresholds: newThresholds })
  }

  // ── Handle Save ─────────────────────────────────────────────
  const handleSave = async () => {
    if (!formData.kode_produk?.trim()) {
      setError('Kode produk wajib diisi')
      return
    }
    if (!formData.nama_produk?.trim()) {
      setError('Nama produk wajib diisi')
      return
    }
    if (!formData.materials || formData.materials.length < 1) {
      setError('Minimal 1 material harus ditambahkan')
      return
    }

    setSaving(true)
    setError('')
    
    try {
      const payload = {
        kode_produk: formData.kode_produk.trim().toUpperCase(),
        nama_produk: formData.nama_produk.trim(),
        materials: formData.materials.map(m => ({
          material_index: m.material_index ?? 0,
          kode_material: m.kode_material?.trim() || '',
          label: m.label?.trim() || '',
          target_kg: m.target_kg || 0,
        })),
        thresholds: formData.thresholds.map(t => ({
          criteria_index: t.criteria_index ?? 0,
          target_index: t.target_index ?? 0,
          min_ratio: t.min_ratio || 0,
          max_ratio: t.max_ratio || 1,
        })),
      }

      if (isEditing && formData.id) {
        await api.put(`/admin/bo/products/${formData.id}`, payload)
        setSuccess('Produk berhasil diperbarui')
      } else {
        await api.post('/admin/bo/products', payload)
        setSuccess('Produk berhasil ditambahkan')
      }
      
      setIsModalOpen(false)
      await fetchProducts()
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
      await api.delete(`/admin/bo/products/${deleteTarget}`)
      setDeleteTarget(null)
      await fetchProducts()
      setSuccess('Produk berhasil dihapus')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menghapus produk')
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
            Admin - Batch Overfilled
          </h1>
          <p className={cn('text-sm mt-0.5', isDark ? 'text-gray-400' : 'text-gray-500')}>
            Kelola produk, material, dan threshold untuk perhitungan Batch Overfilled
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
              Belum ada produk Batch Overfilled. Klik "Tambah Produk" untuk mulai.
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
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">Thresholds</th>
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
                        {p.thresholds?.length || 0}
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
          <div className={cn('w-full max-w-6xl max-h-[90vh] rounded-xl shadow-2xl overflow-hidden', card)}>
            <div className={cn('flex items-center justify-between p-4 border-b', isDark ? 'border-gray-700' : 'border-gray-200')}>
              <h2 className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-gray-900')}>
                {isEditing ? `Edit Produk: ${formData.kode_produk}` : 'Tambah Produk Batch Overfilled'}
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
                    onChange={(e) => setFormData({ ...formData, kode_produk: e.target.value.toUpperCase() })}
                    className={inputBase}
                    placeholder="Contoh: PBSJ1"
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
                        <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider" style={{ width: '25%' }}>Kode Material</th>
                        <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider" style={{ width: '20%' }}>Label</th>
                        <th className="px-2 py-2 text-right text-xs font-semibold uppercase tracking-wider" style={{ width: '25%' }}>Target (Kg)</th>
                        <th className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wider" style={{ width: '50px' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.materials.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-4 text-gray-400 text-sm">
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
                                onChange={(e) => updateMaterial(i, 'kode_material', e.target.value)}
                                className={cn(inputBase, 'w-full')}
                                placeholder="MAT-001"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="text"
                                value={m.label}
                                onChange={(e) => updateMaterial(i, 'label', e.target.value)}
                                className={cn(inputBase, 'w-full')}
                                placeholder="sodbic"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                step="any"
                                value={m.target_kg}
                                onChange={(e) => updateMaterial(i, 'target_kg', parseFloat(e.target.value) || 0)}
                                className={cn(inputBase, 'w-full text-right')}
                              />
                            </td>
                            <td className="px-2 py-2 text-center">
                              <button
                                onClick={() => removeMaterial(i)}
                                className="text-red-500 hover:text-red-700 transition-colors p-1"
                                // disabled={formData.materials.length <= 1}
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

              {/* Thresholds - Bisa tambah/hapus manual */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={cn('text-sm font-semibold', isDark ? 'text-gray-200' : 'text-gray-700')}>
                    Threshold / Syarat
                    <span className="text-xs font-normal text-gray-400 ml-2">
                      ({formData.thresholds.length}) - auto/manual
                    </span>
                  </label>
                  <button
                    onClick={addThreshold}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-green/10 text-brand-green hover:bg-brand-green/20 transition-colors"
                  >
                    <Plus size={14} /> Tambah
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={cn('border-b', isDark ? 'border-gray-700' : 'border-gray-200')}>
                        <th className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wider" style={{ width: '40px' }}>#</th>
                        <th className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wider" style={{ width: '20%' }}>Criteria Index</th>
                        <th className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wider" style={{ width: '20%' }}>Target Index</th>
                        <th className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wider" style={{ width: '22%' }}>Min Ratio</th>
                        <th className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wider" style={{ width: '22%' }}>Max Ratio</th>
                        <th className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wider" style={{ width: '50px' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.thresholds.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-4 text-gray-400 text-sm">
                            Belum ada threshold. Tambah manual atau auto dari material
                          </td>
                        </tr>
                      ) : (
                        formData.thresholds.map((t, i) => (
                          <tr key={i} className={cn('border-b', isDark ? 'border-gray-700/50' : 'border-gray-100')}>
                            <td className="px-2 py-2 text-xs text-center">{i + 1}</td>
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                value={t.criteria_index}
                                onChange={(e) => updateThreshold(i, 'criteria_index', parseInt(e.target.value) || 0)}
                                className={cn(inputBase, 'w-full text-center')}
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                value={t.target_index}
                                onChange={(e) => updateThreshold(i, 'target_index', parseInt(e.target.value) || 0)}
                                className={cn(inputBase, 'w-full text-center')}
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                step="any"
                                value={t.min_ratio}
                                onChange={(e) => updateThreshold(i, 'min_ratio', parseFloat(e.target.value) || 0)}
                                className={cn(inputBase, 'w-full text-center')}
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                step="any"
                                value={t.max_ratio}
                                onChange={(e) => updateThreshold(i, 'max_ratio', parseFloat(e.target.value) || 1)}
                                className={cn(inputBase, 'w-full text-center')}
                              />
                            </td>
                            <td className="px-2 py-2 text-center">
                              <button
                                onClick={() => removeThreshold(i)}
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
                <div className="flex flex-wrap gap-3 mt-2">
                  <p className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>
                    💡 Threshold: criteria = pivot material, target = material yang dicek
                  </p>
                  <button
                    onClick={() => {
                      const newThresholds = generateThresholds(formData.materials.length)
                      setFormData({ ...formData, thresholds: newThresholds })
                    }}
                    className="text-xs text-brand-green hover:underline"
                  >
                    🔄 Reset Auto
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className={cn('p-3 rounded-lg text-xs', isDark ? 'bg-gray-700/50 text-gray-400' : 'bg-gray-50 text-gray-500')}>
                <p>📊 {formData.materials.length} material, {formData.thresholds.length} threshold</p>
                <p className="mt-1">💡 Threshold: criteria_index = pivot material, target_index = material yang dicek</p>
                <p className="mt-1">📌 Material terakhir otomatis dihitung dari Bobot Total</p>
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
              Semua data material dan threshold yang terkait juga akan dihapus.
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