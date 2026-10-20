import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import {
  fetchOfflineMapPacks,
  getOfflineMapPackDownloadUrl,
} from '@/api/spatial/offline-tiles';
import type {
  InstalledOfflineMapPack,
  OfflineMapPack,
  OfflineMapPackDownloadProgress,
  OfflineMapStorageMetadata,
} from '@/types/navigationType';

const WEB_METADATA_STORAGE_KEY = 'stm_offline_maps_metadata_v1';
const METADATA_FILE_NAME = 'metadata.json';
const MAPS_FOLDER_NAME = 'maps';

/**
 * Returns the maps directory on the device.
 */
function getMapsDirectory(): string | null {
  if (Platform.OS === 'web') return null;
  const docDir = FileSystem.documentDirectory;
  if (!docDir) return null;
  const trimmed = docDir.endsWith('/') ? docDir : `${docDir}/`;
  return `${trimmed}${MAPS_FOLDER_NAME}/`;
}

/**
 * Returns the metadata file path on the device.
 */
function getMetadataFilePath(): string | null {
  const dir = getMapsDirectory();
  if (!dir) return null;
  return `${dir}${METADATA_FILE_NAME}`;
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const mb = bytes / (1024 * 1024);
  if (mb < 1000) {
    return `${mb.toFixed(1)} MB`;
  }
  const gb = mb / 1024;
  return `${gb.toFixed(2)} GB`;
}

type ProgressListener = (progress: OfflineMapPackDownloadProgress) => void;
type MetadataChangeListener = (metadata: OfflineMapStorageMetadata) => void;

class OfflineMapService {
  private activeDownloads = new Map<string, FileSystem.DownloadResumable>();
  private resumeDataMap = new Map<string, string>();
  private currentProgress = new Map<string, OfflineMapPackDownloadProgress>();
  private progressListeners = new Set<ProgressListener>();
  private metadataListeners = new Set<MetadataChangeListener>();

  /**
   * Subscribe to download progress updates across any pack.
   */
  subscribeToProgress(listener: ProgressListener): () => void {
    this.progressListeners.add(listener);
    return () => this.progressListeners.delete(listener);
  }

  /**
   * Subscribe to metadata changes (install, delete, activate).
   */
  subscribeToMetadata(listener: MetadataChangeListener): () => void {
    this.metadataListeners.add(listener);
    return () => this.metadataListeners.delete(listener);
  }

  private notifyProgress(progress: OfflineMapPackDownloadProgress) {
    this.currentProgress.set(progress.packId, progress);
    for (const listener of this.progressListeners) {
      try {
        listener(progress);
      } catch (err) {
        console.warn('[OfflineMapService] Error in progress listener:', err);
      }
    }
  }

  private notifyMetadata(metadata: OfflineMapStorageMetadata) {
    for (const listener of this.metadataListeners) {
      try {
        listener(metadata);
      } catch (err) {
        console.warn('[OfflineMapService] Error in metadata listener:', err);
      }
    }
  }

  getProgress(packId: string): OfflineMapPackDownloadProgress | undefined {
    return this.currentProgress.get(packId);
  }

  /**
   * Ensures the local maps directory exists on native storage.
   */
  async ensureDirectoryExists(): Promise<string | null> {
    const dir = getMapsDirectory();
    if (!dir) return null;

    try {
      const dirInfo = await FileSystem.getInfoAsync(dir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      }
      return dir;
    } catch (err) {
      console.warn('[OfflineMapService] Failed to ensure maps directory:', err);
      return null;
    }
  }

