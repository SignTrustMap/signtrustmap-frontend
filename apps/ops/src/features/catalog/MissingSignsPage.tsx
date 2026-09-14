import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/context/ToastContext'
import { useSidebar } from '@/context/SidebarContext'
import { Pagination } from '@/components/common/Pagination'
import { DataFilterBar } from '@/components/common/DataFilterBar'
import { ModalPortal } from '@/components/common/ModalPortal'
import PageHeader from '@/components/common/PageHeader'
import CustomSelect, { type OptionItem } from '@/components/common/CustomSelect'
import { SearchBar } from '@/components/common/SearchBar'
import {
  Sparkle,
  Lightbulb,
  Clock,
  RocketLaunch,
  ArrowsMerge,
  Check,
  X,
  Prohibit,
  MapPin,
  User,
  Eye,
  Table,
  SquaresFour,
  Funnel,
  Copy,
  ShieldCheck,
} from '@phosphor-icons/react'
import {
  mockMissingSignTypeReports,
  availableCatalogSigns,
  type MissingSignTypeReport,
  type AvailableSignOption,
} from '@/data'
import { mockCatalogData } from '@/data/catalogData'
import { TrafficSignGraphic } from '@/features/catalog/components/TrafficSignGraphic'

type MissingRejectReasonKey = 'reason_not_sign' | 'reason_blurred' | 'reason_duplicate'

function CategoryBadge({ category }: { category: string }) {
  const { t } = useTranslation('ops')
  switch (category) {
    case 'prohibitory':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30 whitespace-nowrap">
          {t('missing_signs.cat_prohibitory')}
        </span>
      )
    case 'warning':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 whitespace-nowrap">
          {t('missing_signs.cat_warning')}
        </span>
      )
    case 'mandatory':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 whitespace-nowrap">
          {t('missing_signs.cat_mandatory')}
        </span>
      )
    case 'guide':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 whitespace-nowrap">
          {t('missing_signs.cat_guide')}
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 whitespace-nowrap">
          {category}
        </span>
      )
  }
}

function StatusBadge({ status }: { status: MissingSignTypeReport['status'] }) {
  const { t } = useTranslation('ops')
  switch (status) {
    case 'Open':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          {t('missing_signs.status_open')}
        </span>
      )
    case 'Approved':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-50 dark:bg-cyan-500/15 text-cyan-800 dark:text-[#00c4de] border border-cyan-200 dark:border-cyan-500/30 whitespace-nowrap">
          <RocketLaunch size={12} weight="bold" />
          {t('missing_signs.status_approved')}
        </span>
      )
    case 'Merged':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 whitespace-nowrap">
          <ArrowsMerge size={12} weight="bold" />
          {t('missing_signs.status_merged')}
        </span>
      )
    case 'Rejected':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30 whitespace-nowrap">
          <Prohibit size={12} />
          {t('missing_signs.status_rejected')}
        </span>
      )
  }
}

