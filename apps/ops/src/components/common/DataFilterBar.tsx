import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { SearchBar } from './SearchBar'
import CustomSelect from './CustomSelect'

export interface FilterCategoryItem {
  id: string
  label: string
  count?: number
  icon?: ReactNode
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

  children?: ReactNode
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
  const effectivePlaceholder = searchPlaceholder || t('search')

  return (
    <div
      className={`bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5 ${className}`}
    >
      {/* Row 1: Search Bar (Flex-1) + Right-aligned Controls (Selects, Sort, Toggles, Actions) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <SearchBar
            value={searchQuery}
            onChange={onSearchChange}
            onClear={onClearSearch}
            placeholder={effectivePlaceholder}
            className="w-full"
          />
        </div>

        {/* Right side controls */}
        {(children || (sortOptions.length > 0 && selectedSort && onSelectSort)) && (
          <div className="flex flex-wrap items-center gap-2.5 self-end sm:self-auto shrink-0">
            {sortOptions.length > 0 && selectedSort && onSelectSort && (
              <div className="shrink-0 min-w-[160px]">
                <CustomSelect
                  prefixLabel={t('sort_prefix', { defaultValue: 'Sắp xếp:' })}
                  options={sortOptions.map((opt) => ({
                    value: opt.id,
                    label: opt.label,
                  }))}
                  value={selectedSort}
                  onChange={onSelectSort}
                  size="sm"
                />
              </div>
            )}
            {children}
          </div>
        )}
      </div>

      {/* Row 2: Category / Status Filter Pills with Badges */}
      {categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5 overflow-x-auto scrollbar-none">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory?.(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? 'bg-[#007b8b] dark:bg-[#00c4de] text-white dark:text-black font-bold shadow-xs'
                    : 'bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 border border-gray-200/80 dark:border-white/10'
                }`}
              >
                {cat.icon && <span className="shrink-0">{cat.icon}</span>}
                <span>{cat.label}</span>
                {cat.count !== undefined && (
                  <span
                    className={`text-[11px] font-mono px-1.5 py-0.2 rounded-md ${
                      isActive
                        ? 'bg-black/15 dark:bg-black/20 text-white dark:text-black font-bold'
                        : 'bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-400'
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