  /**
   * Reads metadata and verifies existing files on disk.
   */
  async loadMetadata(): Promise<OfflineMapStorageMetadata> {
    const defaultMeta: OfflineMapStorageMetadata = {
      installedPacks: {},
      activePackId: null,
    };

    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage === 'undefined') return defaultMeta;
        const raw = localStorage.getItem(WEB_METADATA_STORAGE_KEY);
        if (!raw) return defaultMeta;
        const parsed = JSON.parse(raw);
        return {
          installedPacks: parsed.installedPacks || {},
          activePackId: parsed.activePackId || null,
        };
      }

      const metaPath = getMetadataFilePath();
      if (!metaPath) return defaultMeta;

      const metaInfo = await FileSystem.getInfoAsync(metaPath);
      if (!metaInfo.exists) return defaultMeta;

      const raw = await FileSystem.readAsStringAsync(metaPath);
      if (!raw) return defaultMeta;

      const parsed = JSON.parse(raw) as OfflineMapStorageMetadata;
      const validInstalledPacks: Record<string, InstalledOfflineMapPack> = {};
      let hasChanges = false;

      // Verify that every recorded pack actually still exists on the filesystem
      for (const [packId, pack] of Object.entries(parsed.installedPacks || {})) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(pack.fileUri);
          if (fileInfo.exists) {
            validInstalledPacks[packId] = pack;
          } else {
            hasChanges = true;
          }
        } catch {
          hasChanges = true;
        }
      }

      const activePackId =
        parsed.activePackId && validInstalledPacks[parsed.activePackId]
          ? parsed.activePackId
          : null;

      if (hasChanges || activePackId !== parsed.activePackId) {
        const cleaned: OfflineMapStorageMetadata = {
          installedPacks: validInstalledPacks,
          activePackId,
        };
        await this.saveMetadata(cleaned);
        return cleaned;
      }

      return {
        installedPacks: validInstalledPacks,
        activePackId,
      };
    } catch (err) {
      console.warn('[OfflineMapService] Failed to load metadata:', err);
      return defaultMeta;
    }
  }

  /**
   * Saves metadata to disk or localStorage.
   */
  async saveMetadata(metadata: OfflineMapStorageMetadata): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(WEB_METADATA_STORAGE_KEY, JSON.stringify(metadata));
        }
        this.notifyMetadata(metadata);
        return;
      }

      await this.ensureDirectoryExists();
      const metaPath = getMetadataFilePath();
      if (!metaPath) return;

      await FileSystem.writeAsStringAsync(metaPath, JSON.stringify(metadata, null, 2));
      this.notifyMetadata(metadata);
    } catch (err) {
      console.warn('[OfflineMapService] Failed to save metadata:', err);
    }
  }

  /**
   * Fetch available packs from backend catalog.
   */
  async fetchAvailablePacks(accessToken?: string, signal?: AbortSignal): Promise<OfflineMapPack[]> {
    const response = await fetchOfflineMapPacks(accessToken, signal);
    return response.packs || [];
  }

  /**
   * Get active installed pack if one is selected.
   */
  async getActiveOfflinePack(): Promise<InstalledOfflineMapPack | null> {
    const meta = await this.loadMetadata();
    if (!meta.activePackId) return null;
    return meta.installedPacks[meta.activePackId] || null;
  }

  /**
   * Toggle or set the active offline map pack.
   */
  async setActiveOfflinePack(packId: string | null): Promise<void> {
    const meta = await this.loadMetadata();
    if (packId && !meta.installedPacks[packId]) {
      throw new Error(`Offline pack ${packId} is not installed`);
    }

    meta.activePackId = packId;
    await this.saveMetadata(meta);
  }

  /**
   * Start downloading a PMTiles archive.
   */
  async startDownload(
    pack: OfflineMapPack,
    accessToken?: string,
  ): Promise<InstalledOfflineMapPack> {
    const downloadUrl = pack.downloadUrl.startsWith('http')
      ? pack.downloadUrl
      : getOfflineMapPackDownloadUrl(pack.id);

    const initialProgress: OfflineMapPackDownloadProgress = {
      packId: pack.id,
      totalBytes: pack.sizeBytes || 0,
      downloadedBytes: 0,
      percentage: 0,
      status: 'downloading',
    };
    this.notifyProgress(initialProgress);

    // On web, trigger standard browser download & save mock record
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined') {
          const anchor = document.createElement('a');
          anchor.href = downloadUrl;
          anchor.download = pack.fileName;
          anchor.target = '_blank';
          document.body.appendChild(anchor);
          anchor.click();
          document.body.removeChild(anchor);
        }

        const installedPack: InstalledOfflineMapPack = {
          packId: pack.id,
          name: pack.name,
          fileName: pack.fileName,
          localPath: downloadUrl,
          fileUri: downloadUrl,
          sizeBytes: pack.sizeBytes,
          installedAt: Date.now(),
          bounds: pack.bounds,
          minZoom: pack.minZoom,
          maxZoom: pack.maxZoom,
        };

        const meta = await this.loadMetadata();
        meta.installedPacks[pack.id] = installedPack;
        if (!meta.activePackId) {
          meta.activePackId = pack.id;
        }
        await this.saveMetadata(meta);

        this.notifyProgress({
          packId: pack.id,
          totalBytes: pack.sizeBytes,
          downloadedBytes: pack.sizeBytes,
          percentage: 100,
          status: 'completed',
        });

        return installedPack;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Web download failed';
        this.notifyProgress({
          ...initialProgress,
          status: 'error',
          errorMessage: errorMsg,
        });
        throw err;
      }
    }

    // Native platform download handling
    await this.ensureDirectoryExists();
    const dir = getMapsDirectory();
    if (!dir) throw new Error('Could not access maps directory');

    const destinationUri = `${dir}${pack.fileName}`;

    const progressCallback = (data: FileSystem.DownloadProgressData) => {
      const totalBytes = data.totalBytesExpectedToWrite > 0
        ? data.totalBytesExpectedToWrite
        : (pack.sizeBytes || 1);
      const downloadedBytes = data.totalBytesWritten;
      const percentage = Math.min(100, Math.round((downloadedBytes / totalBytes) * 100));

      this.notifyProgress({
        packId: pack.id,
        totalBytes,
        downloadedBytes,
        percentage,
        status: 'downloading',
      });
    };

    const headers: Record<string, string> = {};
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const resumable = FileSystem.createDownloadResumable(
      downloadUrl,
      destinationUri,
      { headers },
      progressCallback,
    );

    this.activeDownloads.set(pack.id, resumable);

    try {
      const result = await resumable.downloadAsync();
      this.activeDownloads.delete(pack.id);
      this.resumeDataMap.delete(pack.id);

      if (!result || !result.uri) {
        throw new Error('Download did not return a valid file URI');
      }

      // Check downloaded file size
      const info = await FileSystem.getInfoAsync(result.uri);
      const actualSize = info.exists && 'size' in info && typeof info.size === 'number'
        ? info.size
        : pack.sizeBytes;

      const installedPack: InstalledOfflineMapPack = {
        packId: pack.id,
        name: pack.name,
        fileName: pack.fileName,
        localPath: result.uri,
        fileUri: result.uri,
        sizeBytes: actualSize,
        installedAt: Date.now(),
        bounds: pack.bounds,
        minZoom: pack.minZoom,
        maxZoom: pack.maxZoom,
      };

      const meta = await this.loadMetadata();
      meta.installedPacks[pack.id] = installedPack;
      if (!meta.activePackId) {
        meta.activePackId = pack.id;
      }
      await this.saveMetadata(meta);

      this.notifyProgress({
        packId: pack.id,
        totalBytes: actualSize,
        downloadedBytes: actualSize,
        percentage: 100,
        status: 'completed',
      });

      return installedPack;
    } catch (err) {
      this.activeDownloads.delete(pack.id);
      const errorMsg = err instanceof Error ? err.message : 'Download failed';
      this.notifyProgress({
        packId: pack.id,
        totalBytes: pack.sizeBytes,
        downloadedBytes: 0,
        percentage: 0,
        status: 'error',
        errorMessage: errorMsg,
      });
      throw err;
    }
  }

  /**
   * Pause an ongoing download.
   */
  async pauseDownload(packId: string): Promise<void> {
    const resumable = this.activeDownloads.get(packId);
    if (!resumable) return;

    try {
      const pauseResult = await resumable.pauseAsync();
      if (pauseResult?.resumeData) {
        this.resumeDataMap.set(packId, pauseResult.resumeData);
      }
      const existing = this.currentProgress.get(packId);
      this.notifyProgress({
        packId,
        totalBytes: existing?.totalBytes || 0,
        downloadedBytes: existing?.downloadedBytes || 0,
        percentage: existing?.percentage || 0,
        status: 'paused',
      });
    } catch (err) {
      console.warn(`[OfflineMapService] Failed to pause download for ${packId}:`, err);
    }
  }

  /**
   * Resume a paused download.
   */
  async resumeDownload(packId: string): Promise<void> {
    const resumable = this.activeDownloads.get(packId);
    if (!resumable) return;

    try {
      const existing = this.currentProgress.get(packId);
      this.notifyProgress({
        packId,
        totalBytes: existing?.totalBytes || 0,
        downloadedBytes: existing?.downloadedBytes || 0,
        percentage: existing?.percentage || 0,
        status: 'downloading',
      });

      await resumable.resumeAsync();
    } catch (err) {
      console.warn(`[OfflineMapService] Failed to resume download for ${packId}:`, err);
    }
  }

  /**
   * Cancel an in-progress or paused download and delete partial artifacts.
   */
  async cancelDownload(packId: string): Promise<void> {
    const resumable = this.activeDownloads.get(packId);
    if (resumable) {
      try {
        await resumable.cancelAsync();
      } catch (err) {
        console.warn(`[OfflineMapService] Failed to cancel download for ${packId}:`, err);
      }
      this.activeDownloads.delete(packId);
    }

    this.resumeDataMap.delete(packId);

    const dir = getMapsDirectory();
    if (dir) {
      try {
        // Look for any partial file matching packId or pack's temp download
        const fileInfo = await FileSystem.getInfoAsync(`${dir}${packId}.pmtiles`);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(`${dir}${packId}.pmtiles`, { idempotent: true });
        }
      } catch {
        // ignore
      }
    }

    this.notifyProgress({
      packId,
      totalBytes: 0,
      downloadedBytes: 0,
      percentage: 0,
      status: 'idle',
    });
  }

  /**
   * Delete an installed map pack from device storage and metadata.
   */
  async deleteInstalledPack(packId: string): Promise<void> {
    const meta = await this.loadMetadata();
    const pack = meta.installedPacks[packId];

    if (pack && Platform.OS !== 'web') {
      try {
        const fileInfo = await FileSystem.getInfoAsync(pack.fileUri);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(pack.fileUri, { idempotent: true });
        }
      } catch (err) {
        console.warn(`[OfflineMapService] Failed to delete file for pack ${packId}:`, err);
      }
    }

    delete meta.installedPacks[packId];
    if (meta.activePackId === packId) {
      meta.activePackId = null;
    }

    await this.saveMetadata(meta);

    this.notifyProgress({
      packId,
      totalBytes: 0,
      downloadedBytes: 0,
      percentage: 0,
      status: 'idle',
    });
  }
}

export const offlineMapService = new OfflineMapService();
