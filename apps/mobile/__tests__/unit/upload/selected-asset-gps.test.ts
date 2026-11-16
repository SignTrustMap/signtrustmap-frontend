import {
  captureTimeFromExif,
  findOriginalAssetByFileName,
  extractSelectedAssetGps,
} from '@/feature/upload/utils/selected-asset-gps';
import * as MediaLibrary from 'expo-media-library';
import * as LegacyMediaLibrary from 'expo-media-library/legacy';
import { Platform } from 'react-native';
import { extractImageGpsCoordinates } from '@/feature/upload/utils/image-gps';
import { extractGpsFromVideoFile } from '@/feature/upload/utils/video-file-gps';
import { extractGpsFromImageFile } from '@/feature/upload/utils/image-file-gps';

jest.mock('expo-media-library', () => ({
  requestPermissionsAsync: jest.fn(),
  AssetField: {
    MEDIA_TYPE: 'mediaType',
    MODIFICATION_TIME: 'modificationTime',
  },
  MediaType: {
    IMAGE: 'image',
  },
  Query: class MockQuery {
    eq = jest.fn().mockReturnThis();
    orderBy = jest.fn().mockReturnThis();
    limit = jest.fn().mockReturnThis();
    exeForMetadata = jest.fn().mockResolvedValue([]);
  },
  Asset: class MockAsset {
    id: string;
    constructor(id: string) {
      this.id = id;
    }
    getLocation = jest.fn().mockResolvedValue(null);
    getExif = jest.fn().mockResolvedValue(null);
  },
}));

jest.mock('expo-media-library/legacy', () => ({
  getAssetInfoAsync: jest.fn(),
}));

jest.mock('@/feature/upload/utils/image-gps', () => ({
  extractImageGpsCoordinates: jest.fn(),
}));

jest.mock('@/feature/upload/utils/video-file-gps', () => ({
  extractGpsFromVideoFile: jest.fn(),
}));

jest.mock('@/feature/upload/utils/image-file-gps', () => ({
  extractGpsFromImageFile: jest.fn(),
}));

