// frontend/src/components/ErrorPage.tsx
import { Link } from 'react-router-dom'
import { Home, RefreshCw } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { cn } from '../lib/utils'

interface ErrorPageProps {
  code: number
  title: string
  description: string
  suggestion?: string
  showRefresh?: boolean
}

export default function ErrorPage({
  code,
  title,
  description,
  suggestion,
  showRefresh = false,
}: ErrorPageProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className={cn(
      'min-h-screen flex items-center justify-center p-6',
      isDark ? 'bg-gray-900' : 'bg-brand-bg'
    )}>
      <div className="text-center max-w-lg">
        {/* Icon / Code */}
        <div className="mb-6">
          <div className={cn(
            'text-8xl font-bold tracking-tight',
            isDark ? 'text-gray-700' : 'text-gray-200'
          )}>
            {code}
          </div>
          <div className={cn(
            'text-6xl mt-2',
            isDark ? 'text-gray-600' : 'text-gray-300'
          )}>
          </div>
        </div>

        {/* Title */}
        <h1 className={cn(
          'text-2xl font-bold mb-2',
          isDark ? 'text-white' : 'text-gray-900'
        )}>
          {title}
        </h1>

        {/* Description */}
        <p className={cn(
          'text-sm mb-4',
          isDark ? 'text-gray-400' : 'text-gray-600'
        )}>
          {description}
        </p>

        {/* Suggestion */}
        {suggestion && (
          <p className={cn(
            'text-xs mb-6 px-4 py-2 rounded-lg border',
            isDark ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'
          )}>
            💡 {suggestion}
          </p>
        )}

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className={cn(
              'inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all',
              'bg-brand-green hover:bg-brand-green/90 text-white'
            )}
          >
            <Home size={16} />
            Kembali ke Beranda
          </Link>

          {showRefresh && (
            <button
              onClick={() => window.location.reload()}
              className={cn(
                'inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all border',
                isDark
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              )}
            >
              <RefreshCw size={16} />
              Refresh Halaman
            </button>
          )}
        </div>

        {/* Footer */}
        <p className={cn(
          'text-xs mt-6',
          isDark ? 'text-gray-600' : 'text-gray-400'
        )}>
          Batch Formula Calculation © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}