import type { RouteSign } from '@/api/navigation/navigation';
import type { VerifiedMapSign } from '@/types/sign-map/signMapType';

const S3_BASE = process.env.EXPO_PUBLIC_S3_URL?.replace(/\/$/, '') ?? process.env.EXPO_PUBLIC_CDN_URL?.replace(/\/$/, '') ?? 'https://s3.signmap.site';

export const TARGET_SIGN_IMAGE_URL =
  `${S3_BASE}/stm-sign-crops/uploads/eaa2eac3-be4f-4a51-a822-6a8757978d58/f0f86c63-e05b-4baa-bae8-ae81e01a4e7d/a8a881f2-c218-4394-8b8d-7de40de1388f/uk-20mph-speed-limit-sign.jpg`;

export function resolveRepresentativeSignUrl(nameEn?: string, signCode?: string): string {
  if (nameEn) {
    const slug = nameEn
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    if (slug) {
      return `${S3_BASE}/stm-sign-crops/representative/${slug}.png`;
    }
  }
  if (signCode) {
    return `${S3_BASE}/stm-sign-crops/representative/${signCode.toUpperCase().trim()}.png`;
  }
  return '';
}

export function resolveImageUrl(signCropUrl: string): string {
  if (!signCropUrl || signCropUrl.includes('mock/') || signCropUrl.startsWith('mock')) {
    return '';
  }
  if (signCropUrl.startsWith('https://cdn.signmap.site/')) {
    const rawPath = signCropUrl.slice('https://cdn.signmap.site/'.length).replace(/^\/+/, '');
    const hasBucket = ['stm-sign-crops', 'stm-raw-videos', 'stm-gpx-logs'].some((b) => rawPath.startsWith(b + '/'));
    return `${S3_BASE}/${hasBucket ? '' : 'stm-sign-crops/'}${rawPath}`;
  }
  if (signCropUrl.startsWith('http://') || signCropUrl.startsWith('https://')) {
    return signCropUrl;
  }
  const clean = signCropUrl.replace(/^\/+/, '');
  const hasBucket = ['stm-sign-crops', 'stm-raw-videos', 'stm-gpx-logs'].some((b) => clean.startsWith(b + '/'));
  return `${S3_BASE}/${hasBucket ? '' : 'stm-sign-crops/'}${clean}`;
}

export function toRouteSign(sign: VerifiedMapSign): RouteSign {
  const signCode = sign.signType?.signCode ?? '';
  const nameEn = sign.signType?.nameEn ?? '';
  return {
    coordinate: [sign.longitude, sign.latitude],
    id: sign.id,
    imageUrl: resolveRepresentativeSignUrl(nameEn, signCode),
    actualCropUrl: resolveImageUrl(sign.signCropUrl),
    name: nameEn || signCode || 'Traffic Sign',
    signCode: signCode,
  };
}
