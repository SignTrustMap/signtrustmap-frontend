import { CheckCircle, Clock, WarningCircle, XCircle } from '@phosphor-icons/react'
import type { SubmissionStatus } from '@shared/types'

interface SurveyLivePipelineStepperProps {
  status: SubmissionStatus
  isDark: boolean
  failureReason?: string | null
}

interface PipelineStep {
  key: string
  label: string
  sublabel: string
}

const PIPELINE_STEPS: PipelineStep[] = [
  { key: 'QUEUED', label: 'Hàng đợi', sublabel: 'Chờ phân bổ worker' },
  { key: 'SYNCHRONIZING', label: 'Đồng bộ', sublabel: 'Khớp Video & GPX' },
  { key: 'DETECTING', label: 'Phát hiện', sublabel: 'YOLO12 AI Scanner' },
  { key: 'TRACKING', label: 'Tracking', sublabel: 'BoT-SORT Best Frame' },
  { key: 'ESTIMATING', label: 'Chiếu toạ độ', sublabel: 'Camera Projection' },
  { key: 'CLASSIFYING', label: 'Phân loại', sublabel: 'CLIP VLM Embeddings' },
  { key: 'COMPLETED', label: 'Hoàn thành', sublabel: 'Sẵn sàng thẩm định' },
]

const STAGE_ORDER: Record<string, number> = {
  DRAFT: 0,
  QUEUED: 1,
  SYNCHRONIZING: 2,
  DETECTING: 3,
  TRACKING: 4,
  ESTIMATING: 5,
  CLASSIFYING: 6,
  COMPLETED: 7,
}

/**
 * Visual multi-stage stepper displaying the 12 AI processing pipeline states.
 * Follows RULE.md §2 Design Tokens and §7.1 theme palette.
 */
export function SurveyLivePipelineStepper({
  status,
  isDark,
  failureReason,
}: SurveyLivePipelineStepperProps) {
  const currentStepIndex = STAGE_ORDER[status] ?? 1
  const isFailed = status === 'FAILED' || status === 'REJECTED'
  const isPendingCorrection = status === 'PENDING_CORRECTION'

  return (
    <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#071317] border-white/10' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/10 mb-4">
        <div>
          <h4 className="text-sm font-bold text-gray-900 dark:text-white">
            Tiến trình trích xuất AI
          </h4>
          <p className="text-xs text-gray-500">
            Trạng thái hiện tại:{' '}
            <strong className="text-[#007b8b] dark:text-[#00c4de] uppercase font-mono">
              {status}
            </strong>
          </p>
        </div>

        {isFailed ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-500 border border-rose-500/30">
            <XCircle size={14} weight="bold" /> Xử lý thất bại
          </span>
        ) : isPendingCorrection ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30">
            <WarningCircle size={14} weight="bold" /> Cần hiệu chỉnh
          </span>
        ) : status === 'COMPLETED' ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
            <CheckCircle size={14} weight="bold" /> Trích xuất hoàn tất
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-500 border border-cyan-500/30">
            <Clock size={14} weight="bold" /> Đang chạy ngầm
          </span>
        )}
      </div>

      {/* Stepper Node Track */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {PIPELINE_STEPS.map((step, index) => {
          const stepNumber = index + 1
          const isDone = currentStepIndex > stepNumber || status === 'COMPLETED'
          const isCurrent = currentStepIndex === stepNumber && !isFailed && status !== 'COMPLETED'

          return (
            <div
              key={step.key}
              className={`p-3 rounded-xl border text-center transition-all ${
                isDone
                  ? isDark
                    ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : isCurrent
                  ? isDark
                    ? 'bg-[#00c4de]/10 border-[#00c4de]/40 text-[#00c4de] ring-1 ring-[#00c4de]/30'
                    : 'bg-[#007b8b]/10 border-[#007b8b]/30 text-[#007b8b] ring-1 ring-[#007b8b]/30'
                  : isDark
                  ? 'bg-white/[0.02] border-white/5 text-gray-500 opacity-60'
                  : 'bg-gray-50 border-gray-100 text-gray-400 opacity-70'
              }`}
            >
              <div className="flex items-center justify-center mb-1.5">
                {isDone ? (
                  <CheckCircle size={18} weight="fill" className="text-emerald-500" />
                ) : isCurrent ? (
                  <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                ) : (
                  <span className="text-xs font-mono font-bold">{stepNumber}</span>
                )}
              </div>
              <p className="text-xs font-bold truncate">{step.label}</p>
              <p className="text-[10px] text-gray-500 truncate mt-0.5">{step.sublabel}</p>
            </div>
          )
        })}
      </div>

      {failureReason && (
        <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
          <strong>Chi tiết lỗi:</strong> {failureReason}
        </div>
      )}
    </div>
  )
}
