import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import type { CatalogCategory, CatalogSign } from '@/api/reviews/catalog';

export type CatalogData = {
  categories: CatalogCategory[];
  signs: CatalogSign[];
};

export type CachedCatalog = {
  cachedAt: number;
  data: CatalogData;
};

// Default TTL: 1 week (7 days) in milliseconds
export const CATALOG_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const WEB_CATALOG_STORAGE_KEY = 'traffic_sign_catalog_cache_v1';
const CATALOG_FILE_NAME = 'traffic_sign_catalog_cache_v1.json';

function getCatalogFilePath(): string | null {
  if (Platform.OS === 'web') return null;
  const dir = FileSystem.documentDirectory;
  if (!dir) return null;
  return `${dir.replace(/\/$/, '')}/${CATALOG_FILE_NAME}`;
}

/**
 * Load cached catalog from device local storage (FileSystem on iOS/Android, localStorage on Web).
 * Returns null if not cached or corrupted.
 */
export async function loadCatalogFromStorage(): Promise<CachedCatalog | null> {
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage === 'undefined') return null;
      const raw = localStorage.getItem(WEB_CATALOG_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed?.data?.signs && parsed?.data?.categories) {
        return parsed as CachedCatalog;
      }
      return null;
    }

    const filePath = getCatalogFilePath();
    if (!filePath) return null;

    const fileInfo = await FileSystem.getInfoAsync(filePath);
    if (!fileInfo.exists) return null;

    const raw = await FileSystem.readAsStringAsync(filePath);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (parsed?.data?.signs && parsed?.data?.categories) {
      return parsed as CachedCatalog;
    }
    return null;
  } catch (error) {
    console.warn('[CatalogStorage] Failed to read cached catalog from storage:', error);
    return null;
  }
}

/**
 * Save catalog data to device local storage with a current timestamp.
 */
export async function saveCatalogToStorage(data: CatalogData): Promise<void> {
  try {
    const payload: CachedCatalog = {
      cachedAt: Date.now(),
      data,
    };
    const raw = JSON.stringify(payload);

    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(WEB_CATALOG_STORAGE_KEY, raw);
      }
      return;
    }

    const filePath = getCatalogFilePath();
    if (!filePath) return;

    await FileSystem.writeAsStringAsync(filePath, raw);
  } catch (error) {
    console.warn('[CatalogStorage] Failed to save catalog to storage:', error);
  }
}

/**
 * Clear cached catalog from local storage.
 */
export async function clearCatalogStorage(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(WEB_CATALOG_STORAGE_KEY);
      }
      return;
    }

    const filePath = getCatalogFilePath();
    if (!filePath) return;

    const fileInfo = await FileSystem.getInfoAsync(filePath);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(filePath, { idempotent: true });
    }
  } catch (error) {
    console.warn('[CatalogStorage] Failed to clear catalog storage:', error);
  }
}

/**
 * Check if the cached catalog has exceeded the TTL duration (1 week).
 */
export function isCatalogStale(cachedAt: number, ttlMs: number = CATALOG_TTL_MS): boolean {
  return Date.now() - cachedAt > ttlMs;
}
