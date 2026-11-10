import React from 'react';
import { render, fireEvent, renderHook, act, cleanup } from '@testing-library/react-native';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import * as Device from 'expo-device';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
jest.mock('expo-device', () => ({
  supportedCpuArchitectures: ['arm64-v8a', 'armeabi-v7a'],
}));

jest.mock('expo-constants', () => ({
  expoConfig: { version: '1.0.0' },
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(true),
}));

jest.mock('expo-linking', () => ({
  openURL: jest.fn().mockResolvedValue(true),
}));

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  getItemAsync: jest.fn().mockResolvedValue('secure-val'),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  return {
    Octicons: (props: any) => <View testID={`oct-icon-${props.name}`} {...props} />,
  };
});

jest.mock('@/config/env', () => ({
  env: {
    appCommitSha: 'abcdef1234567890',
  },
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    background: '#FFFFFF',
    backgroundElement: '#F8FAFC',
    backgroundSelected: '#EFF6FF',
    border: '#E2E8F0',
    primary: '#2563EB',
    text: '#0F172A',
    textSecondary: '#475569',
    grey: '#94A3B8',
    greyLight: '#F1F5F9',
    danger: '#EF4444',
  }),
}));

import {
  setStorageItemAsync,
  getStorageItemAsync,
  removeStorageItemAsync,
} from '@/hooks/use-storage';
import {
  fetchLatestRelease,
  checkAppUpdate,
} from '@/services/update-service';
import { useAppUpdate } from '@/hooks/use-app-update';
import { UpdateModal } from '@/components/update-modal';

