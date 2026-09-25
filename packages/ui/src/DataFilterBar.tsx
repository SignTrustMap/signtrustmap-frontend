import React from 'react'
import { useTranslation } from 'react-i18next'
import { MagnifyingGlass, X } from '@phosphor-icons/react'
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
  onClearSearch?: () => void

  categories?: FilterCategoryItem[]
  selectedCategory?: string
  onSelectCategory?: (id: string) => void

  sortOptions?: SortOptionItem[]
  selectedSort?: string
  onSelectSort?: (id: string) => void

  children?: React.ReactNode
  className?: string
}

export function DataFilterBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  onClearSearch,
  categories = [],
  selectedCategory,
  onSelectCategory,
  sortOptions = [],
  selectedSort,
  onSelectSort,
  children,
  className = '',
}: DataFilterBarProps) {
  const { t } = useTranslation('common')
  const effectivePlaceholder = searchPlaceholder || t('common.search_placeholder', 'Tìm kiếm...')

  const handleClear = () => {
    onSearchChange('')
    if (onClearSearch) onClearSearch()
  }

  return (
    <div
      className={`bg-white dark:bg-[#071317] border border-gray-200/80 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5 ${className}`}
    >
      {/* Top row: Search input + Controls (Sort Dropdown, Custom Selects, View toggles via children) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-0">
          <MagnifyingGlass
            size={16}
            weight="bold"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={effectivePlaceholder}
            className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-[#00c4de] focus:ring-2 focus:ring-[#00c4de]/20 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5 rounded cursor-pointer"
            >
              <X size={14} weight="bold" />
            </button>
          )}
        </div>

        {/* Right controls: Sort Dropdown + Additional Controls (children) */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {sortOptions.length > 0 && onSelectSort && selectedSort && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                {t('filter.sort_by', 'Sắp xếp')}:
              </span>
              <CustomSelect
                size="sm"
                value={selectedSort}
                onChange={onSelectSort}
                options={sortOptions.map((opt) => ({
                  value: opt.id,
                  label: opt.label,
                }))}
                className="w-36"
              />
            </div>
          )}

          {children}
        </div>
      </div>

      {/* Bottom row: Category filter chips (Pills) */}
      {categories.length > 0 && onSelectCategory && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#00c4de] text-gray-950 shadow-xs font-semibold'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {cat.icon && <span className="shrink-0">{cat.icon}</span>}
                <span>{cat.label}</span>
                {typeof cat.count === 'number' && (
                  <span
                    className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isSelected
                        ? 'bg-black/20 text-gray-950'
                        : 'bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400'
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

export default DataFilterBar
