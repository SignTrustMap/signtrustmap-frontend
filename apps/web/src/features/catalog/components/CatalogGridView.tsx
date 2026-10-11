import React from 'react'
import { useTranslation } from 'react-i18next'
import { Info } from '@phosphor-icons/react'
import type { BackendCatalogSignType } from '@/api/services/catalog.service'
import { TrafficSignGraphic } from './TrafficSignGraphic'
import type { CategoryMeta } from './CatalogDetailModal'

export interface CatalogGridViewProps {
  /** Filtered and paginated array of signs to render. */
  signs: BackendCatalogSignType[]
  /** Callback fired when a sign card is clicked. */
  onSelectSign: (sign: BackendCatalogSignType) => void
  /** Theme mode indicator for dark/light styling. */
  isDark: boolean
  /** Resolves category visual styling and text. */
  getCategoryMeta: (catCode?: string) => CategoryMeta
  /** Resolves primary localized title. */
  getSignPrimaryName: (sign: BackendCatalogSignType) => string
  /** Resolves secondary subtitle in alternate language. */
  getSignSecondaryName: (sign: BackendCatalogSignType) => string
}

/**
 * Grid view displaying visual cards for each traffic sign with actual API data.
 */
export const CatalogGridView: React.FC<CatalogGridViewProps> = ({
  signs,
  onSelectSign,
  isDark,
  getCategoryMeta,
  getSignPrimaryName,
  getSignSecondaryName,
}) => {
  const { t, i18n } = useTranslation('common')
  const isEnglish = i18n.language.startsWith('en')

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-left">
      {signs.map((sign) => {
        const meta = getCategoryMeta(sign.category?.code)
        const categoryLabel = sign.category
          ? isEnglish
            ? sign.category.nameEn
            : sign.category.nameVi
          : meta.label

        return (
          <div
            key={sign.id || sign.signCode}
            onClick={() => onSelectSign(sign)}
            className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group hover:-translate-y-1 duration-200 ${
              isDark
                ? 'bg-[#071317] border-white/10 hover:border-[#00c4de] hover:shadow-lg hover:shadow-[#00c4de]/5'
                : 'bg-white border-[#E8E4E3] hover:border-[#007b8b] hover:shadow-md'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex flex-col gap-1.5 text-left">
                  <span
                    className={`font-mono text-xs font-extrabold px-2.5 py-1 rounded-md border w-fit ${meta.badgeClass}`}
                  >
                    {sign.signCode}
                  </span>
                  <span className="text-[11px] font-bold text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                    {categoryLabel}
                  </span>
                </div>

                <div
                  className={`w-14 h-14 p-1.5 rounded-xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 duration-200 ${
                    isDark ? 'bg-black/40 border-white/10' : 'bg-gray-50 border-gray-200 shadow-xs'
                  }`}
                >
                  <TrafficSignGraphic
                    sign={{
                      code: sign.signCode,
                      imageUrl: sign.representativeImageKey || undefined,
                      nameVi: sign.nameVi,
                      name: sign.nameEn,
                    }}
                    className="w-full h-full object-contain drop-shadow-sm"
                  />
                </div>
              </div>

              <h3 className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-white transition-colors group-hover:text-[#007b8b] dark:group-hover:text-[#00c4de] line-clamp-1">
                {getSignPrimaryName(sign)}
              </h3>
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-1">
                {getSignSecondaryName(sign)}
              </p>

              {sign.description && (
                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mt-2 line-clamp-2 leading-relaxed font-normal">
                  {sign.description}
                </p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/10 flex items-center justify-between text-xs">
              {sign.category?.description ? (
                <span
                  className="font-mono font-bold text-[11px] text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded border border-gray-200 dark:border-white/10 truncate max-w-[190px]"
                  title={sign.category.description}
                >
                  {sign.category.code}
                </span>
              ) : (
                <span className="font-mono text-[11px] text-gray-500">
                  ID #{sign.id}
                </span>
              )}

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