describe('selected-asset-gps', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'android';
  });

  describe('captureTimeFromExif', () => {
    it('parses DateTimeOriginal in standard EXIF format (YYYY:MM:DD HH:MM:SS)', () => {
      const exif = { DateTimeOriginal: '2026:11:16 10:30:00' };
      const iso = captureTimeFromExif(exif as any);
      expect(iso).toBe(new Date('2026-11-16T10:30:00').toISOString());
    });

    it('falls back to DateTime when DateTimeOriginal is absent', () => {
      const exif = { DateTime: '2026:05:01 12:00:00' };
      const iso = captureTimeFromExif(exif as any);
      expect(iso).toBe(new Date('2026-05-01T12:00:00').toISOString());
    });

    it('returns undefined when exif is undefined or invalid date', () => {
      expect(captureTimeFromExif(undefined)).toBeUndefined();
      expect(captureTimeFromExif({} as any)).toBeUndefined();
      expect(captureTimeFromExif({ DateTime: 'invalid-date' } as any)).toBeUndefined();
    });
  });

  describe('findOriginalAssetByFileName', () => {
    it('returns exact match matching filename and width/height', async () => {
      const mockQuery = new (MediaLibrary as any).Query();
      mockQuery.exeForMetadata.mockResolvedValueOnce([
        { id: 'asset-1', filename: 'photo1.jpg', width: 1920, height: 1080 },
        { id: 'asset-2', filename: 'photo1.jpg', width: 4000, height: 3000 },
      ]);
      const MockMediaLib = {
        ...MediaLibrary,
        Query: jest.fn().mockImplementation(() => mockQuery),
      };

      const result = await findOriginalAssetByFileName(MockMediaLib as any, {
        fileName: 'photo1.jpg',
        width: 4000,
        height: 3000,
      } as any);

      expect(result).toEqual({ id: 'asset-2', filename: 'photo1.jpg', width: 4000, height: 3000 });
    });

    it('returns unique match when exactly 1 file matches by filename', async () => {
      const mockQuery = new (MediaLibrary as any).Query();
      mockQuery.exeForMetadata.mockResolvedValueOnce([
        { id: 'asset-unique', filename: 'unique_trip.jpg' },
      ]);
      const MockMediaLib = {
        ...MediaLibrary,
        Query: jest.fn().mockImplementation(() => mockQuery),
      };

      const result = await findOriginalAssetByFileName(MockMediaLib as any, {
        fileName: 'unique_trip.jpg',
      } as any);

      expect(result).toEqual({ id: 'asset-unique', filename: 'unique_trip.jpg' });
    });

    it('returns undefined when fileName is empty', async () => {
      const result = await findOriginalAssetByFileName(MediaLibrary as any, {} as any);
      expect(result).toBeUndefined();
    });
  });

  describe('extractSelectedAssetGps', () => {
    it('returns GPS immediately if present in asset.exif', async () => {
      (extractImageGpsCoordinates as jest.Mock).mockReturnValueOnce({
        latitude: 10.7769,
        longitude: 106.7009,
      });

      const result = await extractSelectedAssetGps({
        uri: 'file:///image.jpg',
        exif: { GPSLatitude: 10.7769 },
      } as any);

      expect(result).toEqual({ latitude: 10.7769, longitude: 106.7009 });
      expect(MediaLibrary.requestPermissionsAsync).not.toHaveBeenCalled();
    });

    it('returns null on web platform if exif GPS is missing', async () => {
      Platform.OS = 'web';
      (extractImageGpsCoordinates as jest.Mock).mockReturnValueOnce(null);

      const result = await extractSelectedAssetGps({
        uri: 'blob:http://localhost/image-1',
      } as any);

      expect(result).toBeNull();
    });

    it('returns null if media library permission is not granted', async () => {
      (extractImageGpsCoordinates as jest.Mock).mockReturnValue(null);
      (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const result = await extractSelectedAssetGps({
        uri: 'file:///image.jpg',
      } as any);

      expect(result).toBeNull();
    });

    it('extracts GPS on Android using LegacyMediaLibrary when assetId exists', async () => {
      (extractImageGpsCoordinates as jest.Mock).mockReturnValue(null);
      (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (LegacyMediaLibrary.getAssetInfoAsync as jest.Mock).mockResolvedValue({
        location: { latitude: 10.8231, longitude: 106.6297 },
      });

      const result = await extractSelectedAssetGps({
        uri: 'file:///image.jpg',
        assetId: '12345',
        type: 'image',
      } as any);

      expect(result).toEqual({ latitude: 10.8231, longitude: 106.6297 });
    });

    it('falls back to extractGpsFromImageFile when MediaLibrary has no location', async () => {
      (extractImageGpsCoordinates as jest.Mock).mockReturnValue(null);
      (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (LegacyMediaLibrary.getAssetInfoAsync as jest.Mock).mockResolvedValue({
        location: null,
        exif: null,
      });
      (extractGpsFromImageFile as jest.Mock).mockResolvedValue({
        latitude: 10.78,
        longitude: 106.71,
      });

      const result = await extractSelectedAssetGps({
        uri: 'file:///image.jpg',
        assetId: '12345',
        type: 'image',
      } as any);

      expect(result).toEqual({ latitude: 10.78, longitude: 106.71 });
    });

    it('falls back to extractGpsFromVideoFile when video asset has no MediaLibrary GPS', async () => {
      (extractImageGpsCoordinates as jest.Mock).mockReturnValue(null);
      (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (LegacyMediaLibrary.getAssetInfoAsync as jest.Mock).mockResolvedValue({
        location: null,
        exif: null,
      });
      (extractGpsFromVideoFile as jest.Mock).mockResolvedValue({
        latitude: 10.75,
        longitude: 106.68,
        source: 'quicktime_xyz',
      });

      const result = await extractSelectedAssetGps({
        uri: 'file:///video.mp4',
        assetId: '12345',
        type: 'video',
      } as any);

      expect(result).toEqual({ latitude: 10.75, longitude: 106.68 });
    });

    it('handles LegacyMediaLibrary exception and falls back to raw file extraction', async () => {
      (extractImageGpsCoordinates as jest.Mock).mockReturnValue(null);
      (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (LegacyMediaLibrary.getAssetInfoAsync as jest.Mock).mockRejectedValue(
        new Error('Scoped storage security error')
      );
      (extractGpsFromImageFile as jest.Mock).mockResolvedValue({
        latitude: 10.79,
        longitude: 106.72,
      });

      const result = await extractSelectedAssetGps({
        uri: 'file:///image.jpg',
        assetId: 'external-1',
        type: 'image',
      } as any);

      expect(result).toEqual({ latitude: 10.79, longitude: 106.72 });
    });
  });
});
