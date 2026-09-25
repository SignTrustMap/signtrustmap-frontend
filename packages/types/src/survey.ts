export interface ExtractedCandidateItem {
  id: string
  boxIndex: number
  code: string
  name: string
  category: 'P' | 'W' | 'R' | 'I' | 'S' | string
  confidence: number
  lat: number
  lng: number
  timestampSec: number
  cropUrl: string
  contextUrl: string
  isAccepted: boolean
  isFlagged: boolean
  customLabel?: string
  notes?: string
}

export interface SurveySubmissionItem {
  id: string
  title: string
  createdAt: string
  mediaType: 'VIDEO_GPX' | 'PHOTO_MANUAL' | string
  durationSec?: number
  distanceMeters?: number
  totalExtracted: number
  approvedCount: number
  rejectedCount: number
  rewardCredits: number
  status: 'PENDING_AI' | 'READY_FOR_REVIEW' | 'REVIEWED' | 'REJECTED' | string
  extractedCandidates: ExtractedCandidateItem[]
  gpxTrackPoints?: Array<{ lat: number; lng: number; time?: string; ele?: number }>
}

export interface SurveySubmission {
  id: string
  title: string
  userId: string
  status: string
  createdAt: string
  candidatesCount: number
}
