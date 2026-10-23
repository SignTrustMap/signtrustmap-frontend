import type { ImageGpsCoordinates } from '@/feature/upload/utils/image-gps';

export type SelectedSurveyMedia = {
  capturedAt?: string;
  fileName?: string | null;
  mimeType?: string;
  type: 'image' | 'video';
  uri: string;
  duration?: number;
  assetId?: string;
  gps?: ImageGpsCoordinates | null;
  hasEmbeddedGps?: boolean;
};

export type SelectedGpxFile = {
  name: string;
  uri: string;
  mimeType?: string;
};

export function isValidGpsCoordinates(
  coordinates: ImageGpsCoordinates | null | undefined,
): coordinates is ImageGpsCoordinates {
  return Boolean(
    coordinates &&
    Number.isFinite(coordinates.latitude) &&
    Number.isFinite(coordinates.longitude) &&
    Math.abs(coordinates.latitude) <= 90 &&
    Math.abs(coordinates.longitude) <= 180 &&
    // Reject (0, 0) — it's a sentinel "no GPS" value on many devices
    !(coordinates.latitude === 0 && coordinates.longitude === 0),
  );
}
