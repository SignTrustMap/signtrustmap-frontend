import { useState, useMemo } from 'react'
import { ModalPortal } from '@/components/common/ModalPortal'
import { Pagination } from '@/components/common/Pagination'
import type { ClassDistributionDiffResponse } from '@/api/services/aiops.service'

interface ClassDistributionDiffModalProps {
  diffData: ClassDistributionDiffResponse | null
  loading: boolean
  onClose: () => void
}

export function ClassDistributionDiffModal({
  diffData,
  loading,
  onClose,
}: ClassDistributionDiffModalProps) {
  const [activeSubTab, setActiveSubTab] = useState<'added' | 'changed' | 'removed'>('added')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const addedClasses = diffData?.added_classes || []
  const changedClasses = diffData?.changed_classes || []
  const removedClasses = diffData?.removed_classes || []

  const filteredAdded = useMemo(() => {
    if (!searchQuery.trim()) return addedClasses
    const q = searchQuery.toLowerCase()
    return addedClasses.filter(
      (c) =>
        c.sign_code.toLowerCase().includes(q) ||
        c.name_vi.toLowerCase().includes(q) ||
        (c.name_en && c.name_en.toLowerCase().includes(q))
    )
  }, [addedClasses, searchQuery])

  const filteredChanged = useMemo(() => {
    if (!searchQuery.trim()) return changedClasses
    const q = searchQuery.toLowerCase()
    return changedClasses.filter(
      (c) =>
        c.sign_code.toLowerCase().includes(q) ||
        c.name_vi.toLowerCase().includes(q) ||
        (c.name_en && c.name_en.toLowerCase().includes(q))
    )
  }, [changedClasses, searchQuery])

  const filteredRemoved = useMemo(() => {
    if (!searchQuery.trim()) return removedClasses
    const q = searchQuery.toLowerCase()
    return removedClasses.filter(
      (c) =>
        c.sign_code.toLowerCase().includes(q) ||
        c.name_vi.toLowerCase().includes(q) ||
        (c.name_en && c.name_en.toLowerCase().includes(q))
    )
  }, [removedClasses, searchQuery])

  const activeFilteredList =
    activeSubTab === 'added'
      ? filteredAdded
      : activeSubTab === 'changed'
      ? filteredChanged
      : filteredRemoved

  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return activeFilteredList.slice(start, start + pageSize)
  }, [activeFilteredList, currentPage, pageSize])

  const handleSubTabChange = (tab: 'added' | 'changed' | 'removed') => {
    setActiveSubTab(tab)
    setCurrentPage(1)
  }

  const handleSearchChange = (val: string) => {
    setSearchQuery(val)
    setCurrentPage(1)
  }

  return (
    <ModalPortal>
      <div
        role="dialog"
        aria-modal="true"
        onClick={onClose}
        className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-4xl max-h-[85vh] flex flex-col bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-xl shadow-2xl overflow-hidden text-left my-auto animate-in zoom-in-95"
        >
          {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 dark:border-white/10 shrink-0">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-gray-400">
            Biến động tập mẫu
          </span>
          <h3 className="text-base font-bold text-gray-900 dark:text-white mt-0.5">
            So sánh với phiên bản {diffData?.compared_version_tag || 'active'}
          </h3>
        </div>

        {/* Sub-tabs & Search */}
        <div className="px-5 py-3 border-b border-gray-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 bg-gray-50/30 dark:bg-white/[0.01]">
          <div className="inline-flex items-center p-1 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 text-xs font-mono">
            <button
              type="button"
              onClick={() => handleSubTabChange('added')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'added'
                  ? 'bg-white dark:bg-[#0A171C] text-[#007b8b] dark:text-[#00c4de] font-bold shadow-2xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span>Class mới</span>
              <span className="text-[10px] opacity-75 font-mono">{addedClasses.length}</span>
            </button>
            <button
              type="button"
              onClick={() => handleSubTabChange('changed')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'changed'
                  ? 'bg-white dark:bg-[#0A171C] text-[#007b8b] dark:text-[#00c4de] font-bold shadow-2xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span>Thay đổi mẫu</span>
              <span className="text-[10px] opacity-75 font-mono">{changedClasses.length}</span>
            </button>
            {removedClasses.length > 0 && (
              <button
                type="button"
                onClick={() => handleSubTabChange('removed')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeSubTab === 'removed'
                    ? 'bg-white dark:bg-[#0A171C] text-rose-600 dark:text-rose-400 font-bold shadow-2xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <span>Chưa có mẫu</span>
                <span className="text-[10px] opacity-75 font-mono">{removedClasses.length}</span>
              </button>
            )}
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Tìm theo mã, tên biển..."
              className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#061115] text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#007b8b]"
            />
          </div>
        </div>

        {/* Content Table */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="p-12 text-center text-xs font-mono text-gray-400">
              Đang tải dữ liệu...
            </div>
          ) : activeSubTab === 'added' ? (
            filteredAdded.length === 0 ? (
              <div className="p-12 text-center text-xs text-gray-400 border border-gray-200 dark:border-white/10 rounded-lg m-5">
                Không có class mới
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-gray-50 dark:bg-[#061115] border-b border-gray-200 dark:border-white/10 text-[11px] text-gray-500 dark:text-gray-400 font-mono z-10 shadow-2xs">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold w-28">Mã biển</th>
                    <th className="py-2.5 px-4 font-semibold">Tên tiếng Việt</th>
                    <th className="py-2.5 px-4 font-semibold">Tên tiếng Anh</th>
                    <th className="py-2.5 px-4 font-semibold text-right w-28">Số mẫu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {(paginatedList as typeof addedClasses).map((item) => (
                    <tr key={item.sign_code} className="hover:bg-gray-50/80 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 px-4 font-mono font-bold text-gray-900 dark:text-white whitespace-nowrap">
                        {item.sign_code}
                      </td>
                      <td className="py-2.5 px-4 text-gray-800 dark:text-gray-200 font-medium">
                        {item.name_vi}
                      </td>
                      <td className="py-2.5 px-4 text-gray-400">
                        {item.name_en || '-'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        +{item.current_verified_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : activeSubTab === 'changed' ? (
            filteredChanged.length === 0 ? (
              <div className="p-12 text-center text-xs text-gray-400 border border-gray-200 dark:border-white/10 rounded-lg m-5">
                Không có thay đổi số lượng mẫu
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-gray-50 dark:bg-[#061115] border-b border-gray-200 dark:border-white/10 text-[11px] text-gray-500 dark:text-gray-400 font-mono z-10 shadow-2xs">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold w-28">Mã biển</th>
                    <th className="py-2.5 px-4 font-semibold">Tên tiếng Việt</th>
                    <th className="py-2.5 px-4 font-semibold text-right w-28">Mẫu trước</th>
                    <th className="py-2.5 px-4 font-semibold text-right w-28">Mẫu hiện có</th>
                    <th className="py-2.5 px-4 font-semibold text-right w-28">Chênh lệch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {(paginatedList as typeof changedClasses).map((item) => {
                    const isUp = item.delta_samples > 0
                    return (
                      <tr key={item.sign_code} className="hover:bg-gray-50/80 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="py-2.5 px-4 font-mono font-bold text-gray-900 dark:text-white whitespace-nowrap">
                          {item.sign_code}
                        </td>
                        <td className="py-2.5 px-4 text-gray-800 dark:text-gray-200 font-medium">
                          {item.name_vi}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-gray-400">
                          {item.previous_samples_count}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-gray-900 dark:text-white">
                          {item.current_samples_count}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono whitespace-nowrap">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[11px] font-bold border ${
                              isUp
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                            }`}
                          >
                            {isUp ? `+${item.delta_samples}` : item.delta_samples}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )
          ) : (
            filteredRemoved.length === 0 ? (
              <div className="p-12 text-center text-xs text-gray-400 border border-gray-200 dark:border-white/10 rounded-lg m-5">
                Không có class nào thiếu mẫu
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-gray-50 dark:bg-[#061115] border-b border-gray-200 dark:border-white/10 text-[11px] text-gray-500 dark:text-gray-400 font-mono z-10 shadow-2xs">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold w-28">Mã biển</th>
                    <th className="py-2.5 px-4 font-semibold">Tên tiếng Việt</th>
                    <th className="py-2.5 px-4 font-semibold">Tên tiếng Anh</th>
                    <th className="py-2.5 px-4 font-semibold text-right w-36">Mẫu model cũ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {(paginatedList as typeof removedClasses).map((item) => (
                    <tr key={item.sign_code} className="hover:bg-gray-50/80 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 px-4 font-mono font-bold text-gray-900 dark:text-white whitespace-nowrap">
                        {item.sign_code}
                      </td>
                      <td className="py-2.5 px-4 text-gray-800 dark:text-gray-200 font-medium">
                        {item.name_vi}
                      </td>
                      <td className="py-2.5 px-4 text-gray-400">
                        {item.name_en || '-'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-rose-600 dark:text-rose-400 font-bold whitespace-nowrap">
                        {item.previous_samples_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>

        {/* Footer with Catalog-style Pagination */}
        <div className="px-5 py-2.5 bg-gray-50/50 dark:bg-white/[0.02] border-t border-gray-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex-1 min-w-0">
            {activeFilteredList.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalItems={activeFilteredList.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(sz) => {
                  setPageSize(sz)
                  setCurrentPage(1)
                }}
                pageSizeOptions={[5, 10, 20, 50]}
                itemLabel="class"
              />
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold font-mono border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 rounded-lg transition-colors cursor-pointer shrink-0 self-end sm:self-center"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  </ModalPortal>
  )
}
