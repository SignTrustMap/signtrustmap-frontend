import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/context/ToastContext'
import { useSidebar } from '@/context/SidebarContext'
import { useAuth } from '@/features/auth/AuthContext'
import { DataFilterBar } from '@/components/common/DataFilterBar'
import PageHeader from '@/components/common/PageHeader'
import CustomSelect, { type OptionItem } from '@/components/common/CustomSelect'
import { Funnel, ArrowsClockwise, CircleNotch } from '@phosphor-icons/react'
import {
  type MissingSignTypeReport,
  type AvailableSignOption,
  candidateRecaptureCache,
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
  MissingSignInspectionModal,
  MissingSignMergeModal,
  MissingSignEscalateModal,
  MissingSignRejectModal,
  ApproveAndCreateSignTypeModal,
  MissingSignRecaptureModal,
  type RecaptureReasonCode,
  type MissingRejectReasonKey,
} from './components'

function mapBackendReportToMissingSign(r: MissingTypeReportItem | any): MissingSignTypeReport {
  let status: MissingSignTypeReport['status'] = 'Open'
  const rawStatus = String(r.status || r.rawStatus || 'PENDING').toUpperCase()
  if (rawStatus === 'APPROVED' || rawStatus === 'RESOLVED') status = 'Approved'
  else if (rawStatus === 'REJECTED' || rawStatus === 'DISMISSED') status = 'Rejected'
  else if (rawStatus === 'MERGED') status = 'Merged'
  else if (rawStatus === 'ESCALATED_ADMIN' || rawStatus === 'ESCALATED' || rawStatus === 'IN_REVIEW') status = 'Escalated'
  else if (rawStatus === 'INCOMPLETE' || rawStatus === 'NEEDS_INFO' || rawStatus === 'REQUEST_RECAPTURE') status = 'Incomplete'
  else status = 'Open'

  const candidate = r.candidate
  const rawCrop =
    candidate?.signCropUrl ||
    candidate?.sign_crop_url ||
    r.cropImageUrl ||
    r.crop_image_url ||
    r.signCropUrl ||
    r.sign_crop_url ||
    r.sampleImageUrl ||
    r.sample_image_url ||
    null

  const sampleImageUrl = resolveImageUrl(rawCrop) || ''
  const bestFrameUrl =
    resolveImageUrl(candidate?.bestFrameUrl || candidate?.best_frame_url || r.bestFrameUrl || r.best_frame_url) ||
    undefined
  const cropImageUrl = resolveImageUrl(rawCrop) || undefined

  const lat =
    candidate?.latitude ??
    candidate?.lat ??
    r.latitude ??
    r.lat ??
    10.7769
  const lng =
    candidate?.longitude ??
    candidate?.lng ??
    r.longitude ??
    r.lng ??
    106.7009

  const proposedCatId =
    r.proposedCategoryId ??
    r.proposed_category_id ??
    r.categoryId ??
    r.category_id ??
    null

  const category = proposedCatId
    ? `cat_${proposedCatId}`
    : r.category
      ? String(r.category)
      : 'prohibitory'

  const reporterId = r.reporterId || r.reporter_id || r.userId || r.user_id || undefined
  const reportedBy =
    r.reportedBy ||
    r.reported_by ||
    r.submittedBy ||
    r.submitted_by ||
    r.user?.name ||
    r.userName ||
    (reporterId ? `Reviewer #${reporterId.slice(0, 8)}` : 'Reviewer')

  const createdAt = r.createdAt || r.created_at || '2026-10-01'

  const aiConf =
    typeof candidate?.confidenceScore === 'number'
      ? candidate.confidenceScore
      : typeof candidate?.confidence_score === 'number'
        ? candidate.confidence_score
        : typeof r.aiConfidence === 'number'
          ? r.aiConfidence
          : typeof r.confidenceScore === 'number'
            ? r.confidenceScore
            : typeof r.confidence === 'number'
              ? r.confidence
              : undefined

  const roadAddress =
    r.roadAddress ||
    r.road_address ||
    r.address ||
    r.location ||
    candidate?.location ||
    candidate?.displayLocation ||
    (lat != null && lng != null ? `${Number(lat).toFixed(5)}°, ${Number(lng).toFixed(5)}°` : 'TP. Hồ Chí Minh, Việt Nam')

  return {
    id: String(r.id),
    tempLabel:
      r.proposedName ||
      r.proposed_name ||
      r.suggestedNameVi ||
      r.suggested_name_vi ||
      r.suggestedCode ||
      r.suggested_code ||
      r.tempLabel ||
      'Biển báo mới đề xuất',
    category,
    reportedBy,
    reporterId,
    reportedAt: createdAt,
    createdAt,
    updatedAt: r.updatedAt || r.updated_at,
    resolvedAt: r.resolvedAt || r.resolved_at,
    reviewedBy: r.reviewedBy || r.reviewed_by,
    lat: Number(lat),
    lng: Number(lng),
    roadAddress,
    aiConfidence: aiConf != null ? (aiConf <= 1 ? Math.round(aiConf * 1000) / 10 : aiConf) : undefined,
    status,
    rawStatus: rawStatus as any,
    sampleImageUrl,
    bestFrameUrl,
    cropImageUrl,
    reporterNote:
      r.description ||
      r.reporterNote ||
      r.reporter_note ||
      r.note ||
      'Báo cáo biển báo chưa có trong danh mục chuẩn QCVN 41:2019',
    similarCatalogEntries: Array.isArray(r.similarCatalogEntries)
      ? r.similarCatalogEntries
      : Array.isArray(r.similar_catalog_entries)
        ? r.similar_catalog_entries
        : ['P.102', 'P.103a'],
    clipPrompt:
      r.suggestedNameEn ||
      r.suggested_name_en ||
      r.proposedName ||
      r.proposed_name ||
      'A road traffic sign on street',
    candidateId: r.candidateId || r.candidate_id || (candidate?.id ? String(candidate.id) : null),
    proposedCategoryId: proposedCatId,
    suggestedShape:
      r.suggestedShape ||
      r.suggested_shape ||
      r.shape ||
      candidate?.shape ||
      candidate?.predictedSignType?.shape ||
      null,
    suggestedColorScheme:
      r.suggestedColorScheme ||
      r.suggested_color_scheme ||
      r.colorScheme ||
      r.color_scheme ||
      r.color ||
      candidate?.colorScheme ||
      candidate?.color_scheme ||
      candidate?.predictedSignType?.colorScheme ||
      candidate?.predictedSignType?.color ||
      null,
    mergedIntoSignTypeId: r.mergedIntoSignTypeId || r.merged_into_sign_type_id || null,
    staffNotes: r.staffNotes || r.staff_notes || null,
  }
}

