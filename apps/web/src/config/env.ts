// apps/web/src/config/env.ts
// Single source of truth for all environment variables & endpoints.

function formatUrl(domainOrUrl: string, isDev: boolean): string {
  if (!domainOrUrl) return ''
  if (domainOrUrl.startsWith('http://') || domainOrUrl.startsWith('https://')) {
    return domainOrUrl
  }
  return isDev ? `http://${domainOrUrl}` : `https://${domainOrUrl}`
}

function validateEnv(variables: Record<string, string | undefined>, requiredKeys: string[]): void {
  const missing = requiredKeys.filter((key) => !variables[key])
  if (missing.length > 0) {
    console.warn(
      `%c[Env Validation] Missing required environment variable(s): ${missing.join(', ')}. Please verify your .env configuration.`,
      'color: #f59e0b; font-weight: bold;'
    )
  }
}

export const env = {
  opsDomain:    import.meta.env.VITE_OPS_DOMAIN || '',
  publicDomain: import.meta.env.VITE_PUBLIC_DOMAIN || '',
  apiBaseUrl:   import.meta.env.VITE_API_BASE_URL || '',
  mapTileUrl:   import.meta.env.VITE_MAP_TILE_URL || '',
  aiApiUrl:     import.meta.env.VITE_AI_API_URL || '',
  isDev:        import.meta.env.DEV,
  isProd:       import.meta.env.PROD,
  mode:         import.meta.env.MODE,
} as const

// Runtime validation on startup
validateEnv(
  {
    VITE_OPS_DOMAIN: env.opsDomain,
    VITE_PUBLIC_DOMAIN: env.publicDomain,
    VITE_API_BASE_URL: env.apiBaseUrl,
  },
  ['VITE_OPS_DOMAIN', 'VITE_PUBLIC_DOMAIN', 'VITE_API_BASE_URL']
)

export const opsPortalUrl = formatUrl(env.opsDomain, env.isDev)
export const opsLoginUrl = `${opsPortalUrl}/login`
export const communityPortalUrl = formatUrl(env.publicDomain, env.isDev)
