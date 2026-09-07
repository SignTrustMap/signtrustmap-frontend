import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import CustomSelect from '@/components/common/CustomSelect'
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
  NavigationArrow,
  Tag,
  RocketLaunch,
  X,
  Check,
  MagnifyingGlass,
} from '@phosphor-icons/react'
import { mockCandidateDetail, availableCatalogSigns } from '@/data'

type StatusKey = 'reviewing' | 'rejected' | 'resurvey' | 'approved' | 'escalated'
type RejectReasonKey = 'reason_blur' | 'reason_not_sign' | 'reason_gps_offset' | 'reason_spoofing' | 'reason_duplicate'

interface NoticeState {
  key: string
  params?: Record<string, any>
}

export default function CandidateDetailPage() {
  const { t } = useTranslation('ops')
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
  
  const [rejectReasonKey, setRejectReasonKey] = useState<RejectReasonKey>('reason_blur')
  const [rejectNote, setRejectNote] = useState('')
  const [escalateNote, setEscalateNote] = useState('')
  const [catalogSearch, setCatalogSearch] = useState('')

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

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-500 font-medium">
        <Link
          to="/candidates"
          className="hover:text-[#007b8b] dark:hover:text-[#00c4de] transition-colors"
        >
          {t('candidate_detail.breadcrumb')}
        </Link>
        <CaretRight size={12} />
        <span className="text-gray-900 dark:text-white font-bold font-mono">{reportId}</span>
      </nav>

      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E4E3] dark:border-white/10 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {t('candidate_detail.title')}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-bold bg-[#fee2e2] text-[#b91c1c] dark:bg-red-500/15 dark:text-red-400 dark:border dark:border-red-500/30 uppercase tracking-wider">
              <WarningOctagon size={14} weight="fill" /> {t('candidate_detail.priority_high')}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
              {t('candidate_detail.status_label')}{' '}
              <strong className="text-gray-900 dark:text-white">
                {t(`candidate_detail.status_${currentStatusKey}`)}
              </strong>
            </span>
          </div>
        </div>

        {/* Action Buttons Toolbar matching Flow 12 */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCorrectModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-cyan-200 dark:border-cyan-500/30 bg-cyan-50 dark:bg-cyan-500/15 text-cyan-800 dark:text-[#00c4de] hover:bg-cyan-100 text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            <Tag size={15} weight="bold" />
            <span>{t('candidate_detail.btn_correct')}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsRejectModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-400 hover:bg-red-100 text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            <Prohibit size={15} />
            <span>{t('candidate_detail.btn_reject')}</span>
          </button>

          <button
            type="button"
            onClick={() => handleAction('resurvey')}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 hover:bg-amber-100 text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            <ArrowsClockwise size={15} />
            <span>{t('candidate_detail.btn_resurvey')}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsEscalateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-purple-200 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 hover:bg-purple-100 text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            <RocketLaunch size={15} weight="bold" />
            <span>{t('candidate_detail.btn_escalate')}</span>
          </button>

          <button
            type="button"
            onClick={() => handleAction('approve')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#007b8b] hover:bg-[#00606d] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
          >
            <CheckCircle size={15} weight="bold" />
            <span>{t('candidate_detail.btn_approve')}</span>
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-300 text-xs sm:text-sm flex items-center gap-2 animate-in fade-in">
          <ShieldCheck size={18} weight="fill" className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{t(`candidate_detail.${actionNotice.key}`, actionNotice.params)}</span>
        </div>
      )}

      {/* Main Grid: 8 Cols Left (Evidence + Details) + 4 Cols Right (Profile + Logs) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card: Violation & AI Candidate Details */}
          <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-[16px] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText size={20} className="text-[#007b8b] dark:text-[#00c4de]" />
                <span>{t('candidate_detail.sec_ai_telemetry')}</span>
              </h2>
              <span className="font-mono text-xs font-bold text-[#007b8b] dark:text-[#00c4de] bg-[#007b8b]/10 px-2.5 py-1 rounded-lg">
                YOLO12: {candidate.yoloConfidence}% • CLIP: {candidate.clipConfidence}%
              </span>
            </div>

            <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-500/20 rounded-xl p-4">
              <p className="text-xs font-bold text-red-900 dark:text-red-300 mb-1">
                {t('candidate_detail.flag_reason_title')}
              </p>
              <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed">
                {t('candidate_detail.flag_reason_desc')}
              </p>
            </div>

            {/* Candidate Telemetry Attributes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-[#F8F7F7] dark:bg-white/5 border border-gray-100 dark:border-white/10 space-y-1">
                <span className="text-gray-400 font-mono text-[11px] uppercase">{t('candidate_detail.lbl_predicted_label')}</span>
                <p className="font-bold text-gray-900 dark:text-white font-mono text-xs truncate">
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
                <span className="text-gray-400 font-mono text-[11px] uppercase">{t('candidate_detail.lbl_heading')}</span>
                <p className="font-bold text-[#007b8b] dark:text-[#00c4de] font-mono text-xs flex items-center gap-1">
                  <NavigationArrow size={14} className="rotate-180" weight="bold" />
                  <span>{t('candidate_detail.direction_south')}</span>
                </p>
              </div>
            </div>

            {/* Community Reviewer Consensus Votes */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  {t('candidate_detail.lbl_consensus_ratio')}
                </span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  Consensus Score: 0.00 (Conflict)
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-3 flex overflow-hidden">
                <div className="bg-emerald-500 h-full text-[9px] text-white flex items-center justify-center font-bold" style={{ width: '50%' }}>
                  {candidate.consensusApprove} Approve
                </div>
                <div className="bg-red-500 h-full text-[9px] text-white flex items-center justify-center font-bold" style={{ width: '50%' }}>
                  {candidate.consensusReject} Reject
                </div>
              </div>
            </div>
          </div>

          {/* Card: Split Evidence View (Crop vs Full Frame) */}
          <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-[16px] p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileImage size={20} className="text-[#007b8b] dark:text-[#00c4de]" />
              <span>{t('candidate_detail.sec_evidence')}</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Crop Asset */}
              <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 group">
                <div className="aspect-video bg-gray-100 dark:bg-black relative flex items-center justify-center">
                  <img
                    src={candidate.cropImageUrl}
                    alt="Crop Asset"
                    className="max-h-full object-contain p-2"
                  />
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/75 text-white text-[10px] font-mono">
                    {t('candidate_detail.img_crop_desc')}
                  </span>
                </div>
                <div className="p-3 bg-[#F8F7F7] dark:bg-white/5 flex items-center justify-between text-xs font-mono">
                  <span className="text-gray-600 dark:text-gray-300">{candidate.cropFileName}</span>
                  <a
                    href={candidate.cropImageHdUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#007b8b] dark:text-[#00c4de] hover:underline inline-flex items-center gap-1 font-semibold"
                  >
                    {t('candidate_detail.btn_view_full')} <ArrowSquareOut size={12} />
                  </a>
                </div>
              </div>

              {/* Context Frame */}
              <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 group">
                <div className="aspect-video bg-gray-100 dark:bg-black relative">
                  <img
                    src={candidate.contextImageUrl}
                    alt="Dashcam Context"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/75 text-white text-[10px] font-mono">
                    {t('candidate_detail.img_dashcam_desc')}
                  </span>
                </div>
                <div className="p-3 bg-[#F8F7F7] dark:bg-white/5 flex items-center justify-between text-xs font-mono">
                  <span className="text-gray-600 dark:text-gray-300">{candidate.contextFileName}</span>
                  <a
                    href={candidate.contextImageHdUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#007b8b] dark:text-[#00c4de] hover:underline inline-flex items-center gap-1 font-semibold"
                  >
                    {t('candidate_detail.btn_view_full')} <ArrowSquareOut size={12} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* User Profile Card */}
          <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-[16px] p-6 shadow-xs">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider font-mono mb-4 flex items-center gap-2">
              <User size={18} className="text-[#007b8b] dark:text-[#00c4de]" />
              <span>{t('candidate_detail.lbl_surveyor')}</span>
            </h2>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#dcfce7] text-[#15803d] font-bold text-base flex items-center justify-center">
                {candidate.surveyor.initials}
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white text-sm">{candidate.surveyor.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{t(`candidate_detail.${candidate.surveyor.levelKey}`)}</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs border-t border-gray-100 dark:border-white/10 pt-3">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('candidate_detail.lbl_trust_score')}</span>
                <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">{candidate.surveyor.trustScore}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('candidate_detail.lbl_total_runs')}</span>
                <span className="font-bold font-mono text-gray-900 dark:text-white">{t('candidate_detail.lbl_runs_unit', { count: candidate.surveyor.totalRuns })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('candidate_detail.lbl_accuracy_rate')}</span>
                <span className="font-bold font-mono text-gray-900 dark:text-white">{candidate.surveyor.accuracyRate}%</span>
              </div>
            </div>
          </div>

          {/* Audit History Log */}
          <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-[16px] p-6 shadow-xs">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider font-mono mb-4 flex items-center gap-2">
              <ClockCounterClockwise size={18} className="text-[#007b8b] dark:text-[#00c4de]" />
              <span>{t('candidate_detail.lbl_audit_log')}</span>
            </h2>

            <div className="space-y-3.5 text-xs">
              {candidate.auditLogs.map((log) => (
                <div key={log.id} className="border-l-2 border-[#007b8b] dark:border-[#00c4de] pl-3 py-0.5">
                  <p className="font-bold text-gray-900 dark:text-white">{t(`candidate_detail.${log.logKey}`)}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-[11px]">{log.actor} • {log.time === 'log_now' ? t('candidate_detail.log_now') : log.time}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── MODAL: Sửa Nhãn Biển Báo ────────────────────────────────── */}
      {isCorrectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
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

            <div className="relative">
              <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t('catalog.search_placeholder')}
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-[#00c4de]"
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {filteredSigns.map((s) => {
                const labelStr = s.codeTitle
                const isSelected = selectedLabel === labelStr
                return (
                  <div
                    key={s.code}
                    onClick={() => setSelectedLabel(labelStr)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-[#007b8b]/10 border-[#007b8b] text-[#007b8b] dark:text-[#00c4de] dark:border-[#00c4de] font-bold'
                        : 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <div>
                      <span className="font-mono font-bold">{s.code}</span> - {s.codeTitle.split(' - ')[1] || s.codeTitle}
                      <span className="text-[10px] text-gray-400 block font-normal">{t(`catalog.${s.nameKey}`)}</span>
                    </div>
                    {isSelected && <Check size={16} weight="bold" />}
                  </div>
                )
              })}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCorrectModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
              >
                {t('candidate_detail.btn_cancel')}
              </button>
              <button
                type="button"
                onClick={() => handleAction('correct')}
                className="px-4 py-2 bg-[#007b8b] hover:bg-[#00606d] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
              >
                {t('candidate_detail.btn_save_label')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Từ chối Ứng viên ──────────────────────────────────── */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/15 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/10 pb-3">
              <h3 className="font-bold text-red-600 dark:text-red-400 text-base flex items-center gap-2">
                <Prohibit size={18} />
                <span>{t('candidate_detail.modal_reject_title')}</span>
              </h3>
              <button onClick={() => setIsRejectModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-500 font-mono uppercase text-[11px] mb-1">{t('candidate_detail.lbl_reject_reason')}</label>
                <CustomSelect
                  value={rejectReasonKey}
                  onChange={(val) => setRejectReasonKey(val as RejectReasonKey)}
                  className="w-full"
                  buttonClassName="w-full bg-gray-50 dark:bg-black/40"
                  options={[
                    {
                      value: 'reason_blur',
                      label: t('candidate_detail.reason_blur'),
                    },
                    {
                      value: 'reason_not_sign',
                      label: t('candidate_detail.reason_not_sign'),
                    },
                    {
                      value: 'reason_gps_offset',
                      label: t('candidate_detail.reason_gps_offset'),
                    },
                    {
                      value: 'reason_spoofing',
                      label: t('candidate_detail.reason_spoofing'),
                    },
                    {
                      value: 'reason_duplicate',
                      label: t('candidate_detail.reason_duplicate'),
                    },
                  ]}
                />
              </div>

              <div>
                <label className="block text-gray-500 font-mono uppercase text-[11px] mb-1">{t('candidate_detail.lbl_reject_note')}</label>
                <textarea
                  rows={3}
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  placeholder={t('candidate_detail.lbl_reject_note')}
                  className="w-full p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
              >
                {t('candidate_detail.btn_cancel')}
              </button>
              <button
                type="button"
                onClick={() => handleAction('reject')}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
              >
                {t('candidate_detail.btn_confirm_reject')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Chuyển tiếp Admin ───────────────────────────────── */}
      {isEscalateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
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
                <label className="block text-gray-500 font-mono uppercase text-[11px] mb-1">{t('candidate_detail.lbl_staff_opinion')}</label>
                <textarea
                  rows={3}
                  value={escalateNote}
                  onChange={(e) => setEscalateNote(e.target.value)}
                  placeholder={t('candidate_detail.lbl_staff_opinion')}
                  className="w-full p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEscalateModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
              >
                {t('candidate_detail.btn_cancel')}
              </button>
              <button
                type="button"
                onClick={() => handleAction('escalate')}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
              >
                {t('candidate_detail.btn_escalate_now')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
