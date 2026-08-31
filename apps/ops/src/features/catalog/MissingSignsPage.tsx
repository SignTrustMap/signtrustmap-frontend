import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import CustomSelect from '@/components/common/CustomSelect'
import {
  Question,
  CheckCircle,
  X,
  MagnifyingGlass,
  Check,
  RocketLaunch,
  Prohibit,
  ArrowsMerge,
  MapPin,
  User,
} from '@phosphor-icons/react'
import { mockMissingSignTypeReports, availableCatalogSigns, type MissingSignTypeReport } from '@/data'

type MissingRejectReasonKey = 'reason_not_sign' | 'reason_blurred' | 'reason_duplicate'

export default function MissingSignsPage() {
  const { t } = useTranslation('ops')

  const [reports, setReports] = useState<MissingSignTypeReport[]>(mockMissingSignTypeReports)
  const [selectedReport, setSelectedReport] = useState<MissingSignTypeReport | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  
  // Modals
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false)
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false)
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  
  const [selectedCatalogCode, setSelectedCatalogCode] = useState('P.102')
  const [catalogSearch, setCatalogSearch] = useState('')
  const [escalateNote, setEscalateNote] = useState('')
  const [rejectReasonKey, setRejectReasonKey] = useState<MissingRejectReasonKey>('reason_not_sign')
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const filteredCatalogSigns = availableCatalogSigns.filter(
    (s) =>
      s.code.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      s.codeTitle.toLowerCase().includes(catalogSearch.toLowerCase())
  )

  function showToast(msg: string) {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3000)
  }

  function handleMergeSubmit() {
    if (!selectedReport) return
    setReports((prev) =>
      prev.map((r) =>
        r.id === selectedReport.id ? { ...r, status: 'Approved', tempLabel: `${t('missing_signs.label_merged_prefix')} ${selectedCatalogCode}` } : r
      )
    )
    showToast(t('missing_signs.toast_merged', { id: selectedReport.id, code: selectedCatalogCode }))
    setIsMergeModalOpen(false)
    setSelectedReport(null)
  }

  function handleEscalateSubmit() {
    if (!selectedReport) return
    setReports((prev) =>
      prev.map((r) =>
        r.id === selectedReport.id ? { ...r, status: 'Approved', tempLabel: `${t('missing_signs.label_pending_admin')} ${r.tempLabel}` } : r
      )
    )
    showToast(t('missing_signs.toast_escalated', { id: selectedReport.id }))
    setIsEscalateModalOpen(false)
    setSelectedReport(null)
  }

  function handleRejectSubmit() {
    if (!selectedReport) return
    setReports((prev) =>
      prev.map((r) =>
        r.id === selectedReport.id ? { ...r, status: 'Approved', tempLabel: `${t('missing_signs.label_rejected')} ${r.tempLabel}` } : r
      )
    )
    showToast(t('missing_signs.toast_rejected', { id: selectedReport.id, reason: t(`missing_signs.${rejectReasonKey}`) }))
    setIsRejectModalOpen(false)
    setSelectedReport(null)
  }

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.tempLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reporterNote.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reportedBy.toLowerCase().includes(searchQuery.toLowerCase())
    if (statusFilter === 'all') return matchesSearch
    return matchesSearch && r.status === statusFilter
  })

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#007b8b] dark:text-[#00c4de] uppercase tracking-wider mb-1">
            <Question size={16} weight="bold" />
            <span>{t('missing_signs.tag')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {t('missing_signs.title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('missing_signs.subtitle')}
          </p>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-300 text-xs sm:text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle size={18} weight="fill" className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-4 shadow-xs">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-white/5 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white dark:bg-[#061115] text-gray-900 dark:text-white shadow-xs font-bold'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t('missing_signs.tab_all')} ({reports.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('Open')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              statusFilter === 'Open'
                ? 'bg-white dark:bg-[#061115] text-amber-600 dark:text-amber-400 shadow-xs font-bold'
                : 'text-gray-500 hover:text-amber-600 dark:hover:text-amber-400'
            }`}
          >
            {t('missing_signs.tab_open')} ({reports.filter((r) => r.status === 'Open').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('Approved')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              statusFilter === 'Approved'
                ? 'bg-white dark:bg-[#061115] text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                : 'text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400'
            }`}
          >
            {t('missing_signs.tab_processed')} ({reports.filter((r) => r.status === 'Approved').length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('missing_signs.search_placeholder')}
            className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-[#00c4de]"
          />
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReports.map((report) => (
          <div
            key={report.id}
            className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl overflow-hidden shadow-xs hover:border-[#007b8b]/40 dark:hover:border-[#00c4de]/40 transition-all flex flex-col"
          >
            {/* Image Preview with Best Frame Overlay */}
            <div className="relative aspect-video bg-gray-100 dark:bg-black/50 overflow-hidden">
              <img
                src={report.sampleImageUrl}
                alt={report.tempLabel}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-black/75 text-white backdrop-blur-xs">
                  {report.id}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold backdrop-blur-xs ${
                    report.status === 'Open'
                      ? 'bg-amber-500/90 text-white'
                      : 'bg-emerald-600/90 text-white'
                  }`}
                >
                  {report.status === 'Open' ? t('missing_signs.status_open') : t('missing_signs.status_approved')}
                </span>
              </div>
            </div>

            {/* Report Content */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                    {report.tempLabel}
                  </h3>
                  <span className="text-[11px] font-mono text-gray-400">
                    {report.reportedAt}
                  </span>
                </div>

                <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed bg-gray-50 dark:bg-white/5 p-2.5 rounded-xl border border-gray-100 dark:border-white/5">
                  "{report.reporterNote}"
                </p>

                <div className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400 pt-1">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-[#007b8b] dark:text-[#00c4de] shrink-0" />
                    <span className="truncate">{report.lat.toFixed(4)}° N, {report.lng.toFixed(4)}° E</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-gray-400 shrink-0" />
                    <span>{t('missing_signs.lbl_reported_by')} <strong className="text-gray-700 dark:text-gray-200">{report.reportedBy}</strong></span>
                  </div>
                </div>
              </div>

              {/* Triage Decision Flow matching Flow 10 */}
              <div className="pt-3 border-t border-gray-100 dark:border-white/10 flex items-center justify-between gap-1.5">
                {report.status === 'Open' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedReport(report)
                        setIsMergeModalOpen(true)
                      }}
                      className="flex-1 py-1.5 px-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      title={t('missing_signs.btn_merge_catalog')}
                    >
                      <ArrowsMerge size={14} weight="bold" />
                      <span className="hidden sm:inline">{t('missing_signs.btn_merge_catalog')}</span>
                      <span className="sm:hidden">Gộp</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedReport(report)
                        setIsEscalateModalOpen(true)
                      }}
                      className="flex-1 py-1.5 px-2 bg-[#007b8b]/10 hover:bg-[#007b8b]/20 dark:bg-[#00c4de]/15 dark:hover:bg-[#00c4de]/25 text-[#007b8b] dark:text-[#00c4de] border border-[#007b8b]/30 dark:border-[#00c4de]/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      title={t('missing_signs.btn_escalate_admin')}
                    >
                      <RocketLaunch size={14} weight="bold" />
                      <span className="hidden sm:inline">{t('missing_signs.btn_escalate_admin')}</span>
                      <span className="sm:hidden">Admin</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
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
                  <div className="w-full py-1 text-center font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-500/20">
                    {report.tempLabel}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── MODAL: Gộp vào Catalog có sẵn ─────────────────────────── */}
      {isMergeModalOpen && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/15 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/10 pb-3">
              <h3 className="font-bold text-purple-600 dark:text-purple-400 text-base flex items-center gap-2">
                <ArrowsMerge size={18} weight="bold" />
                <span>{t('missing_signs.modal_merge_title')}</span>
              </h3>
              <button onClick={() => setIsMergeModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              {t('missing_signs.modal_merge_desc')}
            </p>

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

            <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
              {filteredCatalogSigns.map((s) => {
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
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
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
      )}

      {/* ─── MODAL: Chuyển tiếp Admin Bổ sung Catalog ───────────────── */}
      {isEscalateModalOpen && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/15 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/10 pb-3">
              <h3 className="font-bold text-[#007b8b] dark:text-[#00c4de] text-base flex items-center gap-2">
                <RocketLaunch size={18} weight="bold" />
                <span>{t('missing_signs.modal_escalate_title')}</span>
              </h3>
              <button onClick={() => setIsEscalateModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
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
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
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
      )}

      {/* ─── MODAL: Từ chối Báo Cáo ──────────────────────────────────── */}
      {isRejectModalOpen && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/15 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/10 pb-3">
              <h3 className="font-bold text-red-600 dark:text-red-400 text-base flex items-center gap-2">
                <Prohibit size={18} />
                <span>{t('missing_signs.modal_reject_title')}</span>
              </h3>
              <button onClick={() => setIsRejectModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
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
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
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
      )}
    </div>
  )
}
