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
  category: 'P' | 'W' | 'R' | 'I' | 'S'
  confidence: number
  lat: number
  lng: number
  roadName: string
  directionHeading: number
  trafficFlowDirection: 'Northbound' | 'Southbound' | 'Eastbound' | 'Westbound'
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
  category: 'P' | 'W' | 'R' | 'I' | 'S'
  roadName: string
  lat: number
  lng: number
  heading: number
  trafficFlowDirection: 'Northbound' | 'Southbound' | 'Eastbound' | 'Westbound'
  historicalRecord: {
    cropImageUrl: string
    contextImageUrl: string
    verifiedDate: string
    trustScore: number
    condition: string
  }
  newSurveyRecord: {
    tripId: string
    surveyDate: string
    cropImageUrl: string
    contextImageUrl: string
    surveyorTrustScore: number
    observedChange: string
  }
  status: 'Pending' | 'Confirmed' | 'Updated' | 'Retired' | 'Unclear' | 'Invalid'
}

export interface ReviewHistoryItem {
  id: string
  candidateId: string
  signCode: string
  signName: string
  action: 'Approved' | 'Rejected' | 'Corrected' | 'Flagged' | 'Confirmed' | 'Updated' | 'Retired' | 'Unclear'
  timestamp: string
  details?: string
  mode: 'candidate' | 'revalidation'
}

export const mockReviewCandidates: CandidateToReview[] = [
  {
    id: 'CAND-0981',
    sourceTripId: 'SURV-2026-001',
    yoloTrackId: 104,
    code: 'P.102',
    suggestedName: 'Cấm đi ngược chiều',
    category: 'P',
    confidence: 0.965,
    lat: 10.7612,
    lng: 106.6894,
    roadName: 'Vo Van Kiet Blvd / Tran Dinh Xu Intersection',
    directionHeading: 245,
    trafficFlowDirection: 'Westbound',
    estimatedDistanceMeters: 14.2,
    cropImageUrl: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=400&auto=format&fit=crop&q=80',
    contextImageUrl: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&auto=format&fit=crop&q=80',
    status: 'Pending',
  },
  {
    id: 'CAND-0982',
    sourceTripId: 'SURV-2026-001',
    yoloTrackId: 118,
    code: 'P.127',
    suggestedName: 'Tốc độ tối đa cho phép 60 km/h',
    category: 'P',
    confidence: 0.912,
    lat: 10.7584,
    lng: 106.6782,
    roadName: 'Vo Van Kiet Corridor - Segment 4',
    directionHeading: 250,
    trafficFlowDirection: 'Westbound',
    estimatedDistanceMeters: 18.5,
    cropImageUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&auto=format&fit=crop&q=80',
    contextImageUrl: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&auto=format&fit=crop&q=80',
    status: 'Pending',
  },
  {
    id: 'CAND-0983',
    sourceTripId: 'SURV-2026-003',
    yoloTrackId: 205,
    code: 'P.103a',
    suggestedName: 'Cấm ô tô',
    category: 'P',
    confidence: 0.624, // High Uncertainty sample for Active Learning
    lat: 10.8231,
    lng: 106.6912,
    roadName: 'Pham Van Dong Boulevard - Section 2',
    directionHeading: 60,
    trafficFlowDirection: 'Eastbound',
    estimatedDistanceMeters: 12.0,
    cropImageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&auto=format&fit=crop&q=80',
    contextImageUrl: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&auto=format&fit=crop&q=80',
    status: 'Pending',
  },
  {
    id: 'CAND-0984',
    sourceTripId: 'SURV-2026-004',
    yoloTrackId: 310,
    code: 'W.201a',
    suggestedName: 'Chỗ ngoặt nguy hiểm vòng bên trái',
    category: 'W',
    confidence: 0.582, // High Uncertainty sample for Active Learning
    lat: 10.7834,
    lng: 106.6978,
    roadName: 'Nguyen Thi Minh Khai / Le Quy Don',
    directionHeading: 140,
    trafficFlowDirection: 'Southbound',
    estimatedDistanceMeters: 9.8,
    cropImageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=400&auto=format&fit=crop&q=80',
    contextImageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
    status: 'Pending',
  },
  {
    id: 'CAND-0985',
    sourceTripId: 'SURV-2026-005',
    yoloTrackId: 412,
    code: 'R.301a',
    suggestedName: 'Hướng đi phải theo - Đi thẳng',
    category: 'R',
    confidence: 0.948,
    lat: 10.7725,
    lng: 106.6981,
    roadName: 'Nguyen Hue Walking Street Junction',
    directionHeading: 110,
    trafficFlowDirection: 'Eastbound',
    estimatedDistanceMeters: 16.4,
    cropImageUrl: 'https://images.unsplash.com/photo-1508974239320-0a029497e820?w=400&auto=format&fit=crop&q=80',
    contextImageUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&auto=format&fit=crop&q=80',
    status: 'Pending',
  },
]

