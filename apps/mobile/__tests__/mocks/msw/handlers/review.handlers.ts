import { http, HttpResponse } from 'msw';
import {
  mockReviewQueueResponse,
  mockReviewCandidates,
} from '../fixtures/review.fixtures';

export const REVIEW_QUEUE_PATH = '*/api/v1/reviews/queue';
export const REVIEW_HISTORY_PATH = '*/api/v1/reviews/me/history';
export const REVIEW_CANDIDATE_DETAIL_PATH = '*/api/v1/reviews/candidates/:candidateId';
export const REVIEW_VOTE_PATH = '*/api/v1/reviews/:candidateId/vote';
export const REVIEW_REPORT_PATH = '*/api/v1/reviews/candidates/:candidateId/report';
export const REVIEW_SKIP_PATH = '*/api/v1/reviews/candidates/:candidateId/skip';
export const REVIEW_CANNOT_IDENTIFY_PATH = '*/api/v1/reviews/candidates/:candidateId/can-not-identify';

export const reviewHandlers = [
  // 1. GET /reviews/queue
  http.get(REVIEW_QUEUE_PATH, () => {
    return HttpResponse.json(mockReviewQueueResponse, { status: 200 });
  }),

  // 2. GET /reviews/me/history
  http.get(REVIEW_HISTORY_PATH, () => {
    return HttpResponse.json({ items: [], total: 0, page: 1, pageSize: 20 }, { status: 200 });
  }),

  // 3. GET /reviews/candidates/:candidateId
  http.get(REVIEW_CANDIDATE_DETAIL_PATH, ({ params }) => {
    const candidate = mockReviewCandidates.find((c) => c.id === params.candidateId) ?? mockReviewCandidates[0];
    return HttpResponse.json(
      {
        candidate,
        submission: candidate.submission,
        voteCount: 0,
        locationContext: {
          coordinates: { latitude: 10.762622, longitude: 106.660172 },
          displayLocation: 'District 1, Ho Chi Minh City',
        },
      },
      { status: 200 },
    );
  }),

  // 4. POST /reviews/:candidateId/vote (Approve / Decline)
  http.post(REVIEW_VOTE_PATH, async ({ params, request }) => {
    const body = (await request.json().catch(() => ({}))) as any;
    return HttpResponse.json(
      {
        review: {
          candidateId: params.candidateId,
          vote: body.vote,
          suggestedSignTypeId: body.suggestedSignTypeId ?? null,
          declineReason: body.declineReason ?? null,
          declineNote: body.declineNote ?? null,
        },
        consensusLog: null,
      },
      { status: 201 },
    );
  }),

  // 5. POST /reviews/candidates/:candidateId/report
  http.post(REVIEW_REPORT_PATH, async ({ params, request }) => {
    const body = (await request.json().catch(() => ({}))) as any;
    return HttpResponse.json(
      {
        reported: true,
        candidateId: params.candidateId,
        caseId: 'mod-case-mock-1',
        reason: body.reason,
      },
      { status: 201 },
    );
  }),

  // 6. POST /reviews/candidates/:candidateId/skip
  http.post(REVIEW_SKIP_PATH, ({ params }) => {
    return HttpResponse.json(
      {
        skipped: true,
        candidateId: params.candidateId,
      },
      { status: 200 },
    );
  }),

  // 7. POST /reviews/candidates/:candidateId/can-not-identify
  http.post(REVIEW_CANNOT_IDENTIFY_PATH, ({ params }) => {
    return HttpResponse.json(
      {
        review: {
          candidateId: params.candidateId,
          vote: 0,
          declineReason: 'Other',
          declineNote: 'Cannot identify',
        },
        consensusLog: null,
      },
      { status: 201 },
    );
  }),

  // 8. DELETE /reviews/:candidateId/vote (Undo vote)
  http.delete(REVIEW_VOTE_PATH, ({ params }) => {
    return HttpResponse.json(
      {
        undone: true,
        candidateId: params.candidateId,
      },
      { status: 200 },
    );
  }),
];
