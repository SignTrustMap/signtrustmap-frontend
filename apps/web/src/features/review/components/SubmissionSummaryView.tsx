import { useNavigate } from 'react-router-dom'
import {
  Check,
  X,
  Warning,
  PencilSimpleLine,
  ArrowBendUpRight,
  ArrowCounterClockwise,
  House,
  Sparkle,
  ArrowUUpLeft,
  Coins,
} from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { Button } from '@shared/ui'
import type { ReviewHistoryItem } from '@/data'

interface SubmissionSummaryViewProps {
  historyItems: ReviewHistoryItem[]
  isDark: boolean
  onNextBatch?: () => void
  onRecheckSubmission: () => void
  onUndoItem?: (candidateId: string) => void
}

export function SubmissionSummaryView({
  historyItems,
  isDark,
  onNextBatch,
  onRecheckSubmission,
  onUndoItem,
}: SubmissionSummaryViewProps) {
  const { t } = useTranslation('common')
  const navigate = useNavigate()

  const counts = historyItems.reduce(
    (acc, curr) => {
      if (curr.action === 'Approved') acc.approved += 1
      else if (curr.action === 'Rejected') acc.declined += 1
      else if (curr.action === 'Corrected') acc.corrected += 1
      else if (curr.action === 'Flagged') acc.reported += 1
      else acc.skipped += 1
      return acc
    },
    { approved: 0, declined: 0, corrected: 0, reported: 0, skipped: 0 }
  )

  // Estimated credits: Approved (+5), Corrected (+8), Rejected (+3), Flagged (+5)
  const estimatedCredits =
    counts.approved * 5 + counts.corrected * 8 + counts.declined * 3 + counts.reported * 5

  const getActionDetails = (action: string) => {
    switch (action) {
      case 'Approved':
        return {
          label: t('reviewer.action_approved', 'Đã duyệt'),
          summary: t('reviewer.summary_approved_sub', 'Đạt chuẩn và sẵn sàng tích hợp bản đồ tin cậy.'),
          badgeCls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        }
      case 'Corrected':
        return {
          label: t('reviewer.action_corrected', 'Đã sửa mã'),
          summary: t('reviewer.summary_corrected_sub', 'Đã sửa lại mã hiệu đúng theo danh mục chuẩn QCVN 41.'),
          badgeCls: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
        }
      case 'Rejected':
        return {
          label: t('reviewer.action_declined', 'Đã từ chối'),
          summary: t('reviewer.summary_declined_sub', 'Bị từ chối do không đạt quy chuẩn hoặc chất lượng ảnh.'),
          badgeCls: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
        }
      case 'Flagged':
        return {
          label: t('reviewer.action_reported', 'Đã báo cờ'),
          summary: t('reviewer.summary_reported_sub', 'Đã chuyển báo cáo bất thường lên ban quản trị.'),
          badgeCls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
        }
      default:
        return {
          label: t('reviewer.action_skipped', 'Đã bỏ qua'),
          summary: t('reviewer.summary_skipped_sub', 'Tạm thời bỏ qua (chưa xác định được).'),
          badgeCls: 'bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/30',
        }
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#007b8b]/10 dark:bg-[#00c4de]/15 text-[#007b8b] dark:text-[#00c4de] border border-[#007b8b]/20 dark:border-[#00c4de]/30">
          <Sparkle size={13} weight="fill" />
          <span>{t('reviewer.summary_title', 'Tổng kết phiên thẩm định')}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
          {t('reviewer.summary_subtitle', 'Hôm nay • {{count}} biển báo đã được xem xét', {
            count: historyItems.length,
          })}
        </h2>
        {estimatedCredits > 0 && (
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20">
            <Coins size={14} weight="bold" />
            <span>{t('reviewer.summary_reward_est', 'Tích lũy phiên:')} +{estimatedCredits} Credits</span>
          </div>
        )}
      </div>

      {/* 5 Metric Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Approved */}
        <div
          className={`p-3.5 sm:p-4 rounded-2xl border text-center space-y-1 ${
            isDark ? 'bg-[#071317] border-white/10' : 'bg-white border-gray-200 shadow-xs'
          }`}
        >
          <div className="w-8 h-8 rounded-full border border-emerald-500 text-emerald-500 mx-auto flex items-center justify-center font-bold">
            <Check size={16} weight="bold" />
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white font-mono">
            {counts.approved}
          </p>
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            {t('reviewer.summary_metric_approved', 'ĐÃ DUYỆT')}
          </p>
        </div>

        {/* Corrected */}
        <div
          className={`p-3.5 sm:p-4 rounded-2xl border text-center space-y-1 ${
            isDark ? 'bg-[#071317] border-white/10' : 'bg-white border-gray-200 shadow-xs'
          }`}
        >
          <div className="w-8 h-8 rounded-full border border-sky-500 text-sky-500 mx-auto flex items-center justify-center font-bold">
            <PencilSimpleLine size={16} weight="bold" />
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white font-mono">
            {counts.corrected}
          </p>
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
            {t('reviewer.summary_metric_corrected', 'ĐÃ SỬA MÃ')}
          </p>
        </div>

        {/* Declined */}
        <div
          className={`p-3.5 sm:p-4 rounded-2xl border text-center space-y-1 ${
            isDark ? 'bg-[#071317] border-white/10' : 'bg-white border-gray-200 shadow-xs'
          }`}
        >
          <div className="w-8 h-8 rounded-full border border-rose-500 text-rose-500 mx-auto flex items-center justify-center font-bold">
            <X size={16} weight="bold" />
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white font-mono">
            {counts.declined}
          </p>
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            {t('reviewer.summary_metric_declined', 'TỪ CHỐI')}
          </p>
        </div>

        {/* Reported */}
        <div
          className={`p-3.5 sm:p-4 rounded-2xl border text-center space-y-1 ${
            isDark ? 'bg-[#071317] border-white/10' : 'bg-white border-gray-200 shadow-xs'
          }`}
        >
          <div className="w-8 h-8 rounded-full border border-amber-500 text-amber-500 mx-auto flex items-center justify-center font-bold">
            <Warning size={16} weight="bold" />
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white font-mono">
            {counts.reported}
          </p>
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            {t('reviewer.summary_metric_reported', 'BÁO CỜ')}
          </p>
        </div>

        {/* Skipped */}
        <div
          className={`p-3.5 sm:p-4 rounded-2xl border text-center space-y-1 col-span-2 sm:col-span-1 ${
            isDark ? 'bg-[#071317] border-white/10' : 'bg-white border-gray-200 shadow-xs'
          }`}
        >
          <div className="w-8 h-8 rounded-full border border-gray-400 text-gray-400 mx-auto flex items-center justify-center font-bold">
            <ArrowBendUpRight size={16} weight="bold" />
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white font-mono">
            {counts.skipped}
          </p>
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-500">
            {t('reviewer.summary_metric_skipped', 'BỎ QUA')}
          </p>
        </div>
      </div>

      {/* Reviewed Signs List */}
      <div
        className={`rounded-2xl border overflow-hidden ${
          isDark ? 'bg-[#071317] border-white/10' : 'bg-white border-gray-200 shadow-xs'
        }`}
      >
        <div className="p-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white">
            {t('reviewer.summary_list_title', 'Chi tiết đánh giá trong phiên')}
          </h4>
          <span className="text-xs font-mono text-gray-500">
            {historyItems.length} {t('reviewer.queue_progress_unit', 'biển báo')}
          </span>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-white/5 max-h-80 overflow-y-auto">
          {historyItems.length > 0 ? (
            historyItems.map((item) => {
              const details = getActionDetails(item.action)
              return (
                <div key={item.id} className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center font-mono font-bold text-xs text-gray-900 dark:text-gray-100 shrink-0">
                      {item.signCode}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                          {item.signName}
                        </p>
                        {item.timestamp && (
                          <span className="text-[11px] font-mono text-gray-400 hidden sm:inline">
                            {item.timestamp}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {item.details || details.summary}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold border ${details.badgeCls}`}
                    >
                      {details.label}
                    </span>
                    {onUndoItem && (
                      <button
                        type="button"
                        onClick={() => onUndoItem(item.candidateId)}
                        className={`p-1.5 rounded-lg border text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer ${
                          isDark ? 'border-white/10 hover:bg-white/10' : 'border-gray-200 hover:bg-gray-100'
                        }`}
                        title={t('reviewer.btn_undo_item', 'Hoàn tác mục này')}
                      >
                        <ArrowUUpLeft size={14} weight="bold" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="p-8 text-center text-xs text-gray-500">
              {t('reviewer.summary_list_empty', 'Chưa có quyết định nào trong phiên này.')}
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions - Responsive & Active */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Button
          variant="primary"
          size="lg"
          onClick={onNextBatch || onRecheckSubmission}
          leftIcon={<Sparkle size={18} weight="bold" />}
        >
          {t('reviewer.btn_next_batch', 'Thẩm định đợt tiếp theo')}
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={onRecheckSubmission}
          leftIcon={<ArrowCounterClockwise size={18} weight="bold" />}
        >
          {t('reviewer.btn_check_submission', 'Kiểm tra lại phiên')}
        </Button>
        <Button
          variant="ghost"
          size="lg"
          onClick={() => navigate('/')}
          leftIcon={<House size={18} weight="bold" />}
        >
          {t('reviewer.btn_return_home', 'Về Trang chủ')}
        </Button>
      </div>
    </div>
  )
}
