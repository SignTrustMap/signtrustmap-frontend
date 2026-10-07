import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type {
  DirectionsRawResponse,
  NavigationRoute,
  NavigationStep,
  RoutePointDto,
  RouteSign,
  VehicleMode,
  VehicleModeId,
  VerifiedMapSign,
} from '@shared/types'
import { toRouteSign } from '@/features/map/utils/signUrlHelpers'

export const navigationService = {
  /**
   * Fetch available vehicle modes (Driving, Bike).
   */
  getVehicleModes: async (): Promise<VehicleMode[]> => {
    try {
      const response = await apiClient.get<any, { modes?: VehicleMode[] }>(
        API_ENDPOINTS.NAVIGATION.VEHICLE_MODES
      )
      if (response?.modes && response.modes.length > 0) {
        return response.modes
      }
      return [
        { id: 'DRIVING', label: 'Ô tô' },
        { id: 'BIKE', label: 'Xe máy' },
      ]
    } catch {
      return [
        { id: 'DRIVING', label: 'Ô tô' },
        { id: 'BIKE', label: 'Xe máy' },
      ]
    }
  },

  /**
   * Calculate turn-by-turn routing directions between origin and destination coordinates.
   */
  getDirections: async (
    origin: [longitude: number, latitude: number],
    destination: [longitude: number, latitude: number],
    vehicleMode?: VehicleModeId
  ): Promise<NavigationRoute> => {
    const mappedMode = vehicleMode === 'BIKE' ? 'CYCLING' : 'DRIVING'
    const payload = {
      originLatitude: origin[1],
      originLongitude: origin[0],
      destinationLatitude: destination[1],
      destinationLongitude: destination[0],
      vehicleMode: mappedMode,
      maxAlternatives: 0,
    }

    const response = await apiClient.post<any, DirectionsRawResponse>(
      API_ENDPOINTS.NAVIGATION.ROUTING_DIRECTIONS,
      payload
    )

    const shortest = response?.shortestPath
    if (!shortest) {
      throw new Error('Không thể tìm thấy tuyến đường phù hợp.')
    }

    const coordinates = shortest.geometry.map(
      (pt): [number, number] => [pt.longitude, pt.latitude]
    )

    const steps: NavigationStep[] = shortest.steps.map((st) => ({
      distance: st.distanceMeters,
      duration: st.durationSeconds,
      instruction: st.instruction,
      maneuver: {
        location: st.geometry[0]
          ? [st.geometry[0].longitude, st.geometry[0].latitude]
          : undefined,
        type: st.type,
      },
      name: st.roadName ?? '',
    }))

    return {
      coordinates,
      geometry: shortest.geometry,
      distance: shortest.distanceMeters,
      duration: shortest.durationSeconds,
      steps,
    }
  },

  /**
   * Fetch verified traffic signs situated along a planned route geometry corridor.
   */
  getSignsAlongRoute: async (geometry: RoutePointDto[]): Promise<RouteSign[]> => {
    if (!geometry || geometry.length < 2) return []

    try {
      const response = await apiClient.post<any, { signs: { sign: VerifiedMapSign }[] }>(
        API_ENDPOINTS.NAVIGATION.SIGNS_ALONG_ROUTE,
        { geometry }
      )

      if (Array.isArray(response?.signs)) {
        return response.signs.map((item) => toRouteSign(item.sign))
      }
      return []
    } catch (err) {
      console.warn('[Navigation] Could not load signs along route:', err)
      return []
    }
  },
}
