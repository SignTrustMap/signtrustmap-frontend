import { Alert, Linking, NativeModules, PermissionsAndroid, Platform } from 'react-native';

const mockGetMapLibre = jest.fn();
jest.mock('@/services/maplibre', () => ({
  getMapLibre: () => mockGetMapLibre(),
}));

const mockEnsureLocationPermission = jest.fn();
const mockIsFreshGpsLocation = jest.fn();
const mockIsValidGpsLocation = jest.fn();
jest.mock('@/feature/navigation/utils/gps', () => ({
  ensureLocationPermission: (...args: any[]) => mockEnsureLocationPermission(...args),
  isFreshGpsLocation: (...args: any[]) => mockIsFreshGpsLocation(...args),
  isValidGpsLocation: (...args: any[]) => mockIsValidGpsLocation(...args),
}));

import * as Device from 'expo-device';
import Constants from 'expo-constants';
import {
  checkAndRequireLocationPermission,
  checkMandatoryGpsStatus,
  hasLocationPermission,
  isDeviceLocationEnabled,
  openLocationSettings,
  requestAppLocationPermission,
  requestLocationPermissionOnFirstLaunch,
} from '@/services/location-permission';
import { checkAppUpdate, fetchLatestRelease } from '@/services/update-service';
import { env } from '@/config/env';

