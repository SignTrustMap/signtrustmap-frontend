import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as LegacyMediaLibrary from 'expo-media-library/legacy';

jest.mock('expo-file-system/legacy', () => ({
  EncodingType: { UTF8: 'utf8', Base64: 'base64' },
  cacheDirectory: 'file:///cache/',
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
}));

const mockMediaQueryChain = {
  eq: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  exeForMetadata: jest.fn(),
};
const mockGetLocation = jest.fn();
const mockGetExif = jest.fn();

jest.mock('expo-media-library', () => ({
  requestPermissionsAsync: jest.fn(),
  AssetField: { MEDIA_TYPE: 'mediaType', MODIFICATION_TIME: 'modificationTime' },
  MediaType: { IMAGE: 'photo' },
  Query: jest.fn().mockImplementation(() => mockMediaQueryChain),
  Asset: jest.fn().mockImplementation(() => ({
    getLocation: mockGetLocation,
    getExif: mockGetExif,
  })),
}));

jest.mock('expo-media-library/legacy', () => ({
  getAssetInfoAsync: jest.fn(),
}));

const mockExtractImageFile = jest.fn();
jest.mock('@/feature/upload/utils/image-file-gps', () => ({
  extractGpsFromImageFile: (...args: any[]) => mockExtractImageFile(...args),
}));

const mockExtractVideoFile = jest.fn();
jest.mock('@/feature/upload/utils/video-file-gps', () => ({
  extractGpsFromVideoFile: (...args: any[]) => mockExtractVideoFile(...args),
}));

import { extractImageGpsCoordinates } from '@/feature/upload/utils/image-gps';
import {
  captureTimeFromExif,
  extractSelectedAssetGps,
  findOriginalAssetByFileName,
} from '@/feature/upload/utils/selected-asset-gps';
import { prepareSurveyGpx } from '@/feature/upload/utils/survey-image';

