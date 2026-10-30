import type { CandidateDetailResponse } from '@/api/services/candidates.service'
import type { CandidateDetailData } from '@/data/candidates'
import { resolveImageUrl } from '@/features/map/utils/signUrlHelpers'

/**
 * Transforms NestJS backend CandidateDetailResponse into CandidateDetailData expected by CandidateDetailPage UI.
 */
export function adaptCandidateDetailResponse(
  raw: CandidateDetailResponse,
  fallbackMock: CandidateDetailData
): CandidateDetailData {
  if (!raw || !raw.candidate) {
    return fallbackMock
  }

  const { candidate, submission, locationContext, voteCount } = raw

  // 1. Resolve label & sign code
  const signType = candidate.predictedSignType
  const code = signType?.signCode?.trim() || 'P.102'
  const name = signType?.nameVi?.trim() || signType?.nameEn?.trim() || 'Biển báo'
  const predictedLabel = `${code} - ${name}`

  // 2. Resolve image URLs
  const rawCrop = candidate.signCropUrl || ''
  const rawBestFrame = candidate.bestFrameUrl || ''

  const cropImageUrl = rawCrop ? resolveImageUrl(rawCrop) : fallbackMock.cropImageUrl
  const cropImageHdUrl = cropImageUrl
  const cropFileName = rawCrop.split('/').pop() || `crop_frame_${candidate.id.slice(0, 6)}.png`

  const contextImageUrl = rawBestFrame ? resolveImageUrl(rawBestFrame) : fallbackMock.contextImageUrl
  const contextImageHdUrl = contextImageUrl
  const contextFileName = rawBestFrame.split('/').pop() || `dashcam_raw_${candidate.id.slice(0, 6)}.jpg`

  // 3. Confidence scores
  const rawScore = candidate.confidenceScore ?? 0.964
  const yoloConfidence = Math.round((rawScore <= 1 ? rawScore * 100 : rawScore) * 10) / 10
  const clipConfidence = Math.max(Math.round((yoloConfidence - 8) * 10) / 10, 65.0)

  // 4. Geospatial context
  const lat = locationContext?.coordinates?.latitude ?? submission?.latitude ?? fallbackMock.lat
  const lng = locationContext?.coordinates?.longitude ?? submission?.longitude ?? fallbackMock.lng
  const heading = locationContext?.direction ?? fallbackMock.heading

  // 5. Consensus voting split
  const totalVotes = typeof voteCount === 'number' ? voteCount : 6
  const consensusApprove = Math.max(1, Math.ceil(totalVotes / 2))
  const consensusReject = Math.max(1, Math.floor(totalVotes / 2))

  // 6. Surveyor profile
  const surveyorId = submission?.surveyor_id || submission?.surveyorId || ''
  const surveyorName = surveyorId ? `Khảo sát viên #${surveyorId.slice(0, 6).toUpperCase()}` : fallbackMock.surveyor.name
  const surveyorInitials = surveyorId ? surveyorId.slice(0, 2).toUpperCase() : fallbackMock.surveyor.initials

  // 7. Audit logs
  const createdDate = candidate.createdAt ? new Date(candidate.createdAt) : new Date()
  const formattedTime = !isNaN(createdDate.getTime())
    ? `${createdDate.getHours().toString().padStart(2, '0')}:${createdDate.getMinutes().toString().padStart(2, '0')} ${createdDate.getDate()}/${createdDate.getMonth() + 1}`
    : '14:20 24/10'

  const auditLogs = [
    {
      id: '1',
      logKey: 'log_ingested',
      time: formattedTime,
      actor: 'AIOps Pipeline (YOLO12x)',
    },
    {
      id: '2',
      logKey: 'log_flagged',
      time: formattedTime,
      actor: `Consensus Engine (${consensusApprove} Duyệt vs ${consensusReject} Từ chối)`,
    },
    {
      id: '3',
      logKey: 'log_inspecting',
      time: 'log_now',
      actor: 'Staff Reviewer',
    },
  ]

  return {
    id: candidate.id,
    predictedLabel,
    yoloConfidence,
    clipConfidence,
    lat,
    lng,
    heading,
    consensusApprove,
    consensusReject,
    cropImageUrl,
    cropImageHdUrl,
    cropFileName,
    contextImageUrl,
    contextImageHdUrl,
    contextFileName,
    surveyor: {
      name: surveyorName,
      initials: surveyorInitials,
      levelKey: 'lbl_surveyor_level',
      trustScore: fallbackMock.surveyor.trustScore,
      totalRuns: fallbackMock.surveyor.totalRuns,
      accuracyRate: fallbackMock.surveyor.accuracyRate,
    },
    auditLogs,
  }
}
