import { useEffect, useState } from 'react'
import { ModalPortal } from '@/components/common/ModalPortal'
import { auditService, type TaskHistoryDetailResponse } from '@/api/services/audit.service'
import { resolveImageUrl } from '@/features/map/utils/signUrlHelpers'
import {
  X,
  CircleNotch,
  User,
  Clock,
  Camera,
  CheckCircle,
  XCircle,
  ArrowSquareOut,
  ChatText,
} from '@phosphor-icons/react'

interface TaskHistoryTimelineModalProps {
  taskId: string | null
  onClose: () => void
  isEn?: boolean
}

function formatDateTime(value?: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return String(value)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${hh}:${mm} • ${dd}/${mo}/${yyyy}`
}

function getEventTypeLabel(eventType: string, isEn: boolean): string {
  const map: Record<string, { vi: string; en: string }> = {
    TASK_CREATED: { vi: 'Tạo nhiệm vụ', en: 'Task created' },
    EVIDENCE_SUBMITTED: { vi: 'Nộp ảnh hiện trường', en: 'Photo submitted' },
    RECAPTURE_REQUESTED: { vi: 'Yêu cầu chụp lại', en: 'Recapture requested' },
    REVIEW_DECIDED: { vi: 'Đánh giá biển báo', en: 'Review submitted' },
    TASK_FINALIZED: { vi: 'Hoàn tất nhiệm vụ', en: 'Task completed' },
  }
  const found = map[eventType]
  if (found) return isEn ? found.en : found.vi
  return eventType
}

function getActorRoleLabel(role: string | undefined, isEn: boolean): string {
  const r = (role || '').toUpperCase()
  if (r === 'SURVEYOR') return isEn ? 'Surveyor' : 'Người khảo sát'
  if (r === 'REVIEWER') return isEn ? 'Reviewer' : 'Người đánh giá'
  if (r === 'STAFF') return isEn ? 'Staff' : 'Nhân viên'
  if (r === 'ADMIN') return isEn ? 'Admin' : 'Quản trị viên'
  return role || (isEn ? 'User' : 'Người dùng')
}

function getVoteText(vote: number | undefined, decision: string | undefined, isEn: boolean): string {
  if (decision) {
    const d = decision.toUpperCase()
    if (d === 'UNCHANGED') return isEn ? 'Unchanged' : 'Không thay đổi'
    if (d === 'CHANGED') return isEn ? 'Changed' : 'Đã thay đổi'
    if (d === 'REMOVED') return isEn ? 'Removed' : 'Đã gỡ bỏ'
    if (d === 'UNCLEAR') return isEn ? 'Unclear' : 'Không rõ'
    if (d === 'INVALID') return isEn ? 'Invalid' : 'Không hợp lệ'
    return decision
  }
  if (vote === 1) return isEn ? 'Approved' : 'Đồng ý'
  if (vote === -1) return isEn ? 'Rejected' : 'Từ chối'
  if (vote === 0) return isEn ? 'Skipped' : 'Bỏ qua'
  return '—'
}

export function TaskHistoryTimelineModal({
  taskId,
  onClose,
  isEn = false,
}: TaskHistoryTimelineModalProps) {
  const [detail, setDetail] = useState<TaskHistoryDetailResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!taskId) {
      setDetail(null)
      setErrorMsg(null)
      return
    }

    let isMounted = true
    setIsLoading(true)
    setErrorMsg(null)

    auditService
      .getTaskHistoryDetail(taskId)
      .then((res) => {
        if (!isMounted) return
        setDetail(res)
      })
      .catch((err: any) => {
        if (!isMounted) return
        setErrorMsg(
          err?.message ||
            (isEn ? 'Could not load task history.' : 'Không thể tải lịch sử tác vụ.')
        )
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [taskId, isEn])

  if (!taskId) return null

  const signCode = detail?.task?.signCode || detail?.task?.sign_code
  const signName = detail?.task?.nameVi || detail?.task?.nameEn
  const taskTypeLabel =
    detail?.taskType === 'REVALIDATION'
      ? isEn
        ? 'Revalidation check'
        : 'Kiểm tra định kỳ'
      : isEn
        ? 'Candidate review'
        : 'Duyệt biển mới'

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          className="bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/15 rounded-2xl max-w-3xl w-full shadow-2xl animate-in zoom-in-95 my-auto max-h-[90vh] flex flex-col overflow-hidden text-xs text-gray-800 dark:text-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-white/[0.02] shrink-0">
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate">
                {isEn ? 'Task Execution History' : 'Lịch sử thực hiện tác vụ'}
              </h3>
              <p className="text-[11px] font-mono text-gray-500 dark:text-gray-400 truncate mt-0.5">
                #{taskId}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            >
              <X size={18} weight="bold" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {isLoading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3 text-gray-400">
                <CircleNotch size={24} className="animate-spin text-[#007b8b] dark:text-[#00c4de]" />
                <span>{isEn ? 'Loading timeline...' : 'Đang tải lịch sử...'}</span>
              </div>
            ) : errorMsg ? (
              <div className="p-4 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50/70 dark:bg-red-950/20 text-red-700 dark:text-red-300 text-center">
                {errorMsg}
              </div>
            ) : detail ? (
              <>
                {/* Summary & Primary Actors */}
                <div className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.02] space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-[#007b8b] dark:text-[#00c4de]">
                        {taskTypeLabel}
                      </span>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                        {signCode ? `${signCode} • ` : ''}
                        {signName || (isEn ? 'Traffic sign' : 'Biển báo giao thông')}
                      </h4>
                    </div>
                    {detail.status && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white dark:bg-white/10 border border-gray-200 dark:border-white/15 text-gray-700 dark:text-gray-200">
                        {detail.status}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-200/70 dark:border-white/10">
                    <div className="p-2.5 rounded-lg bg-white dark:bg-black/25 border border-gray-200/70 dark:border-white/5 space-y-0.5">
                      <span className="text-[10px] text-gray-400 font-semibold flex items-center gap-1">
                        <User size={12} />
                        <span>{isEn ? 'Primary surveyor' : 'Người khảo sát chính'}</span>
                      </span>
                      <p className="font-bold text-gray-900 dark:text-white text-xs truncate">
                        {detail.surveyor?.fullName || detail.surveyorName || (isEn ? 'Not assigned' : 'Chưa có')}
                      </p>
                      {(detail.surveyor?.email || detail.surveyorId) && (
                        <p className="text-[11px] font-mono text-gray-500 dark:text-gray-400 truncate">
                          {detail.surveyor?.email || detail.surveyorId}
                        </p>
                      )}
                    </div>

                    <div className="p-2.5 rounded-lg bg-white dark:bg-black/25 border border-gray-200/70 dark:border-white/5 space-y-0.5">
                      <span className="text-[10px] text-gray-400 font-semibold flex items-center gap-1">
                        <User size={12} />
                        <span>{isEn ? 'Primary reviewer' : 'Người đánh giá chính'}</span>
                      </span>
                      <p className="font-bold text-gray-900 dark:text-white text-xs truncate">
                        {detail.reviewer?.fullName || detail.reviewerName || (isEn ? 'Not reviewed yet' : 'Chưa có')}
                      </p>
                      {(detail.reviewer?.email || detail.reviewerId) && (
                        <p className="text-[11px] font-mono text-gray-500 dark:text-gray-400 truncate">
                          {detail.reviewer?.email || detail.reviewerId}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Unified Timeline */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-1.5">
                    <Clock size={14} className="text-[#007b8b] dark:text-[#00c4de]" />
                    <span>{isEn ? 'Activity timeline' : 'Diễn biến theo thời gian'}</span>
                  </h4>

                  {detail.timeline?.length ? (
                    <div className="space-y-2 border-l-2 border-gray-200 dark:border-white/10 pl-4 ml-1.5">
                      {detail.timeline.map((ev) => (
                        <div
                          key={ev.eventId}
                          className="relative p-3 rounded-xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-white/[0.02] space-y-1"
                        >
                          <span className="w-2.5 h-2.5 rounded-full bg-[#007b8b] dark:bg-[#00c4de] absolute -left-[22px] top-3.5 ring-4 ring-white dark:ring-[#0A171C]" />
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-bold text-gray-900 dark:text-white">
                              {getEventTypeLabel(ev.eventType, isEn)}
                            </span>
                            <span className="text-[11px] font-mono text-gray-500 dark:text-gray-400">
                              {formatDateTime(ev.timestamp)}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-[11px]">
                            <span className="font-semibold text-[#007b8b] dark:text-[#00c4de]">
                              {ev.actor?.fullName || (isEn ? 'System' : 'Hệ thống')}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 text-[10px] font-medium">
                              {getActorRoleLabel(ev.actorRole || ev.actor?.role, isEn)}
                            </span>
                            {ev.actor?.email && (
                              <span className="text-gray-400 font-mono">{ev.actor.email}</span>
                            )}
                          </div>

                          {ev.description && (
                            <p className="text-xs text-gray-600 dark:text-gray-300 pt-0.5">
                              {ev.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {isEn ? 'No timeline events recorded.' : 'Chưa có mốc thời gian nào.'}
                    </p>
                  )}
                </div>

                {/* Surveyor Requests & Submissions */}
                {detail.surveyorRequests?.length > 0 && (
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-1.5">
                      <Camera size={14} className="text-amber-600 dark:text-amber-400" />
                      <span>
                        {isEn ? 'Field photo requests and uploads' : 'Yêu cầu chụp lại và ảnh hiện trường'}
                      </span>
                    </h4>

                    <div className="space-y-2">
                      {detail.surveyorRequests.map((req) => {
                        const imgUrl = req.mediaUrl ? resolveImageUrl(req.mediaUrl) : null
                        return (
                          <div
                            key={req.id}
                            className="p-3 rounded-xl border border-gray-200/80 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] space-y-1.5"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-bold text-gray-900 dark:text-white">
                                {req.type === 'RECAPTURE_REQUEST'
                                  ? isEn
                                    ? 'Recapture request'
                                    : 'Yêu cầu chụp lại'
                                  : isEn
                                    ? 'Evidence submission'
                                    : 'Ảnh bằng chứng đã nộp'}
                              </span>
                              {req.status && (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white dark:bg-white/10 border border-gray-200 dark:border-white/15">
                                  {req.status}
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-gray-600 dark:text-gray-300">
                              <div>
                                <span className="text-gray-400">
                                  {isEn ? 'Surveyor: ' : 'Người chụp: '}
                                </span>
                                <span className="font-semibold text-gray-800 dark:text-gray-100">
                                  {req.surveyor?.fullName || req.surveyorName || '—'}
                                </span>
                              </div>
                              {req.reviewerName && (
                                <div>
                                  <span className="text-gray-400">
                                    {isEn ? 'Requested by: ' : 'Người yêu cầu: '}
                                  </span>
                                  <span className="font-semibold text-gray-800 dark:text-gray-100">
                                    {req.reviewer?.fullName || req.reviewerName}
                                  </span>
                                </div>
                              )}
                            </div>

                            {(req.reason || req.note) && (
                              <p className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-1.5">
                                <ChatText size={13} className="text-gray-400 shrink-0 mt-0.5" />
                                <span>
                                  {req.reason ? `${req.reason}: ` : ''}
                                  {req.note || ''}
                                </span>
                              </p>
                            )}

                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-gray-400">
                              <span>
                                {formatDateTime(req.submittedAt || req.requestedAt || req.completedAt)}
                              </span>
                              {imgUrl && (
                                <a
                                  href={imgUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[#007b8b] dark:text-[#00c4de] font-semibold hover:underline"
                                >
                                  <span>{isEn ? 'Open photo' : 'Xem ảnh'}</span>
                                  <ArrowSquareOut size={12} />
                                </a>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Reviews List */}
                {detail.reviews?.length > 0 && (
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-1.5">
                      <CheckCircle size={14} className="text-emerald-600 dark:text-emerald-400" />
                      <span>{isEn ? 'Reviewer decisions' : 'Danh sách phiếu đánh giá'}</span>
                    </h4>

                    <div className="space-y-2">
                      {detail.reviews.map((rev) => {
                        const isPositive = rev.vote === 1 || rev.decision === 'UNCHANGED'
                        const isNegative = rev.vote === -1 || rev.decision === 'INVALID' || rev.decision === 'REMOVED'
                        return (
                          <div
                            key={rev.id}
                            className="p-3 rounded-xl border border-gray-200/80 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] space-y-1"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-900 dark:text-white">
                                  {rev.reviewer?.fullName || rev.reviewerName}
                                </span>
                                {rev.reviewerEmail && (
                                  <span className="text-[11px] font-mono text-gray-400">
                                    {rev.reviewerEmail}
                                  </span>
                                )}
                              </div>
                              <span
                                className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                                  isPositive
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : isNegative
                                      ? 'text-red-600 dark:text-red-400'
                                      : 'text-gray-600 dark:text-gray-300'
                                }`}
                              >
                                {isNegative ? <XCircle size={13} /> : <CheckCircle size={13} />}
                                <span>{getVoteText(rev.vote, rev.decision, isEn)}</span>
                              </span>
                            </div>

                            {(rev.note || rev.declineNote || rev.declineReason) && (
                              <p className="text-xs text-gray-600 dark:text-gray-300">
                                {rev.note || rev.declineNote || rev.declineReason}
                              </p>
                            )}

                            <p className="text-[11px] text-gray-400 font-mono">
                              {formatDateTime(rev.reviewedAt || rev.decidedAt)}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.02] flex justify-end shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
            >
              {isEn ? 'Close' : 'Đóng'}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  )
}

