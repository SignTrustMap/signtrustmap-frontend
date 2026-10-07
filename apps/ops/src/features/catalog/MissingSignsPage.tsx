import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/context/ToastContext'
import { useSidebar } from '@/context/SidebarContext'
import { DataFilterBar } from '@/components/common/DataFilterBar'
import PageHeader from '@/components/common/PageHeader'
import CustomSelect, { type OptionItem } from '@/components/common/CustomSelect'
import { Table, SquaresFour, Funnel, ShieldCheck, ArrowsClockwise, CircleNotch } from '@phosphor-icons/react'
import {
  mockMissingSignTypeReports,
  availableCatalogSigns,
  type MissingSignTypeReport,
  type AvailableSignOption,
} from '@/data'
import { catalogService, type MissingTypeReportItem } from '@/api/services/catalog.service'
import {
  MissingSignsKpiCards,
  MissingSignsTableView,
  MissingSignsGridView,
  MissingSignInspectionModal,
  MissingSignMergeModal,
  MissingSignEscalateModal,
  MissingSignRejectModal,
  type MissingRejectReasonKey,
} from './components'

function mapBackendReportToMissingSign(r: MissingTypeReportItem): MissingSignTypeReport {
  let status: MissingSignTypeReport['status'] = 'Open'
  if (r.status === 'APPROVED') status = 'Approved'
  else if (r.status === 'REJECTED') status = 'Rejected'
  else if (r.status === 'IN_REVIEW') status = 'Approved'

  return {
    id: r.id,
    tempLabel: r.suggestedNameVi || r.suggestedCode || 'Biển báo mới đề xuất',
    category: 'prohibitory',
    reportedBy: r.submittedBy ? `User ${r.submittedBy.slice(0, 8)}` : 'Reviewer',
    reportedAt: r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 10) : '2026-10-01',
    lat: 10.7769,
    lng: 106.7009,
    roadAddress: 'TP. Hồ Chí Minh, Việt Nam',
    aiConfidence: 0.88,
    status,
    sampleImageUrl: r.cropImageUrl || 'https://images.unsplash.com/photo-1572949645841-094f3a9c4c94?w=500&auto=format&fit=crop&q=80',
    reporterNote: r.staffNotes || 'Báo cáo biển báo chưa có trong danh mục chuẩn QCVN 41:2019',
    similarCatalogEntries: ['P.102', 'P.103a'],
    clipPrompt: r.suggestedNameEn || 'A road traffic sign on street',
  }
}

