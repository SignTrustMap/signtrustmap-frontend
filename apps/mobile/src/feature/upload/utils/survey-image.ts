import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { Blob } from 'expo-blob';

import type { UploadChunkRequest } from '@/types/survey-submission/surveySubmissionType';

export type SurveyImage = {
  fileName?: string;
  mimeType?: string;
  type?: 'image' | 'video';
  uri: string;
  duration?: number;
  assetId?: string;
  startLat?: number;
  startLon?: number;
  endLat?: number;
  endLon?: number;
};

export type SurveyGpx = {
  name?: string;
  uri: string;
};

function imageMimeType(fileName: string, preferred?: string) {
  if (preferred?.startsWith('image/') || preferred?.startsWith('video/')) return preferred;
  const extension = fileName.toLowerCase().split('.').pop();
  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';
  if (extension === 'heic' || extension === 'heif') return 'image/heic';
  if (extension === 'mp4') return 'video/mp4';
  if (extension === 'mov') return 'video/quicktime';
  if (extension === 'mkv') return 'video/x-matroska';
  return 'image/jpeg';
}

/** Read the selected media and prepare a Blob accepted by Expo and browser FormData. */
export async function prepareSurveyImage(image: SurveyImage) {
  const isVideo = image.type === 'video';
  const fileName = image.fileName?.trim()
    || image.uri.split('/').pop()?.split('?')[0]
    || `survey-${isVideo ? 'video' : 'sign'}-${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`;
  const mimeType = imageMimeType(fileName, image.mimeType);

  if (Platform.OS !== 'web' && (image.uri.startsWith('file://') || image.uri.startsWith('/'))) {
    const info = await FileSystem.getInfoAsync(image.uri);
    if (!info.exists || !info.size) {
      throw new Error('The selected media could not be read or is empty.');
    }
    const chunk: UploadChunkRequest = {
      chunkIndex: 0,
      fileName,
      file: {
        uri: image.uri,
        name: fileName,
        type: mimeType,
      },
    };
    return { fileName, sizeBytes: info.size, chunk };
  }

  const response = await fetch(image.uri);
  if (/^https?:/i.test(image.uri) && !response.ok) {
    throw new Error('The selected media could not be read.');
  }
  const blob = new Blob([await response.arrayBuffer()], {
    type: response.headers.get('content-type') ?? mimeType,
  });
  if (blob.size < 1) throw new Error('The selected media is empty.');

  const chunk: UploadChunkRequest = {
    chunkIndex: 0,
    fileName,
    file: Object.assign(blob.slice(0, blob.size, mimeType), { name: fileName }) as unknown as globalThis.Blob,
  };

  return { fileName, sizeBytes: blob.size, chunk };
}

/** Read the selected GPX file and prepare a Blob or Native File URI descriptor for GPX media upload. */
export async function prepareSurveyGpx(gpx: SurveyGpx) {
  const fileName = gpx.name?.trim()
    || gpx.uri.split('/').pop()?.split('?')[0]
    || `track-${Date.now()}.gpx`;

  let xmlContent: string;
  if (gpx.uri.startsWith('data:')) {
    // Decode data URI directly without fetch (avoids java.net.MalformedURLException: unknown protocol: data on Android)
    const commaIdx = gpx.uri.indexOf(',');
    const raw = commaIdx >= 0 ? gpx.uri.slice(commaIdx + 1) : gpx.uri;
    xmlContent = decodeURIComponent(raw);
  } else if (Platform.OS !== 'web' && (gpx.uri.startsWith('file://') || gpx.uri.startsWith('/'))) {
    xmlContent = await FileSystem.readAsStringAsync(gpx.uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });
  } else {
    const response = await fetch(gpx.uri);
    if (/^https?:/i.test(gpx.uri) && !response.ok) {
      throw new Error('The selected GPX file could not be read.');
    }
    xmlContent = await response.text();
  }

  if (!xmlContent || xmlContent.trim().length === 0) {
    throw new Error('The selected GPX file is empty.');
  }

  const encodedBytes = new TextEncoder().encode(xmlContent);
  const sizeBytes = encodedBytes.length;

  if (Platform.OS === 'web') {
    const blob = new Blob([xmlContent], { type: 'application/gpx+xml' });
    const chunk: UploadChunkRequest = {
      chunkIndex: 0,
      fileName,
      file: Object.assign(blob, { name: fileName }) as unknown as globalThis.Blob,
    };
    return { fileName, sizeBytes: blob.size, chunk };
  }

  // On Native: write XML to a temporary cache file so FileSystem.uploadAsync can stream it natively
  const gpxCacheUri = `${FileSystem.cacheDirectory}${fileName}`;
  await FileSystem.writeAsStringAsync(gpxCacheUri, xmlContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const chunk: UploadChunkRequest = {
    chunkIndex: 0,
    fileName,
    file: {
      uri: gpxCacheUri,
      name: fileName,
      type: 'application/gpx+xml',
    },
  };

  return { fileName, sizeBytes, chunk };
}
