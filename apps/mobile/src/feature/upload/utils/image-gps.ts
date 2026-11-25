export type ImageGpsCoordinates = {
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
};

type ExifRecord = Record<string, unknown>;

function parseRational(value: string) {
  const [numerator, denominator] = value.split('/').map(Number);

  if (!Number.isFinite(numerator)) return undefined;
  if (denominator === undefined) return numerator;
  if (!Number.isFinite(denominator) || denominator === 0) return undefined;

  return numerator / denominator;
}

function parseScalar(value: unknown): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (Array.isArray(value)) {
    if (value.length === 2 && typeof value[0] === 'number' && typeof value[1] === 'number' && value[1] !== 0) {
      return value[0] / value[1];
    }
    if (value.length > 0) return parseScalar(value[0]);
  }
  if (typeof value !== 'string') return undefined;

  const normalized = value.trim();
  const direct = Number(normalized);
  if (Number.isFinite(direct)) return direct;

  const cleaned = normalized.replace(/[^\d./+-]/g, '');
  const decimal = Number(cleaned);

  return Number.isFinite(decimal) ? decimal : parseRational(cleaned);
}

function parseCoordinatePart(value: unknown): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;

  if (typeof value === 'string') {
    const normalized = value.trim();
    const decimal = Number(normalized);

    if (Number.isFinite(decimal)) return decimal;

    const rational = parseRational(normalized);

    if (rational !== undefined && !normalized.includes(',')) return rational;

    const parts = normalized
      .replace(/[\u00b0'\";]/g, ',')
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
      .map(parseScalar);

    if (parts.length >= 2 && parts.every((part) => part !== undefined)) {
      const [degrees = 0, minutes = 0, seconds = 0] = parts as number[];
      const sign = degrees < 0 ? -1 : 1;
      return sign * (Math.abs(degrees) + minutes / 60 + seconds / 3600);
    }

    return undefined;
  }

  if (Array.isArray(value)) {
    const parts = value.map(parseScalar);

    if (parts.length >= 2 && parts.every((part) => part !== undefined)) {
      const [degrees = 0, minutes = 0, seconds = 0] = parts as number[];
      const sign = degrees < 0 ? -1 : 1;
      return sign * (Math.abs(degrees) + minutes / 60 + seconds / 3600);
    }
  }

  return undefined;
}

function normalizeExifKey(k: string): string {
  return k.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function findExifValue(exif: ExifRecord, keys: string[]) {
  const normalizedTargets = new Set(keys.map(normalizeExifKey));
  const entry = Object.entries(exif).find(([key]) => normalizedTargets.has(normalizeExifKey(key)));

  return entry?.[1];
}

const HEADING_KEYS = [
  'GPSImgDirection',
  'ImgDirection',
  'imgDirection',
  'GPSTrack',
  'GpsTrack',
  'Track',
  'track',
  'GPSDestBearing',
  'DestBearing',
  'destBearing',
  'GPSBearing',
  'Bearing',
  'bearing',
  'GPSHeading',
  'Heading',
  'heading',
  'GPSDirection',
  'Direction',
  'direction',
  'GPSCourse',
  'Course',
  'course',
  'GPSAzimuth',
  'Azimuth',
  'azimuth',
  'Compass',
  'compass',
  'CompassBearing',
  'compassBearing',
  'PoseHeadingDegrees',
  'poseHeadingDegrees',
  'FlightYawDegree',
  'flightYawDegree',
  'Yaw',
  'yaw',
  'CameraHeading',
  'cameraHeading',
  'DeviceHeading',
  'deviceHeading',
  'TrueHeading',
  'MagneticHeading',
  'Rotation',
];

function extractHeadingFromComments(exif: ExifRecord): number | undefined {
  const commentFields = ['UserComment', 'ImageDescription', 'Description', 'XPComment', 'Comments'];
  for (const field of commentFields) {
    const val = findExifValue(exif, [field]);
    if (typeof val === 'string' && val.length > 0) {
      const match = val.match(/(?:heading|bearing|direction|dir|track|azimuth|yaw)[:= ]\s*([-\d.]+)/i);
      if (match && match[1]) {
        const num = Number(match[1]);
        if (Number.isFinite(num)) {
          return ((num % 360) + 360) % 360;
        }
      }
    }
  }
  return undefined;
}

function getGpsRecord(exif: ExifRecord) {
  const nestedGps = findExifValue(exif, ['{GPS}', 'GPS']);

  return nestedGps && typeof nestedGps === 'object' && !Array.isArray(nestedGps)
    ? (nestedGps as ExifRecord)
    : undefined;
}

function applyReference(value: number, reference: unknown) {
  const normalizedReference = typeof reference === 'string' ? reference.toUpperCase() : '';

  if (normalizedReference === 'S' || normalizedReference === 'W') return -Math.abs(value);
  if (normalizedReference === 'N' || normalizedReference === 'E') return Math.abs(value);

  return value;
}

function hasCoordinateReference(reference: unknown) {
  return typeof reference === 'string' && ['N', 'S', 'E', 'W'].includes(reference.toUpperCase());
}

export function extractImageGpsCoordinates(exif: ExifRecord | null | undefined) {
  if (!exif) return null;

  const gpsRecord = getGpsRecord(exif);
  const latitudeValue =
    findExifValue(exif, ['GPSLatitude', 'latitude']) ??
    (gpsRecord ? findExifValue(gpsRecord, ['GPSLatitude', 'Latitude']) : undefined);
  const longitudeValue =
    findExifValue(exif, ['GPSLongitude', 'longitude']) ??
    (gpsRecord ? findExifValue(gpsRecord, ['GPSLongitude', 'Longitude']) : undefined);
  const latitudeReference =
    findExifValue(exif, ['GPSLatitudeRef', 'latitudeRef']) ??
    (gpsRecord ? findExifValue(gpsRecord, ['GPSLatitudeRef', 'LatitudeRef']) : undefined);
  const longitudeReference =
    findExifValue(exif, ['GPSLongitudeRef', 'longitudeRef']) ??
    (gpsRecord ? findExifValue(gpsRecord, ['GPSLongitudeRef', 'LongitudeRef']) : undefined);
  const parsedLatitude = parseCoordinatePart(latitudeValue);
  const parsedLongitude = parseCoordinatePart(longitudeValue);

  if (parsedLatitude === undefined || parsedLongitude === undefined) return null;

  const latitude = applyReference(parsedLatitude, latitudeReference);
  const longitude = applyReference(parsedLongitude, longitudeReference);

  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  if (
    latitude === 0 &&
    longitude === 0 &&
    !hasCoordinateReference(latitudeReference) &&
    !hasCoordinateReference(longitudeReference)
  ) {
    return null;
  }

  const accuracyValue =
    findExifValue(exif, ['GPSHPositioningError', 'hPositioningError', 'accuracy']) ??
    (gpsRecord ? findExifValue(gpsRecord, ['GPSHPositioningError', 'HPositioningError', 'accuracy']) : undefined);
  const headingValue =
    findExifValue(exif, HEADING_KEYS) ??
    (gpsRecord ? findExifValue(gpsRecord, HEADING_KEYS) : undefined);

  const accuracy = parseScalar(accuracyValue);
  let heading = parseScalar(headingValue);

  if (heading === undefined) {
    heading = extractHeadingFromComments(exif) ?? (gpsRecord ? extractHeadingFromComments(gpsRecord) : undefined);
  }

  let normalizedHeading: number | undefined;
  if (typeof heading === 'number' && Number.isFinite(heading)) {
    normalizedHeading = ((heading % 360) + 360) % 360;
  }

  return {
    latitude,
    longitude,
    ...(typeof accuracy === 'number' && Number.isFinite(accuracy) && accuracy >= 0 ? { accuracy } : {}),
    ...(normalizedHeading !== undefined ? { heading: Math.round(normalizedHeading * 100) / 100 } : {}),
  } satisfies ImageGpsCoordinates;
}
