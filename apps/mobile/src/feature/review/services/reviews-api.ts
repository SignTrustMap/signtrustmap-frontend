import { apiRequest, jsonApiRequest } from '@/services/api-client';

export type ReviewSubmission = {
  captured: string;
  id: string;
  image: number | string;
  location: string;
  surveyorId: string;
  title: string;
};

type SignType = {
  id: number;
  nameEn: string;
  nameVi: string;
  signCode: string;
};

type Submission = {
  createdAt?: string;
  surveyorId?: string;
};

type Candidate = {
  bestFrameUrl?: string;
  createdAt: string;
  id: string;
  predictedSignType?: SignType;
  signCropUrl?: string;
  submission?: Submission;
  submissionId: string;
};

type QueueResponse = {
  items: Candidate[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type ReviewRecord = {
  candidate: Candidate;
  candidateId: string;
  declineNote?: string | null;
  declineReason?: string | null;
  reviewedAt: string;
  vote: number;
};

type HistoryResponse = {
  items: ReviewRecord[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
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

function toSubmission(candidate: Candidate): ReviewSubmission {
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

export async function getReviewQueue(accessToken: string) {
  const response = await apiRequest<QueueResponse>('/reviews/queue?page=1&pageSize=100', {}, accessToken);
  return {
    submissions: response.items.map(toSubmission),
    total: response.total,
  };
}

export async function getReviewHistory(accessToken: string): Promise<ReviewHistoryItem[]> {
  const response = await apiRequest<HistoryResponse>(
    '/reviews/me/history?page=1&pageSize=100',
    {},
    accessToken,
  );
  return response.items.map((record) => ({
    action: record.vote === 1 ? 'approved' : 'declined',
    submission: toSubmission(record.candidate),
  }));
}

export async function submitReview(
  candidateId: string,
  decision: ReviewDecision,
  accessToken: string,
) {
  if (decision.action === 'reported') {
    return jsonApiRequest(`/reviews/candidates/${candidateId}/report`, {
      reason: decision.declineNote || decision.declineReason || 'Reported by reviewer',
    }, accessToken);
  }

  return jsonApiRequest(`/reviews/${candidateId}/vote`, {
    vote: decision.action === 'approved' ? 1 : -1,
    ...(decision.declineReason ? { declineReason: decision.declineReason } : {}),
    ...(decision.declineNote ? { declineNote: decision.declineNote } : {}),
  }, accessToken);
}

export function undoReview(candidateId: string, accessToken: string) {
  return apiRequest(`/reviews/${candidateId}/vote`, { method: 'DELETE' }, accessToken);
}
