// frontend/src/components/pages/UnauthorizedPage.tsx
import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

// Ditampilkan ketika user yang sudah login mencoba mengakses route yang
// tidak diizinkan untuk role-nya (mis. QA/Produksi membuka /users atau
// /log-aktivitas secara manual lewat URL).
export default function UnauthorizedPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 p-8 animate-fade-in">
      <div
        className={`h-20 w-20 rounded-2xl flex items-center justify-center
        ${isDark ? 'bg-red-900/30' : 'bg-red-50'}`}
      >
        <ShieldAlert size={36} className="text-red-500" />
      </div>
      <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
        Akses Ditolak
      </h2>
      <p className={`text-sm text-center max-w-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        Anda tidak memiliki hak akses untuk membuka halaman ini. Hubungi Administrator apabila
        Anda merasa ini adalah kekeliruan.
      </p>
      <Link
        to="/welcome"
        className="px-5 py-2.5 rounded-xl bg-brand-green hover:bg-brand-green/90 text-white text-sm font-semibold transition-colors"
      >
        Kembali ke Beranda
      </Link>
    </div>
  )
}
