/**
 * Centralized environment configuration and runtime endpoint validation for Operations Command Center.
 * Single Source of Truth for environment variables per RULE.md Section 10.
 */

/**
 * Format domain string to full URL with protocol based on current execution mode.
 * @param domainOrUrl Hostname or URL string
 * @param isDev True when running in Vite development mode
 * @returns Fully-qualified HTTP/HTTPS URL
 */
function formatUrl(domainOrUrl: string, isDev: boolean): string {
  if (!domainOrUrl) return ''
  if (domainOrUrl.startsWith('http://') || domainOrUrl.startsWith('https://')) {
    return domainOrUrl
  }
  return isDev ? `http://${domainOrUrl}` : `https://${domainOrUrl}`
}

/**
 * Validate required environment keys at startup.
 * @param variables Dictionary of parsed environment values
 * @param requiredKeys Keys that must be defined for application stability
 */
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
  gatewayUrl:   import.meta.env.VITE_GATEWAY_URL || '',
  apiBaseUrl:   import.meta.env.VITE_API_BASE_URL || '',
  mapTileUrl:   import.meta.env.VITE_MAP_TILE_URL || '',
  aiApiUrl:     import.meta.env.VITE_AI_API_URL || '/ai',
  aiopsEdgeUrl: import.meta.env.VITE_AIOPS_EDGE_URL || import.meta.env.VITE_AI_API_URL || '/ai',
  storageUrl:   import.meta.env.VITE_STORAGE_URL || import.meta.env.VITE_S3_URL || '/storage',
  isDev:        import.meta.env.DEV,
  isProd:       import.meta.env.PROD,
  mode:         import.meta.env.MODE,
} as const

validateEnv(
  {
    VITE_OPS_DOMAIN: env.opsDomain,
    VITE_PUBLIC_DOMAIN: env.publicDomain,
    VITE_API_BASE_URL: env.apiBaseUrl || 'default',
    VITE_AI_API_URL: env.aiApiUrl || 'default',
  },
  ['VITE_OPS_DOMAIN', 'VITE_PUBLIC_DOMAIN']
)

export const opsPortalUrl = formatUrl(env.opsDomain, env.isDev)
export const opsLoginUrl = `${opsPortalUrl}/login`
export const communityPortalUrl = formatUrl(env.publicDomain, env.isDev)
