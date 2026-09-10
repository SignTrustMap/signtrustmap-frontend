import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import CustomSelect from '@/components/common/CustomSelect'
import { Pagination } from '@/components/common/Pagination'
import { DataFilterBar } from '@/components/common/DataFilterBar'
import PageHeader from '@/components/common/PageHeader'
import { useSidebar } from '@/context/SidebarContext'
import {
  Eye,
  Tray,
  WarningOctagon,
  ClockCountdown,
  CheckCircle,
  TrafficSignal,
  User,
  ArrowsClockwise,
} from '@phosphor-icons/react'
import { mockCandidates, type CandidateItem, type PriorityLevel, type CandidateStatus } from '@/data'
import { mockCatalogData } from '@/data/catalogData'
import { TrafficSignGraphic } from '@/features/catalog/components/TrafficSignGraphic'

function PriorityTag({ priority }: { priority: PriorityLevel }) {
  const { t } = useTranslation('ops')
  switch (priority) {
    case 'Cao':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400 border border-red-200 dark:border-red-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          {t('candidates.priority_high')}
        </span>
      )
    case 'Vừa':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
          {t('candidates.priority_med')}
        </span>
      )
    case 'Thấp':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300 border border-gray-200 dark:border-white/10">
          {t('candidates.priority_low')}
        </span>
      )
  }
}

function StatusBadge({ status }: { status: CandidateStatus }) {
  const { t } = useTranslation('ops')
  switch (status) {
    case 'Đang xem xét':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-cyan-500/15 dark:text-[#00c4de] border border-blue-200 dark:border-cyan-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-[#00c4de]" />
          {t('candidates.status_reviewing')}
        </span>
      )
    case 'Chưa xử lý':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400 border border-red-200 dark:border-red-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          {t('candidates.status_pending')}
        </span>
      )
    case 'Đã giải quyết':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {t('candidates.status_resolved')}
        </span>
      )
  }
}

