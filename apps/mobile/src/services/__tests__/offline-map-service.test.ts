import * as FileSystem from 'expo-file-system/legacy';
import { formatBytes, offlineMapService } from '../offline-map-service';

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///data/user/0/com.signtrustmap/files/',
  getInfoAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
  createDownloadResumable: jest.fn(),
}));

jest.mock('@/api/spatial/offline-tiles', () => ({
  fetchOfflineMapPacks: jest.fn(),
  getOfflineMapPackDownloadUrl: jest.fn((id: string) => `https://api.signmap.site/api/v1/spatial/tiles/offline/download/${id}`),
}));

describe('OfflineMapService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
});
