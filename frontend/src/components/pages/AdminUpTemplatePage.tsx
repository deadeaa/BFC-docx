// frontend/src/components/pages/admin/AdminReportTemplatePage.tsx
import { useState, useEffect } from 'react'
import { Upload, FileText, Trash2, AlertCircle, CheckCircle2, Pencil, X, RefreshCw } from 'lucide-react'
import api from '../../lib/api'
import { useTheme } from '../../context/ThemeContext'
import { cn } from '../../lib/utils'

interface Template {
  id: number
  kode_produk: string
  nama_file: string
  file_path: string
  created_at: string
  updated_at?: string
}

export default function AdminReportTemplatePage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedKode, setSelectedKode] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // ✅ State untuk edit mode
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editFile, setEditFile] = useState<File | null>(null)

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/report-templates')
      setTemplates(data || [])
    } catch {
      setError('Gagal memuat data template')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  // ✅ Upload baru
  const handleUpload = async () => {
    if (!selectedKode || !selectedFile) {
      setError('Pilih kode produk dan file template')
      return
    }

    const formData = new FormData()
    formData.append('kode_produk', selectedKode)
    formData.append('file', selectedFile)

    setUploading(true)
    setError('')
    setSuccess('')

    try {
      await api.post('/admin/report-templates', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setSuccess('Template berhasil diupload/update')
      setSelectedFile(null)
      setSelectedKode('')
      fetchTemplates()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal upload template')
    } finally {
      setUploading(false)
    }
  }

  // ✅ EDIT - Buka modal edit
  const openEditModal = (template: Template) => {
    setEditingTemplate(template)
    setEditFile(null)
    setError('')
    setIsEditModalOpen(true)
  }

  // ✅ EDIT - Submit update template
  const handleEditSubmit = async () => {
    if (!editingTemplate || !editFile) {
      setError('Pilih file template baru')
      return
    }

    const formData = new FormData()
    formData.append('kode_produk', editingTemplate.kode_produk)
    formData.append('file', editFile)

    setUploading(true)
    setError('')
    setSuccess('')

    try {
      // ✅ POST ke endpoint yang sama - auto detect update
      await api.post('/admin/report-templates', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setSuccess(`Template untuk ${editingTemplate.kode_produk} berhasil diupdate!`)
      setIsEditModalOpen(false)
      setEditingTemplate(null)
      setEditFile(null)
      fetchTemplates()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal update template')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: number, kodeProduk: string) => {
    if (!confirm(`Yakin ingin menghapus template untuk ${kodeProduk}?`)) return
    
    try {
      await api.delete(`/admin/report-templates/${id}`)
      setSuccess(`Template ${kodeProduk} berhasil dihapus`)
      fetchTemplates()
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setError('Gagal menghapus template')
    }
  }

  const card = isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
  const inputBase = cn(
    'w-full px-3 py-2 rounded-lg border text-sm transition-colors outline-none',
    isDark
      ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-brand-green-light'
      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-brand-green'
  )

  return (
    <div className={cn('min-h-full p-6', isDark ? 'bg-gray-900' : 'bg-brand-bg')}>
      <div className="mb-6">
        <h1 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>
          Admin - Template Report
        </h1>
        <p className={cn('text-sm mt-0.5', isDark ? 'text-gray-400' : 'text-gray-500')}>
          Upload/Update template DOCX untuk laporan per produk
        </p>
      </div>

      {/* Upload Form */}
      <div className={cn('rounded-xl p-5 mb-5 shadow-sm', card)}>
        <h2 className={cn('text-sm font-semibold mb-4', isDark ? 'text-gray-200' : 'text-gray-700')}>
          Upload / Update Template
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={cn('block text-xs font-medium mb-1.5', isDark ? 'text-gray-400' : 'text-gray-600')}>
              Kode Produk
            </label>
            <input
              type="text"
              value={selectedKode}
              onChange={(e) => setSelectedKode(e.target.value.toUpperCase())}
              placeholder="Contoh: PEBJ3"
              className={inputBase}
            />
            <p className="text-xs text-gray-400 mt-1">
              Jika sudah ada, akan otomatis diupdate
            </p>
          </div>
          <div>
            <label className={cn('block text-xs font-medium mb-1.5', isDark ? 'text-gray-400' : 'text-gray-600')}>
              File Template (.docx)
            </label>
            <input
              type="file"
              accept=".docx"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className={inputBase}
            />
            {selectedFile && (
              <p className="text-xs text-green-500 mt-1">📄 {selectedFile.name}</p>
            )}
          </div>
        </div>

        <button
          onClick={handleUpload}
          disabled={uploading || !selectedKode || !selectedFile}
          className={cn(
            'mt-4 flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'bg-brand-green hover:bg-brand-green/90 text-white'
          )}
        >
          {uploading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Upload size={16} />
          )}
          Upload / Update Template
        </button>
      </div>

      {/* Daftar Template */}
      <div className={cn('rounded-xl shadow-sm overflow-hidden', card)}>
        <div className="px-4 py-3 border-b flex justify-between items-center" style={{ borderColor: isDark ? '#374151' : '#e5e7eb' }}>
          <h2 className={cn('text-sm font-semibold', isDark ? 'text-gray-200' : 'text-gray-700')}>
            Daftar Template
          </h2>
          <button
            onClick={fetchTemplates}
            className={cn('p-1.5 rounded-lg transition-colors', isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100')}
          >
            <RefreshCw size={16} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-green border-t-transparent" />
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-16">
            <FileText size={48} className="mx-auto text-gray-400 mb-3" />
            <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>
              Belum ada template yang diupload
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={cn('border-b', isDark ? 'border-gray-700' : 'border-gray-200')}>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Kode Produk</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Nama File</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Terakhir Update</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => (
                  <tr key={t.id} className={cn('border-b', isDark ? 'border-gray-700/50' : 'border-gray-100')}>
                    <td className="px-4 py-3 font-semibold">{t.kode_produk}</td>
                    <td className="px-4 py-3">{t.nama_file}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {new Date(t.updated_at || t.created_at).toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* ✅ TOMBOL EDIT / UPDATE */}
                        <button
                          onClick={() => openEditModal(t)}
                          className={cn(
                            'p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium',
                            isDark ? 'hover:bg-gray-700 text-blue-400' : 'hover:bg-gray-100 text-blue-600'
                          )}
                        >
                          <Pencil size={14} />
                          <span className="hidden sm:inline">Update</span>
                        </button>
                        <button
                          onClick={() => handleDelete(t.id, t.kode_produk)}
                          className={cn(
                            'p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium',
                            isDark ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-gray-100 text-red-600'
                          )}
                        >
                          <Trash2 size={14} />
                          <span className="hidden sm:inline">Hapus</span>
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

      {/* ✅ MODAL EDIT / UPDATE TEMPLATE */}
      {isEditModalOpen && editingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={cn('w-full max-w-md rounded-xl shadow-2xl overflow-hidden', card)}>
            <div className={cn('flex items-center justify-between p-4 border-b', isDark ? 'border-gray-700' : 'border-gray-200')}>
              <h2 className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-gray-900')}>
                Update Template
              </h2>
              <button
                onClick={() => {
                  setIsEditModalOpen(false)
                  setEditingTemplate(null)
                  setEditFile(null)
                }}
                className={cn('p-1.5 rounded-lg transition-colors', isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100')}
              >
                <X size={20} className={isDark ? 'text-gray-400' : 'text-gray-600'} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className={cn('block text-xs font-medium mb-1.5', isDark ? 'text-gray-400' : 'text-gray-600')}>
                  Kode Produk
                </label>
                <div className={cn(
                  'px-3 py-2 rounded-lg border text-sm font-semibold',
                  isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-200 text-gray-700'
                )}>
                  {editingTemplate.kode_produk}
                </div>
                <p className="text-xs text-gray-400 mt-1">Kode produk tidak bisa diubah</p>
              </div>

              <div>
                <label className={cn('block text-xs font-medium mb-1.5', isDark ? 'text-gray-400' : 'text-gray-600')}>
                  File Template Baru (.docx) <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept=".docx"
                  onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                  className={inputBase}
                />
                {editFile && (
                  <p className="text-xs text-green-500 mt-1">📄 {editFile.name}</p>
                )}
                {!editFile && (
                  <p className="text-xs text-yellow-500 mt-1">
                    ⚠️ Pilih file .docx baru untuk mengganti template lama
                  </p>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                  <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setIsEditModalOpen(false)
                    setEditingTemplate(null)
                    setEditFile(null)
                  }}
                  className={cn(
                    'flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors',
                    isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  )}
                >
                  Batal
                </button>
                <button
                  onClick={handleEditSubmit}
                  disabled={uploading || !editFile}
                  className="flex-1 py-2.5 rounded-xl bg-brand-green hover:bg-brand-green/90 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {uploading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Upload size={16} />
                  )}
                  Update Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success/Error Messages */}
      {success && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30 z-50">
          <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
          <span className="text-sm text-green-700 dark:text-green-400">{success}</span>
        </div>
      )}
      {error && !isEditModalOpen && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 z-50">
          <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
          <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
        </div>
      )}
    </div>
  )
}