export default function MissingSignsPage() {
  const { t, i18n } = useTranslation(['ops', 'common'])
  const isEn = i18n.language?.startsWith('en')
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
  const [availableSigns, setAvailableSigns] = useState<AvailableSignOption[]>([])

  const [selectedReport, setSelectedReport] = useState<MissingSignTypeReport | null>(null)
  const [activeTab, setActiveTab] = useState<
    'all' | 'Open' | 'Escalated' | 'Approved' | 'Merged' | 'Incomplete' | 'Rejected'
  >('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedSort, setSelectedSort] = useState<
    'newest' | 'oldest' | 'confidence_asc' | 'confidence_desc' | 'name_asc'
  >('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Sub-Modals
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false)
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false)
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false)
  const [isRecaptureModalOpen, setIsRecaptureModalOpen] = useState(false)
  const [isSubmittingApprove, setIsSubmittingApprove] = useState(false)
  const [isSubmittingRecapture, setIsSubmittingRecapture] = useState(false)

  const [selectedCatalogCode, setSelectedCatalogCode] = useState('')
  const [selectedSignTypeId, setSelectedSignTypeId] = useState<number | null>(null)
  const [catalogSearch, setCatalogSearch] = useState('')
  const [mergeNote, setMergeNote] = useState('')
  const [escalateNote, setEscalateNote] = useState('')
  const [rejectReasonKey, setRejectReasonKey] = useState<MissingRejectReasonKey>('reason_not_sign')

  // Load Categories & Real Catalog Sign Types for lookup from API
  useEffect(() => {
    async function loadCatalogMeta() {
      try {
        const [cats, typesRes] = await Promise.all([
          catalogService.getCategories(),
          catalogService.getAllSignTypes(),
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

      const hasLiveItems = response && Array.isArray(response.items) && response.items.length > 0

      if (hasLiveItems) {
        const mapped = response.items.map(mapBackendReportToMissingSign)
        setReports(mapped)
        setTotalCount(response.total ?? mapped.length)

        // Preload recapture details for any incomplete reports to eliminate UI delay
        const incompleteWithCandidate = mapped.filter(
          (r) => r.status === 'Incomplete' && r.candidateId
        )
        if (incompleteWithCandidate.length > 0) {
          Promise.all(
            incompleteWithCandidate.map(async (rep) => {
              try {
                const recaptures = await catalogService.getCandidateRecaptures(rep.candidateId!)
                if (Array.isArray(recaptures) && recaptures.length > 0) {
                  const latest = recaptures[0]
                  const req = {
                    reason: latest.reason,
                    note: latest.note || '',
                    createdAt: latest.createdAt || latest.created_at,
                  }
                  rep.recaptureRequest = req
                  candidateRecaptureCache.set(rep.candidateId!, req)
                }
              } catch {}
            })
          ).then(() => {
            setReports((prev) => [...prev])
            setSelectedReport((current) => {
              if (!current || current.status !== 'Incomplete' || !current.candidateId) return current
              const cached = candidateRecaptureCache.get(current.candidateId)
              if (cached && !current.recaptureRequest) {
                return { ...current, recaptureRequest: cached }
              }
              return current
            })
          })
        }
      } else {
        setReports([])
        setTotalCount(0)
      }

      if (summaryRes && Array.isArray(summaryRes.items)) {
        const items = summaryRes.items
        setKpiCounts({
          total: summaryRes.total ?? items.length,
          pending: items.filter((i) => i.status === 'PENDING').length,
          escalated: items.filter((i) => i.status === 'ESCALATED_ADMIN' || i.status === 'IN_REVIEW').length,
          approved: items.filter((i) => i.status === 'APPROVED').length,
          merged: items.filter((i) => i.status === 'MERGED').length,
          incomplete: items.filter((i) => i.status === 'INCOMPLETE').length,
          rejected: items.filter((i) => i.status === 'REJECTED').length,
        })
      } else {
        setKpiCounts({
          total: 0,
          pending: 0,
          escalated: 0,
          approved: 0,
          merged: 0,
          incomplete: 0,
          rejected: 0,
        })
      }
    } catch (err: any) {
      console.warn('Live missing sign reports fetch failed:', err)
      setReports([])
      setTotalCount(0)
      setKpiCounts({
        total: 0,
        pending: 0,
        escalated: 0,
        approved: 0,
        merged: 0,
        incomplete: 0,
        rejected: 0,
      })
    } finally {
      setIsLoading(false)
      window.dispatchEvent(new CustomEvent('stm:refresh-badges'))
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
        else if (isRecaptureModalOpen) setIsRecaptureModalOpen(false)
        else if (selectedReport) setSelectedReport(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMergeModalOpen, isEscalateModalOpen, isRejectModalOpen, isApproveModalOpen, isRecaptureModalOpen, selectedReport])

  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, searchQuery, selectedCategory, selectedSort])

  // Status filter options
  const statusOptions: OptionItem[] = useMemo(() => [
    { value: 'all', label: isEn ? 'All Statuses' : 'Tất cả trạng thái', count: kpiCounts.total },
    { value: 'Open', label: isEn ? 'Pending Triage' : 'Chờ thẩm định', count: kpiCounts.pending },
    { value: 'Escalated', label: isEn ? 'Escalated to Admin' : 'Chờ Admin duyệt', count: kpiCounts.escalated },
    { value: 'Approved', label: isEn ? 'Approved' : 'Đã phê duyệt', count: kpiCounts.approved },
    { value: 'Merged', label: isEn ? 'Merged into Catalog' : 'Đã gộp Catalog', count: kpiCounts.merged },
    { value: 'Incomplete', label: isEn ? 'Needs Info' : 'Cần bổ sung', count: kpiCounts.incomplete },
    { value: 'Rejected', label: isEn ? 'Rejected' : 'Đã từ chối', count: kpiCounts.rejected },
  ], [isEn, kpiCounts])

  // Category filter options - clean mock data and sort by standard hierarchy
  const categoryOptions: OptionItem[] = useMemo(() => {
    const base: OptionItem[] = [{ value: 'all', label: t('missing_signs.cat_all', isEn ? 'All Categories' : 'Tất cả nhóm') }]
    if (categories.length > 0) {
      // Filter out test/mock categories like "Mock Traffic Signs"
      const cleanCategories = categories.filter(
        (c) =>
          !c.nameVi?.toLowerCase().includes('mock') &&
          !c.nameEn?.toLowerCase().includes('mock') &&
          !c.code?.toLowerCase().includes('mock')
      )

      // Sort by sortOrder if available
      cleanCategories.sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99))

      cleanCategories.forEach((c) => {
        base.push({ value: `cat_${c.id}`, label: isEn ? (c.nameEn || c.nameVi) : c.nameVi })
      })
    } else {
      base.push(
        { value: 'prohibitory', label: isEn ? 'Prohibitory signs' : 'Biển báo cấm' },
        { value: 'warning', label: isEn ? 'Warning signs' : 'Biển cảnh báo' },
        { value: 'mandatory', label: isEn ? 'Mandatory signs' : 'Biển hiệu lệnh' },
        { value: 'guide', label: isEn ? 'Information signs' : 'Biển chỉ dẫn' },
        { value: 'supplementary', label: isEn ? 'Supplementary signs' : 'Biển phụ' }
      )
    }
    return base
  }, [categories, t, isEn])

  // Sort filter options
  const sortOptions: OptionItem[] = useMemo(() => [
    { value: 'newest', label: isEn ? 'Newest first' : 'Mới nhất' },
    { value: 'oldest', label: isEn ? 'Oldest' : 'Cũ nhất' },
    { value: 'confidence_asc', label: isEn ? 'AI Confidence: Low → High' : 'Độ tin cậy AI: Thấp → Cao' },
    { value: 'confidence_desc', label: isEn ? 'AI Confidence: High → Low' : 'Độ tin cậy AI: Cao → Thấp' },
    { value: 'name_asc', label: isEn ? 'Sign Name: A → Z' : 'Tên biển: A → Z' },
  ], [isEn])

  // Catalog search filtering for Merge modal
  const filteredCatalogSigns = useMemo(() => {
    return availableSigns.filter(
      (s: AvailableSignOption) =>
        s.code.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        s.codeTitle.toLowerCase().includes(catalogSearch.toLowerCase())
    )
  }, [availableSigns, catalogSearch])

  // Main reports filtering & sorting
  const filteredReports = useMemo(() => {
    const list = reports.filter((r) => {
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

    return list.sort((a, b) => {
      switch (selectedSort) {
        case 'newest': {
          const dateA = new Date(a.reportedAt || 0).getTime()
          const dateB = new Date(b.reportedAt || 0).getTime()
          return dateB - dateA
        }
        case 'oldest': {
          const dateA = new Date(a.reportedAt || 0).getTime()
          const dateB = new Date(b.reportedAt || 0).getTime()
          return dateA - dateB
        }
        case 'confidence_desc': {
          return (b.aiConfidence ?? 0) - (a.aiConfidence ?? 0)
        }
        case 'confidence_asc': {
          return (a.aiConfidence ?? 0) - (b.aiConfidence ?? 0)
        }
        case 'name_asc': {
          return a.tempLabel.localeCompare(b.tempLabel, 'vi')
        }
        default:
          return 0
      }
    })
  }, [reports, searchQuery, selectedCategory, selectedSort])

  const paginatedReports = filteredReports

  // Handlers
  async function handleMergeSubmit(overrideCode?: string, overrideSignTypeId?: number, noteOverride?: string) {
    if (!selectedReport) return
    const code = typeof overrideCode === 'string' ? overrideCode : selectedCatalogCode
    const signTypeId = typeof overrideSignTypeId === 'number' ? overrideSignTypeId : selectedSignTypeId
    const updatedId = selectedReport.id
    const finalNote =
      typeof noteOverride === 'string' && noteOverride.trim()
        ? noteOverride.trim()
        : mergeNote.trim()
          ? mergeNote.trim()
          : `Đã gộp vào biển ${code} trong Catalog chuẩn.`
    try {
      await catalogService.updateMissingReport(updatedId, {
        actionType: 'MERGE',
        mergedSignTypeId: signTypeId ?? undefined,
        staffNotes: finalNote,
      })
      success(t('missing_signs.toast_merged', { id: updatedId, code }))
      fetchReports()
    } catch (err: any) {
      console.error('Failed to merge missing report:', err)
      error(err?.message || 'Không thể gộp báo cáo trên máy chủ')
    } finally {
      setIsMergeModalOpen(false)
      setSelectedReport(null)
      setMergeNote('')
    }
  }

  async function handleEscalateSubmit(noteOverride?: string) {
    if (!selectedReport) return
    const updatedId = selectedReport.id
    const note = (typeof noteOverride === 'string' && noteOverride.trim()) ? noteOverride.trim() : (escalateNote || '').trim()
    if (!note) {
      error('Vui lòng nhập ghi chú thông tin sơ bộ về biển lạ khi chuyển lên Admin!')
      return
    }
    try {
      await catalogService.updateMissingReport(updatedId, {
        actionType: 'ESCALATE_ADMIN',
        staffNotes: note,
      })
      success(t('missing_signs.toast_escalated', { id: updatedId }))
      fetchReports()
    } catch (err: any) {
      console.error('Failed to escalate missing report:', err)
      error(err?.message || 'Không thể chuyển tiếp báo cáo lên quản trị viên')
    } finally {
      setIsEscalateModalOpen(false)
      setSelectedReport(null)
      setEscalateNote('')
    }
  }

  async function handleRejectSubmit(reasonKeyOverride?: MissingRejectReasonKey) {
    if (!selectedReport) return
    const updatedId = selectedReport.id
    const key = reasonKeyOverride || rejectReasonKey
    const reasonText = t(`missing_signs.${key}`)
    try {
      await catalogService.updateMissingReport(updatedId, {
        actionType: 'REJECT',
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

  async function handleRecaptureSubmit(reason: RecaptureReasonCode, note: string) {
    if (!selectedReport) return
    const reportId = selectedReport.id
    const candidateId = selectedReport.candidateId
    setIsSubmittingRecapture(true)
    try {
      await catalogService.updateMissingReport(reportId, {
        actionType: 'REQUEST_RECAPTURE',
        staffNotes: note,
      })

      if (candidateId) {
        candidateRecaptureCache.set(candidateId, {
          reason,
          note,
          createdAt: new Date().toISOString(),
        })
      }

      success(`Đã phân bổ Surveyor thực địa chụp lại biển cho báo cáo #${reportId.slice(0, 8)}`)
      setIsRecaptureModalOpen(false)
      setSelectedReport(null)
      fetchReports()
    } catch (err: any) {
      console.error('Failed to request recapture:', err)
      error(err?.message || 'Không thể gửi yêu cầu chụp lại cho máy chủ')
    } finally {
      setIsSubmittingRecapture(false)
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
        title={t('missing_signs.title', 'Đề xuất biển mới')}
        subtitle={t('missing_signs.subtitle', 'Xem xét và thẩm tra các báo cáo biển báo thực tế chưa có trong danh mục do cộng đồng đóng góp.')}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                Tổng <strong className="font-mono text-gray-900 dark:text-white">{totalCount}</strong> đề xuất
              </span>
            </div>

            {/* Refresh Button placed in Header like /escalations */}
            <button
              type="button"
              disabled={isLoading}
              onClick={fetchReports}
              className="p-2 border border-gray-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 rounded-xl transition-colors cursor-pointer shrink-0 disabled:opacity-50 shadow-2xs"
              title="Làm mới dữ liệu"
            >
              <ArrowsClockwise size={16} weight="bold" className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        }
      />

      {/* ─── DATA FILTER BAR (Clean Single-Row matching /escalations) ──── */}
      <DataFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={isEn ? 'Search by proposal ID, label, reporter...' : 'Tìm mã đề xuất, tên biển, người tạo...'}
      >
        {/* 1. Trạng thái Filter */}
        <CustomSelect
          options={statusOptions}
          value={activeTab}
          onChange={(val) => setActiveTab(val as any)}
          prefixLabel={isEn ? 'Status' : 'Trạng thái'}
          size="sm"
          className="w-full sm:w-48"
        />

        {/* 2. Nhóm biển Filter */}
        <CustomSelect
          options={categoryOptions}
          value={selectedCategory}
          onChange={setSelectedCategory}
          prefixLabel={isEn ? 'Category' : 'Nhóm biển'}
          leftIcon={<Funnel size={14} className="text-gray-400" />}
          size="sm"
          className="w-full sm:w-48"
        />

        {/* 3. Sắp xếp Filter */}
        <CustomSelect
          options={sortOptions}
          value={selectedSort}
          onChange={(val) => setSelectedSort(val as any)}
          prefixLabel={isEn ? 'Sort by' : 'Sắp xếp'}
          size="sm"
          className="w-full sm:w-52"
        />
      </DataFilterBar>

      {/* ─── MAIN CONTENT: TABLE VIEW ONLY (Consistent with /escalations) ── */}
      {isLoading ? (
        <div className="py-16 px-6 text-center space-y-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A171C] shadow-xs">
          <CircleNotch size={28} className="animate-spin text-[#007b8b] dark:text-[#00c4de] mx-auto" />
          <p className="text-xs text-neutral-500 font-medium">Đang tải danh sách báo cáo biển mới/thiếu...</p>
        </div>
      ) : (
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
          onSelectReport={(rep) => {
            if (rep.status === 'Incomplete' && rep.candidateId && !rep.recaptureRequest) {
              const cached = candidateRecaptureCache.get(rep.candidateId)
              if (cached) {
                setSelectedReport({ ...rep, recaptureRequest: cached })
                return
              }
            }
            setSelectedReport(rep)

            if (rep.id) {
              catalogService
                .getMissingReportById(rep.id)
                .then((fresh) => {
                  if (fresh) {
                    const freshMapped = mapBackendReportToMissingSign(fresh)
                    setSelectedReport((cur) => (cur?.id === rep.id ? { ...cur, ...freshMapped } : cur))
                  }
                })
                .catch(() => {})
            }
          }}
        />
      )}

      {/* ─── INSPECTION MODAL ────────────────────────────────────────── */}
      {selectedReport &&
        !isMergeModalOpen &&
        !isEscalateModalOpen &&
        !isRejectModalOpen &&
        !isApproveModalOpen &&
        !isRecaptureModalOpen && (
          <MissingSignInspectionModal
            report={selectedReport}
            isAdmin={isAdmin}
            onClose={() => setSelectedReport(null)}
            onOpenMerge={(note?: string) => {
              setMergeNote(note || '')
              if (selectedReport?.similarCatalogEntries?.[0]) {
                setSelectedCatalogCode(selectedReport.similarCatalogEntries[0])
              }
              setIsMergeModalOpen(true)
            }}
            onOpenEscalate={() => setIsEscalateModalOpen(true)}
            onOpenReject={() => setIsRejectModalOpen(true)}
            onOpenApprove={isAdmin && selectedReport.status === 'Escalated' ? () => setIsApproveModalOpen(true) : undefined}
            onOpenIncomplete={() => setIsRecaptureModalOpen(true)}
            onDirectEscalate={handleEscalateSubmit}
            onDirectReject={handleRejectSubmit}
            onDirectRecapture={handleRecaptureSubmit}
          />
        )}

      {/* ─── ACTION MODALS ───────────────────────────────────────────── */}
      <MissingSignMergeModal
        isOpen={isMergeModalOpen}
        selectedReport={selectedReport}
        selectedCatalogCode={selectedCatalogCode}
        initialNote={mergeNote}
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

      {/* Surveyor Recapture Request Modal */}
      <MissingSignRecaptureModal
        isOpen={isRecaptureModalOpen}
        selectedReport={selectedReport}
        onClose={() => setIsRecaptureModalOpen(false)}
        onSubmit={handleRecaptureSubmit}
        isSubmitting={isSubmittingRecapture}
      />
    </div>
  )
}
