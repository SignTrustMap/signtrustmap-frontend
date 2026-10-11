import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSidebar } from '@/context/SidebarContext'
import { useToast } from '@/context/ToastContext'
import { DataFilterBar } from '@/components/common/DataFilterBar'
import PageHeader from '@/components/common/PageHeader'
import CustomSelect, { type OptionItem } from '@/components/common/CustomSelect'
import {
  DownloadSimple,
  Funnel,
  ShieldCheck,
} from '@phosphor-icons/react'
import { mockSignReports, type SignReportItem, type ReportStatus } from '@/data'
import {
  ReportsKpiCards,
  ReportsTableView,
  ReportDetailModal,
} from './components'

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
  const issueTypeOptions: OptionItem[] = useMemo(
    () => [
      { value: 'all', label: t('reports.type_all') },
      { value: 'damaged', label: t('reports.type_damaged') },
      { value: 'obscured', label: t('reports.type_obscured') },
      { value: 'missing', label: t('reports.type_missing') },
      { value: 'incorrect', label: t('reports.type_incorrect') },
    ],
    [t]
  )

  const priorityOptions: OptionItem[] = useMemo(
    () => [
      { value: 'all', label: t('reports.priority_all') },
      { value: 'Cao', label: t('reports.priority_high') },
      { value: 'Vừa', label: t('reports.priority_med') },
      { value: 'Thấp', label: t('reports.priority_low') },
    ],
    [t]
  )

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

      {/* ─── KPI SUMMARY METRIC CARDS ─────────────────────────────────── */}
      <ReportsKpiCards kpiStats={kpiStats} />

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
      <ReportsTableView
        reports={filteredReports}
        isCollapsed={isCollapsed}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        onSelectReport={setSelectedReport}
      />

      {/* ─── MODAL: INCIDENT DETAIL & DISPATCH ────────────────────────── */}
      <ReportDetailModal
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
        onUpdateStatus={handleUpdateStatus}
        onDispatchSurvey={handleDispatchSurvey}
      />
    </div>
  )
}
