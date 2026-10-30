import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatBytes, offlineMapService } from '@/services/offline-map-service';
import type {
  InstalledOfflineMapPack,
  OfflineMapPack,
  OfflineMapPackDownloadProgress,
  OfflineMapStorageMetadata,
} from '@/types/navigationType';

export function useOfflineMaps(accessToken?: string) {
  const [availablePacks, setAvailablePacks] = useState<OfflineMapPack[]>([]);
  const [installedPacks, setInstalledPacks] = useState<Record<string, InstalledOfflineMapPack>>({});
  const [activePackId, setActivePackId] = useState<string | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, OfflineMapPackDownloadProgress>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync initial metadata from storage
  const syncMetadata = useCallback(async () => {
    try {
      const meta = await offlineMapService.loadMetadata();
      setInstalledPacks(meta.installedPacks || {});
      setActivePackId(meta.activePackId);
    } catch (err) {
      console.warn('[useOfflineMaps] Failed to load metadata:', err);
    }
  }, []);

  // Fetch available packs from backend
  const fetchPacks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const packs = await offlineMapService.fetchAvailablePacks(accessToken);
      setAvailablePacks(packs);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể tải danh sách gói bản đồ ngoại tuyến';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  // Listeners for background download progress and storage changes
  useEffect(() => {
    syncMetadata();
    fetchPacks();

    const unsubProgress = offlineMapService.subscribeToProgress((progress) => {
      setProgressMap((prev) => ({
        ...prev,
        [progress.packId]: progress,
      }));
    });

    const unsubMeta = offlineMapService.subscribeToMetadata((meta: OfflineMapStorageMetadata) => {
      setInstalledPacks(meta.installedPacks || {});
      setActivePackId(meta.activePackId);
    });

    return () => {
      unsubProgress();
      unsubMeta();
    };
  }, [syncMetadata, fetchPacks]);

  const startDownload = useCallback(
    async (pack: OfflineMapPack) => {
      setError(null);
      try {
        await offlineMapService.startDownload(pack, accessToken);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Tải gói bản đồ thất bại';
        setError(msg);
      }
    },
    [accessToken],
  );

  const pauseDownload = useCallback(async (packId: string) => {
    await offlineMapService.pauseDownload(packId);
  }, []);

  const resumeDownload = useCallback(async (packId: string) => {
    await offlineMapService.resumeDownload(packId);
  }, []);

  const cancelDownload = useCallback(async (packId: string) => {
    await offlineMapService.cancelDownload(packId);
  }, []);

  const deletePack = useCallback(async (packId: string) => {
    try {
      await offlineMapService.deleteInstalledPack(packId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Xóa gói bản đồ thất bại';
      setError(msg);
    }
  }, []);

  const toggleActivePack = useCallback(
    async (packId: string) => {
      try {
        const nextPackId = activePackId === packId ? null : packId;
        await offlineMapService.setActiveOfflinePack(nextPackId);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Chuyển đổi trạng thái bản đồ thất bại';
        setError(msg);
      }
    },
    [activePackId],
  );

  const totalInstalledBytes = useMemo(() => {
    return Object.values(installedPacks).reduce((sum, p) => sum + (p.sizeBytes || 0), 0);
  }, [installedPacks]);

  const totalInstalledSizeFormatted = useMemo(() => {
    return formatBytes(totalInstalledBytes);
  }, [totalInstalledBytes]);

  const activePack = useMemo(() => {
    return activePackId ? installedPacks[activePackId] || null : null;
  }, [activePackId, installedPacks]);

  return {
    availablePacks,
    installedPacks,
    activePackId,
    activePack,
    progressMap,
    isLoading,
    error,
    totalInstalledBytes,
    totalInstalledSizeFormatted,
    fetchPacks,
    startDownload,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    deletePack,
    toggleActivePack,
  };
}
