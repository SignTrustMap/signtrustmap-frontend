import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSidebar } from '@/context/SidebarContext'
import { useToast } from '@/context/ToastContext'
import { Pagination } from '@/components/common/Pagination'
import { DataFilterBar } from '@/components/common/DataFilterBar'
import PageHeader from '@/components/common/PageHeader'
import { ModalPortal } from '@/components/common/ModalPortal'
import CustomSelect, { type OptionItem } from '@/components/common/CustomSelect'
import {
  DownloadSimple,
  MapPin,
  WarningCircle,
  Clock,
  MagnifyingGlass,
  CheckCircle,
  Eye,
  X,
  Megaphone,
  User,
  Phone,
  Calendar,
  RocketLaunch,
  Funnel,
  ShieldCheck,
  ArrowsClockwise,
} from '@phosphor-icons/react'
import { mockSignReports, type SignReportItem, type ReportStatus, type IssueType, type ReportPriority } from '@/data'
import { mockCatalogData } from '@/data/catalogData'
import { TrafficSignGraphic } from '@/features/catalog/components/TrafficSignGraphic'

function IssueTypeBadge({ type }: { type: IssueType }) {
  const { t } = useTranslation('ops')
  switch (type) {
    case 'damaged':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 whitespace-nowrap">
          {t('reports.type_damaged')}
        </span>
      )
    case 'obscured':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 whitespace-nowrap">
          {t('reports.type_obscured')}
        </span>
      )
    case 'missing':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 whitespace-nowrap">
          {t('reports.type_missing')}
        </span>
      )
    case 'incorrect':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-50 dark:bg-cyan-500/15 text-cyan-800 dark:text-[#00c4de] border border-cyan-200 dark:border-cyan-500/30 whitespace-nowrap">
          {t('reports.type_incorrect')}
        </span>
      )
  }
}

function PriorityBadge({ priority }: { priority: ReportPriority }) {
  const { t } = useTranslation('ops')
  switch (priority) {
    case 'Cao':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          {t('reports.priority_high')}
        </span>
      )
    case 'Vừa':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 whitespace-nowrap">
          {t('reports.priority_med')}
        </span>
      )
    case 'Thấp':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 whitespace-nowrap">
          {t('reports.priority_low')}
        </span>
      )
  }
}

function ReportStatusBadge({ status }: { status: ReportStatus }) {
  const { t } = useTranslation('ops')
  switch (status) {
    case 'Pending':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border border-red-200 dark:border-red-500/30 whitespace-nowrap">
          {t('reports.tab_pending')}
        </span>
      )
    case 'Investigating':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-[#00c4de] border border-cyan-200 dark:border-cyan-500/30 whitespace-nowrap">
          {t('reports.tab_investigating')}
        </span>
      )
    case 'Resolved':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 whitespace-nowrap">
          {t('reports.tab_resolved')}
        </span>
      )
  }
}

