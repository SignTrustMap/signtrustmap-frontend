import { useState, useEffect } from 'react'
import { ModalPortal } from '@/components/common/ModalPortal'
import { candidatesService, type CandidateDetailResponse } from '@/api/services/candidates.service'
import { resolveImageUrl } from '@/features/map/utils/signUrlHelpers'
import { TrafficSignGraphic } from '@/features/catalog/components/TrafficSignGraphic'
import { SignMiniMap } from '@/features/catalog/components/SignMiniMap'
import { useToast } from '@/context/ToastContext'
import {
  X,
  Copy,
  Check,
  ArrowsClockwise,
  WarningOctagon,
  NavigationArrow,
  User,
  ArrowSquareOut,
  Camera,
  CheckCircle,
  MapPin,
  Image as ImageIcon,
  Flag,
  Sparkle,
  Clock,
  CalendarBlank,
} from '@phosphor-icons/react'

export interface CandidateInspectionModalProps {
  isOpen: boolean
  candidateId: string | null
  onClose: () => void
  onStatusUpdated?: () => void
}

const RECAPTURE_REASONS = [
  { value: 'BLURRY', label: 'Ảnh mờ hoặc rung tay' },
  { value: 'POOR_LIGHTING', label: 'Ngược sáng hoặc thiếu sáng' },
  { value: 'WRONG_ANGLE', label: 'Góc chụp quá nghiêng' },
  { value: 'OCCLUDED', label: 'Bị vật cản che khuất' },
  { value: 'OTHER', label: 'Lý do khác' },
]

function getStatusBadgeConfig(status?: string) {
  switch (status) {
    case 'VERIFIED':
      return {
        label: 'Đã xác thực',
        badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30',
        textColor: 'text-emerald-600 dark:text-emerald-400',
      }
    case 'IN_CONSENSUS':
      return {
        label: 'Đang thẩm định',
        badgeClass: 'bg-blue-50 text-blue-700 dark:bg-cyan-500/15 dark:text-[#00c4de] border-blue-200 dark:border-cyan-500/30',
        textColor: 'text-[#007b8b] dark:text-[#00c4de]',
      }
    case 'REJECTED':
      return {
        label: 'Đã từ chối',
        badgeClass: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400 border-red-200 dark:border-red-500/30',
        textColor: 'text-red-600 dark:text-red-400',
      }
    case 'RECAPTURE_REQUESTED':
      return {
        label: 'Yêu cầu chụp lại',
        badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 border-amber-200 dark:border-amber-500/30',
        textColor: 'text-amber-600 dark:text-amber-400',
      }
    case 'PENDING_REVIEW':
    default:
      return {
        label: 'Chờ thẩm định',
        badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 border-amber-200 dark:border-amber-500/30',
        textColor: 'text-amber-600 dark:text-amber-400',
      }
  }
}

