// apps/ops/src/config/env.ts
// Single source of truth for all environment variables & endpoints
const rawOpsDomain: string = import.meta.env.VITE_OPS_DOMAIN || (import.meta.env.DEV ? 'localhost:5174' : 'ops.signtrustmap.site')
const rawPublicDomain: string = import.meta.env.VITE_PUBLIC_DOMAIN || (import.meta.env.DEV ? 'localhost:5173' : 'signtrustmap.site')

function normalizeUrl(domain: string, isDev: boolean): string {
  if (!domain) return isDev ? 'http://localhost:5173' : 'https://signtrustmap.site'
  if (domain.startsWith('http://') || domain.startsWith('https://')) {
    return domain
  }
  return isDev ? `http://${domain}` : `https://${domain}`
}

export const env = {
  opsDomain:    rawOpsDomain,
  publicDomain: rawPublicDomain,
  apiBaseUrl:   import.meta.env.VITE_API_BASE_URL  || (import.meta.env.DEV ? 'http://localhost:3000' : 'https://api.signtrustmap.site'),
  mapTileUrl:   import.meta.env.VITE_MAP_TILE_URL  || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  aiApiUrl:     import.meta.env.VITE_AI_API_URL    || (import.meta.env.DEV ? 'http://localhost:8000' : 'https://api.signtrustmap.site/v1/models'),
  isDev:        import.meta.env.DEV,
  isProd:       import.meta.env.PROD,
} as const

export const communityPortalUrl = normalizeUrl(rawPublicDomain, import.meta.env.DEV)
export const opsPortalUrl = normalizeUrl(rawOpsDomain, import.meta.env.DEV)
export const opsLoginUrl = `${opsPortalUrl}/login`
