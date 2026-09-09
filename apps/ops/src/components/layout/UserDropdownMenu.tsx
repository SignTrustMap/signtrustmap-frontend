import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  UserCircle,
  SignOut,
} from '@phosphor-icons/react'
import { useAuth } from '@/features/auth/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { useTranslation } from 'react-i18next'

interface UserDropdownMenuProps {
  isOpen: boolean
  onClose: () => void
  onOpenProfile?: () => void
}

export function UserDropdownMenu({ isOpen, onClose, onOpenProfile }: UserDropdownMenuProps) {
  const { user, logout } = useAuth()
  const { isDark } = useTheme()
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (target?.closest('[data-user-menu-trigger]')) {
        return
      }
      if (menuRef.current && !menuRef.current.contains(target)) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen || !user) return null

  const isAdmin = user.role === 'admin'
  const profileHref = isAdmin ? '/settings' : '/staff/USR-002'

  function handleLogout() {
    onClose()
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label={t('nav.account_profile', { defaultValue: 'Account Profile' })}
      className={`absolute left-3 right-3 bottom-full mb-2 rounded-2xl border shadow-xl overflow-hidden z-50 animate-fadeIn transition-all select-none p-1.5 ${
        isDark
          ? 'bg-[#071317] border-white/10 text-white shadow-2xl shadow-black/80 ring-1 ring-white/10'
          : 'bg-white border-[#E8E4E3] text-gray-900 shadow-xl ring-1 ring-black/5'
      }`}
    >
      {/* ─── Button 1: Account Profile ─── */}
      <button
        type="button"
        onClick={() => {
          onClose()
          if (onOpenProfile) {
            onOpenProfile()
          } else {
            navigate(profileHref)
          }
        }}
        role="menuitem"
        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer text-left ${
          isDark
            ? 'hover:bg-white/5 text-gray-200 hover:text-white'
            : 'hover:bg-gray-100 text-gray-800 hover:text-gray-900'
        }`}
      >
        <UserCircle size={18} weight="duotone" className="text-[#007b8b] dark:text-[#00c4de] shrink-0" />
        <span className="truncate">{t('nav.account_profile', { defaultValue: 'Account Profile' })}</span>
      </button>

      <div className="my-1 border-t border-gray-100 dark:border-white/10" />

      {/* ─── Button 2: Sign Out ─── */}
      <button
        type="button"
        onClick={handleLogout}
        role="menuitem"
        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer text-left ${
          isDark
            ? 'text-red-400 hover:bg-red-500/10'
            : 'text-red-600 hover:bg-red-50'
        }`}
      >
        <SignOut size={18} weight="bold" className="shrink-0" />
        <span className="truncate">{t('nav.logout', { defaultValue: 'Sign out' })}</span>
      </button>
    </div>
  )
}
