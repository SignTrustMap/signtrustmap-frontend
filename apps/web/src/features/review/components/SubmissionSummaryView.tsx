import { useNavigate } from 'react-router-dom'
import { Check, X, Warning, ArrowCounterClockwise, ArrowLeft } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { Button } from '@shared/ui'
import type { ReviewHistoryItem } from '@/data'

interface SubmissionSummaryViewProps {
  historyItems: ReviewHistoryItem[]
  isDark: boolean
  onRecheckSubmission: () => void
}

export function SubmissionSummaryView({
  historyItems,
  isDark,
  onRecheckSubmission,
}: SubmissionSummaryViewProps) {
  const { t } = useTranslation('common')
  const navigate = useNavigate()

  const counts = historyItems.reduce(
    (acc, curr) => {
      if (curr.action === 'Approved') acc.approved += 1
      else if (curr.action === 'Rejected') acc.declined += 1
      else if (curr.action === 'Flagged') acc.reported += 1
      else acc.skipped += 1
      return acc
    },
    { approved: 0, declined: 0, reported: 0, skipped: 0 }
  )

  const getActionDetails = (action: string) => {
    switch (action) {
      case 'Approved':
        return {
          label: t('reviewer.action_approved', 'Đã duyệt'),
          summary: t('reviewer.summary_approved_sub', 'Sẵn sàng tích hợp bản đồ tin cậy.'),
          color: 'emerald',
          badgeCls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        }
      case 'Rejected':
        return {
          label: t('reviewer.action_declined', 'Đã từ chối'),
          summary: t('reviewer.summary_declined_sub', 'Bị từ chối trong phiên kiểm định chất lượng.'),
          color: 'rose',
          badgeCls: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
        }
      case 'Flagged':
        return {
          label: t('reviewer.action_reported', 'Đã báo cáo'),
          summary: t('reviewer.summary_reported_sub', 'Đã chuyển báo cáo lên ban quản trị hệ thống.'),
          color: 'amber',
          badgeCls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
        }
      default:
        return {
          label: t('reviewer.action_skipped', 'Đã bỏ qua'),
          summary: t('reviewer.summary_skipped_sub', 'Không xác định được biển báo.'),
          color: 'gray',
          badgeCls: 'bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/30',
        }
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
          {t('reviewer.summary_title', 'Tổng kết phiên thẩm định (Submission Summary)')}
        </h2>
        <p className="text-xs sm:text-sm text-gray-500">
          {t('reviewer.summary_subtitle', 'Hôm nay • {{count}} biển báo đã được xem xét', {
            count: historyItems.length,
          })}
        </p>
      </div>

      {/* 4 Metric Badges matching Mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Approved */}
        <div
          className={`p-4 rounded-2xl border text-center space-y-1.5 ${
            isDark ? 'bg-[#071317] border-white/10' : 'bg-white border-gray-200'
          }`}
        >
          <div className="w-8 h-8 rounded-full border border-emerald-500 text-emerald-500 mx-auto flex items-center justify-center font-bold">
            <Check size={16} weight="bold" />
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white font-mono">
            {counts.approved}
          </p>
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            {t('reviewer.summary_metric_approved', 'APPROVED')}
          </p>
        </div>

        {/* Declined */}
        <div
          className={`p-4 rounded-2xl border text-center space-y-1.5 ${
            isDark ? 'bg-[#071317] border-white/10' : 'bg-white border-gray-200'
          }`}
        >
          <div className="w-8 h-8 rounded-full border border-rose-500 text-rose-500 mx-auto flex items-center justify-center font-bold">
            <X size={16} weight="bold" />
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white font-mono">
            {counts.declined}
          </p>
          <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            {t('reviewer.summary_metric_declined', 'DECLINED')}
          </p>
        </div>

        {/* Reported */}
        <div
          className={`p-4 rounded-2xl border text-center space-y-1.5 ${
            isDark ? 'bg-[#071317] border-white/10' : 'bg-white border-gray-200'
          }`}
        >
          <div className="w-8 h-8 rounded-full border border-amber-500 text-amber-500 mx-auto flex items-center justify-center font-bold">
            <Warning size={16} weight="bold" />
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white font-mono">
            {counts.reported}
          </p>
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            {t('reviewer.summary_metric_reported', 'REPORTED')}
          </p>
        </div>

        {/* Skipped */}
        <div
          className={`p-4 rounded-2xl border text-center space-y-1.5 ${
            isDark ? 'bg-[#071317] border-white/10' : 'bg-white border-gray-200'
          }`}
        >
          <div className="w-8 h-8 rounded-full border border-gray-400 text-gray-400 mx-auto flex items-center justify-center font-bold font-mono">
            ↷
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white font-mono">
            {counts.skipped}
          </p>
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
            {t('reviewer.summary_metric_skipped', 'SKIPPED')}
          </p>
        </div>
      </div>

      {/* Reviewed Signs List */}
      <div
        className={`rounded-2xl border overflow-hidden ${
          isDark ? 'bg-[#071317] border-white/10' : 'bg-white border-gray-200'
        }`}
      >
        <div className="p-4 border-b border-gray-100 dark:border-white/10">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white">
            {t('reviewer.summary_list_title', 'Danh sách biển báo đã đánh giá trong phiên')}
          </h4>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-white/5 max-h-96 overflow-y-auto">
          {historyItems.length > 0 ? (
            historyItems.map((item) => {
              const details = getActionDetails(item.action)
              return (
                <div key={item.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                      {item.signCode}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {item.signName}
                      </p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {details.summary}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border shrink-0 ${details.badgeCls}`}
                  >
                    {details.label}
                  </span>
                </div>
              )
            })
          ) : (
            <div className="p-8 text-center text-xs text-gray-500">
              {t('reviewer.history_empty')}
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-center gap-3 pt-2">
        <Button
          variant="outline"
          size="lg"
          onClick={onRecheckSubmission}
          leftIcon={<ArrowCounterClockwise size={18} weight="bold" />}
        >
          {t('reviewer.btn_check_submission', 'Kiểm tra lại (Check submission)')}
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={() => navigate('/review')}
          leftIcon={<ArrowLeft size={18} weight="bold" />}
        >
          {t('reviewer.btn_done_return_hub', 'Hoàn tất & Về Hub')}
        </Button>
      </div>
    </div>
  )
}
