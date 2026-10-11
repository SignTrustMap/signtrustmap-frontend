import type { ReviewCandidate, ReviewQueueResponse } from '@/types/reviewsType';

/**
 * Fixture candidates representing unverified traffic sign candidates.
 * Includes both direct S3 URLs (no conversion needed) and legacy CDN URLs (fallback conversion).
 */
export const mockReviewCandidates: ReviewCandidate[] = [
  {
    id: 'cand-001',
    submissionId: 'sub-001',
    createdAt: '2026-10-01T08:00:00Z',
    predictedSignType: {
      id: 101,
      signCode: 'P.127',
      nameEn: 'Speed Limit 50',
      nameVi: 'Tốc độ tối đa 50 km/h',
    },
    // Scenario: Direct S3 URL -> should NOT be converted
    signCropUrl: 'https://s3.signmap.site/stm-sign-crops/crop-s3-direct.jpg',
    bestFrameUrl: 'https://s3.signmap.site/stm-sign-crops/frame-s3-direct.jpg',
    submission: {
      surveyorId: 'surveyor-ext-1',
      createdAt: '2026-10-01T08:00:00Z',
    },
  },
  {
    id: 'cand-002',
    submissionId: 'sub-002',
    createdAt: '2026-10-01T08:30:00Z',
    predictedSignType: {
      id: 102,
      signCode: 'W.201a',
      nameEn: 'Dangerous Curve Left',
      nameVi: 'Chỗ ngoặt nguy hiểm bên trái',
    },
    // Scenario: Legacy CDN URL -> fallback converts to S3 URL
    signCropUrl: 'https://cdn.signmap.site/stm-sign-crops/crop-cdn-fallback.jpg',
    bestFrameUrl: undefined,
    submission: {
      surveyorId: 'surveyor-ext-2',
      createdAt: '2026-10-01T08:30:00Z',
    },
  },
  {
    id: 'cand-003',
    submissionId: 'sub-003',
    createdAt: '2026-10-01T09:00:00Z',
    predictedSignType: {
      id: 103,
      signCode: 'P.102',
      nameEn: 'No Entry',
      nameVi: 'Cấm đi ngược chiều',
    },
    // Scenario: Direct S3 URL without bucket in crop name
    signCropUrl: 'https://s3.signmap.site/stm-sign-crops/crop-no-entry.jpg',
    submission: {
      surveyorId: 'surveyor-ext-3',
      createdAt: '2026-10-01T09:00:00Z',
    },
  },
];

export const mockReviewQueueResponse: ReviewQueueResponse = {
  items: mockReviewCandidates,
  total: mockReviewCandidates.length,
  page: 1,
  pageSize: 20,
  totalPages: 1,
};

export const mockEmptyQueueResponse: ReviewQueueResponse = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 20,
  totalPages: 0,
};
