import { useState, useRef, useEffect } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { CaretDown, List, X } from '@phosphor-icons/react'
import { MegaDropdown } from './MegaDropdown'
import { useTheme } from '@/context/ThemeContext'

const navLinks = [
  { label: 'Giải pháp', href: '/product/map' },
  { label: 'Tài liệu', href: '/docs' },
  { label: 'Về chúng tôi', href: '/about' },
  { label: 'Blog', href: '/blog' },
]

export function Navbar() {
  const { isDark } = useTheme()
  const [productOpen, setProductOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProductOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setProductOpen(false)
        setMobileOpen(false)
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <header
      className={`sticky top-0 z-40 w-full backdrop-blur-xl transition-colors border-b ${
        isDark
          ? 'bg-[#030708]/90 border-white/10 text-white'
          : 'bg-white/90 border-[#E8E4E3] text-gray-900 shadow-sm'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-18 items-center justify-between gap-6">
          {/* Logo with Brand Asset (Vector SVG) */}
          <Link
            to="/"
            className={`flex items-center gap-3 shrink-0 font-brand font-bold text-xl transition-colors group ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}
          >
            <img
              src="/brand/brand_logo_nobg.svg"
              alt="SignTrustMap Logo"
              className="w-9 h-9 object-contain group-hover:scale-105 transition-transform"
            />
            <span className="tracking-tight text-xl font-bold font-sans">
              Sign<span className={isDark ? 'text-[#00c4de]' : 'text-[#007b8b]'}>Trust</span>Map
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1.5" aria-label="Main navigation">
            {/* Product Dropdown trigger */}
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setProductOpen((o) => !o)}
                aria-expanded={productOpen}
                aria-haspopup="true"
                className={`flex items-center gap-1.5 px-3.5 py-2 text-[15px] font-medium rounded-full transition-colors cursor-pointer ${
                  productOpen
                    ? isDark
                      ? 'bg-white/10 text-[#00c4de]'
                      : 'bg-gray-100 text-[#007b8b]'
                    : isDark
                      ? 'text-gray-300 hover:text-white hover:bg-white/5'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span>Sản phẩm</span>
                <CaretDown
                  size={14}
                  weight="bold"
                  className={`transition-transform duration-200 ${
                    productOpen
                      ? isDark
                        ? 'rotate-180 text-[#00c4de]'
                        : 'rotate-180 text-[#007b8b]'
                      : isDark
                        ? 'text-gray-400'
                        : 'text-gray-500'
                  }`}
                />
              </button>
              {productOpen && <MegaDropdown onClose={() => setProductOpen(false)} />}
            </div>

            {navLinks.map((link) => (
              <NavLink
                key={link.href}
                to={link.href}
                className={({ isActive }) =>
                  `px-3.5 py-2 text-[15px] font-medium rounded-full transition-colors ${
                    isActive
                      ? isDark
                        ? 'text-[#00c4de] bg-white/10'
                        : 'text-[#007b8b] bg-gray-100 font-semibold'
                      : isDark
                        ? 'text-gray-300 hover:text-white hover:bg-white/5'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Right Action buttons (Local Web Routes) */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <Link
              to="/login"
              className={`px-4 py-2 text-[15px] font-medium transition-colors ${
                isDark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-black'
              }`}
            >
              Đăng nhập
            </Link>
            <Link
              to="/signup"
              className={`px-5 py-2 text-[15px] font-bold rounded-full shadow-md active:scale-[0.98] transition-all ${
                isDark
                  ? 'text-black bg-[#00c4de] hover:bg-[#38dbf1] shadow-[#00c4de]/25 hover:shadow-[#00c4de]/40'
                  : 'text-white bg-[#007b8b] hover:bg-[#00606d] shadow-[#007b8b]/20 hover:shadow-[#007b8b]/30'
              }`}
            >
              Đăng ký
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className={`lg:hidden p-2 transition-colors ${
              isDark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-black'
            }`}
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? 'Đóng menu' : 'Mở menu'}
          >
            {mobileOpen ? <X size={24} /> : <List size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className={`lg:hidden border-t backdrop-blur-2xl transition-colors ${
            isDark
              ? 'border-white/10 bg-[#030708]/98 text-white'
              : 'border-[#E8E4E3] bg-white/98 text-gray-900'
          }`}
        >
          <nav className="mx-auto max-w-7xl px-4 py-5 flex flex-col gap-2">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 px-3">
              Sản phẩm
            </p>
            <Link
              to="/product/map"
              onClick={() => setMobileOpen(false)}
              className={`px-3 py-2.5 text-base font-medium rounded-[8px] transition-colors ${
                isDark ? 'text-gray-200 hover:text-[#00c4de] hover:bg-white/5' : 'text-gray-800 hover:text-[#007b8b] hover:bg-gray-100'
              }`}
            >
              🗺️ Bản Đồ Biển Báo GIS
            </Link>
            <Link
              to="/product/app"
              onClick={() => setMobileOpen(false)}
              className={`px-3 py-2.5 text-base font-medium rounded-[8px] transition-colors ${
                isDark ? 'text-gray-200 hover:text-[#00c4de] hover:bg-white/5' : 'text-gray-800 hover:text-[#007b8b] hover:bg-gray-100'
              }`}
            >
              📱 Ứng Dụng Khảo Sát & Dẫn Đường
            </Link>
            <div className={`my-2 border-t ${isDark ? 'border-white/10' : 'border-[#E8E4E3]'}`} />
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileOpen(false)}
                className={`px-3 py-2.5 text-base font-medium rounded-[8px] transition-colors ${
                  isDark ? 'text-gray-300 hover:text-white hover:bg-white/5' : 'text-gray-700 hover:text-black hover:bg-gray-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className={`mt-4 pt-3 border-t flex flex-col gap-2.5 ${isDark ? 'border-white/10' : 'border-[#E8E4E3]'}`}>
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className={`text-center py-2.5 text-sm font-medium rounded-full border transition-colors ${
                  isDark ? 'text-gray-300 border-white/15 hover:bg-white/5' : 'text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
              >
                Đăng nhập
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileOpen(false)}
                className={`text-center py-2.5 text-sm font-bold rounded-full shadow-md ${
                  isDark ? 'text-black bg-[#00c4de]' : 'text-white bg-[#007b8b]'
                }`}
              >
                Đăng ký
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
