function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

// The schema leaves these response bodies unspecified. Narrow the fields used
// by the screen rather than casting the entire response to an invented DTO.
export function readSubmissionId(value: unknown): string {
  const body = asRecord(value);
  const id = body?.submissionId ?? body?.id ?? asRecord(body?.submission)?.id;
  if (typeof id !== 'string' || !id.trim()) {
    throw new Error('The server did not return a submission ID.');
  }
  return id;
}

export function readSubmittedStatus(value: unknown): string {
  const body = asRecord(value);
  const submission = asRecord(body?.submission);
  const status = body?.submissionStatus ?? body?.status ?? submission?.status;
  if (typeof status !== 'string') {
    throw new Error('The server did not confirm the submission status.');
  }
  const accepted = ['QUEUED', 'SYNCHRONIZING', 'DETECTING', 'TRACKING', 'ESTIMATING',
    'CLASSIFYING', 'COMPLETED', 'PARTIALLY_PROCESSED', 'NO_SIGN_DETECTED'];
  if (!accepted.includes(status)) {
    const issues = [body?.validationErrors, body?.correctionRequirements,
      submission?.validationErrors, submission?.correctionRequirements]
      .flatMap((items) => Array.isArray(items) ? items : [])
      .map((issue) => asRecord(issue)?.message)
      .filter((message): message is string => typeof message === 'string');
    throw new Error(issues.join(' ') || `Submission needs attention (${status}). Review its details and retry.`);
  }
  return status;
}
