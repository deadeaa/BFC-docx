import { useTheme } from '../../context/ThemeContext'

export default function Footer() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <footer
      className={`h-10 flex items-center justify-center px-4 flex-shrink-0 border-t
        ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-[#F5F0E8] border-[#D4C9B0]'}`}
    >
      <p className={`text-[11px] text-center ${isDark ? 'text-white/60' : 'text-gray-400'}`}>
        © 2026 Batch Formula Calculation · Developed by{' '}
        <span className="font-semibold text-green-500">
          Bintang Toedjoe
        </span>{' '}
        in Collaboration with{' '}
        <span className="font-semibold text-red-500">
          President University
        </span>{' '}
        (Dealova Anastasya Nadine Anggraini)
      </p>
    </footer>
  )
}