import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkle, Image as ImageIcon } from '@phosphor-icons/react'
import { Pagination } from '@/components/common/Pagination'
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

function formatDate(val?: string, isEn = false): string {
  if (!val) return '—'
  try {
    const d = new Date(val)
    if (isNaN(d.getTime())) return val
    return isEn
      ? d.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
      : d.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' })
  } catch {
    return val
  }
}

function getCategoryName(category?: string, categoryId?: number | null, isEn = false): string {
  let id = categoryId
  if (!id && category && category.startsWith('cat_')) {
    const parsed = parseInt(category.replace('cat_', ''), 10)
    if (!Number.isNaN(parsed)) id = parsed
  }
  if (id === 1 || category === 'prohibitory') return isEn ? 'Biển báo cấm (P)' : 'Biển báo cấm'
  if (id === 2 || category === 'warning') return isEn ? 'Biển cảnh báo (W)' : 'Biển cảnh báo'
  if (id === 3 || category === 'mandatory') return isEn ? 'Biển hiệu lệnh (R)' : 'Biển hiệu lệnh'
  if (id === 4 || category === 'guide' || category === 'information') return isEn ? 'Biển chỉ dẫn (I)' : 'Biển chỉ dẫn'
  if (id === 5 || category === 'supplementary') return isEn ? 'Biển phụ (S)' : 'Biển phụ'
  return category || (isEn ? 'Other' : 'Khác')
}

function getStatusDisplay(status: MissingSignTypeReport['status'], isEn = false) {
  switch (status) {
    case 'Open':
      return {
        label: isEn ? 'Pending Triage' : 'Chờ thẩm định',
        textColor: 'text-amber-600 dark:text-amber-400',
      }
    case 'Escalated':
      return {
        label: isEn ? 'Escalated to Admin' : 'Chờ Admin duyệt',
        textColor: 'text-indigo-600 dark:text-indigo-400',
      }
    case 'Approved':
      return {
        label: isEn ? 'Approved' : 'Đã phê duyệt',
        textColor: 'text-emerald-600 dark:text-emerald-400',
      }
    case 'Merged':
      return {
        label: isEn ? 'Merged into Catalog' : 'Đã gộp Catalog',
        textColor: 'text-purple-600 dark:text-purple-400',
      }
    case 'Incomplete':
      return {
        label: isEn ? 'Needs Info' : 'Cần bổ sung',
        textColor: 'text-orange-600 dark:text-orange-400',
      }
    case 'Rejected':
      return {
        label: isEn ? 'Rejected' : 'Đã từ chối',
        textColor: 'text-rose-600 dark:text-rose-400',
      }
    default:
      return {
        label: status || (isEn ? 'Unknown' : 'Không xác định'),
        textColor: 'text-gray-600 dark:text-gray-400',
      }
  }
}

