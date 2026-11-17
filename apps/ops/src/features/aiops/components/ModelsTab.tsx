import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { CircleNotch } from '@phosphor-icons/react'
import { Pagination } from '@/components/common/Pagination'
import type { ModelsResponse, ModelArtifactItem } from '@/api/services/aiops.service'

interface ModelsTabProps {
  modelsData: ModelsResponse | null
  modelsLoading: boolean
  modelsSubTab: 'detectors' | 'classifiers'
  setModelsSubTab: React.Dispatch<React.SetStateAction<'detectors' | 'classifiers'>>
}

export function ModelsTab({
  modelsData,
  modelsLoading,
}: ModelsTabProps) {
  const { i18n } = useTranslation('ops')
  const isEn = i18n.language?.startsWith('en')

  const [filterType, setFilterType] = useState<'all' | 'detectors' | 'classifiers'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Flatten models with their category tag
  const allModels = useMemo(() => {
    const list: Array<ModelArtifactItem & { category: 'detector' | 'classifier' }> = []
    ;(modelsData?.detectors || []).forEach((m) => {
      list.push({ ...m, category: 'detector' })
    })
    ;(modelsData?.classifiers || []).forEach((m) => {
      list.push({ ...m, category: 'classifier' })
    })
    return list
  }, [modelsData])

  const filteredModels = useMemo(() => {
    return allModels.filter((m) => {
      if (filterType === 'detectors' && m.category !== 'detector') return false
      if (filterType === 'classifiers' && m.category !== 'classifier') return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return (
          (m.filename || '').toLowerCase().includes(q) ||
          (m.format || '').toLowerCase().includes(q) ||
          (m.size_human || '').toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [allModels, filterType, searchQuery])

  const paginatedModels = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredModels.slice(start, start + pageSize)
  }, [filteredModels, currentPage, pageSize])

  const handleFilterChange = (type: 'all' | 'detectors' | 'classifiers') => {
    setFilterType(type)
    setCurrentPage(1)
  }

  const handleSearchChange = (val: string) => {
    setSearchQuery(val)
    setCurrentPage(1)
  }

  return (
    <div className="space-y-4">
      {/* ── Top Summary Strip & Production Runtime Status ─────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-xl px-4 py-3 shadow-xs">
        <div className="flex items-center gap-4 flex-wrap text-xs">
          <div>
            <span className="text-gray-400 font-mono block text-[10px] uppercase font-bold">
              {isEn ? 'Total models' : 'Tổng số mô hình'}
            </span>
            <span className="font-extrabold font-mono text-base text-gray-900 dark:text-white">
              {(modelsData?.total_detectors ?? 0) + (modelsData?.total_classifiers ?? 0)}
            </span>
          </div>

          <div className="h-6 w-px bg-gray-200 dark:bg-white/10" />

          <div>
            <span className="text-gray-400 font-mono block text-[10px] uppercase font-bold">
              {isEn ? 'Detectors' : 'Mô hình detector'}
            </span>
            <span className="font-extrabold font-mono text-base text-purple-600 dark:text-purple-400">
              {modelsData?.total_detectors ?? 0}
            </span>
          </div>

          <div className="h-6 w-px bg-gray-200 dark:bg-white/10" />

          <div>
            <span className="text-gray-400 font-mono block text-[10px] uppercase font-bold">
              {isEn ? 'Classifiers' : 'Mô hình classifier'}
            </span>
            <span className="font-extrabold font-mono text-base text-[#007b8b] dark:text-[#00c4de]">
              {modelsData?.total_classifiers ?? 0}
            </span>
          </div>
        </div>

        {/* Runtime Loaded Engines Info */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-gray-400 text-[11px] hidden md:inline">
            {isEn ? 'Active in runtime:' : 'Mô hình active runtime:'}
          </span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
            {modelsData?.loaded_detector || 'yolov11x.engine'}
          </span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#00c4de]/10 text-[#007b8b] dark:text-[#00c4de] border border-[#00c4de]/25">
            {modelsData?.loaded_classifier || 'mobileclip_b_lt.engine'}
          </span>
        </div>
      </div>

      {/* ── Search and Filter Controls Bar ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-xl p-3 shadow-xs">
        {/* Filter Pills */}
        <div className="inline-flex items-center p-1 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 text-xs font-semibold">
          <button
            type="button"
            onClick={() => handleFilterChange('all')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              filterType === 'all'
                ? 'bg-white dark:bg-[#0A171C] text-gray-900 dark:text-white shadow-2xs font-bold'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span>{isEn ? 'All models' : 'Tất cả'}</span>
            <span className="text-[10px] opacity-75 font-mono">{allModels.length}</span>
          </button>
          <button
            type="button"
            onClick={() => handleFilterChange('detectors')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              filterType === 'detectors'
                ? 'bg-white dark:bg-[#0A171C] text-purple-600 dark:text-purple-400 shadow-2xs font-bold'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span>{isEn ? 'Detectors' : 'Detectors'}</span>
            <span className="text-[10px] opacity-75 font-mono">{modelsData?.total_detectors ?? 0}</span>
          </button>
          <button
            type="button"
            onClick={() => handleFilterChange('classifiers')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              filterType === 'classifiers'
                ? 'bg-white dark:bg-[#0A171C] text-[#007b8b] dark:text-[#00c4de] shadow-2xs font-bold'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span>{isEn ? 'Classifiers' : 'Classifiers'}</span>
            <span className="text-[10px] opacity-75 font-mono">{modelsData?.total_classifiers ?? 0}</span>
          </button>
        </div>

        {/* Search input */}
        <div className="w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={isEn ? 'Search models...' : 'Tìm kiếm theo tên file...'}
            className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-[#061115] text-xs font-mono text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#007b8b]"
          />
        </div>
      </div>

      {/* ── Models Table ─────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-xl shadow-xs overflow-hidden">
        {modelsLoading ? (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
            <CircleNotch size={24} className="animate-spin text-[#007b8b]" />
            <span className="text-xs font-mono">{isEn ? 'Loading models from Jetson Orin...' : 'Đang tải danh sách mô hình từ máy chủ...'}</span>
          </div>
        ) : filteredModels.length === 0 ? (
          <div className="p-12 text-center text-gray-400 font-mono text-xs">
            {isEn ? 'No models match the current filter.' : 'Không tìm thấy mô hình phù hợp.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-mono text-[11px] border-b border-gray-200 dark:border-white/10">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">{isEn ? 'Model Filename' : 'Tên tệp mô hình'}</th>
                  <th className="py-2.5 px-4 font-semibold">{isEn ? 'Type' : 'Phân loại'}</th>
                  <th className="py-2.5 px-4 font-semibold">{isEn ? 'Format' : 'Định dạng'}</th>
                  <th className="py-2.5 px-4 font-semibold">{isEn ? 'Size' : 'Dung lượng'}</th>
                  <th className="py-2.5 px-4 font-semibold">{isEn ? 'Modified' : 'Ngày cập nhật'}</th>
                  <th className="py-2.5 px-4 font-semibold text-center">{isEn ? 'Runtime Status' : 'Trạng thái'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5 font-mono">
                {paginatedModels.map((m, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/80 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-bold text-gray-900 dark:text-white select-all">
                      {m.filename || 'Unknown'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          m.category === 'detector'
                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                            : 'bg-[#007b8b]/10 text-[#007b8b] dark:text-[#00c4de] border border-[#007b8b]/20'
                        }`}
                      >
                        {m.category === 'detector' ? 'Detector' : 'Classifier'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          m.format === 'engine'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : m.format === 'onnx'
                            ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20'
                            : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'
                        }`}
                      >
                        {m.format === 'engine' ? 'TensorRT' : (m.format || 'weight')}
                      </span>
                    </td>
                    <td className="py-3 px-4 tabular-nums text-gray-700 dark:text-gray-300 font-semibold">
                      {m.size_human || '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-[11px]">
                      {m.modified_at || '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          m.is_loaded
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400'
                        }`}
                      >
                        {m.is_loaded && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                        <span>{m.is_loaded ? 'Active' : 'Standby'}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Standard Catalog Pagination Footer */}
        {filteredModels.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
            <Pagination
              currentPage={currentPage}
              totalItems={filteredModels.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(sz) => {
                setPageSize(sz)
                setCurrentPage(1)
              }}
              pageSizeOptions={[5, 10, 20, 50]}
              itemLabel={isEn ? 'models' : 'mô hình'}
            />
          </div>
        )}
      </div>
    </div>
  )
}
