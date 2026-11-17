import { Image as RNImage, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import {
  compressAndResizeSurveyImage,
  prepareSurveyImage,
  prepareSurveyGpx,
  MAX_IMAGE_DIMENSION,
  JPEG_COMPRESSION_QUALITY,
} from '@/feature/upload/utils/survey-image';
import {
  IMAGE_SIZE_EXCEEDED_MESSAGE,
  VIDEO_SIZE_EXCEEDED_MESSAGE,
  GPX_EMPTY_MESSAGE,
} from '@/constants/message';
import {
  MAX_SURVEY_IMAGE_SIZE_BYTES,
  MAX_SURVEY_VIDEO_SIZE_BYTES,
} from '@/feature/upload/utils/video-processor';

jest.mock('expo-blob', () => ({
  Blob: class MockBlob {
    size = 100;
    slice() {
      return this;
    }
  },
}));

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: {
    JPEG: 'jpeg',
    PNG: 'png',
  },
}));

jest.mock('expo-file-system/legacy', () => ({
  getInfoAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  cacheDirectory: 'file:///cache/',
  EncodingType: {
    UTF8: 'utf8',
  },
}));

describe('survey-image utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('compressAndResizeSurveyImage', () => {
    it('directly resizes to MAX_IMAGE_DIMENSION and compresses to JPEG with quality 0.7 in a single pass', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({
        exists: true,
        size: 5 * 1024 * 1024, // 5MB
      });

      (ImageManipulator.manipulateAsync as jest.Mock).mockResolvedValueOnce({
        uri: 'file:///cache/manipulated.jpg',
        width: 1280,
        height: 960,
      });

      const result = await compressAndResizeSurveyImage('file:///photos/large.png');

      expect(ImageManipulator.manipulateAsync).toHaveBeenCalledTimes(1);
      expect(ImageManipulator.manipulateAsync).toHaveBeenCalledWith(
        'file:///photos/large.png',
        [{ resize: { width: MAX_IMAGE_DIMENSION } }],
        {
          compress: JPEG_COMPRESSION_QUALITY,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      expect(result.uri).toBe('file:///cache/manipulated.jpg');
    });

    it('skips compression when file is already a lightweight local cache JPEG under 500KB', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({
        exists: true,
        size: 250 * 1024, // 250KB
      });

      const result = await compressAndResizeSurveyImage('file:///cache/already-small.jpg');

      expect(ImageManipulator.manipulateAsync).not.toHaveBeenCalled();
      expect(result.uri).toBe('file:///cache/already-small.jpg');
    });

    it('falls back to original URI when manipulateAsync throws', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({
        exists: true,
        size: 6 * 1024 * 1024,
      });

      (ImageManipulator.manipulateAsync as jest.Mock).mockRejectedValueOnce(
        new Error('Manipulator error')
      );

      const result = await compressAndResizeSurveyImage('file:///photos/corrupt.png');

      expect(result.uri).toBe('file:///photos/corrupt.png');
      expect(result.width).toBe(0);
      expect(result.height).toBe(0);
    });
  });

  describe('prepareSurveyImage', () => {
    it('compresses image and creates JPEG chunk with .jpg extension', async () => {
      (ImageManipulator.manipulateAsync as jest.Mock).mockResolvedValue({
        uri: 'file:///cache/compressed.jpg',
        width: 1920,
        height: 1080,
      });

      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
        size: 850000, // ~850KB
      });

      const prepared = await prepareSurveyImage({
        uri: 'file:///photos/photo.png',
        fileName: 'screenshot.png',
        type: 'image',
      });

      expect(prepared.fileName).toBe('screenshot.jpg');
      expect((prepared.chunk.file as any).type).toBe('image/jpeg');
      expect(prepared.sizeBytes).toBe(850000);
      expect((prepared.chunk.file as any).uri).toBe('file:///cache/compressed.jpg');
    });

    it('bypasses image compression for video files and maintains video mimeType', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
        size: 15000000, // 15MB
      });

      const prepared = await prepareSurveyImage({
        uri: 'file:///videos/clip.mp4',
        fileName: 'clip.mp4',
        type: 'video',
      });

      expect(ImageManipulator.manipulateAsync).not.toHaveBeenCalled();
      expect(prepared.fileName).toBe('clip.mp4');
      expect(prepared.chunk.file.type).toBe('video/mp4');
      expect(prepared.sizeBytes).toBe(15000000);
    });

    it('throws error when image exceeds maximum allowed bytes', async () => {
      (ImageManipulator.manipulateAsync as jest.Mock).mockResolvedValue({
        uri: 'file:///cache/huge.jpg',
        width: 1000,
        height: 1000,
      });

      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
        size: MAX_SURVEY_IMAGE_SIZE_BYTES + 100,
      });

      await expect(
        prepareSurveyImage({
          uri: 'file:///photos/huge.jpg',
          type: 'image',
        })
      ).rejects.toThrow(IMAGE_SIZE_EXCEEDED_MESSAGE);
    });
  });

  describe('prepareSurveyGpx', () => {
    it('throws error when GPX is empty', async () => {
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue('');

      await expect(
        prepareSurveyGpx({
          uri: 'file:///tracks/empty.gpx',
        })
      ).rejects.toThrow(GPX_EMPTY_MESSAGE);
    });
  });
});
