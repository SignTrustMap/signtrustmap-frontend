import React from 'react';
import { Animated, Platform } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import * as FileSystem from 'expo-file-system/legacy';

import {
  CATALOG_TTL_MS,
  clearCatalogStorage,
  isCatalogStale,
  loadCatalogFromStorage,
  saveCatalogToStorage,
} from '@/api/reviews/catalog-storage';
import {
  RevalidationDecisionBadge,
  RevalidationSwipeBadges,
} from '@/feature/revalidation/components/revalidation-decision-badge';

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///docs/',
  getInfoAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
}));

let mockSmallDevice = false;
jest.mock('@/utils/responsive', () => ({
  useResponsive: () => ({ isSmallDevice: mockSmallDevice }),
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    text: '#0F172A',
    backgroundElement: '#FFFFFF',
    border: '#CBD5E1',
    primary: '#0671EB',
    surface: '#FFFFFF',
  }),
}));

describe('CatalogStorage & RevalidationDecisionBadge Branch Coverage', () => {
  const originalPlatform = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSmallDevice = false;
    (FileSystem as any).documentDirectory = 'file:///docs/';
  });

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { value: originalPlatform, configurable: true });
  });

  describe('catalog-storage.ts', () => {
    const sampleData = { categories: [{ id: 1, nameEn: 'Warning' }] as any, signs: [{ id: 10 }] as any };

    it('handles web localStorage load, save, clear, missing data, and invalid JSON', async () => {
      Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
      const store = new Map<string, string>();
      (globalThis as any).localStorage = {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => store.set(k, v),
        removeItem: (k: string) => store.delete(k),
      };

      expect(await loadCatalogFromStorage()).toBeNull();

      await saveCatalogToStorage(sampleData);
      const loaded = await loadCatalogFromStorage();
      expect(loaded?.data.signs).toHaveLength(1);

      store.set('traffic_sign_catalog_cache_v1', JSON.stringify({ data: {} }));
      expect(await loadCatalogFromStorage()).toBeNull();

      store.set('traffic_sign_catalog_cache_v1', '{bad-json');
      expect(await loadCatalogFromStorage()).toBeNull();

      await clearCatalogStorage();
      expect(store.size).toBe(0);

      delete (globalThis as any).localStorage;
      expect(await loadCatalogFromStorage()).toBeNull();
      await expect(saveCatalogToStorage(sampleData)).resolves.toBeUndefined();
      await expect(clearCatalogStorage()).resolves.toBeUndefined();
    });

    it('handles native FileSystem load, save, clear, missing documentDirectory, and failures', async () => {
      Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });

      (FileSystem as any).documentDirectory = null;
      expect(await loadCatalogFromStorage()).toBeNull();
      await saveCatalogToStorage(sampleData);
      await clearCatalogStorage();

      (FileSystem as any).documentDirectory = 'file:///docs/';
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: false });
      expect(await loadCatalogFromStorage()).toBeNull();

      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: true });
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce('');
      expect(await loadCatalogFromStorage()).toBeNull();

      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: true });
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce(JSON.stringify({ invalid: true }));
      expect(await loadCatalogFromStorage()).toBeNull();

      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: true });
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce(
        JSON.stringify({ cachedAt: Date.now(), data: sampleData }),
      );
      const loaded = await loadCatalogFromStorage();
      expect(loaded?.data.categories).toHaveLength(1);

      await saveCatalogToStorage(sampleData);
      expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();

      (FileSystem.writeAsStringAsync as jest.Mock).mockRejectedValueOnce(new Error('Disk full'));
      await expect(saveCatalogToStorage(sampleData)).resolves.toBeUndefined();

      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: true });
      await clearCatalogStorage();
      expect(FileSystem.deleteAsync).toHaveBeenCalled();

      (FileSystem.getInfoAsync as jest.Mock).mockRejectedValueOnce(new Error('IO err'));
      await expect(clearCatalogStorage()).resolves.toBeUndefined();

      expect(isCatalogStale(Date.now() - CATALOG_TTL_MS - 1000)).toBe(true);
      expect(isCatalogStale(Date.now())).toBe(false);
    });
  });

  describe('RevalidationDecisionBadge & RevalidationSwipeBadges', () => {
    it('renders badges and buttons on regular and small devices, disabled and without optional fabs', async () => {
      const anim = new Animated.Value(0);
      const handlers = {
        handleAgree: jest.fn(),
        handleDecline: jest.fn(),
        handleSkip: jest.fn(),
        handleReport: jest.fn(),
        onOpenCatalog: jest.fn(),
        onOpenHelp: jest.fn(),
      };

      const screen = await render(
        <>
          <RevalidationSwipeBadges
            agreeOpacity={anim}
            declineOpacity={anim}
            reportOpacity={anim}
            skipOpacity={anim}
          />
          <RevalidationDecisionBadge {...handlers} />
        </>,
      );

      expect(screen.getByText('ĐỒNG Ý')).toBeTruthy();
      expect(screen.getByText('TỪ CHỐI')).toBeTruthy();
      expect(screen.getByText('BỎ QUA')).toBeTruthy();
      expect(screen.getByText('BÁO CÁO')).toBeTruthy();

      fireEvent.press(screen.getByLabelText('Xem danh mục biển báo'));
      fireEvent.press(screen.getByLabelText('Hướng dẫn thao tác quẹt'));
      fireEvent.press(screen.getByLabelText('Bỏ qua minh chứng này'));
      fireEvent.press(screen.getByLabelText('Từ chối kết luận của điều tra viên'));
      fireEvent.press(screen.getByLabelText('Đồng ý với kết luận của điều tra viên'));

      expect(handlers.onOpenCatalog).toHaveBeenCalled();
      expect(handlers.onOpenHelp).toHaveBeenCalled();
      expect(handlers.handleSkip).toHaveBeenCalled();
      expect(handlers.handleDecline).toHaveBeenCalled();
      expect(handlers.handleAgree).toHaveBeenCalled();

      mockSmallDevice = true;
      await screen.rerender(
        <RevalidationDecisionBadge
          disabled
          handleAgree={handlers.handleAgree}
          handleDecline={handlers.handleDecline}
          handleReport={handlers.handleReport}
          handleSkip={handlers.handleSkip}
        />,
      );
      expect(screen.queryByLabelText('Xem danh mục biển báo')).toBeNull();
      expect(screen.queryByLabelText('Hướng dẫn thao tác quẹt')).toBeNull();
    });
  });
});
