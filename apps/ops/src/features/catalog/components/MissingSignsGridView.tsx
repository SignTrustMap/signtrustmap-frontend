import { useTranslation } from 'react-i18next'
import { ArrowsMerge, RocketLaunch, Prohibit, MapPin, User } from '@phosphor-icons/react'
import { Pagination } from '@/components/common/Pagination'
import { CategoryBadge, StatusBadge } from './MissingSignsBadges'
import type { MissingSignTypeReport } from '@/data'

interface MissingSignsGridViewProps {
  reports: MissingSignTypeReport[]
  totalItems: number
  currentPage: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onSelectReport: (report: MissingSignTypeReport) => void
  onOpenMergeModal: (report: MissingSignTypeReport) => void
  onOpenEscalateModal: (report: MissingSignTypeReport) => void
  onOpenRejectModal: (report: MissingSignTypeReport) => void
}

export function MissingSignsGridView({
  reports,
  totalItems,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onSelectReport,
  onOpenMergeModal,
  onOpenEscalateModal,
  onOpenRejectModal,
}: MissingSignsGridViewProps) {
  const { t } = useTranslation('ops')

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {reports.map((report) => (
          <div
            key={report.id}
            onClick={() => onSelectReport(report)}
            className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl overflow-hidden shadow-xs hover:border-[#007b8b]/40 dark:hover:border-[#00c4de]/40 hover:shadow-md transition-all flex flex-col cursor-pointer group"
          >
            {/* Image Preview with Badges Overlay */}
            <div className="relative aspect-video bg-gray-100 dark:bg-black/50 overflow-hidden">
              <img
                src={report.sampleImageUrl}
                alt={report.tempLabel}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-2 left-2 flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-black/75 text-white backdrop-blur-xs">
                  {report.id}
                </span>
                <StatusBadge status={report.status} />
              </div>
              {report.aiConfidence && (
                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-black/75 text-[#00c4de] backdrop-blur-xs">
                  AI: {report.aiConfidence}%
                </div>
              )}
            </div>

            {/* Report Content */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm line-clamp-2 leading-snug">
                    {report.tempLabel}
                  </h3>
                  <CategoryBadge category={report.category} />
                </div>

                <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed bg-gray-50 dark:bg-white/5 p-2.5 rounded-xl border border-gray-100 dark:border-white/5 italic">
                  &ldquo;{report.reporterNote}&rdquo;
                </p>

                <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400 pt-1">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-[#007b8b] dark:text-[#00c4de] shrink-0" />
                    <span className="truncate">{report.roadAddress || `${report.lat.toFixed(4)}°, ${report.lng.toFixed(4)}°`}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User size={13} className="text-gray-400 shrink-0" />
                    <span className="truncate">{report.reportedBy} • {report.reportedAt}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-gray-100 dark:border-white/10 flex items-center justify-between gap-1.5">
                {report.status === 'Open' ? (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onOpenMergeModal(report)
                      }}
                      className="flex-1 py-1.5 px-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <ArrowsMerge size={13} weight="bold" />
                      <span>{t('missing_signs.btn_merge_catalog')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onOpenEscalateModal(report)
                      }}
                      className="flex-1 py-1.5 px-2 bg-[#007b8b]/10 hover:bg-[#007b8b]/20 dark:bg-[#00c4de]/15 dark:hover:bg-[#00c4de]/25 text-[#007b8b] dark:text-[#00c4de] border border-[#007b8b]/30 dark:border-[#00c4de]/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <RocketLaunch size={13} weight="bold" />
                      <span>{t('missing_signs.btn_escalate_admin')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onOpenRejectModal(report)
                      }}
                      className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                      title={t('missing_signs.btn_reject')}
                    >
                      <Prohibit size={15} />
                    </button>
                  </>
                ) : (
                  <div className="w-full py-1 text-center font-mono text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 truncate px-2">
                    {report.tempLabel}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer pagination */}
      <div className="px-4 py-3 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl shadow-xs">
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          pageSizeOptions={[6, 12, 24]}
        />
      </div>
    </div>
  )
}
export default MissingSignsGridView