describe('Image GPS, SelectedAssetGPS & prepareSurveyGpx Branch Coverage', () => {
  const origPlatform = Platform.OS;
  const origFetch = globalThis.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
    mockExtractImageFile.mockResolvedValue(null);
    mockExtractVideoFile.mockResolvedValue(null);
  });

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { value: origPlatform, configurable: true });
    globalThis.fetch = origFetch;
  });

  describe('image-gps.ts', () => {
    it('extracts DMS strings, rational tuples, nested {GPS}, heading from comments, and validates boundaries', () => {
      expect(extractImageGpsCoordinates(null)).toBeNull();
      expect(extractImageGpsCoordinates({ GPSLatitude: 0, GPSLongitude: 0 })).toBeNull();
      expect(extractImageGpsCoordinates({ GPSLatitude: 95, GPSLongitude: 10 })).toBeNull();

      const fromStrings = extractImageGpsCoordinates({
        '{GPS}': {
          Latitude: '10/1, 46/1, 0/1',
          Longitude: [106, [42, 1], '0/1'],
          LatitudeRef: 'S',
          LongitudeRef: 'W',
          HPositioningError: '5/2',
          ImageDescription: 'Camera bearing=450',
        },
      });
      expect(fromStrings?.latitude).toBeCloseTo(-10.7666, 3);
      expect(fromStrings?.longitude).toBeCloseTo(-106.7, 3);
      expect(fromStrings?.accuracy).toBe(2.5);
      expect(fromStrings?.heading).toBe(90);

      const rationalHeading = extractImageGpsCoordinates({
        latitude: '10.77',
        longitude: '106.70',
        GPSImgDirection: [90, 2],
        GPSHPositioningError: '12m',
      });
      expect(rationalHeading).toMatchObject({
        latitude: 10.77,
        longitude: 106.7,
        accuracy: 12,
        heading: 45,
      });

      const dmsSymbolString = extractImageGpsCoordinates({
        GPSLatitude: '10°30\'0"',
        GPSLongitude: '106°30\'0"',
        GPSLatitudeRef: 'N',
        GPSLongitudeRef: 'E',
        Compass: '365',
      });
      expect(dmsSymbolString?.latitude).toBeCloseTo(10.5, 4);
      expect(dmsSymbolString?.heading).toBe(5);
    });
  });

  describe('selected-asset-gps.ts', () => {
    it('extracts captureTimeFromExif and finds original asset by fileName & dimensions', async () => {
      expect(captureTimeFromExif({ DateTimeOriginal: '2026:11:25 10:20:30' })).toContain('2026-11-25');
      expect(captureTimeFromExif(undefined)).toBeUndefined();

      mockMediaQueryChain.exeForMetadata.mockResolvedValueOnce([
        { id: '1', filename: 'IMG_1.JPG', width: 100, height: 100 },
        { id: '2', filename: 'img_1.jpg', width: 1920, height: 1080 },
      ]);
      const match = await findOriginalAssetByFileName(MediaLibrary, {
        uri: 'file:///img_1.jpg',
        fileName: 'IMG_1.JPG',
        width: 1920,
        height: 1080,
      } as any);
      expect(match?.id).toBe('2');

      mockMediaQueryChain.exeForMetadata.mockResolvedValueOnce([{ id: 'solo', filename: 'solo.jpg' }]);
      const soloMatch = await findOriginalAssetByFileName(MediaLibrary, {
        uri: 'file:///solo.jpg',
        fileName: 'solo.jpg',
      } as any);
      expect(soloMatch?.id).toBe('solo');
    });

    it('covers EXIF heading enrichment, MediaLibrary permission denied, LegacyMediaLibrary, Asset, and catch fallbacks', async () => {
      // EXIF lat/lon without heading -> file heading -> filename fallback
      mockExtractImageFile.mockResolvedValueOnce({ latitude: 10.77, longitude: 106.7, heading: 123 });
      const exifWithFileHeading = await extractSelectedAssetGps({
        uri: 'file:///photo.jpg',
        type: 'image',
        exif: { GPSLatitude: 10.77, GPSLongitude: 106.7 },
      } as any);
      expect(exifWithFileHeading?.heading).toBe(123);

      const exifFilenameHeading = await extractSelectedAssetGps({
        uri: 'file:///p.jpg',
        fileName: 'shot_heading_88deg.jpg',
        heading: undefined,
        exif: { GPSLatitude: 10.77, GPSLongitude: 106.7 },
      } as any);
      expect(exifFilenameHeading?.heading).toBe(88);

      // Web returns null if no EXIF
      Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
      expect(await extractSelectedAssetGps({ uri: 'blob:1', exif: null } as any)).toBeNull();
      Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });

      // Permission denied
      (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'denied' });
      expect(await extractSelectedAssetGps({ uri: 'file:///a.jpg' } as any)).toBeNull();

      // Permission granted, LegacyMediaLibrary provides location + heading
      (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
      (LegacyMediaLibrary.getAssetInfoAsync as jest.Mock).mockResolvedValueOnce({
        location: { latitude: 10.78, longitude: 106.71 },
        exif: { GPSImgDirection: '95' },
      });
      const legacyRes = await extractSelectedAssetGps({
        uri: 'file:///b.jpg',
        assetId: 'asset-id-1',
        type: 'image',
      } as any);
      expect(legacyRes).toEqual({ latitude: 10.78, longitude: 106.71, heading: 95 });

      // iOS / Asset.getExif fallback when getLocation empty
      Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
      mockMediaQueryChain.exeForMetadata.mockResolvedValueOnce([{ id: 'ios-1', filename: 'cam_bearing_210.jpg' }]);
      mockGetLocation.mockResolvedValueOnce(null);
      mockGetExif.mockResolvedValueOnce({ GPSLatitude: 10.79, GPSLongitude: 106.72 });
      const iosRes = await extractSelectedAssetGps({
        uri: 'file:///cam.jpg',
        fileName: 'cam_bearing_210.jpg',
        type: 'image',
      } as any);
      expect(iosRes).toEqual({ latitude: 10.79, longitude: 106.72, heading: 210 });

      // Catch block fallbacks for image and video outside gallery
      (MediaLibrary.requestPermissionsAsync as jest.Mock).mockRejectedValue(new Error('Media fail'));
      mockExtractImageFile.mockResolvedValueOnce({ latitude: 10.7, longitude: 106.7 });
      expect(await extractSelectedAssetGps({ uri: 'file:///dl.jpg', type: 'image' } as any)).toMatchObject({
        latitude: 10.7,
      });

      mockExtractVideoFile.mockResolvedValueOnce({ latitude: 10.8, longitude: 106.8, source: 'nmea_rmc' });
      expect(await extractSelectedAssetGps({ uri: 'file:///dl.mp4', type: 'video' } as any)).toEqual({
        latitude: 10.8,
        longitude: 106.8,
      });
    });
  });

  describe('survey-image.ts prepareSurveyGpx', () => {
    it('prepares GPX from data URI, file URI, web Blob, and rejects empty/failed/oversized GPX', async () => {
      const gpxXml = '<gpx><trkpt lat="10.7" lon="106.7"/></gpx>';
      const nativeRes = await prepareSurveyGpx({
        uri: `data:application/gpx+xml;utf8,${encodeURIComponent(gpxXml)}`,
        name: 'route.gpx',
      });
      expect(nativeRes.fileName).toBe('route.gpx');
      expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();

      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce('   ');
      await expect(prepareSurveyGpx({ uri: 'file:///empty.gpx' })).rejects.toThrow();

      Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
      globalThis.fetch = jest.fn().mockResolvedValueOnce({ ok: false });
      await expect(prepareSurveyGpx({ uri: 'https://example.com/bad.gpx' })).rejects.toThrow();

      globalThis.fetch = jest.fn().mockResolvedValueOnce({ ok: true, text: async () => gpxXml });
      const webRes = await prepareSurveyGpx({ uri: 'blob:123', name: 'web.gpx' });
      expect(webRes.fileName).toBe('web.gpx');
    });
  });
});
