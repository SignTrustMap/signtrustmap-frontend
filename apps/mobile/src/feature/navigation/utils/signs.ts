import type { RouteSign } from '@/api/navigation/navigation';
import type { VerifiedMapSign } from '@/types/sign-map/signMapType';

const CDN_BASE = process.env.EXPO_PUBLIC_CDN_URL?.replace(/\/$/, '') ?? 'https://cdn.signmap.site';

export const TARGET_SIGN_IMAGE_URL =
  'https://cdn.signmap.site/uploads/eaa2eac3-be4f-4a51-a822-6a8757978d58/f0f86c63-e05b-4baa-bae8-ae81e01a4e7d/a8a881f2-c218-4394-8b8d-7de40de1388f/uk-20mph-speed-limit-sign.jpg';

/**
 * Resolves a representative official sign graphic URL from S3 based on the signCode.
 * If not present or mock, falls back to the clean target sign image.
 */
export function resolveRepresentativeSignUrl(signCode?: string): string {
  if (!signCode) {
    return TARGET_SIGN_IMAGE_URL;
  }
  return `https://s3.signmap.site/stm-sign-crops/representative/${signCode.toUpperCase().trim()}.png`;
}

/**
 * Resolves a signCropUrl to an absolute URL.
 * Mock URLs from the backend are replaced with the verified sample sign image.
 * Absolute URLs pass through unchanged, and valid relative paths are prefixed with the CDN base.
 */
export function resolveImageUrl(signCropUrl: string): string {
  if (!signCropUrl || signCropUrl.includes('mock/') || signCropUrl.startsWith('mock')) {
    return TARGET_SIGN_IMAGE_URL;
  }
  if (signCropUrl.startsWith('http://') || signCropUrl.startsWith('https://')) {
    return signCropUrl;
  }
  return `${CDN_BASE}/${signCropUrl}`;
}

export function toRouteSign(sign: VerifiedMapSign): RouteSign {
  const signCode = sign.signType?.signCode ?? '';
  return {
    coordinate: [sign.longitude, sign.latitude],
    id: sign.id,
    // Map Marker uses the clean, official representative PNG icon
    imageUrl: resolveRepresentativeSignUrl(signCode),
    // Camera evidence crop photo is preserved for inspection in Callouts/Details
    actualCropUrl: resolveImageUrl(sign.signCropUrl),
    name: sign.signType?.nameEn || signCode || 'Traffic Sign',
    signCode: signCode,
  };
}
