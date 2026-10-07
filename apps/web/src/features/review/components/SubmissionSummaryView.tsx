import { useNavigate } from 'react-router-dom'
import {
  Check,
  X,
  Warning,
  PencilSimpleLine,
  ArrowBendUpRight,
  ArrowCounterClockwise,
  ArrowClockwise,
  House,
  ArrowUUpLeft,
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

  const getActionDetails = (action: string) => {
    switch (action) {
      case 'Approved':
        return {
          label: t('reviewer.action_approved', 'Đã duyệt'),
          badgeCls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        }
      case 'Corrected':
        return {
          label: t('reviewer.action_corrected', 'Đã sửa mã'),
          badgeCls: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
        }
      case 'Rejected':
        return {
          label: t('reviewer.action_declined', 'Từ chối'),
          badgeCls: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
        }
      case 'Flagged':
        return {
          label: t('reviewer.action_reported', 'Báo cờ'),
          badgeCls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
        }
      default:
        return {
          label: t('reviewer.action_skipped', 'Bỏ qua'),
          badgeCls: 'bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/30',
        }
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* 1. Concise, Professional Header */}
      <div className="text-center space-y-1.5">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-1">
          <Check size={24} weight="bold" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          {t('reviewer.summary_complete_title', 'Hoàn tất phiên thẩm định')}
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          {t(
            'reviewer.summary_complete_desc',
            'Đã xử lý xong {{count}} biển báo. Dữ liệu đã được đồng bộ vào hệ thống bản đồ.',
            { count: historyItems.length }
          )}
        </p>
      </div>

      {/* 2. Compact 5-Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {/* Approved */}
        <div
          className={`p-3 rounded-xl border text-center transition-all ${
            isDark ? 'bg-[#071317] border-white/10' : 'bg-white border-gray-200/80 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400 mb-0.5">
            <Check size={14} weight="bold" />
            <span className="text-xl font-bold font-mono">{counts.approved}</span>
          </div>
          <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
            {t('reviewer.action_approved', 'Đã duyệt')}
          </p>
        </div>

        {/* Corrected */}
        <div
          className={`p-3 rounded-xl border text-center transition-all ${
            isDark ? 'bg-[#071317] border-white/10' : 'bg-white border-gray-200/80 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5 text-sky-600 dark:text-sky-400 mb-0.5">
            <PencilSimpleLine size={14} weight="bold" />
            <span className="text-xl font-bold font-mono">{counts.corrected}</span>
          </div>
          <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
            {t('reviewer.action_corrected', 'Đã sửa mã')}
          </p>
        </div>

        {/* Declined */}
        <div
          className={`p-3 rounded-xl border text-center transition-all ${
            isDark ? 'bg-[#071317] border-white/10' : 'bg-white border-gray-200/80 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5 text-rose-600 dark:text-rose-400 mb-0.5">
            <X size={14} weight="bold" />
            <span className="text-xl font-bold font-mono">{counts.declined}</span>
          </div>
          <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
            {t('reviewer.action_declined', 'Từ chối')}
          </p>
        </div>

        {/* Reported */}
        <div
          className={`p-3 rounded-xl border text-center transition-all ${
            isDark ? 'bg-[#071317] border-white/10' : 'bg-white border-gray-200/80 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5 text-amber-600 dark:text-amber-400 mb-0.5">
            <Warning size={14} weight="bold" />
            <span className="text-xl font-bold font-mono">{counts.reported}</span>
          </div>
          <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
            {t('reviewer.action_reported', 'Báo cờ')}
          </p>
        </div>

        {/* Skipped */}
        <div
          className={`p-3 rounded-xl border text-center transition-all col-span-2 sm:col-span-1 ${
            isDark ? 'bg-[#071317] border-white/10' : 'bg-white border-gray-200/80 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5 text-gray-500 dark:text-gray-400 mb-0.5">
            <ArrowBendUpRight size={14} weight="bold" />
            <span className="text-xl font-bold font-mono">{counts.skipped}</span>
          </div>
          <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
            {t('reviewer.action_skipped', 'Bỏ qua')}
          </p>
        </div>
      </div>

      {/* 3. Streamlined Review History List */}
      <div
        className={`rounded-2xl border overflow-hidden ${
          isDark ? 'bg-[#071317] border-white/10' : 'bg-white border-gray-200 shadow-xs'
        }`}
      >
        <div className="py-3 px-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
          <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
            {t('reviewer.summary_list_title', 'Chi tiết đánh giá trong phiên')}
          </h4>
          <span className="text-xs font-mono font-semibold text-gray-500">
            {historyItems.length} {t('reviewer.queue_progress_unit', 'biển báo')}
          </span>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-white/5 max-h-64 overflow-y-auto">
          {historyItems.length > 0 ? (
            historyItems.map((item) => {
              const details = getActionDetails(item.action)
              return (
                <div key={item.id} className="py-2.5 px-3 sm:px-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 font-mono font-bold text-xs text-gray-800 dark:text-gray-200 shrink-0">
                      {item.signCode}
                    </span>
                    <div className="min-w-0 flex items-center gap-2 truncate">
                      <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {item.signName}
                      </p>
                      {item.timestamp && (
                        <span className="text-[11px] font-mono text-gray-400 shrink-0 hidden sm:inline">
                          {item.timestamp}
                        </span>
                      )}
                      {item.details && (
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate shrink-0">
                          ({item.details})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${details.badgeCls}`}
                    >
                      {details.label}
                    </span>
                    {onUndoItem && (
                      <button
                        type="button"
                        onClick={() => onUndoItem(item.candidateId)}
                        className={`p-1 rounded-md border text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer ${
                          isDark ? 'border-white/10 hover:bg-white/10' : 'border-gray-200 hover:bg-gray-100'
                        }`}
                        title={t('reviewer.btn_undo_item', 'Hoàn tác mục này')}
                      >
                        <ArrowUUpLeft size={13} weight="bold" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="p-6 text-center text-xs text-gray-500">
              {t('reviewer.summary_list_empty', 'Chưa có quyết định nào trong phiên này.')}
            </div>
          )}
        </div>
      </div>

      {/* 4. Footer Actions - Harmonious & Balanced */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
        <Button
          variant="primary"
          size="md"
          onClick={onNextBatch || onRecheckSubmission}
          leftIcon={<ArrowClockwise size={16} weight="bold" />}
        >
          {t('reviewer.btn_next_batch', 'Thẩm định đợt tiếp theo')}
        </Button>
        <Button
          variant="outline"
          size="md"
          onClick={onRecheckSubmission}
          leftIcon={<ArrowCounterClockwise size={16} weight="bold" />}
        >
          {t('reviewer.btn_check_submission', 'Kiểm tra lại phiên')}
        </Button>
        <Button
          variant="ghost"
          size="md"
          onClick={() => navigate('/review')}
          leftIcon={<House size={16} weight="bold" />}
        >
          {t('reviewer.btn_done_return_hub', 'Hoàn tất & Về Hub')}
        </Button>
      </div>
    </div>
  )
}
