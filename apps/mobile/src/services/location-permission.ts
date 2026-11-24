import { Alert, Linking, Platform } from 'react-native';

import { getMapLibre } from '@/services/maplibre';
import { ensureLocationPermission } from '@/feature/navigation/utils/gps';

let initialPermissionRequest: Promise<void> | undefined;

export function requestLocationPermissionOnFirstLaunch(): Promise<void> {
  initialPermissionRequest ??= requestInitialLocationPermission();
  return initialPermissionRequest;
}

export async function checkAndRequireLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return true;

  try {
    const hasAndroidPermission = await ensureLocationPermission();
    if (hasAndroidPermission) return true;

    const mapLibre = getMapLibre();
    if (mapLibre) {
      const hasMapLibrePerm = await mapLibre.LocationManager.requestPermissions();
      if (hasMapLibrePerm) return true;
    }

    Alert.alert(
      'Yêu cầu bật định vị (GPS)',
      'Ứng dụng cần quyền vị trí và bật định vị GPS để xác thực vị trí biển báo. Vui lòng bật GPS và cấp quyền vị trí để tiếp tục sử dụng ứng dụng.',
      [
        {
          text: 'Mở Cài đặt',
          onPress: () => {
            void Linking.openSettings();
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
  } catch (error) {
    console.warn('[LocationPermission] Error checking permission:', error);
    return false;
  }
}

async function requestInitialLocationPermission(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const mapLibre = getMapLibre();
    if (!mapLibre) return;
    await mapLibre.LocationManager.requestPermissions();
  } catch {
  }
}

