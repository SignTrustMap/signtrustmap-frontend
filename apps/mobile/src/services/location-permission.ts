import { Platform } from 'react-native';

import { getStorageItemAsync, setStorageItemAsync } from '@/hooks/use-storage';

type MapLibreModule = typeof import('@maplibre/maplibre-react-native');

const INITIAL_LOCATION_PERMISSION_REQUESTED_KEY = 'initial-location-permission-requested';
let initialPermissionRequest: Promise<void> | undefined;

export function requestLocationPermissionOnFirstLaunch() {
  initialPermissionRequest ??= requestInitialLocationPermission();
  return initialPermissionRequest;
}

async function requestInitialLocationPermission() {
  if (Platform.OS === 'web') return;

  const hasRequestedPermission = await getStorageItemAsync(
    INITIAL_LOCATION_PERMISSION_REQUESTED_KEY,
  );

  if (hasRequestedPermission) return;

  await setStorageItemAsync(INITIAL_LOCATION_PERMISSION_REQUESTED_KEY, 'true');

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mapLibre = require('@maplibre/maplibre-react-native') as MapLibreModule;
    await mapLibre.LocationManager.requestPermissions();
  } catch {
  }
}
