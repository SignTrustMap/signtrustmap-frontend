import React, { useState, useRef, useEffect } from 'react'
import { CaretDown, Check } from '@phosphor-icons/react'

export interface OptionItem {
  value: string
  label: string
  icon?: React.ReactNode
}

interface CustomSelectProps {
  options: OptionItem[]
  value: string
  onChange: (value: string) => void
  leftIcon?: React.ReactNode
  placeholder?: string
  className?: string
  buttonClassName?: string
  dropdownClassName?: string
  size?: 'sm' | 'md'
  disabled?: boolean
}

export default function CustomSelect({
  options,
  value,
  onChange,
  leftIcon,
  placeholder,
  className = '',
  buttonClassName = '',
  dropdownClassName = '',
  size = 'md',
  disabled = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  // Close on click outside
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
      ? 'px-3 py-1.5 text-xs rounded-lg min-h-[34px]'
      : 'px-3.5 py-2 text-xs sm:text-sm rounded-xl min-h-[40px]'

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full bg-white dark:bg-[#061115] border text-left flex items-center justify-between gap-2.5 font-medium transition-all cursor-pointer select-none ${sizeClasses} ${
          isOpen
            ? 'border-[#007b8b] ring-2 ring-[#007b8b]/20 dark:border-[#00c4de] dark:ring-[#00c4de]/20'
            : 'border-[#E8E4E3] dark:border-white/15 hover:border-gray-300 dark:hover:border-white/25'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${buttonClassName}`}
      >
        <div className="flex items-center gap-2 min-w-0 truncate">
          {leftIcon && <span className="text-gray-400 shrink-0">{leftIcon}</span>}
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          <span className="truncate text-gray-900 dark:text-white font-semibold">
            {selectedOption ? selectedOption.label : placeholder || ''}
          </span>
        </div>

        <CaretDown
          size={14}
          weight="bold"
          className={`text-gray-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#007b8b] dark:text-[#00c4de]' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute left-0 top-full mt-1 w-full min-w-[160px] bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/15 rounded-xl shadow-xl z-50 overflow-hidden py-1 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto ${dropdownClassName}`}
        >
          {options.map((option) => {
            const isSelected = option.value === value
            return (
              <div
                key={option.value}
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={`px-3.5 py-2 flex items-center justify-between text-xs sm:text-sm font-medium transition-colors cursor-pointer select-none ${
                  isSelected
                    ? 'bg-[#007b8b]/10 dark:bg-[#00c4de]/15 text-[#007b8b] dark:text-[#00c4de] font-bold'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5'
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
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
