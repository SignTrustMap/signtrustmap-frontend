import { useRef } from 'react';

import { useSession } from '@/context/session-provider';
import { useCompleteSurveyUpload, useCreateSurveySubmission, useInitializeSurveyUpload, useUploadSurveyChunk } from './use-survey-submission';
import { prepareSurveyImage, type SurveyImage } from '../utils/survey-image';
import { readSubmissionId } from '../utils/submission-response';
import { getStorageItemAsync, setStorageItemAsync } from '@/hooks/use-storage';
import type { CreateSubmissionDto } from '@/types/survey-submission/surveySubmissionType';

type DraftImage = SurveyImage & {
  submissionId: string;
  sessionId?: string;
  chunkUploaded?: boolean;
  uploadCompleted?: boolean;
  gpxUri?: string;
  gpxName?: string;
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
    if (!session) throw new Error('Sign in to save a draft.');
    if (submissionId && attempt.current?.submissionId !== submissionId) {
      attempt.current = await readDraftImage(session.account.id, submissionId) ?? {
        ...image,
        submissionId,
        gpxName: gpx?.name,
        gpxUri: gpx?.uri,
      };
    }
    if (!attempt.current || attempt.current.uri !== image.uri) {
      // Read the file before creating a record so unreadable images do not create empty drafts.
      await prepareSurveyImage(image);
      attempt.current = {
        ...image,
        submissionId: submissionId ?? readSubmissionId(await create.mutateAsync({ request })),
        gpxName: gpx?.name,
        gpxUri: gpx?.uri,
      };
    } else if (gpx?.uri && !attempt.current.gpxUri) {
      attempt.current.gpxUri = gpx.uri;
      attempt.current.gpxName = gpx.name;
    }
    const draft = attempt.current;
    const persist = () => setStorageItemAsync(draftKey(session.account.id, draft.submissionId), JSON.stringify(draft));
    await persist();
    if (!draft.uploadCompleted) {
      if (!draft.chunkUploaded) {
        const prepared = await prepareSurveyImage(image);
        if (!draft.sessionId) {
          const mediaType = image.type === 'video' ? 'VIDEO' : 'IMAGE';
          const result = await initialize.mutateAsync({ submissionId: draft.submissionId, request: {
            originalFilename: prepared.fileName, mediaType, totalChunks: 1, totalSizeBytes: prepared.sizeBytes,
          } });
          draft.sessionId = result.sessionId;
          await persist();
        }
        await upload.mutateAsync({ sessionId: draft.sessionId, request: prepared.chunk });
        draft.chunkUploaded = true;
        await persist();
      }
      if (!draft.sessionId) throw new Error('Upload session is unavailable. Please retry.');
      await complete.mutateAsync({ sessionId: draft.sessionId });
      draft.uploadCompleted = true;
      await persist();
    }
    return draft.submissionId;
  };
}
