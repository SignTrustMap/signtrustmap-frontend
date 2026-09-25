import { extractGpsFromVideoFile } from './video-file-gps';

export type VideoGpsData = {
  startCoordinate: [longitude: number, latitude: number];
  endCoordinate: [longitude: number, latitude: number];
  durationSeconds: number;
  capturedAt: string;
  hasDeviceGps: boolean;
};

/**
 * Estimates an end coordinate from a start point based on video duration.
 * Uses an average survey transit speed of ~25 km/h (~7 m/s) with reasonable min/max clamping.
 */
export function estimateEndCoordinate(
  startLon: number,
  startLat: number,
  durationSeconds = 60,
): [longitude: number, latitude: number] {
  const safeDuration = Number.isFinite(durationSeconds) && durationSeconds > 0 ? durationSeconds : 60;
  // Estimate distance in meters (clamped between 50m and 3000m)
  const distanceMeters = Math.min(3000, Math.max(50, safeDuration * 7));

  // Default bearing: Northeast (45 degrees)
  const bearingRad = (45 * Math.PI) / 180;
  const earthRadius = 6371000; // meters

  const startLatRad = (startLat * Math.PI) / 180;
  const startLonRad = (startLon * Math.PI) / 180;

  const endLatRad = Math.asin(
    Math.sin(startLatRad) * Math.cos(distanceMeters / earthRadius) +
    Math.cos(startLatRad) * Math.sin(distanceMeters / earthRadius) * Math.cos(bearingRad),
  );

  const endLonRad =
    startLonRad +
    Math.atan2(
      Math.sin(bearingRad) * Math.sin(distanceMeters / earthRadius) * Math.cos(startLatRad),
      Math.cos(distanceMeters / earthRadius) - Math.sin(startLatRad) * Math.sin(endLatRad),
    );

  const endLat = (endLatRad * 180) / Math.PI;
  const endLon = (endLonRad * 180) / Math.PI;

  return [
    Number.parseFloat(endLon.toFixed(6)),
    Number.parseFloat(endLat.toFixed(6)),
  ];
}

/**
 * Convenience wrapper for estimateEndCoordinate accepting a [longitude, latitude] tuple.
 */
export function estimateEndPoint(
  coord: [longitude: number, latitude: number],
  durationSeconds = 60,
): [longitude: number, latitude: number] {
  return estimateEndCoordinate(coord[0], coord[1], durationSeconds);
}

/**
 * Generates a valid GPX 1.1 XML string containing start and end track points with timestamps.
 * Conforms directly to Backend's `parseGpx` and `validateGpxAndTrajectory` requirements.
 */
