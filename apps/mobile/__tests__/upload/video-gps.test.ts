import {
  buildCompanionGpxXml,
  createCompanionGpxDescriptor,
  estimateEndCoordinate,
  estimateEndPoint,
  extractVideoMetadata,
} from '@/feature/upload/utils/video-gps';


describe('video-gps utility', () => {
  const startCoord: [number, number] = [106.691383, 10.770046];
  const capturedAt = '2026-09-18T10:00:00.000Z';

  describe('estimateEndCoordinate and estimateEndPoint', () => {
    it('estimates a reasonable end coordinate within valid latitude/longitude bounds', () => {
      const end = estimateEndCoordinate(startCoord[0], startCoord[1], 120);
      expect(end).toHaveLength(2);
      expect(Number.isFinite(end[0])).toBe(true);
      expect(Number.isFinite(end[1])).toBe(true);
      expect(Math.abs(end[0])).toBeLessThanOrEqual(180);
      expect(Math.abs(end[1])).toBeLessThanOrEqual(90);
      // Ensure end point is distinct from start point
      expect(end[0]).not.toBe(startCoord[0]);
      expect(end[1]).not.toBe(startCoord[1]);
    });

    it('estimateEndPoint wraps coordinate tuple correctly', () => {
      const endFromTuple = estimateEndPoint(startCoord, 60);
      const endFromScalars = estimateEndCoordinate(startCoord[0], startCoord[1], 60);
      expect(endFromTuple).toEqual(endFromScalars);
    });

    it('clamps distance safely for long video durations up to 8 hours', () => {
      const end8h = estimateEndPoint(startCoord, 28800);
      expect(Number.isFinite(end8h[0])).toBe(true);
      expect(Number.isFinite(end8h[1])).toBe(true);
    });
  });

  describe('buildCompanionGpxXml', () => {
    it('generates a valid GPX 1.1 XML string with track points matching backend requirements', () => {
      const endCoord: [number, number] = [106.695, 10.775];
      const xml = buildCompanionGpxXml({
        startCoordinate: startCoord,
        endCoordinate: endCoord,
        capturedAt,
        durationSeconds: 90,
      });

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<gpx version="1.1"');
      expect(xml).toContain('<trk>');
      expect(xml).toContain('<trkseg>');
      expect(xml).toContain(`lat="${startCoord[1].toFixed(6)}" lon="${startCoord[0].toFixed(6)}"`);
      expect(xml).toContain(`lat="${endCoord[1].toFixed(6)}" lon="${endCoord[0].toFixed(6)}"`);
      expect(xml).toContain(`<time>${capturedAt}</time>`);
      // End timestamp must be start time + duration (90s = 1.5 min)
      const expectedEndTime = new Date(Date.parse(capturedAt) + 90 * 1000).toISOString();
      expect(xml).toContain(`<time>${expectedEndTime}</time>`);
      expect(xml).toContain('</trkseg>');
      expect(xml).toContain('</trk>');
      expect(xml).toContain('</gpx>');
    });
  });

  describe('createCompanionGpxDescriptor', () => {
    it('creates an inline GPX descriptor with data URI and filename', () => {
      const descriptor = createCompanionGpxDescriptor({
        startCoordinate: startCoord,
        endCoordinate: [106.695, 10.775],
        capturedAt,
        durationSeconds: 60,
      });

      expect(descriptor.name).toMatch(/\.gpx$/);
      expect(descriptor.uri).toMatch(/^data:application\/gpx\+xml;utf8,/);
    });
  });

  describe('extractVideoMetadata', () => {
    it('correctly extracts metadata from an asset with GPS coordinates', () => {
      const metadata = extractVideoMetadata({
        id: 'asset-123',
        uri: 'file:///path/to/video.mp4',
        filename: 'survey_run.mp4',
        duration: 120,
        creationTime: 1773830000000,
        location: { latitude: 10.770046, longitude: 106.691383 },
      });

      expect(metadata.hasDeviceGps).toBe(true);
      expect(metadata.startCoordinate).toEqual([106.691383, 10.770046]);
      expect(metadata.durationSeconds).toBe(120);
      expect(metadata.endCoordinate).toHaveLength(2);
      expect(metadata.endCoordinate[0]).not.toBe(metadata.startCoordinate[0]);
      expect(metadata.capturedAt).toBe(new Date(1773830000000).toISOString());
    });

    it('falls back gracefully when GPS coordinates are missing', () => {
      const metadata = extractVideoMetadata({
        id: 'asset-456',
        uri: 'file:///path/to/no-gps.mp4',
        filename: 'no_gps.mp4',
        duration: 65,
      });

      expect(metadata.hasDeviceGps).toBe(false);
      expect(metadata.durationSeconds).toBe(65);
      expect(metadata.startCoordinate).toEqual([106.660172, 10.762622]);
      expect(metadata.endCoordinate).toHaveLength(2);
    });
  });
});

