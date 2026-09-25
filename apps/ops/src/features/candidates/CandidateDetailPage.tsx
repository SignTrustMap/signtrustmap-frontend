import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSidebar } from '@/context/SidebarContext'
import { SearchBar } from '@/components/common/SearchBar'
import { ModalPortal } from '@/components/common/ModalPortal'
import {
  CaretRight,
  WarningOctagon,
  User,
  FileText,
  ClockCounterClockwise,
  Prohibit,
  ArrowsClockwise,
  CheckCircle,
  FileImage,
  ArrowSquareOut,
  ShieldCheck,
  Tag,
  RocketLaunch,
  X,
  Check,
  ArrowsOut,
  Compass,
  TrafficSignal,
} from '@phosphor-icons/react'
import { mockCandidateDetail, availableCatalogSigns } from '@/data'
import { mockCatalogData } from '@/data/catalogData'
import { TrafficSignGraphic } from '@/features/catalog/components/TrafficSignGraphic'

type StatusKey = 'reviewing' | 'rejected' | 'resurvey' | 'approved' | 'escalated'
type RejectReasonKey = 'reason_blur' | 'reason_not_sign' | 'reason_gps_offset' | 'reason_spoofing' | 'reason_duplicate'
type ActionNoticeKey =
  | 'notice_rejected'
  | 'notice_resurvey'
  | 'notice_approved'
  | 'notice_corrected'
  | 'notice_escalated'

interface NoticeState {
  key: ActionNoticeKey
  params?: Record<string, any>
}

