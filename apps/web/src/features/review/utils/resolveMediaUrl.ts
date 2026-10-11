const S3_BASE = 'https://s3.signmap.site'

/**
 * Resolves S3 object keys or CDN URLs to accessible image source URLs.
 * Handles bucket prefix normalization and protocol checks.
 *
 * @param url - S3 object key or relative/absolute URL.
 */
export function resolveMediaUrl(url?: string | null): string {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  const clean = url.replace(/^\/+/, '')
  const hasBucket = ['stm-sign-crops', 'stm-raw-videos', 'stm-gpx-logs'].some((b) =>
    clean.startsWith(`${b}/`)
  )
  return `${S3_BASE}/${hasBucket ? '' : 'stm-sign-crops/'}${clean}`
}
