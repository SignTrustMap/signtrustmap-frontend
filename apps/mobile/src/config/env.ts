/**
 * Centralized environment configuration and runtime endpoint resolution for Mobile workspace.
 * Single Source of Truth for environment variables aligned with SDD Unified API Gateway architecture.
 */

import { Platform } from 'react-native';

/**
 * Format domain or host string to a full HTTP/HTTPS URL.
 */
function normalizeUrl(urlOrHost?: string): string {
  if (!urlOrHost) return '';
  const trimmed = urlOrHost.trim().replace(/\/+$/, '');
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * Automatically rewrites localhost and 127.0.0.1 to 10.0.2.2 when running on Android emulator.
 */
function resolveAndroidHost(url: string): string {
  if (Platform.OS === 'android') {
    return url
      .replace('//localhost:', '//10.0.2.2:')
      .replace('//127.0.0.1:', '//10.0.2.2:');
  }
  return url;
}

// 1. Unified Gateway Base URL (Single Entry Point for all services)
const rawGatewayUrl = process.env.EXPO_PUBLIC_GATEWAY_URL?.trim();
const normalizedGatewayUrl = rawGatewayUrl ? normalizeUrl(rawGatewayUrl) : 'https://api.signmap.site';
export const gatewayUrl = resolveAndroidHost(normalizedGatewayUrl);

// 2. Core Backend API Base URL
// Defaults to ${gatewayUrl}/api/v1 if not explicitly provided
const rawApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const normalizedApiUrl = rawApiUrl
  ? normalizeUrl(rawApiUrl)
  : (gatewayUrl.endsWith('/api/v1') ? gatewayUrl : `${gatewayUrl}/api/v1`);
export const apiBaseUrl = resolveAndroidHost(
  normalizedApiUrl.endsWith('/api/v1') ? normalizedApiUrl : `${normalizedApiUrl}/api/v1`
);

// 3. Object Storage & Media Base URL
// Defaults to ${gatewayUrl}/storage for local Gateway or https://s3.signmap.site for production cloud
const rawStorageUrl =
  process.env.EXPO_PUBLIC_STORAGE_URL?.trim() ||
  process.env.EXPO_PUBLIC_S3_URL?.trim() ||
  process.env.EXPO_PUBLIC_CDN_URL?.trim();

const defaultStorageUrl =
  gatewayUrl.includes('api.signmap.site') || gatewayUrl.includes('signmap.site')
    ? 'https://s3.signmap.site'
    : `${gatewayUrl}/storage`;

export const storageUrl = resolveAndroidHost(
  rawStorageUrl ? normalizeUrl(rawStorageUrl) : defaultStorageUrl
);

// 4. Map Raster Tile Service URL
export const mapTileUrl =
  process.env.EXPO_PUBLIC_MAP_TILE_URL?.trim() ||
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';

// 5. Build & Release metadata
export const appCommitSha = process.env.EXPO_PUBLIC_APP_COMMIT_SHA?.trim() || '';

// 6. Google OAuth2 Configuration
export const googleConfig = {
  webClientId:
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ||
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID?.trim() ||
    '',
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() || '',
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || '',
};

export const env = {
  gatewayUrl,
  apiBaseUrl,
  storageUrl,
  s3Url: storageUrl,
  cdnUrl: storageUrl,
  mapTileUrl,
  appCommitSha,
  googleConfig,
} as const;
