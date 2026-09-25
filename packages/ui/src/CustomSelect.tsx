import React, { useState, useRef, useEffect } from 'react'
import { CaretDown, Check } from '@phosphor-icons/react'

export interface OptionItem {
  value: string
  label: string
  icon?: React.ReactNode
}

export type SelectOption = OptionItem

export interface CustomSelectProps {
  options: OptionItem[]
  value: string
  onChange: (value: string) => void
  prefixLabel?: string
  leftIcon?: React.ReactNode
  placeholder?: string
  className?: string
  buttonClassName?: string
  dropdownClassName?: string
  size?: 'sm' | 'md'
  disabled?: boolean
  direction?: 'down' | 'up' | 'auto'
  align?: 'left' | 'right'
}

export function CustomSelect({
  options,
  value,
  onChange,
  prefixLabel,
  leftIcon,
  placeholder = 'Chọn một mục...',
  className = '',
  buttonClassName = '',
  dropdownClassName = '',
  size = 'md',
  disabled = false,
  direction = 'auto',
  align = 'left',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [computedDirection, setComputedDirection] = useState<'down' | 'up'>(
    direction === 'up' ? 'up' : 'down'
  )
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

  // Auto calculate direction (up or down) based on viewport
  useEffect(() => {
    if (isOpen && direction === 'auto' && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      const estimatedDropdownHeight = Math.min(options.length * 36 + 16, 260)

      if (spaceBelow < estimatedDropdownHeight && spaceAbove > spaceBelow) {
        setComputedDirection('up')
      } else {
        setComputedDirection('down')
      }
    } else if (direction !== 'auto') {
      setComputedDirection(direction)
    }
  }, [isOpen, direction, options.length])

  const handleSelect = (val: string) => {
    onChange(val)
    setIsOpen(false)
  }

  const isSmall = size === 'sm'

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`flex items-center justify-between gap-2 rounded-xl transition-all duration-150 cursor-pointer select-none font-medium border ${
          disabled
            ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-400'
            : isOpen
            ? 'bg-white dark:bg-[#071317] border-[#00c4de] ring-2 ring-[#00c4de]/20 text-gray-900 dark:text-white shadow-xs'
            : 'bg-white dark:bg-[#071317] border-gray-200/80 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 shadow-2xs'
        } ${isSmall ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-xs sm:text-sm'} ${buttonClassName}`}
      >
        <div className="flex items-center gap-1.5 truncate">
          {leftIcon && <span className="shrink-0 text-gray-400 dark:text-gray-500">{leftIcon}</span>}
          {prefixLabel && (
            <span className="text-gray-400 dark:text-gray-500 font-normal shrink-0">
              {prefixLabel}:
            </span>
          )}
          {selectedOption ? (
            <span className="truncate flex items-center gap-1.5 text-gray-900 dark:text-white font-medium">
              {selectedOption.icon && <span className="shrink-0">{selectedOption.icon}</span>}
              {selectedOption.label}
            </span>
          ) : (
            <span className="text-gray-400 dark:text-gray-500 truncate">{placeholder}</span>
          )}
        </div>

        <CaretDown
          size={isSmall ? 12 : 14}
          weight="bold"
          className={`shrink-0 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#00c4de]' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          className={`absolute z-50 min-w-full w-max max-w-xs rounded-xl bg-white dark:bg-[#071317] border border-gray-200 dark:border-white/10 shadow-xl overflow-hidden py-1 max-h-64 overflow-y-auto focus:outline-none animate-in fade-in-0 zoom-in-95 duration-100 ${
            computedDirection === 'up' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          } ${align === 'right' ? 'right-0' : 'left-0'} ${dropdownClassName}`}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(opt.value)}
                className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 text-left cursor-pointer transition-colors duration-150 select-none ${
                  isSmall ? 'text-xs' : 'text-xs sm:text-sm'
                } ${
                  isSelected
                    ? 'bg-[#00c4de]/10 text-[#007b8b] dark:text-[#00c4de] font-semibold'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white font-normal'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                  <span className="truncate">{opt.label}</span>
                </div>
                {isSelected && (
                  <Check
                    size={isSmall ? 12 : 14}
                    weight="bold"
                    className="shrink-0 text-[#007b8b] dark:text-[#00c4de]"
                  />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default CustomSelect
