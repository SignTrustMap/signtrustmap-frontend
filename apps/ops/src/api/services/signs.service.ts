import { apiClient, http, type ApiResponse } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import {
  type SignItem,
  type SpatialSignsQueryParams,
  type FindSignsInBoundsParams,
  type RouteSign,
  type VerifiedMapSign,
  mapGeoJSONFeatureToSignItem,
} from '@shared/types'
import { toRouteSign } from '@/features/map/utils/signUrlHelpers'

export interface TrafficSignItem {
  id: string
  code: string
  name: string
  category: string
  lat: number
  lng: number
  confidence: number
  status: 'Verified' | 'Unverified' | 'PendingReview'
  imageUrl?: string
  lastVerifiedAt?: string
}

export interface SignsFilterParams {
  category?: string
  status?: string
  bounds?: string
  limit?: number
}

export const signsService = {
  /**
   * Fetch verified traffic signs within bounding box coordinates from NestJS backend (/signs).
   * Exact endpoint used by mobile app.
   */
  getSignsInBounds: async (bounds: FindSignsInBoundsParams): Promise<RouteSign[]> => {
    try {
      const params = new URLSearchParams({
        minLat: String(bounds.minLat),
        minLon: String(bounds.minLon),
        maxLat: String(bounds.maxLat),
        maxLon: String(bounds.maxLon),
      })
      if (bounds.limit) params.set('limit', String(bounds.limit))

      const response = await apiClient.get<any, { signs?: VerifiedMapSign[]; count?: number }>(
        `${API_ENDPOINTS.NAVIGATION.SIGNS_IN_BOUNDS}?${params.toString()}`
      )

      if (Array.isArray(response?.signs)) {
        return response.signs.map(toRouteSign)
      }
      return []
    } catch (err) {
      console.warn('[Signs] Failed to fetch signs in bounds from NestJS backend:', err)
      return []
    }
  },

  /**
   * Phương án 1: Query FastAPI GIS (/api/v1/spatial/signs) with dynamic viewport bounding box.
   * Returns GeoJSON FeatureCollection and maps to SignItem[].
   */
  getSpatialSigns: async (params: SpatialSignsQueryParams): Promise<SignItem[]> => {
    try {
      const response = await apiClient.get<any, any>(
        API_ENDPOINTS.SIGNS.MAP,
        { params }
      )
      const features = response?.features || response?.data?.features
      if (Array.isArray(features)) {
        return features.map(mapGeoJSONFeatureToSignItem)
      }
      return []
    } catch (err) {
      console.warn('[SpatialGIS] Failed to fetch signs in viewport from backend:', err)
      throw err
    }
  },

  /**
   * Fetch published signs within map boundaries or filters
   */
  getSigns: (params?: SignsFilterParams) => {
    return http.get<ApiResponse<TrafficSignItem[]>>(API_ENDPOINTS.SIGNS.MAP, { params })
  },

  /**
   * Get detail of a specific traffic sign
   */
  getSignDetail: (id: string) => {
    return http.get<ApiResponse<TrafficSignItem>>(API_ENDPOINTS.SIGNS.DETAIL(id))
  },

  /**
   * Get nearby signs around current coordinates
   */
  getNearby: (lat: number, lng: number, radiusKm: number = 2) => {
    return http.get<ApiResponse<TrafficSignItem[]>>(API_ENDPOINTS.SIGNS.NEARBY, {
      params: { lat, lng, radius: radiusKm },
    })
  },

  /**
   * Report an issue on a sign (damaged, missing, incorrect)
   */
  reportIssue: (id: string, payload: { issueType: string; description: string; imageUrl?: string }) => {
    return http.post<ApiResponse<{ reportId: string }>>(API_ENDPOINTS.SIGNS.REPORT_ISSUE(id), payload)
  },
}
