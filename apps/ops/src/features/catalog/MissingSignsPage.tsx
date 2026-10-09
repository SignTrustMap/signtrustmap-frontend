import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/context/ToastContext'
import { useSidebar } from '@/context/SidebarContext'
import { useAuth } from '@/features/auth/AuthContext'
import { DataFilterBar } from '@/components/common/DataFilterBar'
import PageHeader from '@/components/common/PageHeader'
import CustomSelect, { type OptionItem } from '@/components/common/CustomSelect'
import { Table, SquaresFour, Funnel, ArrowsClockwise, CircleNotch } from '@phosphor-icons/react'
import {
  availableCatalogSigns,
  type MissingSignTypeReport,
  type AvailableSignOption,
} from '@/data'
import { resolveImageUrl } from '@/features/map/utils/signUrlHelpers'
import {
  catalogService,
  type MissingTypeReportItem,
  type SignCategoryItem,
  type ApproveAndCreateSignTypeInput,
} from '@/api/services/catalog.service'
import {
  MissingSignsTableView,
  MissingSignsGridView,
  MissingSignInspectionModal,
  MissingSignMergeModal,
  MissingSignEscalateModal,
  MissingSignRejectModal,
  ApproveAndCreateSignTypeModal,
  type MissingRejectReasonKey,
} from './components'

function mapBackendReportToMissingSign(r: MissingTypeReportItem): MissingSignTypeReport {
  let status: MissingSignTypeReport['status'] = 'Open'
  if (r.status === 'APPROVED') status = 'Approved'
  else if (r.status === 'REJECTED') status = 'Rejected'
  else if (r.status === 'MERGED') status = 'Merged'
  else if (r.status === 'ESCALATED_ADMIN') status = 'Escalated'
  else if (r.status === 'INCOMPLETE') status = 'Incomplete'
  else if (r.status === 'IN_REVIEW') status = 'Escalated'

  const candidate = r.candidate
  const rawCrop = candidate?.signCropUrl || r.cropImageUrl || null
  const sampleImageUrl =
    resolveImageUrl(rawCrop) ||
    'https://images.unsplash.com/photo-1572949645841-094f3a9c4c94?w=500&auto=format&fit=crop&q=80'
  const bestFrameUrl = resolveImageUrl(candidate?.bestFrameUrl) || undefined
  const cropImageUrl = resolveImageUrl(rawCrop) || undefined

  return {
    id: r.id,
    tempLabel: r.proposedName || r.suggestedNameVi || r.suggestedCode || 'Biển báo mới đề xuất',
    category: r.proposedCategoryId ? `cat_${r.proposedCategoryId}` : 'prohibitory',
    reportedBy: r.reporterId ? `Reviewer #${r.reporterId.slice(0, 8)}` : (r.submittedBy || 'Reviewer'),
    reporterId: r.reporterId,
    reportedAt: r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 10) : '2026-10-01',
    lat: candidate?.latitude ?? 10.7769,
    lng: candidate?.longitude ?? 106.7009,
    roadAddress: candidate
      ? `${candidate.latitude?.toFixed(5) ?? 10.7769}°, ${candidate.longitude?.toFixed(5) ?? 106.7009}°`
      : 'TP. Hồ Chí Minh, Việt Nam',
    aiConfidence: candidate?.confidenceScore ?? 0.88,
    status,
    rawStatus: r.status,
    sampleImageUrl,
    bestFrameUrl,
    cropImageUrl,
    reporterNote: r.description || r.staffNotes || 'Báo cáo biển báo chưa có trong danh mục chuẩn QCVN 41:2019',
    similarCatalogEntries: ['P.102', 'P.103a'],
    clipPrompt: r.suggestedNameEn || r.proposedName || 'A road traffic sign on street',
    candidateId: r.candidateId,
    proposedCategoryId: r.proposedCategoryId,
    suggestedShape: r.suggestedShape,
    suggestedColorScheme: r.suggestedColorScheme,
    mergedIntoSignTypeId: r.mergedIntoSignTypeId,
    staffNotes: r.staffNotes,
  }
}

