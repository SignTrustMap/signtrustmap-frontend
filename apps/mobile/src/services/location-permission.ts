import { Platform } from 'react-native';

import { getMapLibre } from '@/services/maplibre';

let initialPermissionRequest: Promise<void> | undefined;

export function requestLocationPermissionOnFirstLaunch() {
  initialPermissionRequest ??= requestInitialLocationPermission();
  return initialPermissionRequest;
}

async function requestInitialLocationPermission() {
  if (Platform.OS === 'web') return;

  try {
    const mapLibre = getMapLibre();
    if (!mapLibre) return;
    await mapLibre.LocationManager.requestPermissions();
  } catch {
  }
}

