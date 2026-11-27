jest.unmock('@/services/offline-map-service');

import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///docs/',
  getInfoAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
  createDownloadResumable: jest.fn(),
}));

const mockFetchOfflineMapPacks = jest.fn();
jest.mock('@/api/spatial/offline-tiles', () => ({
  fetchOfflineMapPacks: (...args: any[]) => mockFetchOfflineMapPacks(...args),
  getOfflineMapPackDownloadUrl: (id: string) => `https://api.signmap.site/offline/${id}`,
}));

import { formatBytes, offlineMapService } from '@/services/offline-map-service';

describe('OfflineMapService Branch Coverage', () => {
  const origPlatform = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
    (FileSystem as any).documentDirectory = 'file:///docs/';
  });

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { value: origPlatform, configurable: true });
  });

  it('formats byte sizes across B, MB, and GB', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
    expect(formatBytes(1500 * 1024 * 1024)).toBe('1.46 GB');
  });

  it('manages listeners, cleans stale files on loadMetadata, and handles web download/delete', async () => {
    const progressCb = jest.fn(() => {
      throw new Error('listener boom');
    });
    const metaCb = jest.fn(() => {
      throw new Error('meta boom');
    });
    const unsubP = offlineMapService.subscribeToProgress(progressCb);
    const unsubM = offlineMapService.subscribeToMetadata(metaCb);

    // Native loadMetadata verifying disk files -> missing file pruned
    (FileSystem.getInfoAsync as jest.Mock)
      .mockResolvedValueOnce({ exists: true }) // metadata.json
      .mockResolvedValueOnce({ exists: false }) // missing pack fileUri
      .mockRejectedValueOnce(new Error('Stat error')) // errored pack fileUri
      .mockResolvedValueOnce({ exists: true }); // maps dir
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({
        activePackId: 'missing-pack',
        installedPacks: {
          'missing-pack': { packId: 'missing-pack', fileUri: 'file:///docs/maps/m.pmtiles' },
          'err-pack': { packId: 'err-pack', fileUri: 'file:///docs/maps/e.pmtiles' },
        },
      }),
    );

    const cleaned = await offlineMapService.loadMetadata();
    expect(cleaned.activePackId).toBeNull();
    expect(Object.keys(cleaned.installedPacks)).toHaveLength(0);

    // setActiveOfflinePack throws when pack is not installed
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: false });
    await expect(offlineMapService.setActiveOfflinePack('unknown')).rejects.toThrow(/not installed/);

    // Native startDownload with progress, pause, resume, error, and cancel
    let capturedProgressCb: any;
    const mockResumable = {
      downloadAsync: jest
        .fn()
        .mockImplementationOnce(async () => {
          capturedProgressCb?.({ totalBytesExpectedToWrite: 1000, totalBytesWritten: 500 });
          return { uri: 'file:///docs/maps/hcmc.pmtiles' };
        })
        .mockRejectedValueOnce(new Error('Network dropped')),
      pauseAsync: jest.fn().mockResolvedValue({ resumeData: 'resume-token' }),
      resumeAsync: jest.fn().mockResolvedValue({ uri: 'file:///docs/maps/hcmc.pmtiles' }),
      cancelAsync: jest.fn().mockRejectedValue(new Error('Cancel failed')),
    };
    (FileSystem.createDownloadResumable as jest.Mock).mockImplementation(
      (_url, _dest, _opts, cb) => {
        capturedProgressCb = cb;
        return mockResumable;
      },
    );

    const pack: any = {
      id: 'hcmc',
      name: 'TP.HCM',
      fileName: 'hcmc.pmtiles',
      sizeBytes: 1000,
      downloadUrl: '/dl/hcmc',
    };

    (FileSystem.getInfoAsync as jest.Mock)
      .mockResolvedValueOnce({ exists: true }) // ensureDir
      .mockResolvedValueOnce({ exists: true, size: 1024 }) // downloaded size
      .mockResolvedValueOnce({ exists: false }); // loadMetadata

    const installed = await offlineMapService.startDownload(pack, 'tok-1');
    expect(installed.sizeBytes).toBe(1024);
    expect(offlineMapService.getProgress('hcmc')?.status).toBe('completed');

    // Second download throws after registering activeDownload -> covers pause/resume/cancel error paths
    const errPromise = offlineMapService.startDownload(pack);
    await offlineMapService.pauseDownload('hcmc');
    await offlineMapService.resumeDownload('hcmc');
    await offlineMapService.cancelDownload('hcmc');
    await expect(errPromise).rejects.toThrow('Network dropped');

    // deleteInstalledPack removes file and clears activePackId
    (FileSystem.getInfoAsync as jest.Mock)
      .mockResolvedValueOnce({ exists: true }) // metadata
      .mockResolvedValueOnce({ exists: true }) // pack file
      .mockResolvedValueOnce({ exists: true }) // delete check
      .mockResolvedValueOnce({ exists: true }); // ensureDir
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({
        activePackId: 'hcmc',
        installedPacks: {
          hcmc: { packId: 'hcmc', fileUri: 'file:///docs/maps/hcmc.pmtiles' },
        },
      }),
    );
    await offlineMapService.deleteInstalledPack('hcmc');
    expect(FileSystem.deleteAsync).toHaveBeenCalled();

    // fetchAvailablePacks & getActiveOfflinePack null
    mockFetchOfflineMapPacks.mockResolvedValueOnce({ packs: [pack] });
    expect(await offlineMapService.fetchAvailablePacks()).toHaveLength(1);
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: false });
    expect(await offlineMapService.getActiveOfflinePack()).toBeNull();

    // Web platform loadMetadata, saveMetadata, and startDownload
    Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
    const store = new Map<string, string>();
    (globalThis as any).localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
    };
    (globalThis as any).document = {
      createElement: jest.fn(() => ({ href: '', download: '', target: '', click: jest.fn() })),
      body: { appendChild: jest.fn(), removeChild: jest.fn() },
    };
    const webInstalled = await offlineMapService.startDownload(pack);
    expect(webInstalled.packId).toBe('hcmc');
    expect((await offlineMapService.getActiveOfflinePack())?.packId).toBe('hcmc');
    delete (globalThis as any).localStorage;
    delete (globalThis as any).document;

    unsubP();
    unsubM();
  });
});
