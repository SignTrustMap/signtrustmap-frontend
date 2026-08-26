import { useState, useRef, useEffect } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { CaretDown, List, X, ArrowSquareOut } from '@phosphor-icons/react'
import { MegaDropdown } from './MegaDropdown'
import { env } from '@/config/env'

const navLinks = [
  { label: 'About', href: '/about' },
  { label: 'Blog', href: '/blog' },
  { label: 'Docs', href: '/docs' },
]

export function Navbar() {
  const [productOpen, setProductOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProductOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setProductOpen(false); setMobileOpen(false) }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  const opsUrl = env.isDev
    ? `http://${env.opsDomain}/login`
    : `https://${env.opsDomain}/login`

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E8E4E3] bg-white/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-6">

          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 shrink-0 font-brand font-bold text-xl text-[#007b8b]"
          >
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <rect width="28" height="28" rx="6" fill="#007b8b" />
              <path d="M14 6 L20 10 L20 18 L14 22 L8 18 L8 10 Z" stroke="white" strokeWidth="1.5" fill="none" />
              <circle cx="14" cy="14" r="2.5" fill="white" />
            </svg>
            SignTrustMap
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
            {/* Product dropdown */}
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setProductOpen((o) => !o)}
                aria-expanded={productOpen}
                aria-haspopup="true"
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-[8px] transition-colors ${
                  productOpen
                    ? 'bg-[#F8F7F7] text-[#007b8b]'
                    : 'text-gray-700 hover:bg-[#F8F7F7] hover:text-[#007b8b]'
                }`}
              >
                Product
                <CaretDown
                  size={14}
                  weight="bold"
                  className={`transition-transform duration-200 ${productOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {productOpen && <MegaDropdown onClose={() => setProductOpen(false)} />}
            </div>

            {navLinks.map((link) => (
              <NavLink
                key={link.href}
                to={link.href}
                className={({ isActive }) =>
                  `px-3 py-2 text-sm font-medium rounded-[8px] transition-colors ${
                    isActive
                      ? 'text-[#007b8b] bg-[#F8F7F7]'
                      : 'text-gray-700 hover:bg-[#F8F7F7] hover:text-[#007b8b]'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <a
              href={opsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 border border-[#E8E4E3] rounded-[4px] hover:border-[#007b8b] hover:text-[#007b8b] transition-colors"
            >
              Ops Login
              <ArrowSquareOut size={14} />
            </a>
            <Link
              to="/product/app"
              className="px-4 py-2 text-sm font-semibold text-white bg-[#007b8b] rounded-[4px] hover:bg-[#006272] active:scale-[0.98] transition-all"
            >
              Tải ứng dụng
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-2 text-gray-700"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? 'Đóng menu' : 'Mở menu'}
          >
            {mobileOpen ? <X size={22} /> : <List size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-[#E8E4E3] bg-white">
          <nav className="mx-auto max-w-7xl px-4 py-4 flex flex-col gap-1">
            <p className="px-3 pt-1 pb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
              Sản phẩm
            </p>
            <Link
              to="/product/map"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-[#007b8b] rounded-[8px] hover:bg-[#F8F7F7]"
            >
              Bản Đồ Biển Báo
            </Link>
            <Link
              to="/product/app"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-[#007b8b] rounded-[8px] hover:bg-[#F8F7F7]"
            >
              Tải Ứng Dụng
            </Link>
            <div className="my-2 border-t border-[#E8E4E3]" />
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-[#007b8b] rounded-[8px] hover:bg-[#F8F7F7]"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2 px-3">
              <a
                href={opsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-center py-2.5 text-sm font-medium text-gray-600 border border-[#E8E4E3] rounded-[4px]"
              >
                Ops Login ↗
              </a>
              <Link
                to="/product/app"
                onClick={() => setMobileOpen(false)}
                className="text-center py-2.5 text-sm font-semibold text-white bg-[#007b8b] rounded-[4px]"
              >
                Tải ứng dụng
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
