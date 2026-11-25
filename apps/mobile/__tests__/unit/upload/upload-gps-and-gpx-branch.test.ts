import { extractGpxGpsData, parseGpxContent } from '@/feature/upload/utils/gpx';
import {
  buildCompanionGpxXml,
  createCompanionGpxDescriptor,
  estimateEndCoordinate,
  estimateEndPoint,
  extractVideoMetadata,
  extractVideoMetadataAsync,
} from '@/feature/upload/utils/video-gps';
import * as videoFileGps from '@/feature/upload/utils/video-file-gps';

describe('Upload GPX & Video GPS Branch Coverage', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  describe('gpx.ts', () => {
    it('returns empty coordinates for invalid or empty GPX input', () => {
      expect(parseGpxContent('')).toEqual({ coordinates: [] });
      expect(parseGpxContent(null as any)).toEqual({ coordinates: [] });
    });

    it('parses trkpt, self-closing wpt, and rtept while skipping out-of-range coordinates', () => {
      const xml = `
        <gpx xmlns:g="http://example.com">
          <g:trkpt lat="10.7700" lon="106.7000"><time> 2026-01-01T10:00:00Z </time><ele>12.5</ele></g:trkpt>
          <wpt lat="95.0" lon="106.7" />
          <wpt lat="10.7750" lon="106.7050" />
          <rtept lat="10.7800" lon="106.7100"><time>2026-01-01T10:02:00Z</time></rtept>
        </gpx>
      `;
      const parsed = parseGpxContent(xml);
      expect(parsed.coordinates).toHaveLength(3);
      expect(parsed.firstPoint).toEqual({
        latitude: 10.77,
        longitude: 106.7,
        time: '2026-01-01T10:00:00Z',
        elevation: 12.5,
      });
      expect(parsed.lastPoint).toEqual({
        latitude: 10.78,
        longitude: 106.71,
        time: '2026-01-01T10:02:00Z',
        elevation: undefined,
      });
      expect(parsed.startTime).toBe('2026-01-01T10:00:00Z');
    });

    it('handles extractGpxGpsData for HTTP errors, valid responses, and exceptions', async () => {
      globalThis.fetch = jest.fn().mockResolvedValueOnce({ ok: false });
      expect(await extractGpxGpsData('https://example.com/track.gpx')).toBeNull();

      globalThis.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        text: async () => '<gpx><trkpt lat="10.7" lon="106.7"/></gpx>',
      });
      const localRes = await extractGpxGpsData('file:///track.gpx');
      expect(localRes?.coordinates).toEqual([[106.7, 10.7]]);

      globalThis.fetch = jest.fn().mockRejectedValueOnce(new Error('Read error'));
      expect(await extractGpxGpsData('file:///bad.gpx')).toBeNull();
    });
  });

  describe('video-gps.ts', () => {
    it('estimates end coordinate and generates companion GPX descriptors cleanly', () => {
      const endDefault = estimateEndCoordinate(106.7, 10.7, -5);
      expect(endDefault).toHaveLength(2);
      const endPoint = estimateEndPoint([106.7, 10.7], 120);
      expect(endPoint[0]).toBeGreaterThan(106.7);

      const xmlFallbackDate = buildCompanionGpxXml({
        startCoordinate: [106.7, 10.7],
        endCoordinate: [106.71, 10.71],
        capturedAt: 'not-a-date',
      });
      expect(xmlFallbackDate).toContain('<gpx version="1.1"');

      const desc = createCompanionGpxDescriptor({
        startCoordinate: [106.7, 10.7],
        endCoordinate: [106.71, 10.71],
        capturedAt: '2026-01-01T00:00:00Z',
        fileName: 'custom.gpx',
      });
      expect(desc.name).toBe('custom.gpx');
      expect(desc.uri.startsWith('data:application/gpx+xml;utf8,')).toBe(true);
    });

    it('extracts sync & async video metadata with MediaStore vs container fallbacks', async () => {
      // Millisecond duration normalization & valid MediaStore GPS
      const valid = extractVideoMetadata({
        uri: 'file:///v1.mp4',
        duration: 15000,
        creationTime: 1700000000000,
        location: { latitude: 10.77, longitude: 106.7 },
      });
      expect(valid.durationSeconds).toBe(15);
      expect(valid.hasDeviceGps).toBe(true);
      expect(await extractVideoMetadataAsync({
        uri: 'file:///v1.mp4',
        duration: 15000,
        location: { latitude: 10.77, longitude: 106.7 },
      })).toMatchObject({ hasDeviceGps: true, durationSeconds: 15 });

      // Missing GPS -> falls back to extractGpsFromVideoFile success
      const spy = jest.spyOn(videoFileGps, 'extractGpsFromVideoFile').mockResolvedValueOnce({
        latitude: 10.8,
        longitude: 106.8,
        durationSeconds: 42,
        source: 'quicktime_xyz',
      });
      const recovered = await extractVideoMetadataAsync({
        uri: 'file:///v2.mp4',
        duration: 0,
        creationTime: -1,
        location: null,
      });
      expect(spy).toHaveBeenCalledWith('file:///v2.mp4');
      expect(recovered.hasDeviceGps).toBe(true);
      expect(recovered.durationSeconds).toBe(42);
      expect(recovered.startCoordinate).toEqual([106.8, 10.8]);

      // Container lookup throws -> falls back to sync default
      spy.mockRejectedValueOnce(new Error('IO err'));
      const fallback = await extractVideoMetadataAsync({ uri: 'file:///v3.mp4' });
      expect(fallback.hasDeviceGps).toBe(false);
    });
  });
});
