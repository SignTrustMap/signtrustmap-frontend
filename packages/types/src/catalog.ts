export type CatalogCategory =
  | 'prohibitory'
  | 'warning'
  | 'mandatory'
  | 'guide'
  | 'speed_limit'
  | 'additional'

export interface CatalogEntry {
  id: string
  code: string
  name: string
  nameVi: string
  nameEn: string
  category: CatalogCategory
  shape: 'Circle' | 'Triangle' | 'Rectangle' | 'Octagon' | 'Diamond'
  color: 'Red-White' | 'Yellow-Black' | 'Blue-White' | 'Green-White' | 'Black-White' | string
  description: string
  descriptionVi: string
  descriptionEn: string
  guidelines?: string
  aiPrompt: string
  clipPrompt?: string
  osmMapping: string
  standardRef?: string
  status: 'Active' | 'Deprecated' | 'Draft'
  version: string
}

export interface MissingSignTypeReport {
  id: string
  tempLabel: string
  category: string
  sampleImageUrl: string
  reportedBy: string
  reportedAt: string
  lat: number
  lng: number
  roadAddress?: string
  aiConfidence?: number
  clipPrompt?: string
  priority?: 'Cao' | 'Vừa' | 'Thấp'
  reporterNote: string
  similarCatalogEntries: string[]
  status: 'Open' | 'Approved' | 'Rejected' | 'Merged'
}

export interface AvailableSignOption {
  code: string
  nameKey: string
  codeTitle: string
}

export interface TrafficCatalogSign {
  id: string
  code: string
  nameVi: string
  nameEn: string
  category: string
  meaning: string
  image: string
  penaltyInfo?: string
  penaltyAmount?: string
  qcvnReference?: string
}

export interface SignCategory {
  id: string
  name: string
  count?: number
  color?: string
}
