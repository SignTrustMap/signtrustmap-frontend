import { http, HttpResponse } from 'msw';
import {
  mockCompleteUploadResponse,
  mockCreatedSubmission,
  mockInitializeUploadResponse,
  mockPendingSubmissionsResponse,
  mockSubmissionStatusResponse,
  mockSubmitSubmissionResponse,
  mockSurveyorStatsResponse,
  mockUploadChunkResponse,
  mockUploadSessionResponse,
} from '../fixtures/submission.fixtures';

export const SUBMISSIONS_PATH = '*/api/v1/submissions';
export const SUBMISSION_BY_ID_PATH = '*/api/v1/submissions/:submissionId';
export const INITIALIZE_UPLOAD_PATH = '*/api/v1/submissions/:submissionId/uploads';
export const UPLOAD_CHUNK_PATH = '*/api/v1/submissions/uploads/:sessionId/chunks';
export const COMPLETE_UPLOAD_PATH = '*/api/v1/submissions/uploads/:sessionId/complete';
export const GET_UPLOAD_SESSION_PATH = '*/api/v1/submissions/uploads/:sessionId';
export const SUBMIT_SUBMISSION_PATH = '*/api/v1/submissions/:submissionId/submit';
export const SUBMISSION_STATUS_PATH = '*/api/v1/submissions/status/:submissionId';
export const PENDING_SUBMISSIONS_PATH = '*/api/v1/submissions/me/pending';
export const SURVEYOR_STATS_PATH = '*/api/v1/submissions/me/stats';
export const MY_SUBMISSIONS_PATH = '*/api/v1/submissions/me';

export const submissionHandlers = [
  // 1. POST /submissions (Create draft contract)
  http.post(SUBMISSIONS_PATH, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as any;
    return HttpResponse.json(
      {
        ...mockCreatedSubmission,
        submissionType: body.submissionType ?? 'SINGLE_IMAGE',
        coordinateSource: body.coordinateSource ?? 'IMAGE_EXIF',
        capturedAt: body.capturedAt ?? mockCreatedSubmission.capturedAt,
        latitude: body.latitude ?? mockCreatedSubmission.latitude,
        longitude: body.longitude ?? mockCreatedSubmission.longitude,
        note: body.note,
      },
      { status: 201 },
    );
  }),

  // 2. PATCH /submissions/:submissionId (Update metadata/coordinates/note)
  http.patch(SUBMISSION_BY_ID_PATH, async ({ params, request }) => {
    const body = (await request.json().catch(() => ({}))) as any;
    return HttpResponse.json(
      {
        ...mockCreatedSubmission,
        id: params.submissionId,
        submissionId: params.submissionId,
        ...body,
      },
      { status: 200 },
    );
  }),

  // 3. POST /submissions/:submissionId/uploads (Initialize upload session)
  http.post(INITIALIZE_UPLOAD_PATH, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as any;
    return HttpResponse.json(
      {
        ...mockInitializeUploadResponse,
        originalFilename: body.originalFilename ?? mockInitializeUploadResponse.originalFilename,
        mediaType: body.mediaType ?? mockInitializeUploadResponse.mediaType,
        totalChunks: body.totalChunks ?? 1,
        totalSizeBytes: String(body.totalSizeBytes ?? '1048576'),
      },
      { status: 201 },
    );
  }),

  // 4. POST /submissions/uploads/:sessionId/chunks (Upload single chunk)
  http.post(UPLOAD_CHUNK_PATH, async ({ params }) => {
    return HttpResponse.json(
      {
        ...mockUploadChunkResponse,
        sessionId: params.sessionId,
      },
      { status: 200 },
    );
  }),

  // 5. POST /submissions/uploads/:sessionId/complete (Finalize chunks)
  http.post(COMPLETE_UPLOAD_PATH, ({ params }) => {
    return HttpResponse.json(
      {
        ...mockCompleteUploadResponse,
        sessionId: params.sessionId,
      },
      { status: 200 },
    );
  }),

  // 6. GET /submissions/uploads/:sessionId (Inspect upload session)
  http.get(GET_UPLOAD_SESSION_PATH, ({ params }) => {
    return HttpResponse.json(
      {
        ...mockUploadSessionResponse,
        session: {
          ...mockUploadSessionResponse.session,
          id: String(params.sessionId),
        },
      },
      { status: 200 },
    );
  }),

  // 7. POST /submissions/:submissionId/submit (Submit draft to AI pipeline)
  http.post(SUBMIT_SUBMISSION_PATH, ({ params }) => {
    return HttpResponse.json(
      {
        ...mockSubmitSubmissionResponse,
        submissionId: params.submissionId,
      },
      { status: 200 },
    );
  }),

  // 8. GET /submissions/status/:submissionId (Status check)
  http.get(SUBMISSION_STATUS_PATH, ({ params }) => {
    return HttpResponse.json(
      {
        ...mockSubmissionStatusResponse,
        submissionId: String(params.submissionId),
      },
      { status: 200 },
    );
  }),

  // 9. GET /submissions/me/pending (Pending submissions counter)
  http.get(PENDING_SUBMISSIONS_PATH, () => {
    return HttpResponse.json(mockPendingSubmissionsResponse, { status: 200 });
  }),

  // 10. GET /submissions/me/stats (Surveyor stats)
  http.get(SURVEYOR_STATS_PATH, () => {
    return HttpResponse.json(mockSurveyorStatsResponse, { status: 200 });
  }),

  // 11. GET /submissions/me (List submissions)
  http.get(MY_SUBMISSIONS_PATH, () => {
    return HttpResponse.json(
      {
        items: [mockCreatedSubmission],
        page: 1,
        pageSize: 50,
        total: 1,
        totalPages: 1,
      },
      { status: 200 },
    );
  }),

  // 12. GET /spatial/resolve (Reverse geocoding)
  http.get('*/api/v1/spatial/resolve', () => {
    return HttpResponse.json(
      {
        displayAddress: '123 Nguyen Hue, Ben Nghe, District 1, Ho Chi Minh City',
        roadName: 'Nguyen Hue',
        communeCode: '79-01-01',
      },
      { status: 200 },
    );
  }),
];

