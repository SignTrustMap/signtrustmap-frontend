import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/context/ToastContext'
import { useSidebar } from '@/context/SidebarContext'
import { DataFilterBar } from '@/components/common/DataFilterBar'
import PageHeader from '@/components/common/PageHeader'
import CustomSelect, { type OptionItem } from '@/components/common/CustomSelect'
import { Table, SquaresFour, Funnel, ShieldCheck } from '@phosphor-icons/react'
import {
  mockMissingSignTypeReports,
  availableCatalogSigns,
  type MissingSignTypeReport,
  type AvailableSignOption,
} from '@/data'
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
      {viewMode === 'table' ? (
        <MissingSignsTableView
          reports={paginatedReports}
          totalItems={filteredReports.length}
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
          totalItems={filteredReports.length}
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