describe('LocationPermission & UpdateService Branch Coverage', () => {
  const originalPlatform = Platform.OS;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
    delete (NativeModules as any).GpsStatusModule;
    mockGetMapLibre.mockReturnValue(null);
    mockEnsureLocationPermission.mockResolvedValue(true);
    mockIsValidGpsLocation.mockReturnValue(true);
    mockIsFreshGpsLocation.mockReturnValue(true);
  });

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { value: originalPlatform, configurable: true });
    globalThis.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  describe('location-permission.ts', () => {
    it('checks Android fine/coarse permissions and error handling', async () => {
      const checkSpy = jest.spyOn(PermissionsAndroid, 'check');
      checkSpy.mockResolvedValueOnce(true);
      expect(await hasLocationPermission()).toBe(true);

      checkSpy.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
      expect(await hasLocationPermission()).toBe(true);

      checkSpy.mockRejectedValueOnce(new Error('Perm err'));
      expect(await hasLocationPermission()).toBe(false);
    });

    it('checks and requests iOS/MapLibre permissions', async () => {
      Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
      mockGetMapLibre.mockReturnValueOnce(null);
      expect(await hasLocationPermission()).toBe(true);

      mockGetMapLibre.mockReturnValue({
        LocationManager: { requestPermissions: jest.fn().mockResolvedValue(true) },
      });
      expect(await hasLocationPermission()).toBe(true);
      expect(await requestAppLocationPermission()).toBe(true);

      mockGetMapLibre.mockReturnValue({
        LocationManager: { requestPermissions: jest.fn().mockRejectedValue(new Error('denied')) },
      });
      expect(await requestAppLocationPermission()).toBe(false);
    });

    it('checks Android requestLocationPermissionOnFirstLaunch and web permission paths', async () => {
      await expect(requestLocationPermissionOnFirstLaunch()).resolves.toBeUndefined();

      Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
      const origWin = (globalThis as any).window;
      const origNav = (globalThis as any).navigator;

      (globalThis as any).window = {};
      (globalThis as any).navigator = {
        geolocation: {
          getCurrentPosition: jest.fn((ok) => ok({ coords: { latitude: 10, longitude: 106 } })),
        },
        permissions: {
          query: jest.fn().mockResolvedValue({ state: 'granted' }),
        },
      };
      expect(await hasLocationPermission()).toBe(true);

      (globalThis as any).navigator.permissions.query.mockResolvedValueOnce({ state: 'denied' });
      expect(await hasLocationPermission()).toBe(false);

      (globalThis as any).navigator.permissions.query.mockResolvedValueOnce({ state: 'prompt' });
      expect(await hasLocationPermission()).toBe(false);

      (globalThis as any).navigator.permissions.query.mockResolvedValueOnce({ state: 'prompt' });
      expect(await requestAppLocationPermission()).toBe(true);

      (globalThis as any).navigator = {
        geolocation: { getCurrentPosition: jest.fn((_ok, err) => err(new Error('fail'))) },
      };
      expect(await hasLocationPermission()).toBe(true);
      expect(await requestAppLocationPermission()).toBe(false);

      (globalThis as any).window = origWin;
      (globalThis as any).navigator = origNav;
    });

    it('evaluates isDeviceLocationEnabled via GpsStatusModule and MapLibre probe', async () => {
      (NativeModules as any).GpsStatusModule = {
        isLocationEnabled: jest.fn().mockResolvedValue(false),
      };
      expect(await isDeviceLocationEnabled(50)).toBe(false);
      delete (NativeModules as any).GpsStatusModule;

      // MapLibre null
      expect(await isDeviceLocationEnabled(50)).toBe(true);

      // Fresh position from getCurrentPosition
      mockGetMapLibre.mockReturnValueOnce({
        LocationManager: {
          getCurrentPosition: jest.fn().mockResolvedValue({ coords: { latitude: 10, longitude: 106 } }),
        },
      });
      expect(await isDeviceLocationEnabled(50)).toBe(true);

      // Stale position, no addListener
      mockIsFreshGpsLocation.mockReturnValueOnce(false);
      mockGetMapLibre.mockReturnValueOnce({
        LocationManager: {
          getCurrentPosition: jest.fn().mockResolvedValue({ coords: { latitude: 10, longitude: 106 } }),
        },
      });
      expect(await isDeviceLocationEnabled(50)).toBe(true);

      // Listener receives live position
      mockIsFreshGpsLocation.mockReturnValue(false);
      let registeredListener: any;
      mockGetMapLibre.mockReturnValueOnce({
        LocationManager: {
          getCurrentPosition: jest.fn().mockRejectedValue(new Error('no cache')),
          setMinDisplacement: jest.fn(),
          addListener: jest.fn((cb) => {
            registeredListener = cb;
            setTimeout(() => cb({ coords: { latitude: 10, longitude: 106 } }), 5);
          }),
          removeListener: jest.fn(),
        },
      });
      expect(await isDeviceLocationEnabled(200)).toBe(true);
      expect(registeredListener).toBeDefined();

      // Listener times out
      mockGetMapLibre.mockReturnValueOnce({
        LocationManager: {
          getCurrentPosition: jest.fn().mockResolvedValue(undefined),
          addListener: jest.fn(),
          removeListener: jest.fn(),
        },
      });
      expect(await isDeviceLocationEnabled(20)).toBe(false);
    });

    it('runs checkMandatoryGpsStatus, openLocationSettings, and checkAndRequireLocationPermission Alert actions', async () => {
      const checkSpy = jest.spyOn(PermissionsAndroid, 'check').mockResolvedValue(false);
      expect(await checkMandatoryGpsStatus({ promptPermission: false })).toEqual({
        status: 'denied',
        reason: 'permission',
      });
      checkSpy.mockResolvedValue(true);

      (NativeModules as any).GpsStatusModule = { isLocationEnabled: jest.fn().mockResolvedValue(false) };
      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
      const sendIntentSpy = jest.spyOn(Linking, 'sendIntent').mockResolvedValueOnce(undefined as any);
      const openSettingsSpy = jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined as any);

      expect(await checkAndRequireLocationPermission()).toBe(false);
      expect(alertSpy).toHaveBeenCalled();

      // Trigger both Alert buttons ('Mở Cài đặt vị trí' & 'Thử lại')
      const buttons = alertSpy.mock.calls[0][2] as any[];
      buttons[0].onPress();
      await Promise.resolve();
      expect(sendIntentSpy).toHaveBeenCalledWith('android.settings.LOCATION_SOURCE_SETTINGS');

      // sendIntent fails -> fallback to openSettings
      sendIntentSpy.mockRejectedValueOnce(new Error('No activity'));
      await openLocationSettings('service');
      expect(openSettingsSpy).toHaveBeenCalled();

      // Granted status
      (NativeModules as any).GpsStatusModule = { isLocationEnabled: jest.fn().mockResolvedValue(true) };
      expect(await checkAndRequireLocationPermission()).toBe(true);
    });
  });

  describe('update-service.ts', () => {
    it('fetches latest release, matches APK ABI, and formats relative timestamps', async () => {
      (Device as any).supportedCpuArchitectures = ['x86_64', 'arm64-v8a'];
      const oneHourAgo = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString();
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();

      globalThis.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          tag_name: 'v1.2.3',
          name: 'Release 1.2.3',
          published_at: oneHourAgo,
          html_url: 'https://github.com/r/1',
          assets: [
            { name: 'app-arm64-v8a.apk', browser_download_url: 'https://dl/arm64.apk', size: 10485760 },
            { name: 'notes.txt', browser_download_url: 'https://dl/notes.txt', size: 0 },
          ],
        }),
      });

      const rel = await fetchLatestRelease();
      expect(rel?.apkAsset?.name).toBe('app-arm64-v8a.apk');
      expect(rel?.publishedAt).toContain('giờ trước');

      // 404 fallback to all releases list + arm64 default fallback + >7 days date
      (Device as any).supportedCpuArchitectures = [];
      globalThis.fetch = jest
        .fn()
        .mockResolvedValueOnce({ ok: false, status: 404 })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => [
            {
              tag_name: 'build-abcdef1',
              published_at: threeDaysAgo,
              html_url: 'https://github.com/r/2',
              assets: [{ name: 'universal-arm64.apk', browser_download_url: 'https://dl/u.apk', size: 0 }],
            },
          ],
        });
      const fallbackRel = await fetchLatestRelease();
      expect(fallbackRel?.publishedAt).toContain('ngày trước');
      expect(fallbackRel?.apkAsset?.sizeFormatted).toBe('0 B');

      // 404 fallback empty array -> null & older date
      globalThis.fetch = jest
        .fn()
        .mockResolvedValueOnce({ ok: false, status: 404 })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => [] });
      expect(await fetchLatestRelease()).toBeNull();

      // checkAppUpdate with commit SHA vs non-matching + error
      const origSha = env.appCommitSha;
      (env as any).appCommitSha = '1111111';
      globalThis.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          tag_name: 'build-2222222',
          published_at: twoWeeksAgo,
          html_url: 'https://github.com/r/3',
          assets: [],
        }),
      });
      const updateRes = await checkAppUpdate();
      expect(updateRes.isUpdateAvailable).toBe(true);

      // Without commit SHA, comparing version
      (env as any).appCommitSha = '';
      (Constants as any).expoConfig = { version: '1.0.0' };
      globalThis.fetch = jest.fn().mockRejectedValueOnce(new Error('Offline'));
      const errRes = await checkAppUpdate();
      expect(errRes.isUpdateAvailable).toBe(false);
      expect(errRes.error).toBe('Offline');
      (env as any).appCommitSha = origSha;
    });
  });
});
