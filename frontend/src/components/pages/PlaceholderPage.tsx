import { Construction } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

export default function PlaceholderPage({ title }: { title: string }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8 animate-fade-in">
      <div
        className={`h-20 w-20 rounded-2xl flex items-center justify-center
        ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
      >
        <Construction size={36} className="text-brand-green" />
      </div>
      <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{title}</h2>
      <p className={`text-sm text-center max-w-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        Halaman ini sedang dalam pengembangan. Akan segera tersedia.
      </p>
      <span className="px-4 py-1.5 bg-brand-green/10 text-brand-green rounded-full text-xs font-medium border border-brand-green/20">
        Coming Soon
      </span>
    </div>
  )
}
