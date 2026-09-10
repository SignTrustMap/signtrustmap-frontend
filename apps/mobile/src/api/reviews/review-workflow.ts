import type { MyReviewHistoryResponse, ReviewCandidate, ReviewQueueResponse } from '@/types/reviewsType';

export type ReviewSubmission = {
  captured: string;
  id: string;
  image: number | string;
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
  return {
    captured: formatCaptured(candidate.submission?.createdAt ?? candidate.createdAt),
    id: candidate.id,
    image: candidate.signCropUrl || candidate.bestFrameUrl || fallbackImage,
    location: 'Location unavailable for this submission',
    surveyorId: candidate.submission?.surveyorId ?? candidate.submissionId,
    title: type?.nameEn || type?.nameVi || type?.signCode || 'Unidentified sign',
  };
}

export function selectReviewQueue(response: ReviewQueueResponse) {
  return {
    submissions: response.items.map(toSubmission),
    total: response.total,
  };
}

export function selectReviewHistory(response: MyReviewHistoryResponse): ReviewHistoryItem[] {
  return response.items.map((record) => ({
    action: record.vote === 1 ? 'approved' : 'declined',
    submission: toSubmission(record.candidate),
  }));
}
