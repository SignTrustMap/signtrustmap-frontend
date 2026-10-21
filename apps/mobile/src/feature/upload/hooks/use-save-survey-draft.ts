import { useRef } from 'react';

import { useSession } from '@/context/session-provider';
import {
  GPX_UPLOAD_SESSION_UNAVAILABLE_MESSAGE,
  SIGN_IN_TO_SAVE_DRAFT_MESSAGE,
  UPLOAD_SESSION_UNAVAILABLE_MESSAGE,
} from '@/constants/message';
import { useCompleteSurveyUpload, useCreateSurveySubmission, useInitializeSurveyUpload, useUploadSurveyChunk } from './use-survey-submission';
import { prepareSurveyGpx, prepareSurveyImage, type SurveyImage } from '../utils/survey-image';
import { readSubmissionId } from '../utils/submission-response';
import { getStorageItemAsync, setStorageItemAsync } from '@/hooks/use-storage';
import type { CreateSubmissionDto } from '@/types/surveySubmissionType';

type DraftImage = SurveyImage & {
  submissionId: string;
  sessionId?: string;
  chunkUploaded?: boolean;
  uploadCompleted?: boolean;
  gpxUri?: string;
  gpxName?: string;
  gpxSessionId?: string;
  gpxChunkUploaded?: boolean;
  gpxUploadCompleted?: boolean;
};
const draftKey = (accountId: string, submissionId: string) => `survey-draft-${accountId}-${submissionId}`;

export async function readDraftImage(accountId: string, submissionId: string): Promise<DraftImage | undefined> {
  const value = await getStorageItemAsync(draftKey(accountId, submissionId));
  if (!value) return undefined;
  try {
    const image = JSON.parse(value) as DraftImage;
    return image.submissionId === submissionId && typeof image.uri === 'string' ? image : undefined;
  } catch { return undefined; }
}

export async function updateDraftCoordinates(
  accountId: string,
  submissionId: string,
  coords: { latitude?: number; longitude?: number },
) {
  const existing = await readDraftImage(accountId, submissionId);
  if (existing) {
    const updated: DraftImage = {
      ...existing,
      startLat: coords.latitude ?? existing.startLat,
      startLon: coords.longitude ?? existing.startLon,
    };
    await setStorageItemAsync(draftKey(accountId, submissionId), JSON.stringify(updated));
    return updated;
  }
  return undefined;
}

/** Saves media on a draft only. Final submission belongs to the details screen. */
export function useSaveSurveyDraft() {
  const { session } = useSession();
  const create = useCreateSurveySubmission();
  const initialize = useInitializeSurveyUpload();
  const upload = useUploadSurveyChunk();
  const complete = useCompleteSurveyUpload();
  const attempt = useRef<DraftImage | undefined>(undefined);

  return async (
    image: SurveyImage,
    request: CreateSubmissionDto,
    submissionId?: string,
    gpx?: { name?: string; uri: string },
  ) => {
    if (!session) throw new Error(SIGN_IN_TO_SAVE_DRAFT_MESSAGE);
    let draft: DraftImage;
    let preparedImage: Awaited<ReturnType<typeof prepareSurveyImage>> | undefined;

    const effectiveLat = image.startLat ?? (typeof request.latitude === 'number' ? request.latitude : undefined);
    const effectiveLon = image.startLon ?? (typeof request.longitude === 'number' ? request.longitude : undefined);

    if (submissionId) {
      const existing = (attempt.current?.submissionId === submissionId ? attempt.current : undefined)
        ?? await readDraftImage(session.account.id, submissionId);
      draft = existing ? {
        ...existing,
        ...image,
        startLat: effectiveLat ?? existing.startLat,
        startLon: effectiveLon ?? existing.startLon,
      } : {
        ...image,
        startLat: effectiveLat,
        startLon: effectiveLon,
        submissionId,
        gpxName: gpx?.name,
        gpxUri: gpx?.uri,
      };
    } else {
      if (image.type !== 'video') {
        // Read the file before creating a record so unreadable images do not create empty drafts.
        preparedImage = await prepareSurveyImage(image);
      }
      const newSubmissionId = readSubmissionId(await create.mutateAsync({ request }));
      draft = {
        ...image,
        startLat: effectiveLat,
        startLon: effectiveLon,
        submissionId: newSubmissionId,
        gpxName: gpx?.name,
        gpxUri: gpx?.uri,
      };
    }

    if (gpx?.uri && !draft.gpxUri) {
      draft.gpxUri = gpx.uri;
      draft.gpxName = gpx.name;
    }

    attempt.current = draft;
    const persist = () => setStorageItemAsync(draftKey(session.account.id, draft.submissionId), JSON.stringify(draft));
    await persist();

    // Chunked video uploads are orchestrated via chunk-upload-manager in survey-record-details-screen.
    // For single images, complete the direct single-chunk upload here.
    if (image.type !== 'video' && !draft.uploadCompleted) {
      if (!draft.chunkUploaded) {
        const prepared = preparedImage ?? await prepareSurveyImage(image);
        if (!draft.sessionId) {
          const result = await initialize.mutateAsync({
            submissionId: draft.submissionId, request: {
              originalFilename: prepared.fileName, mediaType: 'IMAGE', totalChunks: 1, totalSizeBytes: prepared.sizeBytes,
            }
          });
          draft.sessionId = result.sessionId;
          await persist();
        }
        await upload.mutateAsync({ sessionId: draft.sessionId, request: prepared.chunk });
        draft.chunkUploaded = true;
        await persist();
      }
      if (!draft.sessionId) throw new Error(UPLOAD_SESSION_UNAVAILABLE_MESSAGE);
      await complete.mutateAsync({ sessionId: draft.sessionId });
      draft.uploadCompleted = true;
      await persist();
    }

    const targetGpxUri = gpx?.uri ?? draft.gpxUri;
    if (targetGpxUri && !draft.gpxUploadCompleted) {
      if (!draft.gpxChunkUploaded) {
        const preparedGpx = await prepareSurveyGpx({ uri: targetGpxUri, name: gpx?.name ?? draft.gpxName });
        if (!draft.gpxSessionId) {
          const result = await initialize.mutateAsync({
            submissionId: draft.submissionId, request: {
              originalFilename: preparedGpx.fileName, mediaType: 'GPX', totalChunks: 1, totalSizeBytes: preparedGpx.sizeBytes,
            }
          });
          draft.gpxSessionId = result.sessionId;
          await persist();
        }
        await upload.mutateAsync({ sessionId: draft.gpxSessionId, request: preparedGpx.chunk });
        draft.gpxChunkUploaded = true;
        await persist();
      }
      if (!draft.gpxSessionId) throw new Error(GPX_UPLOAD_SESSION_UNAVAILABLE_MESSAGE);
      await complete.mutateAsync({ sessionId: draft.gpxSessionId });
      draft.gpxUploadCompleted = true;
      await persist();
    }

    return draft.submissionId;
  };
}
