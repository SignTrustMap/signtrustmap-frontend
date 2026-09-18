import { getStorageItemAsync, setStorageItemAsync } from '@/hooks/use-storage';
import { getSurveySubmissionStatus } from '@/api/survey-submission/survey-submission';
import { cropHighResSignPatch, type SignCandidateBox } from './high-res-cropper';

const ZERO_COPY_INDEX_KEY = 'stm_zero_copy_submissions_index';

export type ZeroCopyRecord = {
  submissionId: string;
  videoUri: string;
  assetId?: string;
  createdAt: number;
  status: 'PENDING_DETECTION' | 'CROPPED' | 'EXPIRED';
};

async function getIndexedRecords(): Promise<Record<string, ZeroCopyRecord>> {
  try {
    const raw = await getStorageItemAsync(ZERO_COPY_INDEX_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveIndexedRecords(records: Record<string, ZeroCopyRecord>): Promise<void> {
  await setStorageItemAsync(ZERO_COPY_INDEX_KEY, JSON.stringify(records));
}

/**
 * Registers a zero-copy reference to an original 4K video.
 * Does NOT duplicate the video into app sandbox cache, keeping storage overhead zero.
 */
export async function registerZeroCopyDraft(
  submissionId: string,
  videoUri: string,
  assetId?: string,
): Promise<void> {
  const records = await getIndexedRecords();
  records[submissionId] = {
    submissionId,
    videoUri,
    assetId,
    createdAt: Date.now(),
    status: 'PENDING_DETECTION',
  };
  await saveIndexedRecords(records);
}

/**
 * Releases the zero-copy reference and marks the survey lifecycle 100% completed.
 */
export async function releaseZeroCopyDraft(submissionId: string): Promise<void> {
  const records = await getIndexedRecords();
  if (records[submissionId]) {
    delete records[submissionId];
    await saveIndexedRecords(records);
  }
}

/**
 * Layer 1 (Foreground): Smart Polling for Jetson AI detection results.
 * Checks every 4 seconds for up to 2 minutes. Once candidates appear,
 * triggers high-res 4K cropping and clean-up.
 */
export function startSmartPollingSync(
  submissionId: string,
  videoUri: string,
  accessToken: string,
  onComplete?: (count: number) => void,
): () => void {
  let active = true;
  let attempts = 0;
  const maxAttempts = 30; // 30 * 4s = 120s (2 minutes max polling)

  const pollInterval = setInterval(async () => {
    if (!active || attempts >= maxAttempts) {
      clearInterval(pollInterval);
      return;
    }

    attempts += 1;

    try {
      const statusRes = await getSurveySubmissionStatus(submissionId, accessToken);
      const candidates = (statusRes as any)?.candidates as SignCandidateBox[] | undefined;

      if (candidates && candidates.length > 0) {
        clearInterval(pollInterval);

        // Execute 4K high-res crop for each detected sign box
        for (const candidate of candidates) {
          await cropHighResSignPatch(candidate, videoUri);
        }

        await releaseZeroCopyDraft(submissionId);
        onComplete?.(candidates.length);
      }
    } catch {
      // Ignore intermittent network glitch during polling
    }
  }, 4000);

  return () => {
    active = false;
    clearInterval(pollInterval);
  };
}

/**
 * Layer 3 (Reconciliation on App Launch):
 * Automatically syncs any pending survey that arrived while app was closed or offline.
 */
export async function reconcilePendingCrops(accessToken: string): Promise<void> {
  try {
    const records = await getIndexedRecords();
    const submissionIds = Object.keys(records);

    for (const id of submissionIds) {
      const record = records[id];
      // Expire old records older than 48 hours
      if (Date.now() - record.createdAt > 48 * 60 * 60 * 1000) {
        await releaseZeroCopyDraft(id);
        continue;
      }

      try {
        const statusRes = await getSurveySubmissionStatus(id, accessToken);
        const candidates = (statusRes as any)?.candidates as SignCandidateBox[] | undefined;
        if (candidates && candidates.length > 0) {
          for (const candidate of candidates) {
            await cropHighResSignPatch(candidate, record.videoUri);
          }
          await releaseZeroCopyDraft(id);
        }
      } catch {
        // Continue with next record
      }
    }
  } catch {
    // Fail silently during background launch reconciliation
  }
}
