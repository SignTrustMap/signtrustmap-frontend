import { PermissionsAndroid, Platform } from 'react-native';
import type { MapCoordinate } from '@/types/navigationType';
import { getMapLibre } from '@/services/maplibre';

export { GPS_UNAVAILABLE_MESSAGE } from '@/constants/message';

/**
 * Ensures location permission is granted on Android and other platforms.
 */
export async function ensureLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (Platform.OS !== 'android') return true;
  try {
    const fine = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    const coarse = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    );
    if (fine || coarse) return true;

    const res = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    ]);
    return (
      res[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
      PermissionsAndroid.RESULTS.GRANTED ||
      res[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] ===
      PermissionsAndroid.RESULTS.GRANTED
    );
  } catch (error) {
    console.error('[GPS] Failed to check or request location permissions:', error);
    return false;
  }
}

/**
 * Validates that a raw GPS position object from MapLibre / native provider
 * contains valid, finite coordinates within geographic boundaries and reasonable accuracy.
 */
export function isValidGpsLocation(position: any): boolean {
  if (!position?.coords) {
    console.warn('[GPS] Invalid position object: missing coords', position);
    return false;
  }

  const { latitude, longitude, accuracy } = position.coords;

  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number' ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    console.warn('[GPS] Invalid position: non-finite coordinates', { latitude, longitude });
    return false;
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    console.warn('[GPS] Invalid position: out of geographic bounds', { latitude, longitude });
    return false;
  }

  // If accuracy is reported, reject extraordinarily large accuracy (> 200m)
  if (typeof accuracy === 'number' && (Number.isNaN(accuracy) || accuracy < 0 || accuracy > 200)) {
    console.warn('[GPS] Inaccurate GPS position ignored (accuracy > 200m)', {
      latitude,
      longitude,
      accuracy,
    });
    return false;
  }

  return true;
}

/**
 * Checks whether a position timestamp is fresh (less than maxAgeMs old).
 */
export function isFreshGpsLocation(position: any, maxAgeMs = 60_000): boolean {
  if (!position?.timestamp) return true; // If no timestamp provided by provider, assume live
  const ageMs = Date.now() - position.timestamp;
  return ageMs <= maxAgeMs;
}

export type FreshGpsLocationResult = {
  coordinate: MapCoordinate;
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
};

/**
 * Actively fetches the current GPS position with full coordinate, accuracy,
 * and heading metadata from MapLibre.LocationManager with a reasonable timeout.
 */
export async function fetchFreshGpsLocation(timeoutMs = 3500): Promise<FreshGpsLocationResult | null> {
  if (Platform.OS === 'web') {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      return null;
    }
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          resolve({
            coordinate: [coords.longitude, coords.latitude],
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: coords.accuracy,
            heading: coords.heading ?? undefined,
          });
        },
        () => resolve(null),
        { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 10_000 },
      );
    });
  }

  const mapLibre = getMapLibre();
  if (!mapLibre) {
    console.warn('[GPS] MapLibre module not available for getCurrentPosition');
    return null;
  }

  try {
    const hasPermission = await ensureLocationPermission();
    if (!hasPermission) {
      console.warn('[GPS] Location permission not granted');
      return null;
    }

    let timerId: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<null>((resolve) => {
      timerId = setTimeout(() => resolve(null), timeoutMs);
    });

    const position = await Promise.race([
      mapLibre.LocationManager.getCurrentPosition(),
      timeoutPromise,
    ]).finally(() => {
      if (timerId !== undefined) {
        clearTimeout(timerId);
      }
    });

    if (!position) {
      console.warn(`[GPS] getCurrentPosition timed out after ${timeoutMs}ms; awaiting listener update`);
      return null;
    }

    if (!isValidGpsLocation(position)) {
      return null;
    }

    const { latitude, longitude, accuracy, heading } = position.coords;
    const timestamp = position.timestamp;
    const isFresh = isFreshGpsLocation(position);

    console.log('[GPS] current position', {
      latitude,
      longitude,
      accuracy,
      heading,
      timestamp,
      freshness: isFresh ? 'fresh' : 'cached',
    });

    return {
      coordinate: [longitude, latitude],
      latitude,
      longitude,
      accuracy: typeof accuracy === 'number' && Number.isFinite(accuracy) ? accuracy : undefined,
      heading: typeof heading === 'number' && Number.isFinite(heading) ? heading : undefined,
    };
  } catch (error) {
    console.error('[GPS] Failed to get current position:', error);
    return null;
  }
}

/**
 * Actively fetches the current GPS position from MapLibre.LocationManager
 * with a reasonable timeout (default 3500ms).
 */
export async function fetchFreshGpsPosition(timeoutMs = 3500): Promise<MapCoordinate | null> {
  const loc = await fetchFreshGpsLocation(timeoutMs);
  return loc ? loc.coordinate : null;
}