export default function CandidateDetailPage() {
  const { t } = useTranslation('ops')
  const { isCollapsed } = useSidebar()
  const { id } = useParams<{ id: string }>()
  const candidate = mockCandidateDetail
  const reportId = t('candidate_detail.case_prefix', { id: id || candidate.id })

  const [currentStatusKey, setCurrentStatusKey] = useState<StatusKey>('reviewing')
  const [actionNotice, setActionNotice] = useState<NoticeState | null>(null)
  const [selectedLabel, setSelectedLabel] = useState<string>(candidate.predictedLabel)

  // Modals state
  const [isCorrectModalOpen, setIsCorrectModalOpen] = useState(false)
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false)
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null)

  const [rejectReasonKey, setRejectReasonKey] = useState<RejectReasonKey>('reason_blur')
  const [rejectNote, setRejectNote] = useState('')
  const [escalateNote, setEscalateNote] = useState('')
  const [catalogSearch, setCatalogSearch] = useState('')

  // Resolve current sign entry for reference display
  const currentCode = (selectedLabel.split(' - ')[0] || 'P.102').trim()
  const referenceSignEntry =
    mockCatalogData.find((s) => s.code.toLowerCase() === currentCode.toLowerCase()) ||
    mockCatalogData[0]

  const filteredSigns = availableCatalogSigns.filter(
    (s) =>
      s.code.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      s.codeTitle.toLowerCase().includes(catalogSearch.toLowerCase())
  )

  function handleAction(action: 'reject' | 'resurvey' | 'approve' | 'correct' | 'escalate') {
    if (action === 'reject') {
      setCurrentStatusKey('rejected')
      setActionNotice({
        key: 'notice_rejected',
        params: { reason: t(`candidate_detail.${rejectReasonKey}`) },
      })
      setIsRejectModalOpen(false)
    } else if (action === 'resurvey') {
      setCurrentStatusKey('resurvey')
      setActionNotice({ key: 'notice_resurvey' })
    } else if (action === 'approve') {
      setCurrentStatusKey('approved')
      setActionNotice({ key: 'notice_approved' })
    } else if (action === 'correct') {
      setActionNotice({
        key: 'notice_corrected',
        params: { label: selectedLabel },
      })
      setIsCorrectModalOpen(false)
    } else if (action === 'escalate') {
      setCurrentStatusKey('escalated')
      setActionNotice({ key: 'notice_escalated' })
      setIsEscalateModalOpen(false)
    }
  }

  // Keyboard accessibility & hotkeys (A: Approve, R: Reject, C: Correct, S: Resurvey, E: Escalate)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      const isInputFocused =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable

      if (e.key === 'Escape') {
        setIsCorrectModalOpen(false)
        setIsRejectModalOpen(false)
        setIsEscalateModalOpen(false)
        setLightboxImageUrl(null)
        return
      }

      if (isInputFocused || isCorrectModalOpen || isRejectModalOpen || isEscalateModalOpen || lightboxImageUrl) {
        return
      }

      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault()
        handleAction('approve')
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        setIsRejectModalOpen(true)
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault()
        setIsCorrectModalOpen(true)
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault()
        handleAction('resurvey')
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault()
        setIsEscalateModalOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isCorrectModalOpen, isRejectModalOpen, isEscalateModalOpen, lightboxImageUrl, selectedLabel, rejectReasonKey])

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 pb-24">
      {/* Breadcrumb & Navigation */}
      <nav className="flex items-center gap-2 text-xs text-gray-500 font-medium">
        <Link
          to="/candidates"
          className="hover:text-[#007b8b] dark:hover:text-[#00c4de] transition-colors flex items-center gap-1"
        >
          <span>{t('candidate_detail.breadcrumb')}</span>
        </Link>
        <CaretRight size={12} />
        <span className="text-gray-900 dark:text-white font-bold font-mono">{reportId}</span>
      </nav>

      {/* Page Title & Status (Action buttons moved exclusively to Sticky Bottom Bar) */}
      <div className="border-b border-[#E8E4E3] dark:border-white/10 pb-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                {t('candidate_detail.title')}
              </h1>
              <span className="font-mono text-xs px-3 py-1 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-200 font-bold border border-gray-200/80 dark:border-white/15 shadow-2xs">
                {reportId}
              </span>
            </div>
          </div>

          {/* Status Badges Group */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-[#fee2e2] text-[#b91c1c] dark:bg-red-500/15 dark:text-red-400 dark:border dark:border-red-500/30 uppercase tracking-wider shadow-2xs">
              <WarningOctagon size={15} weight="fill" /> {t('candidate_detail.priority_high')}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-[#007b8b]/10 text-[#007b8b] dark:bg-[#00c4de]/15 dark:text-[#00c4de] dark:border dark:border-[#00c4de]/30">
              <span className="w-2 h-2 rounded-full bg-[#007b8b] dark:bg-[#00c4de] animate-pulse" />
              <span>{t(`candidate_detail.status_${currentStatusKey}`)}</span>
            </span>
          </div>
        </div>
      </div>

      {actionNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-300 text-xs sm:text-sm flex items-center justify-between gap-2 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} weight="fill" className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-semibold">
              {t(`candidate_detail.${actionNotice.key}` as any, actionNotice.params) as string}
            </span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-emerald-700 dark:text-emerald-400 hover:opacity-75">
            <X size={16} />
          </button>
        </div>
      )}

      {/* ─── Evidence Tri-View: Crop AI vs Reference Catalog vs Context Dashcam ─── */}
      <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileImage size={20} className="text-[#007b8b] dark:text-[#00c4de]" />
            <span>{t('candidate_detail.sec_evidence_title')}</span>
          </h2>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
            {t('candidate_detail.click_to_zoom')}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. AI Crop Detection */}
          <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/40 flex flex-col group">
            <div className="px-3.5 py-2.5 border-b border-gray-200 dark:border-white/10 flex items-center justify-between text-xs font-semibold">
              <span className="text-gray-700 dark:text-gray-300">{t('candidate_detail.card_ai_crop')}</span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#007b8b]/10 text-[#007b8b] dark:text-[#00c4de]">
                {candidate.yoloConfidence}% Conf
              </span>
            </div>
            <div
              onClick={() => setLightboxImageUrl(candidate.cropImageHdUrl)}
              className="aspect-square bg-gray-100 dark:bg-black relative flex items-center justify-center cursor-zoom-in p-4 overflow-hidden"
            >
              <img
                src={candidate.cropImageUrl}
                alt="AI Detected Crop"
                className="max-h-full max-w-full object-contain rounded transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold">
                <ArrowsOut size={16} />
                <span>{t('candidate_detail.btn_full_view')}</span>
              </div>
              <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/75 text-white text-[10px] font-mono">
                {candidate.cropFileName}
              </span>
            </div>
            <div className="p-2.5 text-[11px] text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-white/10 flex items-center justify-between font-mono">
              <span>Bounding Box: [340, 210, 480, 350]</span>
              <span className="text-[#007b8b] dark:text-[#00c4de] font-bold">YOLO12x</span>
            </div>
          </div>

          {/* 2. Standard Catalog Reference */}
          <div className="rounded-xl overflow-hidden border-2 border-[#007b8b]/30 dark:border-[#00c4de]/30 bg-gradient-to-b from-[#007b8b]/5 to-transparent dark:from-[#00c4de]/5 flex flex-col">
            <div className="px-3.5 py-2.5 border-b border-gray-200 dark:border-white/10 flex items-center justify-between text-xs font-semibold bg-white dark:bg-[#0A171C]">
              <span className="text-[#007b8b] dark:text-[#00c4de] font-bold">{t('candidate_detail.card_catalog_ref')}</span>
              <button
                type="button"
                onClick={() => setIsCorrectModalOpen(true)}
                className="text-[11px] text-[#007b8b] dark:text-[#00c4de] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <Tag size={13} weight="bold" />
                <span>{t('candidate_detail.btn_change_label')}</span>
              </button>
            </div>
            <div className="aspect-square bg-white dark:bg-[#061014] flex flex-col items-center justify-center p-6 text-center relative">
              <TrafficSignGraphic sign={referenceSignEntry} className="w-28 h-28 object-contain drop-shadow-md" />
              <div className="mt-3">
                <p className="font-mono text-xs font-bold text-gray-900 dark:text-white">
                  {referenceSignEntry.code}
                </p>
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                  {referenceSignEntry.nameVi}
                </p>
                <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                  QCĐN 41:2019/BGTVT
                </p>
              </div>
            </div>
            <div className="p-2.5 text-[11px] bg-white dark:bg-[#0A171C] border-t border-gray-200 dark:border-white/10 flex items-center justify-between">
              <span className="text-gray-500 font-mono">{t('candidate_detail.lbl_current_label')}</span>
              <span className="font-bold text-[#007b8b] dark:text-[#00c4de] truncate max-w-[170px]" title={selectedLabel}>
                {selectedLabel}
              </span>
            </div>
          </div>

          {/* 3. Dashcam Context View */}
          <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/40 flex flex-col group">
            <div className="px-3.5 py-2.5 border-b border-gray-200 dark:border-white/10 flex items-center justify-between text-xs font-semibold">
              <span className="text-gray-700 dark:text-gray-300">{t('candidate_detail.card_dashcam_context')}</span>
              <span className="text-[10px] font-mono text-gray-400">1920x1080</span>
            </div>
            <div
              onClick={() => setLightboxImageUrl(candidate.contextImageHdUrl)}
              className="aspect-square bg-gray-100 dark:bg-black relative flex items-center justify-center cursor-zoom-in overflow-hidden"
            >
              <img
                src={candidate.contextImageUrl}
                alt="Context Frame"
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold">
                <ArrowsOut size={16} />
                <span>{t('candidate_detail.btn_full_view')}</span>
              </div>
              <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/75 text-white text-[10px] font-mono">
                {candidate.contextFileName}
              </span>
            </div>
            <div className="p-2.5 text-[11px] text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-white/10 flex items-center justify-between font-mono">
              <span>Đường Nguyễn Huệ, Q.1, TP.HCM</span>
              <a
                href={candidate.contextImageHdUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[#007b8b] dark:text-[#00c4de] hover:underline inline-flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <span>HD</span>
                <ArrowSquareOut size={11} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: 8 Cols Left (AI Telemetry & Consensus) + 4 Cols Right (Surveyor Profile & Audit Log) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card: AI Telemetry & Conflict Diagnostic */}
          <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText size={20} className="text-[#007b8b] dark:text-[#00c4de]" />
                <span>{t('candidate_detail.sec_ai_telemetry')}</span>
              </h2>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#007b8b] dark:text-[#00c4de] bg-[#007b8b]/10 dark:bg-[#00c4de]/15 px-2.5 py-1 rounded-lg">
                  YOLO12: {candidate.yoloConfidence}%
                </span>
                <span className="font-mono text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-500/15 px-2.5 py-1 rounded-lg">
                  CLIP: {candidate.clipConfidence}%
                </span>
              </div>
            </div>

            <div className="bg-red-50/70 dark:bg-red-950/30 border border-red-200/70 dark:border-red-500/30 rounded-xl p-4 space-y-1">
              <p className="text-xs font-bold text-red-900 dark:text-red-300 flex items-center gap-1.5">
                <WarningOctagon size={16} weight="fill" className="text-red-500 shrink-0" />
                <span>{t('candidate_detail.flag_reason_title')}</span>
              </p>
              <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed pl-5">
                {t('candidate_detail.flag_reason_desc')}
              </p>
            </div>

            {/* Candidate Telemetry Attributes (Vision & Geometric Dual-Path) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
              <div className="p-3.5 rounded-xl bg-[#F8F7F7] dark:bg-white/5 border border-gray-100 dark:border-white/10 space-y-1">
                <span className="text-gray-400 font-mono text-[11px] uppercase">{t('candidate_detail.lbl_predicted_label')}</span>
                <p className="font-bold text-gray-900 dark:text-white font-mono text-xs truncate" title={selectedLabel}>
                  {selectedLabel}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F8F7F7] dark:bg-white/5 border border-gray-100 dark:border-white/10 space-y-1">
                <span className="text-gray-400 font-mono text-[11px] uppercase">{t('candidate_detail.lbl_coords')}</span>
                <p className="font-bold text-gray-900 dark:text-white font-mono text-xs">
                  {candidate.lat}° N, {candidate.lng}° E
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F8F7F7] dark:bg-white/5 border border-gray-100 dark:border-white/10 space-y-1">
                <span className="text-gray-400 font-mono text-[11px] uppercase">{t('candidate_detail.lbl_distance')}</span>
                <p className="font-bold text-gray-900 dark:text-white font-mono text-xs">
                  {t('candidate_detail.distance_unit')}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F8F7F7] dark:bg-white/5 border border-gray-100 dark:border-white/10 space-y-1">
                <span className="text-gray-400 font-mono text-[11px] uppercase">{t('candidate_detail.lbl_heading')}</span>
                <p className="font-bold text-[#007b8b] dark:text-[#00c4de] font-mono text-xs flex items-center gap-1">
                  <Compass size={14} weight="bold" />
                  <span>{candidate.heading}° • {t('candidate_detail.direction_south')}</span>
                </p>
              </div>
            </div>

            {/* Community Reviewer Consensus Votes */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-2.5">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  {t('candidate_detail.lbl_consensus_ratio')}
                </span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {t('candidate_detail.consensus_conflict_badge')}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-3.5 flex overflow-hidden shadow-inner">
                <div
                  className="bg-emerald-500 h-full text-[10px] text-white flex items-center justify-center font-bold"
                  style={{ width: '50%' }}
                >
                  {t('candidate_detail.consensus_approve_unit', { count: candidate.consensusApprove })}
                </div>
                <div
                  className="bg-red-500 h-full text-[10px] text-white flex items-center justify-center font-bold"
                  style={{ width: '50%' }}
                >
                  {t('candidate_detail.consensus_reject_unit', { count: candidate.consensusReject })}
                </div>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {t('candidate_detail.consensus_conflict_desc')}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* User Profile Card */}
          <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-6 shadow-xs">
            <h2 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider font-mono mb-4 flex items-center gap-2">
              <User size={18} className="text-[#007b8b] dark:text-[#00c4de]" />
              <span>{t('candidate_detail.lbl_surveyor')}</span>
            </h2>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#007b8b]/10 dark:bg-[#00c4de]/15 text-[#007b8b] dark:text-[#00c4de] font-bold text-base flex items-center justify-center border border-[#007b8b]/20 dark:border-[#00c4de]/30">
                {candidate.surveyor.initials}
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white text-sm">{candidate.surveyor.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{t(`candidate_detail.${candidate.surveyor.levelKey}`)}</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs border-t border-gray-100 dark:border-white/10 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">{t('candidate_detail.lbl_trust_score')}</span>
                <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/15">
                  {candidate.surveyor.trustScore}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">{t('candidate_detail.lbl_total_runs')}</span>
                <span className="font-bold font-mono text-gray-900 dark:text-white">
                  {t('candidate_detail.lbl_runs_unit', { count: candidate.surveyor.totalRuns })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">{t('candidate_detail.lbl_accuracy_rate')}</span>
                <span className="font-bold font-mono text-gray-900 dark:text-white">
                  {candidate.surveyor.accuracyRate}%
                </span>
              </div>
            </div>
          </div>

          {/* Audit History Log */}
          <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-6 shadow-xs">
            <h2 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider font-mono mb-4 flex items-center gap-2">
              <ClockCounterClockwise size={18} className="text-[#007b8b] dark:text-[#00c4de]" />
              <span>{t('candidate_detail.lbl_audit_log')}</span>
            </h2>

            <div className="space-y-3 text-xs">
              {candidate.auditLogs.map((log) => (
                <div key={log.id} className="border-l-2 border-[#007b8b] dark:border-[#00c4de] pl-3 py-1">
                  <p className="font-bold text-gray-900 dark:text-white">{t(`candidate_detail.${log.logKey}`)}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-[11px] font-mono mt-0.5">
                    {log.actor} • {log.time === 'log_now' ? t('candidate_detail.log_now') : log.time}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── COMPACT STICKY BOTTOM ACTION BAR FOR STAFF (Centered in main content frame) ─── */}
      <div
        className={`fixed bottom-4 z-40 transition-all duration-300 ease-in-out -translate-x-1/2 ${
          isCollapsed ? 'left-[calc(50%+34px)]' : 'left-[calc(50%+128px)]'
        } bg-white/95 dark:bg-[#0A171C]/95 backdrop-blur-md border border-gray-200/80 dark:border-white/15 px-3 py-1.5 rounded-2xl shadow-xl flex items-center gap-1.5 max-w-[95vw] overflow-x-auto ring-1 ring-black/5 dark:ring-white/5`}
      >
        <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 font-mono pr-2 border-r border-gray-200 dark:border-white/10 hidden sm:inline uppercase tracking-wider">
          {t('candidate_detail.lbl_actions')}
        </span>

        <button
          type="button"
          onClick={() => setIsCorrectModalOpen(true)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-cyan-200 dark:border-cyan-500/30 bg-cyan-50/80 dark:bg-cyan-500/15 text-cyan-800 dark:text-[#00c4de] hover:bg-cyan-100 dark:hover:bg-cyan-500/25 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap shadow-2xs active:scale-95"
          title="Hotkey: C"
        >
          <Tag size={14} weight="bold" />
          <span>{t('candidate_detail.btn_correct_short')}</span>
          <kbd className="px-1 py-0.2 text-[9px] font-mono font-bold bg-white/80 dark:bg-white/15 rounded border border-cyan-300 dark:border-cyan-500/40">C</kbd>
        </button>

        <button
          type="button"
          onClick={() => setIsRejectModalOpen(true)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-red-200 dark:border-red-500/30 bg-red-50/80 dark:bg-red-500/15 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/25 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap shadow-2xs active:scale-95"
          title="Hotkey: R"
        >
          <Prohibit size={14} weight="bold" />
          <span>{t('candidate_detail.btn_reject_short')}</span>
          <kbd className="px-1 py-0.2 text-[9px] font-mono font-bold bg-white/80 dark:bg-white/15 rounded border border-red-300 dark:border-red-500/40">R</kbd>
        </button>

        <button
          type="button"
          onClick={() => handleAction('resurvey')}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-amber-200 dark:border-amber-500/30 bg-amber-50/80 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-500/25 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap shadow-2xs active:scale-95"
          title="Hotkey: S"
        >
          <ArrowsClockwise size={14} weight="bold" />
          <span>{t('candidate_detail.btn_resurvey_short')}</span>
          <kbd className="px-1 py-0.2 text-[9px] font-mono font-bold bg-white/80 dark:bg-white/15 rounded border border-amber-300 dark:border-amber-500/40">S</kbd>
        </button>

        <button
          type="button"
          onClick={() => setIsEscalateModalOpen(true)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-purple-200 dark:border-purple-500/30 bg-purple-50/80 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-500/25 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap shadow-2xs active:scale-95"
          title="Hotkey: E"
        >
          <RocketLaunch size={14} weight="bold" />
          <span>{t('candidate_detail.btn_escalate_short')}</span>
          <kbd className="px-1 py-0.2 text-[9px] font-mono font-bold bg-white/80 dark:bg-white/15 rounded border border-purple-300 dark:border-purple-500/40">E</kbd>
        </button>

        <button
          type="button"
          onClick={() => handleAction('approve')}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#007b8b] hover:bg-[#00606d] text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer active:scale-95 whitespace-nowrap"
          title="Hotkey: A"
        >
          <CheckCircle size={15} weight="bold" />
          <span>{t('candidate_detail.btn_approve_short')}</span>
          <kbd className="px-1 py-0.2 text-[9px] font-mono font-bold bg-white/20 rounded border border-white/30 text-white">A</kbd>
        </button>
      </div>

      {/* ─── MODAL: Lightbox Zoom ────────────────────────────────────── */}
      {lightboxImageUrl && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
            onClick={() => setLightboxImageUrl(null)}
          >
          <div className="relative max-w-5xl w-full max-h-[90vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightboxImageUrl}
              alt="Enlarged Evidence Preview"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/15"
            />
            <button
              onClick={() => setLightboxImageUrl(null)}
              className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-black/80 text-white hover:bg-black flex items-center justify-center border border-white/20 transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* ─── MODAL: Sửa Nhãn Biển Báo với Graphic Thumbnail ─────────── */}
      {isCorrectModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/15 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/10 pb-3">
              <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
                <Tag size={18} className="text-[#007b8b] dark:text-[#00c4de]" />
                <span>{t('candidate_detail.modal_correct_title')}</span>
              </h3>
              <button onClick={() => setIsCorrectModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                <X size={18} />
              </button>
            </div>

            <SearchBar
              value={catalogSearch}
              onChange={setCatalogSearch}
              placeholder={t('catalog.search_placeholder')}
              size="sm"
            />

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {filteredSigns.map((s) => {
                const labelStr = s.codeTitle
                const isSelected = selectedLabel === labelStr
                const catalogEntry = mockCatalogData.find(
                  (cEntry) => cEntry.code.toLowerCase() === s.code.toLowerCase()
                )

                return (
                  <div
                    key={s.code}
                    onClick={() => setSelectedLabel(labelStr)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-[#007b8b]/10 border-[#007b8b] text-[#007b8b] dark:text-[#00c4de] dark:border-[#00c4de] font-bold shadow-2xs'
                        : 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {catalogEntry ? (
                        <div className="w-9 h-9 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 flex items-center justify-center p-1 shrink-0">
                          <TrafficSignGraphic sign={catalogEntry} className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 shrink-0">
                          <TrafficSignal size={18} />
                        </div>
                      )}
                      <div>
                        <div className="font-mono font-bold text-gray-900 dark:text-white">
                          <span>{s.code}</span> - {s.codeTitle.split(' - ')[1] || s.codeTitle}
                        </div>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 block font-normal">
                          {t(`catalog.${s.nameKey}`)}
                        </span>
                      </div>
                    </div>
                    {isSelected && <Check size={18} weight="bold" className="text-[#007b8b] dark:text-[#00c4de]" />}
                  </div>
                )
              })}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-white/10">
              <button
                type="button"
                onClick={() => setIsCorrectModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer"
              >
                {t('candidate_detail.btn_cancel')}
              </button>
              <button
                type="button"
                onClick={() => handleAction('correct')}
                className="px-4 py-2 bg-[#007b8b] hover:bg-[#00606d] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all"
              >
                {t('candidate_detail.btn_save_label')}
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* ─── MODAL: Từ chối Ứng viên với Quick-select chips ──────────── */}
      {isRejectModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/15 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/10 pb-3">
              <h3 className="font-bold text-red-600 dark:text-red-400 text-base flex items-center gap-2">
                <Prohibit size={18} weight="bold" />
                <span>{t('candidate_detail.modal_reject_title')}</span>
              </h3>
              <button onClick={() => setIsRejectModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-gray-500 dark:text-gray-400 font-mono uppercase text-[11px] mb-2 font-semibold">
                  {t('candidate_detail.lbl_quick_reject_reasons')}
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {(
                    [
                      { key: 'reason_blur', label: t('candidate_detail.reason_blur') },
                      { key: 'reason_not_sign', label: t('candidate_detail.reason_not_sign') },
                      { key: 'reason_gps_offset', label: t('candidate_detail.reason_gps_offset') },
                      { key: 'reason_spoofing', label: t('candidate_detail.reason_spoofing') },
                      { key: 'reason_duplicate', label: t('candidate_detail.reason_duplicate') },
                    ] as const
                  ).map((item) => {
                    const isSelected = rejectReasonKey === item.key
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setRejectReasonKey(item.key)}
                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-red-50 dark:bg-red-500/15 border-red-300 dark:border-red-500/40 text-red-700 dark:text-red-300 font-bold'
                            : 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <span>{item.label}</span>
                        {isSelected && <Check size={14} weight="bold" className="text-red-600" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-gray-500 dark:text-gray-400 font-mono uppercase text-[11px] mb-1 font-semibold">
                  {t('candidate_detail.lbl_reject_note_optional')}
                </label>
                <textarea
                  rows={2}
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  placeholder={t('candidate_detail.placeholder_reject_note')}
                  className="w-full p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-red-500 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-white/10">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer"
              >
                {t('candidate_detail.btn_cancel')}
              </button>
              <button
                type="button"
                onClick={() => handleAction('reject')}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all"
              >
                {t('candidate_detail.btn_confirm_reject')}
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* ─── MODAL: Chuyển tiếp Admin ───────────────────────────────── */}
      {isEscalateModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/15 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/10 pb-3">
              <h3 className="font-bold text-purple-600 dark:text-purple-400 text-base flex items-center gap-2">
                <RocketLaunch size={18} weight="bold" />
                <span>{t('candidate_detail.modal_escalate_title')}</span>
              </h3>
              <button onClick={() => setIsEscalateModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-gray-600 dark:text-gray-300">
                {t('candidate_detail.flag_reason_desc')}
              </p>
              <div>
                <label className="block text-gray-500 font-mono uppercase text-[11px] mb-1 font-semibold">
                  {t('candidate_detail.lbl_staff_opinion')}
                </label>
                <textarea
                  rows={3}
                  value={escalateNote}
                  onChange={(e) => setEscalateNote(e.target.value)}
                  placeholder={t('candidate_detail.lbl_staff_opinion')}
                  className="w-full p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-white/10">
              <button
                type="button"
                onClick={() => setIsEscalateModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer"
              >
                {t('candidate_detail.btn_cancel')}
              </button>
              <button
                type="button"
                onClick={() => handleAction('escalate')}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all"
              >
                {t('candidate_detail.btn_escalate_now')}
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
    </div>
  )
}
