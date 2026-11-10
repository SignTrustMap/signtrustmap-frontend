import {
  getCatalog,
  fetchCatalogFromApi,
  CATALOG_TTL_MS,
} from '@/api/reviews/catalog';
import {
  loadCatalogFromStorage,
  saveCatalogToStorage,
  clearCatalogStorage,
  isCatalogStale,
} from '@/api/reviews/catalog-storage';
import * as apiClient from '@/api/api-client';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

jest.mock('@/api/api-client', () => ({
  apiRequest: jest.fn(),
}));

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///mock-dir/',
  getInfoAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
}));

describe('Catalog & Catalog Storage API Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'android';
  });

  describe('catalog-storage', () => {
    it('isCatalogStale correctly identifies fresh vs expired cache', () => {
      const now = Date.now();
      expect(isCatalogStale(now - 1000, CATALOG_TTL_MS)).toBe(false);
      expect(isCatalogStale(now - (CATALOG_TTL_MS + 5000), CATALOG_TTL_MS)).toBe(true);
    });

    it('loadCatalogFromStorage returns parsed catalog on native when file exists', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: true });
      const mockCatalogData = {
        cachedAt: Date.now(),
        data: {
          categories: [{ id: 1, code: 'P', nameVi: 'Biển cấm', nameEn: 'Prohibitory', description: null }],
          signs: [{ id: 10, signCode: 'P.102', nameVi: 'Cấm đi ngược chiều', nameEn: 'No Entry', categoryId: 1, category: {} as any, description: null, representativeImageKey: null }],
        },
      };
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockCatalogData));

      const loaded = await loadCatalogFromStorage();

      expect(FileSystem.getInfoAsync).toHaveBeenCalledWith('file:///mock-dir/traffic_sign_catalog_cache_v1.json');
      expect(loaded).toEqual(mockCatalogData);
    });

    it('loadCatalogFromStorage returns null when cache file does not exist', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: false });

      const loaded = await loadCatalogFromStorage();
      expect(loaded).toBeNull();
    });

    it('loadCatalogFromStorage returns null when file content is invalid JSON', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: true });
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce('invalid json content');

      const loaded = await loadCatalogFromStorage();
      expect(loaded).toBeNull();
    });

    it('saveCatalogToStorage writes timestamped catalog data to local file', async () => {
      const dataToSave = {
        categories: [],
        signs: [],
      };

      await saveCatalogToStorage(dataToSave);

      expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
        'file:///mock-dir/traffic_sign_catalog_cache_v1.json',
        expect.stringContaining('"cachedAt":'),
      );
    });

    it('clearCatalogStorage removes the cache file if it exists', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: true });

      await clearCatalogStorage();

      expect(FileSystem.deleteAsync).toHaveBeenCalledWith(
        'file:///mock-dir/traffic_sign_catalog_cache_v1.json',
        { idempotent: true },
      );
    });
  });

  describe('fetchCatalogFromApi', () => {
    it('fetches categories and all sign types across single page', async () => {
      const mockCategories = [{ id: 1, code: 'P', nameVi: 'Biển cấm' }];
      const mockPageResponse = {
        content: [{ id: 101, signCode: 'P.101' }],
        totalPages: 1,
        totalElements: 1,
        page: 0,
        size: 100,
      };

      (apiClient.apiRequest as jest.Mock)
        .mockResolvedValueOnce(mockCategories)
        .mockResolvedValueOnce(mockPageResponse);

      const catalog = await fetchCatalogFromApi('token-abc');

      expect(catalog.categories).toEqual(mockCategories);
      expect(catalog.signs).toEqual(mockPageResponse.content);
    });

    it('fetches additional pages when totalPages > 1', async () => {
      const mockCategories = [{ id: 1, code: 'W', nameVi: 'Biển cảnh báo' }];
      const page1 = {
        content: [{ id: 1, signCode: 'W.201' }],
        totalPages: 2,
        totalElements: 2,
        page: 0,
        size: 1,
      };
      const page2 = {
        content: [{ id: 2, signCode: 'W.202' }],
        totalPages: 2,
        totalElements: 2,
        page: 1,
        size: 1,
      };

      (apiClient.apiRequest as jest.Mock)
        .mockResolvedValueOnce(mockCategories)
        .mockResolvedValueOnce(page1)
        .mockResolvedValueOnce(page2);

      const catalog = await fetchCatalogFromApi('token-abc');

      expect(catalog.signs).toHaveLength(2);
      expect(catalog.signs[0].signCode).toBe('W.201');
      expect(catalog.signs[1].signCode).toBe('W.202');
    });
  });

  describe('getCatalog', () => {
    it('returns fresh cached catalog directly without network call', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: true });
      const mockCache = {
        cachedAt: Date.now() - 1000 * 60 * 60, // 1 hour ago (within 7 days TTL)
        data: {
          categories: [{ id: 1, code: 'P' }],
          signs: [{ id: 101, signCode: 'P.101' }],
        },
      };
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockCache));

      const catalog = await getCatalog('token-123');

      expect(catalog).toEqual(mockCache.data);
      expect(apiClient.apiRequest).not.toHaveBeenCalled();
    });

    it('revalidates from API when cache is stale (> 7 days)', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: true });
      const staleCache = {
        cachedAt: Date.now() - 1000 * 60 * 60 * 24 * 10, // 10 days ago (stale)
        data: {
          categories: [{ id: 1, code: 'OLD' }],
          signs: [{ id: 101, signCode: 'OLD.1' }],
        },
      };
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce(JSON.stringify(staleCache));

      const freshData = {
        categories: [{ id: 1, code: 'NEW' }],
        signs: [{ id: 202, signCode: 'NEW.2' }],
      };
      (apiClient.apiRequest as jest.Mock)
        .mockResolvedValueOnce(freshData.categories)
        .mockResolvedValueOnce({ content: freshData.signs, totalPages: 1 });

      const catalog = await getCatalog('token-123');

      expect(catalog.signs[0].signCode).toBe('NEW.2');
    });

    it('gracefully returns stale cache when background revalidation fails (offline mode)', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: true });
      const staleCache = {
        cachedAt: Date.now() - 1000 * 60 * 60 * 24 * 15, // 15 days ago
        data: {
          categories: [{ id: 1, code: 'OFFLINE_CAT' }],
          signs: [{ id: 101, signCode: 'OFFLINE.1' }],
        },
      };
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce(JSON.stringify(staleCache));

      // Network fails
      (apiClient.apiRequest as jest.Mock).mockRejectedValueOnce(new Error('Network offline'));

      const catalog = await getCatalog('token-123');

      expect(catalog).toEqual(staleCache.data);
    });

    it('forces API fetch and persists when forceRefresh is true', async () => {
      const freshData = {
        categories: [{ id: 2, code: 'REFRESHED' }],
        signs: [{ id: 303, signCode: 'REF.1' }],
      };
      (apiClient.apiRequest as jest.Mock)
        .mockResolvedValueOnce(freshData.categories)
        .mockResolvedValueOnce({ content: freshData.signs, totalPages: 1 });

      const catalog = await getCatalog('token-123', { forceRefresh: true });

      expect(catalog.signs[0].signCode).toBe('REF.1');
      expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
    });
  });
});
