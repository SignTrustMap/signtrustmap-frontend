import React from 'react'
import { useTranslation } from 'react-i18next'
import { MagnifyingGlass, X } from '@phosphor-icons/react'
import { useTheme } from '@/context/ThemeContext'
import { CustomSelect } from './CustomSelect'

export interface FilterCategoryItem {
  id: string
  label: string
  count?: number
  icon?: React.ReactNode
}

export interface SortOptionItem {
  id: string
  label: string
}

export interface DataFilterBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  searchPlaceholder?: string

  categories?: FilterCategoryItem[]
  selectedCategory?: string
  onSelectCategory?: (id: string) => void

  sortOptions?: SortOptionItem[]
  selectedSort?: string
  onSelectSort?: (id: string) => void

  className?: string
}

export function DataFilterBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  categories = [],
  selectedCategory,
  onSelectCategory,
  sortOptions = [],
  selectedSort,
  onSelectSort,
  className = '',
}: DataFilterBarProps) {
  const { t } = useTranslation('common')
  const { isDark } = useTheme()
  const effectivePlaceholder = searchPlaceholder || t('common.search_placeholder')

  return (
    <div className={`space-y-3.5 ${className}`}>
      {/* Top row: Search input + Custom Sort Dropdown */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <MagnifyingGlass
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={effectivePlaceholder}
            className={`w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border outline-none transition-colors ${
              isDark
                ? 'bg-black/30 border-white/15 text-white focus:border-[#00c4de] placeholder-gray-500'
                : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-[#007b8b] placeholder-gray-400'
            }`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
              title={t('common.clear_search')}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Normal Standard Sort Dropdown */}
        {sortOptions.length > 0 && selectedSort && onSelectSort && (
          <div className="shrink-0">
            <CustomSelect
              prefixLabel={t('common.sort_prefix')}
              options={sortOptions.map((opt) => ({
                value: opt.id,
                label: opt.label,
              }))}
              value={selectedSort}
              onChange={onSelectSort}
              size="sm"
              className="min-w-[175px]"
            />
          </div>
        )}
      </div>

      {/* Bottom row: Category filter tabs / pills */}
      {categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory?.(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? isDark
                      ? 'bg-[#00c4de] text-black shadow-xs'
                      : 'bg-[#007b8b] text-white shadow-xs'
                    : isDark
                    ? 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
                }`}
              >
                {cat.icon && <span className="shrink-0">{cat.icon}</span>}
                <span>{cat.label}</span>
                {cat.count !== undefined && (
                  <span
                    className={`text-[11px] font-mono px-1.5 py-0.2 rounded-md ${
                      isActive
                        ? isDark
                          ? 'bg-black/20 text-black'
                          : 'bg-white/25 text-white'
                        : 'opacity-70'
                    }`}
                  >
                    {cat.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
