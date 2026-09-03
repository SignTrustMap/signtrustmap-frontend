export interface CandidateToReview {
  id: string
  sourceTripId: string
  yoloTrackId: number
  code: string
  suggestedName: string
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
}

export const mockReviewCandidates: CandidateToReview[] = [
  {
    id: 'CAND-0981',
    sourceTripId: 'SURV-2026-001',
    yoloTrackId: 104,
    code: 'P.102',
    suggestedName: 'Cấm đi ngược chiều',
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
    confidence: 0.884,
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
]

export const mockReviewerMetrics = {
  reliabilityScore: 0.98,
  accuracyPercent: 99.1,
  totalReviewed: 312,
  approvedCount: 285,
  rejectedCount: 22,
  creditsEarned: 890,
}
