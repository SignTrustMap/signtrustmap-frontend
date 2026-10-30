import { Pause, Play, UploadSimple } from '@phosphor-icons/react'
import { Badge, Button } from '@shared/ui'
import type { ChunkedUploadProgress } from '@/api/services/submissions.service'

interface SurveyChunkProgressProps {
  progress: ChunkedUploadProgress
  isPaused: boolean
  isDark: boolean
  onTogglePause: () => void
}

/**
 * Visual progress tracker for active chunked media uploads.
 * Complies with RULE.md Design Tokens, eliminates nested card borders.
 */
export function SurveyChunkProgress({
  progress,
  isPaused,
  isDark: _isDark,
  onTogglePause,
}: SurveyChunkProgressProps) {
  const getStepLabel = () => {
    switch (progress.step) {
      case 'initializing':
        return 'Khởi tạo phiên tải lên...'
      case 'uploading_video':
        return 'Đang tải lên video'
      case 'uploading_gpx':
        return 'Đang tải lên dữ liệu hành trình GPX...'
      case 'completing':
        return 'Đang ghép file trên máy chủ lưu trữ MinIO...'
      case 'submitting':
        return 'Gửi hàng đợi AI phân tích biển báo...'
      case 'done':
        return 'Hoàn tất tải lên!'
      default:
        return 'Đang xử lý...'
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 sm:py-12 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#007b8b]/15 dark:bg-[#00c4de]/15 text-[#007b8b] dark:text-[#00c4de] flex items-center justify-center shrink-0">
            <UploadSimple size={26} weight="bold" className={progress.percent < 100 && !isPaused ? 'animate-pulse' : ''} />
          </div>
          <div>
            <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
              {getStepLabel()}
            </p>
            <p className="text-xs text-gray-500 font-mono mt-0.5">
              {typeof progress.bytesUploaded === 'number' && typeof progress.totalBytes === 'number' && progress.totalBytes > 0
                ? `${(progress.bytesUploaded / (1024 * 1024)).toFixed(1)} MB / ${(progress.totalBytes / (1024 * 1024)).toFixed(1)} MB`
                : `${progress.percent}%`}
            </p>
          </div>
        </div>

        <Badge variant={progress.percent === 100 ? 'success' : 'info'} size="md">
          {progress.percent}%
        </Badge>
      </div>

      {/* Progress Bar Track */}
      <div className="space-y-2">
        <div className="w-full h-3 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden p-0.5">
          <div
            className="h-full bg-gradient-to-r from-[#007b8b] to-[#00c4de] transition-all duration-300 rounded-full shadow-xs"
            style={{ width: `${Math.min(100, Math.max(0, progress.percent))}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      {progress.percent < 100 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-gray-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#007b8b] dark:bg-[#00c4de] animate-ping inline-block shrink-0" />
            <span>{isPaused ? 'Đã tạm dừng tải lên' : 'Đang truyền dữ liệu an toàn...'}</span>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={onTogglePause}
            leftIcon={isPaused ? <Play size={14} weight="fill" /> : <Pause size={14} weight="fill" />}
          >
            {isPaused ? 'Tiếp tục' : 'Tạm dừng'}
          </Button>
        </div>
      )}
    </div>
  )
}
