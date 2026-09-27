import { useTranslation } from 'react-i18next'
import { Modal } from '@/components/common/Modal'
import { BookOpen, MagnifyingGlass } from '@phosphor-icons/react'
import type { TrafficCatalogSign } from '@/data'

export type CatalogCategoryFilter =
  | 'all'
  | 'prohibitory'
  | 'warning'
  | 'mandatory'
  | 'guide'
  | 'additional'

interface ReviewerCatalogModalProps {
  isOpen: boolean
  catalogSearch: string
  catalogCat: CatalogCategoryFilter
  filteredCatalog: TrafficCatalogSign[]
  isDark: boolean
  onClose: () => void
  onSearchChange: (query: string) => void
  onCategoryChange: (category: CatalogCategoryFilter) => void
  onSelectSign: (signCode: string) => void
  onOpenNewSignModal: () => void
}

export function ReviewerCatalogModal({
  isOpen,
  catalogSearch,
  catalogCat,
  filteredCatalog,
  isDark,
  onClose,
  onSearchChange,
  onCategoryChange,
  onSelectSign,
  onOpenNewSignModal,
}: ReviewerCatalogModalProps) {
  const { t } = useTranslation('common')

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-3xl">
      <div
        className={`w-full rounded-2xl border shadow-2xl overflow-hidden ${
          isDark
            ? 'bg-[#071317] border-white/10 text-white'
            : 'bg-white border-gray-200 text-gray-900'
        }`}
      >
        <div className="p-5 sm:p-6 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpen size={22} className="text-[#007b8b] dark:text-[#00c4de]" weight="bold" />
            <h3 className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-white">
              {t('reviewer.modal_catalog_title')}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Category Filter Pills & Search Input */}
        <div className="p-5 border-b border-gray-200 dark:border-white/10 space-y-3 bg-gray-50/50 dark:bg-black/20">
          <div className="relative">
            <MagnifyingGlass
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={catalogSearch}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t('reviewer.modal_search_placeholder')}
              className={`w-full pl-11 pr-4 py-2.5 text-xs sm:text-sm font-medium rounded-xl border outline-none transition-all ${
                isDark
                  ? 'bg-black/40 border-white/15 text-white placeholder:text-gray-500 focus:border-[#00c4de]'
                  : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-[#007b8b]'
              }`}
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => onCategoryChange('all')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer shrink-0 ${
                catalogCat === 'all'
                  ? 'bg-[#007b8b] dark:bg-[#00c4de] text-white dark:text-black font-extrabold'
                  : isDark
                  ? 'bg-white/5 text-gray-300 hover:text-white'
                  : 'bg-white border border-gray-200 text-gray-700'
              }`}
            >
              {t('reviewer.catalog_cat_all')}
            </button>
            <button
              type="button"
              onClick={() => onCategoryChange('prohibitory')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer shrink-0 ${
                catalogCat === 'prohibitory'
                  ? 'bg-red-600 text-white font-extrabold'
                  : isDark
                  ? 'bg-white/5 text-red-300 hover:text-white'
                  : 'bg-white border border-gray-200 text-red-700'
              }`}
            >
              {t('reviewer.catalog_cat_p')}
            </button>
            <button
              type="button"
              onClick={() => onCategoryChange('warning')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer shrink-0 ${
                catalogCat === 'warning'
                  ? 'bg-amber-500 text-black font-extrabold'
                  : isDark
                  ? 'bg-white/5 text-amber-300 hover:text-white'
                  : 'bg-white border border-gray-200 text-amber-800'
              }`}
            >
              {t('reviewer.catalog_cat_w')}
            </button>
            <button
              type="button"
              onClick={() => onCategoryChange('mandatory')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer shrink-0 ${
                catalogCat === 'mandatory'
                  ? 'bg-blue-600 text-white font-extrabold'
                  : isDark
                  ? 'bg-white/5 text-blue-300 hover:text-white'
                  : 'bg-white border border-gray-200 text-blue-700'
              }`}
            >
              {t('reviewer.catalog_cat_r')}
            </button>
            <button
              type="button"
              onClick={() => onCategoryChange('guide')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer shrink-0 ${
                catalogCat === 'guide'
                  ? 'bg-[#007b8b] dark:bg-cyan-500 text-white dark:text-black font-extrabold'
                  : isDark
                  ? 'bg-white/5 text-cyan-300 hover:text-white'
                  : 'bg-white border border-gray-200 text-teal-700'
              }`}
            >
              {t('reviewer.catalog_cat_i')}
            </button>
            <button
              type="button"
              onClick={() => onCategoryChange('additional')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer shrink-0 ${
                catalogCat === 'additional'
                  ? 'bg-gray-700 text-white font-extrabold'
                  : isDark
                  ? 'bg-white/5 text-gray-300 hover:text-white'
                  : 'bg-white border border-gray-200 text-gray-700'
              }`}
            >
              {t('reviewer.catalog_cat_s')}
            </button>
          </div>
        </div>

        {/* Signs List */}
        <div className="max-h-96 overflow-y-auto divide-y divide-gray-100 dark:divide-white/5 p-3">
          {filteredCatalog.map((sign: TrafficCatalogSign) => (
            <button
              key={sign.code}
              type="button"
              onClick={() => {
                onSelectSign(sign.code)
                onClose()
              }}
              className={`w-full p-3.5 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer ${
                isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
              }`}
            >
              <div className="min-w-0 pr-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#007b8b]/10 dark:bg-[#00c4de]/15 text-[#007b8b] dark:text-[#00c4de] border border-[#007b8b]/30 dark:border-[#00c4de]/30">
                    {sign.code}
                  </span>
                  <span className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">
                    {sign.nameVi}
                  </span>
                  <span className="text-[10px] font-mono text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/5">
                    {sign.shape} • {sign.color}
                  </span>
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400 block mt-1">
                  {sign.nameEn}
                </span>
                <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400 block mt-0.5">
                  {sign.standardRef}
                </span>
              </div>

              <span className="text-xs font-bold text-[#007b8b] dark:text-[#00c4de] shrink-0">
                {t('reviewer.btn_select_approve')}
              </span>
            </button>
          ))}
        </div>

        {/* Bottom Propose New Sign Type Link */}
        <div className="p-4 border-t border-gray-200 dark:border-white/10 text-center bg-gray-50/70 dark:bg-white/[0.01]">
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {t('reviewer.catalog_not_found')}{' '}
          </span>
          <button
            type="button"
            onClick={() => {
              onClose()
              onOpenNewSignModal()
            }}
            className="text-xs font-bold text-[#007b8b] dark:text-[#00c4de] hover:underline cursor-pointer ml-1"
          >
            {t('reviewer.catalog_report_prompt')} ➔
          </button>
        </div>
      </div>
    </Modal>
  )
}
export default ReviewerCatalogModal
