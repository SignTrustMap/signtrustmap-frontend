jest.unmock('@/services/offline-map-service');
jest.unmock('../../../src/services/offline-map-service');

import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { formatBytes, offlineMapService } from '../../../src/services/offline-map-service';

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///data/user/0/com.signtrustmap/files/',
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true }),
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  readAsStringAsync: jest.fn().mockResolvedValue(''),
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
  createDownloadResumable: jest.fn(),
}));

jest.mock('@/api/spatial/offline-tiles', () => ({
  fetchOfflineMapPacks: jest.fn(),
  getOfflineMapPackDownloadUrl: jest.fn((id: string) => `https://api.signmap.site/api/v1/spatial/tiles/offline/download/${id}`),
}));

describe('OfflineMapService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue('');
    Platform.OS = 'android';
  });

  describe('formatBytes helper', () => {
    it('formats 0 or negative bytes as 0 B', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(-100)).toBe('0 B');
    });

    it('formats MB correctly', () => {
      expect(formatBytes(1024 * 1024)).toBe('1.0 MB');
      expect(formatBytes(439804651)).toBe('419.4 MB');
    });

    it('formats GB correctly', () => {
      expect(formatBytes(1024 * 1024 * 1024 * 2.5)).toBe('2.50 GB');
    });
  });

  describe('loadMetadata', () => {
    it('returns empty installed packs when metadata file does not exist', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: false });

      const meta = await offlineMapService.loadMetadata();
      expect(meta.installedPacks).toEqual({});
      expect(meta.activePackId).toBeNull();
    });

    it('cleans up packs whose files were deleted from storage', async () => {
      // 1. Metadata file exists
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: true });
      // 2. Metadata file content
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce(
        JSON.stringify({
          installedPacks: {
            'vietnam-osm': {
              packId: 'vietnam-osm',
              fileName: 'vietnam.pmtiles',
              fileUri: 'file:///data/user/0/com.signtrustmap/files/maps/vietnam.pmtiles',
              sizeBytes: 400000000,
            },
          },
          activePackId: 'vietnam-osm',
        }),
      );
      // 3. Check pack fileUri -> does NOT exist
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: false });
      // 4. Ensure dir exists for saveMetadata
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: true });

      const meta = await offlineMapService.loadMetadata();

      expect(meta.installedPacks['vietnam-osm']).toBeUndefined();
      expect(meta.activePackId).toBeNull();
      expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
    });
  });

  describe('setActiveOfflinePack', () => {
    it('throws error when activating a pack that is not installed', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: false });

      await expect(offlineMapService.setActiveOfflinePack('non-existent')).rejects.toThrow(
        'Offline pack non-existent is not installed',
      );
    });

    it('deactivates currently active pack when packId is null', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: true });
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce(
        JSON.stringify({
          installedPacks: {},
          activePackId: 'vietnam-osm',
        }),
      );
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: true });

      await offlineMapService.setActiveOfflinePack(null);
      expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
    });
  });

  describe('deleteInstalledPack', () => {
    it('deletes the physical file and updates metadata', async () => {
      (FileSystem.getInfoAsync as jest.Mock)
        // 1. loadMetadata getInfoAsync
        .mockResolvedValueOnce({ exists: true })
        // 2. loadMetadata check pack file exists
        .mockResolvedValueOnce({ exists: true })
        // 3. deleteInstalledPack file exists check
        .mockResolvedValueOnce({ exists: true })
        // 4. saveMetadata ensure dir exists
        .mockResolvedValueOnce({ exists: true });

      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce(
        JSON.stringify({
          installedPacks: {
            'vietnam-osm': {
              packId: 'vietnam-osm',
              fileName: 'vietnam.pmtiles',
              fileUri: 'file:///data/user/0/com.signtrustmap/files/maps/vietnam.pmtiles',
              sizeBytes: 400000000,
            },
          },
          activePackId: 'vietnam-osm',
        }),
      );

      await offlineMapService.deleteInstalledPack('vietnam-osm');

      expect(FileSystem.deleteAsync).toHaveBeenCalledWith(
        'file:///data/user/0/com.signtrustmap/files/maps/vietnam.pmtiles',
        { idempotent: true },
      );
      expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
    });
  });

  describe('fetchAvailablePacks and getActiveOfflinePack', () => {
    it('fetches available packs from spatial api', async () => {
      const mockPacks = [
        {
          id: 'pack-hcmc',
          name: 'Hồ Chí Minh Offline',
          fileName: 'hcmc.pmtiles',
          downloadUrl: 'https://cdn.signmap.site/hcmc.pmtiles',
          sizeBytes: 150000000,
        },
      ];
      const { fetchOfflineMapPacks } = require('@/api/spatial/offline-tiles');
      fetchOfflineMapPacks.mockResolvedValueOnce({ packs: mockPacks });

      const packs = await offlineMapService.fetchAvailablePacks('token-123');
      expect(packs).toEqual(mockPacks);
    });

    it('returns active installed pack or null if none active', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });
      const active = await offlineMapService.getActiveOfflinePack();
      expect(active).toBeNull();
    });
  });

  describe('Listeners: subscribeToProgress and subscribeToMetadata', () => {
    it('notifies subscribers on progress and metadata changes', async () => {
      const progressListener = jest.fn();
      const metadataListener = jest.fn();

      const unsubProgress = offlineMapService.subscribeToProgress(progressListener);
      const unsubMeta = offlineMapService.subscribeToMetadata(metadataListener);

      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });
      (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);

      await offlineMapService.saveMetadata({
        installedPacks: {},
        activePackId: null,
      });

      expect(metadataListener).toHaveBeenCalled();

      unsubProgress();
      unsubMeta();
    });
  });

  describe('startDownload, pause, resume, cancel on native platform', () => {
    const samplePack = {
      id: 'pack-hcmc',
      name: 'TP.HCM Map Pack',
      description: 'Bản đồ TP.HCM ngoại tuyến',
      region: 'Ho Chi Minh City',
      countryCode: 'VN',
      format: 'pmtiles',
      fileName: 'hcmc.pmtiles',
      downloadUrl: 'https://cdn.signmap.site/hcmc.pmtiles',
      sizeBytes: 100 * 1024 * 1024,
      sizeMb: 100,
      bounds: [106.6, 10.7, 106.8, 10.8] as [number, number, number, number],
      minZoom: 10,
      maxZoom: 16,
      isAvailable: true,
    };

    it('downloads pack successfully on native and saves to metadata', async () => {
      const mockDownloadAsync = jest.fn().mockResolvedValue({
        uri: 'file:///data/user/0/com.signtrustmap/files/maps/hcmc.pmtiles',
      });

      let registeredProgressCb: any = null;
      (FileSystem.createDownloadResumable as jest.Mock).mockImplementation(
        (url, dest, opts, callback) => {
          registeredProgressCb = callback;
          return {
            downloadAsync: mockDownloadAsync,
          };
        }
      );

      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
        size: 100 * 1024 * 1024,
      });
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(
        JSON.stringify({ installedPacks: {}, activePackId: null })
      );
      (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);

      const downloadPromise = offlineMapService.startDownload(samplePack, 'jwt-token');

      // Trigger progress callback
      if (registeredProgressCb) {
        registeredProgressCb({
          totalBytesWritten: 50 * 1024 * 1024,
          totalBytesExpectedToWrite: 100 * 1024 * 1024,
        });
      }

      const installed = await downloadPromise;

      expect(installed.packId).toBe('pack-hcmc');
      expect(installed.sizeBytes).toBe(100 * 1024 * 1024);
      expect(offlineMapService.getProgress('pack-hcmc')?.status).toBe('completed');
    });

    it('supports pauseDownload, resumeDownload, and cancelDownload', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });

      const mockPauseAsync = jest.fn().mockResolvedValue({ resumeData: 'resume-data-string' });
      const mockResumeAsync = jest.fn().mockResolvedValue({ uri: 'file:///done.pmtiles' });
      const mockCancelAsync = jest.fn().mockResolvedValue(undefined);

      (FileSystem.createDownloadResumable as jest.Mock).mockReturnValue({
        downloadAsync: () => new Promise(() => {}), // keeps pending
        pauseAsync: mockPauseAsync,
        resumeAsync: mockResumeAsync,
        cancelAsync: mockCancelAsync,
      });

      // Start download (do not await, let it stay pending)
      void offlineMapService.startDownload(samplePack);
      // Yield to allow startDownload to initialize activeDownloads
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Pause
      await offlineMapService.pauseDownload('pack-hcmc');
      expect(mockPauseAsync).toHaveBeenCalled();
      expect(offlineMapService.getProgress('pack-hcmc')?.status).toBe('paused');

      // Resume
      await offlineMapService.resumeDownload('pack-hcmc');
      expect(mockResumeAsync).toHaveBeenCalled();
      expect(offlineMapService.getProgress('pack-hcmc')?.status).toBe('downloading');

      // Cancel
      (FileSystem.deleteAsync as jest.Mock).mockResolvedValue(undefined);

      await offlineMapService.cancelDownload('pack-hcmc');
      expect(mockCancelAsync).toHaveBeenCalled();
      expect(offlineMapService.getProgress('pack-hcmc')?.status).toBe('idle');
    });

    it('handles download failure and sets error status in progress', async () => {
      (FileSystem.createDownloadResumable as jest.Mock).mockReturnValue({
        downloadAsync: jest.fn().mockRejectedValue(new Error('Connection dropped')),
      });

      await expect(offlineMapService.startDownload(samplePack)).rejects.toThrow(
        'Connection dropped'
      );

      const progress = offlineMapService.getProgress('pack-hcmc');
      expect(progress?.status).toBe('error');
      expect(progress?.errorMessage).toBe('Connection dropped');
    });

    it('handles download on web platform via browser anchor element', async () => {
      const originalPlatform = Platform.OS;
      Platform.OS = 'web';

      const mockAnchor = {
        href: '',
        download: '',
        target: '',
        click: jest.fn(),
      };
      (globalThis as any).document = {
        createElement: jest.fn().mockReturnValue(mockAnchor),
        body: {
          appendChild: jest.fn(),
          removeChild: jest.fn(),
        },
      };

      const installed = await offlineMapService.startDownload(samplePack);
      expect(installed.packId).toBe('pack-hcmc');
      expect(mockAnchor.click).toHaveBeenCalled();

      Platform.OS = originalPlatform;
    });
  });
});
