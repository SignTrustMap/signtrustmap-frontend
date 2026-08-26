import { useState, useRef, useEffect } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { CaretDown, List, X, ArrowSquareOut, MapTrifold } from '@phosphor-icons/react'
import { MegaDropdown } from './MegaDropdown'
import { env } from '@/config/env'

const navLinks = [
  { label: 'Giải pháp', href: '/product/map' },
  { label: 'Tài liệu', href: '/docs' },
  { label: 'Về chúng tôi', href: '/about' },
  { label: 'Blog', href: '/blog' },
]

export function Navbar() {
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

  const opsUrl = env.isDev
    ? `http://${env.opsDomain}/login`
    : `https://${env.opsDomain}/login`

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#030708]/85 backdrop-blur-xl transition-all">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-6">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 shrink-0 font-brand font-bold text-lg text-white group"
          >
            <div className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-[#00c4de] to-[#007b8b] flex items-center justify-center shadow-lg shadow-[#00c4de]/20 group-hover:scale-105 transition-transform">
              <MapTrifold size={18} weight="fill" className="text-black" />
            </div>
            <span className="tracking-tight">
              Sign<span className="text-[#00c4de]">Trust</span>Map
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
            {/* Product Dropdown trigger */}
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setProductOpen((o) => !o)}
                aria-expanded={productOpen}
                aria-haspopup="true"
                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  productOpen
                    ? 'bg-white/10 text-[#00c4de]'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>Products</span>
                <CaretDown
                  size={12}
                  weight="bold"
                  className={`transition-transform duration-200 ${productOpen ? 'rotate-180 text-[#00c4de]' : 'text-gray-400'}`}
                />
              </button>
              {productOpen && <MegaDropdown onClose={() => setProductOpen(false)} />}
            </div>

            {navLinks.map((link) => (
              <NavLink
                key={link.href}
                to={link.href}
                className={({ isActive }) =>
                  `px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    isActive
                      ? 'text-[#00c4de] bg-white/10'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Right Action buttons (DigitalOcean style) */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <a
              href={opsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-full border border-white/10 transition-all"
            >
              <span>Ops Portal</span>
              <ArrowSquareOut size={13} className="text-gray-400" />
            </a>
            <Link
              to="/product/map"
              className="px-4 py-1.5 text-xs font-bold text-black bg-[#00c4de] hover:bg-[#34d7ee] rounded-full shadow-md shadow-[#00c4de]/25 hover:shadow-lg hover:shadow-[#00c4de]/40 active:scale-[0.98] transition-all"
            >
              Mở bản đồ
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-2 text-gray-300 hover:text-white"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? 'Đóng menu' : 'Mở menu'}
          >
            {mobileOpen ? <X size={22} /> : <List size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-white/10 bg-[#030708]/98 backdrop-blur-2xl">
          <nav className="mx-auto max-w-7xl px-4 py-5 flex flex-col gap-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 px-3">
              Sản phẩm
            </p>
            <Link
              to="/product/map"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2 text-sm font-medium text-gray-200 hover:text-[#00c4de] rounded-[8px] hover:bg-white/5"
            >
              🗺️ Bản Đồ Biển Báo 3D
            </Link>
            <Link
              to="/product/app"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2 text-sm font-medium text-gray-200 hover:text-[#00c4de] rounded-[8px] hover:bg-white/5"
            >
              📱 Tải Ứng Dụng Mobile
            </Link>
            <div className="my-2 border-t border-white/10" />
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-white rounded-[8px] hover:bg-white/5"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-4 pt-3 border-t border-white/10 flex flex-col gap-2.5">
              <a
                href={opsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-center py-2 text-xs font-medium text-gray-300 border border-white/15 rounded-full"
              >
                Ops Portal ↗
              </a>
              <Link
                to="/product/map"
                onClick={() => setMobileOpen(false)}
                className="text-center py-2 text-xs font-bold text-black bg-[#00c4de] rounded-full"
              >
                Mở bản đồ trực tiếp
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
