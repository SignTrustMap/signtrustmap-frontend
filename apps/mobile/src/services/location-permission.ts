import { Alert, Linking, NativeModules, PermissionsAndroid, Platform } from 'react-native';

import {
  GPS_REQUIRED_SPLASH_MESSAGE,
  GPS_REQUIRED_SPLASH_TITLE,
  GPS_SERVICE_DISABLED_MESSAGE,
  GPS_SERVICE_DISABLED_TITLE,
} from '@/constants/message';
import { getMapLibre, type MapLibreModule } from '@/services/maplibre';
import {
  ensureLocationPermission,
  isFreshGpsLocation,
  isValidGpsLocation,
} from '@/feature/navigation/utils/gps';

export type GpsPermissionStatus = 'checking' | 'granted' | 'denied';
export type GpsDenialReason = 'permission' | 'service' | null;

export type MandatoryGpsCheckResult = {
  status: Exclude<GpsPermissionStatus, 'checking'>;
  reason: GpsDenialReason;
};

type GpsStatusNativeModule = {
  isLocationEnabled?: () => Promise<boolean>;
};

let initialPermissionRequest: Promise<void> | undefined;

export function requestLocationPermissionOnFirstLaunch(): Promise<void> {
  initialPermissionRequest ??= requestAppLocationPermission().then(() => undefined);
  return initialPermissionRequest;
}

/**
 * Checks whether the app currently has location permission without triggering an Android OS dialog.
 */
export async function hasLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return checkWebLocationPermission(false);
  }

  try {
    if (Platform.OS === 'android') {
      const fine = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      if (fine) return true;

      const coarse = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      );
      return Boolean(coarse);
    }

    const mapLibre = getMapLibre();
    if (!mapLibre) return true;
    return Boolean(await mapLibre.LocationManager.requestPermissions());
  } catch (error) {
    console.warn('[LocationPermission] Error checking current permission:', error);
    return false;
  }
}

/**
 * Checks and requests location permission for this app.
 * Returns true if permission is granted, false otherwise.
 */
export async function requestAppLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return checkWebLocationPermission(true);
  }

  try {
    if (Platform.OS === 'android') {
      return await ensureLocationPermission();
    }

    const mapLibre = getMapLibre();
    if (!mapLibre) return true;
    return Boolean(await mapLibre.LocationManager.requestPermissions());
  } catch (error) {
    console.warn('[LocationPermission] Error requesting permission:', error);
    return false;
  }
}

/**
 * Checks whether device-level GPS / Location Services are enabled.
 * Uses the native Android GpsStatusModule when compiled in, with a MapLibre LocationManager
 * probe fallback so Metro reloads on existing binaries still detect GPS being turned off.
 */
export async function isDeviceLocationEnabled(probeTimeoutMs = 1800): Promise<boolean> {
  if (Platform.OS === 'web') {
    return checkWebLocationPermission(false);
  }

  try {
    const nativeGpsModule = NativeModules?.GpsStatusModule as GpsStatusNativeModule | undefined;
    if (typeof nativeGpsModule?.isLocationEnabled === 'function') {
      return Boolean(await nativeGpsModule.isLocationEnabled());
    }

    const mapLibre = getMapLibre();
    if (!mapLibre) {
      return true;
    }

    return await probeMapLibreLocationEnabled(mapLibre, probeTimeoutMs);
  } catch (error) {
    console.warn('[LocationPermission] Error checking device GPS status:', error);
    return false;
  }
}

/**
 * Verifies both app location permission and device GPS/location service availability.
 */
export async function checkMandatoryGpsStatus(options?: {
  promptPermission?: boolean;
}): Promise<MandatoryGpsCheckResult> {
  const promptPermission = options?.promptPermission ?? true;
  const permissionGranted = promptPermission
    ? await requestAppLocationPermission()
    : await hasLocationPermission();

  if (!permissionGranted) {
    return { status: 'denied', reason: 'permission' };
  }

  const deviceGpsEnabled = await isDeviceLocationEnabled();
  if (!deviceGpsEnabled) {
    return { status: 'denied', reason: 'service' };
  }

  return { status: 'granted', reason: null };
}

