import { useEffect, useRef, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useTheme } from '@/context/ThemeContext'

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const { isDark } = useTheme()
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth',
      })
    }
  }, [pathname])

  return (
    <div
      className={`flex h-[100dvh] overflow-hidden transition-colors duration-300 ${
        isDark ? 'bg-[#030708] text-white' : 'bg-[#F8F7F7] text-gray-900'
      }`}
    >
      {/* ─── Left Sidebar (Clean, Isolated, Never overlapped by hero wireframe) ─── */}
      <Sidebar />

      {/* ─── Right Content Area ────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden relative">
        <Topbar />

        {/* ─── Main Viewport with Full Height Support for Map & Pages ──── */}
        <main
          ref={mainRef}
          className={`flex-1 flex flex-col min-h-0 overflow-auto relative transition-colors duration-300 ${
            isDark ? 'bg-[#030708]' : 'bg-[#F8F7F7]'
          }`}
        >
          {/* 3D Wireframe Terrain & Overhead Spotlight (Restricted purely to Main content) */}
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
            <img
              src="/images/hero-wireframe.jpg"
              alt="3D Wireframe Terrain Mesh"
              className={`w-full h-full object-cover object-bottom transition-all duration-500 ${
                isDark
                  ? 'opacity-30 brightness-[0.8] contrast-[1.2] mix-blend-screen'
                  : 'opacity-30 mix-blend-multiply filter invert hue-rotate-180 brightness-95 contrast-125'
              }`}
            />

            {/* Overhead soft spotlight beam */}
            <div
              className={`absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] blur-[120px] pointer-events-none ${
                isDark
                  ? 'bg-gradient-to-b from-[#00c4de]/15 via-[#007b8b]/8 to-transparent'
                  : 'bg-gradient-to-b from-[#007b8b]/10 via-[#d3f7ff]/20 to-transparent'
              }`}
            />

            {/* Subtle coordinate dot-grid overlay */}
            <div
              className="absolute inset-0 opacity-[0.06] pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(circle, #00c4de 1px, transparent 1px), linear-gradient(to right, #00c4de 1px, transparent 1px), linear-gradient(to bottom, #00c4de 1px, transparent 1px)',
                backgroundSize: '48px 48px',
              }}
            />
          </div>

          {/* Actual Page Content */}
          <div className="relative z-10 flex-1 flex flex-col min-h-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
