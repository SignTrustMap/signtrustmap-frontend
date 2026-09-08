import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  CheckCircle,
  Coins,
  Sparkle,
  ArrowRight,
  PlusCircle,
  ClockCounterClockwise,
  ArrowSquareOut,
  SlidersHorizontal,
  WarningCircle,
  Check,
} from '@phosphor-icons/react'
import { useTheme } from '@/context/ThemeContext'
import { useTranslation } from 'react-i18next'
import {
  mockReviewerMetrics,
  mockReviewCandidates,
  mockRevalidationCandidates,
  mockReviewSessionHistory,
  type ReviewHistoryItem,
} from '@/data'
import { NewSignTypeModal } from '@/components/survey/NewSignTypeModal'
import { ReviewHistoryDrawer } from '@/components/review/ReviewHistoryDrawer'

export function ReviewerHubPage() {
  const { t } = useTranslation('common')
  const { isDark } = useTheme()

  const [stats] = useState(mockReviewerMetrics)
  const [showNewSignModal, setShowNewSignModal] = useState(false)
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false)
  const [historyItems, setHistoryItems] = useState<ReviewHistoryItem[]>(mockReviewSessionHistory)

  const pendingCandidateCount = mockReviewCandidates.filter((c) => c.status === 'Pending').length
  const urgentCandidateCount = mockReviewCandidates.filter(
    (c) => c.status === 'Pending' && c.confidence >= 0.4 && c.confidence <= 0.75
  ).length
  const pendingRevalCount = mockRevalidationCandidates.length

  const handleUndoHistoryItem = (itemOrId: ReviewHistoryItem | string) => {
    const id = typeof itemOrId === 'string' ? itemOrId : itemOrId.id
    setHistoryItems((prev) => prev.filter((item) => item.id !== id))
  }

  const getActionBadgeClass = (action: string) => {
    if (action === 'Approved' || action === 'Confirmed') {
      return 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
    }
    if (action === 'Rejected' || action === 'Retired') {
      return 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30'
    }
    if (action === 'Corrected' || action === 'Updated') {
      return 'bg-cyan-50 text-cyan-800 border-cyan-300 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/30'
    }
    return 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30'
  }

  return (
    <div
      className={`min-h-[calc(100vh-80px)] py-8 transition-colors ${
        isDark ? 'bg-[#030708] text-gray-100' : 'bg-[#F8F7F7] text-gray-900'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        {/* ─── 1. Page Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-white/10 text-left">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                  isDark
                    ? 'bg-[#00c4de]/15 border-[#00c4de]/30 text-[#00c4de]'
                    : 'bg-teal-50 border-teal-200 text-[#007b8b]'
                }`}
              >
                <Sparkle size={14} weight="fill" />
                <span>SignTrustMap Reviewer • QCVN 41:2019</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              {t('reviewer.hub_title')}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">
              {t('reviewer.hub_subtitle')}
            </p>
          </div>

          {/* Quick Header Actions (Removed Standard Catalog button per user instruction) */}
          <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => setShowNewSignModal(true)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs active:scale-[0.98] ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 text-gray-200 border-white/15'
                  : 'bg-white hover:bg-gray-50 text-gray-800 border-gray-200'
              }`}
            >
              <PlusCircle size={17} weight="bold" className="text-[#007b8b] dark:text-[#00c4de]" />
              <span>{t('reviewer.btn_report_new')}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowHistoryDrawer(true)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs active:scale-[0.98] ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 text-gray-200 border-white/15'
                  : 'bg-white hover:bg-gray-50 text-gray-800 border-gray-200'
              }`}
            >
              <ClockCounterClockwise size={17} weight="bold" className="text-amber-500 dark:text-amber-400" />
              <span>{t('reviewer.btn_open_history')}</span>
              {historyItems.length > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#007b8b]/15 text-[#007b8b] dark:text-[#00c4de]">
                  {historyItems.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ─── 2. Top Stats Strip ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Reliability Score */}
          <div
            className={`p-5 rounded-2xl border transition-all text-left group hover:border-emerald-500/40 ${
              isDark
                ? 'bg-[#071317] border-white/10 shadow-md shadow-black/40'
                : 'bg-white border-[#E8E4E3] shadow-xs hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('reviewer.stats_reliability')}
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ShieldCheck size={18} weight="bold" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-gray-900 dark:text-white font-mono tracking-tight">
                {stats.reliabilityScore}
              </span>
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">/ 1.00</span>
            </div>
          </div>

          {/* Card 2: Consensus Accuracy */}
          <div
            className={`p-5 rounded-2xl border transition-all text-left group hover:border-[#007b8b]/40 dark:hover:border-[#00c4de]/40 ${
              isDark
                ? 'bg-[#071317] border-white/10 shadow-md shadow-black/40'
                : 'bg-white border-[#E8E4E3] shadow-xs hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('reviewer.stats_accuracy')}
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#007b8b]/10 dark:bg-[#00c4de]/10 text-[#007b8b] dark:text-[#00c4de] flex items-center justify-center">
                <CheckCircle size={18} weight="bold" />
              </div>
            </div>
            <div className="text-3xl font-black text-gray-900 dark:text-white font-mono tracking-tight">
              {stats.consensusAccuracy}%
            </div>
          </div>

          {/* Card 3: Total Validated */}
          <div
            className={`p-5 rounded-2xl border transition-all text-left group hover:border-purple-500/40 ${
              isDark
                ? 'bg-[#071317] border-white/10 shadow-md shadow-black/40'
                : 'bg-white border-[#E8E4E3] shadow-xs hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('reviewer.stats_total')}
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <SlidersHorizontal size={18} weight="bold" />
              </div>
            </div>
            <div className="text-3xl font-black text-gray-900 dark:text-white font-mono tracking-tight">
              {stats.totalReviewed}
            </div>
          </div>

          {/* Card 4: Reviewer Rewards */}
          <div
            className={`p-5 rounded-2xl border transition-all text-left group hover:border-amber-500/40 ${
              isDark
                ? 'bg-[#071317] border-white/10 shadow-md shadow-black/40'
                : 'bg-white border-[#E8E4E3] shadow-xs hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('reviewer.stats_rewards')}
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Coins size={18} weight="bold" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-gray-900 dark:text-white font-mono tracking-tight">
                +{stats.creditsEarned}
              </span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Credits</span>
            </div>
          </div>
        </div>

        {/* ─── 3. Two Dedicated Queue Cards (Hub & Spoke Action Cards) ─────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          {/* Queue Card 1: New AI Candidate Review */}
          <div
            className={`rounded-2xl border p-6 sm:p-8 flex flex-col justify-between space-y-6 relative overflow-hidden group transition-all ${
              isDark
                ? 'bg-[#071317] border-white/10 hover:border-[#00c4de]/50 shadow-lg shadow-black/40'
                : 'bg-white border-[#E8E4E3] hover:border-[#007b8b]/40 shadow-xs hover:shadow-md'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#007b8b]/15 text-[#007b8b] dark:text-[#00c4de] border border-[#007b8b]/25">
                  <Sparkle size={13} weight="fill" />
                  <span>{t('reviewer.queue_candidate_badge')}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20">
                  <Coins size={13} weight="bold" />
                  <span>{t('reviewer.queue_candidate_reward')}</span>
                </span>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight group-hover:text-[#007b8b] dark:group-hover:text-[#00c4de] transition-colors">
                  {t('reviewer.queue_candidate_title')}
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {t('reviewer.queue_candidate_desc')}
                </p>
              </div>

              {/* Queue Status Callout */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50/80 border-gray-200'
                }`}
              >
                <div className="space-y-1">
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-semibold block">
                    {t('reviewer.queue_candidate_count', { count: pendingCandidateCount })}
                  </span>
                  {urgentCandidateCount > 0 && (
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                      <WarningCircle size={14} weight="bold" />
                      <span>{t('reviewer.queue_candidate_urgent', { count: urgentCandidateCount })}</span>
                    </span>
                  )}
                </div>
                <div className="w-11 h-11 rounded-xl bg-[#007b8b]/10 dark:bg-[#00c4de]/15 text-[#007b8b] dark:text-[#00c4de] flex items-center justify-center font-black text-xl font-mono border border-[#007b8b]/20 dark:border-[#00c4de]/30">
                  {pendingCandidateCount}
                </div>
              </div>
            </div>

            <Link
              to="/review/candidate"
              className={`w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-black text-sm transition-all shadow-md active:scale-[0.99] cursor-pointer ${
                isDark
                  ? 'bg-[#00c4de] hover:bg-[#00d8f5] text-black shadow-[#00c4de]/20'
                  : 'bg-[#007b8b] hover:bg-[#006977] text-white shadow-[#007b8b]/20'
              }`}
            >
              <span>{t('reviewer.btn_enter_candidate')}</span>
              <ArrowRight size={18} weight="bold" />
            </Link>
          </div>

          {/* Queue Card 2: Field Revalidation Review */}
          <div
            className={`rounded-2xl border p-6 sm:p-8 flex flex-col justify-between space-y-6 relative overflow-hidden group transition-all ${
              isDark
                ? 'bg-[#071317] border-white/10 hover:border-emerald-400/50 shadow-lg shadow-black/40'
                : 'bg-white border-[#E8E4E3] hover:border-emerald-500/40 shadow-xs hover:shadow-md'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border border-emerald-500/25">
                  <ClockCounterClockwise size={13} weight="bold" />
                  <span>{t('reviewer.queue_reval_badge')}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20">
                  <Coins size={13} weight="bold" />
                  <span>{t('reviewer.queue_reval_reward')}</span>
                </span>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {t('reviewer.queue_reval_title')}
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {t('reviewer.queue_reval_desc')}
                </p>
              </div>

              {/* Queue Status Callout */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50/80 border-gray-200'
                }`}
              >
                <div className="space-y-1">
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-semibold block">
                    {t('reviewer.queue_reval_count', { count: pendingRevalCount })}
                  </span>
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <Check size={14} weight="bold" />
                    <span>QCVN 41:2019 / BGTVT</span>
                  </span>
                </div>
                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-black text-xl font-mono border border-emerald-500/20 dark:border-emerald-500/30">
                  {pendingRevalCount}
                </div>
              </div>
            </div>

            <Link
              to="/review/revalidate"
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-black text-sm transition-all shadow-md active:scale-[0.99] cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
            >
              <span>{t('reviewer.btn_enter_reval')}</span>
              <ArrowRight size={18} weight="bold" />
            </Link>
          </div>
        </div>

        {/* ─── 4. Recent Session History Activity ─────────────────────────────── */}
        <div
          className={`rounded-2xl border p-6 text-left space-y-4 ${
            isDark
              ? 'bg-[#071317] border-white/10 shadow-lg shadow-black/40'
              : 'bg-white border-[#E8E4E3] shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-white/10">
            <div className="flex items-center gap-2">
              <ClockCounterClockwise size={18} className="text-[#007b8b] dark:text-[#00c4de]" weight="bold" />
              <h3 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white">
                {t('reviewer.recent_activity_title')}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowHistoryDrawer(true)}
              className="text-xs font-bold text-[#007b8b] dark:text-[#00c4de] hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>{t('reviewer.btn_open_history')}</span>
              <ArrowSquareOut size={14} />
            </button>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-white/5">
            {historyItems.map((item) => {
              const badgeClass = getActionBadgeClass(item.action)
              return (
                <div key={item.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono font-black px-2.5 py-1 rounded-md bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white shrink-0 text-xs border border-gray-200 dark:border-white/10">
                      {item.signCode}
                    </span>
                    <div className="truncate">
                      <p className="font-bold text-gray-900 dark:text-white truncate text-xs sm:text-sm">
                        {item.signName}
                      </p>
                      {item.details && (
                        <p className="text-[11px] text-gray-600 dark:text-gray-400 truncate">
                          {item.details}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badgeClass}`}>
                      {item.action}
                    </span>
                    <span className="text-[11px] font-mono text-gray-500 dark:text-gray-400 hidden sm:inline">
                      {item.timestamp}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUndoHistoryItem(item.id)}
                      className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline cursor-pointer px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      {t('reviewer.btn_undo')}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Modals & Drawers */}
      <NewSignTypeModal
        isOpen={showNewSignModal}
        onClose={() => setShowNewSignModal(false)}
      />

      <ReviewHistoryDrawer
        isOpen={showHistoryDrawer}
        onClose={() => setShowHistoryDrawer(false)}
        historyItems={historyItems}
        onUndo={(item) => handleUndoHistoryItem(item)}
      />
    </div>
  )
}
