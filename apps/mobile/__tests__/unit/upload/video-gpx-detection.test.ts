import { parseGpxContent } from '@/feature/upload/utils/gpx';
import type { ImageGpsCoordinates } from '@/feature/upload/utils/image-gps';

function isValidGpsCoordinates(
  coordinates: ImageGpsCoordinates | null | undefined,
): coordinates is ImageGpsCoordinates {
  return Boolean(
    coordinates &&
    Number.isFinite(coordinates.latitude) &&
    Number.isFinite(coordinates.longitude) &&
    Math.abs(coordinates.latitude) <= 90 &&
    Math.abs(coordinates.longitude) <= 180 &&
    !(coordinates.latitude === 0 && coordinates.longitude === 0),
  );
}

function checkVideoMissingGpx(params: {
  assetType: 'image' | 'video';
  gps: ImageGpsCoordinates | null | undefined;
  hasGpxFile: boolean;
}): boolean {
  const isVideo = params.assetType === 'video';
  const hasGps = isValidGpsCoordinates(params.gps);
  return isVideo && !hasGps && !params.hasGpxFile;
}

describe('Video GPX Detection & Submission Guard Flow', () => {
  describe('isValidGpsCoordinates validation', () => {
    it('accepts valid GPS coordinates in Vietnam', () => {
      const coords = { latitude: 10.762622, longitude: 106.660172 };
      expect(isValidGpsCoordinates(coords)).toBe(true);
    });

    it('rejects null or undefined coordinates', () => {
      expect(isValidGpsCoordinates(null)).toBe(false);
      expect(isValidGpsCoordinates(undefined)).toBe(false);
    });

    it('rejects (0, 0) sentinel missing GPS coordinates', () => {
      expect(isValidGpsCoordinates({ latitude: 0, longitude: 0 })).toBe(false);
    });

    it('rejects out-of-range coordinates', () => {
      expect(isValidGpsCoordinates({ latitude: 95.0, longitude: 106.0 })).toBe(false);
      expect(isValidGpsCoordinates({ latitude: 10.0, longitude: 185.0 })).toBe(false);
    });
  });

  describe('GPX Trajectory Parsing', () => {
    it('correctly extracts coordinates and start timestamp from valid GPX XML', () => {
      const gpxXml = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="SignTrustMap">
  <trk>
    <name>Survey Route</name>
    <trkseg>
      <trkpt lat="10.776900" lon="106.700900">
        <time>2026-03-01T10:00:00.000Z</time>
      </trkpt>
      <trkpt lat="10.778000" lon="106.702000">
        <time>2026-03-01T10:01:00.000Z</time>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`;

      const data = parseGpxContent(gpxXml);
      expect(data.coordinates).toHaveLength(2);
      expect(data.firstPoint?.latitude).toBeCloseTo(10.7769);
      expect(data.firstPoint?.longitude).toBeCloseTo(106.7009);
      expect(data.startTime).toBe('2026-03-01T10:00:00.000Z');
      expect(data.lastPoint?.latitude).toBeCloseTo(10.778);
    });

    it('returns empty coordinates when GPX XML contains no track points', () => {
      const emptyGpx = `<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1"><trk><name>Empty</name></trk></gpx>`;
      const data = parseGpxContent(emptyGpx);
      expect(data.coordinates).toHaveLength(0);
      expect(data.firstPoint).toBeUndefined();
    });
  });

  describe('Video GPX requirement check before moving to details screen', () => {
    it('flags video as missing GPX when video has no embedded GPS and no GPX file', () => {
      const isMissing = checkVideoMissingGpx({
        assetType: 'video',
        gps: null,
        hasGpxFile: false,
      });
      expect(isMissing).toBe(true);
    });

    it('does NOT flag video when video has embedded GPS', () => {
      const isMissing = checkVideoMissingGpx({
        assetType: 'video',
        gps: { latitude: 10.762622, longitude: 106.660172 },
        hasGpxFile: false,
      });
      expect(isMissing).toBe(false);
    });

    it('does NOT flag video when user has attached a companion GPX file', () => {
      const isMissing = checkVideoMissingGpx({
        assetType: 'video',
        gps: null,
        hasGpxFile: true,
      });
      expect(isMissing).toBe(false);
    });

    it('does NOT flag image assets for video GPX requirement', () => {
      const isMissing = checkVideoMissingGpx({
        assetType: 'image',
        gps: null,
        hasGpxFile: false,
      });
      expect(isMissing).toBe(false);
    });
  });
});
