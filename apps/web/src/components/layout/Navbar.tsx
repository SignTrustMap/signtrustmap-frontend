import { useState, useRef, useEffect } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { CaretDown, List, X } from '@phosphor-icons/react'
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

  const loginUrl = env.isDev
    ? `http://${env.opsDomain}/login`
    : `https://${env.opsDomain}/login`

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#030708]/90 backdrop-blur-xl transition-all">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-18 items-center justify-between gap-6">
          {/* Logo with Brand Asset (Vector SVG) */}
          <Link
            to="/"
            className="flex items-center gap-3 shrink-0 font-brand font-bold text-xl text-white group"
          >
            <img
              src="/brand/brand_logo_nobg.svg"
              alt="SignTrustMap Logo"
              className="w-9 h-9 object-contain group-hover:scale-105 transition-transform"
            />
            <span className="tracking-tight text-xl font-bold font-sans">
              Sign<span className="text-[#00c4de]">Trust</span>Map
            </span>
          </Link>



          {/* Desktop nav — Sized to 15px matching DigitalOcean standard */}
          <nav className="hidden lg:flex items-center gap-1.5" aria-label="Main navigation">
            {/* Product Dropdown trigger */}
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setProductOpen((o) => !o)}
                aria-expanded={productOpen}
                aria-haspopup="true"
                className={`flex items-center gap-1.5 px-3.5 py-2 text-[15px] font-medium rounded-full transition-colors ${
                  productOpen
                    ? 'bg-white/10 text-[#00c4de]'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>Products</span>
                <CaretDown
                  size={14}
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
                  `px-3.5 py-2 text-[15px] font-medium rounded-full transition-colors ${
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

          {/* Right Action buttons (DigitalOcean style: Log in + Sign up) */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <a
              href={loginUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-[15px] font-medium text-gray-300 hover:text-white transition-colors"
            >
              Log in
            </a>
            <a
              href={loginUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2 text-[15px] font-bold text-black bg-[#00c4de] hover:bg-[#34d7ee] rounded-full shadow-md shadow-[#00c4de]/25 hover:shadow-lg hover:shadow-[#00c4de]/40 active:scale-[0.98] transition-all"
            >
              Sign up
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-2 text-gray-300 hover:text-white"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? 'Đóng menu' : 'Mở menu'}
          >
            {mobileOpen ? <X size={24} /> : <List size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-white/10 bg-[#030708]/98 backdrop-blur-2xl">
          <nav className="mx-auto max-w-7xl px-4 py-5 flex flex-col gap-2">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 px-3">
              Sản phẩm
            </p>
            <Link
              to="/product/map"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2.5 text-base font-medium text-gray-200 hover:text-[#00c4de] rounded-[8px] hover:bg-white/5"
            >
              🗺️ Bản Đồ Biển Báo 3D
            </Link>
            <Link
              to="/product/app"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2.5 text-base font-medium text-gray-200 hover:text-[#00c4de] rounded-[8px] hover:bg-white/5"
            >
              📱 Tải Ứng Dụng Mobile
            </Link>
            <div className="my-2 border-t border-white/10" />
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 text-base font-medium text-gray-300 hover:text-white rounded-[8px] hover:bg-white/5"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-4 pt-3 border-t border-white/10 flex flex-col gap-2.5">
              <a
                href={loginUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-center py-2.5 text-sm font-medium text-gray-300 border border-white/15 rounded-full"
              >
                Log in
              </a>
              <a
                href={loginUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-center py-2.5 text-sm font-bold text-black bg-[#00c4de] rounded-full"
              >
                Sign up
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
