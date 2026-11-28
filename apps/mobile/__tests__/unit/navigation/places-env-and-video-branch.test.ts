import { PermissionsAndroid, Platform } from 'react-native';

jest.mock('expo-file-system/legacy', () => ({
  EncodingType: { Base64: 'base64' },
  getInfoAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  cacheDirectory: 'file:///cache/',
}));

jest.mock('@/services/maplibre', () => ({
  getMapLibre: jest.fn(),
}));

const mockApiRequest = jest.fn();
jest.mock('@/api/api-client', () => ({
  apiRequest: (...args: any[]) => mockApiRequest(...args),
  jsonApiRequest: jest.fn(),
}));

import { getMapLibre } from '@/services/maplibre';
import { getUserPlaces, searchPlaces } from '@/api/navigation/places';
import {
  calculateTemporalChunks,
  prepareVideoChunk,
  sliceVideoChunk,
} from '@/feature/upload/utils/video-processor';
import {
  ensureLocationPermission,
  fetchFreshGpsLocation,
  fetchFreshGpsPosition,
  isFreshGpsLocation,
  isValidGpsLocation,
} from '@/feature/navigation/utils/gps';

describe('Places API, Env Config, VideoProcessor, Formatters & GPS Branch Coverage', () => {
  const origPlatform = Platform.OS;
  const origFetch = globalThis.fetch;
  const origEnv = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
    process.env = { ...origEnv };
  });

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { value: origPlatform, configurable: true });
    globalThis.fetch = origFetch;
    process.env = { ...origEnv };
  });

  it('covers config/env.ts across Android/iOS host resolution, custom gateway/storage URLs', () => {
    jest.isolateModules(() => {
      process.env.EXPO_PUBLIC_GATEWAY_URL = 'http://localhost:3000/';
      process.env.EXPO_PUBLIC_API_URL = 'custom-api.local';
      process.env.EXPO_PUBLIC_STORAGE_URL = 'http://127.0.0.1:9000/bucket';
      Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
      const { env } = require('@/config/env');
      expect(env.gatewayUrl).toBe('http://10.0.2.2:3000');
      expect(env.apiBaseUrl).toBe('https://custom-api.local/api/v1');
      expect(env.storageUrl).toBe('http://10.0.2.2:9000/bucket');
    });

    jest.resetModules();
    jest.isolateModules(() => {
      delete process.env.EXPO_PUBLIC_GATEWAY_URL;
      delete process.env.EXPO_PUBLIC_API_URL;
      delete process.env.EXPO_PUBLIC_STORAGE_URL;
      delete process.env.EXPO_PUBLIC_S3_URL;
      delete process.env.EXPO_PUBLIC_CDN_URL;
      const RN = require('react-native');
      Object.defineProperty(RN.Platform, 'OS', { value: 'ios', configurable: true });
      const { env } = require('@/config/env');
      expect(env.apiBaseUrl).toContain('/api/v1');
      expect(env.storageUrl).toContain('http');
    });
  });

  it('covers places.ts getUserPlaces and searchPlaces waterfall (spatial -> photon -> nominatim -> backend)', async () => {
    mockApiRequest
      .mockResolvedValueOnce([{ id: 's1', label: 'Nhà', address: 'Q1', latitude: 10.7, longitude: 106.7 }])
      .mockResolvedValueOnce([{ id: 'r1', query: 'Chợ', address: null, latitude: 10.8, longitude: 106.8 }]);
    const userPlaces = await getUserPlaces('tok');
    expect(userPlaces).toHaveLength(2);

    expect(await searchPlaces('a')).toEqual([]);

    // Spatial hit
    mockApiRequest.mockResolvedValueOnce([
      { communeCode: 'c1', communeName: 'Bến Nghé', displayName: 'Phường Bến Nghé', latitude: 10.77, longitude: 106.7 },
    ]);
    expect((await searchPlaces('Bến Nghé'))[0].id).toBe('spatial-c1');

    // Photon hit after spatial fails
    mockApiRequest.mockRejectedValueOnce(new Error('spatial down'));
    globalThis.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        features: [
          {
            geometry: { type: 'Point', coordinates: [106.7, 10.77] },
            properties: { osm_id: 99, housenumber: '12', street: 'Lê Lợi', city: 'TP.HCM' },
          },
        ],
      }),
    });
    expect((await searchPlaces('12 Lê Lợi'))[0].id).toBe('photon-99');

    // Photon fails -> Nominatim hit
    mockApiRequest.mockResolvedValueOnce([]);
    globalThis.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 502 })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ place_id: 77, lat: '10.78', lon: '106.71', display_name: 'Hồ Con Rùa, Q3' }],
      });
    expect((await searchPlaces('Hồ Con Rùa'))[0].id).toBe('nominatim-77');

    // Photon & Nominatim fail -> Backend geocoding hit -> then fail returns []
    mockApiRequest
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({
        results: [{ providerPlaceId: 55, name: 'Landmark', displayName: 'Landmark 81', latitude: 10.79, longitude: 106.72 }],
      });
    globalThis.fetch = jest
      .fn()
      .mockRejectedValueOnce(new Error('net'))
      .mockResolvedValueOnce({ ok: false, status: 503 });
    expect((await searchPlaces('Landmark'))[0].id).toBe('geocoding-55');

    // Aborted signal rethrows
    const ctrl = new AbortController();
    ctrl.abort();
    mockApiRequest.mockRejectedValueOnce(new Error('aborted'));
    await expect(searchPlaces('test', ctrl.signal)).rejects.toThrow('aborted');
  });

  it('covers video-processor.ts chunk calculation, slicing, and multi-chunk web/native chunk preparation', async () => {
    const plan = calculateTemporalChunks(30 * 1024 * 1024, 180);
    expect(plan.totalChunks).toBe(3);

    const mockBlob = { slice: jest.fn((s: number, e: number, t: string) => ({ size: e - s, type: t })) };
    const chunk0 = sliceVideoChunk(mockBlob as any, 0, plan, 'v.mp4');
    expect(chunk0.fileName).toBe('v.mp4.part_0');

    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
    const nativePrep = await prepareVideoChunk({
      videoUri: 'file:///v.mp4',
      chunkIndex: 1,
      plan,
      fileName: 'v.mp4',
      sessionId: 'sess-1',
    });
    expect(nativePrep.request.chunkIndex).toBe(1);
    expect(typeof nativePrep.cleanup).toBe('function');
  });

  it('covers gps.ts permissions, validation, freshness, and MapLibre getCurrentPosition branches', async () => {
    expect(isValidGpsLocation(null)).toBe(false);
    expect(isValidGpsLocation({ coords: { latitude: 'bad', longitude: 106 } })).toBe(false);
    expect(isValidGpsLocation({ coords: { latitude: 120, longitude: 106 } })).toBe(false);
    expect(isValidGpsLocation({ coords: { latitude: 10.7, longitude: 106.7, accuracy: 300 } })).toBe(false);
    expect(isValidGpsLocation({ coords: { latitude: 10.7, longitude: 106.7, accuracy: 15 } })).toBe(true);

    expect(isFreshGpsLocation({})).toBe(true);
    expect(isFreshGpsLocation({ timestamp: Date.now() - 120_000 })).toBe(false);

    Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
    expect(await ensureLocationPermission()).toBe(false);
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
    expect(await ensureLocationPermission()).toBe(true);

    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
    jest.spyOn(PermissionsAndroid, 'check').mockResolvedValue(false);
    jest.spyOn(PermissionsAndroid, 'requestMultiple').mockResolvedValue({
      [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION]: 'granted',
      [PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION]: 'denied',
    } as any);
    expect(await ensureLocationPermission()).toBe(true);

    (getMapLibre as jest.Mock).mockReturnValueOnce(null);
    expect(await fetchFreshGpsLocation()).toBeNull();

    (getMapLibre as jest.Mock).mockReturnValue({
      LocationManager: {
        getCurrentPosition: jest.fn().mockResolvedValueOnce({
          coords: { latitude: 10.77, longitude: 106.7, accuracy: 8, heading: 90 },
          timestamp: Date.now(),
        }),
      },
    });
    expect(await fetchFreshGpsPosition(1000)).toEqual([106.7, 10.77]);
  });
});
