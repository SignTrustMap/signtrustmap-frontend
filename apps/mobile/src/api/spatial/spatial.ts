import { API_PATHS } from '@/api/api';
import { apiRequest } from '@/api/api-client';

export type ResolvedLocation = {
  latitude: number;
  longitude: number;
  roadName: string | null;
  communeCode?: string;
  communeName?: string;
  communeType?: string;
  provinceCode?: string;
  provinceName?: string;
  provinceType?: string;
  displayAddress: string;
  boundaryVersion?: string;
  source?: 'INTERNAL_SPATIAL' | 'FALLBACK_GEOCODER' | 'NOMINATIM_CLIENT';
};

/**
 * Fallback to direct OpenStreetMap Nominatim reverse geocode if backend
 * is unable to resolve administrative boundary or network drops.
 */
async function reverseGeocodeViaNominatim(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<ResolvedLocation | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'SignTrustMap-Mobile/1.0 (contact@signmap.site)',
        'Accept-Language': 'vi,en',
      },
      signal,
    });
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data.address || {};
    const roadName = addr.road || addr.street || addr.neighbourhood || addr.suburb || null;
    const displayAddress = data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    return {
      latitude,
      longitude,
      roadName,
      displayAddress,
      source: 'NOMINATIM_CLIENT',
    };
  } catch (err) {
    if (signal?.aborted) throw err;
    console.warn('[Spatial] Nominatim reverse geocode fallback error:', err);
    return null;
  }
}

/**
 * Resolves GPS coordinates to 2-tier administrative address & road name using
 * the backend /spatial/resolve endpoint (with fallback if undefined).
 */
export async function resolveLocation(
  latitude: number,
  longitude: number,
  accessToken?: string,
  signal?: AbortSignal,
): Promise<ResolvedLocation | null> {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  try {
    const result = await apiRequest<ResolvedLocation>(
      `${API_PATHS.SPATIAL_RESOLVE}?lat=${latitude}&lon=${longitude}`,
      { method: 'GET', signal },
      accessToken,
    );

    // If backend returns meaningful road or address, return it immediately
    const hasSpecificAddress =
      result?.displayAddress &&
      result.displayAddress !== 'Không xác định, Việt Nam' &&
      result.displayAddress !== 'Việt Nam';

    if (hasSpecificAddress) {
      return result;
    }

    // If backend spatial db didn't have polygons, attempt Nominatim client fallback
    const fallback = await reverseGeocodeViaNominatim(latitude, longitude, signal);
    if (fallback?.displayAddress) {
      return {
        ...result,
        roadName: result.roadName || fallback.roadName,
        displayAddress: fallback.displayAddress,
        source: fallback.source,
      };
    }

    return result;
  } catch (err) {
    if (signal?.aborted) throw err;
    console.warn('[Spatial] Backend spatial resolve failed, trying client fallback:', err);
    return reverseGeocodeViaNominatim(latitude, longitude, signal);
  }
}