function formatDate(dateStr?: string | Date): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return String(dateStr)
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${hours}:${minutes} • ${day}/${month}/${year}`
}

export function CandidateInspectionModal({
  isOpen,
  candidateId,
  onClose,
  onStatusUpdated,
}: CandidateInspectionModalProps) {
  const { success, error } = useToast()

  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [data, setData] = useState<CandidateDetailResponse | null>(null)
  const [copied, setCopied] = useState<boolean>(false)
  const [activeImageTab, setActiveImageTab] = useState<'crop' | 'bestFrame'>('crop')
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)
  const [imgLoadError, setImgLoadError] = useState<boolean>(false)

  // Action Panel: null | 'RECAPTURE' | 'ESCALATE'
  const [actionType, setActionType] = useState<'RECAPTURE' | 'ESCALATE' | null>(null)
  const [recaptureReason, setRecaptureReason] = useState<string>('BLURRY')
  const [recaptureNote, setRecaptureNote] = useState<string>('')
  const [escalateNote, setEscalateNote] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // Load live candidate details
  useEffect(() => {
    if (!isOpen || !candidateId) {
      setData(null)
      setActionType(null)
      return
    }

    let isMounted = true
    const cleanId = candidateId.replace(/^#/, '')

    async function fetchDetail() {
      setIsLoading(true)
      try {
        const res = await candidatesService.getCandidateDetail(cleanId)
        if (isMounted) {
          setData(res)
        }
      } catch (err: any) {
        console.error('[CandidateInspectionModal] Failed to load candidate:', err)
        if (isMounted) {
          error(err?.message || 'Không thể tải thông tin ứng viên từ máy chủ')
          setData(null)
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchDetail()

    return () => {
      isMounted = false
    }
  }, [isOpen, candidateId])

  if (!isOpen || !candidateId) return null

  const candidate = data?.candidate
  const submission = data?.submission
  const locationContext = data?.locationContext
  const possibleSigns = data?.possibleSigns || data?.top5 || []

  // Images
  const cropUrl = candidate?.signCropUrl ? resolveImageUrl(candidate.signCropUrl) : ''
  const bestFrameUrl = candidate?.bestFrameUrl ? resolveImageUrl(candidate.bestFrameUrl) : ''
  const activeImageUrl = activeImageTab === 'crop' ? cropUrl : (bestFrameUrl || cropUrl)
  const hasBothImages = Boolean(cropUrl && bestFrameUrl)

  // Sign Type
  const signType = candidate?.predictedSignType
  const signCode = signType?.signCode || '—'
  const signName = signType?.nameVi || signType?.nameEn || 'Biển báo giao thông'
  const signGraphicEntry = signCode !== '—' ? { code: signCode, nameVi: signName } : null

  // Confidence
  const rawScore = candidate?.confidenceScore ?? 0.85
  const confidencePercent = Math.round((rawScore <= 1 ? rawScore * 100 : rawScore) * 10) / 10

  // Coordinates & Location
  const lat = locationContext?.coordinates?.latitude ?? submission?.latitude ?? 0
  const lng = locationContext?.coordinates?.longitude ?? submission?.longitude ?? 0
  const direction = locationContext?.direction ?? null
  const hasValidLocation = Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)
  const displayLocation = locationContext?.displayLocation || (hasValidLocation ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : 'Chưa xác định')
  const nearbyRoad = locationContext?.nearbyRoad
  const fullLocationText = nearbyRoad ? `${nearbyRoad} • ${displayLocation}` : displayLocation

  const statusConfig = getStatusBadgeConfig(candidate?.status)

  const handleCopyId = () => {
    if (!candidateId) return
    navigator.clipboard.writeText(candidateId.replace(/^#/, ''))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Submit Recapture
  const handleSendRecapture = async () => {
    if (!candidateId) return
    try {
      setIsSubmitting(true)
      await candidatesService.requestRecapture(candidateId, {
        reason: recaptureReason,
        note: recaptureNote.trim() || undefined,
      })
      success('Đã gửi yêu cầu khảo sát viên chụp lại ảnh hiện trường')
      setActionType(null)
      setRecaptureNote('')
      if (onStatusUpdated) onStatusUpdated()
      onClose()
    } catch (err: any) {
      console.error('[CandidateInspectionModal] Recapture error:', err)
      error(err?.message || 'Không thể gửi yêu cầu chụp lại')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Submit Escalate to Admin
  const handleSendEscalate = async () => {
    if (!candidateId || !escalateNote.trim()) return
    try {
      setIsSubmitting(true)
      await candidatesService.reportOrEscalate(candidateId, {
        reason: escalateNote.trim(),
      })
      success('Đã chuyển tiếp ca ứng viên sang Quản trị viên điều tra')
      setActionType(null)
      setEscalateNote('')
      if (onStatusUpdated) onStatusUpdated()
      onClose()
    } catch (err: any) {
      console.error('[CandidateInspectionModal] Escalate error:', err)
      error(err?.message || 'Không thể chuyển tiếp sang Quản trị viên')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
        onClick={onClose}
      >
        <div
          className="bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/15 rounded-2xl shadow-2xl max-w-[980px] w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 my-auto text-xs text-gray-800 dark:text-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ─── MODAL HEADER ─────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.02] shrink-0">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <span className="font-semibold text-gray-900 dark:text-white">
                Chi tiết ứng viên biển báo
              </span>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <span className={`font-medium ${statusConfig.textColor}`}>
                {statusConfig.label}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-2"
              title="Đóng"
            >
              <X size={18} weight="bold" />
            </button>
          </div>

          {/* ─── MODAL BODY ───────────────────────────────────────────── */}
          <div className="p-4 sm:p-5 overflow-y-auto text-xs sm:text-sm flex-1">
            {isLoading ? (
              <div className="py-20 text-center space-y-3">
                <ArrowsClockwise size={28} className="animate-spin text-[#007b8b] dark:text-[#00c4de] mx-auto" />
                <p className="text-xs text-gray-500 font-medium">Đang tải thông số giám sát ứng viên từ máy chủ...</p>
              </div>
            ) : !candidate ? (
              <div className="py-16 text-center space-y-2">
                <WarningOctagon size={32} className="mx-auto text-amber-500 opacity-80" />
                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                  Không tìm thấy thông tin ứng viên
                </p>
                <p className="text-xs text-gray-500">
                  Ứng viên này có thể đã được duyệt hoặc không còn tồn tại trong hàng đợi.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                {/* ─── LEFT COLUMN: EVIDENCE PHOTO + MINI MAP (5 cols) ───── */}
                <div className="md:col-span-5 flex flex-col gap-3 md:sticky md:top-0">
                  {/* Evidence Photo Container */}
                  <div className="relative aspect-4/3 rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-gray-900 group shadow-2xs flex items-center justify-center shrink-0">
                    {!imgLoadError && activeImageUrl ? (
                      <img
                        src={activeImageUrl}
                        alt={signName}
                        onError={() => setImgLoadError(true)}
                        onClick={() => setZoomedImage(activeImageUrl)}
                        className="w-full h-full object-contain sm:object-cover transition-transform duration-200 group-hover:scale-102 cursor-zoom-in"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-gray-400 space-y-1">
                        <ImageIcon size={32} weight="light" className="opacity-50" />
                        <p className="text-xs text-gray-400">Không có ảnh hiển thị</p>
                      </div>
                    )}

                    {/* Floating View Switcher Inside Image Container */}
                    {hasBothImages && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-2.5 left-2.5 p-1 rounded-xl backdrop-blur-md border shadow-lg flex items-center gap-1 z-10 transition-colors bg-white/95 dark:bg-[#071317]/90 border-gray-200 dark:border-white/20 shadow-gray-900/10"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setActiveImageTab('crop')
                            setImgLoadError(false)
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            activeImageTab === 'crop'
                              ? 'bg-[#007b8b] text-white dark:bg-[#00c4de] dark:text-black shadow-xs'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/10'
                          }`}
                        >
                          Ảnh cắt
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveImageTab('bestFrame')
                            setImgLoadError(false)
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            activeImageTab === 'bestFrame'
                              ? 'bg-[#007b8b] text-white dark:bg-[#00c4de] dark:text-black shadow-xs'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/10'
                          }`}
                        >
                          Toàn cảnh
                        </button>
                      </div>
                    )}

                    {/* External link to raw image */}
                    {activeImageUrl && !imgLoadError && (
                      <a
                        href={activeImageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute bottom-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-black/75 hover:bg-black/90 backdrop-blur-xs text-white text-[10px] font-mono transition-colors"
                        title="Mở ảnh gốc trong tab mới"
                      >
                        <ArrowSquareOut size={12} />
                        <span>Ảnh gốc</span>
                      </a>
                    )}
                  </div>

                  {/* Mini Map or Fallback */}
                  {hasValidLocation ? (
                    <SignMiniMap
                      lat={lat}
                      lng={lng}
                      title={signName}
                      heightClassName="h-[160px] sm:h-[180px]"
                    />
                  ) : (
                    <div className="h-[130px] flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-gray-200 dark:border-white/10 text-center text-gray-400 text-xs">
                      <MapPin size={16} className="mx-auto mb-1 opacity-50" />
                      <span>Không có toạ độ định vị GPS</span>
                    </div>
                  )}
                </div>

                {/* ─── RIGHT COLUMN: SPECS, PREDICTIONS & ACTIONS (7 cols) ── */}
                <div className="md:col-span-7 flex flex-col gap-3">
                  {/* Sign Header & Code */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-1 shrink-0 flex items-center justify-center shadow-2xs">
                        {signGraphicEntry ? (
                          <TrafficSignGraphic sign={signGraphicEntry} className="w-full h-full object-contain" />
                        ) : (
                          <span className="font-mono text-xs font-bold text-gray-400">?</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-sm text-[#007b8b] dark:text-[#00c4de]">
                            {signCode}
                          </span>
                          <span className="text-gray-300 dark:text-gray-600">•</span>
                          <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate">
                            {signName}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                          <span>Mã ứng viên:</span>
                          <span className="font-mono text-gray-700 dark:text-gray-300 select-all">
                            #{candidate.id.slice(0, 16)}...
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyId}
                            className="text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer shrink-0"
                            title="Sao chép mã ứng viên"
                          >
                            {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-gray-400 uppercase font-mono block">
                        Độ tin cậy AI
                      </span>
                      <span className="text-base font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                        {confidencePercent}%
                      </span>
                    </div>
                  </div>

                  {/* Submission & Surveyor Metadata Card */}
                  <div className="rounded-xl border border-gray-200/80 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] divide-y divide-gray-200/60 dark:divide-white/5 text-xs">
                    <div className="flex items-center justify-between py-1.5 px-3 text-gray-500 dark:text-gray-400 text-[11px] font-mono">
                      <div className="flex items-center gap-1 min-w-0">
                        <User size={12} className="text-gray-400 shrink-0" />
                        <span className="truncate">
                          {submission?.surveyor_id
                            ? `#${submission.surveyor_id.slice(0, 8)}`
                            : 'Khảo sát viên ẩn danh'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <CalendarBlank size={12} />
                        <span>{formatDate(candidate.createdAt || submission?.captured_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* GIS Coordinates Card */}
                  <div className="p-3 rounded-xl border border-gray-200/80 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-900 dark:text-white">
                      <span>Vị trí tọa độ</span>
                      {hasValidLocation && (
                        <a
                          href={`https://www.google.com/maps?q=${lat},${lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#007b8b] dark:text-[#00c4de] hover:underline"
                        >
                          <span>Mở Google Maps</span>
                          <ArrowSquareOut size={12} />
                        </a>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                      <div className="p-2 rounded-lg bg-white dark:bg-black/20 border border-gray-200/60 dark:border-white/5">
                        <span className="text-[10px] text-gray-400 font-sans block">Vĩ độ</span>
                        <span className="font-bold text-gray-900 dark:text-white mt-0.5 block truncate">
                          {lat ? lat.toFixed(6) : '—'}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-white dark:bg-black/20 border border-gray-200/60 dark:border-white/5">
                        <span className="text-[10px] text-gray-400 font-sans block">Kinh độ</span>
                        <span className="font-bold text-gray-900 dark:text-white mt-0.5 block truncate">
                          {lng ? lng.toFixed(6) : '—'}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-white dark:bg-black/20 border border-gray-200/60 dark:border-white/5">
                        <span className="text-[10px] text-gray-400 font-sans block">Hướng nhìn</span>
                        <span className="font-bold text-gray-900 dark:text-white mt-0.5 flex items-center gap-1 truncate">
                          {direction != null ? (
                            <>
                              <NavigationArrow size={12} style={{ transform: `rotate(${direction}deg)` }} />
                              {direction}°
                            </>
                          ) : (
                            '—'
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-white dark:bg-black/20 border border-gray-200/60 dark:border-white/5 flex items-start gap-1.5 text-xs">
                      <MapPin size={14} className="text-red-500 shrink-0 mt-0.5" />
                      <span className="font-medium text-gray-800 dark:text-gray-200 truncate leading-snug">
                        {fullLocationText}
                      </span>
                    </div>
                  </div>

                  {/* AI Top 5 Remedies Ranking */}
                  <div className="p-3 rounded-xl border border-gray-200/80 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                        <Sparkle size={14} className="text-amber-500" />
                        Top 5 nhận diện của AI
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">
                        Độ ưu tiên: {candidate.activeLearningPriority?.toFixed(2) || '0.00'}
                      </span>
                    </div>

                    {possibleSigns && possibleSigns.length > 0 ? (
                      <div className="space-y-1">
                        {possibleSigns.slice(0, 5).map((p: any, idx: number) => {
                          const pCode = p.standardCode || p.signCode || '—'
                          const pName = p.nameVi || p.nameEn || pCode
                          const pConf = Math.round(Number(p.confidence || 0) * 100)

                          return (
                            <div
                              key={idx}
                              className={`flex items-center justify-between p-1.5 px-2.5 rounded-lg text-xs border ${
                                idx === 0
                                  ? 'bg-[#007b8b]/5 dark:bg-[#00c4de]/10 border-[#007b8b]/30 text-gray-900 dark:text-white font-semibold'
                                  : 'bg-white dark:bg-black/20 border-transparent text-gray-600 dark:text-gray-300'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-4 h-4 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center text-[10px] font-mono shrink-0">
                                  {idx + 1}
                                </span>
                                <span className="font-mono font-bold text-[#007b8b] dark:text-[#00c4de] shrink-0">
                                  {pCode}
                                </span>
                                <span className="truncate text-xs">{pName}</span>
                              </div>
                              <span className="font-mono font-bold text-[11px] shrink-0 ml-2">
                                {pConf}%
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="p-2 text-center text-xs text-gray-400 bg-white dark:bg-black/20 rounded-lg">
                        Chưa có bảng phân tích gợi ý từ mô hình
                      </div>
                    )}
                  </div>

                  {/* Community Consensus Tracker */}
                  <div className="p-3 rounded-xl border border-gray-200/80 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-900 dark:text-white">
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-[#007b8b] dark:text-[#00c4de]" />
                        <span>Tiến trình thẩm định cộng đồng</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-gray-600 dark:text-gray-300">
                        {data?.voteCount || 0} phiếu đã biểu quyết
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-white dark:bg-black/20 text-xs text-gray-600 dark:text-gray-300 flex items-start gap-2">
                      <CheckCircle size={14} className="text-blue-500 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                        Ứng viên đang trong hàng đợi thẩm định cộng đồng. Hệ thống cần đạt ngưỡng đồng thuận để tự động xuất bản lên bản đồ số.
                      </p>
                    </div>
                  </div>

                  {/* ─── INLINE ACTION FORMS ────────────────────────────── */}
                  {actionType === 'RECAPTURE' && (
                    <div className="p-3 rounded-xl border border-amber-300 dark:border-amber-500/40 bg-amber-50/70 dark:bg-amber-500/10 space-y-2.5 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                          <Camera size={14} />
                          Yêu cầu chụp lại ảnh hiện trường
                        </span>
                        <button
                          type="button"
                          onClick={() => setActionType(null)}
                          className="text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div>
                          <label className="text-[11px] text-gray-600 dark:text-gray-400 block mb-1 font-semibold">
                            Lý do yêu cầu chụp lại:
                          </label>
                          <select
                            value={recaptureReason}
                            onChange={(e) => setRecaptureReason(e.target.value)}
                            className="w-full text-xs p-2 rounded-lg border border-amber-200 dark:border-white/10 bg-white dark:bg-[#0A171C] dark:text-white cursor-pointer"
                          >
                            {RECAPTURE_REASONS.map((r) => (
                              <option key={r.value} value={r.value}>
                                {r.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] text-gray-600 dark:text-gray-400 block mb-1 font-semibold">
                            Ghi chú cho khảo sát viên:
                          </label>
                          <input
                            type="text"
                            value={recaptureNote}
                            onChange={(e) => setRecaptureNote(e.target.value)}
                            placeholder="Cần chụp rõ nét mã biển báo, tránh ngược sáng..."
                            className="w-full text-xs p-2 rounded-lg border border-amber-200 dark:border-white/10 bg-white dark:bg-[#0A171C] dark:text-white"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setActionType(null)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-white/10 dark:text-gray-300 cursor-pointer"
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={handleSendRecapture}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isSubmitting ? <ArrowsClockwise size={13} className="animate-spin" /> : <Camera size={13} />}
                          <span>Gửi yêu cầu chụp lại</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {actionType === 'ESCALATE' && (
                    <div className="p-3 rounded-xl border border-purple-300 dark:border-purple-500/40 bg-purple-50/70 dark:bg-purple-500/10 space-y-2.5 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                          <Flag size={14} />
                          Chuyển tiếp Admin điều tra
                        </span>
                        <button
                          type="button"
                          onClick={() => setActionType(null)}
                          className="text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <div className="text-xs">
                        <label className="text-[11px] text-gray-600 dark:text-gray-400 block mb-1 font-semibold">
                          Lý do chuyển tiếp điều tra:
                        </label>
                        <textarea
                          rows={2}
                          value={escalateNote}
                          onChange={(e) => setEscalateNote(e.target.value)}
                          placeholder="Nhập ghi chú chi tiết cho Quản trị viên..."
                          className="w-full text-xs p-2 rounded-lg border border-purple-200 dark:border-white/10 bg-white dark:bg-[#0A171C] dark:text-white"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setActionType(null)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-white/10 dark:text-gray-300 cursor-pointer"
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          disabled={isSubmitting || !escalateNote.trim()}
                          onClick={handleSendEscalate}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isSubmitting ? <ArrowsClockwise size={13} className="animate-spin" /> : <Flag size={13} />}
                          <span>Xác nhận chuyển tiếp</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ─── MODAL FOOTER ─────────────────────────────────────────── */}
          <div className="px-5 py-3 border-t border-gray-200 dark:border-white/10 flex items-center justify-between shrink-0 bg-gray-50/60 dark:bg-white/[0.02]">
            <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate max-w-[340px] sm:max-w-none">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Quyền can thiệp:</span> Yêu cầu chụp lại hoặc chuyển tiếp Admin điều tra khi có dấu hiệu bất thường.
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActionType(actionType === 'RECAPTURE' ? null : 'RECAPTURE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  actionType === 'RECAPTURE'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/25 border-amber-200 dark:border-amber-500/30'
                }`}
              >
                <Camera size={14} weight="bold" />
                <span>Yêu cầu chụp lại</span>
              </button>

              <button
                type="button"
                onClick={() => setActionType(actionType === 'ESCALATE' ? null : 'ESCALATE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  actionType === 'ESCALATE'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-500/25 border-purple-200 dark:border-purple-500/30'
                }`}
              >
                <Flag size={14} weight="bold" />
                <span>Chuyển tiếp Admin</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-gray-200 hover:bg-gray-300 dark:bg-white/10 dark:hover:bg-white/15 text-gray-800 dark:text-white transition-all cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>

        {/* ─── FULL-SCREEN IMAGE ZOOM OVERLAY ───────────────────────── */}
        {zoomedImage && (
          <div
            className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
            onClick={() => setZoomedImage(null)}
          >
            <img
              src={zoomedImage}
              alt="Phóng to ảnh bằng chứng"
              className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
            />
            <button
              type="button"
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/20 text-white hover:bg-white/30 cursor-pointer"
            >
              <X size={20} weight="bold" />
            </button>
          </div>
        )}
      </div>
    </ModalPortal>
  )
}
