import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { CaretDown, Check } from '@phosphor-icons/react'
import { useTheme } from '@/context/ThemeContext'

export interface SelectOption {
  value: string
  label: string
  icon?: React.ReactNode
}

export interface CustomSelectProps {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  prefixLabel?: string
  placeholder?: string
  className?: string
  dropdownClassName?: string
  size?: 'sm' | 'md'
  disabled?: boolean
}

export function CustomSelect({
  options,
  value,
  onChange,
  prefixLabel,
  placeholder,
  className = '',
  dropdownClassName = '',
  size = 'md',
  disabled = false,
}: CustomSelectProps) {
  const { t } = useTranslation('common')
  const { isDark } = useTheme()
  const displayPlaceholder = placeholder || t('common.select_placeholder')
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const sizeClasses =
    size === 'sm'
      ? 'px-3 py-1.5 text-xs rounded-xl min-h-[34px]'
      : 'px-3.5 py-2 text-xs sm:text-sm rounded-xl min-h-[40px]'

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2.5 font-medium transition-all cursor-pointer select-none border ${sizeClasses} ${
          isDark
            ? isOpen
              ? 'bg-[#071317] border-[#00c4de] text-white ring-2 ring-[#00c4de]/20'
              : 'bg-[#071317] border-white/15 text-gray-200 hover:border-white/30 hover:bg-white/5'
            : isOpen
            ? 'bg-white border-[#007b8b] text-gray-900 ring-2 ring-[#007b8b]/15 shadow-xs'
            : 'bg-white border-[#E8E4E3] text-gray-800 hover:border-gray-400 hover:bg-gray-50/80 shadow-xs'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center gap-1.5 min-w-0 truncate">
          {prefixLabel && (
            <span className="text-gray-500 dark:text-gray-400 font-normal shrink-0">
              {prefixLabel}
            </span>
          )}
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          <span className="truncate font-semibold text-gray-900 dark:text-white">
            {selectedOption ? selectedOption.label : displayPlaceholder}
          </span>
        </div>

        <CaretDown
          size={14}
          weight="bold"
          className={`shrink-0 transition-transform duration-200 text-gray-400 ${
            isOpen ? 'rotate-180 text-[#007b8b] dark:text-[#00c4de]' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 top-full mt-1.5 min-w-full w-max max-w-[280px] rounded-2xl border shadow-xl z-50 overflow-hidden py-1 backdrop-blur-md animate-fadeIn ${
            isDark
              ? 'bg-[#071317]/95 border-white/15 text-gray-200 shadow-black/80'
              : 'bg-white/95 border-[#E8E4E3] text-gray-800 shadow-gray-200/80'
          } ${dropdownClassName}`}
        >
          <div className="space-y-0.5 px-1 py-0.5">
            {options.map((option) => {
              const isSelected = option.value === value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer text-left ${
                    isSelected
                      ? isDark
                        ? 'bg-[#00c4de]/15 text-[#00c4de] font-bold'
                        : 'bg-[#007b8b]/10 text-[#007b8b] font-bold'
                      : isDark
                      ? 'hover:bg-white/10 text-gray-200'
                      : 'hover:bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {option.icon && <span className="shrink-0">{option.icon}</span>}
                    <span className="truncate">{option.label}</span>
                  </div>
                  {isSelected && (
                    <Check
                      size={14}
                      weight="bold"
                      className="text-[#007b8b] dark:text-[#00c4de] shrink-0 ml-2"
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
