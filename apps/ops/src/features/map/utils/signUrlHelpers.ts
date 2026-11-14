import type { RouteSign, VerifiedMapSign } from '@shared/types'

const S3_BASE = (
  import.meta.env.VITE_STORAGE_URL ||
  import.meta.env.VITE_S3_URL ||
  import.meta.env.VITE_CDN_URL ||
  (import.meta.env.DEV ? '/storage' : 'https://s3.signmap.site')
).replace(/\/$/, '')

export function normalizeSignCodeCase(code?: string): string {
  if (!code) return ''
  const trimmed = code.trim().replace(/\s+/g, '')
  const m = trimmed.match(/^([A-Za-z]+)\.?([0-9]+)([A-Za-z]*)$/)
  if (m) {
    return `${m[1].toUpperCase()}.${m[2]}${m[3].toLowerCase()}`
  }
  return trimmed
}

/**
 * Resolves standard representative traffic sign image URL (SVG vector) from S3 CDN.
 */
export function resolveRepresentativeSignUrl(nameEn?: string, signCode?: string): string {
  const code = normalizeSignCodeCase(signCode)
  if (code) {
    return `${S3_BASE}/stm-catalog-images/representative/${code}.svg`
  }
  if (nameEn) {
    const slug = nameEn
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
    if (slug) {
      return `${S3_BASE}/stm-catalog-images/representative/${slug}.svg`
    }
  }
  return ''
}

/**
 * Resolves image URL from S3 bucket, with auto-normalization for catalog representative SVGs.
 */
export function resolveImageUrl(signCropUrl?: string | null, signCode?: string): string {
  const cleanCode = normalizeSignCodeCase(signCode)
  const canonicalCatalogUrl = cleanCode
    ? `${S3_BASE}/stm-catalog-images/representative/${cleanCode}.svg`
    : ''

  if (!signCropUrl || signCropUrl.includes('mock/') || signCropUrl.startsWith('mock')) {
    return canonicalCatalogUrl
  }

  const raw = signCropUrl.trim()

  // Rewrite old /svg/ catalog URLs, MinIO console browser URLs, or old .png paths to canonical SVG
  if (
    cleanCode &&
    (raw.includes('minio.signmap.site/browser') ||
      raw.includes('/stm-catalog-images/svg/'))
  ) {
    return canonicalCatalogUrl
  }

  // Normalize case-sensitivity for existing S3 representative URLs
  if (raw.includes('/stm-catalog-images/representative/')) {
    return raw.replace(/\/representative\/([^/?#]+)\.svg$/i, (_, name) => {
      return `/representative/${normalizeSignCodeCase(name)}.svg`
    })
  }

  if (raw.startsWith('https://cdn.signmap.site/')) {
    const rawPath = raw.slice('https://cdn.signmap.site/'.length).replace(/^\/+/, '')
    const hasBucket = ['stm-catalog-images', 'stm-sign-crops', 'stm-raw-videos', 'stm-gpx-logs'].some((b) => rawPath.startsWith(b + '/'))
    return `${S3_BASE}/${hasBucket ? '' : 'stm-sign-crops/'}${rawPath}`
  }
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return raw
  }
  const clean = raw.replace(/^\/+/, '')
  if (clean.startsWith('representative/')) {
    return `${S3_BASE}/stm-catalog-images/${clean}`
  }
  const hasBucket = ['stm-catalog-images', 'stm-sign-crops', 'stm-raw-videos', 'stm-gpx-logs'].some((b) => clean.startsWith(b + '/'))
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
  if (upper.startsWith('T')) return 'OTHER'
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
