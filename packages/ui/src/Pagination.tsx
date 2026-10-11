import { useTranslation } from 'react-i18next'
import { CaretLeft, CaretRight, CaretDoubleLeft, CaretDoubleRight, DotsThree } from '@phosphor-icons/react'
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
  const displayItemLabel = itemLabel || t('pagination.default_item', 'mục')

  if (totalItems <= 0) {
    return null
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const startItem = Math.min((currentPage - 1) * pageSize + 1, totalItems)
  const endItem = Math.min(currentPage * pageSize, totalItems)

  // Generate page numbers with ellipses
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const pages: (number | 'ellipsis')[] = [1]

    if (currentPage > 3) {
      pages.push('ellipsis')
    }

    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (currentPage < totalPages - 2) {
      pages.push('ellipsis')
    }

    pages.push(totalPages)
    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-1 text-xs text-gray-500 dark:text-gray-400 select-none ${className}`}
    >
      {/* Left: Summary and Page Size Selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <span>
          {t('pagination.showing', 'Hiển thị')}{' '}
          <strong className="text-gray-900 dark:text-white font-semibold">{startItem}</strong> -{' '}
          <strong className="text-gray-900 dark:text-white font-semibold">{endItem}</strong>{' '}
          {t('pagination.of', 'trong')}{' '}
          <strong className="text-gray-900 dark:text-white font-semibold">{totalItems}</strong> {displayItemLabel}
        </span>

        {showPageSizeSelector && onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-gray-400 dark:text-gray-500">{t('pagination.per_page', 'Số dòng/trang')}:</span>
            <CustomSelect
              size="sm"
              direction="auto"
              value={String(pageSize)}
              onChange={(val) => onPageSizeChange(Number(val))}
              options={pageSizeOptions.map((size) => ({
                value: String(size),
                label: `${size}`,
              }))}
              className="w-16"
            />
          </div>
        )}
      </div>

      {/* Right: Page Navigation Buttons */}
      <div className="flex items-center gap-1">
        {/* First Page */}
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(1)}
          aria-label={t('pagination.first_page', 'Trang đầu')}
          className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          <CaretDoubleLeft size={14} weight="bold" />
        </button>

        {/* Previous Page */}
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label={t('pagination.prev_page', 'Trang trước')}
          className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          <CaretLeft size={14} weight="bold" />
        </button>

        {/* Page Number Buttons */}
        <div className="flex items-center gap-1 mx-1">
          {pageNumbers.map((page, idx) => {
            if (page === 'ellipsis') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-1.5 py-1 text-gray-400 dark:text-gray-600 flex items-center justify-center"
                >
                  <DotsThree size={14} weight="bold" />
                </span>
              )
            }

            const isCurrent = page === currentPage
            return (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                aria-current={isCurrent ? 'page' : undefined}
                className={`min-w-7 h-7 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center ${
                  isCurrent
                    ? 'bg-[#00c4de] text-gray-950 shadow-xs'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {page}
              </button>
            )
          })}
        </div>

        {/* Next Page */}
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label={t('pagination.next_page', 'Trang sau')}
          className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          <CaretRight size={14} weight="bold" />
        </button>

        {/* Last Page */}
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(totalPages)}
          aria-label={t('pagination.last_page', 'Trang cuối')}
          className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          <CaretDoubleRight size={14} weight="bold" />
        </button>
      </div>
    </div>
  )
}

export default Pagination
