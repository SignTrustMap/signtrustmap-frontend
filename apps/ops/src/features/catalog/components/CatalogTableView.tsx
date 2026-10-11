import React from 'react'
import { useTranslation } from 'react-i18next'
import type { CatalogEntry } from '@/data/catalogData'
import { TrafficSignGraphic } from './TrafficSignGraphic'
import type { CategoryMeta } from './CatalogDetailModal'

export interface CatalogTableViewProps {
  /** Filtered and paginated list of catalog entries to render in table rows. */
  signs: CatalogEntry[]
  /** Selection handler invoked when user clicks a row. */
  onSelectSign: (sign: CatalogEntry) => void
  /** Resolves category badge styling and label. */
  getCategoryMeta: (cat: string) => CategoryMeta
  /** Resolves primary localized sign name. */
  getSignPrimaryName: (sign: CatalogEntry) => string
  /** Resolves secondary localized sign name. */
  getSignSecondaryName: (sign: CatalogEntry) => string
}

/**
 * Data-dense operations table view allowing rapid scanning of sign codes,
 * OSM tags, AI prompts, and QCVN standards.
 */
export const CatalogTableView: React.FC<CatalogTableViewProps> = ({
  signs,
  onSelectSign,
  getCategoryMeta,
  getSignPrimaryName,
  getSignSecondaryName,
}) => {
  const { t } = useTranslation('ops')

  return (
    <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-mono uppercase border-b border-gray-200 dark:border-white/10">
            <tr>
              <th className="py-3 px-4 font-semibold text-center w-16">{t('catalog.th_preview')}</th>
              <th className="py-3 px-4 font-semibold">{t('catalog.th_code_name')}</th>
              <th className="py-3 px-4 font-semibold">{t('catalog.th_category')}</th>
              <th className="py-3 px-4 font-semibold">{t('catalog.th_ai_prompt')}</th>
              <th className="py-3 px-4 font-semibold">{t('catalog.th_osm_mapping')}</th>
              <th className="py-3 px-4 font-semibold">{t('catalog.th_version')}</th>
              <th className="py-3 px-4 font-semibold text-center">{t('catalog.th_status')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {signs.map((item) => {
              const meta = getCategoryMeta(item.category)
              const isActive = item.status === 'Active'

              return (
                <tr
                  key={item.id || item.code}
                  onClick={() => onSelectSign(item)}
                  className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <td className="py-3 px-4 text-center">
                    <div className="w-10 h-10 p-1 mx-auto rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#061115] flex items-center justify-center">
                      <TrafficSignGraphic sign={item} className="w-full h-full drop-shadow-xs" />
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div>
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${meta.badgeClass}`}>
                        {item.code}
                      </span>
                      <p className="font-bold text-gray-900 dark:text-white mt-1">
                        {getSignPrimaryName(item)}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        {getSignSecondaryName(item)}
                      </p>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                      {meta.label}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 max-w-xs truncate font-mono text-[11px] text-gray-600 dark:text-gray-300">
                    {item.aiPrompt || item.clipPrompt}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-[#007b8b] dark:text-[#00c4de]">
                    {item.osmMapping}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-gray-400">{item.version || 'v2.5'}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        isActive
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : 'bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {isActive ? t('catalog.status_active') : t('catalog.status_deprecated')}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