export function buildCompanionGpxXml(params: {
  startCoordinate: [longitude: number, latitude: number];
  endCoordinate: [longitude: number, latitude: number];
  capturedAt: string;
  durationSeconds?: number;
}): string {
  const { startCoordinate, endCoordinate, capturedAt, durationSeconds = 60 } = params;
  const startDate = new Date(capturedAt);
  const validStartDate = Number.isNaN(startDate.getTime()) ? new Date() : startDate;
  const startTimeISO = validStartDate.toISOString();

  const durationMs = Math.max(1, durationSeconds) * 1000;
  const endDate = new Date(validStartDate.getTime() + durationMs);
  const endTimeISO = endDate.toISOString();

  const [startLon, startLat] = startCoordinate;
  const [endLon, endLat] = endCoordinate;

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="SignTrustMap Mobile" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>Survey Video Track</name>
    <trkseg>
      <trkpt lat="${startLat.toFixed(6)}" lon="${startLon.toFixed(6)}">
        <time>${startTimeISO}</time>
      </trkpt>
      <trkpt lat="${endLat.toFixed(6)}" lon="${endLon.toFixed(6)}">
        <time>${endTimeISO}</time>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`.trim();
}

/**
 * Creates a companion GPX file representation with data URI that can be fetched
 * seamlessly by `prepareSurveyGpx` without requiring manual file picker.
 */
export function createCompanionGpxDescriptor(params: {
  startCoordinate: [longitude: number, latitude: number];
  endCoordinate: [longitude: number, latitude: number];
  capturedAt: string;
  durationSeconds?: number;
  fileName?: string;
}): { uri: string; name: string } {
  const xml = buildCompanionGpxXml(params);
  const uri = `data:application/gpx+xml;utf8,${encodeURIComponent(xml)}`;
  const name = params.fileName ?? `companion-track-${Date.now()}.gpx`;
  return { uri, name };
}

export type RawVideoAsset = {
  id?: string;
  uri: string;
  filename?: string | null;
  duration?: number;
  creationTime?: number;
  location?: { latitude: number; longitude: number } | null;
  exif?: Record<string, unknown> | null;
};

/**
 * Synchronously extracts and normalizes video metadata if coordinates are already known.
 */
export function extractVideoMetadata(asset: RawVideoAsset): VideoGpsData {
  const durationSeconds = Number.isFinite(asset.duration) && asset.duration! > 0
    ? Math.round(asset.duration! > 1000 ? asset.duration! / 1000 : asset.duration!)
    : 60;

  let capturedAt = new Date().toISOString();
  if (asset.creationTime && asset.creationTime > 0) {
    const d = new Date(asset.creationTime);
    if (!Number.isNaN(d.getTime())) {
      capturedAt = d.toISOString();
    }
  }

  const lat = asset.location?.latitude;
  const lon = asset.location?.longitude;
  const hasValidGps = typeof lat === 'number' &&
    typeof lon === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lon) <= 180;

  const startCoordinate: [longitude: number, latitude: number] = hasValidGps
    ? [Number.parseFloat(lon!.toFixed(6)), Number.parseFloat(lat!.toFixed(6))]
    : [106.660172, 10.762622]; // Default reference coordinate

  const endCoordinate = estimateEndPoint(startCoordinate, durationSeconds);

  return {
    startCoordinate,
    endCoordinate,
    durationSeconds,
    capturedAt,
    hasDeviceGps: hasValidGps,
  };
}

/**
 * Asynchronously extracts video metadata.
 * If Android MediaStore redacted or missed GPS (e.g. dashcam NMEA, QuickTime atom, GoPro),
 * reads directly from the MP4 video container header/footer to extract true GPS and duration.
 */
export async function extractVideoMetadataAsync(asset: RawVideoAsset): Promise<VideoGpsData> {
  const syncResult = extractVideoMetadata(asset);

  // If MediaStore already provided valid GPS and a sensible duration, return immediately
  if (syncResult.hasDeviceGps && syncResult.durationSeconds > 1) {
    return syncResult;
  }

  // Fallback: inspect video file container directly
  try {
    const fileMetadata = await extractGpsFromVideoFile(asset.uri);
    if (fileMetadata) {
      const durationSeconds = (fileMetadata.durationSeconds && fileMetadata.durationSeconds > 0)
        ? fileMetadata.durationSeconds
        : syncResult.durationSeconds;

      const startCoordinate: [longitude: number, latitude: number] = [
        fileMetadata.longitude,
        fileMetadata.latitude,
      ];
      const endCoordinate = estimateEndPoint(startCoordinate, durationSeconds);

      console.log('[VideoGps] Successfully extracted GPS from video container:', {
        source: fileMetadata.source,
        latitude: fileMetadata.latitude,
        longitude: fileMetadata.longitude,
        durationSeconds,
      });

      return {
        startCoordinate,
        endCoordinate,
        durationSeconds,
        capturedAt: syncResult.capturedAt,
        hasDeviceGps: true,
      };
    }
  } catch (err) {
    console.warn('[VideoGps] Unable to inspect video file container for GPS:', err);
  }

  return syncResult;
}


