export interface OpsSignItem {
  id: string
  code: string
  name: string
  category: 'P' | 'R' | 'W' | 'I' | 'S'
  lat: number
  lng: number
  heading: number
  trustScore: number
  status: 'verified' | 'pending' | 'flagged' | 'revalidating'
  location: string
  reviewerVotes: { approve: number; reject: number; modify: number }
  aiConfidence: number
  verifiedAt: string
  imageUrl: string
  detectedBy: string
}

export interface SignGroupFilterItem {
  id: string
  nameKey: string
  color: string
}

export const signGroupFilters: SignGroupFilterItem[] = [
  { id: 'all', nameKey: 'cat_all', color: 'bg-gray-500' },
  { id: 'P', nameKey: 'cat_prohibition', color: 'bg-red-500' },
  { id: 'W', nameKey: 'cat_warning', color: 'bg-amber-500' },
  { id: 'R', nameKey: 'cat_mandatory', color: 'bg-blue-500' },
  { id: 'I', nameKey: 'cat_information', color: 'bg-emerald-500' },
]

export const mockOpsSigns: OpsSignItem[] = [
  {
    id: 'sgn-01',
    code: 'P.102',
    name: 'Cấm đi ngược chiều',
    category: 'P',
    lat: 10.7769,
    lng: 106.7009,
    heading: 180,
    trustScore: 99.4,
    status: 'verified',
    location: 'Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM',
    reviewerVotes: { approve: 8, reject: 0, modify: 0 },
    aiConfidence: 98.2,
    verifiedAt: '12/08/2026',
    imageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80',
    detectedBy: 'YOLO12 + BoT-SORT (Survey #482)',
  },
  {
    id: 'sgn-02',
    code: 'P.127',
    name: 'Tốc độ tối đa cho phép (50 km/h)',
    category: 'P',
    lat: 10.7725,
    lng: 106.698,
    heading: 90,
    trustScore: 98.7,
    status: 'verified',
    location: 'Đường Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM',
    reviewerVotes: { approve: 6, reject: 0, modify: 1 },
    aiConfidence: 96.5,
    verifiedAt: '15/08/2026',
    imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500&auto=format&fit=crop&q=80',
    detectedBy: 'YOLO12 + CLIP (Survey #510)',
  },
  {
    id: 'sgn-03',
    code: 'R.301a',
    name: 'Hướng đi phải theo (Đi thẳng)',
    category: 'R',
    lat: 10.7801,
    lng: 106.6995,
    heading: 0,
    trustScore: 95.1,
    status: 'verified',
    location: 'Đường Pasteur, Phường Võ Thị Sáu, Quận 3, TP.HCM',
    reviewerVotes: { approve: 5, reject: 0, modify: 0 },
    aiConfidence: 94.8,
    verifiedAt: '20/08/2026',
    imageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80',
    detectedBy: 'YOLO12 (Survey #523)',
  },
  {
    id: 'sgn-04',
    code: 'W.207a',
    name: 'Giao nhau với đường không ưu tiên',
    category: 'W',
    lat: 10.768,
    lng: 106.693,
    heading: 270,
    trustScore: 78.4,
    status: 'flagged',
    location: 'Đường Trần Hưng Đạo, Phường Phạm Ngũ Lão, Quận 1, TP.HCM',
    reviewerVotes: { approve: 3, reject: 3, modify: 0 },
    aiConfidence: 81.2,
    verifiedAt: '24/10/2026',
    imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500&auto=format&fit=crop&q=80',
    detectedBy: 'GPS Anomaly Flag (Offset > 40m)',
  },
  {
    id: 'sgn-05',
    code: 'I.401',
    name: 'Bắt đầu đường ưu tiên',
    category: 'I',
    lat: 10.785,
    lng: 106.705,
    heading: 45,
    trustScore: 62.0,
    status: 'revalidating',
    location: 'Đường Hai Bà Trưng, Phường Tân Định, Quận 1, TP.HCM',
    reviewerVotes: { approve: 1, reject: 0, modify: 0 },
    aiConfidence: 89.0,
    verifiedAt: '10/02/2026 (Stale > 180d)',
    imageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80',
    detectedBy: 'Revalidation Scheduler',
  },
]
