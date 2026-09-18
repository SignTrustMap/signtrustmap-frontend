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
