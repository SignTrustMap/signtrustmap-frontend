enum Vote {
    Approve = 1,
    Decline = -1,
}

export type ReportDto = {
    reason: string;
}

export type VoteDto = {
    vote: Vote;
    suggestedSignTypeId?: string;
    declineReason?: string;
    declineNote?: string;
}

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

