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
    status: string,
    search: string,
    surveyorId: string,
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

