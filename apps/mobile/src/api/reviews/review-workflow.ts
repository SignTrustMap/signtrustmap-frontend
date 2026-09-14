import type { MyReviewHistoryResponse, ReviewCandidate, ReviewQueueResponse } from '@/types/reviewsType';

export type ReviewSubmission = {
  captured: string;
  id: string;
  image: any;
  location: string;
  surveyorId: string;
  title: string;
};

export type ReviewDecision = {
  action: 'approved' | 'declined' | 'reported';
  declineNote?: string;
  declineReason?: string;
};

export type ReviewHistoryItem = {
  action: 'approved' | 'declined';
  submission: ReviewSubmission;
};

const fallbackImage = require('@/assets/images/smaple_signs/stop_sign.webp');
const CDN_BASE = process.env.EXPO_PUBLIC_CDN_URL?.replace(/\/$/, '') || 'https://cdn.signmap.site';

export function resolveCdnUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  let clean = url;
  for (const prefix of ['stm-sign-crops/', 'stm-raw-videos/', 'stm-gpx-logs/']) {
    if (clean.startsWith(prefix)) {
      clean = clean.slice(prefix.length);
      break;
    }
  }
  return `${CDN_BASE}/${clean}`;
}

function formatCaptured(value?: string) {
  if (!value) return 'Capture time unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
  });
}

function toSubmission(candidate: ReviewCandidate): ReviewSubmission {
  const type = candidate.predictedSignType;
  const cropUrl = resolveCdnUrl(candidate.signCropUrl);
  const frameUrl = resolveCdnUrl(candidate.bestFrameUrl);
  const imageSource = cropUrl ? { uri: cropUrl } : (frameUrl ? { uri: frameUrl } : fallbackImage);
  return {
    captured: formatCaptured(candidate.submission?.createdAt ?? candidate.createdAt),
    id: candidate.id,
    image: imageSource,
    location: 'Estimated GPS coordinates available',
    surveyorId: candidate.submission?.surveyorId ?? candidate.submissionId,
    title: type?.nameVi ? `${type.nameVi} (${type.signCode})` : (type?.nameEn || type?.signCode || 'Unidentified sign'),
  };
}

export function selectReviewQueue(response: ReviewQueueResponse) {
  return {
    submissions: (response?.items || []).map(toSubmission),
    total: response?.total ?? (response?.items || []).length,
  };
}

export function selectReviewHistory(response: MyReviewHistoryResponse): ReviewHistoryItem[] {
  return (response?.items || []).map((record) => ({
    action: record.vote === 1 ? 'approved' : 'declined',
    submission: toSubmission(record.candidate),
  }));
}
