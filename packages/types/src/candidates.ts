export type CandidateStatus = 'Chưa xử lý' | 'Đang xem xét' | 'Đã giải quyết' | 'Pending' | 'Approved' | 'Rejected' | 'Flagged'
export type PriorityLevel = 'Cao' | 'Vừa' | 'Thấp'

export interface CandidateItem {
  id: string
  name: string
  reportedDate: string
  reason: string
  priority: PriorityLevel
  status: CandidateStatus
  signCode?: string
  signName?: string
  anomalyType?: 'conflict' | 'low_conf' | 'gps_offset' | 'blur'
  location?: string
  surveyorName?: string
  aiConfidence?: number
  cropImageUrl?: string
  contextImageUrl?: string
  gpsOffset?: number
}

export interface CandidateAuditLogItem {
  id: string
  logKey: string
  time: string
  actor: string
}

export type FlagReasonCode =
  | 'blurry_lighting'
  | 'obstructed'
  | 'gps_spoofing'
  | 'duplicate'
  | 'qcvn_non_compliant'
  | 'fraud_suspicious'

export interface FlagSubmission {
  candidateId: string
  reasonCode: FlagReasonCode
  notes?: string
  timestamp: string
}

export interface CandidateToReview {
  id: string
  sourceTripId: string
  yoloTrackId: number
  code: string
  suggestedName: string
  category: 'P' | 'W' | 'R' | 'I' | 'S' | string
  confidence: number
  lat: number
  lng: number
  roadName: string
  directionHeading: number
  trafficFlowDirection: 'Northbound' | 'Southbound' | 'Eastbound' | 'Westbound' | string
  estimatedDistanceMeters: number
  cropImageUrl: string
  contextImageUrl: string
  status: 'Pending' | 'Approved' | 'Rejected' | 'Flagged'
  flagDetails?: FlagSubmission
}

export interface RevalidationCandidate {
  id: string
  signId: string
  code: string
  name: string
  category: 'P' | 'W' | 'R' | 'I' | 'S' | string
  roadName: string
  lat: number
  lng: number
  heading: number
  trafficFlowDirection: 'Northbound' | 'Southbound' | 'Eastbound' | 'Westbound' | string
  historicalRecord: {
    cropImageUrl: string
    contextImageUrl: string
    verifiedDate: string
    historicalCode: string
    historicalName: string
  }
  newSurveyRecord: {
    tripId: string
    capturedDate: string
    cropImageUrl: string
    contextImageUrl: string
    surveyorName: string
    aiDetectedCode: string
    aiConfidence: number
  }
  revalidationStatus: 'Pending' | 'Confirmed_Valid' | 'Confirmed_Changed' | 'Confirmed_Removed' | 'Flagged_Anomaly'
  decisionNotes?: string
  resolvedDate?: string
}

export interface ReviewHistoryItem {
  id: string
  candidateId: string
  signCode: string
  signName: string
  action: 'Approve' | 'Reject' | 'Modify' | 'Flag'
  originalLabel?: string
  modifiedLabel?: string
  timestamp: string
  cropImageUrl: string
  rewardCredits: number
}
