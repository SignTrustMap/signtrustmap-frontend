import { apiRequest } from '@/api/api-client';
import {
  CATALOG_TTL_MS,
  isCatalogStale,
  loadCatalogFromStorage,
  saveCatalogToStorage,
  type CatalogData,
} from './catalog-storage';

export { CATALOG_TTL_MS } from './catalog-storage';

export type CatalogCategory = {
  code: string;
  description: string | null;
  id: number;
  nameEn: string;
  nameVi: string;
};

export type CatalogSign = {
  category: CatalogCategory;
  categoryId: number;
  description: string | null;
  id: number;
  nameEn: string;
  nameVi: string;
  representativeImageKey: string | null;
  signCode: string;
};

type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type GetCatalogOptions = {
  forceRefresh?: boolean;
  signal?: AbortSignal;
};

/**
 * Directly fetch all sign categories and all sign types from remote API.
 */
export async function fetchCatalogFromApi(
  accessToken: string,
  signal?: AbortSignal,
): Promise<CatalogData> {
  const [categories, firstPage] = await Promise.all([
    apiRequest<CatalogCategory[]>('/catalog/categories', { signal }, accessToken),
    apiRequest<PageResponse<CatalogSign>>('/catalog/sign-types?page=0&size=100', { signal }, accessToken),
  ]);

  let allSigns = [...firstPage.content];
  if (firstPage.totalPages > 1) {
    const extraPages = await Promise.all(
      Array.from({ length: firstPage.totalPages - 1 }, (_, i) =>
        apiRequest<PageResponse<CatalogSign>>(`/catalog/sign-types?page=${i + 1}&size=100`, { signal }, accessToken),
      ),
    );
    for (const p of extraPages) {
      allSigns = allSigns.concat(p.content);
    }
  }

  return { categories, signs: allSigns };
}

/**
 * Retrieve traffic sign catalog with persistent device local storage caching (1 week TTL).
 *
 * 1. If cached on device and within 1-week TTL: returns local storage data immediately (0 network calls).
 * 2. If cached on device but older than 1 week: attempts background revalidation. If offline, returns cached data.
 * 3. If not cached locally or forceRefresh is true: calls remote API, writes to local storage, and returns.
 */
export async function getCatalog(
  accessToken: string,
  options?: GetCatalogOptions | AbortSignal,
): Promise<CatalogData> {
  const opts: GetCatalogOptions =
    options instanceof AbortSignal ? { signal: options } : (options ?? {});

  // 1. Check local device storage if not forcing a remote refresh
  if (!opts.forceRefresh) {
    const cached = await loadCatalogFromStorage();
    if (cached?.data?.signs && cached.data.signs.length > 0) {
      // If within 1 week TTL, return local storage directly
      if (!isCatalogStale(cached.cachedAt, CATALOG_TTL_MS)) {
        return cached.data;
      }

      // If stale (> 1 week), attempt fresh fetch from API
      try {
        const fresh = await fetchCatalogFromApi(accessToken, opts.signal);
        await saveCatalogToStorage(fresh);
        return fresh;
      } catch (err) {
        // If device is offline or API fails, gracefully serve stale cached catalog
        console.warn('[Catalog] Background revalidation failed, serving cached catalog:', err);
        return cached.data;
      }
    }
  }

  // 2. Cache miss or forced refresh: fetch from remote API and persist to local storage
  const fresh = await fetchCatalogFromApi(accessToken, opts.signal);
  await saveCatalogToStorage(fresh);
  return fresh;
}