export default function MissingSignsPage() {
  const { t } = useTranslation(['ops', 'common'])
  const { success, error } = useToast()
  const { isCollapsed } = useSidebar()

  const [reports, setReports] = useState<MissingSignTypeReport[]>(mockMissingSignTypeReports)
  const [totalCount, setTotalCount] = useState<number>(mockMissingSignTypeReports.length)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const [selectedReport, setSelectedReport] = useState<MissingSignTypeReport | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'Open' | 'Approved' | 'Merged' | 'Rejected'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const fetchReports = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await catalogService.getMissingReports({
        page: currentPage,
        pageSize,
        status: activeTab !== 'all' ? activeTab.toUpperCase() : undefined,
      })
      if (response && Array.isArray(response.items) && response.items.length > 0) {
        const mapped = response.items.map(mapBackendReportToMissingSign)
        setReports(mapped)
        setTotalCount(response.total ?? mapped.length)
      } else {
        setReports(mockMissingSignTypeReports)
        setTotalCount(mockMissingSignTypeReports.length)
      }
    } catch (err) {
      console.warn('Live missing sign reports fetch failed, fallback to mock data:', err)
      setReports(mockMissingSignTypeReports)
      setTotalCount(mockMissingSignTypeReports.length)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, pageSize, activeTab])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

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
  async function handleMergeSubmit() {
    if (!selectedReport) return
    const updatedId = selectedReport.id
    try {
      await catalogService.updateMissingReport(updatedId, {
        status: 'APPROVED',
        staffNotes: `Merged to ${selectedCatalogCode}`,
      })
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
    } catch (err: any) {
      console.error('Failed to merge missing report:', err)
      error(err?.message || 'Không thể gộp báo cáo trên máy chủ')
    } finally {
      setIsMergeModalOpen(false)
      setSelectedReport(null)
    }
  }

  async function handleEscalateSubmit() {
    if (!selectedReport) return
    const updatedId = selectedReport.id
    try {
      await catalogService.updateMissingReport(updatedId, {
        status: 'IN_REVIEW',
        staffNotes: escalateNote || 'Escalated to Admin for Catalog creation',
      })
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
    } catch (err: any) {
      console.error('Failed to escalate missing report:', err)
      error(err?.message || 'Không thể chuyển tiếp báo cáo lên quản trị viên')
    } finally {
      setIsEscalateModalOpen(false)
      setSelectedReport(null)
    }
  }

  async function handleRejectSubmit() {
    if (!selectedReport) return
    const updatedId = selectedReport.id
    const reasonText = t(`missing_signs.${rejectReasonKey}`)
    try {
      await catalogService.updateMissingReport(updatedId, {
        status: 'REJECTED',
        staffNotes: reasonText,
      })
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
    } catch (err: any) {
      console.error('Failed to reject report:', err)
      error(err?.message || 'Không thể từ chối báo cáo trên máy chủ')
    } finally {
      setIsRejectModalOpen(false)
      setSelectedReport(null)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-[1680px] mx-auto space-y-6">
      {/* ─── HEADER ─────────────────────────────────────────────────── */}
      <PageHeader
        title={t('missing_signs.title')}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isLoading}
              onClick={fetchReports}
              className="p-2 border border-neutral-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-neutral-50 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-200 rounded-xl transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              title="Làm mới báo cáo"
            >
              <ArrowsClockwise size={16} weight="bold" className={isLoading ? 'animate-spin' : ''} />
            </button>
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
          </div>
        }
      />

      {/* ─── KPI SUMMARY METRIC CARDS ────────────────────────────────── */}
      <MissingSignsKpiCards stats={kpiStats} />

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
      {isLoading ? (
        <div className="py-16 px-6 text-center space-y-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A171C] shadow-xs">
          <CircleNotch size={28} className="animate-spin text-[#007b8b] dark:text-[#00c4de] mx-auto" />
          <p className="text-xs text-neutral-500 font-medium">Đang tải danh sách báo cáo biển mới/thiếu...</p>
        </div>
      ) : viewMode === 'table' ? (
        <MissingSignsTableView
          reports={paginatedReports}
          totalItems={filteredReports.length === reports.length ? totalCount : filteredReports.length}
          currentPage={currentPage}
          pageSize={pageSize}
          isCollapsed={isCollapsed}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize)
            setCurrentPage(1)
          }}
          onSelectReport={setSelectedReport}
        />
      ) : (
        <MissingSignsGridView
          reports={paginatedReports}
          totalItems={filteredReports.length === reports.length ? totalCount : filteredReports.length}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize)
            setCurrentPage(1)
          }}
          onSelectReport={setSelectedReport}
          onOpenMergeModal={(r) => {
            setSelectedReport(r)
            setIsMergeModalOpen(true)
          }}
          onOpenEscalateModal={(r) => {
            setSelectedReport(r)
            setIsEscalateModalOpen(true)
          }}
          onOpenRejectModal={(r) => {
            setSelectedReport(r)
            setIsRejectModalOpen(true)
          }}
        />
      )}

      {/* ─── INSPECTION MODAL ────────────────────────────────────────── */}
      {selectedReport && !isMergeModalOpen && !isEscalateModalOpen && !isRejectModalOpen && (
        <MissingSignInspectionModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onOpenMerge={() => setIsMergeModalOpen(true)}
          onOpenEscalate={() => setIsEscalateModalOpen(true)}
          onOpenReject={() => setIsRejectModalOpen(true)}
        />
      )}

      {/* ─── ACTION MODALS ───────────────────────────────────────────── */}
      <MissingSignMergeModal
        isOpen={isMergeModalOpen}
        selectedReport={selectedReport}
        selectedCatalogCode={selectedCatalogCode}
        catalogSearch={catalogSearch}
        filteredCatalogSigns={filteredCatalogSigns}
        onClose={() => setIsMergeModalOpen(false)}
        onCatalogSearchChange={setCatalogSearch}
        onSelectCatalogCode={setSelectedCatalogCode}
        onSubmit={handleMergeSubmit}
      />

      <MissingSignEscalateModal
        isOpen={isEscalateModalOpen}
        selectedReport={selectedReport}
        escalateNote={escalateNote}
        onClose={() => setIsEscalateModalOpen(false)}
        onEscalateNoteChange={setEscalateNote}
        onSubmit={handleEscalateSubmit}
      />

      <MissingSignRejectModal
        isOpen={isRejectModalOpen}
        selectedReport={selectedReport}
        rejectReasonKey={rejectReasonKey}
        onClose={() => setIsRejectModalOpen(false)}
        onRejectReasonChange={setRejectReasonKey}
        onSubmit={handleRejectSubmit}
      />
    </div>
  )
}