describe('Storage, Update Service, and Update Modal', () => {
  afterEach(async () => {
    cleanup();
    jest.clearAllMocks();
  });

  describe('use-storage.ts', () => {
    it('handles secure store operations on native', async () => {
      Platform.OS = 'android';
      await setStorageItemAsync('key1', 'val1');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('key1', 'val1');

      const val = await getStorageItemAsync('key1');
      expect(val).toBe('secure-val');

      await removeStorageItemAsync('key1');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('key1');
    });

    it('handles localStorage operations on web', async () => {
      Platform.OS = 'web';
      const mockStorage: Record<string, string> = {};
      (globalThis as any).localStorage = {
        setItem: jest.fn((k, v) => { mockStorage[k] = v; }),
        getItem: jest.fn((k) => mockStorage[k] || null),
        removeItem: jest.fn((k) => { delete mockStorage[k]; }),
      };

      await setStorageItemAsync('webKey', 'webVal');
      expect(localStorage.setItem).toHaveBeenCalledWith('webKey', 'webVal');

      const val = await getStorageItemAsync('webKey');
      expect(val).toBe('webVal');

      await removeStorageItemAsync('webKey');
      expect(localStorage.removeItem).toHaveBeenCalledWith('webKey');
    });
  });

  describe('update-service.ts', () => {
    it('fetches latest release and parses arm64 apk asset correctly', async () => {
      const mockRelease = {
        tag_name: 'v1.2.0',
        name: 'Release 1.2.0',
        published_at: new Date(Date.now() - 3600000).toISOString(),
        html_url: 'https://github.com/repo/releases/tag/v1.2.0',
        assets: [
          {
            name: 'app-arm64-v8a-release.apk',
            browser_download_url: 'https://download.apk/arm64.apk',
            size: 50 * 1024 * 1024,
          },
        ],
      };

      (globalThis as any).fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockRelease,
      });

      const release = await fetchLatestRelease();
      expect(release).not.toBeNull();
      expect(release?.tagName).toBe('v1.2.0');
      expect(release?.apkAsset?.name).toBe('app-arm64-v8a-release.apk');
      expect(release?.apkAsset?.sizeFormatted).toBe('50.0 MB');
    });

    it('falls back to all releases list on 404', async () => {
      (globalThis as any).fetch = jest.fn()
        .mockResolvedValueOnce({ ok: false, status: 404 })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => [
            {
              tag_name: 'v1.1.0',
              name: 'Build 1.1',
              assets: [],
            },
          ],
        });

      const release = await fetchLatestRelease();
      expect(release?.tagName).toBe('v1.1.0');
    });

    it('checks app update availability comparing commit and version', async () => {
      (globalThis as any).fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          tag_name: 'build-different123',
          name: 'Build Different',
          assets: [],
        }),
      });

      const result = await checkAppUpdate();
      expect(result.isUpdateAvailable).toBe(true);
      expect(result.latestRelease?.tagName).toBe('build-different123');
    });
  });

  describe('useAppUpdate hook', () => {
    it('checks for updates, changes status, and controls modal visibility', async () => {
      (globalThis as any).fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          tag_name: 'v2.0.0',
          name: 'Major update',
          assets: [],
        }),
      });

      const { result } = await renderHook(() => useAppUpdate());

      expect(result.current.status).toBe('idle');
      expect(result.current.isModalOpen).toBe(false);

      await act(async () => {
        await result.current.checkForUpdates();
      });

      expect(result.current.isModalOpen).toBe(true);
      expect(result.current.status).toBe('available');

      await act(async () => {
        result.current.closeModal();
      });
      expect(result.current.isModalOpen).toBe(false);
    });
  });

  describe('UpdateModal component', () => {
    const sampleRelease = {
      tagName: 'v1.2.0',
      name: 'Bản Cập Nhật Mới #10',
      publishedAt: '1 giờ trước',
      htmlUrl: 'https://github.com/releases/10',
      apkAsset: {
        name: 'app-release.apk',
        downloadUrl: 'https://download.apk/release.apk',
        sizeBytes: 40000000,
        sizeFormatted: '38.1 MB',
      },
    };

    it('renders checking status with spinner', async () => {
      const screen = await render(
        <UpdateModal
          visible={true}
          status="checking"
          releaseInfo={null}
          errorMessage={null}
          currentVersion="1.0.0"
          onClose={jest.fn()}
          onRetry={jest.fn()}
        />
      );

      screen.debug();
      expect(screen.getByText('Đang kiểm tra bản cập nhật...')).toBeTruthy();
    });

    it('renders available update with title, file size and triggers download', async () => {
      const mockClose = jest.fn();
      const { getByText } = await render(
        <UpdateModal
          visible={true}
          status="available"
          releaseInfo={sampleRelease}
          errorMessage={null}
          currentVersion="1.0.0"
          onClose={mockClose}
          onRetry={jest.fn()}
        />
      );

      expect(getByText('Bản Cập Nhật Mới #10')).toBeTruthy();
      expect(getByText(/38\.1 MB/)).toBeTruthy();

      const updateBtn = getByText('Cập nhật ngay');
      fireEvent.press(updateBtn);
      expect(Linking.openURL).toHaveBeenCalledWith('https://download.apk/release.apk');
    });

    it('renders error status and allows copying error message to clipboard', async () => {
      const mockRetry = jest.fn();
      const { getByText, getByDisplayValue } = await render(
        <UpdateModal
          visible={true}
          status="error"
          releaseInfo={null}
          errorMessage="Network timeout connecting to GitHub"
          currentVersion="1.0.0"
          onClose={jest.fn()}
          onRetry={mockRetry}
        />
      );

      expect(getByText('Không thể kiểm tra bản cập nhật')).toBeTruthy();
      expect(getByDisplayValue('Network timeout connecting to GitHub')).toBeTruthy();

      const copyBtn = getByText('Sao chép lỗi');
      await act(async () => {
        fireEvent.press(copyBtn);
      });
      expect(Clipboard.setStringAsync).toHaveBeenCalledWith('Network timeout connecting to GitHub');

      const retryBtn = getByText('Thử lại');
      fireEvent.press(retryBtn);
      expect(mockRetry).toHaveBeenCalled();
    });

    it('renders up-to-date status when no update available', async () => {
      const { getByText } = await render(
        <UpdateModal
          visible={true}
          status="up-to-date"
          releaseInfo={sampleRelease}
          errorMessage={null}
          currentVersion="1.0.0"
          onClose={jest.fn()}
          onRetry={jest.fn()}
        />
      );

      expect(getByText('Ứng dụng đã là bản mới nhất!')).toBeTruthy();
    });
  });
});
