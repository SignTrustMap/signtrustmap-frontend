import { useState, useMemo, useEffect } from 'react'
import { ModalPortal } from '@/components/common/ModalPortal'
import { Pagination } from '@/components/common/Pagination'
import {
  AiopsService,
  type ClassDistributionResponse,
  type CatalogSignDistributionItem,
} from '@/api/services/aiops.service'

interface CatalogDistributionModalProps {
  onClose: () => void
}

export function CatalogDistributionModal({ onClose }: CatalogDistributionModalProps) {
  const [data, setData] = useState<ClassDistributionResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [onlyVerified, setOnlyVerified] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  useEffect(() => {
    setLoading(true)
    AiopsService.getClassDistribution()
      .then((res) => {
        setData(res)
        setLoading(false)
      })
      .catch((err) => {
        setError(err?.message || 'Không thể tải danh mục phân phối biển báo')
        setLoading(false)
      })
  }, [])

  const rawList: CatalogSignDistributionItem[] = useMemo(() => data?.distribution || [], [data])

  // Trích xuất danh mục động trực tiếp từ dữ liệu API trả về
  const dynamicCategories = useMemo(() => {
    const set = new Set<string>()
    rawList.forEach((item) => {
      if (item.category) set.add(item.category)
    })
    return ['ALL', ...Array.from(set)]
  }, [rawList])

  // Lọc dữ liệu theo danh mục, checkbox chỉ hiển thị đã có mẫu, và từ khóa tìm kiếm
  const filteredList = useMemo(() => {
    return rawList.filter((item) => {
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false
      }
      if (onlyVerified && (!item.verified_count || item.verified_count === 0)) {
        return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        return (
          item.sign_code.toLowerCase().includes(q) ||
          item.name_vi.toLowerCase().includes(q) ||
          (item.name_en && item.name_en.toLowerCase().includes(q))
        )
      }
      return true
    })
  }, [rawList, selectedCategory, onlyVerified, searchQuery])

  // Phân trang
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredList.slice(start, start + pageSize)
  }, [filteredList, currentPage, pageSize])

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat)
    setCurrentPage(1)
  }

  const handleSearchChange = (q: string) => {
    setSearchQuery(q)
    setCurrentPage(1)
  }

  const handleVerifiedToggle = (checked: boolean) => {
    setOnlyVerified(checked)
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
          className="w-full max-w-5xl max-h-[85vh] flex flex-col bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-xl shadow-2xl overflow-hidden text-left my-auto animate-in zoom-in-95"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-200 dark:border-white/10 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-gray-400">
                Catalog 429 biển báo QCVN
              </span>
              {data && (
                <span className="text-xs font-mono text-gray-500">
                  • {data.classes_with_verified_signs}/{data.total_catalog_classes} class có mẫu verified
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mt-0.5">
              Phân phối mẫu verified
            </h3>
          </div>

          {/* Filter Bar */}
          <div className="px-5 py-3 border-b border-gray-200 dark:border-white/10 shrink-0 space-y-2 bg-gray-50/30 dark:bg-white/[0.01]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Category pills trực tiếp từ API */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none text-xs font-mono">
                {dynamicCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryChange(cat)}
                    className={`px-3 py-1 rounded-md transition-colors cursor-pointer shrink-0 ${
                      selectedCategory === cat
                        ? 'bg-[#007b8b] text-white font-bold shadow-2xs'
                        : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {cat === 'ALL' ? 'Tất cả' : cat}
                  </button>
                ))}
              </div>

              {/* Ô tìm kiếm */}
              <div className="w-full sm:w-64 shrink-0">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Tìm theo mã, tên biển..."
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#061115] text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#007b8b]"
                />
              </div>
            </div>

            {/* Checkbox lọc verified và đếm số kết quả */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={onlyVerified}
                  onChange={(e) => handleVerifiedToggle(e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-700 text-[#007b8b] focus:ring-0"
                />
                <span>Chỉ hiện class có mẫu verified</span>
              </label>

              <span className="text-gray-400 font-mono text-[11px]">
                {filteredList.length} kết quả
              </span>
            </div>
          </div>

          {/* Table Content (Sticky Header, dễ nhìn, font chữ rõ ràng) */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-12 text-center text-xs font-mono text-gray-400">
                Đang tải danh mục biển báo...
              </div>
            ) : error ? (
              <div className="m-5 p-4 rounded-lg bg-rose-500/10 border border-rose-500/25 text-xs font-mono text-rose-600 dark:text-rose-400">
                {error}
              </div>
            ) : filteredList.length === 0 ? (
              <div className="p-12 text-center text-xs text-gray-400 border border-gray-200 dark:border-white/10 rounded-lg m-5">
                Không tìm thấy biển báo phù hợp
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                {/* Header dính (Sticky) để khi cuộn không bị mất tiêu đề cột */}
                <thead className="sticky top-0 bg-gray-50 dark:bg-[#061115] border-b border-gray-200 dark:border-white/10 text-[11px] text-gray-500 dark:text-gray-400 font-mono z-10 shadow-2xs">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold w-28">Mã biển</th>
                    <th className="py-2.5 px-4 font-semibold">Tên tiếng Việt</th>
                    <th className="py-2.5 px-4 font-semibold">Tên tiếng Anh</th>
                    <th className="py-2.5 px-4 font-semibold w-36">Danh mục</th>
                    <th className="py-2.5 px-4 font-semibold text-right w-28">Mẫu verified</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {paginatedList.map((item) => (
                    <tr
                      key={item.class_id || item.sign_code}
                      className="hover:bg-gray-50/80 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      {/* 1. Mã biển */}
                      <td className="py-2.5 px-4 font-mono font-bold text-gray-900 dark:text-white whitespace-nowrap">
                        {item.sign_code}
                      </td>

                      {/* 2. Tên tiếng Việt */}
                      <td className="py-2.5 px-4 text-gray-800 dark:text-gray-200 font-medium">
                        {item.name_vi}
                      </td>

                      {/* 3. Tên tiếng Anh */}
                      <td className="py-2.5 px-4 text-gray-400">
                        {item.name_en || '-'}
                      </td>

                      {/* 4. Danh mục (nguyên bản enum API trả về) */}
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10">
                          {item.category}
                        </span>
                      </td>

                      {/* 5. Số mẫu verified */}
                      <td className="py-2.5 px-4 text-right font-mono whitespace-nowrap">
                        {item.verified_count > 0 ? (
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {item.verified_count}
                          </span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer phân trang Catalog */}
          <div className="px-5 py-2.5 bg-gray-50/50 dark:bg-white/[0.02] border-t border-gray-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div className="flex-1 min-w-0">
              {filteredList.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalItems={filteredList.length}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(sz) => {
                    setPageSize(sz)
                    setCurrentPage(1)
                  }}
                  pageSizeOptions={[15, 25, 50, 100]}
                  itemLabel="biển"
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