function getShortReporter(report: MissingSignTypeReport): string {
  if (report.reporterId) {
    return `#${report.reporterId.slice(0, 8)}`
  }
  const raw = report.reportedBy || ''
  if (raw.startsWith('Reviewer #')) {
    return `#${raw.replace('Reviewer #', '').slice(0, 8)}`
  }
  if (raw.startsWith('Reviewer ')) {
    return `#${raw.replace('Reviewer ', '').slice(0, 8)}`
  }
  return raw ? `#${raw.slice(0, 8)}` : 'N/A'
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
  const { i18n } = useTranslation(['ops', 'common'])
  const isEn = i18n.language?.startsWith('en')
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({})

  return (
    <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50/80 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-mono uppercase border-b border-gray-200 dark:border-white/10">
            <tr>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">{isEn ? 'Proposal ID' : 'Mã Đề Xuất'}</th>
              <th className="py-3 px-4 font-semibold min-w-[200px]">{isEn ? 'Proposed Sign' : 'Tên Biển Đề Xuất'}</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">{isEn ? 'Category' : 'Nhóm Biển'}</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">{isEn ? 'Evidence' : 'Ảnh Thực Địa'}</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">{isEn ? 'Reporter' : 'Người Tạo'}</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">{isEn ? 'Created At' : 'Thời Gian Tạo'}</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">{isEn ? 'Status' : 'Trạng Thái'}</th>
              <th className="py-3 px-4 font-semibold text-center whitespace-nowrap">{isEn ? 'Details' : 'Chi Tiết'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {reports.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-14 text-center text-gray-400 dark:text-gray-500 space-y-2">
                  <Sparkle size={36} className="mx-auto opacity-40 text-[#007b8b] dark:text-[#00c4de]" />
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    {isEn ? 'No new sign proposals found' : 'Không có đề xuất biển mới'}
                  </p>
                  <p className="text-xs">
                    {isEn
                      ? 'No reports match your current filter criteria.'
                      : 'Hiện không có báo cáo nào khớp với bộ lọc tìm kiếm.'}
                  </p>
                </td>
              </tr>
            ) : (
              reports.map((report) => {
                const hasImgError = failedImages[report.id] || !report.sampleImageUrl
                const status = getStatusDisplay(report.status, isEn)
                const categoryName = getCategoryName(report.category, report.proposedCategoryId, isEn)
                const shortReporter = getShortReporter(report)

                return (
                  <tr
                    key={report.id}
                    onClick={() => onSelectReport(report)}
                    className="hover:bg-neutral-50/80 dark:hover:bg-white/[0.03] transition-colors cursor-pointer group"
                  >
                    {/* 1. Id của new-types: tóm gọn, có màu nhấn nhẹ font mono */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-[#007b8b] dark:text-[#00c4de] whitespace-nowrap">
                      <span className="group-hover:underline">#{report.id.slice(0, 8)}</span>
                    </td>

                    {/* 2. Tên biển đề xuất (bỏ suggestedColorScheme, suggestedShape, description) */}
                    <td className="py-3.5 px-4 font-medium text-gray-900 dark:text-gray-100">
                      <span className="group-hover:text-[#007b8b] dark:group-hover:text-[#00c4de] transition-colors">
                        {report.tempLabel}
                      </span>
                    </td>

                    {/* 3. Nhóm biển: từ ngữ thông dụng chuẩn */}
                    <td className="py-3.5 px-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {categoryName}
                    </td>

                    {/* 4. Ảnh thực địa: thumbnail gọn gàng, bo góc đẹp mắt */}
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-black/30 shrink-0 group-hover:border-[#007b8b]/40 dark:group-hover:border-[#00c4de]/40 transition-colors">
                        {!hasImgError ? (
                          <img
                            src={report.sampleImageUrl}
                            alt={report.tempLabel}
                            onError={() => setFailedImages((prev) => ({ ...prev, [report.id]: true }))}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500">
                            <ImageIcon size={18} weight="light" />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 5. Người tạo (Id viết tắt dạng #eaa2eac3) */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {shortReporter}
                    </td>

                    {/* 6. Thời gian tạo */}
                    <td className="py-3.5 px-4 text-gray-500 dark:text-gray-400 font-mono text-[11px] whitespace-nowrap">
                      {formatDate(report.reportedAt, isEn)}
                    </td>

                    {/* 7. Trạng thái: chữ có màu sắc ngữ cảnh nhẹ nhàng giống /escalations */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`font-medium ${status.textColor}`}>
                        {status.label}
                      </span>
                    </td>

                    {/* 8. Chi Tiết: nút bấm nhẹ nhàng, có hover rõ nét giống /escalations */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectReport(report)
                        }}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-[#007b8b] hover:text-white dark:bg-white/10 dark:hover:bg-[#00c4de] dark:hover:text-black transition-all cursor-pointer"
                      >
                        {isEn ? 'Chi tiết' : 'Chi tiết'}
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-6 py-4 border-t border-gray-100 dark:border-white/5">
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
