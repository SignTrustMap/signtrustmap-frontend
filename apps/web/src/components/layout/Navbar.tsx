import { useState, useRef, useEffect } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { CaretDown, List, X, UserCircle, SignOut } from '@phosphor-icons/react'
import { MegaDropdown } from './MegaDropdown'
import { useTheme } from '@/context/ThemeContext'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/context/AuthContext'
import { UserDropdownMenu } from './UserDropdownMenu'

export function Navbar() {
  const { isDark } = useTheme()
  const { t } = useTranslation('common')
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [productOpen, setProductOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Standard Base Navigation Links (Never modified or bloated)
  const navLinks = [
    { label: t('nav.docs'), href: '/docs' },
    { label: t('nav.about'), href: '/about' },
  ]

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProductOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false)
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
        setUserDropdownOpen(false)
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  const getRoleLabel = (role: string) => {
    const r = (role || '').trim().toLowerCase()
    switch (r) {
      case 'admin':
        return 'Admin'
      case 'staff':
        return 'Staff'
      case 'reviewer':
        return 'Reviewer'
      case 'surveyor':
        return 'Surveyor'
      default:
        return 'Driver'
    }
  }

  const getShortName = (fullName: string) => {
    if (!fullName) return ''
    const words = fullName.trim().split(/\s+/)
    if (words.length <= 2) return fullName
    return words.slice(-2).join(' ')
  }

  return (
    <>
      <header
        className={`w-full backdrop-blur-xl transition-colors border-b ${
          isDark
            ? 'bg-[#030708]/90 border-white/10 text-white'
            : 'bg-white/90 border-[#E8E4E3] text-gray-900 shadow-sm'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-18 items-center justify-between gap-6">
            {/* Logo with Brand Asset */}
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

            {/* Desktop Navigation (Kept original & clean) */}
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
                  <span>{t('nav.product')}</span>
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
                          ? 'text-[#00c4de] bg-white/10 font-semibold'
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

            {/* Right Action Area (Replaced with User Profile & Dropdown when logged in) */}
            <div className="hidden lg:flex items-center gap-3 shrink-0 relative">
              {isAuthenticated && user ? (
                /* User Capsule Container */
                <div ref={userMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setUserDropdownOpen((prev) => !prev)}
                    className={`flex items-center gap-2.5 py-1 px-3 rounded-full border transition-colors duration-150 cursor-pointer select-none ${
                      userDropdownOpen
                        ? isDark
                          ? 'bg-white/10 border-[#00c4de]/50 shadow-md shadow-[#00c4de]/10'
                          : 'bg-gray-100 border-[#007b8b]/50 shadow-md shadow-[#007b8b]/10'
                        : isDark
                        ? 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20'
                        : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 shadow-xs'
                    }`}
                  >
                    {/* Avatar */}
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover border border-[#00c4de] shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#00c4de]/20 text-[#00c4de] flex items-center justify-center font-bold text-xs shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    {/* Name (Top, 2 words) & Role (Bottom) - Full name in tooltip */}
                    <div
                      className="text-left flex flex-col justify-center leading-none"
                      title={user.name}
                    >
                      <span className={`text-xs font-bold block leading-none truncate max-w-[130px] ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {getShortName(user.name)}
                      </span>
                      <span className={`text-[10px] font-mono capitalize block leading-none mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </div>

                    <CaretDown
                      size={14}
                      className={`text-gray-400 transition-transform duration-200 shrink-0 ${
                        userDropdownOpen ? 'rotate-180 text-[#00c4de]' : ''
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  <UserDropdownMenu
                    isOpen={userDropdownOpen}
                    onClose={() => setUserDropdownOpen(false)}
                  />
                </div>
              ) : (
                /* Guest State: Original Log In & Sign Up Buttons */
                <>
                  <Link
                    to="/login"
                    state={{ from: location.pathname }}
                    className={`px-4 py-2 text-[15px] font-medium transition-colors ${
                      isDark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-black'
                    }`}
                  >
                    {t('nav.login')}
                  </Link>
                  <Link
                    to="/signup"
                    state={{ from: location.pathname }}
                    className={`px-5 py-2 text-[15px] font-bold rounded-full shadow-md active:scale-[0.98] transition-all ${
                      isDark
                        ? 'text-black bg-[#00c4de] hover:bg-[#38dbf1] shadow-[#00c4de]/25 hover:shadow-[#00c4de]/40'
                        : 'text-white bg-[#007b8b] hover:bg-[#00606d] shadow-[#007b8b]/20 hover:shadow-[#007b8b]/30'
                    }`}
                  >
                    {t('nav.signup')}
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className={`lg:hidden p-2 transition-colors ${
                isDark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-black'
              }`}
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? t('nav.close_menu') : t('nav.open_menu')}
            >
              {mobileOpen ? <X size={24} /> : <List size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className={`lg:hidden border-t px-4 py-6 space-y-4 ${
            isDark ? 'bg-[#061417] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <nav className="flex flex-col gap-2">
              <Link
                to="/product/map"
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2 text-sm font-semibold rounded-xl hover:bg-white/10"
              >
                🗺️ {t('nav.mobile_map')}
              </Link>
              <Link
                to="/catalog"
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2 text-sm font-semibold rounded-xl hover:bg-white/10"
              >
                📖 {t('nav.catalog')}
              </Link>
              {isAuthenticated && (user?.role === 'surveyor' || user?.role === 'reviewer') && (
                <Link
                  to="/survey"
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2 text-sm font-semibold rounded-xl hover:bg-white/10"
                >
                  📹 {t('nav.survey_studio')}
                </Link>
              )}
              {isAuthenticated && user?.role === 'reviewer' && (
                <Link
                  to="/review"
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2 text-sm font-semibold rounded-xl hover:bg-white/10"
                >
                  ⚖️ {t('nav.review_queue')}
                </Link>
              )}
              {isAuthenticated && user?.role !== 'staff' && user?.role !== 'admin' && (
                <Link
                  to="/wallet"
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2 text-sm font-semibold rounded-xl hover:bg-white/10"
                >
                  🪙 {t('nav.wallet')}
                </Link>
              )}
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2 text-sm font-semibold rounded-xl hover:bg-white/10"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="pt-4 border-t border-white/10">
              {isAuthenticated && user ? (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false)
                      navigate('/profile')
                    }}
                    className={`w-full py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-colors ${
                      isDark ? 'border-white/10 bg-white/5 text-white' : 'border-gray-200 bg-gray-50 text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <UserCircle size={18} />
                      <span>{user.name}</span>
                    </div>
                    <span className="font-mono text-[10px] uppercase text-[#00c4de]">{user.role}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      logout()
                      setMobileOpen(false)
                      navigate('/', { replace: true })
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-red-500/15 text-red-400 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <SignOut size={16} />
                    <span>{t('user_menu.sign_out')}</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="w-full py-2.5 rounded-xl border border-white/15 text-center text-xs font-semibold"
                  >
                    {t('nav.login')}
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileOpen(false)}
                    className={`w-full py-2.5 rounded-xl text-center text-xs font-bold ${
                      isDark ? 'bg-[#00c4de] text-black' : 'bg-[#007b8b] text-white'
                    }`}
                  >
                    {t('nav.signup')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  )
}
