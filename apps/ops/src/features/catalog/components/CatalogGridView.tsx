import React from 'react'
import { useTranslation } from 'react-i18next'
import { Info } from '@phosphor-icons/react'
import type { CatalogEntry } from '@/data/catalogData'
import { TrafficSignGraphic } from './TrafficSignGraphic'
import type { CategoryMeta } from './CatalogDetailModal'

export interface CatalogGridViewProps {
  /** Filtered and paginated list of catalog entries to render. */
  signs: CatalogEntry[]
  /** Selection handler invoked when user clicks any card to view specs. */
  onSelectSign: (sign: CatalogEntry) => void
  /** Resolves category styling and label. */
  getCategoryMeta: (cat: string) => CategoryMeta
  /** Resolves primary localized sign name. */
  getSignPrimaryName: (sign: CatalogEntry) => string
  /** Resolves secondary localized sign name. */
  getSignSecondaryName: (sign: CatalogEntry) => string
  /** Resolves primary localized description. */
  getSignPrimaryDesc: (sign: CatalogEntry) => string
  /** Localizes geometric shape text. */
  getShapeLabel: (shape: string) => string
  /** Renders color pill badge. */
  renderColorPill: (color: string) => React.ReactNode
}

/**
 * Grid view displaying visual cards for each traffic sign with vector plate preview.
 */
export const CatalogGridView: React.FC<CatalogGridViewProps> = ({
  signs,
  onSelectSign,
  getCategoryMeta,
  getSignPrimaryName,
  getSignSecondaryName,
  getSignPrimaryDesc,
  getShapeLabel,
  renderColorPill,
}) => {
  const { t } = useTranslation('ops')

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {signs.map((sign) => {
        const meta = getCategoryMeta(sign.category)
        const isActive = sign.status === 'Active'

        return (
          <div
            key={sign.id || sign.code}
            onClick={() => onSelectSign(sign)}
            className="p-5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A171C] hover:border-[#007b8b] dark:hover:border-[#00c4de] hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between group hover:-translate-y-1"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex flex-col gap-1.5">
                  <span className={`font-mono text-xs font-extrabold px-2.5 py-1 rounded-lg border w-fit ${meta.badgeClass}`}>
                    {sign.code}
                  </span>
                  <span className="text-[11px] font-bold text-gray-600 dark:text-gray-400 flex items-center gap-1.5 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                    {meta.label}
                  </span>
                </div>

                <div className="w-16 h-16 p-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#061115] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200 shadow-xs">
                  <TrafficSignGraphic sign={sign} className="w-full h-full drop-shadow-xs" />
                </div>
              </div>

              <h3 className="font-extrabold text-base text-gray-900 dark:text-white group-hover:text-[#007b8b] dark:group-hover:text-[#00c4de] transition-colors line-clamp-1">
                {getSignPrimaryName(sign)}
              </h3>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                {getSignSecondaryName(sign)}
              </p>

              <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 line-clamp-2 leading-relaxed font-normal">
                {getSignPrimaryDesc(sign)}
              </p>

              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10">
                  {getShapeLabel(sign.shape)}
                </span>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 flex items-center gap-1.5">
                  {renderColorPill(sign.color)}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/10 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-[11px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded border border-gray-200 dark:border-white/10">
                  {sign.version || 'v2.5'}
                </span>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {isActive ? t('catalog.status_active') : t('catalog.status_deprecated')}
                </span>
              </div>
              <span className="text-[#007b8b] dark:text-[#00c4de] font-bold flex items-center gap-1 group-hover:underline">
                <Info size={15} weight="bold" />
                <span>{t('catalog.inspect')}</span>
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
