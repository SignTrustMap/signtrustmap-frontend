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
        latitude?: number | null;
        longitude?: number | null;
    };
    submissionId: string;
    locationContext?: {
        coordinates?: {
            latitude: number;
            longitude: number;
        };
        displayLocation?: string;
        nearbyRoad?: string | null;
        direction?: number | null;
    };
    latitude?: number | null;
    longitude?: number | null;
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

