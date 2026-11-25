import { Platform } from 'react-native';

import {
  ALLOW_LOCATION_ACCESS_MESSAGE,
  ENABLE_LOCATION_SERVICE_MESSAGE,
  LOCATION_NATIVE_BUILD_REQUIRED_MESSAGE,
  LOCATION_NOT_AVAILABLE_IN_BROWSER_MESSAGE,
} from '@/constants/message';
import { getMapLibre } from '@/services/maplibre';
import type { MapCoordinate } from '@/types/navigationType';
import { formatDate } from '@/utils/format-date';

export function isValidCoordinate(coord?: MapCoordinate | null): coord is MapCoordinate {
  if (!coord) return false;
  const [lon, lat] = coord;
  return (
    typeof lon === 'number' &&
    typeof lat === 'number' &&
    Number.isFinite(lon) &&
    Number.isFinite(lat) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lon) <= 180 &&
    !(lat === 0 && lon === 0)
  );
}

export function formatNoteWithDirection(baseNote: string, dir?: number): string {
  const trimmed = baseNote.trim();
  if (dir === undefined || dir === null || isNaN(dir)) {
    return trimmed.replace(/\n?\[(?:TrafficDirection|Heading|Bearing):\s*[-\d.]+°?\]/gi, '').trim();
  }
  const dirTag = `[TrafficDirection: ${dir}°]`;
  if (/\[(?:TrafficDirection|Heading|Bearing):\s*[-\d.]+°?\]/i.test(trimmed)) {
    return trimmed.replace(/\[(?:TrafficDirection|Heading|Bearing):\s*[-\d.]+°?\]/i, dirTag);
  }
  return trimmed ? `${trimmed}\n${dirTag}` : dirTag;
}

export function getCardinalDirectionLabel(deg?: number): string {
  if (deg === undefined || deg === null || isNaN(deg)) return 'Chưa chọn';
  const normalized = ((deg % 360) + 360) % 360;
  if (normalized >= 337.5 || normalized < 22.5) return 'Bắc';
  if (normalized >= 22.5 && normalized < 67.5) return 'Đông Bắc';
  if (normalized >= 67.5 && normalized < 112.5) return 'Đông';
  if (normalized >= 112.5 && normalized < 157.5) return 'Đông Nam';
  if (normalized >= 157.5 && normalized < 202.5) return 'Nam';
  if (normalized >= 202.5 && normalized < 247.5) return 'Tây Nam';
  if (normalized >= 247.5 && normalized < 292.5) return 'Tây';
  return 'Tây Bắc';
}

export async function getCurrentSurveyCoordinate(): Promise<MapCoordinate> {
  if (Platform.OS === 'web') {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      throw new Error(LOCATION_NOT_AVAILABLE_IN_BROWSER_MESSAGE);
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => resolve([coords.longitude, coords.latitude]),
        (error) => {
          reject(
            new Error(
              error.code === error.PERMISSION_DENIED
                ? ALLOW_LOCATION_ACCESS_MESSAGE
                : ENABLE_LOCATION_SERVICE_MESSAGE,
            ),
          );
        },
        { enableHighAccuracy: true, maximumAge: 10_000, timeout: 10_000 },
      );
    });
  }

  const mapLibre = getMapLibre();
  if (!mapLibre) {
    throw new Error(LOCATION_NATIVE_BUILD_REQUIRED_MESSAGE);
  }

  const hasPermission = await mapLibre.LocationManager.requestPermissions();
  if (!hasPermission) {
    throw new Error(ALLOW_LOCATION_ACCESS_MESSAGE);
  }

  const position = await mapLibre.LocationManager.getCurrentPosition();
  if (!position) {
    throw new Error(ENABLE_LOCATION_SERVICE_MESSAGE);
  }

  return [position.coords.longitude, position.coords.latitude];
}

export function parseInitialCapturedDate(dateVal?: string | null): string {
  if (!dateVal) return '';
  const trimmed = dateVal.trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    return trimmed;
  }
  return formatDate(dateVal);
}

export function parseDateToDateObject(dateStr?: string): Date {
  if (!dateStr) return new Date();
  const trimmed = dateStr.trim();
  const parts = trimmed.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    if (!Number.isNaN(date.getTime())) return date;
  }
  const parsed = new Date(dateStr);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}
