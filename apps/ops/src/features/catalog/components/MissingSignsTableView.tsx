import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkle, MapPin, Eye, Image as ImageIcon, User, CalendarBlank } from '@phosphor-icons/react'
import { Pagination } from '@/components/common/Pagination'
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

function formatShapeVi(shape?: string) {
  if (!shape) return ''
  const map: Record<string, string> = {
    circle: 'Tròn',
    triangle: 'Tam giác đều',
    octagon: 'Bát giác đều',
    rectangle: 'Chữ nhật',
    square: 'Hình vuông',
    diamond: 'Hình thoi',
  }
  return map[shape.toLowerCase()] || shape
}

function formatColorVi(color?: string) {
  if (!color) return ''
  const map: Record<string, string> = {
    'red-white': 'Đỏ - Trắng',
    'blue-white': 'Xanh dương - Trắng',
    'yellow-black': 'Vàng - Đen',
    'white-black': 'Trắng - Đen',
    'green-white': 'Xanh lá - Trắng',
  }
  return map[color.toLowerCase()] || color
}

export function MissingSignsTableView({
  reports,
  totalItems,
  currentPage,
  pageSize,
  isCollapsed: _isCollapsed,
  onPageChange,
  onPageSizeChange,
  onSelectReport,
}: MissingSignsTableViewProps) {
  const { t } = useTranslation('ops')
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({})

  return (
    <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl shadow-xs">
      <div className="overflow-x-auto rounded-t-2xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50/80 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-mono uppercase border-b border-gray-200 dark:border-white/10">
            <tr>
              {/* Evidence Photo */}
              <th className="py-3 px-4 font-semibold w-20">{t('missing_signs.th_sample', 'Ảnh biển báo')}</th>
              {/* Proposed Sign & Specs */}
              <th className="py-3 px-4 font-semibold min-w-[200px]">{t('missing_signs.th_temp_label', 'Đề xuất & Quy cách')}</th>
              {/* Category */}
              <th className="py-3 px-4 font-semibold whitespace-nowrap">{t('missing_signs.th_category', 'Phân loại')}</th>
              {/* Location & Submitted */}
              <th className="py-3 px-4 font-semibold min-w-[170px]">{t('missing_signs.th_location', 'Vị trí & Thời gian')}</th>
              {/* Reporter */}
              <th className="py-3 px-4 font-semibold whitespace-nowrap">{t('missing_signs.th_reporter', 'Người báo cáo')}</th>
              {/* Status */}
              <th className="py-3 px-3 font-semibold text-center whitespace-nowrap">{t('missing_signs.th_status', 'Trạng thái')}</th>
              {/* Actions */}
              <th className="py-3 px-4 font-semibold text-right whitespace-nowrap w-28">{t('missing_signs.th_actions', 'Thao tác')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {reports.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-14 text-center text-gray-400 dark:text-gray-500 space-y-2">
                  <Sparkle size={36} className="mx-auto opacity-40 text-[#007b8b] dark:text-[#00c4de]" />
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('missing_signs.empty_title', 'Không có đề xuất biển mới')}</p>
                  <p className="text-xs">{t('missing_signs.empty_desc', 'Hiện không có báo cáo nào khớp với bộ lọc tìm kiếm.')}</p>
                </td>
              </tr>
            ) : (
              reports.map((report) => {
                const hasImgError = failedImages[report.id] || !report.sampleImageUrl

                return (
                  <tr
                    key={report.id}
                    onClick={() => onSelectReport(report)}
                    className="hover:bg-gray-50/80 dark:hover:bg-white/[0.04] transition-colors group cursor-pointer"
                  >
                    {/* 1. Evidence Photo Thumbnail */}
                    <td className="py-3 px-4">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-black/30 shrink-0 shadow-2xs group-hover:border-[#007b8b]/40 dark:group-hover:border-[#00c4de]/40 transition-colors">
                        {!hasImgError ? (
                          <img
                            src={report.sampleImageUrl}
                            alt={report.tempLabel}
                            onError={() => setFailedImages((prev) => ({ ...prev, [report.id]: true }))}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500">
                            <ImageIcon size={20} weight="light" />
                          </div>
                        )}
                        {report.aiConfidence !== undefined && (
                          <span className="absolute bottom-0 inset-x-0 bg-black/70 backdrop-blur-2xs text-[9px] font-mono text-white text-center py-0.2">
                            {(report.aiConfidence * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 2. Proposed Sign Name, Specs & Reporter Note */}
                    <td className="py-3 px-4">
                      <div className="space-y-1 max-w-[280px] sm:max-w-[340px] lg:max-w-[420px]">
                        <div className="flex items-center gap-2">
                          <span
                            className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm group-hover:text-[#007b8b] dark:group-hover:text-[#00c4de] transition-colors truncate block"
                            title={report.tempLabel}
                          >
                            {report.tempLabel}
                          </span>
                        </div>

                        {/* Specs Pills: Shape, Color Scheme */}
                        {(report.suggestedShape || report.suggestedColorScheme) && (
                          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                            {report.suggestedShape && (
                              <span className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 border border-gray-200/80 dark:border-white/10 font-medium">
                                {formatShapeVi(report.suggestedShape)}
                              </span>
                            )}
                            {report.suggestedColorScheme && (
                              <span className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 border border-gray-200/80 dark:border-white/10 font-medium">
                                {formatColorVi(report.suggestedColorScheme)}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Reporter Note */}
                        {report.reporterNote && (
                          <p
                            className="text-[11px] text-gray-500 dark:text-gray-400 truncate italic"
                            title={report.reporterNote}
                          >
                            &ldquo;{report.reporterNote}&rdquo;
                          </p>
                        )}
                      </div>
                    </td>

                    {/* 3. Category */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <CategoryBadge category={report.category} categoryId={report.proposedCategoryId} />
                    </td>

                    {/* 4. Location & Submitted Time */}
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                      <div className="space-y-1 min-w-[150px]">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={13} className="text-[#007b8b] dark:text-[#00c4de] shrink-0" />
                          <span className="font-mono text-xs truncate" title={report.roadAddress || `${report.lat}° N, ${report.lng}° E`}>
                            {report.lat.toFixed(4)}°, {report.lng.toFixed(4)}°
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500 font-mono">
                          <CalendarBlank size={12} className="shrink-0" />
                          <span>{report.reportedAt}</span>
                        </div>
                      </div>
                    </td>

                    {/* 5. Reporter */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-gray-800 dark:text-gray-200 font-medium text-xs">
                        <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500 dark:text-gray-400 shrink-0">
                          <User size={11} />
                        </div>
                        <span className="font-mono text-[11px]">{report.reportedBy}</span>
                      </div>
                    </td>

                    {/* 6. Status */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <StatusBadge status={report.status} />
                    </td>

                    {/* 7. Action Button */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectReport(report)
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-[#007b8b] hover:bg-[#007b8b]/10 dark:hover:bg-[#00c4de]/10 text-gray-700 dark:text-gray-200 hover:text-[#007b8b] dark:hover:text-[#00c4de] text-xs font-semibold transition-all cursor-pointer shadow-2xs group-hover:border-[#007b8b]/30"
                      >
                        <Eye size={14} className="text-[#007b8b] dark:text-[#00c4de]" />
                        <span>
                          {report.status === 'Open' || report.status === 'Escalated'
                            ? t('missing_signs.btn_inspect_triage', 'Thẩm định')
                            : t('missing_signs.btn_view_details', 'Chi tiết')}
                        </span>
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
      <div className="px-4 py-3 border-t border-gray-200/80 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] rounded-b-2xl">
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