export default function ReportsPage() {
  const { t } = useTranslation('ops')
  const { isCollapsed } = useSidebar()
  const { success } = useToast()

  const [reports, setReports] = useState<SignReportItem[]>(mockSignReports)
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Investigating' | 'Resolved'>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIssueType, setSelectedIssueType] = useState<string>('all')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')
  const [selectedReport, setSelectedReport] = useState<SignReportItem | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && selectedReport) {
        setSelectedReport(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedReport])

  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, searchQuery, selectedIssueType, selectedPriority])

  // KPI Metrics Calculation
  const kpiStats = useMemo(() => {
    const total = reports.length
    const pending = reports.filter((r) => r.status === 'Pending').length
    const investigating = reports.filter((r) => r.status === 'Investigating').length
    const resolved = reports.filter((r) => r.status === 'Resolved').length
    return { total, pending, investigating, resolved }
  }, [reports])

  // Filter options for CustomSelect
  const issueTypeOptions: OptionItem[] = [
    { value: 'all', label: t('reports.type_all') },
    { value: 'damaged', label: t('reports.type_damaged') },
    { value: 'obscured', label: t('reports.type_obscured') },
    { value: 'missing', label: t('reports.type_missing') },
    { value: 'incorrect', label: t('reports.type_incorrect') },
  ]

  const priorityOptions: OptionItem[] = [
    { value: 'all', label: t('reports.priority_all') },
    { value: 'Cao', label: t('reports.priority_high') },
    { value: 'Vừa', label: t('reports.priority_med') },
    { value: 'Thấp', label: t('reports.priority_low') },
  ]

  // Filtering
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        r.id.toLowerCase().includes(q) ||
        r.signCode.toLowerCase().includes(q) ||
        r.signName.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q) ||
        r.reporter.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)

      const matchesTab = activeTab === 'All' || r.status === activeTab
      const matchesIssueType = selectedIssueType === 'all' || r.issueType === selectedIssueType
      const matchesPriority = selectedPriority === 'all' || r.priority === selectedPriority

      return matchesSearch && matchesTab && matchesIssueType && matchesPriority
    })
  }, [reports, searchQuery, activeTab, selectedIssueType, selectedPriority])

  const paginatedReports = useMemo(() => {
    return filteredReports.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  }, [filteredReports, currentPage, pageSize])

  // Handlers
  function handleUpdateStatus(reportId: string, newStatus: ReportStatus) {
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status: newStatus,
              resolvedDate: newStatus === 'Resolved' ? 'Hôm nay' : r.resolvedDate,
              assignedStaff: r.assignedStaff || 'Staff Trực ban',
            }
          : r
      )
    )
    if (selectedReport && selectedReport.id === reportId) {
      setSelectedReport((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus,
              resolvedDate: newStatus === 'Resolved' ? 'Hôm nay' : prev.resolvedDate,
              assignedStaff: prev.assignedStaff || 'Staff Trực ban',
            }
          : null
      )
    }
    success(
      t('reports.toast_status_updated', {
        id: reportId,
        status:
          newStatus === 'Pending'
            ? t('reports.tab_pending')
            : newStatus === 'Investigating'
            ? t('reports.tab_investigating')
            : t('reports.tab_resolved'),
      })
    )
  }

  function handleDispatchSurvey(report: SignReportItem) {
    handleUpdateStatus(report.id, 'Investigating')
    success(t('reports.toast_dispatched', { id: report.id }))
  }

  function handleExport() {
    const headers = [
      `${t('reports.th_id', 'ID')},${t('reports.th_sign', 'Sign')},${t('reports.th_type', 'Type')},${t('reports.th_priority', 'Priority')},${t('reports.th_location', 'Location')},${t('reports.th_reporter', 'Reporter')},${t('reports.th_date', 'Date')},${t('reports.th_status', 'Status')}`
    ]
    const rows = filteredReports.map(
      (r) =>
        `"${r.id}","${r.signCode} - ${r.signName}","${r.issueType}","${r.priority}","${r.location}","${r.reporter.name}","${r.dateSubmitted}","${r.status}"`
    )
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `incident_reports_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-[1680px] mx-auto space-y-6">
      {/* ─── HEADER ─────────────────────────────────────────────────── */}
      <PageHeader
        title={t('reports.title')}
        actions={
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#E8E4E3] dark:border-white/15 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <DownloadSimple size={16} weight="bold" />
            <span>{t('reports.export_report')}</span>
          </button>
        }
      />

      {/* ─── KPI SUMMARY METRIC CARDS (Uniform & Non-clickable) ──────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Incidents */}
        <div className="p-4 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0A171C] space-y-2 select-none shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400 uppercase">
              {t('reports.kpi_total_reports')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#007b8b]/10 dark:bg-[#00c4de]/20 flex items-center justify-center text-[#007b8b] dark:text-[#00c4de]">
              <Megaphone size={18} weight="bold" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-gray-900 dark:text-white">
              {kpiStats.total}
            </span>
            <span className="text-xs text-gray-400 font-sans">{t('reports.unit_reports')}</span>
          </div>
        </div>

        {/* KPI 2: Pending Intake */}
        <div className="p-4 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0A171C] space-y-2 select-none shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-red-600 dark:text-red-400 uppercase">
              {t('reports.kpi_pending_reports')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400">
              <Clock size={18} weight="bold" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-red-600 dark:text-red-400">
              {kpiStats.pending}
            </span>
            <span className="text-xs text-red-500/80 font-sans">{t('reports.unit_urgent')}</span>
          </div>
        </div>

        {/* KPI 3: Investigating */}
        <div className="p-4 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0A171C] space-y-2 select-none shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-cyan-700 dark:text-[#00c4de] uppercase">
              {t('reports.kpi_investigating_reports')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-500/20 flex items-center justify-center text-cyan-700 dark:text-[#00c4de]">
              <MagnifyingGlass size={18} weight="bold" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-cyan-800 dark:text-[#00c4de]">
              {kpiStats.investigating}
            </span>
            <span className="text-xs text-cyan-600 dark:text-cyan-400 font-sans">{t('reports.unit_in_progress')}</span>
          </div>
        </div>

        {/* KPI 4: Resolved */}
        <div className="p-4 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0A171C] space-y-2 select-none shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase">
              {t('reports.kpi_resolved_reports')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle size={18} weight="bold" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
              {kpiStats.resolved}
            </span>
            <span className="text-xs text-gray-400 font-sans">{t('reports.unit_closed')}</span>
          </div>
        </div>
      </div>

      {/* ─── FILTER AND TABS ────────────────────────────────────────── */}
      <div className="space-y-3">
        <DataFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={t('reports.search_placeholder')}
          categories={[
            {
              id: 'All',
              label: t('reports.tab_all'),
              count: kpiStats.total,
            },
            {
              id: 'Pending',
              label: t('reports.tab_pending'),
              count: kpiStats.pending,
            },
            {
              id: 'Investigating',
              label: t('reports.tab_investigating'),
              count: kpiStats.investigating,
            },
            {
              id: 'Resolved',
              label: t('reports.tab_resolved'),
              count: kpiStats.resolved,
            },
          ]}
          selectedCategory={activeTab}
          onSelectCategory={(id) => setActiveTab(id as 'All' | 'Pending' | 'Investigating' | 'Resolved')}
        />

        {/* Secondary Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-48 sm:w-56">
              <CustomSelect
                options={issueTypeOptions}
                value={selectedIssueType}
                onChange={setSelectedIssueType}
                prefixLabel={t('reports.filter_type')}
                leftIcon={<Funnel size={14} className="text-gray-400" />}
                size="sm"
              />
            </div>
            <div className="w-40 sm:w-48">
              <CustomSelect
                options={priorityOptions}
                value={selectedPriority}
                onChange={setSelectedPriority}
                prefixLabel={t('reports.filter_priority')}
                size="sm"
              />
            </div>
          </div>

          {/* Indicator if expanded columns are shown */}
          {isCollapsed && (
            <div className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-mono font-medium text-[#007b8b] dark:text-[#00c4de] bg-[#007b8b]/10 dark:bg-[#00c4de]/10 px-2.5 py-1 rounded-lg">
              <ShieldCheck size={14} weight="bold" />
              <span>{t('reports.badge_extra_columns')}</span>
            </div>
          )}
        </div>
      </div>

      {/* ─── REPORTS TABLE ──────────────────────────────────────────── */}
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
                      onClick={() => setSelectedReport(report)}
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
                            setSelectedReport(report)
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

      {/* ─── MODAL: INCIDENT DETAIL & DISPATCH ────────────────────────── */}
      {selectedReport && (
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
                  <Megaphone size={22} weight="bold" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-white/10">
                      {selectedReport.id}
                    </span>
                    <ReportStatusBadge status={selectedReport.status} />
                    <PriorityBadge priority={selectedReport.priority} />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mt-1">
                    {t('reports.modal_details_title')}
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
                {/* Left Column: Photos & Sign Reference */}
                <div className="space-y-4">
                  {/* Photo Evidence */}
                  <div>
                    <span className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-2">
                      {t('reports.lbl_evidence_photo')}
                    </span>
                    <div className="relative aspect-4/3 rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-black/40 group">
                      <img
                        src={selectedReport.photoUrl}
                        alt="Incident Evidence"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 left-2 px-2 py-1 rounded bg-black/70 backdrop-blur-xs text-white text-[10px] font-mono">
                        {selectedReport.id}
                      </div>
                    </div>
                  </div>

                  {/* Standard Sign Reference */}
                  <div className="p-3.5 rounded-xl border border-gray-200/80 dark:border-white/10 bg-gray-50/70 dark:bg-white/5 space-y-2">
                    <span className="text-[11px] font-mono font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                      {t('reports.lbl_sign_reference')}
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 flex items-center justify-center p-1 shrink-0 shadow-xs">
                        {(() => {
                          const catalogEntry = mockCatalogData.find(
                            (c) => c.code.toLowerCase() === selectedReport.signCode.toLowerCase()
                          ) || {
                            code: selectedReport.signCode,
                            nameVi: selectedReport.signName,
                            shape: 'Circle',
                            color: 'Red-White',
                          }
                          return <TrafficSignGraphic sign={catalogEntry} className="w-full h-full object-contain" />
                        })()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-[#007b8b] dark:text-[#00c4de] text-xs">
                            {selectedReport.signCode}
                          </span>
                          <IssueTypeBadge type={selectedReport.issueType} />
                        </div>
                        <p className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm truncate">
                          {selectedReport.signName}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Citizen Description & Incident Telemetry */}
                <div className="space-y-4">
                  {/* Location */}
                  <div className="p-3.5 rounded-xl border border-gray-200/80 dark:border-white/10 bg-gray-50/70 dark:bg-white/5">
                    <span className="text-[11px] font-mono font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">
                      {t('reports.th_location')}
                    </span>
                    <div className="flex items-start gap-2 text-gray-900 dark:text-white font-medium">
                      <MapPin size={16} className="text-[#007b8b] dark:text-[#00c4de] shrink-0 mt-0.5" />
                      <span>{selectedReport.location}</span>
                    </div>
                  </div>

                  {/* Citizen Description */}
                  <div>
                    <span className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1.5">
                      {t('reports.lbl_description')}
                    </span>
                    <div className="p-3.5 rounded-xl border border-amber-200/60 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5 text-gray-800 dark:text-gray-200 leading-relaxed italic">
                      &ldquo;{selectedReport.description}&rdquo;
                    </div>
                  </div>

                  {/* Reporter & Staff Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Reporter Info */}
                    <div className="p-3 rounded-xl border border-gray-200/80 dark:border-white/10 bg-gray-50/70 dark:bg-white/5 space-y-1">
                      <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block">
                        {t('reports.lbl_reporter_info')}
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${selectedReport.reporter.avatarBg}`}
                        >
                          {selectedReport.reporter.initials}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white text-xs truncate">
                            {selectedReport.reporter.name}
                          </p>
                          {selectedReport.reporter.phone && (
                            <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 font-mono">
                              <Phone size={11} />
                              <span>{selectedReport.reporter.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Assigned Staff */}
                    <div className="p-3 rounded-xl border border-gray-200/80 dark:border-white/10 bg-gray-50/70 dark:bg-white/5 space-y-1">
                      <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block">
                        {t('reports.lbl_assigned_staff')}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#007b8b]/10 dark:bg-[#00c4de]/20 flex items-center justify-center text-[#007b8b] dark:text-[#00c4de]">
                          <User size={12} weight="bold" />
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white text-xs">
                          {selectedReport.assignedStaff || t('reports.status_pending')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Submission date & resolved date */}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1 pt-1 font-mono">
                    <span>{t('reports.th_date')}: {selectedReport.dateSubmitted}</span>
                    {selectedReport.resolvedDate && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {t('reports.tab_resolved')}: {selectedReport.resolvedDate}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 sm:p-5 border-t border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-white/5 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                {selectedReport.status !== 'Resolved' && (
                  <button
                    type="button"
                    onClick={() => handleDispatchSurvey(selectedReport)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#007b8b] hover:bg-[#00606d] text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
                  >
                    <RocketLaunch size={15} weight="bold" />
                    <span>{t('reports.btn_dispatch_survey')}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {selectedReport.status !== 'Investigating' && selectedReport.status !== 'Resolved' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedReport.id, 'Investigating')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-cyan-300 dark:border-cyan-500/40 bg-cyan-50 dark:bg-cyan-500/10 hover:bg-cyan-100 dark:hover:bg-cyan-500/20 text-cyan-800 dark:text-[#00c4de] text-xs font-bold transition-all cursor-pointer active:scale-95"
                  >
                    <ArrowsClockwise size={14} weight="bold" />
                    <span>{t('reports.btn_mark_investigating')}</span>
                  </button>
                )}

                {selectedReport.status !== 'Resolved' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedReport.id, 'Resolved')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-bold transition-all cursor-pointer active:scale-95"
                  >
                    <CheckCircle size={14} weight="bold" />
                    <span>{t('reports.btn_mark_resolved')}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  {t('catalog.btn_cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
    </div>
  )
}
