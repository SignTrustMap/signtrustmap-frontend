import { useState, useCallback } from 'react';
import { checkAppUpdate, type ReleaseInfo, type UpdateCheckResult } from '@/services/update-service';

export type UpdateStatus = 'idle' | 'checking' | 'available' | 'up-to-date' | 'error';

export function useAppUpdate() {
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [releaseInfo, setReleaseInfo] = useState<ReleaseInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentVersion, setCurrentVersion] = useState<string>('1.0.0');
  const [currentCommit, setCurrentCommit] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const checkForUpdates = useCallback(async () => {
    setStatus('checking');
    setIsModalOpen(true);
    setErrorMessage(null);

    const result: UpdateCheckResult = await checkAppUpdate();
    setCurrentVersion(result.currentVersion);
    setCurrentCommit(result.currentCommit);

    if (result.error) {
      setStatus('error');
      setErrorMessage(result.error);
      return;
    }

    if (result.isUpdateAvailable && result.latestRelease) {
      setStatus('available');
      setReleaseInfo(result.latestRelease);
    } else {
      setStatus('up-to-date');
      setReleaseInfo(result.latestRelease ?? null);
    }
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  return {
    status,
    releaseInfo,
    errorMessage,
    currentVersion,
    currentCommit,
    isModalOpen,
    checkForUpdates,
    closeModal,
  };
}
