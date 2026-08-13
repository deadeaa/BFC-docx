import type { ReactNode } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import Footer from './Footer'
import { useTheme } from '../../context/ThemeContext'

export default function Layout({ children }: { children: ReactNode }) {
  const { theme } = useTheme()

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Header />
        <main
          className={`flex-1 min-w-0 overflow-y-auto ${theme === 'dark' ? 'bg-gray-800' : 'bg-[#F5F0E8]'}`}
        >
          {children}
        </main>
        <Footer />
      </div>
    </div>
  )
}