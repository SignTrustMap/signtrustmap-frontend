import type { RouteSign } from '@/api/navigation/navigation';
import type { VerifiedMapSign } from '@/types/signMapType';
import { env } from '@/config/env';
import { calculateDistanceMeters } from './geo';

const S3_BASE = env.storageUrl;

export const TARGET_SIGN_IMAGE_URL = `${S3_BASE}/stm-sign-crops/uploads/eaa2eac3-be4f-4a51-a822-6a8757978d58/f0f86c63-e05b-4baa-bae8-ae81e01a4e7d/a8a881f2-c218-4394-8b8d-7de40de1388f/uk-20mph-speed-limit-sign.jpg`;

export function resolveRepresentativeSignUrl(nameEn?: string, signCode?: string): string {
  const code = (signCode || '').trim();
  if (code) {
    return `${S3_BASE}/stm-catalog-images/representative/${code}.svg`;
  }
  if (nameEn) {
    const slug = nameEn
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    if (slug) {
      return `${S3_BASE}/stm-catalog-images/representative/${slug}.svg`;
    }
  }
  return '';
}

export function resolveImageUrl(signCropUrl?: string): string {
  if (
    !signCropUrl ||
    typeof signCropUrl !== 'string' ||
    signCropUrl.includes('mock/') ||
    signCropUrl.startsWith('mock')
  ) {
    return '';
  }
  let cleanUrl = signCropUrl.trim();
  // Ensure HTTPS for signmap.site to avoid Cleartext HTTP security blocking on Android & iOS
  if (
    cleanUrl.startsWith('http://s3.signmap.site') ||
    cleanUrl.startsWith('http://cdn.signmap.site') ||
    cleanUrl.startsWith('http://api.signmap.site')
  ) {
    cleanUrl = cleanUrl.replace(/^http:\/\//, 'https://');
  }
  if (cleanUrl.startsWith('https://cdn.signmap.site/')) {
    const rawPath = cleanUrl.slice('https://cdn.signmap.site/'.length).replace(/^\/+/, '');
    const hasBucket = ['stm-sign-crops', 'stm-raw-videos', 'stm-gpx-logs'].some((b) =>
      rawPath.startsWith(b + '/'),
    );
    return `${S3_BASE}/${hasBucket ? '' : 'stm-sign-crops/'}${rawPath}`;
  }
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    return cleanUrl;
  }
  const clean = cleanUrl.replace(/^\/+/, '');
  const hasBucket = ['stm-sign-crops', 'stm-raw-videos', 'stm-gpx-logs'].some((b) =>
    clean.startsWith(b + '/'),
  );
  return `${S3_BASE}/${hasBucket ? '' : 'stm-sign-crops/'}${clean}`;
}

export function toRouteSign(sign: any): RouteSign {
  const signType = sign.signType ?? sign.sign_type;
  const signCode =
    signType?.signCode ?? signType?.sign_code ?? sign.signCode ?? sign.sign_code ?? '';
  const nameEn = signType?.nameEn ?? signType?.name_en ?? sign.nameEn ?? sign.name_en ?? '';
  const nameVi = signType?.nameVi ?? signType?.name_vi ?? sign.nameVi ?? sign.name_vi ?? '';

  const rawCrop =
    sign.signCropUrl ??
    sign.sign_crop_url ??
    sign.actualCropUrl ??
    sign.actual_crop_url ??
    sign.cropUrl ??
    sign.crop_url ??
    '';

  const rawFrame =
    sign.frameUrl ??
    sign.frame_url ??
    sign.bestFrameUrl ??
    sign.best_frame_url ??
    sign.scenePhotoUrl ??
    sign.scene_photo_url ??
    sign.actualFrameUrl ??
    sign.actualFrameURl ??
    '';

  const resolvedCrop = resolveImageUrl(rawCrop);
  const resolvedFrame = resolveImageUrl(rawFrame);
  const resolvedRepresentative = resolveRepresentativeSignUrl(nameEn, signCode);

  return {
    coordinate: [sign.longitude ?? sign.coordinate?.[0], sign.latitude ?? sign.coordinate?.[1]],
    id: sign.id,
    imageUrl: resolvedRepresentative || resolvedCrop || resolvedFrame,
    actualCropUrl: resolvedCrop,
    actualFrameUrl: resolvedFrame,
    actualFrameURl: resolvedFrame,
    frameUrl: resolvedFrame,
    name: nameVi || nameEn || signCode || 'Traffic Sign',
    nameVi: nameVi || undefined,
    nameEn: nameEn || undefined,
    signCode: signCode,
    freshnessScore: sign.freshnessScore ?? sign.freshness_score,
    status: sign.status,
    roadName: sign.roadName ?? sign.road_name,
    displayAddress: sign.displayAddress ?? sign.display_address,
    lastVerifiedAt: sign.lastVerifiedAt ?? sign.last_verified_at,
    createdAt: sign.createdAt ? String(sign.createdAt) : undefined,
    allowedVehicles: (signType as any)?.allowedVehicles ?? (signType as any)?.allowed_vehicles,
  };
}

/**
 * Deduplicates multiple database sign records representing the same physical sign on the road.
 * Criteria for matching:
 * 1. Proximity within 25 meters (or practically identical <= 5m).
 * 2. Same signCode (e.g. 'P.130' === 'P.130') OR same normalized name.
 * Keeps the record with the highest freshnessScore (or most recent).
 */
export function deduplicateRouteSigns(signs: RouteSign[]): RouteSign[] {
  if (!signs || signs.length === 0) return [];

  const result: RouteSign[] = [];

  for (const sign of signs) {
    if (!Array.isArray(sign.coordinate) || sign.coordinate.length < 2) continue;

    const existingIndex = result.findIndex((existing) => {
      const dist = calculateDistanceMeters(
        sign.coordinate as [number, number],
        existing.coordinate as [number, number],
      );
      if (dist > 25) return false;

      // Practically on top of each other (<= 5m): definitely same post
      if (dist <= 5) return true;

      // Same sign code
      const codeA = sign.signCode?.toUpperCase().trim();
      const codeB = existing.signCode?.toUpperCase().trim();
      if (codeA && codeB && codeA === codeB) return true;

      // Same normalized name
      const nameA = (sign.name || sign.nameVi || '').toLowerCase().trim();
      const nameB = (existing.name || existing.nameVi || '').toLowerCase().trim();
      if (nameA && nameB && nameA === nameB) return true;

      return false;
    });

    if (existingIndex < 0) {
      result.push(sign);
    } else {
      const existing = result[existingIndex];
      const existingScore = existing.freshnessScore ?? 0;
      const currentScore = sign.freshnessScore ?? 0;
      if (currentScore > existingScore) {
        result[existingIndex] = sign;
      }
    }
  }

  return result;
}