export const mockRevalidationCandidates: RevalidationCandidate[] = [
  {
    id: 'REVAL-0101',
    signId: 'SIGN-VN-7729',
    code: 'P.102',
    name: 'Cấm đi ngược chiều',
    category: 'P',
    roadName: 'Hai Ba Trung & Le Duan Intersection',
    lat: 10.7812,
    lng: 106.6985,
    heading: 180,
    trafficFlowDirection: 'Southbound',
    historicalRecord: {
      cropImageUrl: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=400&auto=format&fit=crop&q=80',
      contextImageUrl: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&auto=format&fit=crop&q=80',
      verifiedDate: '2025-11-14',
      trustScore: 98,
      condition: 'Rõ ràng, nguyên vẹn, sơn phản quang tốt',
    },
    newSurveyRecord: {
      tripId: 'SURV-2026-042',
      surveyDate: '2026-09-02',
      cropImageUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&auto=format&fit=crop&q=80',
      contextImageUrl: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&auto=format&fit=crop&q=80',
      surveyorTrustScore: 94,
      observedChange: 'Biển vẫn gắn trên cột, mặt biển có vết trầy xước nhẹ ở góc dưới bên phải',
    },
    status: 'Pending',
  },
  {
    id: 'REVAL-0102',
    signId: 'SIGN-VN-8841',
    code: 'P.124a',
    name: 'Cấm quay đầu xe',
    category: 'P',
    roadName: 'Dien Bien Phu Corridor - Near Da Kao Bridge',
    lat: 10.7915,
    lng: 106.6942,
    heading: 45,
    trafficFlowDirection: 'Northbound',
    historicalRecord: {
      cropImageUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&auto=format&fit=crop&q=80',
      contextImageUrl: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&auto=format&fit=crop&q=80',
      verifiedDate: '2025-08-20',
      trustScore: 95,
      condition: 'Biển cắm ở dải phân cách giữa',
    },
    newSurveyRecord: {
      tripId: 'SURV-2026-049',
      surveyDate: '2026-09-05',
      cropImageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&auto=format&fit=crop&q=80',
      contextImageUrl: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&auto=format&fit=crop&q=80',
      surveyorTrustScore: 91,
      observedChange: 'Cột biển đã bị tháo dỡ do đang thi công mở rộng lòng đường',
    },
    status: 'Pending',
  },
]

export const mockReviewerMetrics = {
  reliabilityScore: 0.98,
  consensusAccuracy: 99.1,
  accuracyPercent: 99.1,
  totalReviewed: 312,
  approvedCount: 285,
  rejectedCount: 22,
  creditsEarned: 890,
}

export const mockReviewSessionHistory: ReviewHistoryItem[] = [
  {
    id: 'HIST-101',
    candidateId: 'CAND-0980',
    signCode: 'P.102',
    signName: 'Cấm đi ngược chiều',
    action: 'Approved',
    timestamp: '14:25',
    mode: 'candidate',
  },
  {
    id: 'HIST-102',
    candidateId: 'REVAL-004',
    signCode: 'W.201',
    signName: 'Chỗ ngoặt nguy hiểm vòng bên trái',
    action: 'Confirmed',
    timestamp: '14:18',
    details: 'Revalidation: CONFIRM (Võ Văn Kiệt)',
    mode: 'revalidation',
  },
  {
    id: 'HIST-103',
    candidateId: 'CAND-0979',
    signCode: 'P.127',
    signName: 'Tốc độ tối đa cho phép (50km/h)',
    action: 'Corrected',
    timestamp: '14:10',
    details: 'Corrected: P.127',
    mode: 'candidate',
  },
]
