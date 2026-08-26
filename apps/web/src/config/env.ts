// apps/web/src/config/env.ts
// Single point of truth for all environment variables.
// Never call import.meta.env directly outside this file.

export const env = {
  opsDomain:    import.meta.env.VITE_OPS_DOMAIN    ?? 'localhost:5174',
  publicDomain: import.meta.env.VITE_PUBLIC_DOMAIN ?? 'localhost:5173',
  apiBaseUrl:   import.meta.env.VITE_API_BASE_URL  ?? 'http://localhost:3000',
  mapTileUrl:   import.meta.env.VITE_MAP_TILE_URL  ?? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  isDev:        import.meta.env.DEV,
  isProd:       import.meta.env.PROD,
} as const;

export const opsLoginUrl = `https://${env.opsDomain}/login`;
