import {
    CandidateReportParams,
    CandidateSignDetailsParams,
    MyReviewHistoryParams,
    ReportDto,
    CandidateVoteParams,
    VoteDto,
    CannotIdentifySignReportParams,
    ReviewQueueParams,
} from '@/types/reviewsType';

import { API_PATHS } from '@/api/api';
import { apiRequest, jsonApiRequest } from '@/api/api-client';

export function getMyReviewHistory(
    params: MyReviewHistoryParams,
    accessToken: string,
    signal?: AbortSignal,
) {
    const queryParams = new URLSearchParams({
        page: params.page,
        pageSize: params.pageSize,
        status: params.status,
        search: params.search,
        surveyorId: params.surveyorId,
    });

    return apiRequest(
        `${API_PATHS.REVIEWS}/me/history?${queryParams}`,
        { signal },
        accessToken,
    );
}

export function getCandidateSignDetails(
    params: CandidateSignDetailsParams,
    accessToken: string,
    signal?: AbortSignal,
) {
    return apiRequest(
        `${API_PATHS.REVIEWS}/candidates/${encodeURIComponent(params.candidateId)}`,
        { signal },
        accessToken,
    );
}

export function reportSignCandidate(
    params: CandidateReportParams,
    request: ReportDto,
    accessToken: string,
    signal?: AbortSignal,
) {
    return jsonApiRequest(
        `${API_PATHS.REVIEWS}/candidates/${encodeURIComponent(params.candidateId)}/report`,
        request,
        accessToken,
        signal,
    );
}

export function reportCannotIdentifySign(
    params: CannotIdentifySignReportParams,
    accessToken: string,
    signal?: AbortSignal,
) {
    return apiRequest(
        `${API_PATHS.REVIEWS}/candidates/${encodeURIComponent(params.candidateId)}/can-not-identify`,
        {
            method: 'POST',
            signal,
        },
        accessToken,
    );
}

export function castVoteOnSignCandidate(
    params: CandidateVoteParams,
    request: VoteDto,
    accessToken: string,
    signal?: AbortSignal,
) {
    return jsonApiRequest(
        `${API_PATHS.REVIEWS}/${encodeURIComponent(params.candidateId)}/vote`,
        request,
        accessToken,
        signal,
    );
}

export function undoVoteOnCandidate(
    params: CandidateVoteParams,
    accessToken: string,
    signal?: AbortSignal,
) {
    return jsonApiRequest(
        `${API_PATHS.REVIEWS}/${encodeURIComponent(params.candidateId)}/vote`,
        {},
        accessToken,
        signal,
        'DELETE',
    );
}

export function getReviewQueue(
    params: ReviewQueueParams,
    accessToken: string,
    signal?: AbortSignal,
) {
    const queryParams = new URLSearchParams({
        page: params.page,
        pageSize: params.pageSize,
    });

    return apiRequest(
        `${API_PATHS.REVIEWS}/queue?${queryParams}`,
        { signal },
        accessToken,
    );
}