import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle,
  Plus,
  Coins,
  VideoCamera,
  MapPin,
  Sparkle,
  Eye,
  Camera,
} from '@phosphor-icons/react'
import { useTheme } from '@/context/ThemeContext'
import { useTranslation } from 'react-i18next'
import {
  mockSurveySubmissions,
  type SurveySubmissionItem,
} from '@/data'
import { SurveyDetailModal, NewSignTypeModal } from '@/components/survey'
import { DataFilterBar } from '@/components/common/DataFilterBar'
import { Pagination } from '@/components/common/Pagination'

export default function SurveyHistoryPage() {
  const { isDark } = useTheme()
  const { t } = useTranslation('common')
  const [submissions] = useState<SurveySubmissionItem[]>(mockSurveySubmissions)

  // Selected submission to show in modal
  const [modalSubmission, setModalSubmission] = useState<SurveySubmissionItem | null>(null)

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('date_desc')

  // Modal state for New Sign Type Report
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)

  // Status badge config matching ProfilePage's soft, readable palette
  const getStatusBadge = (status: SurveySubmissionItem['status']) => {
    switch (status) {
      case 'Completed':
        return {
          label: t('survey.status_completed'),
          bg: isDark
            ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/80'
            : 'bg-emerald-50 text-emerald-700 border-emerald-200',
        }
      case 'Processing':
        return {
          label: t('survey.status_processing'),
          bg: isDark
            ? 'bg-cyan-950/50 text-cyan-300 border-cyan-800/80'
            : 'bg-cyan-50 text-cyan-700 border-cyan-200',
        }
      case 'PartiallyProcessed':
        return {
          label: t('survey.status_partial'),
          bg: isDark
            ? 'bg-amber-950/50 text-amber-300 border-amber-800/80'
            : 'bg-amber-50 text-amber-700 border-amber-200',
        }
      case 'Failed':
        return {
          label: t('survey.status_failed'),
          bg: isDark
            ? 'bg-red-950/50 text-red-300 border-red-800/80'
            : 'bg-red-50 text-red-700 border-red-200',
        }
      case 'NoSignDetected':
        return {
          label: t('survey.status_no_sign'),
          bg: isDark
            ? 'bg-white/10 text-gray-300 border-white/20'
            : 'bg-gray-100 text-gray-700 border-gray-200',
        }
      default:
        return {
          label: t('survey.status_queued'),
          bg: isDark
            ? 'bg-white/10 text-gray-300 border-white/20'
            : 'bg-gray-100 text-gray-700 border-gray-200',
        }
    }
  }

  // Filtered and Sorted submissions
  const filteredSubmissions = useMemo(() => {
    const list = submissions.filter((sub) => {
      const matchSearch =
        sub.tripName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.route.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.id.toLowerCase().includes(searchQuery.toLowerCase())

      if (!matchSearch) return false

      if (statusFilter === 'all') return true
      if (statusFilter === 'Failed') return sub.status === 'Failed' || sub.status === 'PartiallyProcessed'
      return sub.status === statusFilter
    })

    // Apply sorting
    return list.sort((a, b) => {
      switch (sortBy) {
        case 'date_asc':
          return a.uploadDate.localeCompare(b.uploadDate)
        case 'signs_desc':
          return b.detectedSignsCount - a.detectedSignsCount
        case 'credits_desc':
          return b.rewardCredits - a.rewardCredits
        case 'name_asc':
          return a.tripName.localeCompare(b.tripName)
        case 'date_desc':
        default:
          return b.uploadDate.localeCompare(a.uploadDate)
      }
    })
  }, [submissions, searchQuery, statusFilter, sortBy])

  // Aggregate stats across all submissions (Flow 2 Contribution Statistics)
  const stats = useMemo(() => {
    const totalTrips = submissions.length
    const totalDetected = submissions.reduce((acc, curr) => acc + curr.detectedSignsCount, 0)
    const totalValidated = submissions.reduce((acc, curr) => acc + curr.validatedSignsCount, 0)
    const totalCredits = submissions.reduce((acc, curr) => acc + curr.rewardCredits, 0)
    const approvalRate = totalDetected > 0 ? Math.round((totalValidated / totalDetected) * 100) : 0

    return { totalTrips, totalDetected, totalValidated, totalCredits, approvalRate }
  }, [submissions])

  // Filter categories config
  const categories = [
    { id: 'all', label: t('survey.filter_all'), count: submissions.length },
    {
      id: 'Completed',
      label: t('survey.filter_completed'),
      count: submissions.filter((s) => s.status === 'Completed').length,
    },
    {
      id: 'Processing',
      label: t('survey.filter_processing'),
      count: submissions.filter((s) => s.status === 'Processing').length,
    },
    {
      id: 'Failed',
      label: t('survey.filter_failed'),
      count: submissions.filter((s) => s.status === 'Failed' || s.status === 'PartiallyProcessed').length,
    },
  ]

  // Sort options
  const sortOptions = [
    { id: 'date_desc', label: t('survey.sort_date_desc') },
    { id: 'date_asc', label: t('survey.sort_date_asc') },
    { id: 'signs_desc', label: t('survey.sort_signs_desc') },
    { id: 'credits_desc', label: t('survey.sort_credits_desc') },
    { id: 'name_asc', label: t('survey.sort_name_asc') },
  ]

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'all' || sortBy !== 'date_desc'

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  const handleResetFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setSortBy('date_desc')
    setCurrentPage(1)
  }

  // Paginated data
  const paginatedSubmissions = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredSubmissions.slice(start, start + pageSize)
  }, [filteredSubmissions, currentPage, pageSize])

  return (
    <div
      className={`w-full min-h-[calc(100vh-80px)] py-8 sm:py-12 transition-colors ${
        isDark ? 'bg-[#030708] text-gray-100' : 'bg-[#F8F7F7] text-gray-900'
      }`}
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-6">
        {/* ─── Page Header (Matching ProfilePage style) ────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-gray-200 dark:border-white/10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {t('survey.history_title')}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t('survey.history_subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-colors cursor-pointer shadow-xs ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 border-white/15 text-gray-200'
                  : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-800'
              }`}
            >
              <Sparkle size={16} className="text-amber-500" />
              <span>{t('survey.btn_report_new_sign')}</span>
            </button>

            <Link
              to="/survey"
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer ${
                isDark
                  ? 'bg-[#00c4de] hover:bg-[#38dbf1] text-black'
                  : 'bg-[#007b8b] hover:bg-[#00606d] text-white'
              }`}
            >
              <Plus size={16} weight="bold" />
              <span>{t('survey.btn_new_survey')}</span>
            </Link>
          </div>
        </div>

        {/* ─── 4 Clean, Unified KPI Summary Cards ──────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            className={`p-5 rounded-2xl border transition-colors ${
              isDark
                ? 'bg-[#071317] border-white/10 shadow-lg shadow-black/40'
                : 'bg-white border-[#E8E4E3] shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                {t('survey.stat_total_trips')}
              </span>
              <VideoCamera size={18} className="text-gray-400" />
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
              {stats.totalTrips}
            </span>
          </div>

          <div
            className={`p-5 rounded-2xl border transition-colors ${
              isDark
                ? 'bg-[#071317] border-white/10 shadow-lg shadow-black/40'
                : 'bg-white border-[#E8E4E3] shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                {t('survey.stat_total_detected')}
              </span>
              <MapPin size={18} className="text-gray-400" />
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
              {stats.totalDetected}
            </span>
          </div>

          <div
            className={`p-5 rounded-2xl border transition-colors ${
              isDark
                ? 'bg-[#071317] border-white/10 shadow-lg shadow-black/40'
                : 'bg-white border-[#E8E4E3] shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                {t('survey.stat_total_verified')}
              </span>
              <CheckCircle size={18} className="text-gray-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
                {stats.totalValidated}
              </span>
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                ({stats.approvalRate}%)
              </span>
            </div>
          </div>

          <div
            className={`p-5 rounded-2xl border transition-colors ${
              isDark
                ? 'bg-[#071317] border-white/10 shadow-lg shadow-black/40'
                : 'bg-white border-[#E8E4E3] shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                {t('survey.stat_total_rewards')}
              </span>
              <Coins size={18} className="text-amber-500" weight="fill" />
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400">
              +{stats.totalCredits}
            </span>
          </div>
        </div>

        {/* ─── Main Submissions Card (Clean, Spacious, Full-Width) ─────────── */}
        <div
          className={`rounded-2xl border overflow-hidden transition-colors ${
            isDark
              ? 'bg-[#071317] border-white/10 shadow-lg shadow-black/40'
              : 'bg-white border-[#E8E4E3] shadow-xs'
          }`}
        >
          {/* Card Header & Universal DataFilterBar */}
          <div className="p-5 sm:p-6 border-b border-gray-200 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white">
                    {t('survey.history_list_title')}
                  </h2>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300">
                    {filteredSubmissions.length}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('survey.history_desc_manage')}
                </p>
              </div>
            </div>

            {/* Reusable DataFilterBar Component */}
            <DataFilterBar
              searchQuery={searchQuery}
              onSearchChange={(q) => {
                setSearchQuery(q)
                setCurrentPage(1)
              }}
              searchPlaceholder={t('survey.search_placeholder')}
              categories={categories}
              selectedCategory={statusFilter}
              onSelectCategory={(cat) => {
                setStatusFilter(cat)
                setCurrentPage(1)
              }}
              sortOptions={sortOptions}
              selectedSort={sortBy}
              onSelectSort={(sort) => {
                setSortBy(sort)
                setCurrentPage(1)
              }}
            />
          </div>

          {/* List of Submissions */}
          <div className="divide-y divide-gray-200 dark:divide-white/10">
            {paginatedSubmissions.length > 0 ? (
              paginatedSubmissions.map((sub) => {
                const badge = getStatusBadge(sub.status)

                return (
                  <div
                    key={sub.id}
                    onClick={() => setModalSubmission(sub)}
                    className={`p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors cursor-pointer ${
                      isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-gray-50/80'
                    }`}
                  >
                    <div className="flex items-start gap-4 min-w-0">
                      {/* Media type icon */}
                      <div
                        className={`w-11 h-11 rounded-xl border shrink-0 mt-0.5 flex items-center justify-center ${
                          isDark
                            ? 'bg-white/5 border-white/10 text-gray-300'
                            : 'bg-gray-100 border-gray-200 text-gray-700'
                        }`}
                      >
                        {sub.mediaType === 'video_gpx' ? <VideoCamera size={20} /> : <Camera size={20} />}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-white">
                            {sub.tripName}
                          </h3>
                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${badge.bg}`}
                          >
                            {badge.label}
                          </span>
                        </div>

                        <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1.5 font-medium">
                          <MapPin size={13} className="text-[#007b8b] dark:text-[#00c4de] shrink-0" />
                          <span>{sub.route}</span>
                          <span className="text-gray-300 dark:text-gray-600">•</span>
                          <span>{sub.uploadDate}</span>
                        </p>
                      </div>
                    </div>

                    {/* Stats & Actions */}
                    <div className="flex items-center gap-6 sm:gap-8 self-end sm:self-center shrink-0">
                      <div className="text-right">
                        <span className="text-[11px] uppercase font-bold tracking-wider text-gray-600 dark:text-gray-400 block">
                          {t('survey.lbl_signs_stat')}
                        </span>
                        <div className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white">
                          <span className="text-[#007b8b] dark:text-[#00c4de]">{sub.detectedSignsCount}</span>
                          <span className="text-gray-400 font-normal"> / </span>
                          <span className="text-emerald-700 dark:text-emerald-400">{sub.validatedSignsCount}</span>
                        </div>
                      </div>

                      <div className="text-right min-w-[70px]">
                        <span className="text-[11px] uppercase font-bold tracking-wider text-gray-600 dark:text-gray-400 block">
                          Credits
                        </span>
                        <span className="font-extrabold text-sm sm:text-base text-amber-600 dark:text-amber-400 flex items-center justify-end gap-1">
                          <Coins size={15} weight="fill" />
                          +{sub.rewardCredits}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setModalSubmission(sub)
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          isDark
                            ? 'bg-white/5 hover:bg-white/10 border-white/15 text-gray-200'
                            : 'bg-white hover:bg-gray-100 border-gray-200 text-gray-800 shadow-xs'
                        }`}
                      >
                        <Eye size={14} />
                        <span>{t('survey.btn_inspect_detail')}</span>
                      </button>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="p-12 text-center text-gray-500 dark:text-gray-400 text-sm space-y-2">
                <p>{t('survey.no_trips_found')}</p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-xs font-bold text-[#007b8b] dark:text-[#00c4de] hover:underline cursor-pointer"
                  >
                    {t('survey.btn_reset_all_filters')}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ─── Shared Pagination ────────────────────────────────────────── */}
          {filteredSubmissions.length > 0 && (
            <div className="p-4 sm:px-6">
              <Pagination
                currentPage={currentPage}
                totalItems={filteredSubmissions.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(sz) => {
                  setPageSize(sz)
                  setCurrentPage(1)
                }}
                pageSizeOptions={[3, 5, 10]}
                itemLabel={t('survey.unit_trips')}
              />
            </div>
          )}
        </div>
      </div>

      {/* ─── Detail Modal for Selected Trip ───────────────────────────────── */}
      <SurveyDetailModal
        isOpen={Boolean(modalSubmission)}
        onClose={() => setModalSubmission(null)}
        submission={modalSubmission}
        getStatusBadge={getStatusBadge}
      />

      {/* ─── New Sign Type Report Modal ────────────────────────────────────── */}
      <NewSignTypeModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  )
}