export default function MissingSignsPage() {
  const { t } = useTranslation(['ops', 'common'])
  const { success, error } = useToast()
  const { isCollapsed } = useSidebar()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [reports, setReports] = useState<MissingSignTypeReport[]>([])
  const [totalCount, setTotalCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const [kpiCounts, setKpiCounts] = useState({
    total: 0,
    pending: 0,
    escalated: 0,
    approved: 0,
    merged: 0,
    incomplete: 0,
    rejected: 0,
  })

  const [categories, setCategories] = useState<SignCategoryItem[]>([])
  const [availableSigns, setAvailableSigns] = useState<AvailableSignOption[]>(availableCatalogSigns)

  const [selectedReport, setSelectedReport] = useState<MissingSignTypeReport | null>(null)
  const [activeTab, setActiveTab] = useState<
    'all' | 'Open' | 'Escalated' | 'Approved' | 'Merged' | 'Incomplete' | 'Rejected'
  >('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Sub-Modals
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false)
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false)
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false)
  const [isSubmittingApprove, setIsSubmittingApprove] = useState(false)

  const [selectedCatalogCode, setSelectedCatalogCode] = useState('P.102')
  const [selectedSignTypeId, setSelectedSignTypeId] = useState<number | null>(null)
  const [catalogSearch, setCatalogSearch] = useState('')
  const [escalateNote, setEscalateNote] = useState('')
  const [rejectReasonKey, setRejectReasonKey] = useState<MissingRejectReasonKey>('reason_not_sign')

  // Load Categories & Real Catalog Sign Types for lookup
  useEffect(() => {
    async function loadCatalogMeta() {
      try {
        const [cats, typesRes] = await Promise.all([
          catalogService.getCategories(),
          catalogService.getSignTypes({ pageSize: 100 }),
        ])
        if (Array.isArray(cats) && cats.length > 0) {
          setCategories(cats)
        }
        if (typesRes && Array.isArray(typesRes.items) && typesRes.items.length > 0) {
          const mapped: AvailableSignOption[] = typesRes.items.map((it) => ({
            id: it.id,
            code: it.signCode,
            codeTitle: `${it.signCode} - ${it.nameVi}`,
            nameKey: it.nameEn || it.nameVi,
          }))
          setAvailableSigns(mapped)
          if (mapped.length > 0) {
            setSelectedCatalogCode(mapped[0].code)
            setSelectedSignTypeId(mapped[0].id ?? null)
          }
        }
      } catch (err) {
        console.warn('Could not load live catalog metadata for triage lookup:', err)
      }
    }
    loadCatalogMeta()
  }, [])

  const fetchReports = useCallback(async () => {
    setIsLoading(true)
    try {
      let statusQuery: string | undefined = undefined
      if (activeTab === 'Open') statusQuery = 'PENDING'
      else if (activeTab === 'Escalated') statusQuery = 'ESCALATED_ADMIN'
      else if (activeTab === 'Approved') statusQuery = 'APPROVED'
      else if (activeTab === 'Merged') statusQuery = 'MERGED'
      else if (activeTab === 'Incomplete') statusQuery = 'INCOMPLETE'
      else if (activeTab === 'Rejected') statusQuery = 'REJECTED'

      const [response, summaryRes] = await Promise.all([
        catalogService.getMissingReports({
          page: currentPage,
          pageSize,
          status: statusQuery,
        }),
        catalogService.getMissingReports({ page: 1, pageSize: 100 }).catch(() => null),
      ])

      if (response && Array.isArray(response.items)) {
        const mapped = response.items.map(mapBackendReportToMissingSign)
        setReports(mapped)
        setTotalCount(response.total ?? mapped.length)
      } else {
        setReports([])
        setTotalCount(0)
      }

      if (summaryRes && Array.isArray(summaryRes.items)) {
        const items = summaryRes.items
        setKpiCounts({
          total: summaryRes.total ?? items.length,
          pending: items.filter((i) => i.status === 'PENDING').length,
          escalated: items.filter((i) => i.status === 'ESCALATED_ADMIN').length,
          approved: items.filter((i) => i.status === 'APPROVED').length,
          merged: items.filter((i) => i.status === 'MERGED').length,
          incomplete: items.filter((i) => i.status === 'INCOMPLETE').length,
          rejected: items.filter((i) => i.status === 'REJECTED').length,
        })
      }
    } catch (err: any) {
      console.error('Failed to fetch real missing sign reports from API:', err)
      setReports([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, pageSize, activeTab])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (isMergeModalOpen) setIsMergeModalOpen(false)
        else if (isEscalateModalOpen) setIsEscalateModalOpen(false)
        else if (isRejectModalOpen) setIsRejectModalOpen(false)
        else if (isApproveModalOpen) setIsApproveModalOpen(false)
        else if (selectedReport) setSelectedReport(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMergeModalOpen, isEscalateModalOpen, isRejectModalOpen, isApproveModalOpen, selectedReport])

  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, searchQuery, selectedCategory])

  // Category filter options
  const categoryOptions: OptionItem[] = useMemo(() => {
    const base: OptionItem[] = [{ value: 'all', label: t('missing_signs.cat_all') }]
    if (categories.length > 0) {
      categories.forEach((c) => {
        base.push({ value: `cat_${c.id}`, label: c.nameVi })
      })
    } else {
      base.push(
        { value: 'prohibitory', label: t('missing_signs.cat_prohibitory') },
        { value: 'warning', label: t('missing_signs.cat_warning') },
        { value: 'mandatory', label: t('missing_signs.cat_mandatory') },
        { value: 'guide', label: t('missing_signs.cat_guide') }
      )
    }
    return base
  }, [categories, t])

  // Catalog search filtering for Merge modal
  const filteredCatalogSigns = useMemo(() => {
    return availableSigns.filter(
      (s: AvailableSignOption) =>
        s.code.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        s.codeTitle.toLowerCase().includes(catalogSearch.toLowerCase())
    )
  }, [availableSigns, catalogSearch])

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

      const matchesCategory = selectedCategory === 'all' || r.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [reports, searchQuery, selectedCategory])

  const paginatedReports = filteredReports

  // Handlers
  async function handleMergeSubmit(overrideCode?: string, overrideSignTypeId?: number) {
    if (!selectedReport) return
    const code = typeof overrideCode === 'string' ? overrideCode : selectedCatalogCode
    const signTypeId = typeof overrideSignTypeId === 'number' ? overrideSignTypeId : selectedSignTypeId
    const updatedId = selectedReport.id
    try {
      await catalogService.updateMissingReport(updatedId, {
        status: 'MERGED',
        mergedIntoSignTypeId: signTypeId ?? undefined,
        staffNotes: `Merged to ${code}`,
      })
      success(t('missing_signs.toast_merged', { id: updatedId, code }))
      fetchReports()
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
        status: 'ESCALATED_ADMIN',
        staffNotes: escalateNote || 'Escalated to Admin for Catalog creation',
      })
      success(t('missing_signs.toast_escalated', { id: updatedId }))
      fetchReports()
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
      error(t('missing_signs.toast_rejected', { id: updatedId, reason: reasonText }))
      fetchReports()
    } catch (err: any) {
      console.error('Failed to reject report:', err)
      error(err?.message || 'Không thể từ chối báo cáo trên máy chủ')
    } finally {
      setIsRejectModalOpen(false)
      setSelectedReport(null)
    }
  }

  async function handleIncompleteSubmit() {
    if (!selectedReport) return
    const updatedId = selectedReport.id
    const staffNote = 'Yêu cầu người dùng cung cấp thêm ảnh chụp rõ nét hơn hoặc tọa độ chi tiết.'
    try {
      await catalogService.updateMissingReport(updatedId, {
        status: 'INCOMPLETE',
        staffNotes: staffNote,
      })
      success('Đã đánh dấu yêu cầu bổ sung thông tin cho báo cáo #' + updatedId)
      fetchReports()
    } catch (err: any) {
      console.error('Failed to set incomplete report:', err)
      error(err?.message || 'Không thể cập nhật trạng thái báo cáo')
    } finally {
      setSelectedReport(null)
    }
  }

  async function handleApproveSubmit(payload: ApproveAndCreateSignTypeInput, triggerReprocess: boolean) {
    if (!selectedReport) return
    const reportId = selectedReport.id
    setIsSubmittingApprove(true)
    try {
      const res = await catalogService.approveAndCreateType(reportId, payload)
      const createdId = res.createdSignType?.id || res.signType?.id

      if (triggerReprocess && createdId) {
        try {
          const reprocessRes = await catalogService.reprocessCandidates(createdId, 0.70)
          success(
            `Đã tạo biển mới #${createdId} và quét lại ${reprocessRes.reprocessedCount} candidate trong lịch sử!`
          )
        } catch (repErr) {
          console.warn('Reprocess trigger notice:', repErr)
        }
      }

      success(
        `Đã tạo thành công loại biển ${payload.signCode}! Bản cập nhật Catalog Version mới đã được ban hành.`
      )

      setIsApproveModalOpen(false)
      setSelectedReport(null)
      fetchReports()
    } catch (err: any) {
      console.error('Failed to approve and create sign type:', err)
      error(err?.message || 'Không thể phê duyệt và tạo loại biển mới trên máy chủ')
    } finally {
      setIsSubmittingApprove(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-[1680px] mx-auto space-y-6">
      {/* ─── HEADER ─────────────────────────────────────────────────── */}
      <PageHeader
        title={t('missing_signs.title', 'Đề xuất Biển mới')}
        subtitle={t('missing_signs.subtitle', 'Xem xét và sơ thẩm các báo cáo biển báo thực tế do cộng đồng gửi lên.')}
        actions={
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
              Tổng <strong className="font-mono text-gray-900 dark:text-white">{totalCount}</strong> đề xuất
            </span>
          </div>
        }
      />

      {/* ─── UNIFIED SINGLE-ROW PRO FILTER BAR (Matches /catalog on Web) ── */}
      <DataFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t('missing_signs.search_placeholder', 'Tìm kiếm đề xuất, vị trí, người gửi...')}
        categoryFilterMode="select"
        categorySelectLabel={t('missing_signs.filter_status', 'Trạng thái')}
        categories={[
          {
            id: 'all',
            label: t('missing_signs.tab_all', 'Tất cả đề xuất'),
            count: kpiCounts.total,
          },
          {
            id: 'Open',
            label: t('missing_signs.tab_open', 'Chờ sơ thẩm'),
            count: kpiCounts.pending,
          },
          {
            id: 'Escalated',
            label: t('missing_signs.tab_escalated', 'Chờ Admin duyệt'),
            count: kpiCounts.escalated,
          },
          {
            id: 'Approved',
            label: t('missing_signs.tab_approved', 'Đã phê duyệt'),
            count: kpiCounts.approved,
          },
          {
            id: 'Merged',
            label: t('missing_signs.tab_merged', 'Đã gộp Catalog'),
            count: kpiCounts.merged,
          },
          {
            id: 'Incomplete',
            label: t('missing_signs.tab_incomplete', 'Cần bổ sung'),
            count: kpiCounts.incomplete,
          },
          {
            id: 'Rejected',
            label: t('missing_signs.tab_rejected', 'Đã từ chối'),
            count: kpiCounts.rejected,
          },
        ]}
        selectedCategory={activeTab}
        onSelectCategory={(id) =>
          setActiveTab(
            id as 'all' | 'Open' | 'Escalated' | 'Approved' | 'Merged' | 'Incomplete' | 'Rejected'
          )
        }
      >
        {/* Nhóm biển dropdown */}
        <div className="w-36 sm:w-44 shrink-0">
          <CustomSelect
            options={categoryOptions}
            value={selectedCategory}
            onChange={setSelectedCategory}
            prefixLabel={t('missing_signs.filter_category', 'Nhóm biển')}
            leftIcon={<Funnel size={14} className="text-gray-400" />}
            size="sm"
          />
        </div>

        {/* Refresh Button */}
        <button
          type="button"
          disabled={isLoading}
          onClick={fetchReports}
          className="p-2 border border-gray-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 rounded-xl transition-colors cursor-pointer shrink-0 disabled:opacity-50 shadow-2xs"
          title="Làm mới báo cáo"
        >
          <ArrowsClockwise size={15} weight="bold" className={isLoading ? 'animate-spin' : ''} />
        </button>

        {/* View mode toggle (Table / Grid) */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/10 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            title={t('missing_signs.view_mode_table', 'Dạng bảng')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white dark:bg-[#0A171C] text-gray-900 dark:text-white shadow-xs font-bold'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <Table size={14} weight={viewMode === 'table' ? 'bold' : 'regular'} />
            <span className="hidden xl:inline">{t('missing_signs.view_mode_table', 'Bảng')}</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            title={t('missing_signs.view_mode_grid', 'Dạng lưới')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-[#0A171C] text-gray-900 dark:text-white shadow-xs font-bold'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <SquaresFour size={14} weight={viewMode === 'grid' ? 'bold' : 'regular'} />
            <span className="hidden xl:inline">{t('missing_signs.view_mode_grid', 'Lưới')}</span>
          </button>
        </div>
      </DataFilterBar>

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
            if (r.similarCatalogEntries && r.similarCatalogEntries.length > 0) {
              setSelectedCatalogCode(r.similarCatalogEntries[0])
            }
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
      {selectedReport &&
        !isMergeModalOpen &&
        !isEscalateModalOpen &&
        !isRejectModalOpen &&
        !isApproveModalOpen && (
          <MissingSignInspectionModal
            report={selectedReport}
            isAdmin={isAdmin}
            onClose={() => setSelectedReport(null)}
            onOpenMerge={() => {
              if (selectedReport?.similarCatalogEntries?.[0]) {
                setSelectedCatalogCode(selectedReport.similarCatalogEntries[0])
              }
              setIsMergeModalOpen(true)
            }}
            onOpenEscalate={() => setIsEscalateModalOpen(true)}
            onOpenReject={() => setIsRejectModalOpen(true)}
            onOpenApprove={() => setIsApproveModalOpen(true)}
            onOpenIncomplete={handleIncompleteSubmit}
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
        onSelectCatalogCode={(code, id) => {
          setSelectedCatalogCode(code)
          if (id) setSelectedSignTypeId(id)
        }}
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

      {/* Admin Approval & Create Sign Type Modal */}
      <ApproveAndCreateSignTypeModal
        isOpen={isApproveModalOpen}
        report={selectedReport}
        categories={categories}
        onClose={() => setIsApproveModalOpen(false)}
        onSubmit={handleApproveSubmit}
        isSubmitting={isSubmittingApprove}
      />
    </div>
  )
}
