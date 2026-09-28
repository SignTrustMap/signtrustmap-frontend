import type { RouteSign, VerifiedMapSign } from '@shared/types'

const S3_BASE = (import.meta.env.VITE_S3_URL || import.meta.env.VITE_CDN_URL || 'https://s3.signmap.site').replace(/\/$/, '')

/**
 * Resolves standard representative traffic sign image URL (vector/PNG) from S3 CDN.
 */
export function resolveRepresentativeSignUrl(nameEn?: string, signCode?: string): string {
  if (nameEn) {
    const slug = nameEn
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
    if (slug) {
      return `${S3_BASE}/stm-sign-crops/representative/${slug}.png`
    }
  }
  if (signCode) {
    return `${S3_BASE}/stm-sign-crops/representative/${signCode.toUpperCase().trim()}.png`
  }
  return ''
}

/**
 * Resolves field camera crop image URL from S3 bucket.
 */
export function resolveImageUrl(signCropUrl?: string | null): string {
  if (!signCropUrl || signCropUrl.includes('mock/') || signCropUrl.startsWith('mock')) {
    return ''
  }
  if (signCropUrl.startsWith('https://cdn.signmap.site/')) {
    const rawPath = signCropUrl.slice('https://cdn.signmap.site/'.length).replace(/^\/+/, '')
    const hasBucket = ['stm-sign-crops', 'stm-raw-videos', 'stm-gpx-logs'].some((b) => rawPath.startsWith(b + '/'))
    return `${S3_BASE}/${hasBucket ? '' : 'stm-sign-crops/'}${rawPath}`
  }
  if (signCropUrl.startsWith('http://') || signCropUrl.startsWith('https://')) {
    return signCropUrl
  }
  const clean = signCropUrl.replace(/^\/+/, '')
  const hasBucket = ['stm-sign-crops', 'stm-raw-videos', 'stm-gpx-logs'].some((b) => clean.startsWith(b + '/'))
  return `${S3_BASE}/${hasBucket ? '' : 'stm-sign-crops/'}${clean}`
}

/**
 * Determine sign category from sign code (P, W, R, I, S).
 */
export function determineSignCategory(signCode?: string): RouteSign['category'] {
  if (!signCode) return 'OTHER'
  const upper = signCode.toUpperCase()
  if (upper.startsWith('P')) return 'PROHIBITORY'
  if (upper.startsWith('W')) return 'WARNING'
  if (upper.startsWith('R')) return 'MANDATORY'
  if (upper.startsWith('I')) return 'INFORMATION'
  if (upper.startsWith('S')) return 'TEMPORARY'
  return 'OTHER'
}

/**
 * Convert backend VerifiedMapSign into client RouteSign.
 */
export function toRouteSign(sign: VerifiedMapSign): RouteSign {
  const signCode = sign.signType?.signCode ?? ''
  const nameEn = sign.signType?.nameEn ?? ''
  const nameVi = sign.signType?.nameVi ?? ''
  const name = nameVi || nameEn || signCode || 'Biển báo giao thông'

  return {
    id: sign.id,
    coordinate: [sign.longitude, sign.latitude],
    imageUrl: resolveRepresentativeSignUrl(nameEn, signCode),
    actualCropUrl: resolveImageUrl(sign.signCropUrl),
    name,
    signCode,
    category: determineSignCategory(signCode),
  }
}
