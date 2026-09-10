import { useTranslation } from 'react-i18next'
import { CaretLeft, CaretRight, CaretDoubleLeft, CaretDoubleRight, DotsThree } from '@phosphor-icons/react'
import { useTheme } from '@/context/ThemeContext'
import { CustomSelect } from './CustomSelect'

export interface PaginationProps {
  currentPage: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  pageSizeOptions?: number[]
  itemLabel?: string
  className?: string
  showPageSizeSelector?: boolean
}

export function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20],
  itemLabel,
  className = '',
  showPageSizeSelector = true,
}: PaginationProps) {
  const { t } = useTranslation('common')
  const { isDark } = useTheme()
  const displayItemLabel = itemLabel || t('pagination.default_item')

  if (totalItems <= 0) {
    return null
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages)

  const startItem = (safeCurrentPage - 1) * pageSize + 1
  const endItem = Math.min(safeCurrentPage * pageSize, totalItems)

  const handleFirst = () => {
    if (safeCurrentPage > 1) {
      onPageChange(1)
    }
  }

  const handlePrev = () => {
    if (safeCurrentPage > 1) {
      onPageChange(safeCurrentPage - 1)
    }
  }

  const handleNext = () => {
    if (safeCurrentPage < totalPages) {
      onPageChange(safeCurrentPage + 1)
    }
  }

  const handleLast = () => {
    if (safeCurrentPage < totalPages) {
      onPageChange(totalPages)
    }
  }

  // Calculate visible page buttons
  const getPageNumbers = (): (number | string)[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    if (safeCurrentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages]
    }
    if (safeCurrentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    }
    return [1, '...', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, '...', totalPages]
  }

  const pageNumbers = getPageNumbers()

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t ${
        isDark ? 'border-white/10 text-gray-400' : 'border-gray-200 text-gray-600'
      } ${className}`}
    >
      {/* ─── Left: Showing count ────────────────────────────────────────── */}
      <div className="text-xs font-medium order-2 sm:order-1 text-center sm:text-left">
        {t('pagination.showing')}{' '}
        <span className="font-bold text-gray-900 dark:text-white">
          {startItem} - {endItem}
        </span>{' '}
        {t('pagination.of')}{' '}
        <span className="font-bold text-gray-900 dark:text-white">{totalItems}</span>{' '}
        {displayItemLabel}
      </div>

      {/* ─── Middle: Page Navigation ────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 order-1 sm:order-2">
        {/* First page button */}
        <button
          type="button"
          disabled={safeCurrentPage <= 1}
          onClick={handleFirst}
          title={t('pagination.first')}
          className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all cursor-pointer border ${
            safeCurrentPage <= 1
              ? 'opacity-40 cursor-not-allowed border-transparent text-gray-400 dark:text-gray-600'
              : isDark
              ? 'bg-[#071317] border-white/15 text-gray-200 hover:bg-white/10 hover:border-white/30'
              : 'bg-white border-[#E8E4E3] text-gray-700 hover:bg-gray-100 hover:border-gray-300 shadow-2xs'
          }`}
        >
          <CaretDoubleLeft size={14} weight="bold" />
        </button>

        {/* Prev button */}
        <button
          type="button"
          disabled={safeCurrentPage <= 1}
          onClick={handlePrev}
          title={t('pagination.prev')}
          className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all cursor-pointer border ${
            safeCurrentPage <= 1
              ? 'opacity-40 cursor-not-allowed border-transparent text-gray-400 dark:text-gray-600'
              : isDark
              ? 'bg-[#071317] border-white/15 text-gray-200 hover:bg-white/10 hover:border-white/30'
              : 'bg-white border-[#E8E4E3] text-gray-700 hover:bg-gray-100 hover:border-gray-300 shadow-2xs'
          }`}
        >
          <CaretLeft size={14} weight="bold" />
        </button>

        {/* Explicit Page indicator (RULE.md 2.4: Hiển thị rõ ràng Trang X / Y) */}
        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100/90 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 text-gray-700 dark:text-gray-300 font-mono select-none">
          {t('pagination.page')}{' '}
          <span className="font-bold text-gray-900 dark:text-white">{safeCurrentPage}</span> /{' '}
          <span className="font-bold text-gray-900 dark:text-white">{totalPages}</span>
        </span>

        {/* Desktop full page numbers (shown when more than 1 page for quick jumping) */}
        {totalPages > 1 && (
          <div className="hidden md:flex items-center gap-1">
            {pageNumbers.map((item, idx) => {
              if (typeof item === 'string') {
                return (
                  <div
                    key={`ellipsis-${idx}`}
                    className="h-8 w-6 flex items-center justify-center text-gray-400 dark:text-gray-600"
                  >
                    <DotsThree size={16} weight="bold" />
                  </div>
                )
              }

              const isCurrent = item === safeCurrentPage

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => onPageChange(item)}
                  className={`h-8 min-w-[32px] px-2 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                    isCurrent
                      ? isDark
                        ? 'bg-[#00c4de] border-[#00c4de] text-[#071317] shadow-sm shadow-[#00c4de]/25'
                        : 'bg-[#007b8b] border-[#007b8b] text-white shadow-xs'
                      : isDark
                      ? 'bg-[#071317] border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
                      : 'bg-white border-[#E8E4E3] text-gray-700 hover:bg-gray-100 hover:border-gray-300 shadow-2xs'
                  }`}
                >
                  {item}
                </button>
              )
            })}
          </div>
        )}

        {/* Next button */}
        <button
          type="button"
          disabled={safeCurrentPage >= totalPages}
          onClick={handleNext}
          title={t('pagination.next')}
          className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all cursor-pointer border ${
            safeCurrentPage >= totalPages
              ? 'opacity-40 cursor-not-allowed border-transparent text-gray-400 dark:text-gray-600'
              : isDark
              ? 'bg-[#071317] border-white/15 text-gray-200 hover:bg-white/10 hover:border-white/30'
              : 'bg-white border-[#E8E4E3] text-gray-700 hover:bg-gray-100 hover:border-gray-300 shadow-2xs'
          }`}
        >
          <CaretRight size={14} weight="bold" />
        </button>

        {/* Last page button */}
        <button
          type="button"
          disabled={safeCurrentPage >= totalPages}
          onClick={handleLast}
          title={t('pagination.last')}
          className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all cursor-pointer border ${
            safeCurrentPage >= totalPages
              ? 'opacity-40 cursor-not-allowed border-transparent text-gray-400 dark:text-gray-600'
              : isDark
              ? 'bg-[#071317] border-white/15 text-gray-200 hover:bg-white/10 hover:border-white/30'
              : 'bg-white border-[#E8E4E3] text-gray-700 hover:bg-gray-100 hover:border-gray-300 shadow-2xs'
          }`}
        >
          <CaretDoubleRight size={14} weight="bold" />
        </button>
      </div>

      {/* ─── Right: Page Size Selector (Optional) ──────────────────────── */}
      {showPageSizeSelector && onPageSizeChange && pageSizeOptions.length > 1 && (
        <div className="order-3 flex items-center gap-1.5 text-xs">
          <CustomSelect
            size="sm"
            direction="up"
            align="right"
            value={String(pageSize)}
            onChange={(val) => onPageSizeChange(Number(val))}
            options={pageSizeOptions.map((sz) => ({
              value: String(sz),
              label: `${sz} ${t('pagination.per_page')}`,
            }))}
            className="w-28"
          />
        </div>
      )}
    </div>
  )
}
