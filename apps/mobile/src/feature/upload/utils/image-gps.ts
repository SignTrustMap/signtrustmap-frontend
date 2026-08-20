export type ImageGpsCoordinates = {
  latitude: number;
  longitude: number;
};

type ExifRecord = Record<string, unknown>;

function parseRational(value: string) {
  const [numerator, denominator] = value.split('/').map(Number);

  if (!Number.isFinite(numerator)) return undefined;
  if (denominator === undefined) return numerator;
  if (!Number.isFinite(denominator) || denominator === 0) return undefined;

  return numerator / denominator;
}

function parseScalar(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value !== 'string') return undefined;

  const normalized = value.trim();
  const decimal = Number(normalized);

  return Number.isFinite(decimal) ? decimal : parseRational(normalized);
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
      .replace(/[\u00b0'\"]/g, ',')
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

function findExifValue(exif: ExifRecord, keys: string[]) {
  const normalizedKeys = new Set(keys.map((key) => key.toLowerCase()));
  const entry = Object.entries(exif).find(([key]) => normalizedKeys.has(key.toLowerCase()));

  return entry?.[1];
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

  return { latitude, longitude } satisfies ImageGpsCoordinates;
}
