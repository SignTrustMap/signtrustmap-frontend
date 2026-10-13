enum Vote {
    Approve = 1,
    Decline = -1,
}

export type ReportDto = {
    reason: string;
}

export type VoteDto = {
    vote: Vote;
    suggestedSignTypeId?: string | number;
    declineReason?: string;
    declineNote?: string;
}

export type CreateMissingTypeReportDto = {
    candidateId?: string;
    proposedCategoryId?: number;
    proposedName: string;
    description?: string;
    suggestedShape?: string;
    suggestedColorScheme?: string;
}

export type RemedySignDto = {
    id: number;
    signCode: string;
    nameVi: string;
    nameEn: string;
    imageUrl?: string | null;
    description?: string | null;
};

export type SignCategoryDto = {
    id: string;
    code: string;
    nameVi: string;
    nameEn: string;
    description?: string;
    iconUrl?: string;
    sortOrder: number;
}

export type MyReviewHistoryParams = {
    page: string,
    pageSize: string,
    status?: string,
    search?: string,
    surveyorId?: string,
}

export type CandidateSignDetailsParams = {
    candidateId: string,
}

export type CandidateReportParams = {
    candidateId: string,
}

export type CannotIdentifySignReportParams = {
    candidateId: string,
}

export type CandidateVoteParams = {
    candidateId: string,
}

export type ReviewQueueParams = {
    page: string,
    pageSize: string,
}

export type ReviewCandidate = {
    bestFrameUrl?: string;
    createdAt: string;
    id: string;
    predictedSignType?: {
        id: number;
        nameEn: string;
        nameVi: string;
        signCode: string;
    };
    remedySigns?: RemedySignDto[];
    signCropUrl?: string;
    submission?: {
        createdAt?: string;
        surveyorId?: string;
    };
    submissionId: string;
};

export type ReviewQueueResponse = {
    items: ReviewCandidate[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
};

export type MyReviewHistoryResponse = {
    items: {
        candidate: ReviewCandidate;
        candidateId: string;
        declineNote?: string | null;
        declineReason?: string | null;
        reviewedAt: string;
        vote: number;
    }[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
};

export type ReviewerStatsResponse = {
    reviewerId: string;
    reliabilityScore: number;
    totalReviews: number;
    approved: number;
    rejected: number;
    accuracyRate: number;
    currentStreak: number;
};

export type RecaptureReason =
    | 'BLURRY'
    | 'POOR_LIGHTING'
    | 'WRONG_ANGLE'
    | 'OCCLUDED'
    | 'MISSING_CONTEXT'
    | 'OTHER';

export interface SurveyorRecaptureItem {
    request_id: string;
    candidate_id: string;
    reason: RecaptureReason | string;
    note: string | null;
    missing_type_report_id: string | null;
    completed_at: string | null;
    requested_at: string;
    sign_crop_url: string | null;
    best_frame_url: string | null;
    confidence_score: number | null;
    sign_code: string | null;
    name_vi: string | null;
    name_en: string | null;
    longitude: number;
    latitude: number;
}

export interface MyRecapturesResponse {
    items: SurveyorRecaptureItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

