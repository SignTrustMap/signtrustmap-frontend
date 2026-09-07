// apps/ops/src/config/env.ts
// Single source of truth for all environment variables & endpoints
export const env = {
  opsDomain:    import.meta.env.VITE_OPS_DOMAIN    ?? (import.meta.env.DEV ? 'localhost:5174' : 'ops.signtrustmap.site'),
  publicDomain: import.meta.env.VITE_PUBLIC_DOMAIN ?? (import.meta.env.DEV ? 'localhost:5173' : 'signtrustmap.site'),
  apiBaseUrl:   import.meta.env.VITE_API_BASE_URL  ?? (import.meta.env.DEV ? 'http://localhost:3000' : 'https://api.signtrustmap.site'),
  mapTileUrl:   import.meta.env.VITE_MAP_TILE_URL  ?? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  aiApiUrl:     import.meta.env.VITE_AI_API_URL    ?? (import.meta.env.DEV ? 'http://localhost:8000' : 'https://api.signtrustmap.site/v1/models'),
  isDev:        import.meta.env.DEV,
  isProd:       import.meta.env.PROD,
} as const

export const communityPortalUrl = env.isDev
  ? `http://${env.publicDomain}`
  : `https://${env.publicDomain}`

export const opsPortalUrl = env.isDev
  ? `http://${env.opsDomain}`
  : `https://${env.opsDomain}`

export const opsLoginUrl = env.isDev
  ? `http://${env.opsDomain}/login`
  : `https://${env.opsDomain}/login`
