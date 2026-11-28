import { useState, useEffect, useCallback } from 'react'
import CustomSelect, { type OptionItem } from '@/components/common/CustomSelect'
import { Pagination } from '@/components/common/Pagination'
import { DataFilterBar } from '@/components/common/DataFilterBar'
import PageHeader from '@/components/common/PageHeader'
import {
  Sparkle,
  Image as ImageIcon,
  CircleNotch,
  ArrowsClockwise,
  Eye,
} from '@phosphor-icons/react'
import { TrafficSignGraphic } from '@/features/catalog/components/TrafficSignGraphic'
import { candidatesService, type CandidateQueryParams } from '@/api/services'
import { resolveImageUrl } from '@/features/map/utils/signUrlHelpers'
import { CandidateInspectionModal } from './components/CandidateInspectionModal'

export interface CandidateTableItem {
  id: string
  signCode: string
  signName: string
  confidenceScore: number
  status: string
  statusTagVi?: string
  cropImageUrl?: string
  bestFrameUrl?: string
  location: string
  surveyorName: string
  createdAt: string
  activeLearningPriority?: number
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return String(dateStr)
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${hours}:${minutes} • ${day}/${month}/${year}`
}

function getStatusDisplay(status: string, statusTagVi?: string) {
  if (statusTagVi) {
    if (status === 'RESOLVED' || status === 'VERIFIED') {
      return {
        label: statusTagVi,
        badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30',
        dotClass: 'bg-emerald-500',
      }
    }
    if (status === 'IN_CONSENSUS') {
      return {
        label: statusTagVi,
        badgeClass: 'bg-blue-50 text-blue-700 dark:bg-cyan-500/15 dark:text-[#00c4de] border-blue-200 dark:border-cyan-500/30',
        dotClass: 'bg-[#007b8b] dark:bg-[#00c4de]',
      }
    }
    return {
      label: statusTagVi,
      badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 border-amber-200 dark:border-amber-500/30',
      dotClass: 'bg-amber-500',
    }
  }

  switch (status) {
    case 'VERIFIED':
    case 'RESOLVED':
      return {
        label: 'Đã giải quyết',
        badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30',
        dotClass: 'bg-emerald-500',
      }
    case 'IN_CONSENSUS':
      return {
        label: 'Đang xem xét',
        badgeClass: 'bg-blue-50 text-blue-700 dark:bg-cyan-500/15 dark:text-[#00c4de] border-blue-200 dark:border-cyan-500/30',
        dotClass: 'bg-[#007b8b] dark:bg-[#00c4de]',
      }
    case 'REJECTED':
      return {
        label: 'Đã từ chối',
        badgeClass: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400 border-red-200 dark:border-red-500/30',
        dotClass: 'bg-red-500',
      }
    case 'RECAPTURE_REQUESTED':
      return {
        label: 'Yêu cầu chụp lại',
        badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 border-amber-200 dark:border-amber-500/30',
        dotClass: 'bg-amber-500',
      }
    case 'PENDING_REVIEW':
    default:
      return {
        label: 'Chưa xử lý',
        badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 border-amber-200 dark:border-amber-500/30',
        dotClass: 'bg-amber-500',
      }
  }
}

export default function CandidatesListPage() {
  const [candidates, setCandidates] = useState<CandidateTableItem[]>([])
  const [totalCount, setTotalCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [confidenceFilter, setConfidenceFilter] = useState('all')
  const [selectedSort, setSelectedSort] = useState<'newest' | 'oldest' | 'conf_asc' | 'conf_desc'>('newest')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Inspection Modal
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null)
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({})

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Load candidates using the official API GET /api/v1/candidates
  const loadCandidates = useCallback(async () => {
    try {
      setIsLoading(true)
      const params: CandidateQueryParams = {
        page: currentPage,
        pageSize,
      }

      if (statusFilter !== 'all') {
        params.status = statusFilter
      }
      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim()
      }

      if (selectedSort === 'newest') {
        params.sortBy = 'createdAt'
        params.sortOrder = 'DESC'
      } else if (selectedSort === 'oldest') {
        params.sortBy = 'createdAt'
        params.sortOrder = 'ASC'
      } else if (selectedSort === 'conf_desc') {
        params.sortBy = 'confidence'
        params.sortOrder = 'DESC'
      } else if (selectedSort === 'conf_asc') {
        params.sortBy = 'confidence'
        params.sortOrder = 'ASC'
      }

      const res = await candidatesService.getCandidates(params)
      const items = res?.items || []
      const total = res?.total ?? items.length

      setTotalCount(total)

      if (Array.isArray(items)) {
        const mapped: CandidateTableItem[] = items.map((item: any) => {
          const signCode = item.predictedSignType?.signCode || item.signCode || '—'
          const signName =
            item.predictedSignType?.nameVi ||
            item.predictedSignType?.nameEn ||
            item.signName ||
            'Biển báo giao thông'

          const rawScore = item.confidenceScore != null ? item.confidenceScore : 0.85
          const confidenceScore = Math.round((rawScore <= 1 ? rawScore * 100 : rawScore) * 10) / 10

          const lat =
            item.locationContext?.coordinates?.latitude ??
            item.submission?.latitude ??
            item.latitude
          const lng =
            item.locationContext?.coordinates?.longitude ??
            item.submission?.longitude ??
            item.longitude

          const location =
            item.locationContext?.nearbyRoad ||
            item.locationContext?.displayLocation ||
            item.location ||
            (lat && lng ? `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}` : 'Chưa có vị trí')

          const surveyorName =
            item.surveyorName ||
            item.surveyor?.fullName ||
            item.submission?.surveyorName ||
            item.submission?.surveyor_name ||
            (item.submission?.surveyor_id || item.submission?.surveyorId || item.surveyorId
              ? `#${String(item.submission?.surveyor_id || item.submission?.surveyorId || item.surveyorId).slice(0, 8)}`
              : 'Khảo sát viên ẩn danh')

          return {
            id: String(item.id),
            signCode,
            signName,
            confidenceScore,
            status: item.statusTag || item.status || 'PENDING_REVIEW',
            statusTagVi: item.statusTagVi,
            cropImageUrl: item.signCropUrl ? resolveImageUrl(item.signCropUrl) : undefined,
            bestFrameUrl: item.bestFrameUrl ? resolveImageUrl(item.bestFrameUrl) : undefined,
            location,
            surveyorName,
            createdAt: item.createdAt || item.submission?.captured_at || new Date().toISOString(),
            activeLearningPriority: item.activeLearningPriority,
          }
        })

        // Apply client-side confidence bucket filter if chosen
        let filtered = mapped
        if (confidenceFilter === 'high') {
          filtered = filtered.filter((c) => c.confidenceScore >= 90)
        } else if (confidenceFilter === 'med') {
          filtered = filtered.filter((c) => c.confidenceScore >= 70 && c.confidenceScore < 90)
        } else if (confidenceFilter === 'low') {
          filtered = filtered.filter((c) => c.confidenceScore < 70)
        }

        setCandidates(filtered)
      } else {
        setCandidates([])
      }
    } catch (err) {
      console.warn('[CandidatesListPage] Failed to load candidates:', err)
      setCandidates([])
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, pageSize, statusFilter, debouncedSearch, selectedSort, confidenceFilter])

  useEffect(() => {
    loadCandidates()
  }, [loadCandidates])

  // Filter & Sort Options (No parentheses)
  const statusOptions: OptionItem[] = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'PENDING_REVIEW', label: 'Chưa xử lý' },
    { value: 'IN_CONSENSUS', label: 'Đang xem xét' },
    { value: 'RESOLVED', label: 'Đã giải quyết' },
  ]

  const confidenceOptions: OptionItem[] = [
    { value: 'all', label: 'Tất cả độ tin cậy' },
    { value: 'high', label: 'Trên 90%' },
    { value: 'med', label: 'Từ 70% đến 90%' },
    { value: 'low', label: 'Dưới 70%' },
  ]

  const sortOptions: OptionItem[] = [
    { value: 'newest', label: 'Mới nhất' },
    { value: 'oldest', label: 'Cũ nhất' },
    { value: 'conf_desc', label: 'Độ tin cậy cao nhất' },
    { value: 'conf_asc', label: 'Độ tin cậy thấp nhất' },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-[1680px] mx-auto space-y-6">
      {/* ─── HEADER ─────────────────────────────────────────────────── */}
      <PageHeader
        title="Ứng viên biển báo"
        subtitle="Giám sát các biển báo do AI nhận diện từ dữ liệu khảo sát và theo dõi tiến trình thẩm định."
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                Tổng <strong className="font-mono text-gray-900 dark:text-white">{totalCount}</strong> ứng viên
              </span>
            </div>

            <button
              type="button"
              disabled={isLoading}
              onClick={loadCandidates}
              className="p-2 border border-gray-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 rounded-xl transition-colors cursor-pointer shrink-0 disabled:opacity-50 shadow-2xs"
              title="Làm mới dữ liệu"
            >
              <ArrowsClockwise size={16} weight="bold" className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        }
      />

      {/* ─── DATA FILTER BAR ─────────────────────────────────────────── */}
      <DataFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Tìm theo mã ứng viên, mã biển, tên đường, người đóng góp..."
      >
        <CustomSelect
          options={statusOptions}
          value={statusFilter}
          onChange={(val) => {
            setStatusFilter(val)
            setCurrentPage(1)
          }}
          prefixLabel="Trạng thái"
          size="sm"
          className="w-full sm:w-48"
        />

        <CustomSelect
          options={confidenceOptions}
          value={confidenceFilter}
          onChange={(val) => {
            setConfidenceFilter(val)
            setCurrentPage(1)
          }}
          prefixLabel="Độ tin cậy"
          size="sm"
          className="w-full sm:w-48"
        />

        <CustomSelect
          options={sortOptions}
          value={selectedSort}
          onChange={(val) => {
            setSelectedSort(val as any)
            setCurrentPage(1)
          }}
          prefixLabel="Sắp xếp"
          size="sm"
          className="w-full sm:w-52"
        />
      </DataFilterBar>

      {/* ─── CANDIDATES TABLE VIEW ───────────────────────────────────── */}
      {isLoading ? (
        <div className="py-16 px-6 text-center space-y-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A171C] shadow-xs">
          <CircleNotch size={28} className="animate-spin text-[#007b8b] dark:text-[#00c4de] mx-auto" />
          <p className="text-xs text-neutral-500 font-medium">Đang tải danh sách ứng viên biển báo...</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-mono border-b border-gray-200 dark:border-white/10">
                <tr>
                  <th className="py-3 px-4 font-semibold whitespace-nowrap">Mã ứng viên</th>
                  <th className="py-3 px-4 font-semibold min-w-[200px]">Biển báo nhận diện</th>
                  <th className="py-3 px-4 font-semibold whitespace-nowrap">Độ tin cậy AI</th>
                  <th className="py-3 px-4 font-semibold whitespace-nowrap">Ảnh thực địa</th>
                  <th className="py-3 px-4 font-semibold whitespace-nowrap">Vị trí ghi nhận</th>
                  <th className="py-3 px-4 font-semibold whitespace-nowrap">Khảo sát viên</th>
                  <th className="py-3 px-4 font-semibold whitespace-nowrap">Thời gian tạo</th>
                  <th className="py-3 px-4 font-semibold whitespace-nowrap">Trạng thái</th>
                  <th className="py-3 px-4 font-semibold text-center whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {candidates.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-14 text-center text-gray-400 dark:text-gray-500 space-y-2">
                      <Sparkle size={36} className="mx-auto opacity-40 text-[#007b8b] dark:text-[#00c4de]" />
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                        Không có ứng viên biển báo nào
                      </p>
                      <p className="text-xs">
                        Hiện không có ứng viên nào khớp với bộ lọc tìm kiếm của bạn.
                      </p>
                    </td>
                  </tr>
                ) : (
                  candidates.map((c) => {
                    const status = getStatusDisplay(c.status, c.statusTagVi)
                    const signEntry = c.signCode !== '—' ? { code: c.signCode, nameVi: c.signName } : null
                    const hasImgError = failedImages[c.id] || !c.cropImageUrl

                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedCandidateId(c.id)}
                        className="hover:bg-gray-50/70 dark:hover:bg-white/5 transition-colors group cursor-pointer"
                      >
                        {/* 1. Candidate ID */}
                        <td className="py-3 px-4 font-mono whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/10 text-[11px] font-semibold">
                            #{c.id.slice(0, 8)}
                          </span>
                        </td>

                        {/* 2. Detected Sign & Vector Graphic */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center p-1 shrink-0">
                              {signEntry ? (
                                <TrafficSignGraphic sign={signEntry} className="w-full h-full object-contain" />
                              ) : (
                                <span className="font-mono text-xs font-bold text-gray-400">?</span>
                              )}
                            </div>
                            <div className="min-w-0 max-w-[220px]">
                              {c.signCode !== '—' && (
                                <span className="font-mono font-bold text-[#007b8b] dark:text-[#00c4de] text-[11px] block">
                                  {c.signCode}
                                </span>
                              )}
                              <span
                                className="font-semibold text-gray-900 dark:text-white truncate block text-xs"
                                title={c.signName}
                              >
                                {c.signName}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 3. AI Confidence */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-bold border ${
                              c.confidenceScore >= 90
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                                : c.confidenceScore >= 70
                                  ? 'bg-blue-50 text-blue-700 dark:bg-cyan-500/15 dark:text-[#00c4de] border-blue-200 dark:border-cyan-500/30'
                                  : 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
                            }`}
                          >
                            {c.confidenceScore}%
                          </span>
                        </td>

                        {/* 4. Evidence Thumbnail */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="w-9 h-9 rounded-lg overflow-hidden border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 flex items-center justify-center shrink-0">
                            {!hasImgError && c.cropImageUrl ? (
                              <img
                                src={c.cropImageUrl}
                                alt={c.signName}
                                onError={() => setFailedImages((prev) => ({ ...prev, [c.id]: true }))}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon size={16} className="text-gray-400" />
                            )}
                          </div>
                        </td>

                        {/* 5. Location */}
                        <td
                          className="py-3 px-4 text-gray-700 dark:text-gray-300 max-w-[180px] truncate"
                          title={c.location}
                        >
                          <span className="truncate block text-xs">{c.location}</span>
                        </td>

                        {/* 6. Surveyor */}
                        <td className="py-3 px-4 font-mono text-[11px] text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {c.surveyorName}
                        </td>

                        {/* 7. Created At */}
                        <td className="py-3 px-4 font-mono text-[11px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {formatDate(c.createdAt)}
                        </td>

                        {/* 8. Status */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${status.badgeClass}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${status.dotClass}`} />
                            {status.label}
                          </span>
                        </td>

                        {/* 9. Actions */}
                        <td
                          className="py-3 px-4 text-center whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedCandidateId(c.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#007b8b] hover:bg-[#00606d] text-white font-semibold rounded-lg transition-all shadow-2xs active:scale-95 cursor-pointer text-xs"
                            title="Xem chi tiết ứng viên"
                          >
                            <Eye size={13} weight="bold" />
                            <span>Chi tiết</span>
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-5 py-3 border-t border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
            <Pagination
              currentPage={currentPage}
              totalItems={totalCount}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize)
                setCurrentPage(1)
              }}
              pageSizeOptions={[10, 20, 50]}
            />
          </div>
        </div>
      )}

      {/* ─── CANDIDATE INSPECTION MODAL ──────────────────────────────── */}
      <CandidateInspectionModal
        isOpen={Boolean(selectedCandidateId)}
        candidateId={selectedCandidateId}
        onClose={() => setSelectedCandidateId(null)}
        onStatusUpdated={loadCandidates}
      />
    </div>
  )
}
