import { useTranslation } from 'react-i18next'
import {
  WarningCircle,
  MapPin,
  Calendar,
  User,
  Eye,
} from '@phosphor-icons/react'
import type { SignReportItem } from '@/data'
import { mockCatalogData } from '@/data/catalogData'
import { Pagination } from '@/components/common/Pagination'
import { TrafficSignGraphic } from '@/features/catalog/components/TrafficSignGraphic'
import { IssueTypeBadge, PriorityBadge, ReportStatusBadge } from './ReportsBadges'

interface ReportsTableViewProps {
  reports: SignReportItem[]
  isCollapsed: boolean
  currentPage: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onSelectReport: (report: SignReportItem) => void
}

export function ReportsTableView({
  reports,
  isCollapsed,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onSelectReport,
}: ReportsTableViewProps) {
  const { t } = useTranslation('ops')

  const paginatedReports = reports.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50/80 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-mono uppercase border-b border-gray-200 dark:border-white/10">
            <tr>
              <th className="py-2.5 px-3 font-semibold w-24">{t('reports.th_id')}</th>
              <th className="py-2.5 px-3 font-semibold">{t('reports.th_sign')}</th>
              <th className="py-2.5 px-3 font-semibold whitespace-nowrap">{t('reports.th_type')}</th>
              <th className="py-2.5 px-3 font-semibold">{t('reports.th_location')}</th>
              <th className="py-2.5 px-2.5 font-semibold text-center whitespace-nowrap">{t('reports.th_priority')}</th>
              <th className="py-2.5 px-2.5 font-semibold text-center whitespace-nowrap">{t('reports.th_status')}</th>
              {isCollapsed && (
                <>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap hidden md:table-cell animate-in fade-in duration-300">
                    {t('reports.th_reporter')}
                  </th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap hidden lg:table-cell animate-in fade-in duration-300">
                    {t('reports.th_date_assigned')}
                  </th>
                </>
              )}
              <th className="py-2.5 px-3 font-semibold text-right whitespace-nowrap w-20">{t('reports.th_actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {paginatedReports.length === 0 ? (
              <tr>
                <td colSpan={isCollapsed ? 9 : 7} className="py-12 text-center text-gray-400 dark:text-gray-500 space-y-2">
                  <WarningCircle size={32} className="mx-auto opacity-40" />
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('reports.empty_title')}</p>
                  <p className="text-xs">{t('reports.empty_desc')}</p>
                </td>
              </tr>
            ) : (
              paginatedReports.map((report) => {
                const catalogEntry = mockCatalogData.find(
                  (c) => c.code.toLowerCase() === report.signCode.toLowerCase()
                ) || {
                  code: report.signCode,
                  nameVi: report.signName,
                  shape: 'Circle',
                  color: 'Red-White',
                }

                return (
                  <tr
                    key={report.id}
                    onClick={() => onSelectReport(report)}
                    className="hover:bg-gray-50/70 dark:hover:bg-white/5 transition-colors group cursor-pointer"
                  >
                    {/* Report ID */}
                    <td className="py-2.5 px-3 font-mono font-bold text-gray-900 dark:text-white whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/10 text-[11px]">
                        {report.id}
                      </span>
                    </td>

                    {/* Sign with Visual Graphic */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 flex items-center justify-center p-0.5 shrink-0">
                          <TrafficSignGraphic sign={catalogEntry} className="w-full h-full object-contain" />
                        </div>
                        <div className="min-w-0 max-w-[120px] sm:max-w-[150px] lg:max-w-[180px]">
                          <span className="font-mono font-bold text-[#007b8b] dark:text-[#00c4de] mr-1 text-[11px]">
                            {report.signCode}
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-white truncate block text-xs" title={report.signName}>
                            {report.signName}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Issue Type */}
                    <td className="py-2.5 px-3">
                      <IssueTypeBadge type={report.issueType} />
                    </td>

                    {/* Location */}
                    <td className="py-2.5 px-3 text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-1.5 min-w-0 max-w-[130px] sm:max-w-[180px] lg:max-w-[220px]">
                        <MapPin size={13} className="text-[#007b8b] dark:text-[#00c4de] shrink-0" />
                        <span className="truncate text-xs" title={report.location}>{report.location}</span>
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                      <PriorityBadge priority={report.priority} />
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                      <ReportStatusBadge status={report.status} />
                    </td>

                    {/* Adaptive Column 1: Reporter Contact (Shown when sidebar is collapsed) */}
                    {isCollapsed && (
                      <td className="py-2.5 px-3 hidden md:table-cell whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${report.reporter.avatarBg}`}
                          >
                            {report.reporter.initials}
                          </span>
                          <div className="min-w-0">
                            <span className="font-medium text-gray-800 dark:text-gray-200 text-xs block truncate max-w-[110px]">
                              {report.reporter.name}
                            </span>
                            {report.reporter.phone && (
                              <span className="text-[10px] font-mono text-gray-400 block">
                                {report.reporter.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                    )}

                    {/* Adaptive Column 2: Date & Assigned Staff (Shown when sidebar is collapsed) */}
                    {isCollapsed && (
                      <td className="py-2.5 px-3 hidden lg:table-cell whitespace-nowrap">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-[11px] font-mono text-gray-500 dark:text-gray-400">
                            <Calendar size={12} className="text-gray-400" />
                            <span>{report.dateSubmitted}</span>
                          </div>
                          {report.assignedStaff ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-700 dark:text-gray-300">
                              <User size={10} className="text-[#007b8b] dark:text-[#00c4de]" />
                              <span>{report.assignedStaff}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400 italic">
                              {t('reports.status_pending')}
                            </span>
                          )}
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
                        <span>{t('reports.btn_details')}</span>
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer pagination */}
      <div className="px-4 py-3 border-t border-gray-200/80 dark:border-white/10">
        <Pagination
          currentPage={currentPage}
          totalItems={reports.length}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={(newSize) => {
            onPageSizeChange(newSize)
            onPageChange(1)
          }}
          pageSizeOptions={[5, 10, 20]}
        />
      </div>
    </div>
  )
}
