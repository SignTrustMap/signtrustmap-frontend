import { Platform } from 'react-native';

import { apiRequest, jsonApiRequest } from '@/api/api-client';

type InitializeUploadResponse = {
  sessionId: string;
};

export type CompletedSurveySubmission = {
  checksum: string;
  mediaFileId: string;
  sessionId: string;
  sizeBytes: number;
  status: 'COMPLETED';
  storageKey: string;
  submissionId: string;
  submissionStatus: string;
};

export type SurveySubmissionAttempt = {
  chunkUploaded?: boolean;
  sessionId?: string;
};

type SurveyImage = {
  fileName?: string;
  mimeType?: string;
  uri: string;
};

function imageMimeType(fileName: string, preferred?: string) {
  if (preferred?.startsWith('image/')) return preferred;
  const extension = fileName.toLowerCase().split('.').pop();
  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';
  if (extension === 'heic' || extension === 'heif') return 'image/heic';
  return 'image/jpeg';
}

function imageFileName(image: SurveyImage) {
  const providedName = image.fileName?.trim();
  if (providedName) return providedName;
  const uriName = image.uri.split('/').pop()?.split('?')[0];
  return uriName || `survey-sign-${Date.now()}.jpg`;
}

export async function submitSurveyImage(
  image: SurveyImage,
  accessToken: string,
  attempt: SurveySubmissionAttempt = {},
): Promise<CompletedSurveySubmission> {
  const fileResponse = await fetch(image.uri);
  if (/^https?:/i.test(image.uri) && !fileResponse.ok) {
    throw new Error('The selected image could not be read.');
  }

  const blob = await fileResponse.blob();
  if (blob.size < 1) throw new Error('The selected image is empty.');

  const fileName = imageFileName(image);
  const mimeType = imageMimeType(fileName, image.mimeType || blob.type);
  if (!attempt.sessionId) {
    const upload = await jsonApiRequest<InitializeUploadResponse>(
      '/submissions/initialize',
      {
        mediaType: 'IMAGE',
        originalFilename: fileName,
        totalChunks: 1,
        totalSizeBytes: blob.size,
      },
      accessToken,
    );
    attempt.sessionId = upload.sessionId;
  }

  if (!attempt.chunkUploaded) {
    const form = new FormData();
    if (Platform.OS === 'web') {
      form.append('file', blob, fileName);
    } else {
      form.append(
        'file',
        { name: fileName, type: mimeType, uri: image.uri } as unknown as Blob,
      );
    }
    form.append('chunkIndex', '0');
    await apiRequest(
      `/submissions/${attempt.sessionId}/chunks`,
      { body: form, method: 'POST' },
      accessToken,
    );
    attempt.chunkUploaded = true;
  }

  return apiRequest<CompletedSurveySubmission>(
    `/submissions/${attempt.sessionId}/complete`,
    { method: 'POST' },
    accessToken,
  );
}
