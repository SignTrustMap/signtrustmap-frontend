import { useTranslation } from 'react-i18next'
import { Sparkle, MapPin, Eye } from '@phosphor-icons/react'
import { Pagination } from '@/components/common/Pagination'
import { mockCatalogData } from '@/data/catalogData'
import { TrafficSignGraphic } from '@/features/catalog/components/TrafficSignGraphic'
import { CategoryBadge, StatusBadge } from './MissingSignsBadges'
import type { MissingSignTypeReport } from '@/data'

interface MissingSignsTableViewProps {
  reports: MissingSignTypeReport[]
  totalItems: number
  currentPage: number
  pageSize: number
  isCollapsed: boolean
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onSelectReport: (report: MissingSignTypeReport) => void
}

export function MissingSignsTableView({
  reports,
  totalItems,
  currentPage,
  pageSize,
  isCollapsed,
  onPageChange,
  onPageSizeChange,
  onSelectReport,
}: MissingSignsTableViewProps) {
  const { t } = useTranslation('ops')

  return (
    <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50/80 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-mono uppercase border-b border-gray-200 dark:border-white/10">
            <tr>
              <th className="py-2.5 px-3 font-semibold w-24">{t('missing_signs.th_id')}</th>
              <th className="py-2.5 px-3 font-semibold w-16">{t('missing_signs.th_sample')}</th>
              <th className="py-2.5 px-3 font-semibold">{t('missing_signs.th_temp_label')}</th>
              <th className="py-2.5 px-3 font-semibold whitespace-nowrap">{t('missing_signs.th_category')}</th>
              <th className="py-2.5 px-3 font-semibold">{t('missing_signs.th_location')}</th>
              <th className="py-2.5 px-3 font-semibold whitespace-nowrap">{t('missing_signs.th_similar')}</th>
              <th className="py-2.5 px-2.5 font-semibold text-center whitespace-nowrap">{t('missing_signs.th_status')}</th>
              {isCollapsed && (
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap hidden md:table-cell animate-in fade-in duration-300">
                  {t('missing_signs.th_reporter')}
                </th>
              )}
              <th className="py-2.5 px-3 font-semibold text-right whitespace-nowrap w-24">{t('missing_signs.th_actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {reports.length === 0 ? (
              <tr>
                <td colSpan={isCollapsed ? 9 : 8} className="py-12 text-center text-gray-400 dark:text-gray-500 space-y-2">
                  <Sparkle size={32} className="mx-auto opacity-40" />
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('missing_signs.empty_title')}</p>
                  <p className="text-xs">{t('missing_signs.empty_desc')}</p>
                </td>
              </tr>
            ) : (
              reports.map((report) => (
                <tr
                  key={report.id}
                  onClick={() => onSelectReport(report)}
                  className="hover:bg-gray-50/70 dark:hover:bg-white/5 transition-colors group cursor-pointer"
                >
                  {/* Proposal ID */}
                  <td className="py-2.5 px-3 font-mono font-bold text-gray-900 dark:text-white whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/10 text-[11px]">
                      {report.id}
                    </span>
                  </td>

                  {/* Photo Thumbnail */}
                  <td className="py-2 px-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 dark:border-white/10 bg-gray-100 shrink-0">
                      <img
                        src={report.sampleImageUrl}
                        alt={report.tempLabel}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  </td>

                  {/* Proposed Label */}
                  <td className="py-2.5 px-3">
                    <div className="min-w-0 max-w-[160px] sm:max-w-[220px] lg:max-w-[280px]">
                      <span className="font-bold text-gray-900 dark:text-white truncate block text-xs" title={report.tempLabel}>
                        {report.tempLabel}
                      </span>
                      <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate block italic">
                        &ldquo;{report.reporterNote}&rdquo;
                      </span>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <CategoryBadge category={report.category} />
                  </td>

                  {/* Location */}
                  <td className="py-2.5 px-3 text-gray-700 dark:text-gray-300">
                    <div className="flex items-center gap-1.5 min-w-0 max-w-[140px] sm:max-w-[180px] lg:max-w-[220px]">
                      <MapPin size={13} className="text-[#007b8b] dark:text-[#00c4de] shrink-0" />
                      <span className="truncate text-xs" title={report.roadAddress || `${report.lat}° N, ${report.lng}° E`}>
                        {report.roadAddress || `${report.lat.toFixed(4)}°, ${report.lng.toFixed(4)}°`}
                      </span>
                    </div>
                  </td>

                  {/* Similar Matches with Mini Graphic */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {report.similarCatalogEntries.slice(0, 2).map((code) => {
                        const catalogEntry = mockCatalogData.find(
                          (c) => c.code.toLowerCase() === code.toLowerCase()
                        )
                        return (
                          <div
                            key={code}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10"
                            title={catalogEntry?.nameVi}
                          >
                            {catalogEntry && (
                              <div className="w-4 h-4 shrink-0">
                                <TrafficSignGraphic sign={catalogEntry} className="w-full h-full object-contain" />
                              </div>
                            )}
                            <span className="font-mono font-bold text-[10px] text-gray-700 dark:text-gray-300">
                              {code}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                    <StatusBadge status={report.status} />
                  </td>

                  {/* Adaptive Column: Reporter & Date (When sidebar collapsed) */}
                  {isCollapsed && (
                    <td className="py-2.5 px-3 hidden md:table-cell whitespace-nowrap">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-gray-800 dark:text-gray-200 block text-xs">
                          {report.reportedBy}
                        </span>
                        <span className="text-[10px] font-mono text-gray-400 block">
                          {report.reportedAt}
                        </span>
                      </div>
                    </td>
                  )}

                  {/* Action Button */}
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectReport(report)
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 text-xs font-semibold text-gray-700 dark:text-gray-200 transition-colors cursor-pointer group-hover:border-[#007b8b]/40 dark:group-hover:border-[#00c4de]/40"
                    >
                      <Eye size={14} className="text-[#007b8b] dark:text-[#00c4de]" />
                      <span>{t('missing_signs.btn_inspect_triage')}</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer pagination */}
      <div className="px-4 py-3 border-t border-gray-200/80 dark:border-white/10">
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          pageSizeOptions={[5, 10, 20]}
        />
      </div>
    </div>
  )
}
export default MissingSignsTableView