export async function openLocationSettings(reason: GpsDenialReason = 'permission'): Promise<void> {
  try {
    if (reason === 'service' && Platform.OS === 'android' && typeof Linking.sendIntent === 'function') {
      try {
        await Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
        return;
      } catch {
        // Fallback to app settings if device settings intent is unavailable
      }
    }
    await Linking.openSettings();
  } catch (error) {
    console.warn('[LocationPermission] Error opening settings:', error);
  }
}

export async function checkAndRequireLocationPermission(): Promise<boolean> {
  const result = await checkMandatoryGpsStatus({ promptPermission: true });
  if (result.status === 'granted') return true;

  const isServiceDisabled = result.reason === 'service';
  Alert.alert(
    isServiceDisabled ? GPS_SERVICE_DISABLED_TITLE : GPS_REQUIRED_SPLASH_TITLE,
    isServiceDisabled ? GPS_SERVICE_DISABLED_MESSAGE : GPS_REQUIRED_SPLASH_MESSAGE,
    [
      {
        text: isServiceDisabled ? 'Mở Cài đặt vị trí' : 'Mở Cài đặt',
        onPress: () => {
          void openLocationSettings(result.reason);
        },
      },
      {
        text: 'Thử lại',
        onPress: () => {
          void checkAndRequireLocationPermission();
        },
      },
    ],
    { cancelable: false },
  );
  return false;
}

async function checkWebLocationPermission(promptIfNeeded: boolean): Promise<boolean> {
  if (typeof window === 'undefined' || typeof navigator === 'undefined' || !('geolocation' in navigator)) {
    return true;
  }

  try {
    if ('permissions' in navigator && typeof navigator.permissions?.query === 'function') {
      const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      if (status.state === 'granted') return true;
      if (status.state === 'denied') return false;
      if (!promptIfNeeded) return false;
    } else if (!promptIfNeeded) {
      return true;
    }

    return await new Promise<boolean>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve(true),
        () => resolve(false),
        { enableHighAccuracy: true, timeout: 3000, maximumAge: 30_000 },
      );
    });
  } catch {
    return true;
  }
}

async function probeMapLibreLocationEnabled(
  mapLibre: MapLibreModule,
  timeoutMs: number,
): Promise<boolean> {
  let getPosTimer: ReturnType<typeof setTimeout> | undefined;
  const lastPosition = await Promise.race([
    mapLibre.LocationManager.getCurrentPosition().catch(() => undefined),
    new Promise<undefined>((resolve) => {
      getPosTimer = setTimeout(() => resolve(undefined), Math.min(timeoutMs, 1000));
    }),
  ]).finally(() => {
    if (getPosTimer !== undefined) {
      clearTimeout(getPosTimer);
    }
  });

  if (lastPosition && isValidGpsLocation(lastPosition) && isFreshGpsLocation(lastPosition, 30_000)) {
    return true;
  }

  if (typeof mapLibre.LocationManager.addListener !== 'function') {
    return Boolean(lastPosition && isValidGpsLocation(lastPosition));
  }

  return await new Promise<boolean>((resolve) => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const finish = (enabled: boolean) => {
      if (settled) return;
      settled = true;
      if (timer !== undefined) {
        clearTimeout(timer);
      }
      try {
        mapLibre.LocationManager.removeListener?.(handleUpdate);
      } catch {
        // Ignore cleanup errors
      }
      resolve(enabled);
    };

    const handleUpdate = (position: unknown) => {
      if (isValidGpsLocation(position)) {
        finish(true);
      }
    };

    try {
      mapLibre.LocationManager.setMinDisplacement?.(0);
      mapLibre.LocationManager.addListener(handleUpdate);
      timer = setTimeout(() => finish(false), timeoutMs);
    } catch {
      finish(false);
    }
  });
}
