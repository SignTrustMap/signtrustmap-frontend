/**
 * Navigation, Routing, and Spatial Places Domain Types
 * Single Source of Truth shared between apps and services.
 */

export type VehicleModeId = 'DRIVING' | 'BIKE'

export interface VehicleMode {
  id: VehicleModeId
  label: string
}

export type MapCoordinate = [longitude: number, latitude: number]

export interface RoutePointDto {
  latitude: number
  longitude: number
}

export interface NavigationManeuver {
  location?: [longitude: number, latitude: number]
  type: string
}

export interface NavigationStep {
  distance: number
  duration: number
  instruction: string
  maneuver: NavigationManeuver
  name: string
}

export interface NavigationRoute {
  coordinates: [longitude: number, latitude: number][]
  geometry: RoutePointDto[]
  distance: number // in meters
  duration: number // in seconds
  steps: NavigationStep[]
}

export interface VerifiedMapSign {
  id: string
  latitude: number
  longitude: number
  signCropUrl: string
  signType: {
    signCode: string
    nameEn: string
    nameVi?: string
  }
}

export interface FindSignsInBoundsParams {
  minLat: number
  minLon: number
  maxLat: number
  maxLon: number
  limit?: number
}

export interface FindSignsInBoundsResponse {
  signs: VerifiedMapSign[]
  count?: number
}

export interface RouteSign {
  id: string
  coordinate: [longitude: number, latitude: number]
  imageUrl: string
  actualCropUrl?: string
  name: string
  signCode: string
  category?: 'WARNING' | 'PROHIBITORY' | 'MANDATORY' | 'INFORMATION' | 'TEMPORARY' | 'OTHER'
}

export interface ApiPlace {
  id: string
  title: string
  address: string | null
  latitude: number | null
  longitude: number | null
  type: 'recent' | 'saved'
}

export interface SavedPlace {
  id: string
  label: string
  address: string
  latitude: number
  longitude: number
  placeType?: string
}

export interface RecentSearch {
  id: string
  query: string
  address: string | null
  latitude: number | null
  longitude: number | null
  createdAt?: string
}

export interface SpatialSearchResult {
  communeCode: string
  communeName: string
  displayName: string
  latitude: number
  longitude: number
  provinceName: string
}

export interface DirectionsRawResponse {
  shortestPath: {
    distanceMeters: number
    durationSeconds: number
    geometry: { latitude: number; longitude: number }[]
    steps: {
      distanceMeters: number
      durationSeconds: number
      geometry: { latitude: number; longitude: number }[]
      instruction: string
      roadName: string | null
      type: string
    }[]
  }
}
