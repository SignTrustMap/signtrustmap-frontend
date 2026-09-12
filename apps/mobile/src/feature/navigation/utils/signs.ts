import type { RouteSign } from '@/api/navigation/navigation';
import type { VerifiedMapSign } from '@/types/sign-map/signMapType';

const CDN_BASE = process.env.EXPO_PUBLIC_CDN_URL?.replace(/\/$/, '') ?? 'https://cdn.signmap.site';

/**
 * Resolves a signCropUrl to an absolute URL.
 * If the value is already an absolute URL it is returned as-is;
 * otherwise it is joined with the CDN base.
 */
function resolveImageUrl(signCropUrl: string): string {
  if (!signCropUrl) return '';
  if (signCropUrl.startsWith('http://') || signCropUrl.startsWith('https://')) {
    return signCropUrl;
  }
  return `${CDN_BASE}/${signCropUrl}`;
}

export function toRouteSign(sign: VerifiedMapSign): RouteSign {
  return {
    coordinate: [sign.longitude, sign.latitude],
    id: sign.id,
    imageUrl: resolveImageUrl(sign.signCropUrl),
    name: sign.signType.nameEn,
    signCode: sign.signType.signCode,
  };
}
