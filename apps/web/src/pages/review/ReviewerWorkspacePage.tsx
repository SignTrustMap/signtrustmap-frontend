import { useState, useEffect, useCallback } from 'react'
import {
  CheckCircle,
  XCircle,
  PencilSimple,
  Flag,
  MapPin,
  Sparkle,
  Coins,
  ShieldCheck,
  Eye,
  MagnifyingGlass,
  ArrowRight,
  ArrowLeft,
  BookOpen,
} from '@phosphor-icons/react'
import { useTheme } from '@/context/ThemeContext'
import { useTranslation } from 'react-i18next'
import {
  mockReviewCandidates,
  mockReviewerMetrics,
  mockTrafficCatalog,
  type CandidateToReview,
} from '@/data'
import { Modal } from '@/components/common/Modal'

export default function ReviewerWorkspacePage() {
  const { isDark } = useTheme()
  const { t } = useTranslation('common')

  const [candidates, setCandidates] = useState<CandidateToReview[]>(mockReviewCandidates)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [activeView, setActiveView] = useState<'crop' | 'context'>('crop')
  const [showCatalogModal, setShowCatalogModal] = useState(false)
  const [catalogSearch, setCatalogSearch] = useState('')
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'reject' | 'flag' } | null>(null)
  const [stats, setStats] = useState(mockReviewerMetrics)

  const currentCandidate = candidates[currentIndex] || null

  const showToast = (text: string, type: 'success' | 'reject' | 'flag') => {
    setToastMessage({ text, type })
    setTimeout(() => setToastMessage(null), 2500)
  }

  const handleDecision = useCallback(
    (action: 'approve' | 'reject' | 'flag', correctedCode?: string) => {
      if (!currentCandidate) return

      const candidateId = currentCandidate.id
      setCandidates((prev) =>
        prev.map((c) =>
          c.id === candidateId
            ? {
                ...c,
                status: action === 'approve' ? 'Approved' : action === 'reject' ? 'Rejected' : 'Flagged',
                code: correctedCode || c.code,
              }
            : c
        )
      )

      if (action === 'approve') {
        showToast(
          correctedCode
            ? `${t('reviewer.toast_corrected')} ${correctedCode}`
            : `${t('reviewer.toast_approved')} ${currentCandidate.code}`,
          'success'
        )
        setStats((s) => ({
          ...s,
          totalReviewed: s.totalReviewed + 1,
          approvedCount: s.approvedCount + 1,
          creditsEarned: s.creditsEarned + 5,
        }))
      } else if (action === 'reject') {
        showToast(`${t('reviewer.toast_rejected')} ${candidateId}`, 'reject')
        setStats((s) => ({
          ...s,
          totalReviewed: s.totalReviewed + 1,
          rejectedCount: s.rejectedCount + 1,
          creditsEarned: s.creditsEarned + 5,
        }))
      } else {
        showToast(`${t('reviewer.toast_flagged')} ${candidateId}`, 'flag')
        setStats((s) => ({
          ...s,
          totalReviewed: s.totalReviewed + 1,
        }))
      }

      if (currentIndex < candidates.length - 1) {
        setCurrentIndex((i) => i + 1)
      }
    },
    [currentCandidate, currentIndex, candidates.length, t]
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showCatalogModal || !currentCandidate) return
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if (e.key === 'a' || e.key === 'A') {
        handleDecision('approve')
      } else if (e.key === 'r' || e.key === 'R') {
        handleDecision('reject')
      } else if (e.key === 'c' || e.key === 'C') {
        setShowCatalogModal(true)
      } else if (e.key === 'f' || e.key === 'F') {
        handleDecision('flag')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleDecision, showCatalogModal, currentCandidate])

  const filteredCatalog = mockTrafficCatalog.filter(
    (sign) =>
      sign.code.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      sign.nameVi.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      sign.nameEn.toLowerCase().includes(catalogSearch.toLowerCase())
  )

  return (
    <div
      className={`min-h-screen pt-6 sm:pt-8 pb-16 px-4 sm:px-6 lg:px-8 transition-colors ${
        isDark ? 'bg-[#030708] text-white' : 'bg-[#F8F7F7] text-gray-900'
      }`}
    >
      <div className="max-w-6xl mx-auto">
        {/* Top Reliability Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className={`p-5 sm:p-6 rounded-2xl border ${isDark ? 'bg-[#061417]/90 border-white/10' : 'bg-white border-gray-200 shadow-xs'}`}>
            <span className="text-xs font-mono font-bold uppercase text-gray-400 block mb-1.5 flex items-center gap-1.5 tracking-wider">
              <ShieldCheck size={16} className="text-emerald-400" />
              <span>{t('reviewer.stats_reliability')}</span>
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400">{stats.reliabilityScore} / 1.00</span>
          </div>

          <div className={`p-5 sm:p-6 rounded-2xl border ${isDark ? 'bg-[#061417]/90 border-white/10' : 'bg-white border-gray-200 shadow-xs'}`}>
            <span className="text-xs font-mono font-bold uppercase text-gray-400 block mb-1.5 tracking-wider">{t('reviewer.stats_accuracy')}</span>
            <span className="text-2xl sm:text-3xl font-black text-cyan-400">{stats.accuracyPercent}%</span>
          </div>

          <div className={`p-5 sm:p-6 rounded-2xl border ${isDark ? 'bg-[#061417]/90 border-white/10' : 'bg-white border-gray-200 shadow-xs'}`}>
            <span className="text-xs font-mono font-bold uppercase text-gray-400 block mb-1.5 tracking-wider">{t('reviewer.stats_total')}</span>
            <span className="text-2xl sm:text-3xl font-black text-purple-400">{stats.totalReviewed}</span>
          </div>

          <div className={`p-5 sm:p-6 rounded-2xl border ${isDark ? 'bg-[#061417]/90 border-white/10' : 'bg-white border-gray-200 shadow-xs'}`}>
            <span className="text-xs font-mono font-bold uppercase text-gray-400 block mb-1.5 flex items-center gap-1.5 tracking-wider">
              <Coins size={16} className="text-amber-400" />
              <span>{t('reviewer.stats_rewards')}</span>
            </span>
            <span className="text-2xl sm:text-3xl font-black text-amber-400">+{stats.creditsEarned} Credits</span>
          </div>
        </div>

        {/* Workspace Card */}
        {currentCandidate ? (
          <div className={`rounded-[28px] border shadow-2xl overflow-hidden ${
            isDark ? 'bg-[#061417]/95 border-white/10' : 'bg-white border-gray-200'
          }`}>
            <div className={`px-6 sm:px-8 py-5 border-b flex items-center justify-between flex-wrap gap-3 ${
              isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-100 bg-gray-50/50'
            }`}>
              <div className="flex items-center gap-3">
                <span className="px-4 py-1.5 rounded-xl text-sm font-mono font-bold bg-[#00c4de]/15 text-[#00c4de] border border-[#00c4de]/30">
                  {currentCandidate.id}
                </span>
                <span className="text-xs sm:text-sm text-gray-400">
                  {t('reviewer.trip_ref')}: <strong className="text-gray-200 font-semibold">{currentCandidate.sourceTripId}</strong> (YOLO Track #{currentCandidate.yoloTrackId})
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm font-mono font-bold">
                <span className="text-gray-400">{t('reviewer.candidate_counter')}</span>
                <span className="text-[#00c4de]">{currentIndex + 1}</span>
                <span className="text-gray-500">/ {candidates.length}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-10">
              <div className="lg:col-span-7 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className={`flex rounded-2xl p-1.5 border text-xs sm:text-sm font-bold ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'}`}>
                    <button
                      type="button"
                      onClick={() => setActiveView('crop')}
                      className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                        activeView === 'crop'
                          ? isDark ? 'bg-[#00c4de] text-black shadow-xs' : 'bg-[#007b8b] text-white shadow-xs'
                          : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      {t('reviewer.btn_view_crop')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveView('context')}
                      className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                        activeView === 'context'
                          ? isDark ? 'bg-[#00c4de] text-black shadow-xs' : 'bg-[#007b8b] text-white shadow-xs'
                          : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      {t('reviewer.btn_view_context')}
                    </button>
                  </div>

                  <span className="text-xs sm:text-sm font-mono text-gray-400">
                    {t('reviewer.est_distance')}: <strong className="text-cyan-400">{currentCandidate.estimatedDistanceMeters}m</strong>
                  </span>
                </div>

                <div className={`relative h-[360px] sm:h-[440px] rounded-[24px] overflow-hidden border flex items-center justify-center ${
                  isDark ? 'bg-black/60 border-white/10' : 'bg-gray-100 border-gray-300'
                }`}>
                  <img
                    src={activeView === 'crop' ? currentCandidate.cropImageUrl : currentCandidate.contextImageUrl}
                    alt={currentCandidate.suggestedName}
                    className="w-full h-full object-contain"
                  />

                  <div className="absolute top-4 left-4 px-3.5 py-1.5 rounded-xl bg-black/70 backdrop-blur-md text-white text-xs font-mono flex items-center gap-2 border border-white/20">
                    <Eye size={16} className="text-cyan-400" />
                    <span>{activeView === 'crop' ? t('reviewer.badge_crop') : t('reviewer.badge_context')}</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                <div className={`p-6 rounded-[24px] border ${
                  isDark ? 'bg-white/[0.03] border-white/10' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono uppercase font-bold text-gray-400 flex items-center gap-1.5 tracking-wider">
                      <Sparkle size={14} className="text-amber-400" />
                      <span>{t('reviewer.ai_prediction')}</span>
                    </span>
                    <span className="text-sm font-mono font-black text-emerald-400">
                      {(currentCandidate.confidence * 100).toFixed(1)}% {t('reviewer.confidence')}
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-extrabold">{currentCandidate.suggestedName}</h3>
                  <span className="inline-block mt-2 px-3 py-1 rounded-lg text-sm font-mono font-bold bg-[#00c4de]/15 text-[#00c4de] border border-[#00c4de]/30">
                    {currentCandidate.code}
                  </span>

                  <div className="mt-5 pt-5 border-t border-white/10 space-y-3 text-sm">
                    <div className="flex items-center justify-between text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <MapPin size={16} className="text-red-400" />
                        {t('reviewer.lbl_road')}
                      </span>
                      <span className="font-bold text-gray-200 text-right truncate max-w-[220px]">
                        {currentCandidate.roadName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-gray-400">
                      <span>{t('reviewer.lbl_coords')}</span>
                      <span className="font-mono text-gray-200 font-semibold">
                        {currentCandidate.lat.toFixed(5)}, {currentCandidate.lng.toFixed(5)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-gray-400">
                      <span>{t('reviewer.lbl_heading')}</span>
                      <span className="font-mono text-gray-200 font-semibold">
                        {currentCandidate.directionHeading}° ({currentCandidate.trafficFlowDirection})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleDecision('approve')}
                      className="py-3.5 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                    >
                      <CheckCircle size={20} />
                      <span>{t('reviewer.btn_approve')}</span>
                      <kbd className="px-2 py-0.5 rounded bg-black/20 text-xs font-mono">A</kbd>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDecision('reject')}
                      className="py-3.5 px-5 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 active:scale-95 transition-all cursor-pointer"
                    >
                      <XCircle size={20} />
                      <span>{t('reviewer.btn_reject')}</span>
                      <kbd className="px-2 py-0.5 rounded bg-black/20 text-xs font-mono">R</kbd>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setShowCatalogModal(true)}
                      className={`py-3 px-4 rounded-2xl border font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        isDark
                          ? 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-200'
                          : 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-800'
                      }`}
                    >
                      <PencilSimple size={18} className="text-cyan-400" />
                      <span>{t('reviewer.btn_correct')}</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-black/20 text-[10px] font-mono">C</kbd>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDecision('flag')}
                      className={`py-3 px-4 rounded-2xl border font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        isDark
                          ? 'bg-white/5 hover:bg-white/10 border-white/10 text-amber-400'
                          : 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-amber-700'
                      }`}
                    >
                      <Flag size={18} />
                      <span>{t('reviewer.btn_flag')}</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-black/20 text-[10px] font-mono">F</kbd>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className={`px-6 sm:px-8 py-4 border-t flex items-center justify-between ${
              isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-100 bg-gray-50/50'
            }`}>
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                className="px-4 py-2 text-xs sm:text-sm font-bold rounded-xl border border-white/10 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft size={16} />
                <span>{t('reviewer.btn_prev')}</span>
              </button>

              <span className="text-xs sm:text-sm font-mono text-gray-400 hidden sm:inline">
                {t('reviewer.hotkey_tip')}
              </span>

              <button
                type="button"
                disabled={currentIndex === candidates.length - 1}
                onClick={() => setCurrentIndex((i) => Math.min(candidates.length - 1, i + 1))}
                className="px-4 py-2 text-xs sm:text-sm font-bold rounded-xl border border-white/10 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
              >
                <span>{t('reviewer.btn_next')}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <CheckCircle size={56} className="text-emerald-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold">{t('reviewer.queue_clear_title')}</h2>
            <p className="text-sm text-gray-400 mt-2">{t('reviewer.queue_clear_desc')}</p>
          </div>
        )}

        {toastMessage && (
          <div className={`fixed bottom-8 right-8 z-50 px-5 py-4 rounded-2xl border shadow-2xl backdrop-blur-md text-sm font-bold flex items-center gap-3 animate-slideUp ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300'
              : toastMessage.type === 'reject'
              ? 'bg-red-950/90 border-red-500/50 text-red-300'
              : 'bg-amber-950/90 border-amber-500/50 text-amber-300'
          }`}>
            <CheckCircle size={18} />
            <span>{toastMessage.text}</span>
          </div>
        )}

        {showCatalogModal && (
          <Modal
            isOpen={showCatalogModal}
            onClose={() => setShowCatalogModal(false)}
            maxWidth="max-w-2xl"
          >
            <div className={`w-full rounded-[28px] border shadow-2xl overflow-hidden ${
              isDark ? 'bg-[#061417] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'
            }`}>
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <BookOpen size={22} className="text-[#00c4de]" />
                  <h3 className="font-bold text-base sm:text-lg">{t('reviewer.modal_catalog_title')}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCatalogModal(false)}
                  className="p-2 rounded-xl text-gray-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-5 border-b border-white/10">
                <div className="relative">
                  <MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder={t('reviewer.modal_search_placeholder')}
                    className={`w-full pl-11 pr-4 py-3 text-sm sm:text-base rounded-2xl border outline-none ${
                      isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-100 border-gray-200 text-gray-900'
                    }`}
                  />
                </div>
              </div>

              <div className="max-h-[400px] overflow-y-auto divide-y divide-white/5 p-3">
                {filteredCatalog.map((sign) => (
                  <button
                    key={sign.code}
                    type="button"
                    onClick={() => {
                      handleDecision('approve', sign.code)
                      setShowCatalogModal(false)
                    }}
                    className={`w-full p-4 rounded-2xl flex items-center justify-between text-left transition-colors cursor-pointer ${
                      isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-sm font-bold text-[#00c4de]">{sign.code}</span>
                        <span className="font-bold text-sm sm:text-base">{sign.nameVi}</span>
                      </div>
                      <span className="text-xs text-gray-400 block mt-1">{sign.nameEn}</span>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-[#00c4de]">{t('reviewer.btn_select_approve')}</span>
                  </button>
                ))}
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  )
}
