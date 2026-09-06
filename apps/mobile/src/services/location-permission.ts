import { Platform } from 'react-native';

import { getStorageItemAsync, setStorageItemAsync } from '@/hooks/use-storage';
import { getMapLibre } from '@/services/maplibre';

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
    const mapLibre = getMapLibre();
    if (!mapLibre) return;
    await mapLibre.LocationManager.requestPermissions();
  } catch {
  }
}
