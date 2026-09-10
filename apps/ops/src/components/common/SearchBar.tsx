import { useRef } from 'react'
import { MagnifyingGlass, X } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'

export interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onClear?: () => void
  placeholder?: string
  className?: string
  inputClassName?: string
  size?: 'sm' | 'md' | 'lg'
  autoFocus?: boolean
  disabled?: boolean
  id?: string
}

export function SearchBar({
  value,
  onChange,
  onClear,
  placeholder,
  className = '',
  inputClassName = '',
  size = 'md',
  autoFocus = false,
  disabled = false,
  id,
}: SearchBarProps) {
  const { t } = useTranslation('common')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClear = () => {
    onChange('')
    onClear?.()
    inputRef.current?.focus()
  }

  const sizeClasses = {
    sm: 'py-1.5 pl-8 pr-7 text-xs rounded-lg',
    md: 'py-2 pl-9.5 pr-8 text-xs sm:text-sm rounded-xl',
    lg: 'py-2.5 pl-10 pr-9 text-sm rounded-xl',
  }[size]

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 18,
  }[size]

  const iconOffsets = {
    sm: 'left-2.5',
    md: 'left-3',
    lg: 'left-3.5',
  }[size]

  const clearOffsets = {
    sm: 'right-2',
    md: 'right-2.5',
    lg: 'right-3',
  }[size]

  return (
    <div className={`relative flex-1 ${className}`}>
      <MagnifyingGlass
        size={iconSizes}
        className={`absolute ${iconOffsets} top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none transition-colors`}
      />
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || t('common.search')}
        autoFocus={autoFocus}
        disabled={disabled}
        className={`w-full border outline-none transition-all duration-150 ${sizeClasses} ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        } bg-gray-50/90 hover:bg-gray-100/60 dark:bg-[#061115] dark:hover:bg-black/30 border-gray-200/90 dark:border-white/15 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:bg-white dark:focus:bg-black/40 focus:ring-2 focus:ring-[#007b8b]/20 focus:border-[#007b8b] dark:focus:ring-[#00c4de]/20 dark:focus:border-[#00c4de] ${inputClassName}`}
      />
      {value && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          className={`absolute ${clearOffsets} top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-white/10 transition-colors cursor-pointer`}
          title={t('common.clear_search', 'Clear search')}
          aria-label={t('common.clear_search', 'Clear search')}
        >
          <X size={size === 'sm' ? 12 : 14} weight="bold" />
        </button>
      )}
    </div>
  )
}

export default SearchBar
