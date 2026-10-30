/**
 * @file reverseGeocode.ts
 * @description Provides fast reverse geocoding with caching for survey locations.
 * Uses OpenStreetMap Nominatim with Vietnamese language priority.
 */

export interface ResolvedLocation {
  roadName: string | null
  displayAddress: string
}

const geocodeCache = new Map<string, ResolvedLocation>()

export async function reverseGeocodeCoordinates(
  lat: number,
  lng: number,
  signal?: AbortSignal
): Promise<ResolvedLocation> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) {
    return {
      roadName: null,
      displayAddress: 'Chưa có toạ độ hợp lệ',
    }
  }

  const cacheKey = `${lat.toFixed(5)},${lng.toFixed(5)}`
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'vi,en',
        'User-Agent': 'SignTrustMap-Web/1.0 (contact@signmap.site)',
      },
      signal,
    })

    if (res.ok) {
      const data = await res.json()
      const addr = data.address || {}
      const roadName =
        addr.road || addr.street || addr.neighbourhood || addr.suburb || addr.quarter || null
      const displayAddress =
        data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`

      const resolved: ResolvedLocation = { roadName, displayAddress }
      geocodeCache.set(cacheKey, resolved)
      return resolved
    }
  } catch (err: any) {
    if (signal?.aborted) throw err
    console.warn('[reverseGeocode] Failed to reverse geocode:', err)
  }

  const fallback: ResolvedLocation = {
    roadName: null,
    displayAddress: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
  }
  geocodeCache.set(cacheKey, fallback)
  return fallback
}
