export interface SignItem {
  id: string
  code: string
  name: string
  category: 'P' | 'R' | 'W' | 'I' | 'S' | string
  lat: number
  lng: number
  heading?: number
  trustScore?: number
  status: 'verified' | 'pending' | 'flagged' | 'revalidating' | string
  location?: string
  verifiedAt?: string
  imageUrl?: string
  description?: string
  detectedBy?: string
  aiConfidence?: number
}

export interface OpsSignItem extends SignItem {
  heading: number
  trustScore: number
  location: string
  reviewerVotes?: { approve: number; reject: number; modify: number }
  aiConfidence: number
  verifiedAt: string
  imageUrl: string
  detectedBy: string
}

export interface TrafficSignItem {
  id: string
  code: string
  name: string
  category: string
  latitude: number
  longitude: number
  trustScore: number
  status: string
  imageUrl?: string
  createdAt?: string
}

export interface SignGroupFilterItem {
  id: string
  nameKey: string
  color: string
}
