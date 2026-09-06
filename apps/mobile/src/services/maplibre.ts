import Constants from 'expo-constants';
import { Platform, TurboModuleRegistry } from 'react-native';

export type MapLibreModule = typeof import('@maplibre/maplibre-react-native');

/**
 * Checks whether MapLibre's native binary module is available.
 * In Expo Go, custom TurboModules like 'MLRNCameraModule' are not registered.
 * Calling require('@maplibre/maplibre-react-native') in Expo Go throws an invariant
 * error via TurboModuleRegistry.getEnforcing that is treated as a fatal crash by Metro.
 */
export function isMapLibreAvailable(): boolean {
  if (Platform.OS === 'web') return false;
  if (Constants.appOwnership === 'expo') return false;

  try {
    return Boolean(TurboModuleRegistry.get('MLRNCameraModule'));
  } catch {
    return false;
  }
}

export function getMapLibre(): MapLibreModule | null {
  if (!isMapLibreAvailable()) return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@maplibre/maplibre-react-native') as MapLibreModule;
  } catch {
    return null;
  }
}

