import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type {
  ApiPlace,
  RecentSearch,
  SavedPlace,
  SpatialSearchResult,
} from '@shared/types'

export const placesService = {
  /**
   * Search administrative units, communes, or addresses by keywords.
   */
  /**
   * Search administrative units, POIs, streets, or addresses by keywords.
   * Uses a resilient hybrid strategy:
   * 1. Photon Geocoding API strictly bounded to Vietnam (bbox 102.14, 8.18 to 109.46, 23.39)
   * 2. Internal spatial administrative search (/api/v1/addresses/search)
   */
  searchAddresses: async (query: string, limit = 10): Promise<ApiPlace[]> => {
    const trimmed = query.trim()
    if (trimmed.length < 2) return []

    const places: ApiPlace[] = []
    const seenCoordinates = new Set<string>()

    // Run Photon (Vietnam-bounded) and Backend spatial search in parallel
    const [photonRes, backendRes] = await Promise.allSettled([
      fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(
          trimmed
        )}&limit=${limit}&lat=10.7769&lon=106.7009&bbox=102.14,8.18,109.46,23.39`
      )
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null),

      apiClient
        .get<any, SpatialSearchResult[]>(
          `${API_ENDPOINTS.NAVIGATION.ADDRESS_SEARCH}?q=${encodeURIComponent(trimmed)}&limit=${limit}`
        )
        .then((res) => (Array.isArray(res) ? res : []))
        .catch(() => [] as SpatialSearchResult[]),
    ])

    // 1. Process Photon results (strictly Vietnam only)
    if (photonRes.status === 'fulfilled' && photonRes.value?.features) {
      const features = photonRes.value.features
      for (const f of features) {
        const props = f.properties || {}
        const coords = f.geometry?.coordinates

        // Filter strictly to Vietnam
        const isVietnam =
          props.countrycode === 'VN' ||
          props.country === 'Việt Nam' ||
          props.country === 'Vietnam' ||
          !props.countrycode

        if (!isVietnam || !coords || coords.length < 2) continue

        const lon = coords[0]
        const lat = coords[1]
        // Check coordinates boundary of Vietnam (lat 8.0 - 24.0, lon 102.0 - 110.0)
        if (lat < 8.0 || lat > 24.0 || lon < 102.0 || lon > 110.0) continue

        const coordKey = `${lat.toFixed(4)},${lon.toFixed(4)}`
        if (seenCoordinates.has(coordKey)) continue
        seenCoordinates.add(coordKey)

        const street = props.housenumber ? `${props.housenumber} ${props.street}` : props.street
        const addressParts = [
          street,
          props.locality,
          props.district,
          props.city || props.state,
          'Việt Nam',
        ].filter(Boolean)

        const title = props.name || street || addressParts[0] || trimmed
        const address = addressParts.join(', ') || title

        places.push({
          id: `photon-${props.osm_id || Math.random().toString(36).slice(2, 7)}`,
          title,
          address,
          latitude: lat,
          longitude: lon,
          type: 'recent',
        })
      }
    }

    // 2. Process backend administrative results
    if (backendRes.status === 'fulfilled' && Array.isArray(backendRes.value)) {
      for (const item of backendRes.value) {
        if (item.latitude != null && item.longitude != null) {
          const lat = Number(item.latitude)
          const lon = Number(item.longitude)
          const coordKey = `${lat.toFixed(4)},${lon.toFixed(4)}`
          if (!seenCoordinates.has(coordKey)) {
            seenCoordinates.add(coordKey)
            places.push({
              id: `spatial-${item.communeCode || Math.random().toString(36).slice(2, 7)}`,
              title: item.communeName || item.displayName,
              address: item.displayName,
              latitude: lat,
              longitude: lon,
              type: 'recent',
            })
          }
        }
      }
    }

    return places.slice(0, limit)
  },

  /**
   * Get user's saved places (Home, Work, Favorites). Requires authentication.
   */
  getSavedPlaces: async (): Promise<SavedPlace[]> => {
    try {
      const response = await apiClient.get<any, SavedPlace[]>(
        API_ENDPOINTS.NAVIGATION.SAVED_PLACES
      )
      return Array.isArray(response) ? response : []
    } catch {
      return []
    }
  },

  /**
   * Get user's recent search queries. Requires authentication.
   */
  getRecentSearches: async (limit = 20): Promise<RecentSearch[]> => {
    try {
      const response = await apiClient.get<any, RecentSearch[]>(
        `${API_ENDPOINTS.NAVIGATION.RECENT_SEARCHES}?limit=${limit}`
      )
      return Array.isArray(response) ? response : []
    } catch {
      return []
    }
  },

  /**
   * Save a selected destination into user's recent search history.
   */
  saveRecentSearch: async (place: ApiPlace): Promise<void> => {
    try {
      await apiClient.post(API_ENDPOINTS.NAVIGATION.RECENT_SEARCHES, {
        query: place.title,
        address: place.address,
        latitude: place.latitude,
        longitude: place.longitude,
      })
    } catch (err) {
      console.warn('[Places] Could not record recent search:', err)
    }
  },

  /**
   * Delete a single recent search entry by ID.
   */
  deleteRecentSearch: async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(API_ENDPOINTS.NAVIGATION.RECENT_SEARCH_DETAIL(id))
      return true
    } catch (err) {
      console.warn('[Places] Could not delete recent search:', err)
      return false
    }
  },

  /**
   * Clear all recent search entries for the current user.
   */
  clearAllRecentSearches: async (): Promise<boolean> => {
    try {
      await apiClient.delete(API_ENDPOINTS.NAVIGATION.RECENT_SEARCHES)
      return true
    } catch (err) {
      console.warn('[Places] Could not clear all recent searches:', err)
      return false
    }
  },

  /**
   * Fetch aggregate user places (Saved + Recent).
   */
  getUserPlaces: async (): Promise<ApiPlace[]> => {
    try {
      const [saved, recent] = await Promise.all([
        placesService.getSavedPlaces(),
        placesService.getRecentSearches(15),
      ])

      const savedPlaces: ApiPlace[] = saved
        .filter((p) => p.latitude != null && p.longitude != null)
        .map((p) => ({
          id: p.id,
          title: p.label,
          address: p.address,
          latitude: p.latitude,
          longitude: p.longitude,
          type: 'saved',
        }))

      const recentPlaces: ApiPlace[] = recent
        .filter((p) => p.latitude != null && p.longitude != null)
        .map((p) => ({
          id: p.id,
          title: p.query,
          address: p.address,
          latitude: p.latitude,
          longitude: p.longitude,
          type: 'recent',
        }))

      return [...savedPlaces, ...recentPlaces]
    } catch {
      return []
    }
  },
}
