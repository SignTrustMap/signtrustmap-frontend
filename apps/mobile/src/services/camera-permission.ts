import { PermissionsAndroid, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

/**
 * Ensures camera permission is granted on Android and other platforms.
 * On Android, uses PermissionsAndroid.request directly to trigger the
 * native OS runtime dialog ("Cho phép Sign Trust Map chụp ảnh và quay video?"),
 * exactly matching how ensureLocationPermission prompts for GPS.
 */
export async function ensureCameraPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return true;

  if (Platform.OS === 'android') {
    try {
      const alreadyGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.CAMERA,
      );
      if (alreadyGranted) return true;

      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
      );
      if (result === PermissionsAndroid.RESULTS.GRANTED) return true;
    } catch (err) {
      console.warn('[CameraPermission] Failed to request CAMERA permission via PermissionsAndroid:', err);
    }
  }

  // Fallback to ImagePicker's permission requester (also used on iOS and unit tests)
  try {
    const res = await ImagePicker.requestCameraPermissionsAsync();
    return Boolean(res?.granted || res?.status === 'granted');
  } catch (err) {
    console.warn('[CameraPermission] Failed to request camera permission:', err);
    return false;
  }
}
