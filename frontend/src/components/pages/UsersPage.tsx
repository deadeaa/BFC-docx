// frontend/src/components/pages/UsersPage.tsx
import { useState, useEffect, type FormEvent } from 'react'
import { Plus, Pencil, Trash2, X, Check, Search, UserCircle2 } from 'lucide-react'
import api from '../../lib/api'
import type { User, Role } from '../../types'
import { useTheme } from '../../context/ThemeContext'
import { cn } from '../../lib/utils'
import { roleLabel } from '../../lib/roles'

// Semua role yang tersedia di sistem
const ROLES: Role[] = ['admin', 'ts', 'ppic', 'produksi', 'qa']

interface UserForm {
  username: string
  full_name: string
  password: string
  role: Role
  is_active: boolean
}

const emptyForm = (): UserForm => ({
  username: '',
  full_name: '',
  password: '',
  role: 'produksi',
  is_active: true,
})

export default function UsersPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [form, setForm] = useState<UserForm>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const { data } = await api.get<User[]>('/users')
      setUsers(data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm())
    setError('')
    setShowModal(true)
  }

  function openEdit(u: User) {
    setEditing(u)
    setForm({
      username: u.username,
      full_name: u.full_name,
      password: '',
      role: u.role,
      is_active: u.is_active,
    })
    setError('')
    setShowModal(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editing) {
        const payload: Partial<UserForm> = { ...form }
        if (!payload.password) delete payload.password
        await api.put(`/users/${editing.id}`, payload)
      } else {
        await api.post('/users', form)
      }
      setShowModal(false)
      fetchUsers()
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined
      setError(msg ?? 'Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.delete(`/users/${id}`)
      setDeleteId(null)
      fetchUsers()
    } catch {
      // ignore
    }
  }

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    return (
      u.full_name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      roleLabel(u.role).toLowerCase().includes(q)
    )
  })

  const cardBg = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
  const inputCls = cn(
    'w-full border rounded-xl px-3 py-2.5 text-sm outline-none transition-all duration-200',
    isDark
      ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 focus:border-brand-green/60'
      : 'bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-brand-green/60'
  )

  const roleBadge = (role: Role) => {
    const colors: Record<Role, string> = {
      admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      ts: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
      ppic: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
      produksi: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      qa: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    }
    return colors[role]
  }

  return (
    <div className="p-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1
            className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}
          >
            Manajemen User
          </h1>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {users.length} user terdaftar
          </p>
        </div>

        <div className="flex gap-3">
          <div className="relative">
            <Search
              size={15}
              className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
            />
            <input
              type="text"
              placeholder="Cari user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(inputCls, 'pl-8 w-56')}
            />
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-green hover:bg-[#6fa800] text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            <Plus size={16} />
            Tambah User
          </button>
        </div>
      </div>

      {/* Table */}
      <div className={`rounded-2xl border overflow-hidden ${cardBg}`}>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <UserCircle2 size={40} className={isDark ? 'text-gray-600' : 'text-gray-300'} />
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Tidak ada user ditemukan
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  className={`border-b text-xs uppercase tracking-wide ${isDark ? 'border-gray-700 bg-gray-700/50 text-gray-400' : 'border-gray-100 bg-gray-50/80 text-gray-500'}`}
                >
                  <th className="px-6 py-4 text-left font-semibold">Nama</th>
                  <th className="px-6 py-4 text-left font-semibold">Username</th>
                  <th className="px-6 py-4 text-left font-semibold">Role</th>
                  <th className="px-6 py-4 text-left font-semibold">Status</th>
                  <th className="px-6 py-4 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map((u) => (
                  <tr
                    key={u.id}
                    className={`transition-colors ${isDark ? 'hover:bg-gray-700/40' : 'hover:bg-gray-50'}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-brand-green/20 border border-brand-green/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-brand-green text-xs font-bold">
                            {u.full_name[0]?.toUpperCase()}
                          </span>
                        </div>
                        <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                          {u.full_name}
                        </span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 font-mono text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {u.username}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleBadge(u.role)}`}
                      >
                        {roleLabel(u.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${u.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${u.is_active ? 'bg-green-500' : 'bg-red-500'}`}
                        />
                        {u.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(u)}
                          className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteId(u.id)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <Trash2 size={14} />
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
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div
            className={`w-full max-w-md rounded-2xl shadow-2xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {editing ? 'Edit User' : 'Tambah User Baru'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={form.full_name}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                  className={inputCls}
                  placeholder="Nama lengkap"
                />
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                  className={inputCls}
                  placeholder="username"
                />
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Password {editing && <span className="text-gray-400 font-normal">(kosongkan jika tidak diubah)</span>}
                </label>
                <input
                  type="password"
                  required={!editing}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className={inputCls}
                  placeholder="Password"
                />
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Role
                </label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}
                  className={inputCls}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {roleLabel(r)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="is_active"
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  className="h-4 w-4 rounded accent-brand-green"
                />
                <label
                  htmlFor="is_active"
                  className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
                >
                  User aktif
                </label>
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors
                    ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-brand-green hover:bg-[#6fa800] text-white text-sm font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check size={16} />
                  )}
                  {editing ? 'Simpan' : 'Tambah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div
            className={`w-full max-w-sm rounded-2xl shadow-2xl border p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
          >
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4 mx-auto">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className={`text-center font-bold text-lg mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Hapus User?
            </h3>
            <p className={`text-center text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Tindakan ini tidak bisa dibatalkan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors
                  ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
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