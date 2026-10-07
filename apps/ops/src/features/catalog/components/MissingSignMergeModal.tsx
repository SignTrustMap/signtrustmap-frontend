import { useTranslation } from 'react-i18next'
import { ModalPortal } from '@/components/common/ModalPortal'
import { SearchBar } from '@/components/common/SearchBar'
import { ArrowsMerge, X, Check } from '@phosphor-icons/react'
import type { AvailableSignOption, MissingSignTypeReport } from '@/data'

interface MissingSignMergeModalProps {
  isOpen: boolean
  selectedReport: MissingSignTypeReport | null
  selectedCatalogCode: string
  catalogSearch: string
  filteredCatalogSigns: AvailableSignOption[]
  onClose: () => void
  onCatalogSearchChange: (query: string) => void
  onSelectCatalogCode: (code: string) => void
  onSubmit: () => void
}

export function MissingSignMergeModal({
  isOpen,
  selectedReport,
  selectedCatalogCode,
  catalogSearch,
  filteredCatalogSigns,
  onClose,
  onCatalogSearchChange,
  onSelectCatalogCode,
  onSubmit,
}: MissingSignMergeModalProps) {
  const { t } = useTranslation('ops')

  if (!isOpen || !selectedReport) return null

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
        <div className="bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/15 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/10 pb-3">
            <h3 className="font-bold text-purple-600 dark:text-purple-400 text-base flex items-center gap-2">
              <ArrowsMerge size={18} weight="bold" />
              <span>{t('missing_signs.modal_merge_title')}</span>
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            {t('missing_signs.modal_merge_desc')}
          </p>

          <SearchBar
            value={catalogSearch}
            onChange={onCatalogSearchChange}
            placeholder={t('catalog.search_placeholder')}
            size="sm"
          />

          <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
            {filteredCatalogSigns.map((s: AvailableSignOption) => {
              const isSelected = selectedCatalogCode === s.code
              return (
                <div
                  key={s.code}
                  onClick={() => onSelectCatalogCode(s.code)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-700 dark:text-purple-300 font-bold'
                      : 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5'
                  }`}
                >
                  <div>
                    <span className="font-mono font-bold">{s.code}</span> -{' '}
                    {s.codeTitle.split(' - ')[1] || s.codeTitle}
                    <span className="text-[10px] text-gray-400 block font-normal">
                      {t(`catalog.${s.nameKey}`)}
                    </span>
                  </div>
                  {isSelected && <Check size={16} weight="bold" className="text-purple-600" />}
                </div>
              )
            })}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer"
            >
              {t('missing_signs.btn_cancel')}
            </button>
            <button
              type="button"
              onClick={onSubmit}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
            >
              {t('missing_signs.btn_confirm_merge')} ({selectedCatalogCode})
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  )
}
export default MissingSignMergeModal