function AnomalyTag({ type }: { type?: 'conflict' | 'low_conf' | 'gps_offset' | 'blur' }) {
  const { t } = useTranslation('ops')
  if (!type) return null

  const colorMap = {
    conflict: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 border-purple-200 dark:border-purple-500/30',
    low_conf: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',
    gps_offset: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300 border-sky-200 dark:border-sky-500/30',
    blur: 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300 border-orange-200 dark:border-orange-500/30',
  }

  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border shrink-0 ${colorMap[type]}`}>
      {t(`candidates.anomaly_${type}`)}
    </span>
  )
}

export default function CandidatesListPage() {
  const { t } = useTranslation('ops')
  const navigate = useNavigate()
  const { isCollapsed } = useSidebar()
  const [candidates] = useState<CandidateItem[]>(mockCandidates)
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch =
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.location && c.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.surveyorName && c.surveyorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.signCode && c.signCode.toLowerCase().includes(searchQuery.toLowerCase()))

    let matchesPriority = true
    if (priorityFilter === 'Cao') matchesPriority = c.priority === 'Cao'
    if (priorityFilter === 'Vừa') matchesPriority = c.priority === 'Vừa'
    if (priorityFilter === 'Thấp') matchesPriority = c.priority === 'Thấp'

    let matchesStatus = true
    if (statusFilter !== 'all') {
      matchesStatus = c.status === statusFilter
    }

    return matchesSearch && matchesPriority && matchesStatus
  })

  const paginatedCandidates = filteredCandidates.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-[1680px] mx-auto space-y-6">
      {/* ─── HEADER ─────────────────────────────────────────────────── */}
      <PageHeader title={t('candidates.title')} />

      {/* ─── KPI SUMMARY METRIC CARDS (Uniform & Non-clickable) ──────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Queue */}
        <div className="p-4 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0A171C] space-y-2 select-none shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400 uppercase">
              {t('candidates.kpi_total_queue')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-600 dark:text-gray-300">
              <Tray size={18} weight="bold" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-gray-900 dark:text-white">
              {candidates.length}
            </span>
            <span className="text-xs text-gray-400 font-sans">{t('candidates.unit_cases')}</span>
          </div>
        </div>

        {/* KPI 2: Critical Priority */}
        <div className="p-4 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0A171C] space-y-2 select-none shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-red-600 dark:text-red-400 uppercase">
              {t('candidates.kpi_critical_priority')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400">
              <WarningOctagon size={18} weight="bold" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-red-600 dark:text-red-400">
              {candidates.filter((c) => c.priority === 'Cao').length}
            </span>
            <span className="text-xs text-red-500/80 font-sans">{t('candidates.unit_high_priority')}</span>
          </div>
        </div>

        {/* KPI 3: Pending Moderation */}
        <div className="p-4 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0A171C] space-y-2 select-none shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 uppercase">
              {t('candidates.kpi_pending_audit')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <ClockCountdown size={18} weight="bold" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-amber-600 dark:text-amber-400">
              {candidates.filter((c) => c.status === 'Chưa xử lý').length}
            </span>
            <span className="text-xs text-amber-600/80 font-sans">{t('candidates.unit_pending')}</span>
          </div>
        </div>

        {/* KPI 4: Under Review */}
        <div className="p-4 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0A171C] space-y-2 select-none shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-[#007b8b] dark:text-[#00c4de] uppercase">
              {t('candidates.kpi_reviewing')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#007b8b]/10 dark:bg-[#00c4de]/20 flex items-center justify-center text-[#007b8b] dark:text-[#00c4de]">
              <CheckCircle size={18} weight="bold" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-[#007b8b] dark:text-[#00c4de]">
              {candidates.filter((c) => c.status === 'Đang xem xét').length}
            </span>
            <span className="text-xs text-[#007b8b]/80 dark:text-[#00c4de]/80 font-sans">{t('candidates.unit_in_progress')}</span>
          </div>
        </div>
      </div>

      {/* ─── FILTER CARD: DataFilterBar with Status Tabs ─────────────── */}
      <DataFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t('candidates.search_placeholder')}
        categories={[
          {
            id: 'all',
            label: t('candidates.status_all', { defaultValue: 'Tất cả' }),
            count: candidates.length,
          },
          {
            id: 'Chưa xử lý',
            label: t('candidates.status_pending'),
            count: candidates.filter((c) => c.status === 'Chưa xử lý').length,
          },
          {
            id: 'Đang xem xét',
            label: t('candidates.status_reviewing'),
            count: candidates.filter((c) => c.status === 'Đang xem xét').length,
          },
          {
            id: 'Đã giải quyết',
            label: t('candidates.status_resolved'),
            count: candidates.filter((c) => c.status === 'Đã giải quyết').length,
          },
        ]}
        selectedCategory={statusFilter}
        onSelectCategory={(id) => {
          setStatusFilter(id)
          setCurrentPage(1)
        }}
      >
        <div className="w-36 sm:w-44 shrink-0">
          <CustomSelect
            prefixLabel={t('candidates.priority_label', { defaultValue: 'Ưu tiên:' })}
            value={priorityFilter}
            onChange={(val) => {
              setPriorityFilter(val)
              setCurrentPage(1)
            }}
            size="sm"
            className="w-full"
            buttonClassName="w-full"
            options={[
              { value: 'all', label: t('candidates.priority_all') },
              { value: 'Cao', label: t('candidates.priority_high') },
              { value: 'Vừa', label: t('candidates.priority_med') },
              { value: 'Thấp', label: t('candidates.priority_low') },
            ]}
          />
        </div>
      </DataFilterBar>

      {/* ─── CANDIDATES LIST TABLE ───────────────────────────────────── */}
      <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-mono uppercase border-b border-gray-200 dark:border-white/10">
              <tr>
                <th className="py-2.5 px-3 font-semibold w-24">{t('candidates.th_id')}</th>
                <th className="py-2.5 px-3 font-semibold">{t('candidates.th_target')}</th>
                <th className="py-2.5 px-3 font-semibold">{t('candidates.th_reason')}</th>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap">{t('candidates.th_date')}</th>
                <th className="py-2.5 px-2.5 font-semibold text-center whitespace-nowrap">{t('candidates.th_priority')}</th>
                <th className="py-2.5 px-2.5 font-semibold text-center whitespace-nowrap">{t('candidates.th_status')}</th>
                {isCollapsed && (
                  <>
                    <th className="py-2.5 px-3 font-semibold whitespace-nowrap hidden md:table-cell animate-in fade-in duration-300">
                      {t('candidates.th_surveyor')}
                    </th>
                    <th className="py-2.5 px-3 font-semibold whitespace-nowrap hidden lg:table-cell animate-in fade-in duration-300">
                      {t('candidates.th_telemetry')}
                    </th>
                  </>
                )}
                <th className="py-2.5 px-3 font-semibold text-right whitespace-nowrap w-24">{t('candidates.th_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {paginatedCandidates.length === 0 ? (
                <tr>
                  <td colSpan={isCollapsed ? 9 : 7} className="py-12 text-center text-gray-400 dark:text-gray-500 space-y-2">
                    <ArrowsClockwise size={32} className="mx-auto opacity-40" />
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('candidates.empty_title')}</p>
                    <p className="text-xs">{t('candidates.empty_desc')}</p>
                  </td>
                </tr>
              ) : (
                paginatedCandidates.map((c) => {
                  const signEntry = c.signCode
                    ? mockCatalogData.find(
                        (s) => s.code.toLowerCase() === c.signCode?.toLowerCase()
                      )
                    : null

                  const targetDetailUrl = `/candidates/${c.id.replace('#', '')}`

                  return (
                    <tr
                      key={c.id}
                      onClick={() => navigate(targetDetailUrl)}
                      className="hover:bg-gray-50/70 dark:hover:bg-white/5 transition-colors group cursor-pointer"
                    >
                      {/* Case ID */}
                      <td className="py-2.5 px-3 font-mono font-bold text-gray-900 dark:text-white whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/10 text-[11px]">
                          {c.id}
                        </span>
                      </td>

                      {/* Sign target with visual graphic preview */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 flex items-center justify-center p-0.5 shrink-0">
                            {signEntry ? (
                              <TrafficSignGraphic sign={signEntry} className="w-full h-full object-contain" />
                            ) : (
                              <TrafficSignal size={15} className="text-[#007b8b]" />
                            )}
                          </div>
                          <div className="min-w-0 max-w-[120px] sm:max-w-[160px] lg:max-w-[190px]">
                            {c.signCode && (
                              <span className="font-mono font-bold text-[#007b8b] dark:text-[#00c4de] mr-1 text-[11px]">
                                {c.signCode}
                              </span>
                            )}
                            <span className="font-semibold text-gray-900 dark:text-white truncate block text-xs" title={c.name}>
                              {c.name}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Reason & Anomaly Tag */}
                      <td className="py-2.5 px-3 text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-1.5 min-w-0 max-w-[140px] sm:max-w-[180px] lg:max-w-[220px]">
                          <AnomalyTag type={c.anomalyType} />
                          <span className="truncate text-xs" title={c.reason}>
                            {c.reason}
                          </span>
                        </div>
                      </td>

                      {/* Reported Date */}
                      <td className="py-2.5 px-3 text-xs text-gray-500 dark:text-gray-400 font-mono whitespace-nowrap">
                        {c.reportedDate}
                      </td>

                      {/* Priority */}
                      <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                        <PriorityTag priority={c.priority} />
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                        <StatusBadge status={c.status} />
                      </td>

                      {/* ADAPTIVE EXTRA COLUMNS: Visible when menu is collapsed */}
                      {isCollapsed && (
                        <>
                          <td className="py-2.5 px-3 text-xs font-medium text-gray-700 dark:text-gray-300 truncate max-w-[120px] hidden md:table-cell animate-in fade-in duration-300" title={c.surveyorName}>
                            <div className="flex items-center gap-1.5 truncate">
                              <User size={13} className="text-gray-400 shrink-0" />
                              <span className="truncate">{c.surveyorName || '—'}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-[11px] font-mono whitespace-nowrap hidden lg:table-cell animate-in fade-in duration-300">
                            {c.aiConfidence !== undefined && (
                              <span className="text-[#007b8b] dark:text-[#00c4de] font-semibold block leading-tight">
                                AI: {c.aiConfidence}%
                              </span>
                            )}
                            {c.location && (
                              <span className="text-gray-400 text-[10px] leading-tight truncate block max-w-[130px]" title={c.location}>
                                {c.location}
                              </span>
                            )}
                          </td>
                        </>
                      )}

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => navigate(targetDetailUrl)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#007b8b] hover:bg-[#00606d] text-white font-semibold rounded-lg transition-all shadow-2xs active:scale-95 cursor-pointer text-xs"
                          title={t('candidates.btn_review')}
                        >
                          <Eye size={13} weight="bold" />
                          <span>{t('candidates.btn_review')}</span>
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
            totalItems={filteredCandidates.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize)
              setCurrentPage(1)
            }}
            pageSizeOptions={[5, 10, 20]}
          />
        </div>
      </div>
    </div>
  )
}
