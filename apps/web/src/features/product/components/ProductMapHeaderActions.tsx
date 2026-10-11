import { useTranslation } from 'react-i18next'
import { WarningCircle } from '@phosphor-icons/react'

interface ProductMapHeaderActionsProps {
  isDriver: boolean
  isDark: boolean
  onOpenReport: () => void
  filteredCount: number
  totalCount: number
}

export function ProductMapHeaderActions({
  isDriver,
  isDark,
  onOpenReport,
  filteredCount,
  totalCount,
}: ProductMapHeaderActionsProps) {
  const { t } = useTranslation('product')

  return (
    <div className="flex items-center gap-3 self-start sm:self-auto">
      {isDriver && (
        <button
          type="button"
          onClick={onOpenReport}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs active:scale-[0.98] ${
            isDark
              ? 'bg-white/5 hover:bg-white/10 text-gray-200 border-white/15'
              : 'bg-white hover:bg-gray-50 text-gray-800 border-gray-200'
          }`}
          title={t('map_page.btn_report_general')}
        >
          <WarningCircle size={17} weight="bold" className="text-[#007b8b] dark:text-[#00c4de]" />
          <span>{t('map_page.btn_report_general')}</span>
        </button>
      )}

      <div
        className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border transition-colors ${
          isDark
            ? 'bg-[#071317] border-white/10 shadow-md shadow-black/40'
            : 'bg-white border-[#E8E4E3] shadow-xs'
        }`}
      >
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        <div className="flex flex-col text-left">
          <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {t('map_page.showing_count')}
          </span>
          <span className="text-sm font-extrabold text-gray-900 dark:text-white font-mono">
            {filteredCount} / {totalCount}{' '}
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
              {t('map_page.signs_unit')}
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}
