export type SignCategoryCode = 'P' | 'R' | 'W' | 'I' | 'S'
export type SignStatus = 'verified' | 'pending' | 'flagged' | 'revalidating'

export interface SignItem {
  id: string
  code: string
  name: string
  category: SignCategoryCode
  lat: number
  lng: number
  heading?: number
  trustScore?: number
  status: SignStatus | string
  location?: string
  verifiedAt?: string
  imageUrl?: string
  actualCropUrl?: string
  scenePhotoUrl?: string
  description?: string
  detectedBy?: string
  aiConfidence?: number
}

export interface OpsSignItem extends SignItem {
  category: SignCategoryCode
  status: SignStatus
  heading: number
  trustScore: number
  location: string
  reviewerVotes: { approve: number; reject: number; modify: number }
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

// ─── FastAPI GIS GeoJSON Schemas (/api/v1/spatial/signs) ───────────────────
export interface GeoJSONPointGeometry {
  type: 'Point'
  coordinates: [number, number] // [longitude, latitude]
}

export interface GeoJSONSignProperties {
  id: string
  signTypeId: number
  categoryId: number
  signCode: string
  nameVi: string
  nameEn: string
  trafficDirection: number | null
  signCropUrl: string | null
  status: string
  freshnessScore: number
  lastVerifiedAt: string | null
}

export interface GeoJSONSignFeature {
  type: 'Feature'
  geometry: GeoJSONPointGeometry
  properties: GeoJSONSignProperties
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection'
  features: GeoJSONSignFeature[]
  total: number
}

export interface SpatialSignsQueryParams {
  min_lat: number
  min_lon: number
  max_lat: number
  max_lon: number
  sign_type_id?: number
  category_id?: number
}

export function mapGeoJSONFeatureToSignItem(feature: GeoJSONSignFeature): SignItem {
  const [lng, lat] = feature.geometry.coordinates
  const p = feature.properties

  let category: 'P' | 'R' | 'W' | 'I' | 'S' = 'P'
  if (p.signCode?.startsWith('P')) category = 'P'
  else if (p.signCode?.startsWith('W')) category = 'W'
  else if (p.signCode?.startsWith('R')) category = 'R'
  else if (p.signCode?.startsWith('I')) category = 'I'
  else if (p.signCode?.startsWith('S')) category = 'S'
  else if (p.categoryId === 2) category = 'W'
  else if (p.categoryId === 3) category = 'R'
  else if (p.categoryId === 4) category = 'I'
  else if (p.categoryId === 5) category = 'S'

  return {
    id: p.id,
    code: p.signCode || 'UNKNOWN',
    name: p.nameVi || p.nameEn || 'Biển báo giao thông',
    category,
    lat,
    lng,
    heading: typeof p.trafficDirection === 'number' ? p.trafficDirection : 0,
    trustScore: Math.round((p.freshnessScore ?? 0.95) * 1000) / 10,
    status: p.status === 'ACTIVE' ? 'verified' : 'pending',
    location: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    verifiedAt: p.lastVerifiedAt ? new Date(p.lastVerifiedAt).toLocaleDateString('vi-VN') : '',
    imageUrl: p.signCropUrl || undefined,
  }
}

export function mapGeoJSONFeatureToOpsSignItem(feature: GeoJSONSignFeature): OpsSignItem {
  const base = mapGeoJSONFeatureToSignItem(feature)
  const p = feature.properties
  const category: SignCategoryCode = (['P', 'R', 'W', 'I', 'S'].includes(base.category)
    ? base.category
    : 'P') as SignCategoryCode

  const status: SignStatus = p.status === 'ACTIVE' ? 'verified' : 'pending'

  return {
    ...base,
    category,
    status,
    heading: typeof p.trafficDirection === 'number' ? p.trafficDirection : 0,
    trustScore: Math.round((p.freshnessScore ?? 0.95) * 1000) / 10,
    location: base.location || `${base.lat.toFixed(4)}, ${base.lng.toFixed(4)}`,
    reviewerVotes: { approve: 12, reject: 1, modify: 0 },
    aiConfidence: Math.round((p.freshnessScore ?? 0.95) * 100),
    verifiedAt: base.verifiedAt || new Date().toLocaleDateString('vi-VN'),
    imageUrl: p.signCropUrl || '/traffic-signs/default.png',
    detectedBy: 'FastAPI GIS / AI Engine',
  }
}