export default function MissingSignsPage() {
  const { t } = useTranslation(['ops', 'common'])
  const { success, error } = useToast()
  const { isCollapsed } = useSidebar()

  const [reports, setReports] = useState<MissingSignTypeReport[]>(mockMissingSignTypeReports)
  const [selectedReport, setSelectedReport] = useState<MissingSignTypeReport | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'Open' | 'Approved' | 'Merged' | 'Rejected'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Sub-Modals
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false)
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false)
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)

  const [selectedCatalogCode, setSelectedCatalogCode] = useState('P.102')
  const [catalogSearch, setCatalogSearch] = useState('')
  const [escalateNote, setEscalateNote] = useState('')
  const [rejectReasonKey, setRejectReasonKey] = useState<MissingRejectReasonKey>('reason_not_sign')

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (isMergeModalOpen) setIsMergeModalOpen(false)
        else if (isEscalateModalOpen) setIsEscalateModalOpen(false)
        else if (isRejectModalOpen) setIsRejectModalOpen(false)
        else if (selectedReport) setSelectedReport(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMergeModalOpen, isEscalateModalOpen, isRejectModalOpen, selectedReport])

  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, searchQuery, selectedCategory])

  // KPIs
  const kpiStats = useMemo(() => {
    const total = reports.length
    const pending = reports.filter((r) => r.status === 'Open').length
    const escalated = reports.filter((r) => r.status === 'Approved').length
    const merged = reports.filter((r) => r.status === 'Merged').length
    return { total, pending, escalated, merged }
  }, [reports])

  // Category filter options
  const categoryOptions: OptionItem[] = [
    { value: 'all', label: t('missing_signs.cat_all') },
    { value: 'prohibitory', label: t('missing_signs.cat_prohibitory') },
    { value: 'warning', label: t('missing_signs.cat_warning') },
    { value: 'mandatory', label: t('missing_signs.cat_mandatory') },
    { value: 'guide', label: t('missing_signs.cat_guide') },
  ]

  // Catalog search filtering for Merge modal
  const filteredCatalogSigns = useMemo(() => {
    return availableCatalogSigns.filter(
      (s: AvailableSignOption) =>
        s.code.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        s.codeTitle.toLowerCase().includes(catalogSearch.toLowerCase())
    )
  }, [catalogSearch])

  // Main reports filtering
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        r.id.toLowerCase().includes(q) ||
        r.tempLabel.toLowerCase().includes(q) ||
        r.reporterNote.toLowerCase().includes(q) ||
        r.reportedBy.toLowerCase().includes(q) ||
        (r.roadAddress && r.roadAddress.toLowerCase().includes(q)) ||
        r.similarCatalogEntries.some((code) => code.toLowerCase().includes(q))

      const matchesTab = activeTab === 'all' || r.status === activeTab
      const matchesCategory = selectedCategory === 'all' || r.category === selectedCategory

      return matchesSearch && matchesTab && matchesCategory
    })
  }, [reports, searchQuery, activeTab, selectedCategory])

  const paginatedReports = useMemo(() => {
    return filteredReports.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  }, [filteredReports, currentPage, pageSize])

  // Handlers
  function handleMergeSubmit() {
    if (!selectedReport) return
    const updatedId = selectedReport.id
    setReports((prev) =>
      prev.map((r) =>
        r.id === updatedId
          ? {
              ...r,
              status: 'Merged',
              tempLabel: `${t('missing_signs.label_merged_prefix')} ${selectedCatalogCode} (${r.tempLabel})`,
            }
          : r
      )
    )
    success(t('missing_signs.toast_merged', { id: updatedId, code: selectedCatalogCode }))
    setIsMergeModalOpen(false)
    setSelectedReport(null)
  }

  function handleEscalateSubmit() {
    if (!selectedReport) return
    const updatedId = selectedReport.id
    setReports((prev) =>
      prev.map((r) =>
        r.id === updatedId
          ? {
              ...r,
              status: 'Approved',
              tempLabel: `${t('missing_signs.label_pending_admin')} ${r.tempLabel}`,
            }
          : r
      )
    )
    success(t('missing_signs.toast_escalated', { id: updatedId }))
    setIsEscalateModalOpen(false)
    setSelectedReport(null)
  }

  function handleRejectSubmit() {
    if (!selectedReport) return
    const updatedId = selectedReport.id
    const reasonText = t(`missing_signs.${rejectReasonKey}`)
    setReports((prev) =>
      prev.map((r) =>
        r.id === updatedId
          ? {
              ...r,
              status: 'Rejected',
              tempLabel: `${t('missing_signs.label_rejected')} ${r.tempLabel}`,
            }
          : r
      )
    )
    error(t('missing_signs.toast_rejected', { id: updatedId, reason: reasonText }))
    setIsRejectModalOpen(false)
    setSelectedReport(null)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-[1680px] mx-auto space-y-6">
      {/* ─── HEADER ─────────────────────────────────────────────────── */}
      <PageHeader
        title={t('missing_signs.title')}
        actions={
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/10 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-[#0A171C] text-gray-900 dark:text-white shadow-xs font-bold'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <Table size={15} weight={viewMode === 'table' ? 'bold' : 'regular'} />
              <span className="hidden sm:inline">{t('missing_signs.view_mode_table')}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-[#0A171C] text-gray-900 dark:text-white shadow-xs font-bold'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <SquaresFour size={15} weight={viewMode === 'grid' ? 'bold' : 'regular'} />
              <span className="hidden sm:inline">{t('missing_signs.view_mode_grid')}</span>
            </button>
          </div>
        }
      />

      {/* ─── KPI SUMMARY METRIC CARDS (Uniform & Non-clickable) ──────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Proposals */}
        <div className="p-4 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0A171C] space-y-2 select-none shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400 uppercase">
              {t('missing_signs.kpi_total_proposals')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#007b8b]/10 dark:bg-[#00c4de]/20 flex items-center justify-center text-[#007b8b] dark:text-[#00c4de]">
              <Lightbulb size={18} weight="bold" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-gray-900 dark:text-white">
              {kpiStats.total}
            </span>
            <span className="text-xs text-gray-400 font-sans">{t('missing_signs.unit_proposals')}</span>
          </div>
        </div>

        {/* KPI 2: Pending Staff Review */}
        <div className="p-4 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0A171C] space-y-2 select-none shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 uppercase">
              {t('missing_signs.kpi_pending_review')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock size={18} weight="bold" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-amber-600 dark:text-amber-400">
              {kpiStats.pending}
            </span>
            <span className="text-xs text-amber-500/80 font-sans">{t('missing_signs.unit_pending')}</span>
          </div>
        </div>

        {/* KPI 3: Escalated to Admin */}
        <div className="p-4 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0A171C] space-y-2 select-none shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-cyan-700 dark:text-[#00c4de] uppercase">
              {t('missing_signs.kpi_escalated_admin')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-500/20 flex items-center justify-center text-cyan-700 dark:text-[#00c4de]">
              <RocketLaunch size={18} weight="bold" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-cyan-800 dark:text-[#00c4de]">
              {kpiStats.escalated}
            </span>
            <span className="text-xs text-cyan-600 dark:text-cyan-400 font-sans">{t('missing_signs.unit_escalated')}</span>
          </div>
        </div>

        {/* KPI 4: Merged into Catalog */}
        <div className="p-4 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0A171C] space-y-2 select-none shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400 uppercase">
              {t('missing_signs.kpi_merged_catalog')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <ArrowsMerge size={18} weight="bold" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-purple-600 dark:text-purple-400">
              {kpiStats.merged}
            </span>
            <span className="text-xs text-purple-500/80 font-sans">{t('missing_signs.unit_merged')}</span>
          </div>
        </div>
      </div>

      {/* ─── FILTER AND SEARCH BAR ──────────────────────────────────── */}
      <div className="space-y-3">
        <DataFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={t('missing_signs.search_placeholder')}
          categories={[
            {
              id: 'all',
              label: t('missing_signs.tab_all'),
              count: kpiStats.total,
            },
            {
              id: 'Open',
              label: t('missing_signs.tab_open'),
              count: kpiStats.pending,
            },
            {
              id: 'Approved',
              label: t('missing_signs.tab_escalated'),
              count: kpiStats.escalated,
            },
            {
              id: 'Merged',
              label: t('missing_signs.tab_merged'),
              count: kpiStats.merged,
            },
          ]}
          selectedCategory={activeTab}
          onSelectCategory={(id) => setActiveTab(id as 'all' | 'Open' | 'Approved' | 'Merged' | 'Rejected')}
        />

        {/* Secondary Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-52 sm:w-60">
              <CustomSelect
                options={categoryOptions}
                value={selectedCategory}
                onChange={setSelectedCategory}
                prefixLabel={t('missing_signs.filter_category')}
                leftIcon={<Funnel size={14} className="text-gray-400" />}
                size="sm"
              />
            </div>
          </div>

          {/* Indicator if expanded columns are shown */}
          {isCollapsed && (
            <div className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-mono font-medium text-[#007b8b] dark:text-[#00c4de] bg-[#007b8b]/10 dark:bg-[#00c4de]/10 px-2.5 py-1 rounded-lg">
              <ShieldCheck size={14} weight="bold" />
              <span>{t('missing_signs.badge_extra_columns')}</span>
            </div>
          )}
        </div>
      </div>

      {/* ─── MAIN CONTENT: TABLE VIEW OR GRID VIEW ──────────────────── */}
      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-mono uppercase border-b border-gray-200 dark:border-white/10">
                <tr>
                  <th className="py-2.5 px-3 font-semibold w-24">{t('missing_signs.th_id')}</th>
                  <th className="py-2.5 px-3 font-semibold w-16">{t('missing_signs.th_sample')}</th>
                  <th className="py-2.5 px-3 font-semibold">{t('missing_signs.th_temp_label')}</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap">{t('missing_signs.th_category')}</th>
                  <th className="py-2.5 px-3 font-semibold">{t('missing_signs.th_location')}</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap">{t('missing_signs.th_similar')}</th>
                  <th className="py-2.5 px-2.5 font-semibold text-center whitespace-nowrap">{t('missing_signs.th_status')}</th>
                  {isCollapsed && (
                    <>
                      <th className="py-2.5 px-3 font-semibold whitespace-nowrap hidden md:table-cell animate-in fade-in duration-300">
                        {t('missing_signs.th_reporter')}
                      </th>
                    </>
                  )}
                  <th className="py-2.5 px-3 font-semibold text-right whitespace-nowrap w-24">{t('missing_signs.th_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {paginatedReports.length === 0 ? (
                  <tr>
                    <td colSpan={isCollapsed ? 9 : 8} className="py-12 text-center text-gray-400 dark:text-gray-500 space-y-2">
                      <Sparkle size={32} className="mx-auto opacity-40" />
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('missing_signs.empty_title')}</p>
                      <p className="text-xs">{t('missing_signs.empty_desc')}</p>
                    </td>
                  </tr>
                ) : (
                  paginatedReports.map((report) => (
                    <tr
                      key={report.id}
                      onClick={() => setSelectedReport(report)}
                      className="hover:bg-gray-50/70 dark:hover:bg-white/5 transition-colors group cursor-pointer"
                    >
                      {/* Proposal ID */}
                      <td className="py-2.5 px-3 font-mono font-bold text-gray-900 dark:text-white whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/10 text-[11px]">
                          {report.id}
                        </span>
                      </td>

                      {/* Photo Thumbnail */}
                      <td className="py-2 px-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 dark:border-white/10 bg-gray-100 shrink-0">
                          <img
                            src={report.sampleImageUrl}
                            alt={report.tempLabel}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                      </td>

                      {/* Proposed Label */}
                      <td className="py-2.5 px-3">
                        <div className="min-w-0 max-w-[160px] sm:max-w-[220px] lg:max-w-[280px]">
                          <span className="font-bold text-gray-900 dark:text-white truncate block text-xs" title={report.tempLabel}>
                            {report.tempLabel}
                          </span>
                          <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate block italic">
                            &ldquo;{report.reporterNote}&rdquo;
                          </span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <CategoryBadge category={report.category} />
                      </td>

                      {/* Location */}
                      <td className="py-2.5 px-3 text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-1.5 min-w-0 max-w-[140px] sm:max-w-[180px] lg:max-w-[220px]">
                          <MapPin size={13} className="text-[#007b8b] dark:text-[#00c4de] shrink-0" />
                          <span className="truncate text-xs" title={report.roadAddress || `${report.lat}° N, ${report.lng}° E`}>
                            {report.roadAddress || `${report.lat.toFixed(4)}°, ${report.lng.toFixed(4)}°`}
                          </span>
                        </div>
                      </td>

                      {/* Similar Matches with Mini Graphic */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {report.similarCatalogEntries.slice(0, 2).map((code) => {
                            const catalogEntry = mockCatalogData.find(
                              (c) => c.code.toLowerCase() === code.toLowerCase()
                            )
                            return (
                              <div
                                key={code}
                                className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10"
                                title={catalogEntry?.nameVi}
                              >
                                {catalogEntry && (
                                  <div className="w-4 h-4 shrink-0">
                                    <TrafficSignGraphic sign={catalogEntry} className="w-full h-full object-contain" />
                                  </div>
                                )}
                                <span className="font-mono font-bold text-[10px] text-gray-700 dark:text-gray-300">
                                  {code}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                        <StatusBadge status={report.status} />
                      </td>

                      {/* Adaptive Column: Reporter & Date (When sidebar collapsed) */}
                      {isCollapsed && (
                        <td className="py-2.5 px-3 hidden md:table-cell whitespace-nowrap">
                          <div className="space-y-0.5">
                            <span className="font-semibold text-gray-800 dark:text-gray-200 block text-xs">
                              {report.reportedBy}
                            </span>
                            <span className="text-[10px] font-mono text-gray-400 block">
                              {report.reportedAt}
                            </span>
                          </div>
                        </td>
                      )}

                      {/* Action Button */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedReport(report)
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 text-xs font-semibold text-gray-700 dark:text-gray-200 transition-colors cursor-pointer group-hover:border-[#007b8b]/40 dark:group-hover:border-[#00c4de]/40"
                        >
                          <Eye size={14} className="text-[#007b8b] dark:text-[#00c4de]" />
                          <span>{t('missing_signs.btn_inspect_triage')}</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer pagination */}
          <div className="px-4 py-3 border-t border-gray-200/80 dark:border-white/10">
            <Pagination
              currentPage={currentPage}
              totalItems={filteredReports.length}
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
      ) : (
        /* Grid View */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedReports.map((report) => (
              <div
                key={report.id}
                onClick={() => setSelectedReport(report)}
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

                  {/* Actions matching Flow 10 */}
                  <div className="pt-3 border-t border-gray-100 dark:border-white/10 flex items-center justify-between gap-1.5">
                    {report.status === 'Open' ? (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedReport(report)
                            setIsMergeModalOpen(true)
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
                            setSelectedReport(report)
                            setIsEscalateModalOpen(true)
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
                            setSelectedReport(report)
                            setIsRejectModalOpen(true)
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
              totalItems={filteredReports.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize)
                setCurrentPage(1)
              }}
              pageSizeOptions={[6, 12, 24]}
            />
          </div>
        </div>
      )}

      {/* ─── MODAL: CHI TIẾT SƠ THẨM HỒ SƠ ĐỀ XUẤT (INSPECTION MODAL) ── */}
      {selectedReport && !isMergeModalOpen && !isEscalateModalOpen && !isRejectModalOpen && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setSelectedReport(null)}
          >
          <div
            className="bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/15 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#007b8b]/10 dark:bg-[#00c4de]/20 flex items-center justify-center text-[#007b8b] dark:text-[#00c4de] shrink-0">
                  <Sparkle size={22} weight="bold" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-white/10">
                      {selectedReport.id}
                    </span>
                    <StatusBadge status={selectedReport.status} />
                    <CategoryBadge category={selectedReport.category} />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mt-1">
                    {t('missing_signs.modal_details_title')}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left Column: Evidence Photo & AI Suggestions */}
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-2">
                      {t('missing_signs.lbl_evidence_photo')}
                    </span>
                    <div className="relative aspect-4/3 rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-black/40 group">
                      <img
                        src={selectedReport.sampleImageUrl}
                        alt={selectedReport.tempLabel}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 left-2 px-2 py-1 rounded bg-black/70 backdrop-blur-xs text-white text-[10px] font-mono">
                        {selectedReport.id}
                      </div>
                    </div>
                  </div>

                  {/* AI CLIP Suggestion */}
                  {selectedReport.clipPrompt && (
                    <div className="p-3.5 rounded-xl border border-[#007b8b]/25 dark:border-[#00c4de]/30 bg-[#007b8b]/5 dark:bg-[#00c4de]/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-bold text-[#007b8b] dark:text-[#00c4de] uppercase tracking-wider">
                          {t('missing_signs.lbl_ai_suggestion')}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedReport.clipPrompt || '')
                            success(t('catalog.copied'))
                          }}
                          className="inline-flex items-center gap-1 text-[10px] text-[#007b8b] dark:text-[#00c4de] hover:underline cursor-pointer"
                        >
                          <Copy size={12} />
                          <span>{t('catalog.copy_prompt')}</span>
                        </button>
                      </div>
                      <p className="font-mono text-[11px] text-gray-700 dark:text-gray-300 bg-white/70 dark:bg-black/30 p-2 rounded-lg border border-gray-200 dark:border-white/10 break-words">
                        {selectedReport.clipPrompt}
                      </p>
                    </div>
                  )}
                </div>

                {/* Right Column: Information & Comparison */}
                <div className="space-y-4">
                  {/* Proposed Label */}
                  <div className="p-3.5 rounded-xl border border-gray-200/80 dark:border-white/10 bg-gray-50/70 dark:bg-white/5 space-y-1">
                    <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block">
                      {t('missing_signs.lbl_proposed_label')}
                    </span>
                    <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                      {selectedReport.tempLabel}
                    </h4>
                  </div>

                  {/* Location & GPS */}
                  <div className="p-3.5 rounded-xl border border-gray-200/80 dark:border-white/10 bg-gray-50/70 dark:bg-white/5 space-y-1.5">
                    <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block">
                      {t('missing_signs.lbl_road_location')}
                    </span>
                    <div className="flex items-start gap-2 text-gray-900 dark:text-white font-medium text-xs">
                      <MapPin size={15} className="text-[#007b8b] dark:text-[#00c4de] shrink-0 mt-0.5" />
                      <span>{selectedReport.roadAddress || `${selectedReport.lat}° N, ${selectedReport.lng}° E`}</span>
                    </div>
                    <div className="text-[11px] font-mono text-gray-500 pl-6">
                      WGS84: {selectedReport.lat.toFixed(5)}, {selectedReport.lng.toFixed(5)}
                    </div>
                  </div>

                  {/* Reporter Note */}
                  <div>
                    <span className="text-[11px] font-mono font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">
                      {t('missing_signs.lbl_reporter_notes')}
                    </span>
                    <div className="p-3 rounded-xl border border-amber-200/60 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5 text-gray-800 dark:text-gray-200 leading-relaxed italic text-xs">
                      &ldquo;{selectedReport.reporterNote}&rdquo;
                    </div>
                  </div>

                  {/* Closest Catalog Matches */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-mono font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                      {t('missing_signs.lbl_closest_catalog')}
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedReport.similarCatalogEntries.map((code) => {
                        const catalogEntry = mockCatalogData.find(
                          (c) => c.code.toLowerCase() === code.toLowerCase()
                        )
                        return (
                          <div
                            key={code}
                            className="p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 flex items-center gap-2"
                          >
                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 p-0.5 flex items-center justify-center shrink-0">
                              {catalogEntry ? (
                                <TrafficSignGraphic sign={catalogEntry} className="w-full h-full object-contain" />
                              ) : (
                                <span className="font-mono text-[10px] font-bold">{code}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="font-mono font-bold text-[#007b8b] dark:text-[#00c4de] text-[11px] block">
                                {code}
                              </span>
                              <span className="text-[11px] text-gray-700 dark:text-gray-300 truncate block">
                                {catalogEntry?.nameVi || code}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Submission metadata */}
                  <div className="flex items-center justify-between text-xs text-gray-400 font-mono pt-2 border-t border-gray-100 dark:border-white/10">
                    <span>{t('missing_signs.lbl_reported_by')} {selectedReport.reportedBy}</span>
                    <span>{selectedReport.reportedAt}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Quick Actions matching Flow 10 */}
            <div className="p-4 sm:p-5 border-t border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-white/5 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                {selectedReport.status === 'Open' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsMergeModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
                    >
                      <ArrowsMerge size={15} weight="bold" />
                      <span>{t('missing_signs.btn_merge_catalog')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsEscalateModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#007b8b] hover:bg-[#00606d] text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
                    >
                      <RocketLaunch size={15} weight="bold" />
                      <span>{t('missing_signs.btn_escalate_admin')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsRejectModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-200 dark:border-red-500/40 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 text-red-700 dark:text-red-400 text-xs font-bold transition-all cursor-pointer active:scale-95"
                    >
                      <Prohibit size={15} />
                      <span>{t('missing_signs.btn_reject')}</span>
                    </button>
                  </>
                ) : (
                  <span className="text-xs font-semibold text-gray-500">
                    {t('missing_signs.tab_processed')}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                {t('missing_signs.btn_cancel')}
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* ─── MODAL: Gộp vào Catalog có sẵn ─────────────────────────── */}
      {isMergeModalOpen && selectedReport && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/15 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/10 pb-3">
              <h3 className="font-bold text-purple-600 dark:text-purple-400 text-base flex items-center gap-2">
                <ArrowsMerge size={18} weight="bold" />
                <span>{t('missing_signs.modal_merge_title')}</span>
              </h3>
              <button onClick={() => setIsMergeModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              {t('missing_signs.modal_merge_desc')}
            </p>

            <SearchBar
              value={catalogSearch}
              onChange={setCatalogSearch}
              placeholder={t('catalog.search_placeholder')}
              size="sm"
            />

            <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
              {filteredCatalogSigns.map((s: AvailableSignOption) => {
                const isSelected = selectedCatalogCode === s.code
                return (
                  <div
                    key={s.code}
                    onClick={() => setSelectedCatalogCode(s.code)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-700 dark:text-purple-300 font-bold'
                        : 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <div>
                      <span className="font-mono font-bold">{s.code}</span> - {s.codeTitle.split(' - ')[1] || s.codeTitle}
                      <span className="text-[10px] text-gray-400 block font-normal">{t(`catalog.${s.nameKey}`)}</span>
                    </div>
                    {isSelected && <Check size={16} weight="bold" className="text-purple-600" />}
                  </div>
                )
              })}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-white/10">
              <button
                type="button"
                onClick={() => setIsMergeModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer"
              >
                {t('missing_signs.btn_cancel')}
              </button>
              <button
                type="button"
                onClick={handleMergeSubmit}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
              >
                {t('missing_signs.btn_confirm_merge')} ({selectedCatalogCode})
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* ─── MODAL: Chuyển tiếp Admin Bổ sung Catalog ───────────────── */}
      {isEscalateModalOpen && selectedReport && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/15 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/10 pb-3">
              <h3 className="font-bold text-[#007b8b] dark:text-[#00c4de] text-base flex items-center gap-2">
                <RocketLaunch size={18} weight="bold" />
                <span>{t('missing_signs.modal_escalate_title')}</span>
              </h3>
              <button onClick={() => setIsEscalateModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-gray-600 dark:text-gray-300">
                {t('missing_signs.modal_escalate_desc')}
              </p>
              <div>
                <label className="block text-gray-500 font-mono uppercase text-[11px] mb-1">{t('missing_signs.lbl_staff_notes')}</label>
                <textarea
                  rows={3}
                  value={escalateNote}
                  onChange={(e) => setEscalateNote(e.target.value)}
                  placeholder={t('missing_signs.lbl_staff_notes')}
                  className="w-full p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-white/10">
              <button
                type="button"
                onClick={() => setIsEscalateModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer"
              >
                {t('missing_signs.btn_cancel')}
              </button>
              <button
                type="button"
                onClick={handleEscalateSubmit}
                className="px-4 py-2 bg-[#007b8b] hover:bg-[#00606d] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
              >
                {t('missing_signs.btn_confirm_escalate')}
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* ─── MODAL: Từ chối Báo Cáo ──────────────────────────────────── */}
      {isRejectModalOpen && selectedReport && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/15 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/10 pb-3">
              <h3 className="font-bold text-red-600 dark:text-red-400 text-base flex items-center gap-2">
                <Prohibit size={18} />
                <span>{t('missing_signs.modal_reject_title')}</span>
              </h3>
              <button onClick={() => setIsRejectModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-500 font-mono uppercase text-[11px] mb-1">{t('missing_signs.lbl_reject_reason')}</label>
                <CustomSelect
                  value={rejectReasonKey}
                  onChange={(val) => setRejectReasonKey(val as MissingRejectReasonKey)}
                  className="w-full"
                  buttonClassName="w-full bg-gray-50 dark:bg-black/40"
                  options={[
                    {
                      value: 'reason_not_sign',
                      label: t('missing_signs.reason_not_sign'),
                    },
                    {
                      value: 'reason_blurred',
                      label: t('missing_signs.reason_blurred'),
                    },
                    {
                      value: 'reason_duplicate',
                      label: t('missing_signs.reason_duplicate'),
                    },
                  ]}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-white/10">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer"
              >
                {t('missing_signs.btn_cancel')}
              </button>
              <button
                type="button"
                onClick={handleRejectSubmit}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
              >
                {t('missing_signs.btn_confirm_reject')}
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
    </div>
  )
}
