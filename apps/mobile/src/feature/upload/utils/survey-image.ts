import { Platform } from 'react-native';

import type { UploadChunkRequest } from '@/types/survey-submission/surveySubmissionType';

export type SurveyImage = {
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

/** Read the selected image and prepare a platform-specific upload payload. */
export async function prepareSurveyImage(image: SurveyImage) {
  const response = await fetch(image.uri);
  if (/^https?:/i.test(image.uri) && !response.ok) {
    throw new Error('The selected image could not be read.');
  }
  const blob = await response.blob();
  if (blob.size < 1) throw new Error('The selected image is empty.');

  const fileName = image.fileName?.trim()
    || image.uri.split('/').pop()?.split('?')[0]
    || `survey-sign-${Date.now()}.jpg`;
  const mimeType = imageMimeType(fileName, image.mimeType || blob.type);
  const chunk: UploadChunkRequest = {
    chunkIndex: 0,
    fileName,
    file: Platform.OS === 'web'
      ? blob
      : { name: fileName, type: mimeType, uri: image.uri },
  };

  return { fileName, sizeBytes: blob.size, chunk };
}
