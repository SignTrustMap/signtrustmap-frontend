import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useSidebar } from '@/context/SidebarContext'
import { useToast } from '@/context/ToastContext'
import { DataFilterBar } from '@/components/common/DataFilterBar'
import PageHeader from '@/components/common/PageHeader'
import CustomSelect, { type OptionItem } from '@/components/common/CustomSelect'
import {
  DownloadSimple,
  CircleNotch,
} from '@phosphor-icons/react'
import type { SignReportItem, ReportStatus, IssueType, ReportPriority } from '@/data/reports'
import { escalationService, type ModerationCaseItem } from '@/api/services/escalation.service'
import {
  ReportsKpiCards,
  ReportsTableView,
  ReportDetailModal,
} from './components'

function mapCaseToSignReport(c: ModerationCaseItem): SignReportItem {
  const status: ReportStatus =
    c.status === 'RESOLVED' || c.status === 'DISMISSED'
      ? 'Resolved'
      : c.status === 'IN_REVIEW' || c.status === 'ESCALATED_ADMIN'
      ? 'Investigating'
      : 'Pending'

  const priority: ReportPriority =
    c.severity === 'CRITICAL' || c.severity === 'HIGH'
      ? 'Cao'
      : c.severity === 'LOW'
      ? 'Thấp'
      : 'Vừa'

  const issueType: IssueType =
    c.case_type?.toLowerCase().includes('damage') ? 'damaged'
    : c.case_type?.toLowerCase().includes('obscur') ? 'obscured'
    : c.case_type?.toLowerCase().includes('miss') ? 'missing'
    : 'incorrect'

  const dateStr = c.created_at || c.createdAt
  const dateFormatted = dateStr ? new Date(dateStr).toLocaleDateString('vi-VN') : 'Gần đây'

  return {
    id: `#CASE-${c.id.slice(0, 8).toUpperCase()}`,
    signCode: c.target_entity_id ? `REF-${c.target_entity_id.slice(0, 6).toUpperCase()}` : 'SIGN-REF',
    signName: c.case_type || 'Báo cáo sự cố biển báo',
    issueType,
    priority,
    location: c.target_entity_type ? `${c.target_entity_type}: #${c.target_entity_id?.slice(0, 8)}` : 'Hiện trường ghi nhận',
    reporter: {
      name: 'Người dùng cộng đồng',
      initials: 'ND',
      avatarBg: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-[#00c4de]',
    },
    dateSubmitted: dateFormatted,
    status,
    description: c.notes || c.resolutionNote || 'Báo cáo tiếp nhận từ cộng đồng và người đi đường.',
    photoUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop&q=80',
    assignedStaff: c.assigned_staff_id ? `Staff #${c.assigned_staff_id.slice(0, 6)}` : undefined,
    resolvedDate: c.resolved_at || c.resolvedAt ? new Date(c.resolved_at || c.resolvedAt!).toLocaleDateString('vi-VN') : undefined,
  }
}

export default function ReportsPage() {
  const { t } = useTranslation('ops')
  const { isCollapsed } = useSidebar()
  const { success, error: toastError } = useToast()

  const [reports, setReports] = useState<SignReportItem[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Investigating' | 'Resolved'>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIssueType, setSelectedIssueType] = useState<string>('all')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')
  const [selectedReport, setSelectedReport] = useState<SignReportItem | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const loadCases = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await escalationService.getCases({ page: 1, pageSize: 50 })
      const items = res?.items || (Array.isArray(res) ? res : [])
      if (Array.isArray(items)) {
        setReports(items.map(mapCaseToSignReport))
      } else {
        setReports([])
      }
    } catch (err) {
      console.warn('[ReportsPage] Failed to fetch moderation cases from live API:', err)
      setReports([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCases()
  }, [loadCases])

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

  async function handleUpdateStatus(reportId: string, newStatus: ReportStatus) {
    try {
      const cleanCaseId = reportId.replace('#CASE-', '').toLowerCase()
      await escalationService.resolveCase(cleanCaseId, {
        resolutionNote: `Trạng thái ca chuyển sang ${newStatus} bởi Nhân viên điều hành`,
        actionType: newStatus === 'Resolved' ? 'RESOLVE' : 'DISMISS',
      })
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
      loadCases()
    } catch (err: any) {
      console.warn('[Reports] Failed to resolve case on backend:', err)
      toastError(err?.message || 'Không thể cập nhật trạng thái trên máy chủ')
    }
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
          onSelectCategory={(id) => setActiveTab(id as any)}
        >
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <CustomSelect
              value={selectedIssueType}
              onChange={setSelectedIssueType}
              options={issueTypeOptions}
              size="sm"
              className="w-full sm:w-44"
            />
            <CustomSelect
              value={selectedPriority}
              onChange={setSelectedPriority}
              options={priorityOptions}
              size="sm"
              className="w-full sm:w-36"
            />
          </div>
        </DataFilterBar>
      </div>

      {/* ─── TABLE VIEW ─────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="p-16 text-center text-gray-400 space-y-3">
          <CircleNotch size={32} className="animate-spin mx-auto text-[#007b8b] dark:text-[#00c4de]" />
          <p className="text-xs">Đang tải danh sách báo cáo sự cố từ hệ thống...</p>
        </div>
      ) : (
        <ReportsTableView
          reports={filteredReports}
          currentPage={currentPage}
          pageSize={pageSize}
          isCollapsed={isCollapsed}
          onSelectReport={(report) => setSelectedReport(report)}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      )}

      {/* ─── DETAIL MODAL ───────────────────────────────────────────── */}
      <ReportDetailModal
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
        onUpdateStatus={handleUpdateStatus}
        onDispatchSurvey={handleDispatchSurvey}
      />
    </div>
  )
}
